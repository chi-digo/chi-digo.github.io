/**
 * The change an applier receives: an accepted contribution as the overlay and fold-in see it
 * (no user data). `base` is the target text when the suggestion was made (spec 34 technical §5).
 */
import type { ContributionType, Region, Confidence } from '../schemas';

export interface Change {
  contribution_id: string;
  type: ContributionType;
  /** Which kind of item the change is on (plant and glossary share an overlay area). */
  target_type?: string | null;
  target_id: string;
  target_path?: string | null;
  final_payload: Record<string, unknown>;
  outcome: 'replace' | 'variant' | null;
  region?: Region | null;
  confidence?: Confidence | null;
  /** True when the reviewer edited the suggestion before accepting. */
  edited?: boolean;
  base?: { value: unknown; hash?: string } | null;
}

/** One provenance record per community change to a field. */
export interface ProvenanceEntry {
  c: string;
  src: 'community';
  conf: Confidence | null;
  edited: boolean;
  /** A story's paragraph count (proverb context), so each story is credited where it sits. */
  paras?: number;
  /** A translation fix: credited once at the foot of the page, not under the block (§17 decision 6). */
  kind?: 'translation';
}

export type Provenance = Record<string, ProvenanceEntry[]>;

/** The target no longer holds the text the suggestion was made against. */
export class ConflictError extends Error {
  constructor(public contributionId: string, public path: string) {
    super(`Contribution ${contributionId} conflicts at ${path}: the target changed since it was suggested`);
    this.name = 'ConflictError';
  }
}

export function hasChange(provenance: Provenance | undefined, id: string): boolean {
  if (!provenance) return false;
  return Object.values(provenance).some((list) => list.some((e) => e.c === id));
}

export function withProvenance(provenance: Provenance | undefined, path: string, change: Change): Provenance {
  const entry: ProvenanceEntry = {
    c: change.contribution_id, src: 'community', conf: change.confidence ?? null, edited: !!change.edited,
    ...(change.type === 'translation_fix' && { kind: 'translation' as const }),
  };
  return { ...(provenance ?? {}), [path]: [...(provenance?.[path] ?? []), entry] };
}

export function withoutProvenance(provenance: Provenance | undefined, id: string): Provenance | undefined {
  if (!provenance) return provenance;
  const out: Provenance = {};
  for (const [path, list] of Object.entries(provenance)) {
    const kept = list.filter((e) => e.c !== id);
    if (kept.length) out[path] = kept;
  }
  return Object.keys(out).length ? out : undefined;
}
