/**
 * Server-side reading of content/articles/** (spec 34 §17.10). Pages read an article here and pass it,
 * in all three languages, to the client components (locale switching happens in the browser).
 */
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import type { Locale } from '@/lib/i18n/config';
import { figures } from '@/lib/history/figures';
import { bodyIn } from './body';
import type { ArticleFile, DomainMeta, FigureArticle, FigureFile, TimelineEvent, Topic } from './types';

const ROOT = join(process.cwd(), 'content/articles');
const LOCALES: Locale[] = ['en', 'sw', 'dg'];
const SLUG = /^[a-z0-9-]+$/;
const cache = new Map<string, unknown>();

/** One file, read once per server instance (content only changes with a deploy). A missing file is never remembered. */
function read<T>(rel: string): T | null {
  if (cache.has(rel)) return cache.get(rel) as T;
  const file = join(ROOT, rel);
  if (!existsSync(file)) return null;
  const data = JSON.parse(readFileSync(file, 'utf-8')) as T;
  cache.set(rel, data);
  return data;
}

const EMPTY_DOMAIN: DomainMeta = { slug: '', title: { en: '', sw: '', dg: '' }, intro: { en: '', sw: '', dg: '' }, proverb: '', proverbGloss: '', topics: [] };

export { bodyIn };

function topicOf(slug: string, file: ArticleFile): Topic {
  return {
    slug,
    title: file.title,
    intro: file.intro,
    body: Object.fromEntries(LOCALES.map((l) => [l, bodyIn(file.blocks, l)])) as Topic['body'],
  };
}

export function cultureDomains(): DomainMeta[] {
  return read<DomainMeta[]>('culture/_domains.json') ?? [];
}
export function historyDomain(): DomainMeta {
  return read<DomainMeta[]>('history/_domains.json')?.[0] ?? EMPTY_DOMAIN;
}
export function languageDomain(): DomainMeta {
  return read<DomainMeta[]>('language/_domains.json')?.[0] ?? EMPTY_DOMAIN;
}

/** A culture topic, or null if the domain or topic doesn't exist. */
export function cultureTopic(domain: string, topic: string): Topic | null {
  if (!SLUG.test(domain) || !SLUG.test(topic)) return null;
  if (!cultureDomains().some((d) => d.slug === domain && d.topics.includes(topic))) return null;
  const file = read<ArticleFile>(`culture/${domain}/${topic}.json`);
  return file ? topicOf(topic, file) : null;
}
export function historyTopic(topic: string): Topic | null {
  if (!SLUG.test(topic) || !historyDomain().topics.includes(topic)) return null;
  const file = read<ArticleFile>(`history/${topic}.json`);
  return file ? topicOf(topic, file) : null;
}
export function languageTopic(topic: string): Topic | null {
  if (!SLUG.test(topic) || !languageDomain().topics.includes(topic)) return null;
  const file = read<ArticleFile>(`language/${topic}.json`);
  return file ? topicOf(topic, file) : null;
}

export function timelineEvents(): TimelineEvent[] {
  return read<{ events: TimelineEvent[] }>('timeline.json')?.events ?? [];
}

/** An article id the contributions API accepts (spec 34 §17.8 rule 2). */
export const ARTICLE_ID = /^(culture\/[a-z0-9-]+\/[a-z0-9-]+|(history|language|figures)\/[a-z0-9-]+|timeline)$/;

/** The stored file for an article id (topic, published figure or the timeline), or null. */
export function articleData(id: string): (ArticleFile | FigureFile | { events: TimelineEvent[]; provenance?: ArticleFile['provenance'] }) | null {
  if (!ARTICLE_ID.test(id)) return null;
  if (id === 'timeline') return read('timeline.json');
  const [kind, a, b] = id.split('/');
  if (kind === 'culture') return cultureDomains().some((d) => d.slug === a && d.topics.includes(b)) ? read<ArticleFile>(`${id}.json`) : null;
  if (kind === 'history') return historyDomain().topics.includes(a) ? read<ArticleFile>(`${id}.json`) : null;
  if (kind === 'language') return languageDomain().topics.includes(a) ? read<ArticleFile>(`${id}.json`) : null;
  const fig = figures.some((x) => x.slug === a) ? read<FigureFile>(`${id}.json`) : null;
  return fig?.published ? fig : null;
}

/** A figure's article in all three languages, only if it is published. */
export function figureArticles(slug: string): Record<Locale, FigureArticle> | null {
  if (!SLUG.test(slug) || !figures.some((x) => x.slug === slug)) return null;
  const f = read<FigureFile>(`figures/${slug}.json`);
  if (!f?.published) return null;
  return Object.fromEntries(
    LOCALES.map((l) => [l, {
      title: f.title[l] ?? '',
      subtitle: f.subtitle[l] ?? '',
      meta: f.meta.map((m) => m[l] ?? ''),
      body: bodyIn(f.blocks, l),
      sources: f.sources,
    }]),
  ) as Record<Locale, FigureArticle>;
}

/** Figures on the cards (lib/history/figures.ts) with a published article. */
export function publishedFigureSlugs(): string[] {
  return figures.map((f) => f.slug).filter((slug) => SLUG.test(slug) && read<FigureFile>(`figures/${slug}.json`)?.published === true);
}
