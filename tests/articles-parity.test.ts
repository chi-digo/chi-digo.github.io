/**
 * Phase 5b parity (spec 34 §17.10): the new article files say exactly what the old modules said, in
 * every language, block by block (type, text, inline markup), plus titles, intros, domain proverbs,
 * figure meta and sources, and the timeline. Runs while both exist; the old modules are then deleted.
 */
import { describe, it, expect } from 'vitest';
import { readdirSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { domains } from '@/lib/culture/content';
import { historyDomain as oldHistory } from '@/lib/history/content';
import { oralTraditionsDomain as oldLanguage } from '@/lib/language/content';
import { timelineEvents as oldTimeline } from '@/lib/history/timeline';
import { loadFigureArticles, parseFigureMarkdown, publishedFigureSlugs as oldPublished } from '@/lib/history/figure-articles';
import {
  cultureDomains, cultureTopic, historyDomain, historyTopic, languageDomain, languageTopic, timelineEvents, figureArticles, publishedFigureSlugs,
} from '@/lib/articles/load';
import manifest from '@/lib/articles/manifest.json';

type OldDomain = { slug: string; title: unknown; intro: unknown; proverb: string; proverbGloss: string; topics: { slug: string; title: unknown; intro: unknown; body: unknown }[] };
const metaOf = (d: OldDomain) => ({ slug: d.slug, title: d.title, intro: d.intro, proverb: d.proverb, proverbGloss: d.proverbGloss, topics: d.topics.map((t) => t.slug) });

describe('articles: new files match the old modules exactly', () => {
  it('culture: every domain and topic, in every language', () => {
    expect(cultureDomains()).toEqual((domains as unknown as OldDomain[]).map(metaOf));
    let n = 0;
    for (const d of domains as unknown as OldDomain[]) {
      for (const t of d.topics) {
        expect(cultureTopic(d.slug, t.slug), `${d.slug}/${t.slug}`).toEqual(t);
        n++;
      }
    }
    expect(n).toBe(45);
  });

  it('history and language', () => {
    expect(historyDomain()).toEqual(metaOf(oldHistory as unknown as OldDomain));
    for (const t of oldHistory.topics) expect(historyTopic(t.slug), t.slug).toEqual(t);
    expect(languageDomain()).toEqual(metaOf(oldLanguage as unknown as OldDomain));
    for (const t of oldLanguage.topics) expect(languageTopic(t.slug), t.slug).toEqual(t);
  });

  it('timeline: same events in the same order, each with an id', () => {
    const now = timelineEvents();
    expect(now.map(({ id: _id, ...rest }) => rest)).toEqual(oldTimeline);
    expect(new Set(now.map((e) => e.id)).size).toBe(now.length);
  });

  it('figures: published ones in all three languages, drafts kept', () => {
    expect(publishedFigureSlugs()).toEqual(oldPublished());
    for (const slug of oldPublished()) expect(figureArticles(slug), slug).toEqual(loadFigureArticles(slug));
    const dir = join(process.cwd(), 'content/history/figures');
    for (const f of readdirSync(dir).filter((x) => x.endsWith('.md'))) {
      const slug = f.replace(/\.md$/, '');
      const json = JSON.parse(readFileSync(join(process.cwd(), 'content/articles/figures', `${slug}.json`), 'utf-8'));
      const en = parseFigureMarkdown(readFileSync(join(dir, f), 'utf-8'));
      expect(json.title.en).toBe(en.title);
      expect(json.blocks.map((b: { type: string; en: string }) => ({ type: b.type, text: b.en }))).toEqual(en.body);
      expect(json.published).toBe(existsSync(join(dir, 'sw', f)) && existsSync(join(dir, 'dg', f)));
    }
  });

  it('the client manifest carries the same titles and intros', () => {
    const titles = (d: OldDomain) => d.topics.map((t) => ({ slug: t.slug, title: t.title, intro: t.intro }));
    expect(manifest.culture.map((d) => d.topics)).toEqual((domains as unknown as OldDomain[]).map(titles));
    expect(manifest.history.topics).toEqual(titles(oldHistory as unknown as OldDomain));
    expect(manifest.language.topics).toEqual(titles(oldLanguage as unknown as OldDomain));
  });
});
