/**
 * Rebuild the dictionary search indexes (public/data/*.idx.json) and the letter metadata in
 * public/data/index.json from the letter files, and check the data invariants (spec 34 §15.1).
 * The letter files are the source of truth. TypeScript port of sync-dictionary-index.py, which is
 * now a wrapper around this script.
 *
 *   npx tsx scripts/dictionary/build-index.ts          # rebuild derived files, bump the dict data version
 *   npx tsx scripts/dictionary/build-index.ts --check  # check invariants 1–6; exit 1 on any failure
 *   … --root <checkout>                                 # another checkout's data (fold-in)
 *
 * Letter and idx files are compact JSON with no trailing newline; index.json is
 * JSON.stringify(_, null, 2) + "\n". Output is never \u-escaped.
 */
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { digoLetterFile } from '../../lib/dictionary/letters';

const rootAt = process.argv.indexOf('--root');
const ROOT = rootAt > 0 ? process.argv[rootAt + 1] : process.cwd();
const DATA = join(ROOT, 'public', 'data');
const check = process.argv.includes('--check');

const ENTRY_KEYS = ['id', 'headword', 'homonym_index', 'sort_key', 'pos', 'pos_en', 'noun_class', 'plural_prefix', 'plural_form', 'ipa', 'audio',
  'equivalents_en', 'equivalents_sw', 'variants', 'senses', 'etymology', 'bible_refs', 'proverb_refs', 'sub_entries', 'editorial_state',
  'is_redirect', 'redirect_target'];
const SENSE_KEYS = ['sense_id', 'definition_en', 'definition_sw', 'definition_dg', 'definition_dg_status', 'examples', 'synonyms_dg',
  'antonyms_dg', 'cross_refs', 'cultural_note', 'register', 'dialect_tags'];

type Sense = Record<string, unknown> & { sense_id: number; definition_dg?: string | null };
type Entry = Record<string, unknown> & {
  id: string; headword: string; sort_key: string; pos?: string | null;
  equivalents_en?: string[] | null; equivalents_sw?: string[] | null; senses: Sense[];
};
type LetterFile = { letter?: string; count: number; entries: Entry[] };
type Meta = { total_entries: number; generated_at?: string; letters: Record<string, { count: number; first: string; last: string }> };

/** Code-point order (never localeCompare): the order the files are sorted in. */
const byCodePoint = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);
const sortKeyOf = (headword: string) => headword.toLowerCase().replace(/^-/, '').replace(/’/g, "'");
const fileFor = (letter: string) => join(DATA, `${letter.replace(/'/g, '_')}.json`);
const compact = (v: unknown) => JSON.stringify(v);

function row(e: Entry) {
  const senses = e.senses?.length ? e.senses : [{} as Sense];
  return {
    sk: e.sort_key, hw: e.headword, id: e.id, pos: e.pos ?? null,
    eq: (e.equivalents_en || []).join(', '),
    eq_sw: (e.equivalents_sw || []).join(', '),
    eq_dg: senses[0].definition_dg || '',
  };
}

const errors: string[] = [];
const fail = (msg: string) => errors.push(msg);

const metaPath = join(DATA, 'index.json');
const metaRaw = readFileSync(metaPath, 'utf-8');
const meta: Meta = JSON.parse(metaRaw);
const letters = Object.keys(meta.letters);
const files: Record<string, LetterFile> = {};
for (const L of letters) files[L] = JSON.parse(readFileSync(fileFor(L), 'utf-8'));

// ---------- Invariants 1–5 ----------
const seen = new Map<string, string>();
for (const L of letters) {
  const d = files[L];
  if (d.count !== d.entries.length) fail(`${L}: count ${d.count} but ${d.entries.length} entries (5)`);
  let prev = '';
  for (const e of d.entries) {
    const where = `${L}.json ${e.id}`;
    if (seen.has(e.id)) fail(`${where}: id also in ${seen.get(e.id)}.json (1)`);
    seen.set(e.id, L);
    if (e.id.replace(/\.\d+$/, '') !== e.sort_key) fail(`${where}: id without .N is not the sort_key "${e.sort_key}" (1)`);
    if (e.sort_key !== sortKeyOf(e.headword)) fail(`${where}: sort_key "${e.sort_key}" should be "${sortKeyOf(e.headword)}" (2)`);
    if (byCodePoint(prev, e.sort_key) > 0) fail(`${where}: out of code-point order after "${prev}" (2)`);
    prev = e.sort_key;
    const want = digoLetterFile(e.sort_key);
    if (want !== L.replace(/'/g, '_')) fail(`${where}: belongs in ${want}.json (3)`);
    if (!(want in meta.letters) && !(want.replace(/_/g, "'") in meta.letters)) fail(`${where}: ${want} is not a letter in index.json (3)`);
    // Community changes add provenance after the 22 keys; a provisional overlay entry must never be written.
    const keys = Object.keys(e);
    const shapeOk = keys.join() === ENTRY_KEYS.join() || keys.join() === [...ENTRY_KEYS, 'provenance'].join();
    if (!shapeOk) fail(`${where}: entry keys differ from the 22-key shape (4)`);
    if (e.id.startsWith('c:')) fail(`${where}: a provisional id was written to the data (1)`);
    const ids = new Set<number>();
    for (const s of e.senses || []) {
      if (Object.keys(s).join() !== SENSE_KEYS.join()) fail(`${where}: sense ${s.sense_id} keys differ from the 12-key shape (4)`);
      if (!Number.isInteger(s.sense_id) || s.sense_id < 1 || ids.has(s.sense_id)) fail(`${where}: bad or repeated sense_id ${s.sense_id} (4)`);
      ids.add(s.sense_id);
    }
  }
}

// ---------- Derived files (invariant 6) ----------
const stale: string[] = [];
const writes: [string, string][] = [];
for (const L of letters) {
  const idxPath = fileFor(L).replace(/\.json$/, '.idx.json');
  if (!existsSync(idxPath)) { fail(`${L}: missing ${idxPath} (6)`); continue; }
  const want = compact([...files[L].entries].sort((a, b) => byCodePoint(a.sort_key, b.sort_key)).map(row));
  if (readFileSync(idxPath, 'utf-8') !== want) { stale.push(idxPath); writes.push([idxPath, want]); }
}
// English and Swahili search (term -> [[letter, id]]) and spelling forms (form -> id), as the old
// pipeline built them (context/dictionary/scripts/05_compile.py), now from the letter files (BACKLOG #33).
function reverseIndex(field: 'equivalents_en' | 'equivalents_sw') {
  // No prototype: a term like "constructor" or "__proto__" must be an ordinary key.
  const out: Record<string, [string, string][]> = Object.create(null);
  for (const L of letters) for (const e of files[L].entries) {
    if ((e as { is_redirect?: boolean }).is_redirect) continue;
    for (const q of e[field] || []) {
      const term = q.toLowerCase().trim();
      if (!term) continue;
      if (!Object.hasOwn(out, term)) out[term] = [];
      out[term].push([e.sort_key ? e.sort_key[0] : 'x', e.id]);
    }
  }
  return out;
}
function variantsMap() {
  const out: Record<string, string> = Object.create(null);
  for (const L of letters) for (const e of files[L].entries) {
    if ((e as { is_redirect?: boolean }).is_redirect) continue;
    for (const v of ((e as { variants?: { form?: string }[] }).variants ?? [])) {
      const form = (v.form ?? '').toLowerCase().trim();
      // The first entry with a form keeps it (as the live overlay does).
      if (form && !Object.hasOwn(out, form)) out[form] = e.id;
    }
  }
  return out;
}
for (const [name, value] of [['reverse-en.json', reverseIndex('equivalents_en')], ['reverse-sw.json', reverseIndex('equivalents_sw')], ['variants.json', variantsMap()]] as const) {
  const path = join(DATA, name);
  const want = compact(value);
  if (!existsSync(path) || readFileSync(path, 'utf-8') !== want) { stale.push(path); writes.push([path, want]); }
}

const newMeta: Meta = JSON.parse(metaRaw);
let countsChanged = false;
for (const L of letters) {
  const d = files[L];
  const v = { count: d.entries.length, first: d.entries[0].headword, last: d.entries[d.entries.length - 1].headword };
  if (newMeta.letters[L].count !== v.count) countsChanged = true;
  newMeta.letters[L] = { ...newMeta.letters[L], ...v };
}
const total = letters.reduce((n, L) => n + files[L].entries.length, 0);
if (newMeta.total_entries !== total) countsChanged = true;
newMeta.total_entries = total;
// generated_at is left as it is, so a fold-in and its revert give back byte-identical files (spec 34 §15.3 gate).
const metaOut = JSON.stringify(newMeta, null, 2) + '\n';
// generated_at alone never makes index.json stale.
const comparable = (s: string) => s.replace(/"generated_at": "[^"]*"/, '');
if (comparable(metaRaw) !== comparable(metaOut) || (countsChanged && metaRaw !== metaOut)) { stale.push(metaPath); writes.push([metaPath, metaOut]); }

if (check) {
  for (const f of stale) fail(`${f.replace(DATA + '/', '')} is stale: run npm run build:dictionary-index (6)`);
  if (errors.length) {
    for (const e of errors.slice(0, 50)) console.error(`error: ${e}`);
    if (errors.length > 50) console.error(`… and ${errors.length - 50} more`);
    console.error(`\n${errors.length} dictionary invariant failure(s). See spec 34 §15.1.`);
    process.exit(1);
  }
  console.log(`dictionary: ${total} entries in ${letters.length} letter files, invariants hold`);
  process.exit(0);
}

for (const [p, text] of writes) writeFileSync(p, text);
if (errors.length) for (const e of errors) console.error(`warning: ${e}`);
console.log(`rebuilt files: ${writes.length}  (total entries: ${total})`);
if (writes.length) {
  // Dictionary data changed: make installed apps drop their cached copy.
  const vp = join(DATA, 'data-version.json');
  const v = JSON.parse(readFileSync(vp, 'utf-8'));
  const n = new Date();
  const pad = (x: number) => String(x).padStart(2, '0');
  const stamp = `${n.getUTCFullYear()}.${pad(n.getUTCMonth() + 1)}.${pad(n.getUTCDate())}.${pad(n.getUTCHours())}${pad(n.getUTCMinutes())}`;
  v.dict = stamp; v.version = stamp;
  writeFileSync(vp, JSON.stringify(v, null, 2) + '\n');
  console.log(`data-version: dict -> ${stamp}`);
}
