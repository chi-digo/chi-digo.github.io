/**
 * After a production deploy (spec 34 technical §6.2): mark changes folded once their provenance is in
 * the deployed files, and reverts reverted once it's gone. Then refresh the site's overlay cache.
 *
 *   npx tsx scripts/fold-in/confirm.ts --data <deployed checkout> --rows rows.json --sha <sha>
 * Prints two id lists for rpc.mjs: "folded=<ids>" and "reverted=<ids>".
 */
import { readFileSync, existsSync, appendFileSync } from 'fs';
import { join } from 'path';

const args = process.argv.slice(2);
const opt = (n: string) => args[args.indexOf(n) + 1];
const { rows } = JSON.parse(readFileSync(opt('--rows'), 'utf-8')) as {
  rows: { id: string; live_status: string; type: string; target_type: string; target_id: string }[];
};

const folded: string[] = [];
const reverted: string[] = [];
for (const r of rows) {
  if (r.target_type !== 'plant') continue;
  const file = join(opt('--data'), 'public/data/plants/p', `${r.target_id}.json`);
  if (!existsSync(file)) continue;
  const provenance = JSON.parse(readFileSync(file, 'utf-8')).provenance ?? {};
  const present = Object.values(provenance).some((list) => (list as { c: string }[]).some((e) => e.c === r.id));
  if (r.live_status === 'reverting' ? !present : present) (r.live_status === 'reverting' ? reverted : folded).push(r.id);
}
const lines = `folded=${folded.join(',')}\nreverted=${reverted.join(',')}\n`;
if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, lines);
console.log(lines.trim());
