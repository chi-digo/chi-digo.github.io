/**
 * Pure appliers for plant contributions (spec 34 technical §5). The same functions run in the browser
 * (the live overlay, on the shipped JSON) and in fold-in (on the data files), so what reviewers see
 * live is exactly what gets folded. Each is idempotent: a change already in `provenance` is skipped.
 */
import type { Plant, PlantStub, SectionKey, L10n } from '@/lib/plants/types';
import type { Locale } from '@/lib/i18n/config';
import { stableStringify, normaliseDigo } from '../text';
import { ConflictError, hasChange, withProvenance, withoutProvenance, type Change } from './types';

interface NamePayload { name: string }
interface InfoPayload { section: SectionKey; lang: Locale; mode: 'replace' | 'add'; text: string }

/** What a plant_name change is checked against: the headword and its status when suggested. */
export function plantNameBase(p: Pick<Plant, 'digo_headword' | 'name_status'>) {
  return { digo_headword: p.digo_headword, name_status: p.name_status };
}

export function plantInfoBase(p: Pick<Plant, 'sections'>, section: SectionKey, lang: Locale): string | null {
  return p.sections?.[section]?.[lang] ?? null;
}

function same(a: unknown, b: unknown) {
  return stableStringify(a ?? null) === stableStringify(b ?? null);
}

function unique(list: (string | null | undefined)[]): string[] {
  return [...new Set(list.filter((x): x is string => !!x))];
}

function addedText(current: string | null, text: string) {
  return current ? `${current}\n\n${text}` : text;
}

/** Apply an accepted change to a full plant record (p/<slug>.json shape). */
export function applyPlant(plant: Plant, change: Change): Plant {
  if (hasChange(plant.provenance, change.contribution_id)) return plant;

  if (change.type === 'plant_name') {
    const { name } = change.final_payload as unknown as NamePayload;
    if (change.outcome === 'variant') {
      return {
        ...plant,
        digo_variants: [...(plant.digo_variants ?? []), { form: name, region: change.region ?? null, c: change.contribution_id }],
        digo_alt: unique([...plant.digo_alt, name]),
        provenance: withProvenance(plant.provenance, 'digo_variants', change),
      };
    }
    if (change.base && !same(plantNameBase(plant), change.base.value)) {
      throw new ConflictError(change.contribution_id, 'digo_headword');
    }
    return {
      ...plant,
      digo_headword: name,
      name_status: 'confirmed',
      digo_alt: unique([...plant.digo_alt.filter((a) => a !== name), plant.digo_headword]),
      provenance: withProvenance(plant.provenance, 'digo_headword', change),
    };
  }

  if (change.type === 'plant_info') {
    const { section, lang, mode, text } = change.final_payload as unknown as InfoPayload;
    const current = plantInfoBase(plant, section, lang);
    if (change.base && !same(current, change.base.value)) {
      throw new ConflictError(change.contribution_id, `sections.${section}.${lang}`);
    }
    const existing: L10n = plant.sections?.[section] ?? { en: '', sw: null, dg: null };
    const next = mode === 'add' ? addedText(current, text) : text;
    return {
      ...plant,
      sections: { ...plant.sections, [section]: { ...existing, [lang]: next } },
      has_prose: lang === 'en' ? plant.has_prose : { ...plant.has_prose, [lang]: true },
      provenance: withProvenance(plant.provenance, `sections.${section}.${lang}`, change),
    };
  }

  return plant;
}

/** Apply a change to a list record (index.json stub), so lists and search show it too. */
export function applyPlantStub(stub: PlantStub, change: Change): PlantStub {
  if (hasChange(stub.provenance, change.contribution_id) || change.type !== 'plant_name') return stub;
  const { name } = change.final_payload as unknown as NamePayload;
  const terms = unique([...stub.search_terms, normaliseDigo(name)]);
  if (change.outcome === 'variant') {
    return {
      ...stub,
      digo_alt: unique([...stub.digo_alt, name]),
      search_terms: terms,
      provenance: withProvenance(stub.provenance, 'digo_variants', change),
    };
  }
  if (change.base && !same(plantNameBase(stub), change.base.value)) {
    throw new ConflictError(change.contribution_id, 'digo_headword');
  }
  return {
    ...stub,
    digo_headword: name,
    name_status: 'confirmed',
    digo_alt: unique([...stub.digo_alt.filter((a) => a !== name), stub.digo_headword]),
    search_terms: terms,
    provenance: withProvenance(stub.provenance, 'digo_headword', change),
  };
}

/**
 * Undo a change (revert after fold-in). Only when the field still holds what the change set;
 * otherwise a later edit has happened and a reviewer has to decide.
 */
export function unapplyPlant(plant: Plant, change: Change): Plant {
  if (!hasChange(plant.provenance, change.contribution_id)) return plant;
  const provenance = withoutProvenance(plant.provenance, change.contribution_id);

  if (change.type === 'plant_name') {
    const { name } = change.final_payload as unknown as NamePayload;
    if (change.outcome === 'variant') {
      const variants = (plant.digo_variants ?? []).filter((v) => v.c !== change.contribution_id);
      const stillUsed = variants.some((v) => v.form === name) || plant.digo_headword === name;
      return {
        ...plant,
        digo_variants: variants.length ? variants : undefined,
        digo_alt: stillUsed ? plant.digo_alt : plant.digo_alt.filter((a) => a !== name),
        provenance,
      };
    }
    if (plant.digo_headword !== name) throw new ConflictError(change.contribution_id, 'digo_headword');
    const base = (change.base?.value ?? {}) as ReturnType<typeof plantNameBase>;
    return {
      ...plant,
      digo_headword: base.digo_headword ?? null,
      name_status: base.name_status ?? plant.name_status,
      digo_alt: unique([...plant.digo_alt.filter((a) => a !== base.digo_headword), name]),
      provenance,
    };
  }

  if (change.type === 'plant_info') {
    const { section, lang, mode, text } = change.final_payload as unknown as InfoPayload;
    const before = (change.base?.value ?? null) as string | null;
    const applied = mode === 'add' ? addedText(before, text) : text;
    if (plantInfoBase(plant, section, lang) !== applied) {
      throw new ConflictError(change.contribution_id, `sections.${section}.${lang}`);
    }
    const existing = plant.sections?.[section] ?? { en: '', sw: null, dg: null };
    return { ...plant, sections: { ...plant.sections, [section]: { ...existing, [lang]: before } as L10n }, provenance };
  }

  return plant;
}

/**
 * Apply every change for one plant in review order. A conflicting change is skipped and reported,
 * never thrown, so one stale suggestion can't break the page.
 */
export function applyAllToPlant(plant: Plant, changes: Change[], onConflict?: (e: ConflictError) => void): Plant {
  return changes
    .filter((c) => c.target_id === plant.slug)
    .reduce((p, c) => {
      try {
        return applyPlant(p, c);
      } catch (e) {
        if (e instanceof ConflictError) {
          onConflict?.(e);
          return p;
        }
        throw e;
      }
    }, plant);
}

export function applyAllToStubs(stubs: PlantStub[], changes: Change[], onConflict?: (e: ConflictError) => void): PlantStub[] {
  if (!changes.length) return stubs;
  const bySlug = new Map<string, Change[]>();
  for (const c of changes) bySlug.set(c.target_id, [...(bySlug.get(c.target_id) ?? []), c]);
  return stubs.map((s) => {
    const list = bySlug.get(s.slug);
    if (!list) return s;
    return list.reduce((acc, c) => {
      try {
        return applyPlantStub(acc, c);
      } catch (e) {
        if (e instanceof ConflictError) {
          onConflict?.(e);
          return acc;
        }
        throw e;
      }
    }, s);
  });
}
