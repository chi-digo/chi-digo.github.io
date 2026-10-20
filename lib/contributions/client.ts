'use client';

/**
 * Browser helpers for contributions (spec 34 technical §3): the caller's standing, submitting,
 * agreeing and reporting, drafts that survive sign-in, and online state.
 */
import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { useAuth } from '@/lib/auth/context';
import type { ContributionType, Region, ReviewScope, Role, Scope, TargetType } from './schemas';

export interface ContributorStatus {
  role: Role;
  scopes: ReviewScope[];
  blocked: boolean;
  accepted: number;
  accepted_by_scope: Record<Scope, number>;
  can_apply_for: Scope[];
  application: { id: string; status: 'pending' | 'approved' | 'declined'; scopes: string[]; decision_note: string | null } | null;
  unread: number;
  /** Items waiting in the caller's review scopes (reviewers and admins). */
  review_pending: number;
}

/* One store for every component (menu dot, review link, My contributions), so a refresh anywhere updates all. */
const statusStore = {
  userId: null as string | null,
  value: null as ContributorStatus | null,
  loading: false,
  listeners: new Set<() => void>(),
};

function emit() {
  statusStore.listeners.forEach((l) => l());
}

/**
 * Load the caller's status. A failed call is retried: at page load the browser and the server can
 * race to refresh the same session, and the loser briefly gets 401.
 */
let statusRequest = 0;

function fetchStatus(userId: string, attempt = 0) {
  // Only the newest request may write, so a slow older answer can't bring back a stale count.
  const request = ++statusRequest;
  statusStore.loading = true;
  fetch('/api/contributions/me')
    .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
    .then((s: ContributorStatus) => {
      if (statusStore.userId !== userId || request !== statusRequest) return;
      statusStore.loading = false;
      statusStore.value = s;
      emit();
    })
    .catch((status: unknown) => {
      if (statusStore.userId !== userId || request !== statusRequest) return;
      // 403/404 won't change by retrying; a 401 gets one retry (the session-refresh race).
      const max = status === 401 ? 1 : status === 403 || status === 404 ? 0 : 3;
      if (attempt < max) setTimeout(() => fetchStatus(userId, attempt + 1), 800 * (attempt + 1));
      else statusStore.loading = false;
    });
}

function subscribeStatus(cb: () => void) {
  statusStore.listeners.add(cb);
  return () => {
    statusStore.listeners.delete(cb);
  };
}

/** Role, scopes and unread count for the signed-in user, shared by every component; null when signed out. */
export function useContributorStatus(): { status: ContributorStatus | null; refresh: () => void } {
  const { user, session } = useAuth();
  const value = useSyncExternalStore(subscribeStatus, () => statusStore.value, () => null);

  useEffect(() => {
    if (!user) {
      if (statusStore.userId !== null) {
        statusStore.userId = null;
        statusStore.value = null;
        emit();
      }
      return;
    }
    if (statusStore.userId !== user.id) {
      statusStore.userId = user.id;
      statusStore.value = null;
      fetchStatus(user.id);
    } else if (!statusStore.value && !statusStore.loading) {
      // A refreshed session after a failed load: try again.
      fetchStatus(user.id);
    }
  }, [user, session?.access_token]);

  const refresh = useCallback(() => {
    if (statusStore.userId) fetchStatus(statusStore.userId);
  }, []);
  return { status: user && statusStore.userId === user.id ? value : null, refresh };
}

export interface Target {
  target_type?: TargetType;
  target_id?: string;
}

export interface SubmitBody extends Target {
  type: ContributionType;
  payload: Record<string, unknown>;
  locale: string;
  note?: string;
  region?: Region;
  village?: string;
  confidence?: 'native' | 'heard' | 'unsure';
  credit_opt_in: boolean;
  force_new?: boolean;
}

export type SubmitResult =
  | { ok: true; id: string; held: boolean }
  | { ok: true; similar: { id?: string; name: string; href?: string } }
  | { ok: false; error: string };

async function post(path: string, method: string, body?: unknown) {
  try {
    const res = await fetch(path, {
      method,
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    return { status: res.status, data };
  } catch {
    return { status: 0, data: { error: 'network' } };
  }
}

export async function submitContribution(body: SubmitBody): Promise<SubmitResult> {
  const { status, data } = await post('/api/contributions', 'POST', { ...body, page_path: window.location.pathname });
  if (status === 200 && data.similar) return { ok: true, similar: data.similar };
  if (status === 201) return { ok: true, id: data.id, held: !!data.held };
  if (status === 0) return { ok: false, error: 'network' };
  if (status === 401) return { ok: false, error: 'unauthorized' };
  return { ok: false, error: status === 400 ? 'invalid' : data.error ?? 'generic' };
}

export async function agree(id: string, on: boolean, extra?: { region?: Region; confidence?: string }) {
  return post(`/api/contributions/${id}/agree`, on ? 'POST' : 'DELETE', on ? extra ?? {} : undefined);
}

export async function report(id: string, reason: 'offensive' | 'spam' | 'personal_info' | 'other') {
  return post(`/api/contributions/${id}/report`, 'POST', { reason });
}

/* ===== Drafts that survive the sign-in round trip ===== */

const DRAFT_TTL = 60 * 60 * 1000;
const RESUME_KEY = 'contrib-resume';

function readStore<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const { at, value } = JSON.parse(raw);
    if (Date.now() - at > DRAFT_TTL) {
      localStorage.removeItem(key);
      return null;
    }
    return value as T;
  } catch {
    return null;
  }
}

function writeStore(key: string, value: unknown) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify({ at: Date.now(), value }));
  } catch {
    /* storage unavailable: the draft just isn't kept */
  }
}

/** Form state kept in the browser for an hour, so a sign-in or dropped connection loses nothing. */
export function useContributionDraft<T extends object>(key: string, initial: T): [T, (patch: Partial<T>) => void, () => void] {
  const { user } = useAuth();
  // Drafts belong to one person, so a shared phone never shows someone else's text. A draft typed
  // while signed out moves to the account that signs in (the sign-in-on-submit round trip).
  const storeKey = `contrib-draft:${user?.id ?? 'anon'}:${key}`;
  // Forms mount when opened, so the saved draft is read once, on mount.
  const [state, setState] = useState<T>(() => {
    const own = readStore<T>(storeKey);
    const anonKey = `contrib-draft:anon:${key}`;
    const carried = !own && user ? readStore<T>(anonKey) : null;
    if (carried) {
      writeStore(storeKey, carried);
      writeStore(anonKey, null);
    }
    return { ...initial, ...(own ?? carried ?? {}) };
  });
  const update = useCallback(
    (patch: Partial<T>) =>
      setState((prev) => {
        const next = { ...prev, ...patch };
        writeStore(storeKey, next);
        return next;
      }),
    [storeKey],
  );
  const clear = useCallback(() => {
    writeStore(storeKey, null);
    setState(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeKey]);
  return [state, update, clear];
}

export interface ResumeIntent { form: string; target_id: string; extra?: Record<string, string> }

/** Remember which form to reopen after signing in. */
export function setResumeIntent(intent: ResumeIntent | null) {
  writeStore(RESUME_KEY, intent);
}

/** The form to reopen on this page after sign-in, if any (read once, then cleared). */
export function takeResumeIntent(targetId: string): ResumeIntent | null {
  const intent = readStore<ResumeIntent>(RESUME_KEY);
  if (!intent || intent.target_id !== targetId) return null;
  writeStore(RESUME_KEY, null);
  return intent;
}

/* ===== Online state and layout ===== */

function subscribeOnline(cb: () => void) {
  window.addEventListener('online', cb);
  window.addEventListener('offline', cb);
  return () => {
    window.removeEventListener('online', cb);
    window.removeEventListener('offline', cb);
  };
}

export function useOnline(): boolean {
  return useSyncExternalStore(subscribeOnline, () => navigator.onLine, () => true);
}

const NARROW = '(max-width: 640px)';
function subscribeNarrow(cb: () => void) {
  const mq = window.matchMedia(NARROW);
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
}

/** Phone layout, decided before the first paint so the dialog never swaps for a bottom sheet. */
export function useIsNarrow(): boolean {
  return useSyncExternalStore(subscribeNarrow, () => window.matchMedia(NARROW).matches, () => false);
}

/** Look up a message by a computed key (status_*, type_*, region_*), falling back to the key. */
export function msg(messages: Record<string, string>, key: string): string {
  return messages[key] ?? key;
}
