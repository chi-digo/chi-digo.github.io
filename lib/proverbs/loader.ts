import * as Sentry from '@sentry/nextjs';
import type { Proverb } from './types';
import { ensureFreshData } from '@/lib/pwa/data-version';
import { applyAllToProverbs, proverbAdditionEntry, type ProverbEntry } from '@/lib/contributions/apply/proverbs';
import type { Change, ConflictError } from '@/lib/contributions/apply/types';
import { TEST_TARGET } from '@/lib/contributions/schemas';

const cache = new Map<string, unknown>();

const DIGO_PREFIXES = [
  'gbw', 'kpw', 'ndz', "ng'", 'ch', 'dz', "m'", 'ng', 'ph', 'sh', 'ts',
  'a', 'b', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm',
  'n', 'o', 'p', 'r', 's', 't', 'u', 'v', 'w', 'y', 'z',
];

function digoLetterKey(text: string): string {
  const lc = text.toLowerCase().trim();
  for (const prefix of DIGO_PREFIXES) {
    if (lc.startsWith(prefix)) {
      return prefix.replace(/'/g, '_');
    }
  }
  return lc.charAt(0);
}

async function fetchJson<T>(path: string): Promise<T> {
  const cached = cache.get(path);
  if (cached) return cached as T;

  await ensureFreshData();
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
  const data: T = await res.json();
  cache.set(path, data);
  return data;
}

/* ===== Community overlay (spec 34 §16): accepted changes not yet in the data file ===== */

let overlay: Promise<Change[]> | null = null;
let merged: Promise<Proverb[]> | null = null;

/** Accepted proverb changes, fetched once per page load. Offline or failing: no changes. */
export function proverbOverlay(): Promise<Change[]> {
  if (!overlay) {
    overlay = fetch('/api/overlay/proverb')
      .then((r) => (r.ok ? r.json() : { changes: [] }))
      .then((d: { changes?: Change[] }) => d.changes ?? [])
      .catch(() => {
        overlay = null;
        return [];
      });
  }
  return overlay;
}

/** Forget the overlay, e.g. right after a reviewer accepts or reverts a change. */
export function refreshProverbOverlay() {
  overlay = null;
  merged = null;
}

function reportConflict(e: ConflictError) {
  Sentry.captureMessage(e.message, { level: 'warning', tags: { feature: 'contributions', area: 'proverb_overlay' } });
}

/**
 * The shipped proverbs with the overlay applied, and new community proverbs (provisional) after them.
 * Test changes never reach readers; a new proverb already folded in (its provenance is shipped) is skipped.
 */
export function mergeProverbs(shipped: Proverb[], all: Change[]): Proverb[] {
  // Test new proverbs never reach readers. Test edits target the fixture proverb (__test__), which exists
  // only while the UI test runs, so they can't touch a real proverb.
  const changes = all.filter((c) => !(c.type === 'proverb_addition' && (c.target_id === TEST_TARGET || c.final_payload?.digo === TEST_TARGET)));
  if (!changes.length) return shipped;
  const list = applyAllToProverbs(shipped as ProverbEntry[], changes, reportConflict);
  const folded = new Set(list.flatMap((p) => Object.values(p.provenance ?? {}).flatMap((l) => l.map((x) => x.c))));
  const added = changes
    .filter((c) => c.type === 'proverb_addition' && !folded.has(c.contribution_id))
    .map((c) => proverbAdditionEntry(c));
  return added.length ? [...list, ...added] : list;
}

export async function loadProverbs(): Promise<Proverb[]> {
  if (!merged) {
    merged = Promise.all([fetchJson<Proverb[]>('/data/proverbs/index.json'), proverbOverlay()]).then(([shipped, changes]) => mergeProverbs(shipped, changes));
    merged.catch(() => {
      merged = null;
    });
  }
  return merged;
}

/** A provisional proverb whose fold-in has shipped: the real proverb carrying its provenance. */
export async function foldedProverbFor(provisionalSlug: string): Promise<Proverb | null> {
  const m = /^p-c-([0-9a-f]{8})$/.exec(provisionalSlug);
  if (!m) return null;
  const shipped = await fetchJson<Proverb[]>('/data/proverbs/index.json');
  return (shipped as ProverbEntry[]).find((p) =>
    // Only the change that created the proverb, never a later edit on it.
    (p.provenance?.proverb ?? []).some((x) => x.c.replace(/-/g, '').startsWith(m[1]))) ?? null;
}

export async function getProverbById(id: string): Promise<Proverb | null> {
  const proverbs = await loadProverbs();
  return proverbs.find((p) => p.id === id) ?? null;
}

export async function getProverbBySlug(slug: string): Promise<Proverb | null> {
  const proverbs = await loadProverbs();
  return proverbs.find((p) => p.slug === slug) ?? null;
}

export async function getProverbsByTheme(theme: string): Promise<Proverb[]> {
  const proverbs = await loadProverbs();
  return proverbs.filter((p) => p.themes.includes(theme));
}

export async function getProverbsByLetter(letter: string): Promise<Proverb[]> {
  const proverbs = await loadProverbs();
  const target = digoLetterKey(letter);
  return proverbs.filter((p) => {
    const key = digoLetterKey(p.digo);
    return key === target;
  });
}

export async function getAllThemeCounts(): Promise<Record<string, number>> {
  const proverbs = await loadProverbs();
  const counts: Record<string, number> = {};
  for (const p of proverbs) {
    for (const theme of p.themes) {
      counts[theme] = (counts[theme] || 0) + 1;
    }
  }
  return counts;
}

export function clearCache(): void {
  cache.clear();
  refreshProverbOverlay();
}
