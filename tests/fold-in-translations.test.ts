/**
 * Fold-in for translation fixes (spec 34 §17, phase 5a) on a temporary checkout: a plant teaser and a
 * part, a glossary definition, and two proverb fields are applied, re-applied (no change), then
 * reverted in another order. Every file must come back byte-identical, with the data checks passing.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { cpSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { execFileSync } from 'child_process';
import { tmpdir } from 'os';
import { join } from 'path';
import { translationText } from '@/lib/contributions/apply/translations';
import { proverbFieldBase, type ProverbEntry } from '@/lib/contributions/apply/proverbs';
import type { SourcePlant } from '@/lib/plants/derive';
import type { GlossaryTerm } from '@/lib/plants/types';

const ROOT = process.cwd();
const tsx = join(ROOT, 'node_modules/.bin/tsx');
const FILES = ['content/plants/plants.json', 'content/plants/glossary.json', 'public/data/proverbs/index.json'];
let dir: string;
const before: Record<string, string> = {};
const read = (f: string) => readFileSync(join(dir, f), 'utf-8');

function run(rows: unknown[], tag: string) {
  const inPath = join(dir, `claimed-${tag}.json`);
  const outPath = join(dir, `results-${tag}.json`);
  writeFileSync(inPath, JSON.stringify({ nonce: '00000000-0000-0000-0000-000000000000', rows }));
  execFileSync(tsx, ['scripts/fold-in/apply.ts', '--data', dir, '--in', inPath, '--out', outPath], { cwd: ROOT });
  execFileSync(tsx, ['scripts/proverbs/check.ts', '--root', dir], { cwd: ROOT });
  return JSON.parse(readFileSync(outPath, 'utf-8'));
}

beforeAll(() => {
  dir = mkdtempSync(join(tmpdir(), 'fold-translations-'));
  mkdirSync(join(dir, 'content/plants'), { recursive: true });
  cpSync(join(ROOT, 'public/data'), join(dir, 'public/data'), { recursive: true });
  // The committed files, not the working tree (a UI test run may have fixtures in it).
  for (const f of FILES) writeFileSync(join(dir, f), execFileSync('git', ['show', `HEAD:${f}`], { cwd: ROOT, maxBuffer: 64 * 1024 * 1024 }));
  for (const f of FILES) before[f] = read(f);
});
afterAll(() => rmSync(dir, { recursive: true, force: true }));

describe('fold-in for translation fixes', () => {
  it('applies plant, glossary and proverb fixes, then reverts to the exact bytes', () => {
    const plants = JSON.parse(before[FILES[0]]) as SourcePlant[];
    const glossary = JSON.parse(before[FILES[1]]) as GlossaryTerm[];
    const proverbs = JSON.parse(before[FILES[2]]) as ProverbEntry[];
    const mnazi = plants.find((p) => p.slug === 'mnazi')!;
    const muhi = glossary.find((g) => g.term === 'muhi')!;
    const p1 = proverbs.find((p) => p.id === 'p-001')!;
    const id = (k: number) => `00000000-0000-4000-8000-00000000060${k}`;
    const common = { outcome: 'replace', region: 'tanga', confidence: 'native', edited: false, live_status: 'live' };
    const plantRow = (k: number, path: string, proposed: string) => ({
      ...common, id: id(k), type: 'translation_fix', target_type: 'plant', target_id: 'mnazi', target_path: path,
      final_payload: { lang: path.slice(-2), proposed }, base: { value: { text: translationText(mnazi, 'plant', path) } },
    });
    const rows = [
      plantRow(1, 'teaser.sw', 'Wadigo wana jina kwa kila hatua ya nazi, saba kwa jumla.'),
      plantRow(2, 'parts.0.definition.dg', 'Kodza ra mnazi.'),
      { ...common, id: id(3), type: 'translation_fix', target_type: 'glossary', target_id: 'muhi', target_path: 'definition.dg',
        final_payload: { lang: 'dg', proposed: 'Kolo ra mmea.' }, base: { value: { text: translationText(muhi, 'glossary', 'definition.dg') } } },
      { ...common, id: id(4), type: 'translation_fix', target_type: 'proverb', target_id: 'p-001', target_path: 'swahili',
        final_payload: { lang: 'sw', proposed: 'Akili ni nywele, kila mtu ana zake' }, base: { value: proverbFieldBase(p1, 'swahili') } },
      { ...common, id: id(5), type: 'translation_fix', target_type: 'proverb', target_id: 'p-001', target_path: 'commentary_en',
        final_payload: { lang: 'en', proposed: 'Said to remind people that everyone has their own kind of wisdom.' }, base: { value: proverbFieldBase(p1, 'commentary_en') } },
    ];
    const r1 = run(rows, 'apply');
    expect(r1.failed).toEqual([]);
    expect(r1.conflict).toEqual([]);
    expect(r1.applied).toHaveLength(5);
    expect(read(FILES[1])).toContain('Kolo ra mmea.');
    const after = FILES.map(read);
    expect(after.every((t, i) => t !== before[FILES[i]])).toBe(true);
    // Each file keeps its format.
    expect(read(FILES[0]).endsWith('\n')).toBe(false);
    expect(read(FILES[1]).endsWith('\n')).toBe(false);
    expect(read(FILES[2]).endsWith('}\n]\n')).toBe(true);

    expect(run(rows, 'again').applied).toHaveLength(5);
    expect(FILES.map(read)).toEqual(after);

    const back = [rows[3], rows[0], rows[4], rows[2], rows[1]].map((x) => ({ ...x, live_status: 'reverting' }));
    const r2 = run(back, 'revert');
    expect(r2.failed).toEqual([]);
    expect(r2.reverted).toHaveLength(5);
    for (const f of FILES) expect(read(f)).toBe(before[f]);
  });

  it('a stale fix is set aside, not applied', () => {
    const r = run([{
      outcome: 'replace', region: 'tanga', confidence: 'native', edited: false, live_status: 'live',
      id: '00000000-0000-4000-8000-000000000611', type: 'translation_fix', target_type: 'glossary', target_id: 'muhi', target_path: 'definition.sw',
      final_payload: { lang: 'sw', proposed: 'Shina.' }, base: { value: { text: 'not the current text' } },
    }], 'stale');
    expect(r.conflict).toHaveLength(1);
    for (const f of FILES) expect(read(f)).toBe(before[f]);
  });
});
