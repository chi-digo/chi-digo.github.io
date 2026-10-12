import { describe, expect, it } from 'vitest';
import { safeText, isSafeText, normaliseDigo, hasPII, safeJsonForScript, stableStringify } from '@/lib/contributions/text';

describe('safeText', () => {
  it('accepts ordinary trilingual text, including Digo apostrophes and newlines', () => {
    expect(safeText(100).safeParse("Mng'ambo wa mutsu\nunaphahikana").success).toBe(true);
  });
  it.each([
    ['markup', '<script>alert(1)</script>'],
    ['closing angle', 'a > b'],
    ['control character', 'a\u0007b'],
    ['bidi override', 'abc‮def'],
    ['bidi isolate', 'abc⁦def'],
  ])('rejects %s', (_label, text) => {
    expect(isSafeText(text)).toBe(false);
    expect(safeText(100).safeParse(text).success).toBe(false);
  });
  it('enforces length and emptiness', () => {
    expect(safeText(5).safeParse('abcdef').success).toBe(false);
    expect(safeText(5).safeParse('   ').success).toBe(false);
  });
});

describe('normaliseDigo', () => {
  it('ignores case, apostrophe variants, ng\'/ng and dz/z', () => {
    expect(normaliseDigo("Ng’ombe")).toBe(normaliseDigo("ngombe"));
    expect(normaliseDigo('Mudzwi')).toBe(normaliseDigo('muzwi'));
    expect(normaliseDigo('  mutsu  ')).toBe('mutsu');
  });
  it('keeps different words apart', () => {
    expect(normaliseDigo('mutsu')).not.toBe(normaliseDigo('mutswa'));
  });
});

describe('hasPII', () => {
  it.each(['call 0712 345 678', '+254 712-345-678', 'mail me@x.co', 'see https://spam.example', 'www.x.com', 'dm @handle'])(
    'flags %s',
    (t) => expect(hasPII(t)).toBe(true),
  );
  it('leaves ordinary text alone', () => {
    expect(hasPII('Mutsu unamera pwani, miti 3 hadi 4')).toBe(false);
  });
});

describe('safeJsonForScript (SEC-1)', () => {
  it('cannot close the script tag', () => {
    const out = safeJsonForScript({ name: '</script><script>alert(1)</script>', amp: 'a&b', ls: '\u2028\u2029' });
    expect(out).not.toMatch(/<|>|&|\u2028|\u2029/);
    expect(JSON.parse(out)).toEqual({ name: '</script><script>alert(1)</script>', amp: 'a&b', ls: '\u2028\u2029' });
  });
});

describe('stableStringify', () => {
  it('is independent of key order and drops undefined', () => {
    expect(stableStringify({ b: 1, a: [1, { d: 2, c: 3 }], x: undefined })).toBe(stableStringify({ a: [1, { c: 3, d: 2 }], b: 1 }));
  });
});
