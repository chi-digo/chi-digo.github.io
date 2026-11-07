/**
 * Lookups after headword changes, on small letter files served to the real loader (owner rulings
 * 2026-11-07): an address is a spelling, so it shows only the words that have it now (every meaning);
 * a spelling no word has now is not found, with the new spelling of a word that gave it up. Homonyms
 * that share a form are all found by search.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { newEntry, newSense, FORMER_HEADWORD, type WordEntry } from '@/lib/contributions/apply/words';

vi.mock('@/lib/pwa/data-version', () => ({
  ensureFreshData: async () => null,
  refetchFromNetwork: async () => null,
}));
vi.mock('@sentry/nextjs', () => ({ captureMessage: () => {} }));

const word = (id: string, headword: string, meaning: string, former?: string): WordEntry => newEntry({
  id, headword, sort_key: id.replace(/\.\d+$/, ''), equivalents_en: [meaning],
  senses: [newSense(1, { definition_en: meaning })],
  variants: former ? [{ form: former, dialect: '', note: FORMER_HEADWORD, id_was: `${former}.1` } as WordEntry['variants'][number]] : [],
});
const idx = (es: WordEntry[]) => es.map((e) => ({ sk: e.sort_key, hw: e.headword, id: e.id, pos: '', eq: e.equivalents_en.join(', '), eq_sw: '', eq_dg: '' }));

let files: Record<string, unknown>;
function serve(letters: Record<string, WordEntry[]>, variants: Record<string, string[] | string>) {
  files = { '/data/variants.json': variants, '/api/overlay/word': { changes: [] } };
  for (const [l, es] of Object.entries(letters)) {
    files[`/data/${l}.json`] = { letter: l, count: es.length, entries: es };
    files[`/data/${l}.idx.json`] = idx(es);
  }
}

beforeEach(() => {
  vi.resetModules();
  vi.stubGlobal('fetch', async (path: string) => {
    const body = files[path];
    return { ok: body !== undefined, status: body === undefined ? 404 : 200, json: async () => body ?? {} };
  });
});

describe('two meanings of tahu, both renamed (no word is tahu now)', () => {
  beforeEach(() => serve(
    { d: [word('dafu', 'dafu', 'first meaning', 'tahu')], k: [word('kahu', 'kahu', 'second meaning', 'tahu')], t: [] },
    { tahu: ['dafu', 'kahu'] },
  ));

  it('tahu is not found', async () => {
    const { loadEntriesByHeadword } = await import('@/lib/dictionary/loader');
    expect(await loadEntriesByHeadword('tahu')).toEqual([]);
  });

  it('…with both new spellings for the hint', async () => {
    const { renamedFrom } = await import('@/lib/dictionary/loader');
    expect((await renamedFrom('tahu')).map((e) => e.headword).sort()).toEqual(['dafu', 'kahu']);
  });

  it('searching the old spelling finds both words', async () => {
    const { searchAll } = await import('@/lib/dictionary/search');
    const res = await searchAll('tahu');
    const all = Object.values(res).flat().map((r) => (r as { headword: string }).headword);
    expect(all).toEqual(expect.arrayContaining(['dafu', 'kahu']));
  });
});

describe('another word has the spelling now', () => {
  beforeEach(() => serve(
    { t: [word('tahu', 'tahu', 'the word that is tahu now')], k: [word('kahu', 'kahu', 'renamed meaning', 'tahu')] },
    { tahu: ['kahu'] },
  ));

  it('tahu shows only that word (a favourite of tahu opens it)', async () => {
    const { loadEntriesByHeadword } = await import('@/lib/dictionary/loader');
    expect((await loadEntriesByHeadword('tahu')).map((e) => e.id)).toEqual(['tahu']);
  });
});

describe('two meanings that both have the spelling', () => {
  it('are both shown', async () => {
    serve({ k: [word('kala.1', 'kala', 'sit'), word('kala.2', 'kala', 'past marker')] }, {});
    const { loadEntriesByHeadword } = await import('@/lib/dictionary/loader');
    expect((await loadEntriesByHeadword('kala')).map((e) => e.id)).toEqual(['kala.1', 'kala.2']);
  });
});

describe('a word renamed into another letter file', () => {
  it('is found at its new spelling, and the old one gives the hint', async () => {
    serve({ m: [], ts: [word('tsazi', 'tsazi', 'moved', 'mzazi')] }, { mzazi: ['tsazi'] });
    const { loadEntriesByHeadword, renamedFrom } = await import('@/lib/dictionary/loader');
    expect((await loadEntriesByHeadword('tsazi')).map((e) => e.id)).toEqual(['tsazi']);
    expect(await loadEntriesByHeadword('mzazi')).toEqual([]);
    expect((await renamedFrom('mzazi')).map((e) => e.headword)).toEqual(['tsazi']);
  });

  it('still reads an older cached forms file (one id per form)', async () => {
    serve({ m: [], ts: [word('tsazi', 'tsazi', 'moved', 'mzazi')] }, { mzazi: 'tsazi' });
    const { renamedFrom } = await import('@/lib/dictionary/loader');
    expect((await renamedFrom('mzazi')).map((e) => e.headword)).toEqual(['tsazi']);
  });
});
