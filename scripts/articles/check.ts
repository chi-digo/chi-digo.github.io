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
const balanced = (t: string) => ((t.match(/\*\*/g) ?? []).length % 2 === 0);

function checkBlocks(rel: string, blocks: { id: string; type: string; [l: string]: string }[], langs: Locale[]) {
  const ids = new Set<string>();
  for (const b of blocks) {
    if (!/^b\d{3,4}$/.test(b.id)) fail(`${rel}: bad block id ${b.id}`);
    if (ids.has(b.id)) fail(`${rel}: duplicate block id ${b.id}`);
    ids.add(b.id);
    if (!['heading', 'paragraph', 'quote'].includes(b.type)) fail(`${rel} ${b.id}: unknown type ${b.type}`);
    for (const l of langs) {
      if (typeof b[l] !== 'string' || !b[l].trim()) fail(`${rel} ${b.id}: no ${l} text`);
      else if (!balanced(b[l])) fail(`${rel} ${b.id}: unbalanced ** in ${l}`);
    }
    for (const k of Object.keys(b)) if (!['id', 'type', ...LOCALES].includes(k)) fail(`${rel} ${b.id}: unexpected key ${k}`);
  }
}

function checkTopic(rel: string) {
  if (!existsSync(join(ROOT, rel))) return fail(`${rel}: missing`);
  const t = read(rel);
  formatted(rel, t);
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

const manifest = {
  culture: domainManifest('culture/_domains.json', (d, s) => `culture/${d.slug}/${s}.json`),
  history: domainManifest('history/_domains.json', (_d, s) => `history/${s}.json`)[0],
  language: domainManifest('language/_domains.json', (_d, s) => `language/${s}.json`)[0],
};

// Figures: drafts (published: false) may be English only; published ones need all three languages.
for (const f of readdirSync(join(ROOT, 'figures')).filter((x) => x.endsWith('.json'))) {
  const rel = `figures/${f}`;
  const fig = read(rel);
  formatted(rel, fig);
  if (fig.id !== `figures/${f.replace(/\.json$/, '')}`) fail(`${rel}: id ${fig.id}`);
  const langs = fig.published ? LOCALES : (['en'] as Locale[]);
  for (const l of langs) if (!fig.title?.[l]) fail(`${rel}: no ${l} title`);
  for (const m of fig.meta ?? []) for (const l of langs) if (!m[l]) fail(`${rel}: meta line missing ${l}`);
  checkBlocks(rel, fig.blocks ?? [], langs);
}

// Timeline: unique ids, known eras, every language.
const tl = read('timeline.json');
formatted('timeline.json', tl);
const tids = new Set<string>();
for (const e of tl.events) {
  if (!/^t-[0-9a-f]{4}$/.test(e.id) || tids.has(e.id)) fail(`timeline.json: bad or duplicate id ${e.id}`);
  tids.add(e.id);
  if (!['origins', 'kaya', 'colonial', 'modern'].includes(e.era)) fail(`timeline.json ${e.id}: era ${e.era}`);
  for (const l of LOCALES) if (!e.title?.[l] || !e.description?.[l]) fail(`timeline.json ${e.id}: missing ${l}`);
}

const text = JSON.stringify(manifest, null, 2) + '\n';
if (args.includes('--write')) writeFileSync(MANIFEST, text);
else if (!existsSync(MANIFEST) || readFileSync(MANIFEST, 'utf-8') !== text) fail('lib/articles/manifest.json is out of date: run npx tsx scripts/articles/check.ts --write');

if (problems.length) {
  for (const p of problems.slice(0, 40)) console.error(`error: ${p}`);
  console.error(`\n${problems.length} article problem(s).`);
  process.exit(1);
}
console.log(`articles: ${manifest.culture.reduce((n, d) => n + d.topics.length, 0)} culture, ${manifest.history.topics.length} history, ${manifest.language.topics.length} language topics, ${tl.events.length} timeline events; manifest up to date`);
