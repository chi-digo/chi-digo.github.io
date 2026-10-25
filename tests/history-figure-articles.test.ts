/**
 * Figure articles (content/articles/figures, spec 34 §17.10): every published figure has its article in
 * all three languages with the same structure; drafts stay unpublished.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { figureArticles, publishedFigureSlugs } from '@/lib/articles/load';
import { figures } from '@/lib/history/figures';
import type { FigureFile } from '@/lib/articles/types';

const DIR = join(process.cwd(), 'content/articles/figures');
const files = readdirSync(DIR).filter((f) => f.endsWith('.json'));
const read = (f: string) => JSON.parse(readFileSync(join(DIR, f), 'utf-8')) as FigureFile;

describe('figure articles', () => {
  for (const f of files) {
    it(`${f} has a title, meta, sections and sources`, () => {
      const a = read(f);
      expect(a.title.en!.length).toBeGreaterThan(2);
      expect(a.meta.length).toBeGreaterThanOrEqual(3);
      expect(a.blocks.some((b) => b.type === 'heading')).toBe(true);
      expect(a.blocks.filter((b) => b.type === 'paragraph').length).toBeGreaterThan(3);
      expect(a.sources.length).toBeGreaterThan(0);
      // Overview labels and the Sources list never leak into the body.
      expect(a.blocks.some((b) => /^(overview|sources)$/i.test(b.en ?? ''))).toBe(false);
      // Quotations are quote blocks, never shown with a literal ">" (HIST-2).
      expect(a.blocks.some((b) => (b.en ?? '').trimStart().startsWith('>'))).toBe(false);
    });
  }
  it('every figure card has its article in all three languages', () => {
    expect(publishedFigureSlugs().sort()).toEqual(figures.map((f) => f.slug).sort());
  });
  it('drafts not on the cards stay unpublished', () => {
    const cards = new Set(figures.map((f) => f.slug));
    for (const f of files) if (!cards.has(f.replace(/\.json$/, ''))) expect(read(f).published).toBe(false);
  });
  for (const slug of publishedFigureSlugs()) {
    it(`${slug}: Swahili and Digo keep the English structure`, () => {
      const a = figureArticles(slug)!;
      for (const l of ['sw', 'dg'] as const) {
        expect(a[l].meta.length).toBe(a.en.meta.length);
        expect(a[l].body.map((b) => b.type)).toEqual(a.en.body.map((b) => b.type));
        expect(a[l].body.every((b) => b.text.trim().length > 0)).toBe(true);
        expect(a[l].sources).toEqual(a.en.sources);
      }
    });
  }
});
