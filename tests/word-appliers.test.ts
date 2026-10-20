/**
 * Dictionary appliers (spec 34 §15.3): apply, idempotency, conflicts, and unapply restoring the exact
 * bytes, including add_sense reverted out of order and the Digo status restore.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import {
  applyWord, unapplyWord, wordAdditionEntry, foldedId, nextSenseId, definitionBase, ENTRY_KEYS, SENSE_KEYS, type WordEntry,
} from '@/lib/contributions/apply/words';
import { ConflictError, type Change } from '@/lib/contributions/apply/types';
import { PAYLOADS } from '@/lib/contributions/schemas';

const letter = JSON.parse(readFileSync(join(process.cwd(), 'public/data/m.json'), 'utf-8'));
const fixture = (): WordEntry => structuredClone(letter.entries.find((e: WordEntry) => e.senses.length >= 1 && e.senses[0].definition_dg));
const bytes = (e: unknown) => JSON.stringify(e);

function change(over: Partial<Change> & Pick<Change, 'type' | 'final_payload'>): Change {
  return { contribution_id: over.contribution_id ?? crypto.randomUUID(), target_id: fixture().id, outcome: null, region: 'kwale_south', confidence: 'native', ...over } as Change;
}

describe('definition_update replace', () => {
  it('replaces Digo text, marks it community, and unapplies to the exact bytes', () => {
    const e = fixture();
    const base = { value: definitionBase(e, 1, 'dg') };
    const c = change({ type: 'definition_update', final_payload: { sense_id: '1', lang: 'dg', text: 'Maana mpya', mode: 'replace' }, base });
    const a = applyWord(e, c);
    expect(a.senses[0].definition_dg).toBe('Maana mpya');
    expect(a.senses[0].definition_dg_status).toBe('community');
    expect(Object.keys(a).slice(0, 22)).toEqual([...ENTRY_KEYS]);
    expect(Object.keys(a.senses[0])).toEqual([...SENSE_KEYS]);
    expect(applyWord(a, c)).toBe(a); // idempotent
    expect(bytes(unapplyWord(a, c))).toBe(bytes(e));
  });

  it('conflicts when the base changed, and refuses to unapply an edited field', () => {
    const e = fixture();
    const c = change({ type: 'definition_update', final_payload: { sense_id: '1', lang: 'en', text: 'new', mode: 'replace' }, base: { value: { text: 'something else' } } });
    expect(() => applyWord(e, c)).toThrow(ConflictError);
    const ok = change({ type: 'definition_update', final_payload: { sense_id: '1', lang: 'en', text: 'new', mode: 'replace' }, base: { value: definitionBase(e, 1, 'en') } });
    const a = applyWord(e, ok);
    a.senses[0].definition_en = 'changed by an admin';
    expect(() => unapplyWord(a, ok)).toThrow(ConflictError);
  });
});

describe('definition_update add_sense', () => {
  it('adds senses with ids allocated at accept and reverts them out of order', () => {
    const e = fixture();
    const n1 = nextSenseId(e);
    const c1 = change({ type: 'definition_update', target_path: `senses.${n1}`, final_payload: { sense_id: '1', lang: 'en', text: 'first new', mode: 'add_sense' } });
    const n2 = nextSenseId(e, [c1.target_path]);
    expect(n2).toBe(n1 + 1);
    const c2 = change({ type: 'definition_update', target_path: `senses.${n2}`, final_payload: { sense_id: '1', lang: 'dg', text: 'Ya phiri', mode: 'add_sense' } });
    const both = applyWord(applyWord(e, c1), c2);
    expect(both.senses.map((s) => s.sense_id).slice(-2)).toEqual([n1, n2]);
    expect(both.senses.at(-1)!.definition_dg_status).toBe('community');
    expect(() => applyWord(both, { ...c1, contribution_id: crypto.randomUUID() })).toThrow(ConflictError); // id taken
    const back = unapplyWord(unapplyWord(both, c1), c2);
    expect(bytes(back)).toBe(bytes(e));
  });

  it('will not remove a sense that other changes point into', () => {
    const e = fixture();
    const n = nextSenseId(e);
    const add = change({ type: 'definition_update', target_path: `senses.${n}`, final_payload: { sense_id: '1', lang: 'en', text: 'x', mode: 'add_sense' } });
    const ex = change({ type: 'example_sentence', final_payload: { sense_id: String(n), dg: 'Mfwano', en: 'Example' } });
    const a = applyWord(applyWord(e, add), ex);
    expect(() => unapplyWord(a, add)).toThrow(ConflictError);
    expect(bytes(unapplyWord(unapplyWord(a, ex), add))).toBe(bytes(e));
  });
});

describe('examples and variants', () => {
  it('adds and removes an example by contribution id', () => {
    const e = fixture();
    const c = change({ type: 'example_sentence', final_payload: { sense_id: '1', dg: 'Ni mfwano.', en: 'It is an example.' } });
    const a = applyWord(e, c);
    expect(a.senses[0].examples.at(-1)).toMatchObject({ dg: 'Ni mfwano.', source: 'community', c: c.contribution_id });
    expect(bytes(unapplyWord(a, c))).toBe(bytes(e));
  });

  it('adds a regional variant with the region as its dialect', () => {
    const e = fixture();
    const c = change({ type: 'spelling_variant', final_payload: { form: 'mfwano', kind: 'dialect' }, region: 'tanga' });
    const a = applyWord(e, c);
    expect(a.variants.at(-1)).toEqual({ form: 'mfwano', dialect: 'tanga', note: 'dialect', c: c.contribution_id });
    expect(bytes(unapplyWord(a, c))).toBe(bytes(e));
  });

  it('never changes content for a flag', () => {
    const e = fixture();
    expect(applyWord(e, change({ type: 'entry_flag', final_payload: { reason: 'offensive' } }))).toBe(e);
  });
});

describe('new words', () => {
  it('builds a provisional entry in the fixed shape', () => {
    const c = change({ type: 'word_addition', final_payload: { headword: 'Kalamu-dzuwa', meaning_en: 'sunbird; small bird', meaning_sw: 'chozi', example_dg: 'Kalamu-dzuwa yaphaa.' } });
    const e = wordAdditionEntry(c);
    expect(e.id).toBe(`c:${c.contribution_id}`);
    expect(e.sort_key).toBe('kalamu-dzuwa');
    expect(e.equivalents_en).toEqual(['sunbird', 'small bird']);
    expect(Object.keys(e).slice(0, 22)).toEqual([...ENTRY_KEYS]);
    expect(e.senses[0].examples[0]).toMatchObject({ source: 'community', c: c.contribution_id });
  });

  it('gives a homonym the next free id and never renumbers', () => {
    expect(foldedId('tiba', ['taa', 'tiba2x'])).toBe('tiba');
    expect(foldedId('kala', ['kala'])).toBe('kala.2');
    expect(foldedId('kala', ['kala.1', 'kala.3'])).toBe('kala.4');
  });
});

describe('input rules', () => {
  const bad = ['кaya', 'ka​ya', '../x', 'unda2', 'qat', 'a\\b'];
  it.each(bad)('rejects %j as a headword', (h) => {
    expect(PAYLOADS.word_addition.safeParse({ headword: h, meaning_en: 'x' }).success).toBe(false);
  });
  it('accepts Digo spellings and normalises the apostrophe', () => {
    const r = PAYLOADS.spelling_variant.safeParse({ form: 'ng’ombe', kind: 'spelling' });
    expect(r.success && r.data.form).toBe("ng'ombe");
    expect(PAYLOADS.word_addition.safeParse({ headword: 'mwanáo', meaning_en: 'your child' }).success).toBe(true);
  });
  it('takes a numeric sense id only', () => {
    expect(PAYLOADS.example_sentence.safeParse({ sense_id: '1', dg: 'x' }).success).toBe(true);
    expect(PAYLOADS.example_sentence.safeParse({ sense_id: '../1', dg: 'x' }).success).toBe(false);
  });
});

describe('dictionary overlay merge', () => {
  it('applies edits, adds new words in code-point order, and skips words already folded', async () => {
    const { mergeLetter } = await import('@/lib/dictionary/loader');
    const data = structuredClone(letter);
    const target = data.entries[5];
    const ex = change({ type: 'example_sentence', target_id: target.id, final_payload: { sense_id: String(target.senses[0].sense_id), dg: 'Mfwano', en: 'Example' } });
    const add = change({ type: 'word_addition', target_id: null as unknown as string, final_payload: { headword: 'mzzzz', meaning_en: 'test word' } });
    const out = mergeLetter('m', data, [ex, add]);
    expect(out.count).toBe(data.entries.length + 1);
    expect(out.entries.find((e) => e.id === target.id)!.senses[0].examples.at(-1)!.dg).toBe('Mfwano');
    const keys = out.entries.map((e) => e.sort_key);
    expect(keys).toEqual([...keys].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0)));
    expect(out.entries.find((e) => e.id === `c:${add.contribution_id}`)).toMatchObject({ headword: 'mzzzz', provisional: true });
    // Once folded (its provenance is in the file), the provisional copy is not added again.
    const folded = structuredClone(data);
    folded.entries.push({ ...wordAdditionEntry(add, 'mzzzz') });
    expect(mergeLetter('m', folded, [add]).entries.filter((e) => e.headword === 'mzzzz')).toHaveLength(1);
    // Changes for other letter files leave this one untouched.
    expect(mergeLetter('a', structuredClone(data), [ex])).toEqual(structuredClone(data));
  });
});
