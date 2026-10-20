/**
 * Fold-in for dictionary changes on a temporary checkout (spec 34 §15.3): one change of each content
 * type plus a new word that becomes a homonym, then the revert of all of them. Every letter, idx and
 * index file must come back byte-identical (data-version.json excepted), with check:dictionary passing
 * at each step.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { cpSync, mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'fs';
import { execFileSync } from 'child_process';
import { tmpdir } from 'os';
import { join } from 'path';
import { definitionBase } from '@/lib/contributions/apply/words';

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
  dir = mkdtempSync(join(tmpdir(), 'fold-words-'));
  mkdirSync(join(dir, 'content/plants'), { recursive: true });
  cpSync(join(ROOT, 'public/data'), join(dir, 'public/data'), { recursive: true });
  cpSync(join(ROOT, 'content/plants/plants.json'), join(dir, 'content/plants/plants.json'));
  before = snapshot(dir);
});
afterAll(() => rmSync(dir, { recursive: true, force: true }));

describe('fold-in for words', () => {
  it('applies one of each type and a homonym, then reverts to the exact bytes', () => {
    const m = JSON.parse(readFileSync(join(dir, 'public/data/m.json'), 'utf-8'));
    const e = m.entries.find((x: { senses: { definition_dg: string }[] }) => x.senses.length && x.senses[0].definition_dg);
    const n = e.senses[0].sense_id;
    const next = Math.max(...e.senses.map((s: { sense_id: number }) => s.sense_id)) + 1;
    const common = { outcome: 'replace', region: 'kwale_south', confidence: 'native', edited: false, live_status: 'live', target_type: 'word' };
    const id = (k: number) => `00000000-0000-4000-8000-00000000000${k}`;
    const rows = [
      { ...common, id: id(1), type: 'definition_update', target_id: e.id, target_path: `senses.${n}.definition_dg`,
        final_payload: { sense_id: String(n), lang: 'dg', text: 'Maana ya majaribio', mode: 'replace' }, base: { value: definitionBase(e, n, 'dg') } },
      { ...common, id: id(2), type: 'definition_update', target_id: e.id, target_path: `senses.${next}`,
        final_payload: { sense_id: String(n), lang: 'en', text: 'a test meaning', mode: 'add_sense' }, base: null },
      { ...common, id: id(3), type: 'example_sentence', target_id: e.id, target_path: `senses.${n}.examples`,
        final_payload: { sense_id: String(n), dg: 'Ni mfano wa majaribio.', en: 'A test example.' }, base: null },
      { ...common, id: id(4), type: 'spelling_variant', target_id: e.id, target_path: 'variants', final_payload: { form: 'mtestforma', kind: 'dialect' }, base: null },
      // An existing headword: becomes a homonym with the next free id.
      { ...common, id: id(5), type: 'word_addition', target_id: null, target_path: null, final_payload: { headword: e.headword.replace(/[\d;]+$/, ''), meaning_en: 'a test homonym' }, base: null },
      { ...common, id: id(6), type: 'word_addition', target_id: null, target_path: null, final_payload: { headword: 'mzzzz', meaning_en: 'a brand new test word', example_dg: 'Mzzzz uno.' }, base: null },
    ];
    const r1 = run(rows, 'apply');
    expect(r1.failed).toEqual([]);
    expect(r1.conflict).toEqual([]);
    expect(r1.applied).toHaveLength(6);
    expect(r1.target_ids[id(6)]).toBe('mzzzz');
    expect(r1.target_ids[id(5)]).toMatch(new RegExp(`^${e.sort_key}\\.\\d+$`));

    const after = JSON.parse(readFileSync(join(dir, 'public/data/m.json'), 'utf-8'));
    const changed = after.entries.find((x: { id: string }) => x.id === e.id);
    expect(changed.senses.find((s: { sense_id: number }) => s.sense_id === n).definition_dg).toBe('Maana ya majaribio');
    expect(changed.senses.at(-1).sense_id).toBe(next);
    expect(changed.variants.at(-1).form).toBe('mtestforma');
    expect(after.entries.find((x: { id: string }) => x.id === 'mzzzz').provisional).toBeUndefined();

    // Applying again changes nothing.
    const again = run(rows, 'again');
    expect(again.applied).toHaveLength(6);
    expect(readFileSync(join(dir, 'public/data/m.json'), 'utf-8')).toBe(JSON.stringify(after));

    // Revert in a different order than applied: example and variant first, then the senses, then the words.
    const back = [rows[2], rows[3], rows[1], rows[0], rows[4], rows[5]].map((x) => ({
      ...x, live_status: 'reverting', target_id: x.type === 'word_addition' ? r1.target_ids[x.id] : x.target_id,
    }));
    const r2 = run(back, 'revert');
    expect(r2.failed).toEqual([]);
    expect(r2.reverted).toHaveLength(6);
    const now = snapshot(dir);
    for (const [f, text] of before) expect(now.get(f), f).toBe(text);
  });
});
