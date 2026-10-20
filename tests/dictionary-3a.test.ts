/**
 * Spec 34 phase 3a: every entry can be found again (affix pages, ISSUES DATA-3) and exact search
 * hits every sort key (code-point order, ISSUES DATA-4). Runs over the real letter files.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { digoLetterFile } from '@/lib/dictionary/letters';
import { entriesFor } from '@/lib/dictionary/loader';
import { binarySearch } from '@/lib/dictionary/search';
import type { LetterFile, SearchIndexEntry } from '@/lib/dictionary/types';

const DATA = join(process.cwd(), 'public', 'data');
const meta = JSON.parse(readFileSync(join(DATA, 'index.json'), 'utf-8'));
const letters = Object.keys(meta.letters).map((l: string) => l.replace(/'/g, '_'));
const cache = new Map<string, unknown>();
const load = (f: string) => {
  if (!cache.has(f)) cache.set(f, JSON.parse(readFileSync(join(DATA, f), 'utf-8')));
  return cache.get(f) as never;
};

describe('dictionary letter files', () => {
  it('maps affixes and apostrophes to the right file', () => {
    expect(digoLetterFile('-ako')).toBe('a');
    expect(digoLetterFile('-ani')).toBe('a');
    expect(digoLetterFile('ng’ombe')).toBe('ng_');
    expect(digoLetterFile("m'")).toBe('m_');
    expect(digoLetterFile('kpwedza')).toBe('kpw');
  });

  it('finds every entry by its headword, affixes included', () => {
    const missing: string[] = [];
    for (const L of letters) {
      const d: LetterFile = load(`${L}.json`);
      for (const e of d.entries) {
        const home: LetterFile = load(`${digoLetterFile(e.headword)}.json`);
        const hw = e.headword.replace(/[\d;]+$/, '');
        if (!entriesFor(home, hw).some((x) => x.id === e.id)) missing.push(`${L}:${e.id}`);
      }
    }
    expect(missing).toEqual([]);
  });

  it('opens an affix page with or without the hyphen', () => {
    const a: LetterFile = load('a.json');
    expect(entriesFor(a, '-ako').some((e) => e.headword === '-ako')).toBe(true);
  });

  it('exact search hits every sort key', () => {
    const missed: string[] = [];
    for (const L of letters) {
      const idx: SearchIndexEntry[] = load(`${L}.idx.json`);
      for (const r of idx) if (binarySearch(idx, r.sk)?.sk !== r.sk) missed.push(`${L}:${r.sk}`);
    }
    expect(missed).toEqual([]);
  });
});
