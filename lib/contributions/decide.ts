/**
 * The checks an accept must pass before the database is asked, shared by the single-item review route and
 * bulk review (spec 34 §19.1), so both refuse exactly the same things. Server only.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import { PAYLOADS, TEST_TARGET, type ContributionType } from './schemas';
import { resolveTarget, loadWord, testWord } from './targets';
import { applyAllToEntries, nextSenseId } from './apply/words';
import { COMMENTARY_MAX } from './apply/proverbs';
import type { Change } from './apply/types';
import { warningsFor, needsSecondReview, variantRequired, targetChanged, blocksOnPII, fixProblem, type ReviewRow } from './review';

export interface Refusal { error: string; status: number; extra?: Record<string, unknown> }

/**
 * For an add_sense: the lowest sense id it may take, past the shipped senses and the live new ones. The
 * database allocates the final id under a lock. '' for other changes; null if the entry is gone.
 */
export async function minimumSensePath(row: { type: string; payload: Record<string, unknown>; target_id: string | null; is_test: boolean }, liveChanges: Change[]) {
  if (row.type !== 'definition_update' || row.payload.mode !== 'add_sense' || !row.target_id) return '';
  const raw = row.target_id === TEST_TARGET ? (row.is_test ? testWord() : null) : loadWord(row.target_id);
  if (!raw) return null;
  const [entry] = applyAllToEntries([raw], liveChanges);
  const pending = liveChanges.filter((c) => c.target_id === row.target_id && c.type === 'definition_update').map((c) => c.target_path);
  return `senses.${nextSenseId(entry, pending)}`;
}

/** The arguments for an accept, or why it is refused. `liveChanges` is the area's accepted, live changes. */
export async function acceptArgs(
  db: SupabaseClient,
  row: ReviewRow & { id: string; type: string; payload: Record<string, unknown>; target_type: string | null; target_id: string | null; target_path: string | null; base: { value: unknown } | null; is_test: boolean },
  body: { action: 'accept' | 'accept_variant'; final_payload?: Record<string, unknown>; merge_ids?: string[] },
  liveChanges: Change[],
): Promise<{ args: Record<string, unknown> } | Refusal> {
  const final = PAYLOADS[row.type as ContributionType].safeParse(body.final_payload ?? row.payload);
  if (!final.success) return { error: 'invalid', status: 400, extra: { details: final.error.issues } };
  const finalPayload = final.data as Record<string, unknown>;

  const { ruled_out, pii } = warningsFor(row.type, finalPayload);
  if (ruled_out.length) return { error: 'ruled_out', status: 422, extra: { hits: ruled_out } };
  if (pii && blocksOnPII(row.type as ContributionType)) return { error: 'pii', status: 422 };
  if (row.type === 'translation_fix') {
    const problem = fixProblem(row, finalPayload);
    if (problem) return { error: problem, status: 422 };
  }
  // A new proverb is published only once a reviewer has decided whether it is for adults (spec 34 §16.9):
  // the reviewer's own final payload must say so; the contributor's checkbox is only a hint.
  if (row.type === 'proverb_addition' && typeof body.final_payload?.mature !== 'boolean') return { error: 'mature_required', status: 422 };

  if (targetChanged(row, liveChanges)) return { error: 'target_changed', status: 409 };
  // A story may not push its commentary past the cap (it would only conflict at fold-in).
  if (row.type === 'proverb_context') {
    const now = resolveTarget(row.type, 'proverb', row.target_id ?? undefined, finalPayload, { isTest: row.is_test, liveChanges });
    const cur = (now?.base?.value as { text?: string } | undefined)?.text ?? '';
    if ((cur ? cur.length + 2 : 0) + String(finalPayload.text ?? '').length > COMMENTARY_MAX) return { error: 'too_long', status: 422 };
  }
  if (body.action === 'accept' && (await variantRequired(db, row, liveChanges))) return { error: 'variant_required', status: 422 };
  const args: Record<string, unknown> = {
    final_payload: finalPayload,
    needs_second: needsSecondReview(row, finalPayload, liveChanges),
    ...(body.merge_ids && { merge_ids: body.merge_ids }),
  };
  const minimum = await minimumSensePath(row, liveChanges);
  if (minimum === null) return { error: 'target_not_found', status: 404 };
  if (minimum) args.target_path = minimum;
  return { args };
}
