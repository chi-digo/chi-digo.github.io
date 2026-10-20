import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { parseFigureMarkdown, publishedFigureSlugs } from '@/lib/history/figure-articles';

const DIR = join(process.cwd(), 'content/history/figures');
const files = readdirSync(DIR).filter((f) => f.endsWith('.md'));

describe('figure articles', () => {
  for (const f of files) {
    it(`${f} parses into title, meta, sections and sources`, () => {
      const a = parseFigureMarkdown(readFileSync(join(DIR, f), 'utf-8'));
      expect(a.title.length).toBeGreaterThan(2);
      expect(a.meta.length).toBeGreaterThanOrEqual(3);
      expect(a.body.some((b) => b.type === 'heading')).toBe(true);
      expect(a.body.filter((b) => b.type === 'paragraph').length).toBeGreaterThan(3);
      expect(a.sources.length).toBeGreaterThan(0);
      // Overview labels and the Sources list never leak into the body.
      expect(a.body.some((b) => /^(overview|sources)$/i.test(b.text))).toBe(false);
    });
  }
  it('only figures with all three languages are published', () => {
    // No translations exist yet, so nothing is published.
    expect(publishedFigureSlugs()).toEqual([]);
  });
});
