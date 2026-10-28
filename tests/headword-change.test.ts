/**
 * "Make this the headword" (spec 34 §18): the applier live (in place) and at fold-in (new id), its undo
 * to the exact bytes, conflicts, reserved ids, and fold-in on a temporary checkout. Two entries move to
 * another letter file (one from an out-of-order tie, one becoming a homonym), with another change on the
 * entry in the same run and a later revert addressed by the old id. Undoing everything gives back every
 * data file byte for byte (data-version.json excepted), with check:dictionary passing at each step.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { cpSync, mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'fs';
import { execFileSync } from 'child_process';
import { tmpdir } from 'os';
import { join } from 'path';
import {
  applyWord, unapplyWord, foldedId, reservedIds, formerHeadwords, newEntry, FORMER_HEADWORD, type WordEntry,
} from '@/lib/contributions/apply/words';
import { ConflictError, type Change } from '@/lib/contributions/apply/types';

const V = '00000000-0000-4000-8000-0000000000f1';
const H = '00000000-0000-4000-8000-0000000000f2';

function entry(): WordEntry {
  const e = newEntry({ id: 'mnazi.1', headword: 'mnazi', homonym_index: 1, sort_key: 'mnazi' });
  return applyWord(
    { ...e, variants: [{ form: 'mnaz', dialect: '', note: null }] } as WordEntry,
    { contribution_id: V, type: 'spelling_variant', target_id: e.id, final_payload: { form: 'mnadzi', kind: 'dialect' }, outcome: 'replace', region: 'kinondo_diani' },
  );
}
const promote = (e: WordEntry, over: Partial<Change> = {}): Change => ({
  contribution_id: H, type: 'headword_change', target_id: e.id, final_payload: { form: 'mnadzi', variant: V }, outcome: null,
  base: { value: { headword: e.headword, id: e.id, homonym_index: e.homonym_index, sort_key: e.sort_key, file: 'm', after: null } },
  ...over,
});

describe('headword change applier', () => {
  it('live, changes only the headword; the old headword becomes a former form', () => {
    const e = entry();
    const live = applyWord(e, promote(e));
    expect(live.headword).toBe('mnadzi');
    expect([live.id, live.sort_key, live.homonym_index]).toEqual(['mnazi.1', 'mnazi', 1]);
    expect(live.variants.map((v) => v.form)).toEqual(['mnaz', 'mnazi']);
    const former = formerHeadwords(live)[0];
    expect(former).toMatchObject({ form: 'mnazi', note: FORMER_HEADWORD, c: H, was_after: 'mnaz', id_was: 'mnazi.1' });
    expect(former.was).toMatchObject({ form: 'mnadzi', c: V });
    expect(live.provenance?.headword?.[0].c).toBe(H);
    expect(live.provenance?.variants?.[0].c).toBe(V);
    expect(applyWord(live, promote(e))).toBe(live); // idempotent
  });

  it('at fold-in, takes the new id; undo gives back the exact entry', () => {
    const e = entry();
    const moved = applyWord(e, promote(e), { newId: 'mnadzi.2' });
    expect([moved.id, moved.sort_key, moved.homonym_index]).toEqual(['mnadzi.2', 'mnadzi', 2]);
    expect(Object.keys(moved)).toEqual(Object.keys(e));
    const back = unapplyWord(moved, promote(e));
    expect(JSON.stringify(back)).toBe(JSON.stringify(e));
  });

  it('puts the form back after the form it followed, even if others changed around it', () => {
    const e = entry();
    const moved = applyWord(e, promote(e), { newId: 'mnadzi' });
    // Another form was added after the promotion; the one it followed is still there.
    const more = { ...moved, variants: [...moved.variants, { form: 'mnadhi', dialect: '', note: null }] } as WordEntry;
    const back = unapplyWord(more, promote(e));
    expect(back.variants.map((v) => v.form)).toEqual(['mnaz', 'mnadzi', 'mnadhi']);
  });

  it('conflicts when the form is gone or the headword changed', () => {
    const e = entry();
    const gone = { ...e, variants: e.variants.filter((v) => v.form !== 'mnadzi') } as WordEntry;
    expect(() => applyWord(gone, promote(e))).toThrow(ConflictError);
    const renamed = { ...e, headword: 'mnazii' } as WordEntry;
    expect(() => applyWord(renamed, promote(e))).toThrow(ConflictError);
    expect(() => applyWord(e, promote(e, { base: null }))).toThrow(ConflictError);
    const moved = applyWord(e, promote(e), { newId: 'mnadzi' });
    expect(() => unapplyWord({ ...moved, headword: 'other' } as WordEntry, promote(e))).toThrow(ConflictError);
  });

  it('never hands a former id to another word', () => {
    const moved = applyWord(entry(), promote(entry()), { newId: 'mnadzi' });
    expect(reservedIds([moved])).toEqual(['mnazi.1']);
    expect(foldedId('mnazi', ['mnadzi', ...reservedIds([moved])])).toBe('mnazi.2');
  });

  it('keeps a region an earlier headword change recorded', () => {
    const e = entry();
    const first = applyWord(e, promote(e), { newId: 'mnadzi' });
    const V2 = '00000000-0000-4000-8000-0000000000f3';
    const withForm = applyWord(first, { contribution_id: V2, type: 'spelling_variant', target_id: 'mnadzi', final_payload: { form: 'mnadhi', kind: 'spelling' }, outcome: 'replace', region: null });
    const second = applyWord(withForm, {
      contribution_id: '00000000-0000-4000-8000-0000000000f4', type: 'headword_change', target_id: 'mnadzi', outcome: null,
      final_payload: { form: 'mnadhi', variant: V2 },
      base: { value: { headword: 'mnadzi', id: 'mnadzi', homonym_index: null, sort_key: 'mnadzi', file: 'm', after: null } },
    }, { newId: 'mnadhi' });
    expect(formerHeadwords(second).find((v) => v.form === 'mnadzi')?.dialect).toBe('kinondo_diani');
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
const letter = (f: string) => JSON.parse(readFileSync(join(dir, 'public/data', `${f}.json`), 'utf-8')) as { count: number; entries: WordEntry[] };

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
  dir = mkdtempSync(join(tmpdir(), 'fold-headword-'));
  mkdirSync(join(dir, 'content/plants'), { recursive: true });
  cpSync(join(ROOT, 'public/data'), join(dir, 'public/data'), { recursive: true });
  cpSync(join(ROOT, 'content/plants/plants.json'), join(dir, 'content/plants/plants.json'));
  before = snapshot(dir);
});
afterAll(() => rmSync(dir, { recursive: true, force: true }));

describe('fold-in for headword changes', () => {
  it('moves entries to their new letter file and id, then undoes to the exact bytes', () => {
    const b = letter('b');
    const ids = b.entries.map((e) => e.id);
    // `baha` sits after baha.1–3 (an out-of-order tie): undo must put it back exactly there.
    const one = b.entries[ids.indexOf('baha')];
    const two = b.entries[ids.indexOf('bahari')];
    const common = { outcome: 'replace', region: 'kwale_south', confidence: 'native', edited: false, live_status: 'live', target_type: 'word' };
    const id = (k: number) => `00000000-0000-4000-8000-0000000001${String(k).padStart(2, '0')}`;
    const base = (e: WordEntry) => ({ value: { headword: e.headword, id: e.id, homonym_index: e.homonym_index, sort_key: e.sort_key, file: 'b', after: ids[ids.indexOf(e.id) - 1] ?? null } });
    const rows = [
      { ...common, id: id(1), type: 'spelling_variant', target_id: one.id, target_path: 'variants', final_payload: { form: '-tsahatest', kind: 'spelling' }, base: null },
      { ...common, id: id(2), type: 'example_sentence', target_id: one.id, target_path: 'senses.1.examples',
        final_payload: { sense_id: String(one.senses[0].sense_id), dg: 'Ni mfano.', en: 'An example.' }, base: null },
      // An existing headword: the entry becomes its homonym.
      { ...common, id: id(3), type: 'spelling_variant', target_id: two.id, target_path: 'variants', final_payload: { form: 'tsaha', kind: 'dialect' }, base: null },
      { ...common, id: id(4), type: 'headword_change', target_id: one.id, target_path: null, outcome: null, final_payload: { form: '-tsahatest', variant: id(1) }, base: base(one) },
      { ...common, id: id(5), type: 'headword_change', target_id: two.id, target_path: null, outcome: null, final_payload: { form: 'tsaha', variant: id(3) }, base: base(two) },
    ];
    // Claimed in review order, but the headword changes come after the change made in the same run.
    const r1 = run([rows[3], ...rows.slice(0, 3), rows[4]], 'apply');
    expect(r1.failed).toEqual([]);
    expect(r1.conflict).toEqual([]);
    expect(r1.applied).toHaveLength(5);
    expect(r1.target_ids[id(4)]).toBe('tsahatest');
    expect(r1.target_ids[id(5)]).toMatch(/^tsaha\.\d+$/);

    const ts = letter('ts');
    const movedOne = ts.entries.find((e) => e.id === 'tsahatest')!;
    expect(movedOne.headword).toBe('-tsahatest');
    expect(movedOne.senses[0].examples.at(-1)?.dg).toBe('Ni mfano.');
    expect(formerHeadwords(movedOne)[0]).toMatchObject({ form: '-baha', id_was: 'baha' });
    expect(letter('b').entries.some((e) => e.id === 'baha' || e.id === 'bahari')).toBe(false);
    const variants = JSON.parse(readFileSync(join(dir, 'public/data/variants.json'), 'utf-8'));
    expect(variants['-baha']).toBe('tsahatest');
    expect(variants['bahari']).toBe(r1.target_ids[id(5)]);

    // A later revert of the example, addressed by the entry's old id, still finds it.
    const r2 = run([{ ...rows[1], live_status: 'reverting' }], 'revert-example');
    expect(r2.failed).toEqual([]);
    expect(r2.reverted).toEqual([id(2)]);

    // Undo the rest, newest first (the rows now name the new ids, as confirm leaves them).
    const undo = [
      { ...rows[0], target_id: 'tsahatest' }, { ...rows[2], target_id: r1.target_ids[id(5)] },
      { ...rows[3], target_id: 'tsahatest' }, { ...rows[4], target_id: r1.target_ids[id(5)] },
    ].map((r) => ({ ...r, live_status: 'reverting' }));
    const r3 = run(undo, 'undo');
    expect(r3.failed).toEqual([]);
    expect(r3.reverted).toHaveLength(4);

    const after = snapshot(dir);
    for (const [f, text] of before) expect(after.get(f), f).toBe(text);
    expect([...after.keys()].sort()).toEqual([...before.keys()].sort());
  });

  it('refuses to undo when another entry has taken the old id', () => {
    const b = letter('b');
    const e = b.entries.find((x) => x.id === 'bahari')!;
    const ids = b.entries.map((x) => x.id);
    const common = { outcome: 'replace', region: null, confidence: null, edited: false, live_status: 'live', target_type: 'word' };
    const v = '00000000-0000-4000-8000-000000000201';
    const h = '00000000-0000-4000-8000-000000000202';
    const base = { value: { headword: e.headword, id: e.id, homonym_index: e.homonym_index, sort_key: e.sort_key, file: 'b', after: ids[ids.indexOf(e.id) - 1] } };
    run([
      { ...common, id: v, type: 'spelling_variant', target_id: e.id, final_payload: { form: 'bahary', kind: 'spelling' }, base: null },
      { ...common, id: h, type: 'headword_change', target_id: e.id, outcome: null, final_payload: { form: 'bahary', variant: v }, base },
    ], 'promote-again');
    // A hand edit gives another entry the freed id (a new word never can: the id is reserved).
    const file = letter('b');
    const other = file.entries.find((x) => x.id === 'bahati') ?? file.entries.at(-1)!;
    other.id = 'bahari';
    writeFileSync(join(dir, 'public/data/b.json'), JSON.stringify(file));
    const inPath = join(dir, 'claimed-blocked.json');
    const outPath = join(dir, 'results-blocked.json');
    writeFileSync(inPath, JSON.stringify({ nonce: '0', rows: [{ ...common, id: h, type: 'headword_change', target_id: 'bahary', live_status: 'reverting', outcome: null, final_payload: { form: 'bahary', variant: v }, base }] }));
    execFileSync(tsx, ['scripts/fold-in/apply.ts', '--data', dir, '--in', inPath, '--out', outPath], { cwd: ROOT });
    const r = JSON.parse(readFileSync(outPath, 'utf-8'));
    expect(r.failed[0]?.error).toMatch(/used by another entry/);
  });
});
