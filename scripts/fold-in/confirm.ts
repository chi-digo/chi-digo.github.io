/**
 * After a production deploy (spec 34 technical §6.2): mark changes folded once their provenance is in
 * the deployed files, and reverts reverted once it's gone. Then refresh the site's overlay cache.
 *
 *   npx tsx scripts/fold-in/confirm.ts --data <deployed checkout> --rows rows.json --sha <sha>
 * Prints two id lists for rpc.mjs: "folded=<ids>" and "reverted=<ids>".
 */
import { readFileSync, existsSync, appendFileSync, readdirSync } from 'fs';
import { join } from 'path';

const args = process.argv.slice(2);
const opt = (n: string) => args[args.indexOf(n) + 1];
const { rows } = JSON.parse(readFileSync(opt('--rows'), 'utf-8')) as {
  rows: { id: string; live_status: string; type: string; target_type: string; target_id: string }[];
};

const folded: string[] = [];
const reverted: string[] = [];

// Every contribution id in the deployed dictionary's provenance (a new word is found by its id, not its target).
let wordIds: Set<string> | null = null;
function dictionaryIds(): Set<string> {
  if (wordIds) return wordIds;
  wordIds = new Set();
  const dir = join(opt('--data'), 'public/data');
  for (const f of readdirSync(dir)) {
    if (!f.endsWith('.json') || f.endsWith('.idx.json')) continue;
    const d = JSON.parse(readFileSync(join(dir, f), 'utf-8'));
    if (!Array.isArray(d?.entries)) continue;
    for (const e of d.entries) for (const list of Object.values(e.provenance ?? {})) for (const p of list as { c: string }[]) wordIds.add(p.c);
  }
  return wordIds;
}

let proverbIds: Set<string> | null = null;
function proverbProvenance(): Set<string> {
  if (proverbIds) return proverbIds;
  proverbIds = new Set();
  const list = JSON.parse(readFileSync(join(opt('--data'), 'public/data/proverbs/index.json'), 'utf-8')) as { provenance?: Record<string, { c: string }[]> }[];
  for (const p of list) for (const l of Object.values(p.provenance ?? {})) for (const x of l) proverbIds.add(x.c);
  return proverbIds;
}

for (const r of rows) {
  if (r.target_type === 'proverb') {
    const present = proverbProvenance().has(r.id);
    if (r.live_status === 'reverting' ? !present : present) (r.live_status === 'reverting' ? reverted : folded).push(r.id);
    continue;
  }
  if (r.target_type === 'word') {
    const present = dictionaryIds().has(r.id);
    if (r.live_status === 'reverting' ? !present : present) (r.live_status === 'reverting' ? reverted : folded).push(r.id);
    continue;
  }
  if (r.target_type === 'ui') {
    // Interface strings (spec 34 §17.12): the deployed message file holds the fix, or no longer does.
    const u = r as typeof r & { lang?: string; target_path?: string; proposed?: string };
    const lang = String(u.lang ?? '');
    const key = String(u.target_path ?? '');
    if ((lang !== 'sw' && lang !== 'dg') || !/^[a-z_]+\.[a-z0-9_]+$/.test(key)) continue;
    const msgs = JSON.parse(readFileSync(join(opt('--data'), 'lib/i18n/messages', `${lang}.json`), 'utf-8')) as Record<string, Record<string, unknown>>;
    const [section, name] = key.split('.');
    const value = Object.hasOwn(msgs, section) && Object.hasOwn(msgs[section], name) ? msgs[section][name] : undefined;
    const present = value === String(u.proposed ?? '');
    if (r.live_status === 'reverting' ? !present : present) (r.live_status === 'reverting' ? reverted : folded).push(r.id);
    continue;
  }
  if (r.target_type === 'article') {
    // Article fixes (spec 34 §17.11): the deployed file keeps its provenance.
    const id = String(r.target_id ?? '');
    const file = join(opt('--data'), 'content/articles', `${id}.json`);
    if (!/^(culture\/[a-z0-9-]+\/[a-z0-9-]+|(history|language|figures)\/[a-z0-9-]+|timeline)$/.test(id) || !existsSync(file)) continue;
    const prov = (JSON.parse(readFileSync(file, 'utf-8')).provenance ?? {}) as Record<string, { c: string }[]>;
    const present = Object.values(prov).some((l) => l.some((x) => x.c === r.id));
    if (r.live_status === 'reverting' ? !present : present) (r.live_status === 'reverting' ? reverted : folded).push(r.id);
    continue;
  }
  if (r.target_type === 'glossary') {
    // Glossary fixes (spec 34 §17): the deployed glossary keeps each term's provenance.
    const terms = JSON.parse(readFileSync(join(opt('--data'), 'public/data/plants/glossary.json'), 'utf-8')) as { term: string; provenance?: Record<string, { c: string }[]> }[];
    const term = terms.find((t) => t.term === r.target_id);
    const present = !!term && Object.values(term.provenance ?? {}).some((l) => l.some((x) => x.c === r.id));
    if (r.live_status === 'reverting' ? !present : present) (r.live_status === 'reverting' ? reverted : folded).push(r.id);
    continue;
  }
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
