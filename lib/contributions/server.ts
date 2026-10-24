/**
 * Server helpers for the contributions API (spec 34 technical §3–4): who is calling, the database
 * functions every write goes through, and cache revalidation. Writes use the service role; RLS
 * stays read-only for clients.
 */
import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import * as Sentry from '@sentry/nextjs';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import type { ReviewScope, Role, Scope } from './schemas';

export interface Caller {
  id: string;
  email: string | null;
  role: Role;
  scopes: ReviewScope[];
  blocked: boolean;
  /** Set only by the admin API for automated flow-test accounts. */
  isTest: boolean;
  /** The translation languages an admin has marked this reviewer as reading (spec 34 §17, decision 5). */
  languages: ('sw' | 'dg')[];
  db: SupabaseClient;
}

/** The signed-in caller with role, scopes and block state, or a 401 response. */
export async function getCaller(): Promise<Caller | NextResponse> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const db = createServiceClient();
  const [{ data: profile }, { data: scopes }, { data: languages }] = await Promise.all([
    db.from('profiles').select('role, deleted_at, blocked_at').eq('id', user.id).single(),
    db.from('profile_review_scopes').select('scope').eq('user_id', user.id),
    db.from('profile_review_languages').select('lang').eq('user_id', user.id),
  ]);
  if (!profile || profile.deleted_at) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  return {
    id: user.id,
    email: user.email ?? null,
    role: profile.role as Role,
    scopes: (scopes ?? []).map((s) => s.scope as ReviewScope),
    blocked: !!profile.blocked_at,
    isTest: user.app_metadata?.test === true,
    languages: (languages ?? []).map((l) => l.lang as 'sw' | 'dg'),
    db,
  };
}

/**
 * Whether the caller may review this row's language: a Swahili or Digo translation fix goes only to
 * reviewers marked as reading it (admins read all). The database enforces the same rule.
 */
export function readsLanguage(caller: Caller, row: { type: string; payload?: Record<string, unknown> | null }): boolean {
  // Section corrections on Swahili and Digo pages are translations too (owner decision 3).
  if ((row.type !== 'translation_fix' && row.type !== 'plant_info') || caller.role === 'admin') return true;
  const lang = row.payload?.lang;
  return lang !== 'sw' && lang !== 'dg' ? true : caller.languages.includes(lang);
}

export function canReview(caller: Caller, scope: Scope): boolean {
  if (caller.blocked) return false;
  if (caller.role === 'admin') return true;
  return caller.role === 'reviewer' && (caller.scopes.includes('all') || caller.scopes.includes(scope));
}

export function isReviewer(caller: Caller): boolean {
  return !caller.blocked && (caller.role === 'admin' || caller.role === 'reviewer');
}

const STATUS: Record<string, number> = {
  unauthorized: 401,
  blocked: 403,
  forbidden: 403,
  self_review: 403,
  own: 403,
  not_found: 404,
  conflict: 409,
  limit_day: 429,
  limit_target: 429,
  limit_agree: 429,
  limit_report: 429,
  rate_cap: 429,
  limit_words: 429,
  limit_proverbs: 429,
  pii: 422,
  has_dependants: 409,
};

/** Map a `{error: code}` from a database function to an HTTP response. */
export function rpcError(code: string) {
  return NextResponse.json({ error: code }, { status: STATUS[code] ?? 400 });
}

export function badRequest(message: string, details?: unknown) {
  return NextResponse.json({ error: message, details }, { status: 400 });
}

export function forbidden(code = 'forbidden') {
  return NextResponse.json({ error: code }, { status: 403 });
}

/** Report an unexpected failure and answer 500 without leaking details. */
export function serverError(err: unknown, context: string) {
  Sentry.captureException(err, { tags: { feature: 'contributions', context } });
  return NextResponse.json({ error: 'server_error' }, { status: 500 });
}

/** Call a database function and unwrap its jsonb result. */
export async function rpc<T = Record<string, unknown>>(db: SupabaseClient, fn: string, args: Record<string, unknown>): Promise<T> {
  const { data, error } = await db.rpc(fn, args);
  if (error) throw new Error(`${fn}: ${error.message}`);
  return data as T;
}

/** Areas whose overlay a target type belongs to. */
export function overlayArea(targetType: string | null | undefined): string | null {
  if (targetType === 'plant' || targetType === 'glossary') return 'plant';
  if (targetType === 'word') return 'word';
  if (targetType === 'proverb') return 'proverb';
  return null;
}

/** Make the next overlay request fresh after an accept, revert or pause change. */
export function refreshOverlay(area?: string | null) {
  revalidateTag(area ? `overlay:${area}` : 'overlay', { expire: 0 });
}

/** Append to the audit log, with a snapshot of who acted so the entry survives their deletion. */
export async function logEvent(
  caller: Caller,
  event: { action: string; contribution_id?: string; subject_user_id?: string; details?: Record<string, unknown> },
) {
  const { data: me } = await caller.db.from('profiles').select('first_name, role').eq('id', caller.id).maybeSingle();
  const { error } = await caller.db.from('contribution_events').insert({
    actor_id: caller.id,
    action: event.action,
    contribution_id: event.contribution_id ?? null,
    subject_user_id: event.subject_user_id ?? null,
    details: { ...(event.details ?? {}), actor_first_name: me?.first_name ?? null, actor_role: me?.role ?? null },
    is_test: caller.isTest,
  });
  if (error) Sentry.captureException(new Error(`contribution_events insert: ${error.message}`), { tags: { feature: 'contributions' } });
}

export function refreshCredits() {
  revalidateTag('credits', { expire: 0 });
}
