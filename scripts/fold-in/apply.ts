/**
 * Write claimed changes into a data checkout (spec 34 technical §6.1). No secrets: it reads the
 * claimed rows from a file and writes a results file that rpc.mjs reports back.
 *
 *   npx tsx scripts/fold-in/apply.ts --data <checkout> --in claimed.json --out results.json [--dry-run]
 *
 * Each change is applied on its own, in review order, and checked; a conflict or failure sets that one
 * aside and the rest continue. Applying twice changes nothing (provenance carries the contribution id).
 * Reverts ("reverting") are undone the same way.
 */
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { applySourcePlant, unapplySourcePlant } from '../../lib/contributions/apply/plants-source';
import { ConflictError, type Change } from '../../lib/contributions/apply/types';
import { derivePlant, type SourcePlant } from '../../lib/plants/derive';
import { ruledOutIn } from '../../lib/digo/ruled-out';

interface ClaimedRow {
  id: string;
  type: Change['type'];
  target_type: string | null;
  target_id: string | null;
  target_path: string | null;
  final_payload: Record<string, unknown>;
  outcome: Change['outcome'];
  region: Change['region'];
  confidence: Change['confidence'];
  base: { value: unknown } | null;
  live_status: string;
  edited: boolean;
}

const args = process.argv.slice(2);
const opt = (n: string) => args[args.indexOf(n) + 1];
const dataDir = opt('--data');
const claimed = JSON.parse(readFileSync(opt('--in'), 'utf-8')) as { nonce: string; rows: ClaimedRow[] };
const dryRun = args.includes('--dry-run');

const plantsPath = join(dataDir, 'content/plants/plants.json');
let plants = JSON.parse(readFileSync(plantsPath, 'utf-8')) as SourcePlant[];

const results = { nonce: claimed.nonce, applied: [] as string[], reverted: [] as string[], conflict: [] as { id: string; error: string }[], failed: [] as { id: string; error: string }[], skipped: [] as string[] };

for (const row of claimed.rows) {
  const change: Change = {
    contribution_id: row.id, type: row.type, target_id: row.target_id ?? '', target_path: row.target_path,
    final_payload: row.final_payload, outcome: row.outcome, region: row.region, confidence: row.confidence,
    edited: row.edited, base: row.base,
  };
  if (row.target_type !== 'plant' || !['plant_name', 'plant_info'].includes(row.type)) {
    // Areas without an applier yet (dictionary, proverbs, translations) wait for their phase.
    results.skipped.push(row.id);
    continue;
  }
  const i = plants.findIndex((p) => p.slug === row.target_id);
  if (i < 0) {
    results.failed.push({ id: row.id, error: `plant ${row.target_id} not found` });
    continue;
  }
  try {
    const reverting = row.live_status === 'reverting';
    const next = reverting ? unapplySourcePlant(plants[i], change) : applySourcePlant(plants[i], change);
    // Check the result before keeping it: it must derive, and Digo text must pass the standards.
    derivePlant(next);
    const digo = row.type === 'plant_name' ? [String(row.final_payload.name)] : row.final_payload.lang === 'dg' ? [String(row.final_payload.text)] : [];
    const ruled = reverting ? [] : digo.flatMap(ruledOutIn);
    if (ruled.length) throw new Error(`ruled-out Digo: ${ruled.map((r) => r.found).join(', ')}`);
    plants = plants.map((p, j) => (j === i ? next : p));
    (reverting ? results.reverted : results.applied).push(row.id);
  } catch (err) {
    // A conflict sends a live change back to its reviewer. A revert has no reviewer step to go back to
    // (it's already off the overlay), so it fails and admins are told.
    if (err instanceof ConflictError && row.live_status !== 'reverting') results.conflict.push({ id: row.id, error: err.message });
    else results.failed.push({ id: row.id, error: String((err as Error).message ?? err).slice(0, 500) });
  }
}

if (!dryRun && (results.applied.length || results.reverted.length)) {
  writeFileSync(plantsPath, JSON.stringify(plants, null, 1));
}
writeFileSync(opt('--out'), JSON.stringify(results, null, 2));
console.log(`applied ${results.applied.length}, reverted ${results.reverted.length}, conflicts ${results.conflict.length}, failed ${results.failed.length}, skipped ${results.skipped.length}${dryRun ? ' (dry run)' : ''}`);
