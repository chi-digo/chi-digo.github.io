/**
 * One-off migration (spec 34 §17.10, phase 5b): article text from the TS literals and the figure
 * Markdown into content/articles/**, with frozen block ids. Run once; the parity test then proves the
 * new files say exactly what the old modules said, and the old modules are deleted.
 *
 *   npx tsx scripts/articles/migrate.ts
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { randomBytes } from 'crypto';
import { domains } from '../../lib/culture/content';
import { historyDomain } from '../../lib/history/content';
import { oralTraditionsDomain } from '../../lib/language/content';
import { timelineEvents } from '../../lib/history/timeline';
import { parseFigureMarkdown } from '../../lib/history/figure-articles';

type Locale = 'en' | 'sw' | 'dg';
const LOCALES: Locale[] = ['en', 'sw', 'dg'];
const ROOT = join(process.cwd(), 'content/articles');
const write = (rel: string, data: unknown) => {
  const file = join(ROOT, rel);
  mkdirSync(join(file, '..'), { recursive: true });
  writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
};
const blockId = (i: number) => `b${String(i + 1).padStart(3, '0')}`;

type Block = { type: string; text: string };
/** One block per position, all three languages side by side; types must agree across languages. */
function zip(where: string, body: Record<Locale, Block[] | undefined>) {
  const en = body.en ?? [];
  for (const l of LOCALES) {
    const list = body[l];
    if (list && list.length !== en.length) throw new Error(`${where}: ${l} has ${list.length} blocks, en has ${en.length}`);
    list?.forEach((b, i) => {
      if (b.type !== en[i].type) throw new Error(`${where}: block ${i} is ${b.type} in ${l}, ${en[i].type} in en`);
    });
  }
  return en.map((b, i) => ({
    id: blockId(i),
    type: b.type,
    ...Object.fromEntries(LOCALES.filter((l) => body[l]).map((l) => [l, body[l]![i].text])),
  }));
}

type Domain = { slug: string; title: Record<Locale, string>; intro: Record<Locale, string>; proverb: string; proverbGloss: string; topics: { slug: string; title: Record<Locale, string>; intro: Record<Locale, string>; body: Record<Locale, Block[]> }[] };
const meta = (d: Domain) => ({ slug: d.slug, title: d.title, intro: d.intro, proverb: d.proverb, proverbGloss: d.proverbGloss, topics: d.topics.map((t) => t.slug) });
const topicFile = (id: string, t: Domain['topics'][number]) => ({ id, title: t.title, intro: t.intro, blocks: zip(id, t.body) });

// Culture: one folder per domain.
write('culture/_domains.json', (domains as unknown as Domain[]).map(meta));
for (const d of domains as unknown as Domain[]) for (const t of d.topics) write(`culture/${d.slug}/${t.slug}.json`, topicFile(`culture/${d.slug}/${t.slug}`, t));

// History and language: one domain each.
for (const [name, d] of [['history', historyDomain], ['language', oralTraditionsDomain]] as const) {
  write(`${name}/_domains.json`, [meta(d as unknown as Domain)]);
  for (const t of (d as unknown as Domain).topics) write(`${name}/${t.slug}.json`, topicFile(`${name}/${t.slug}`, t));
}

// Timeline: random, unordered ids (events are placed by date, not by id).
const used = new Set<string>();
const eventId = () => {
  let id;
  do id = `t-${randomBytes(2).toString('hex')}`; while (used.has(id));
  used.add(id);
  return id;
};
write('timeline.json', { events: timelineEvents.map((e) => ({ id: eventId(), era: e.era, date: e.date, title: e.title, description: e.description })) });

// Figures: parsed once from the Markdown (English at the root, translations in sw/ and dg/).
const FIG = join(process.cwd(), 'content/history/figures');
for (const file of readdirSync(FIG).filter((f) => f.endsWith('.md'))) {
  const slug = file.replace(/\.md$/, '');
  const parsed = Object.fromEntries(
    LOCALES.map((l) => [l, l === 'en' ? join(FIG, file) : join(FIG, l, file)] as const)
      .filter(([, p]) => existsSync(p))
      .map(([l, p]) => [l, parseFigureMarkdown(readFileSync(p, 'utf-8'))]),
  ) as Partial<Record<Locale, ReturnType<typeof parseFigureMarkdown>>>;
  const langs = LOCALES.filter((l) => parsed[l]);
  const id = `figures/${slug}`;
  const en = parsed.en!;
  for (const l of langs) {
    if (parsed[l]!.meta.length !== en.meta.length) throw new Error(`${id}: ${l} has ${parsed[l]!.meta.length} meta lines, en ${en.meta.length}`);
    if (JSON.stringify(parsed[l]!.sources) !== JSON.stringify(en.sources)) throw new Error(`${id}: ${l} sources differ from en`);
  }
  const per = <K extends 'title' | 'subtitle'>(k: K) => Object.fromEntries(langs.map((l) => [l, parsed[l]![k]]));
  write(`figures/${slug}.json`, {
    id,
    published: langs.length === 3,
    title: per('title'),
    subtitle: per('subtitle'),
    meta: en.meta.map((_, i) => Object.fromEntries(langs.map((l) => [l, parsed[l]!.meta[i]]))),
    blocks: zip(id, Object.fromEntries(langs.map((l) => [l, parsed[l]!.body])) as Record<Locale, Block[]>),
    sources: en.sources,
  });
}
console.log('content/articles written');
