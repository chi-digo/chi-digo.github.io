import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import {
  applyPlant, applyPlantStub, unapplyPlant, applyAllToPlant, applyAllToStubs, plantNameBase, plantInfoBase,
} from '@/lib/contributions/apply/plants';
import { ConflictError, type Change } from '@/lib/contributions/apply/types';
import type { Plant, PlantStub } from '@/lib/plants/types';

const DIR = join(process.cwd(), 'public/data/plants');
const plant = JSON.parse(readFileSync(join(DIR, 'p', readdirSync(join(DIR, 'p')).sort()[0]), 'utf-8')) as Plant;
const stub = (JSON.parse(readFileSync(join(DIR, 'index.json'), 'utf-8')) as PlantStub[]).find((s) => s.slug === plant.slug)!;

const nameChange = (over: Partial<Change> = {}): Change => ({
  contribution_id: '11111111-1111-4111-8111-111111111111',
  type: 'plant_name',
  target_id: plant.slug,
  final_payload: { name: 'jinasha', choice: 'other' },
  outcome: 'replace',
  region: 'kinondo_diani',
  confidence: 'native',
  base: { value: plantNameBase(plant) },
  ...over,
});

const infoChange = (over: Partial<Change> = {}): Change => ({
  contribution_id: '22222222-2222-4222-8222-222222222222',
  type: 'plant_info',
  target_id: plant.slug,
  final_payload: { section: 'uses', lang: 'dg', mode: 'add', text: 'Makodzage ganahumirwa.' },
  outcome: 'replace',
  confidence: 'heard',
  base: { value: plantInfoBase(plant, 'uses', 'dg') },
  ...over,
});

describe('plant_name', () => {
  it('replaces the headword, confirms it, keeps the old name as an alternative, records provenance', () => {
    const out = applyPlant(plant, nameChange());
    expect(out.digo_headword).toBe('jinasha');
    expect(out.name_status).toBe('confirmed');
    if (plant.digo_headword) expect(out.digo_alt).toContain(plant.digo_headword);
    expect(out.digo).toBe(plant.digo); // source notes are never touched
    expect(out.provenance?.digo_headword?.[0]).toMatchObject({ c: nameChange().contribution_id, src: 'community', conf: 'native' });
  });
  it('is idempotent', () => {
    const once = applyPlant(plant, nameChange());
    expect(applyPlant(once, nameChange())).toBe(once);
  });
  it('conflicts when the headword changed since the suggestion', () => {
    const moved = { ...plant, digo_headword: 'other' };
    expect(() => applyPlant(moved, nameChange())).toThrow(ConflictError);
  });
  it('adds a regional variant without replacing anything', () => {
    const out = applyPlant(plant, nameChange({ outcome: 'variant', region: 'tanga' }));
    expect(out.digo_headword).toBe(plant.digo_headword);
    expect(out.digo_variants).toEqual([{ form: 'jinasha', region: 'tanga', c: nameChange().contribution_id }]);
    expect(out.digo_alt).toContain('jinasha');
  });
  it('updates list records and search terms too', () => {
    const out = applyPlantStub(stub, nameChange());
    expect(out.digo_headword).toBe('jinasha');
    expect(out.search_terms).toContain('jinasha');
    expect(applyPlantStub(out, nameChange())).toBe(out);
  });
  it('unapplies to the original and only when unchanged since', () => {
    const applied = applyPlant(plant, nameChange());
    const undone = unapplyPlant(applied, nameChange());
    expect(undone.digo_headword).toBe(plant.digo_headword);
    expect(undone.name_status).toBe(plant.name_status);
    expect(undone.provenance).toBeUndefined();
    expect(() => unapplyPlant({ ...applied, digo_headword: 'later edit' }, nameChange())).toThrow(ConflictError);
  });
});

describe('plant_info', () => {
  it('appends in the given language and marks that language as having prose', () => {
    const out = applyPlant(plant, infoChange());
    const before = plant.sections.uses?.dg;
    expect(out.sections.uses?.dg).toBe(before ? `${before}\n\nMakodzage ganahumirwa.` : 'Makodzage ganahumirwa.');
    expect(out.sections.uses?.en).toBe(plant.sections.uses?.en ?? '');
    expect(out.provenance?.['sections.uses.dg']).toHaveLength(1);
  });
  it('replaces when asked, conflicts on a stale base, and unapplies', () => {
    const replace = infoChange({ final_payload: { section: 'uses', lang: 'dg', mode: 'replace', text: 'Mpya.' } });
    const out = applyPlant(plant, replace);
    expect(out.sections.uses?.dg).toBe('Mpya.');
    expect(() => applyPlant(out, { ...replace, contribution_id: '33333333-3333-4333-8333-333333333333' })).toThrow(ConflictError);
    expect(unapplyPlant(out, replace).sections.uses?.dg).toBe(plant.sections.uses?.dg ?? null);
  });
});

describe('applyAll', () => {
  it('applies changes in order, skips conflicts and reports them', () => {
    const conflicts: string[] = [];
    const stale = nameChange({ contribution_id: '44444444-4444-4444-8444-444444444444', base: { value: { digo_headword: 'nope', name_status: 'missing' } } });
    const out = applyAllToPlant(plant, [nameChange(), stale, infoChange()], (e) => conflicts.push(e.contributionId));
    expect(out.digo_headword).toBe('jinasha');
    expect(out.provenance?.['sections.uses.dg']).toHaveLength(1);
    expect(conflicts).toEqual([stale.contribution_id]);
  });
  it('touches only the targeted stubs', () => {
    const stubs = JSON.parse(readFileSync(join(DIR, 'index.json'), 'utf-8')) as PlantStub[];
    const out = applyAllToStubs(stubs, [nameChange()]);
    expect(out.filter((s, i) => s !== stubs[i]).map((s) => s.slug)).toEqual([plant.slug]);
  });
});
