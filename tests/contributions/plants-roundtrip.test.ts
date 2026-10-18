import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { deriveStub, derivePlant, type SourcePlant } from '@/lib/plants/derive';
import { applyPlant, applyPlantStub, plantNameBase, plantInfoBase } from '@/lib/contributions/apply/plants';
import { applySourcePlant, unapplySourcePlant } from '@/lib/contributions/apply/plants-source';
import { stableStringify } from '@/lib/contributions/strings';
import type { Change } from '@/lib/contributions/apply/types';

const SOURCE = JSON.parse(readFileSync(join(process.cwd(), 'content/plants/plants.json'), 'utf-8')) as SourcePlant[];
// A spread of shapes: Digo notes with alternatives, a missing name, a disputed name, parts.
const picks = [
  SOURCE.find((p) => /also|healers/i.test(p.digo ?? ''))!,
  SOURCE.find((p) => p.name_status === 'missing')!,
  SOURCE.find((p) => p.name_status === 'conflict')!,
  SOURCE.find((p) => p.slug === 'mnazi') ?? SOURCE[0],
  // A plant with no Uses section yet: the change creates it, and undoing it removes it again.
  SOURCE.find((p) => !p.sections?.uses)!,
];

function changes(p: SourcePlant): Change[] {
  const id = (n: number) => `00000000-0000-4000-8000-00000000000${n}`;
  return [
    { contribution_id: id(1), type: 'plant_name', target_id: p.slug, outcome: 'replace', region: 'tanga', confidence: 'native',
      final_payload: { name: "Mng'ambo wa pwani", choice: 'other' }, base: { value: plantNameBase(p) } },
    { contribution_id: id(2), type: 'plant_name', target_id: p.slug, outcome: 'variant', region: 'kwale_south', confidence: 'heard',
      final_payload: { name: 'Mvariant', choice: 'other' }, base: { value: plantNameBase(p) } },
    { contribution_id: id(3), type: 'plant_info', target_id: p.slug, outcome: 'replace', confidence: 'native',
      final_payload: { section: 'uses', lang: 'dg', mode: 'add', text: 'Makodzage ganahumirwa.' }, base: { value: plantInfoBase(p, 'uses', 'dg') } },
    { contribution_id: id(4), type: 'plant_info', target_id: p.slug, outcome: 'replace', confidence: 'native',
      final_payload: { section: 'about', lang: 'sw', mode: 'replace', text: 'Maelezo mapya.' }, base: { value: plantInfoBase(p, 'about', 'sw') } },
    // A regional form that only differs from the headword in case is not a new name.
    { contribution_id: id(5), type: 'plant_name', target_id: p.slug, outcome: 'variant', region: 'tanga', confidence: 'heard',
      final_payload: { name: (p.digo_headword ?? 'Mvariant').toLowerCase(), choice: 'other' }, base: { value: plantNameBase(p) } },
  ];
}

// Alternative names may come out in a different order (the build reads them from the source notes in
// order; the overlay appends the old headword). The set must match; the order is cosmetic.
const shipped = (x: object) => {
  const o = JSON.parse(stableStringify(x));
  if (Array.isArray(o.digo_alt)) o.digo_alt = [...o.digo_alt].sort();
  return o;
};
const stubView = (s: ReturnType<typeof deriveStub>) => {
  const { provenance: _p, search_terms, digo_alt, ...rest } = s;
  return { ...rest, digo_alt: [...digo_alt].sort(), search_terms: [...search_terms].sort() };
};

describe('fold-in and the live overlay give the same plant', () => {
  for (const plant of picks) {
    for (const c of changes(plant)) {
      it(`${plant.slug} · ${c.contribution_id.slice(-1)} ${c.type} ${c.outcome} ${String(c.final_payload.section ?? '')}`, () => {
        const folded = applySourcePlant(plant, c);
        // Full record: derive after the source change == apply to the derived record.
        expect(shipped(derivePlant(folded))).toEqual(shipped(applyPlant(derivePlant(plant), c)));
        // List record (search terms compared as a set; stub provenance is informational).
        if (c.type === 'plant_name') {
          expect(stubView(deriveStub(folded))).toEqual(stubView(applyPlantStub(deriveStub(plant), c)));
        }
        // Idempotent: folding twice, or overlaying an already-folded record, changes nothing.
        expect(applySourcePlant(folded, c)).toBe(folded);
        const shippedFolded = derivePlant(folded);
        expect(applyPlant(shippedFolded, c)).toBe(shippedFolded);
        // Reversible.
        expect(shipped(unapplySourcePlant(folded, c))).toEqual(shipped(plant));
      });
    }
  }
});
