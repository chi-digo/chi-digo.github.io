/**
 * Proverb appliers (spec 34 §16 v2): apply, idempotency, conflicts, exact-byte unapply, two stories on
 * one field reverted in either order, empty fields, new proverbs, slugs and input rules.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import {
  applyProverb, unapplyProverb, proverbAdditionEntry, proverbFieldBase, meaningField, contextField, paragraphCredits, PROVERB_KEYS, type ProverbEntry,
} from '@/lib/contributions/apply/proverbs';
import { ConflictError, type Change } from '@/lib/contributions/apply/types';
import { proverbSlug, NEW_PROVERB_SLUG } from '@/lib/proverbs/slug';
import { PAYLOADS } from '@/lib/contributions/schemas';

const list: ProverbEntry[] = JSON.parse(readFileSync(join(process.cwd(), 'public/data/proverbs/index.json'), 'utf-8'));
const fixture = (id = 'p-001') => structuredClone(list.find((p) => p.id === id)!);
const bytes = (x: unknown) => JSON.stringify(x);
const change = (over: Partial<Change> & Pick<Change, 'type' | 'final_payload'>): Change =>
  ({ contribution_id: crypto.randomUUID(), target_id: 'p-001', outcome: 'replace', region: 'tanga', confidence: 'native', ...over }) as Change;

describe('proverb_meaning', () => {
  it('replaces with a base, marks it community, and unapplies to the exact bytes', () => {
    const p = fixture();
    const f = meaningField('idiomatic', 'en');
    const c = change({ type: 'proverb_meaning', final_payload: { lang: 'en', kind: 'idiomatic', mode: 'replace', text: 'Everyone is clever in their own way' }, base: { value: proverbFieldBase(p, f) } });
    const a = applyProverb(p, c);
    expect(a.idiomatic_en).toBe('Everyone is clever in their own way');
    expect(a.field_sources[f]).toBe('community');
    expect(Object.keys(a).slice(0, 31)).toEqual([...PROVERB_KEYS]);
    expect(applyProverb(a, c)).toBe(a);
    expect(bytes(unapplyProverb(a, c))).toBe(bytes(p));
  });

  it('fills an empty field and deletes the added source key on undo', () => {
    const p = fixture('p-123');
    const f = meaningField('idiomatic', 'dg');
    expect(p.field_sources[f]).toBeUndefined();
    const c = change({ target_id: 'p-123', type: 'proverb_meaning', final_payload: { lang: 'dg', kind: 'idiomatic', mode: 'replace', text: 'Maana' }, base: { value: proverbFieldBase(p, f) } });
    const a = applyProverb(p, c);
    expect(bytes(unapplyProverb(a, c))).toBe(bytes(p));
  });

  it('conflicts without a base or with a stale one', () => {
    const p = fixture();
    expect(() => applyProverb(p, change({ type: 'proverb_meaning', final_payload: { lang: 'en', kind: 'idiomatic', mode: 'replace', text: 'x' }, base: null }))).toThrow(ConflictError);
    expect(() => applyProverb(p, change({ type: 'proverb_meaning', final_payload: { lang: 'en', kind: 'idiomatic', mode: 'replace', text: 'x' }, base: { value: { text: 'other', source: 'original' } } }))).toThrow(ConflictError);
  });
});

describe('proverb_context', () => {
  const story = (t: string) => change({ type: 'proverb_context', final_payload: { lang: 'en', text: t } });

  it('appends paragraphs and keeps the field source', () => {
    const p = fixture();
    const before = p.field_sources.commentary_en;
    const a = applyProverb(p, story('Said at weddings.'));
    expect(a.commentary_en.endsWith('\n\nSaid at weddings.')).toBe(true);
    expect(a.field_sources.commentary_en).toBe(before);
  });

  it.each([['first', 'second'], ['second', 'first']])('two stories reverted %s then %s come back to the exact bytes', (x, y) => {
    const p = fixture();
    const base = { value: proverbFieldBase(p, contextField('en')) };
    const s1 = { ...story('First story.'), base };
    const s2 = { ...story('Second story.'), base };
    const both = applyProverb(applyProverb(p, s1), s2);
    const order = x === 'first' ? [s1, s2] : [s2, s1];
    const mid = unapplyProverb(both, order[0]);
    expect(mid.commentary_en).toContain(order[1] === s1 ? 'First story.' : 'Second story.');
    expect(bytes(unapplyProverb(mid, order[1]))).toBe(bytes(p));
  });

  it('credits each story under its own paragraphs', () => {
    const p = fixture();
    const s1 = story('One.\n\nTwo.');
    const s2 = story('Three.');
    const a = applyProverb(applyProverb(p, s1), s2);
    const credits = paragraphCredits(a.commentary_en, a.provenance?.commentary_en);
    expect(credits.slice(-3).map((x) => x.c)).toEqual([s1.contribution_id, s1.contribution_id, s2.contribution_id]);
    expect(credits.slice(0, -3).every((x) => x.c === null)).toBe(true);
    const mid = unapplyProverb(a, s1);
    expect(paragraphCredits(mid.commentary_en, mid.provenance?.commentary_en).at(-1)!.c).toBe(s2.contribution_id);
  });

  it('fills an empty commentary as community and undoes it exactly', () => {
    const p = fixture('p-123');
    const c = { ...change({ target_id: 'p-123', type: 'proverb_context', final_payload: { lang: 'dg', text: 'Inagombwa harusini.' } }), base: { value: proverbFieldBase(p, contextField('dg')) } };
    const a = applyProverb(p, c);
    expect(a.commentary_dg).toBe('Inagombwa harusini.');
    expect(a.field_sources.commentary_dg).toBe('community');
    expect(bytes(unapplyProverb(a, c))).toBe(bytes(p));
  });
});

describe('proverb_variant', () => {
  it('adds and removes a regional form', () => {
    const p = fixture();
    const c = change({ type: 'proverb_variant', final_payload: { form: 'Achili ni nyere', note: '' } });
    const a = applyProverb(p, c);
    expect(a.variants.at(-1)).toEqual({ form: 'Achili ni nyere', note: '', region: 'tanga', c: c.contribution_id });
    expect(bytes(unapplyProverb(a, c))).toBe(bytes(p));
  });
});

describe('new proverbs', () => {
  it('builds a provisional proverb and the folded one with the reserved id', () => {
    const c = change({ type: 'proverb_addition', target_id: null as unknown as string, final_payload: {
      digo: 'Mvula ya ’kare tainyesa', meaning_en: 'Old rain does not fall', usage: 'Said to people who live in the past.', usage_lang: 'en', mature: false,
    } });
    const prov = proverbAdditionEntry(c);
    expect(prov.id).toBe(`c:${c.contribution_id}`);
    expect(prov.slug).toMatch(/^p-c-[0-9a-f]{8}$/);
    expect(prov.provisional).toBe(true);
    const folded = proverbAdditionEntry(c, 'p-388');
    expect(folded.slug).toBe('p-388-mvula-ya-kare-tainyesa');
    expect(folded.source_number).toBe(388);
    expect(folded.provisional).toBeUndefined();
    expect(folded.commentary_en).toBe('Said to people who live in the past.');
    expect(Object.keys(folded).slice(0, 31)).toEqual([...PROVERB_KEYS]);
    expect(folded.content_flag).toBeNull();
  });

  it('makes safe slugs', () => {
    expect(proverbSlug('p-400', 'Gongolo na chigongoche/mlalawe')).toBe('p-400-gongolo-na-chigongoche-mlalawe');
    expect(proverbSlug('p-401', 'Mwanáo ni mwanáo?')).toBe('p-401-mwanao-ni-mwanao');
    expect(NEW_PROVERB_SLUG.test(proverbSlug('p-402', '../../etc'))).toBe(true);
  });
});

describe('proverb input rules', () => {
  it('accepts every shipped proverb text as a Digo proverb', () => {
    for (const p of list) expect(PAYLOADS.proverb_variant.safeParse({ form: p.digo }).success, p.id).toBe(true);
  });
  it.each(['Mvula1', 'ka​ya', '<b>x</b>', 'кaya'])('rejects %j', (t) => {
    expect(PAYLOADS.proverb_variant.safeParse({ form: t }).success).toBe(false);
  });
  it('needs a language for usage and refuses a literal Digo meaning', () => {
    expect(PAYLOADS.proverb_addition.safeParse({ digo: 'Mvula', meaning_en: 'x', usage: 'y' }).success).toBe(false);
    expect(PAYLOADS.proverb_meaning.safeParse({ lang: 'dg', kind: 'literal', text: 'x' }).success).toBe(false);
  });
  it('caps paragraphs', () => {
    expect(PAYLOADS.proverb_context.safeParse({ lang: 'en', text: Array(6).fill('para').join('\n\n') }).success).toBe(false);
  });
});

describe('proverb overlay merge', () => {
  it('applies edits, appends new proverbs, hides test changes, and skips folded ones', async () => {
    const { mergeProverbs } = await import('@/lib/proverbs/loader');
    const shipped = structuredClone(list);
    const v = change({ type: 'proverb_variant', final_payload: { form: 'Achili ni nyere', note: '' } });
    const add = change({ type: 'proverb_addition', target_id: null as unknown as string, final_payload: { digo: 'Mvula ya kare', meaning_en: 'old rain' } });
    const test = change({ type: 'proverb_addition', target_id: '__test__', final_payload: { digo: '__test__', meaning_en: 'x' } });
    const out = mergeProverbs(shipped, [v, add, test]);
    expect(out).toHaveLength(list.length + 1);
    expect(out.find((p) => p.id === 'p-001')!.variants.at(-1)!.form).toBe('Achili ni nyere');
    expect(out.at(-1)!.slug).toMatch(/^p-c-/);
    expect(out.some((p) => p.digo === '__test__')).toBe(false);
    const folded = [...structuredClone(list), proverbAdditionEntry(add, 'p-388')];
    expect(mergeProverbs(folded, [add]).filter((p) => p.digo === 'Mvula ya kare')).toHaveLength(1);
  });

  it('keeps the overlay and database allow-lists for proverbs the same', async () => {
    const { publicPayload } = await import('@/lib/contributions/overlay');
    const sql = readFileSync(join(process.cwd(), 'supabase/migrations/20261024000000_proverb_contributions.sql'), 'utf-8');
    for (const type of ['proverb_addition', 'proverb_variant', 'proverb_meaning', 'proverb_context'] as const) {
      const m = new RegExp(`when '${type}' then array\\[([^\\]]*)\\]`).exec(sql)!;
      const dbFields = m[1].split(',').map((x) => x.trim().replace(/'/g, '')).sort();
      const all = Object.fromEntries([...dbFields, 'reason', 'detail', 'extra'].map((k) => [k, 'x']));
      expect(Object.keys(publicPayload(type, all)).sort(), type).toEqual(dbFields);
    }
  });
});
