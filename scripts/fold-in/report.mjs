#!/usr/bin/env node
/**
 * Report a fold-in run's outcome per contribution (spec 34 technical §6.1):
 *   merged into preview  -> in_preview (with the PR number)
 *   conflict             -> back to the reviewer ("changed since suggested")
 *   failed               -> failed, with the error, and admins are notified
 *   already in preview      -> in_preview (no PR: nothing needed committing)
 *   not merged / skipped -> released, to be claimed again later
 *
 *   node report.mjs <results.json> <pr|-> <merged:true|false|nochange>
 */
import { readFileSync, existsSync } from 'fs';
import { execFileSync } from 'child_process';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const [, , resultsPath, pr, merged] = process.argv;
if (!existsSync(resultsPath)) {
  console.log('no results: nothing to report');
  process.exit(0);
}
const r = JSON.parse(readFileSync(resultsPath, 'utf-8'));
const rpc = join(dirname(fileURLToPath(import.meta.url)), 'rpc.mjs');
const mark = (state, ids, extra = []) => {
  if (!ids.length) return;
  execFileSync('node', [rpc, 'mark', state, r.nonce, ids.join(','), ...extra], { stdio: 'inherit' });
};

const changed = [...r.applied, ...r.reverted];
if (merged === 'true' && pr !== '-') mark('in_preview', changed, [pr]);
// Nothing to commit: the changes are already in preview (e.g. an earlier run merged but didn't report).
// Move them on so fold-confirm can finish them, instead of claiming them forever.
else if (merged === 'nochange') mark('in_preview', changed);
else mark('release', changed);
for (const c of r.conflict) mark('conflict', [c.id], ['-', '-', c.error]);
for (const f of r.failed) mark('failed', [f.id], ['-', '-', f.error]);
// Failures need a person: tell the admins (in-app), once per run.
if (r.failed.length) {
  execFileSync('node', [rpc, 'mark', 'fold_failed', '-', '', '-', '-', `${r.failed.length} change(s) could not be folded in: ${r.failed.map((f) => f.error).join('; ')}`], { stdio: 'inherit' });
}
mark('release', r.skipped);
