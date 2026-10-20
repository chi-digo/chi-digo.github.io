/**
 * Review rules the API applies before a decision reaches the database (spec 34 technical §4.2):
 * Digo checks, when a second reviewer is needed, and when an accept must be a regional variant.
 */
import { createHash } from 'crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import { ruledOutIn } from '@/lib/digo/ruled-out';
import { hasPII, stableStringify } from './text';
import { loadPlant, resolveTarget, headwordExists } from './targets';
import { applyAllToPlant } from './apply/plants';
import type { Change } from './apply/types';
import type { ContributionType, TargetType } from './schemas';

export interface ReviewRow {
  id: string;
  type: ContributionType;
  target_type: TargetType | null;
  target_id: string | null;
  payload: Record<string, unknown>;
  region: string | null;
  base: { value: unknown; hash?: string } | null;
  is_test: boolean;
}

/** The Digo text in a payload, which the ruled-out forms apply to. */
export function digoText(type: ContributionType, payload: Record<string, unknown>): string[] {
  const p = payload as Record<string, string | undefined>;
  if (type === 'plant_name') return [p.name, p.other_names].filter((x): x is string => !!x);
  if (type === 'word_addition') return [p.headword, p.definition_dg, p.example_dg].filter((x): x is string => !!x);
  if (type === 'example_sentence') return p.dg ? [p.dg] : [];
  if (type === 'spelling_variant') return p.form ? [p.form] : [];
  if (type === 'plant_info' || type === 'translation_fix' || type === 'definition_update' || type === 'proverb_meaning') {
    const lang = p.lang;
    const text = type === 'translation_fix' ? p.proposed : p.text;
    return lang === 'dg' && text ? [text] : [];
  }
  return [];
}

export function warningsFor(type: ContributionType, payload: Record<string, unknown>) {
  const ruled = digoText(type, payload).flatMap((t) => ruledOutIn(t));
  const text = Object.values(payload).filter((v): v is string => typeof v === 'string');
  return { ruled_out: ruled, pii: text.some(hasPII) };
}

/** Whether the target has changed since the suggestion was made (base no longer matches). */
export function targetChanged(row: ReviewRow, liveChanges: Change[]): boolean {
  if (!row.base || (row.target_type !== 'plant' && row.target_type !== 'word') || !row.target_id) return false;
  const now = resolveTarget(row.type, row.target_type, row.target_id, row.payload, { isTest: row.is_test, liveChanges });
  if (!now?.base) return false;
  const hash = row.base.hash ?? createHash('sha256').update(stableStringify(row.base.value ?? null)).digest('hex');
  return now.base.hash !== hash;
}

/** Characters changed between the common prefix and suffix: a cheap upper bound on the edit size. */
export function changedChars(before: string, after: string): number {
  let start = 0;
  while (start < before.length && start < after.length && before[start] === after[start]) start++;
  let end = 0;
  while (end < before.length - start && end < after.length - start && before[before.length - 1 - end] === after[after.length - 1 - end]) end++;
  return Math.max(before.length - start - end, after.length - start - end);
}

/** Second-review rules (product spec §3). */
export function needsSecondReview(row: ReviewRow, finalPayload: Record<string, unknown>, liveChanges: Change[]): boolean {
  if (row.type === 'translation_fix' && row.target_type === 'ui') return true;
  if (row.type === 'plant_name' && row.target_type === 'plant' && row.target_id) {
    const plant = loadPlant(row.target_id);
    const effective = plant ? applyAllToPlant(plant, liveChanges) : null;
    if (effective?.name_status === 'conflict') return true;
  }
  if (row.type === 'plant_info' && finalPayload.mode === 'replace' && typeof row.base?.value === 'string') {
    return changedChars(row.base.value, String(finalPayload.text ?? '')) > 300;
  }
  if (row.type === 'definition_update' && finalPayload.mode === 'replace') {
    const before = (row.base?.value as { text?: string } | null)?.text ?? '';
    return changedChars(before, String(finalPayload.text ?? '')) > 300;
  }
  // A new word whose headword already exists becomes a homonym: two voices decide that.
  if (row.type === 'word_addition') return headwordExists(String(finalPayload.headword ?? ''));
  return false;
}

/**
 * A replacement must become a regional variant when the form it replaces came from a speaker in
 * another region (product spec §8.3). Forms from the original sources have no recorded region.
 */
export async function variantRequired(db: SupabaseClient, row: ReviewRow, liveChanges: Change[]): Promise<boolean> {
  if (row.type !== 'plant_name' || !row.target_id || !row.region) return false;
  const plant = loadPlant(row.target_id);
  if (!plant) return false;
  const effective = applyAllToPlant(plant, liveChanges);
  const entries = effective.provenance?.digo_headword ?? [];
  const last = entries[entries.length - 1];
  if (!last) return false;
  const { data } = await db.from('contributions').select('region').eq('id', last.c).maybeSingle();
  return !!data?.region && data.region !== row.region;
}
