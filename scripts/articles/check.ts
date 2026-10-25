/**
 * check:articles (spec 34 §17.10): the article files' shape and the client manifest.
 *
 *   npx tsx scripts/articles/check.ts            check (build, fold-in)
 *   npx tsx scripts/articles/check.ts --write    also regenerate lib/articles/manifest.json
 *   --root <dir>                                 check another checkout (fold-in's data checkout)
 *
 * Every block has a frozen id (^b\d{3,4}$, unique in its file), a known type and text in all three
 * languages (unpublished figure drafts may be English only); bold markers are balanced; every domain's
 * topics exist. The manifest (titles, intros, slugs, proverbs; no bodies) must match the files.
 */
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'fs';
import { execFileSync } from 'child_process';
import { join } from 'path';

type Locale = 'en' | 'sw' | 'dg';
const LOCALES: Locale[] = ['en', 'sw', 'dg'];
const args = process.argv.slice(2);
const rootArg = args.includes('--root') ? args[args.indexOf('--root') + 1] : '.';
const ROOT = join(rootArg, 'content/articles');
const MANIFEST = join(rootArg, 'lib/articles/manifest.json');
const problems: string[] = [];
const fail = (m: string) => problems.push(m);
const read = (rel: string) => JSON.parse(readFileSync(join(ROOT, rel), 'utf-8'));
const formatted = (rel: string, data: unknown) => {
  if (readFileSync(join(ROOT, rel), 'utf-8') !== JSON.stringify(data, null, 2) + '\n') fail(`${rel}: not in the standard format (2-space JSON, trailing newline)`);
};
// Inline markup pairs up: ** and the single * that remain once ** is taken out.
// Provenance (spec 34 §17.11): one map per file, keyed by path, each entry a credited contribution.
function checkProvenance(rel: string, prov: unknown) {
  if (prov === undefined) return;
  if (!prov || typeof prov !== 'object' || Array.isArray(prov) || !Object.keys(prov).length) return fail(`${rel}: provenance must be a non-empty map (drop it when empty)`);
  for (const [path, list] of Object.entries(prov as Record<string, unknown>)) {
    if (!/^(title|intro|subtitle)\.(sw|dg)$|^(blocks|meta)\.[bm]\d{2,4}\.(sw|dg)$|^events\.t-[0-9a-f]{4}\.(title|description)\.(sw|dg)$/.test(path)) fail(`${rel}: provenance path ${path}`);
    if (!Array.isArray(list) || !list.length || list.some((e) => !e || typeof (e as { c?: unknown }).c !== 'string')) fail(`${rel}: provenance ${path} entries`);
  }
}

// --base <git ref>: ids are frozen. A new block, meta or event id must be past every id the file had at the base.
const baseRef = args.includes('--base') ? args[args.indexOf('--base') + 1] : null;
// A ref that can't be resolved fails the check (it must never silently switch it off).
if (baseRef) {
  try {
    execFileSync('git', ['rev-parse', '--verify', '--quiet', `${baseRef}^{commit}`], { cwd: rootArg, stdio: 'ignore' });
  } catch {
    console.error(`error: --base ${baseRef} is not a commit here (fetch it first)`);
    process.exit(1);
  }
}
/** The file at the base, or null when it didn't exist there (a new file). */
function atBase(rel: string): unknown {
  if (!baseRef) return null;
  try {
    return JSON.parse(execFileSync('git', ['show', `${baseRef}:content/articles/${rel}`], { cwd: rootArg, encoding: 'utf-8', maxBuffer: 64 << 20, stdio: ['ignore', 'pipe', 'ignore'] }));
  } catch {
    return null;
  }
}
const num = (id: string) => (id.startsWith('t-') ? parseInt(id.slice(2), 16) : Number(id.slice(1)));
function frozen(rel: string, now: string[], base: string[] | undefined) {
  if (!base) return;
  const kinds = new Set(base.map((id) => id[0]));
  for (const k of kinds) {
    // Timeline event ids are random (unordered); uniqueness is checked with the timeline below.
    if (k === 't') continue;
    const max = Math.max(...base.filter((id) => id[0] === k).map(num));
    for (const id of now) if (id[0] === k && !base.includes(id) && num(id) <= max) fail(`${rel}: new id ${id} is not past the old ones (max ${k}${max}): ids are never reused`);
  }
}

const balanced = (t: string) => (t.match(/\*\*/g) ?? []).length % 2 === 0 && (t.replace(/\*\*/g, '').match(/\*/g) ?? []).length % 2 === 0;
const onlyKeys = (rel: string, o: object, allowed: string[]) => {
  for (const k of Object.keys(o)) if (!allowed.includes(k)) fail(`${rel}: unexpected key ${k}`);
};

function checkBlocks(rel: string, blocks: { id: string; type: string; [l: string]: string }[], langs: Locale[]) {
  const ids = new Set<string>();
  for (const b of blocks) {
    if (!/^b\d{3,4}$/.test(b.id)) fail(`${rel}: bad block id ${b.id}`);
    if (ids.has(b.id)) fail(`${rel}: duplicate block id ${b.id}`);
    ids.add(b.id);
    if (!['heading', 'paragraph', 'quote'].includes(b.type)) fail(`${rel} ${b.id}: unknown type ${b.type}`);
    for (const l of langs) {
      if (typeof b[l] !== 'string' || !b[l].trim()) fail(`${rel} ${b.id}: no ${l} text`);
      else if (!balanced(b[l])) fail(`${rel} ${b.id}: unbalanced * or ** in ${l}`);
    }
    for (const k of Object.keys(b)) if (!['id', 'type', ...LOCALES].includes(k)) fail(`${rel} ${b.id}: unexpected key ${k}`);
  }
}

const listed = new Set<string>();
function checkTopic(rel: string) {
  listed.add(rel);
  if (!existsSync(join(ROOT, rel))) return fail(`${rel}: missing`);
  const t = read(rel);
  formatted(rel, t);
  onlyKeys(rel, t, ['id', 'title', 'intro', 'blocks', 'provenance']);
  if (t.id !== rel.replace(/\.json$/, '')) fail(`${rel}: id ${t.id} doesn't match the file`);
  checkProvenance(rel, t.provenance);
  frozen(rel, (t.blocks ?? []).map((b: { id: string }) => b.id), (atBase(rel) as { blocks?: { id: string }[] } | null)?.blocks?.map((b) => b.id));
  for (const l of LOCALES) if (!t.title?.[l] || !t.intro?.[l]) fail(`${rel}: title or intro missing in ${l}`);
  checkBlocks(rel, t.blocks ?? [], LOCALES);
  return t;
}

type Meta = { slug: string; title: Record<Locale, string>; intro: Record<Locale, string>; proverb: string; proverbGloss: string; topics: string[] };
function domainManifest(rel: string, topicRel: (d: Meta, slug: string) => string) {
  const list = read(rel) as Meta[];
  formatted(rel, list);
  return list.map((d) => ({
    slug: d.slug, title: d.title, intro: d.intro, proverb: d.proverb, proverbGloss: d.proverbGloss,
    topics: d.topics.map((slug) => {
      const t = checkTopic(topicRel(d, slug));
      return { slug, title: t?.title, intro: t?.intro };
    }),
  }));
}

const manifest0 = {
  culture: domainManifest('culture/_domains.json', (d, s) => `culture/${d.slug}/${s}.json`),
  history: domainManifest('history/_domains.json', (_d, s) => `history/${s}.json`)[0],
  language: domainManifest('language/_domains.json', (_d, s) => `language/${s}.json`)[0],
};
const manifest = manifest0;

// Every topic file is listed in its domain (an unlisted one could never be reached).
const walk = (rel: string): string[] =>
  readdirSync(join(ROOT, rel), { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(`${rel}/${e.name}`) : e.name.endsWith('.json') && !e.name.startsWith('_') ? [`${rel}/${e.name}`] : []);
for (const dir of ['culture', 'history', 'language']) {
  for (const f of walk(dir)) if (!listed.has(f)) fail(`${f}: not listed in ${dir}/_domains.json`);
}

// Figures: drafts (published: false) may be English only; published ones need all three languages.
// The figure cards (slugs) published figures must belong to.
const cardSlugs = new Set([...readFileSync(join(rootArg, 'lib/history/figures.ts'), 'utf-8').matchAll(/slug: ['"]([a-z0-9-]+)['"]/g)].map((m) => m[1]));
for (const f of readdirSync(join(ROOT, 'figures')).filter((x) => x.endsWith('.json'))) {
  const rel = `figures/${f}`;
  const fig = read(rel);
  formatted(rel, fig);
  onlyKeys(rel, fig, ['id', 'published', 'title', 'subtitle', 'meta', 'blocks', 'sources', 'provenance']);
  if (fig.published) {
    if (!cardSlugs.has(f.replace(/\.json$/, ''))) fail(`${rel}: published but has no card in lib/history/figures.ts`);
    for (const l of LOCALES) if (!fig.subtitle?.[l]) fail(`${rel}: no ${l} subtitle`);
    if (!fig.sources?.length) fail(`${rel}: no sources`);
  }
  if (fig.id !== `figures/${f.replace(/\.json$/, '')}`) fail(`${rel}: id ${fig.id}`);
  const langs = fig.published ? LOCALES : (['en'] as Locale[]);
  for (const l of langs) if (!fig.title?.[l]) fail(`${rel}: no ${l} title`);
  const metaIds = new Set<string>();
  for (const m of fig.meta ?? []) {
    if (!/^m\d{2}$/.test(m.id) || metaIds.has(m.id)) fail(`${rel}: bad or duplicate meta id ${m.id}`);
    metaIds.add(m.id);
    for (const l of langs) if (!m[l]) fail(`${rel}: meta line missing ${l}`);
  }
  checkProvenance(rel, fig.provenance);
  const baseFig = atBase(rel) as { blocks?: { id: string }[]; meta?: { id: string }[] } | null;
  frozen(rel, [...(fig.blocks ?? []).map((b: { id: string }) => b.id), ...(fig.meta ?? []).map((m: { id: string }) => m.id)],
    baseFig ? [...(baseFig.blocks ?? []).map((b) => b.id), ...(baseFig.meta ?? []).map((m) => m.id).filter(Boolean)] : undefined);
  checkBlocks(rel, fig.blocks ?? [], langs);
}

// Timeline: unique ids, known eras, every language.
const tl = read('timeline.json');
formatted('timeline.json', tl);
onlyKeys('timeline.json', tl, ['events', 'provenance']);
checkProvenance('timeline.json', tl.provenance);
const tids = new Set<string>();
for (const e of tl.events) {
  if (!/^t-[0-9a-f]{4}$/.test(e.id) || tids.has(e.id)) fail(`timeline.json: bad or duplicate id ${e.id}`);
  tids.add(e.id);
  if (!['origins', 'kaya', 'colonial', 'modern'].includes(e.era)) fail(`timeline.json ${e.id}: era ${e.era}`);
  if (typeof e.date !== 'string' || !e.date.trim()) fail(`timeline.json ${e.id}: no date`);
  onlyKeys(`timeline.json ${e.id}`, e, ['id', 'era', 'date', 'title', 'description']);
  for (const l of LOCALES) if (!e.title?.[l] || !e.description?.[l]) fail(`timeline.json ${e.id}: missing ${l}`);
}

const text = JSON.stringify(manifest, null, 2) + '\n';
if (args.includes('--write') && !problems.length) writeFileSync(MANIFEST, text);
else if (args.includes('--write')) fail('manifest not written: fix the problems above first');
else if (!existsSync(MANIFEST) || readFileSync(MANIFEST, 'utf-8') !== text) fail('lib/articles/manifest.json is out of date: run npx tsx scripts/articles/check.ts --write');

if (problems.length) {
  for (const p of problems.slice(0, 40)) console.error(`error: ${p}`);
  console.error(`\n${problems.length} article problem(s).`);
  process.exit(1);
}
console.log(`articles: ${manifest.culture.reduce((n, d) => n + d.topics.length, 0)} culture, ${manifest.history.topics.length} history, ${manifest.language.topics.length} language topics, ${tl.events.length} timeline events; manifest up to date`);
