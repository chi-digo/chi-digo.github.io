/**
 * Fixing dictionary examples and equivalents (spec 34 §20): the anchor that finds an example without ids,
 * apply and undo to the exact bytes (a missing translation added and removed again), lists, the live
 * overlay's public payload, the list rules, and fold-in then undo on a temporary checkout.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { cpSync, mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'fs';
import { execFileSync } from 'child_process';
import { tmpdir } from 'os';
import { join } from 'path';
import { applyWord, unapplyWord, exampleKey, findExample, exampleBase, newEntry, newSense, type WordEntry } from '@/lib/contributions/apply/words';
import { ConflictError, type Change } from '@/lib/contributions/apply/types';
import { publicPayload } from '@/lib/contributions/overlay';
import { equivalentsProblem } from '@/lib/contributions/review';

const ex = (dg: string, en: string, sw?: string) => ({ dg, en, source: 'generated', ...(sw !== undefined && { sw }) }) as never;
const entry = () => newEntry({
  id: 'mama', headword: 'mama', sort_key: 'mama', equivalents_sw: ['mama', 'mzazi, mlezi'], equivalents_en: ['mother'],
  senses: [newSense(1, { examples: [ex('Mama yuko.', 'Mother is there.', 'Mama yuko.'), ex('Mama ariphokpwedza.', 'When mother came.')] })],
}) as WordEntry;
const fix = (e: WordEntry, i: number, next: { dg?: string; en?: string; sw?: string }): Change => {
  const x = e.senses[0].examples[i];
  return {
    contribution_id: `00000000-0000-4000-8000-00000000000${i}`, type: 'example_fix', target_id: e.id, outcome: 'replace',
    final_payload: { sense_id: '1', index: i, dg_key: exampleKey(x.dg), dg: next.dg ?? x.dg, en: next.en ?? x.en, sw: next.sw ?? x.sw ?? '', lang: 'sw' },
    base: { value: exampleBase(x) },
  };
};

describe('finding an example', () => {
  it('by its place, or by its sentence once examples moved; never when two match', () => {
    const list = [{ dg: 'a' }, { dg: 'b' }, { dg: 'c' }];
    expect(findExample(list, 1, exampleKey('b'))).toBe(list[1]);
    expect(findExample([{ dg: 'z' }, ...list], 1, exampleKey('b'))).toEqual({ dg: 'b' });
    expect(findExample([{ dg: 'b' }, { dg: 'b' }], 5, exampleKey('b'))).toBeNull();
    expect(findExample(list, 0, exampleKey('missing'))).toBeNull();
  });
});

describe('example fix', () => {
  it('changes all three languages together and undoes to the exact bytes', () => {
    const e = entry();
    const c = fix(e, 0, { dg: 'Mama yudze.', en: 'Mother came.', sw: 'Mama amekuja.' });
    const done = applyWord(e, c);
    expect(done.senses[0].examples[0]).toMatchObject({ dg: 'Mama yudze.', en: 'Mother came.', sw: 'Mama amekuja.' });
    expect(Object.keys(done.senses[0].examples[0])).toEqual(['dg', 'en', 'source', 'sw']);
    expect(JSON.stringify(unapplyWord(done, c))).toBe(JSON.stringify(e));
  });

  it('adds a missing Swahili translation, and undo removes the key again', () => {
    const e = entry();
    const c = fix(e, 1, { sw: 'Mama alipokuja.' });
    const done = applyWord(e, c);
    expect(done.senses[0].examples[1].sw).toBe('Mama alipokuja.');
    expect(JSON.stringify(unapplyWord(done, c))).toBe(JSON.stringify(e));
  });

  it('still finds its example after one was added before it', () => {
    const e = entry();
    const c = fix(e, 1, { sw: 'Mama alipokuja.' });
    const moved = { ...e, senses: [{ ...e.senses[0], examples: [ex('Mpya.', 'New.'), ...e.senses[0].examples] }] } as WordEntry;
    expect(applyWord(moved, c).senses[0].examples[2].sw).toBe('Mama alipokuja.');
  });

  it('conflicts when the example changed since', () => {
    const e = entry();
    const c = fix(e, 0, { sw: 'Mama yupo.' });
    const changed = applyWord(e, { ...fix(e, 0, { en: 'Mother is here.' }), contribution_id: '00000000-0000-4000-8000-0000000000aa' });
    expect(() => applyWord(changed, c)).toThrow(ConflictError);
  });

  it('applies live from the public payload alone (the overlay strips private fields)', () => {
    const e = entry();
    const c = fix(e, 0, { sw: 'Mama yupo.' });
    const live = { ...c, final_payload: publicPayload('example_fix', { ...c.final_payload, reason: 'secret' }) };
    expect(live.final_payload.reason).toBeUndefined();
    expect(applyWord(e, live).senses[0].examples[0].sw).toBe('Mama yupo.');
  });
});

describe('equivalents fix', () => {
  it('replaces the list (an item may hold a comma) and undoes it exactly', () => {
    const e = entry();
    const c: Change = {
      contribution_id: '00000000-0000-4000-8000-0000000000e1', type: 'equivalents_fix', target_id: 'mama', outcome: 'replace',
      final_payload: { lang: 'sw', items: ['mama', 'mzazi, mlezi', 'bibi'] }, base: { value: { list: ['mama', 'mzazi, mlezi'] } },
    };
    const done = applyWord(e, c);
    expect(done.equivalents_sw).toEqual(['mama', 'mzazi, mlezi', 'bibi']);
    expect(JSON.stringify(unapplyWord(done, c))).toBe(JSON.stringify(e));
  });

  it('follows the list rules, leaving long legacy items alone', () => {
    const legacy = ['a definition-like legacy item that is much longer than sixty characters in all'];
    expect(equivalentsProblem(legacy, [...legacy, 'mpya'])).toBeNull();
    expect(equivalentsProblem(['a'], ['a'])).toBe('unchanged');
    expect(equivalentsProblem(['a'], ['a', 'A'])).toBe('duplicate');
    expect(equivalentsProblem(['a'], ['a', 'x'.repeat(61)])).toBe('too_long');
    expect(equivalentsProblem(['a'], Array.from({ length: 9 }, (_, i) => `w${i}`))).toBe('too_many');
  });
});

/* ----- Fold-in on a temporary checkout ----- */

const ROOT = process.cwd();
const tsx = join(ROOT, 'node_modules/.bin/tsx');
let dir: string;
let before: Map<string, string>;
const snapshot = (d: string) =>
  new Map(readdirSync(join(d, 'public/data')).filter((f) => f.endsWith('.json') && f !== 'data-version.json')
    .map((f) => [f, readFileSync(join(d, 'public/data', f), 'utf-8')]));
function run(rows: unknown[], tag: string) {
  const inPath = join(dir, `claimed-${tag}.json`);
  const outPath = join(dir, `results-${tag}.json`);
  writeFileSync(inPath, JSON.stringify({ nonce: '00000000-0000-0000-0000-000000000000', rows }));
  execFileSync(tsx, ['scripts/fold-in/apply.ts', '--data', dir, '--in', inPath, '--out', outPath], { cwd: ROOT });
  execFileSync(tsx, ['scripts/dictionary/build-index.ts', '--root', dir], { cwd: ROOT });
  execFileSync(tsx, ['scripts/dictionary/build-index.ts', '--root', dir, '--check'], { cwd: ROOT });
  return JSON.parse(readFileSync(outPath, 'utf-8'));
}
beforeAll(() => {
  dir = mkdtempSync(join(tmpdir(), 'fold-dictfix-'));
  mkdirSync(join(dir, 'content/plants'), { recursive: true });
  cpSync(join(ROOT, 'public/data'), join(dir, 'public/data'), { recursive: true });
  cpSync(join(ROOT, 'content/plants/plants.json'), join(dir, 'content/plants/plants.json'));
  before = snapshot(dir);
});
afterAll(() => rmSync(dir, { recursive: true, force: true }));

describe('fold-in for example and equivalents fixes', { timeout: 60_000 }, () => {
  it('folds both, searches by the new Swahili word, then undoes to the exact bytes', () => {
    const m = JSON.parse(readFileSync(join(dir, 'public/data/m.json'), 'utf-8')) as { entries: WordEntry[] };
    const e = m.entries.find((x) => x.id === 'machi-')!;
    const x = e.senses.flatMap((s) => s.examples.map((ex, i) => ({ s: s.sense_id, i, ex })))[0];
    const common = { outcome: 'replace', region: null, confidence: null, edited: false, live_status: 'live', target_type: 'word', target_id: e.id };
    const rows = [
      { ...common, id: '00000000-0000-4000-8000-000000000f01', type: 'example_fix', target_path: `senses.${x.s}.examples.${x.i}`,
        final_payload: { sense_id: String(x.s), index: x.i, dg_key: exampleKey(x.ex.dg), dg: x.ex.dg, en: x.ex.en, sw: 'Sentensi mpya ya majaribio.', lang: 'sw' },
        base: { value: exampleBase(x.ex) } },
      { ...common, id: '00000000-0000-4000-8000-000000000f02', type: 'equivalents_fix', target_path: 'equivalents_sw',
        final_payload: { lang: 'sw', items: [...e.equivalents_sw, 'nenojipyalamajaribio'] }, base: { value: { list: e.equivalents_sw } } },
    ];
    const r1 = run(rows, 'apply');
    expect(r1.failed).toEqual([]);
    expect(r1.applied).toHaveLength(2);
    const reverse = JSON.parse(readFileSync(join(dir, 'public/data/reverse-sw.json'), 'utf-8'));
    expect(reverse['nenojipyalamajaribio']).toEqual([['m', 'machi-']]);
    const r2 = run(rows.map((r) => ({ ...r, live_status: 'reverting' })).reverse(), 'undo');
    expect(r2.failed).toEqual([]);
    expect(r2.reverted).toHaveLength(2);
    const after = snapshot(dir);
    for (const [f, text] of before) expect(after.get(f), f).toBe(text);
  });
});
