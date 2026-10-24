/**
 * Proverb data invariants (spec 34 §16.1, v2), for build, fold-in and the fold test:
 *   npx tsx scripts/proverbs/check.ts [--root <checkout>]
 */
import { readFileSync } from 'fs';
import { join } from 'path';
import { PROVERB_KEYS, COMMENTARY_MAX } from '../../lib/contributions/apply/proverbs';
import { NEW_PROVERB_SLUG } from '../../lib/proverbs/slug';

const at = process.argv.indexOf('--root');
const ROOT = at > 0 ? process.argv[at + 1] : process.cwd();
const path = join(ROOT, 'public/data/proverbs/index.json');
const raw = readFileSync(path, 'utf-8');
const list = JSON.parse(raw) as Record<string, unknown>[];
const errors: string[] = [];
const fail = (m: string) => errors.push(m);

if (raw !== JSON.stringify(list, null, 2) + '\n') fail('index.json is not JSON.stringify(_, null, 2) + "\\n"');
const ids = new Set<string>();
const slugs = new Set<string>();
let prev = -Infinity;
const FIELDS = new Set<string>(PROVERB_KEYS);
for (const p of list) {
  const id = String(p.id);
  const where = `proverb ${id}`;
  if (!/^p-\d{3,4}$/.test(id)) fail(`${where}: bad id`);
  if (ids.has(id)) fail(`${where}: duplicate id`);
  ids.add(id);
  const slug = String(p.slug);
  if (slugs.has(slug)) fail(`${where}: duplicate slug`);
  slugs.add(slug);
  if (!slug.startsWith(`${id}-`) && slug !== id) fail(`${where}: slug does not start with its id`);
  // New proverbs (past the source book) must have plain ASCII slugs; old slugs are URLs and stay.
  if (Number(p.source_number) > 387 && !NEW_PROVERB_SLUG.test(slug)) fail(`${where}: new slug not ASCII`);
  if (!(Number(p.source_number) > prev)) fail(`${where}: source_number not increasing`);
  prev = Number(p.source_number);
  const keys = Object.keys(p);
  if (keys.join() !== PROVERB_KEYS.join() && keys.join() !== [...PROVERB_KEYS, 'provenance'].join()) fail(`${where}: keys differ from the shape`);
  for (const k of Object.keys((p.field_sources as Record<string, string>) ?? {})) if (!FIELDS.has(k)) fail(`${where}: field_sources has unknown field ${k}`);
  for (const v of (p.variants as Record<string, unknown>[]) ?? []) {
    const vk = Object.keys(v).join();
    if (!['form,note', 'form,note,region,c'].includes(vk)) fail(`${where}: variant shape ${vk}`);
  }
  for (const lang of ['en', 'sw', 'dg']) if (String(p[`commentary_${lang}`] ?? '').length > COMMENTARY_MAX) fail(`${where}: commentary_${lang} over ${COMMENTARY_MAX}`);
  if (id.startsWith('c:') || p.provisional) fail(`${where}: provisional proverb written`);
}
for (const p of list) for (const r of (p.related_proverbs as string[]) ?? []) if (!ids.has(r)) fail(`proverb ${p.id}: related ${r} does not exist`);

if (errors.length) {
  for (const e of errors.slice(0, 50)) console.error(`error: ${e}`);
  console.error(`\n${errors.length} proverb invariant failure(s). See spec 34 §16.1.`);
  process.exit(1);
}
console.log(`proverbs: ${list.length} proverbs, invariants hold`);
