import { describe, expect, it } from 'vitest';
import { changedChars, digoText, warningsFor } from '@/lib/contributions/review';

describe('changedChars', () => {
  it('measures the edited span', () => {
    expect(changedChars('abcdef', 'abcdef')).toBe(0);
    expect(changedChars('the tree grows', 'the palm grows')).toBe(4);
    expect(changedChars('', 'x'.repeat(301))).toBe(301);
  });
});

describe('Digo checks', () => {
  it('only checks Digo text', () => {
    expect(digoText('plant_info', { lang: 'en', text: 'chichaka' })).toEqual([]);
    expect(digoText('plant_info', { lang: 'dg', text: 'chichaka' })).toEqual(['chichaka']);
    expect(digoText('plant_name', { name: 'mutsu' })).toEqual(['mutsu']);
  });
  it('finds ruled-out forms and PII', () => {
    const w = warningsFor('plant_info', { lang: 'dg', mode: 'add', text: 'Ni chichaka, piga 0712 345 678' });
    expect(w.ruled_out.map((h) => h.right)).toContain('chitsaka / vitsaka');
    expect(w.pii).toBe(true);
  });
});
