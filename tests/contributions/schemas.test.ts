import { describe, expect, it } from 'vitest';
import { PAYLOADS, TYPES, TYPE_SCOPE, submitSchema, reviewSchema } from '@/lib/contributions/schemas';

const valid: Record<string, unknown> = {
  word_addition: { headword: 'fyombera', meaning_en: 'to climb' },
  definition_update: { sense_id: '1', lang: 'en', text: 'to climb (a tree)', mode: 'replace' },
  example_sentence: { sense_id: '1', dg: 'Anafyombera mnazi', en: 'He climbs the coconut palm' },
  spelling_variant: { form: 'kpwera', kind: 'dialect' },
  entry_flag: { reason: 'wrong_meaning' },
  proverb_addition: { digo: 'Haraka haraka taina baraka' },
  proverb_variant: { form: 'Haraka taina baraka' },
  proverb_meaning: { lang: 'sw', text: 'Haraka haina baraka', kind: 'idiomatic' },
  proverb_context: { text: 'Said to children who rush their chores' },
  plant_name: { name: 'mutsu', choice: 'other' },
  plant_info: { section: 'uses', lang: 'dg', mode: 'add', text: 'Makodzage ganahumirwa kuphika' },
  plant_addition: { english: 'Wild yam', description: 'A climbing plant' },
  translation_fix: { lang: 'dg', current: 'old', proposed: 'new' },
  general_feedback: { text: 'The search is slow' },
};

describe('payload schemas', () => {
  it('has a schema, a scope and a valid example for every type', () => {
    for (const t of TYPES) {
      expect(TYPE_SCOPE[t]).toBeTruthy();
      expect(PAYLOADS[t].safeParse(valid[t]).success, t).toBe(true);
    }
  });
  it('requires a meaning for new words and a name for new plants', () => {
    expect(PAYLOADS.word_addition.safeParse({ headword: 'x' }).success).toBe(false);
    expect(PAYLOADS.plant_addition.safeParse({ description: 'x' }).success).toBe(false);
  });
  it('rejects markup in any free-text field', () => {
    expect(PAYLOADS.plant_name.safeParse({ name: '<b>x</b>', choice: 'other' }).success).toBe(false);
    expect(PAYLOADS.plant_info.safeParse({ section: 'uses', lang: 'en', mode: 'add', text: 'a<img src=x>' }).success).toBe(false);
  });
  it('rejects unknown sections and sense ids with odd characters', () => {
    expect(PAYLOADS.plant_info.safeParse({ section: 'evil', lang: 'en', mode: 'add', text: 'x' }).success).toBe(false);
    expect(PAYLOADS.example_sentence.safeParse({ sense_id: '../x', dg: 'x' }).success).toBe(false);
  });
});

describe('submitSchema', () => {
  it('defaults credit to off', () => {
    const r = submitSchema.parse({ type: 'general_feedback', payload: { text: 'x' }, locale: 'en' });
    expect(r.credit_opt_in).toBe(false);
  });
  it('rejects unknown regions and locales', () => {
    expect(submitSchema.safeParse({ type: 'general_feedback', payload: {}, locale: 'de' }).success).toBe(false);
    expect(submitSchema.safeParse({ type: 'general_feedback', payload: {}, locale: 'en', region: 'mombasa' }).success).toBe(false);
  });
});

describe('reviewSchema', () => {
  it('accepts the review actions and rejects others', () => {
    expect(reviewSchema.safeParse({ action: 'accept_variant' }).success).toBe(true);
    expect(reviewSchema.safeParse({ action: 'publish' }).success).toBe(false);
  });
});
