/**
 * Lookups after headword changes (spec 34 §18.3, §18.6), on small letter files served to the real loader:
 * homonyms that gave up the same headword are all found at the old address and in search, and a
 * favourite saved under a headword leads to the word that had it, also after the word was renamed.
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
function serve(letters: Record<string, WordEntry[]>, variants: Record<string, string[]>) {
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

describe('homonyms that gave up the same headword', () => {
  beforeEach(() => serve(
    { d: [word('dafu', 'dafu', 'first meaning', 'tahu')], k: [word('kahu', 'kahu', 'second meaning', 'tahu')], t: [] },
    { tahu: ['dafu', 'kahu'] },
  ));

  it('are both found at the old address, each under its own headword', async () => {
    const { loadEntriesByHeadword } = await import('@/lib/dictionary/loader');
    const found = await loadEntriesByHeadword('tahu');
    expect(found.map((e) => e.headword).sort()).toEqual(['dafu', 'kahu']);
  });

  it('are both found by searching the old spelling', async () => {
    const { searchAll } = await import('@/lib/dictionary/search');
    const res = await searchAll('tahu');
    const all = Object.values(res).flat().map((r) => (r as { headword: string }).headword);
    expect(all).toEqual(expect.arrayContaining(['dafu', 'kahu']));
  });

  it('count a favourite saved as "tahu" as theirs (no word has that headword now)', async () => {
    const { ownFormerHeadwords, savedWordEntry } = await import('@/lib/dictionary/loader');
    expect(await ownFormerHeadwords(word('dafu', 'dafu', 'first meaning', 'tahu'))).toEqual(['tahu']);
    expect((await savedWordEntry('tahu'))?.headword).toBe('dafu');
  });
});

describe('a word renamed while a homonym keeps the headword', () => {
  beforeEach(() => serve(
    { t: [word('tahu', 'tahu', 'kept meaning')], k: [word('kahu', 'kahu', 'renamed meaning', 'tahu')] },
    { tahu: ['kahu'] },
  ));

  it('a favourite saved as "tahu" stays on the word that still has it', async () => {
    const { ownFormerHeadwords, savedWordEntry } = await import('@/lib/dictionary/loader');
    expect((await savedWordEntry('tahu'))?.id).toBe('tahu');
    expect(await ownFormerHeadwords(word('kahu', 'kahu', 'renamed meaning', 'tahu'))).toEqual([]);
  });

  it('the old address shows the word that kept it first, then the renamed one', async () => {
    const { loadEntriesByHeadword } = await import('@/lib/dictionary/loader');
    expect((await loadEntriesByHeadword('tahu')).map((e) => e.id)).toEqual(['tahu', 'kahu']);
  });
});

describe('a favourite of a renamed word', () => {
  it('leads to the word under its new headword', async () => {
    serve({ m: [word('mnadzi', 'mnadzi', 'coconut palm', 'mnazi')] }, { mnazi: ['mnadzi'] });
    const { savedWordEntry } = await import('@/lib/dictionary/loader');
    expect((await savedWordEntry('mnazi'))?.headword).toBe('mnadzi');
  });

  it('still reads an older cached forms file (one id per form)', async () => {
    serve({ m: [], ts: [word('tsazi', 'tsazi', 'moved', 'mzazi')] }, { mzazi: 'tsazi' } as unknown as Record<string, string[]>);
    const { savedWordEntry } = await import('@/lib/dictionary/loader');
    expect((await savedWordEntry('mzazi'))?.headword).toBe('tsazi');
  });
});
