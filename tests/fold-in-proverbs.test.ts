/**
 * Fold-in for proverb changes on a temporary checkout (spec 34 §16 v2): one change of each type plus a new
 * proverb with its reserved id, applied, re-applied (no change), then reverted in another order. The
 * proverbs file must come back byte-identical (data-version.json excepted), with check:proverbs passing.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { cpSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { execFileSync } from 'child_process';
import { tmpdir } from 'os';
import { join } from 'path';
import { proverbFieldBase, contextField, meaningField, type ProverbEntry } from '@/lib/contributions/apply/proverbs';

const ROOT = process.cwd();
const tsx = join(ROOT, 'node_modules/.bin/tsx');
let dir: string;
let before: string;
// New proverb ids past the last one in the data (real community proverbs take the next ids over time).
let next: (k: number) => string;
const file = () => join(dir, 'public/data/proverbs/index.json');

function run(rows: unknown[], tag: string) {
  const inPath = join(dir, `claimed-${tag}.json`);
  const outPath = join(dir, `results-${tag}.json`);
  writeFileSync(inPath, JSON.stringify({ nonce: '00000000-0000-0000-0000-000000000000', rows }));
  execFileSync(tsx, ['scripts/fold-in/apply.ts', '--data', dir, '--in', inPath, '--out', outPath], { cwd: ROOT });
  execFileSync(tsx, ['scripts/proverbs/check.ts', '--root', dir], { cwd: ROOT });
  return JSON.parse(readFileSync(outPath, 'utf-8'));
}

beforeAll(() => {
  dir = mkdtempSync(join(tmpdir(), 'fold-proverbs-'));
  mkdirSync(join(dir, 'content/plants'), { recursive: true });
  cpSync(join(ROOT, 'public/data'), join(dir, 'public/data'), { recursive: true });
  cpSync(join(ROOT, 'content/plants/plants.json'), join(dir, 'content/plants/plants.json'));
  // The committed proverbs, not the working tree (a UI test run may have a fixture appended to it).
  writeFileSync(file(), execFileSync('git', ['show', 'HEAD:public/data/proverbs/index.json'], { cwd: ROOT }));
  before = readFileSync(file(), 'utf-8');
  const last = Math.max(...(JSON.parse(before) as ProverbEntry[]).map((p) => Number(p.source_number)));
  next = (k) => `p-${String(last + k).padStart(3, '0')}`;
});
afterAll(() => rmSync(dir, { recursive: true, force: true }));

describe('fold-in for proverbs', () => {
  it('applies one of each type and a new proverb, then reverts to the exact bytes', () => {
    const list: ProverbEntry[] = JSON.parse(before);
    const p = list.find((x) => x.id === 'p-001')!;
    const empty = list.find((x) => x.id === 'p-123')!;
    const common = { outcome: 'replace', region: 'tanga', confidence: 'native', edited: false, live_status: 'live', target_type: 'proverb' };
    const id = (k: number) => `00000000-0000-4000-8000-00000000010${k}`;
    const rows = [
      { ...common, id: id(1), type: 'proverb_meaning', target_id: 'p-001', target_path: 'idiomatic_en',
        final_payload: { lang: 'en', kind: 'idiomatic', mode: 'replace', text: 'Everyone is clever in their own way' }, base: { value: proverbFieldBase(p, meaningField('idiomatic', 'en')) } },
      { ...common, id: id(2), type: 'proverb_context', target_id: 'p-001', target_path: 'commentary_en',
        final_payload: { lang: 'en', text: 'Grandmothers say it to quarrelling children.' }, base: { value: proverbFieldBase(p, contextField('en')) } },
      { ...common, id: id(3), type: 'proverb_context', target_id: 'p-001', target_path: 'commentary_en',
        final_payload: { lang: 'en', text: 'Also heard at weddings.' }, base: { value: proverbFieldBase(p, contextField('en')) } },
      { ...common, id: id(4), type: 'proverb_variant', target_id: 'p-001', target_path: 'variants', final_payload: { form: 'Achili ni nyere', note: '' }, base: null },
      { ...common, id: id(5), type: 'proverb_meaning', target_id: 'p-123', target_path: 'idiomatic_dg',
        final_payload: { lang: 'dg', kind: 'idiomatic', mode: 'replace', text: 'Maana ya majaribio' }, base: { value: proverbFieldBase(empty, meaningField('idiomatic', 'dg')) } },
      { ...common, id: id(6), type: 'proverb_addition', target_id: next(1), target_path: null,
        final_payload: { digo: 'Mvula ya ’kare tainyesa', meaning_en: 'Old rain does not fall', usage: 'Said to people who live in the past.', usage_lang: 'en', themes: ['wisdom'], mature: false }, base: null },
    ];
    const r1 = run(rows, 'apply');
    expect(r1.failed).toEqual([]);
    expect(r1.conflict).toEqual([]);
    expect(r1.applied).toHaveLength(6);
    const after: ProverbEntry[] = JSON.parse(readFileSync(file(), 'utf-8'));
    const added = after.at(-1)!;
    expect(added).toMatchObject({ id: next(1), slug: `${next(1)}-mvula-ya-kare-tainyesa`, source_number: Number(next(1).slice(2)), themes: ['wisdom'] });
    expect(after.find((x) => x.id === 'p-001')!.commentary_en.endsWith('\n\nGrandmothers say it to quarrelling children.\n\nAlso heard at weddings.')).toBe(true);

    const again = run(rows, 'again');
    expect(again.applied).toHaveLength(6);
    expect(readFileSync(file(), 'utf-8')).toBe(JSON.stringify(after, null, 2) + '\n');

    // Revert the first story before the second, the new proverb first.
    const back = [rows[5], rows[1], rows[3], rows[2], rows[0], rows[4]].map((x) => ({ ...x, live_status: 'reverting' }));
    const r2 = run(back, 'revert');
    expect(r2.failed).toEqual([]);
    expect(r2.reverted).toHaveLength(6);
    expect(readFileSync(file(), 'utf-8')).toBe(before);
  });

  it('folds new proverbs in id order whatever order they arrive in', () => {
    const common = { outcome: 'replace', region: 'tanga', confidence: 'native', edited: false, target_type: 'proverb', target_path: null, base: null };
    const later = { ...common, live_status: 'live', id: '00000000-0000-4000-8000-000000000301', type: 'proverb_addition', target_id: next(3), final_payload: { digo: 'Dzuwa ra muhondo', meaning_en: 'tomorrow', mature: false } };
    const earlier = { ...common, live_status: 'live', id: '00000000-0000-4000-8000-000000000302', type: 'proverb_addition', target_id: next(2), final_payload: { digo: 'Ndzala tayina masikiro', meaning_en: 'hunger', mature: false } };
    expect(run([later], 'later').applied).toHaveLength(1);
    expect(run([earlier], 'earlier').applied).toHaveLength(1);
    expect((JSON.parse(readFileSync(file(), 'utf-8')) as ProverbEntry[]).slice(-2).map((x) => x.id)).toEqual([next(2), next(3)]);
    const r = run([later, earlier].map((x) => ({ ...x, live_status: 'reverting' })), 'unfold');
    expect(r.reverted).toHaveLength(2);
    expect(readFileSync(file(), 'utf-8')).toBe(before);
  });

  it('refuses a new proverb without a reserved id, or with one already used', () => {
    const common = { outcome: 'replace', region: 'tanga', confidence: 'native', edited: false, live_status: 'live', target_type: 'proverb', target_path: null, base: null };
    const r = run([
      { ...common, id: '00000000-0000-4000-8000-000000000201', type: 'proverb_addition', target_id: null, final_payload: { digo: 'Mvula', meaning_en: 'x' } },
      { ...common, id: '00000000-0000-4000-8000-000000000202', type: 'proverb_addition', target_id: 'p-001', final_payload: { digo: 'Mvula', meaning_en: 'x' } },
    ], 'bad');
    expect(r.failed.map((f: { id: string }) => f.id)).toHaveLength(2);
    expect(readFileSync(file(), 'utf-8')).toBe(before);
  });
});
