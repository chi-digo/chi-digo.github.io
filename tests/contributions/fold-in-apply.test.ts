import { describe, expect, it } from 'vitest';
import { execFileSync } from 'child_process';
import { mkdtempSync, mkdirSync, copyFileSync, readFileSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { plantNameBase } from '@/lib/contributions/apply/plants';
import type { SourcePlant } from '@/lib/plants/derive';

const ROOT = process.cwd();

function checkout() {
  const dir = mkdtempSync(join(tmpdir(), 'fold-'));
  mkdirSync(join(dir, 'content/plants'), { recursive: true });
  copyFileSync(join(ROOT, 'content/plants/plants.json'), join(dir, 'content/plants/plants.json'));
  return dir;
}
const read = (dir: string) => JSON.parse(readFileSync(join(dir, 'content/plants/plants.json'), 'utf-8')) as SourcePlant[];

function run(dir: string, rows: object[]) {
  writeFileSync(join(dir, 'claimed.json'), JSON.stringify({ nonce: 'n', rows }));
  execFileSync('npx', ['tsx', join(ROOT, 'scripts/fold-in/apply.ts'), '--data', dir, '--in', join(dir, 'claimed.json'), '--out', join(dir, 'results.json')], { stdio: 'pipe' });
  return JSON.parse(readFileSync(join(dir, 'results.json'), 'utf-8'));
}

describe('fold-in apply', () => {
  const plants = JSON.parse(readFileSync(join(ROOT, 'content/plants/plants.json'), 'utf-8')) as SourcePlant[];
  const target = plants.find((p) => p.name_status === 'missing')!;
  const name = {
    id: '11111111-1111-4111-8111-111111111111', type: 'plant_name', target_type: 'plant', target_id: target.slug,
    target_path: 'digo_headword', final_payload: { name: 'Jinamupya', choice: 'other' }, outcome: 'replace',
    region: 'tanga', confidence: 'native', base: { value: plantNameBase(target) }, live_status: 'live', edited: false,
  };

  it('applies a change, once, and only that plant', () => {
    const dir = checkout();
    const r = run(dir, [name]);
    expect(r.applied).toEqual([name.id]);
    const after = read(dir);
    const changed = after.filter((p, i) => JSON.stringify(p) !== JSON.stringify(plants[i]));
    expect(changed.map((p) => p.slug)).toEqual([target.slug]);
    expect(changed[0].digo_headword).toBe('Jinamupya');
    const once = readFileSync(join(dir, 'content/plants/plants.json'), 'utf-8');
    run(dir, [name]);
    expect(readFileSync(join(dir, 'content/plants/plants.json'), 'utf-8')).toBe(once);
  }, 60_000);

  it('sets aside conflicts and skips areas without an applier', () => {
    const dir = checkout();
    const stale = { ...name, id: '22222222-2222-4222-8222-222222222222', base: { value: { digo_headword: 'not this', name_status: 'missing' } } };
    const word = { ...name, id: '33333333-3333-4333-8333-333333333333', type: 'example_sentence', target_type: 'word', target_id: 'kpwera' };
    const r = run(dir, [stale, word, name]);
    expect(r.conflict.map((c: { id: string }) => c.id)).toEqual([stale.id]);
    expect(r.skipped).toEqual([word.id]);
    expect(r.applied).toEqual([name.id]);
  }, 60_000);

  it('reverts a folded change', () => {
    const dir = checkout();
    run(dir, [name]);
    const r = run(dir, [{ ...name, live_status: 'reverting' }]);
    expect(r.reverted).toEqual([name.id]);
    expect(read(dir).find((p) => p.slug === target.slug)).toEqual(target);
  }, 60_000);
});
