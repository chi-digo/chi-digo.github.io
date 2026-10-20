/**
 * Full articles behind the History page's figure cards (content/history/figures/). English is the
 * source; translations sit beside it in sw/ and dg/. A figure gets a page only when all three
 * languages exist, so no page ever falls back to another language. Server-only (reads files).
 */
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import type { Locale } from '@/lib/i18n/config';
import type { ContentBlock } from './content';
import { figures } from './figures';

export interface FigureArticle {
  title: string;
  subtitle: string;
  meta: string[];
  body: ContentBlock[];
  sources: string[];
}

const DIR = join(process.cwd(), 'content/history/figures');
const LOCALES: Locale[] = ['en', 'sw', 'dg'];

function fileFor(slug: string, locale: Locale) {
  return locale === 'en' ? join(DIR, `${slug}.md`) : join(DIR, locale, `${slug}.md`);
}

/** Parses the article Markdown: "# Title: subtitle", an Overview of **Label:** lines, ## sections, ## Sources. */
export function parseFigureMarkdown(md: string): FigureArticle {
  const out: FigureArticle = { title: '', subtitle: '', meta: [], body: [], sources: [] };
  let section = '';
  let para: string[] = [];
  const flush = () => {
    if (para.length) out.body.push({ type: 'paragraph', text: para.join(' ') });
    para = [];
  };
  for (const raw of md.split('\n')) {
    const line = raw.trim();
    if (line.startsWith('# ')) {
      const [title, ...rest] = line.slice(2).split(':');
      out.title = title.trim();
      out.subtitle = rest.join(':').trim();
    } else if (line.startsWith('## ')) {
      flush();
      section = line.slice(3).trim();
      const s = section.toLowerCase();
      if (!['overview', 'muhtasari', 'sources', 'vyanzo', 'marejeo'].includes(s)) out.body.push({ type: 'heading', text: section });
    } else if (!line || line === '---') {
      flush();
    } else if (/^(sources|vyanzo|marejeo)$/i.test(section)) {
      const item = line.replace(/^(\d+\.|[-*])\s+/, '');
      if (item) out.sources.push(item);
    } else if (/^\*\*[^*]+:\*\*/.test(line) && out.body.every((b) => b.type !== 'heading')) {
      out.meta.push(line.replace(/^\*\*([^*]+):\*\*\s*/, '$1: '));
    } else if (/^[-*]\s+/.test(line)) {
      flush();
      out.body.push({ type: 'paragraph', text: line.replace(/^[-*]\s+/, '') });
    } else {
      para.push(line);
    }
  }
  flush();
  return out;
}

export function loadFigureArticles(slug: string): Record<Locale, FigureArticle> | null {
  if (!LOCALES.every((l) => existsSync(fileFor(slug, l)))) return null;
  return Object.fromEntries(LOCALES.map((l) => [l, parseFigureMarkdown(readFileSync(fileFor(slug, l), 'utf-8'))])) as Record<Locale, FigureArticle>;
}

/** Figures on the cards that have a complete (three-language) article. */
export function publishedFigureSlugs(): string[] {
  return figures.map((f) => f.slug).filter((slug) => LOCALES.every((l) => existsSync(fileFor(slug, l))));
}
