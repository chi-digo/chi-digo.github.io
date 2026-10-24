/**
 * Pure appliers for plant contributions (spec 34 technical §5). The same functions run in the browser
 * (the live overlay, on the shipped JSON) and in fold-in (on the data files), so what reviewers see
 * live is exactly what gets folded. Each is idempotent: a change already in `provenance` is skipped.
 * Undoing a folded change happens on the source (unapplySourcePlant); the overlay just drops it.
 */
import type { Plant, PlantStub, SectionKey, L10n } from '@/lib/plants/types';
import type { Locale } from '@/lib/i18n/config';
import { stableStringify } from '../strings';
import { hasProse, termPieces } from '@/lib/plants/derive';
import { ConflictError, hasChange, withProvenance, type Change } from './types';
import { applyTranslation } from './translations';

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

/** Add names to the alternatives the way the build does: never the headword, no case-insensitive repeats. */
function withAlt(alt: string[], head: string | null, ...names: (string | null | undefined)[]): string[] {
  const out = [...alt];
  for (const n of names) {
    if (!n) continue;
    const low = n.toLowerCase();
    if (low === head?.toLowerCase() || out.some((o) => o.toLowerCase() === low)) continue;
    out.push(n);
  }
  return out;
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
        digo_alt: withAlt(plant.digo_alt, plant.digo_headword, name),
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
      digo_alt: withAlt(plant.digo_alt.filter((a) => a.toLowerCase() !== name.toLowerCase()), name, plant.digo_headword),
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
    const sections = { ...plant.sections, [section]: { ...existing, [lang]: next } };
    return {
      ...plant,
      sections,
      // The same rule the build uses: a language has prose when the summary and every section do.
      has_prose: { en: hasProse({ ...plant, sections }, 'en'), sw: hasProse({ ...plant, sections }, 'sw'), dg: hasProse({ ...plant, sections }, 'dg') },
      provenance: withProvenance(plant.provenance, `sections.${section}.${lang}`, change),
    };
  }

  if (change.type === 'translation_fix') return applyTranslation(plant, 'plant', change);

  return plant;
}

/**
 * Apply a change to a list record (index.json stub), so lists and search show it too. Only names: a
 * stub has no sections, so `has_prose` changes from plant_info show in lists once folded in.
 */
export function applyPlantStub(stub: PlantStub, change: Change): PlantStub {
  if (hasChange(stub.provenance, change.contribution_id)) return stub;
  // A fixed teaser shows in lists too (the stub carries the teaser; summaries and parts it doesn't).
  if (change.type === 'translation_fix') return /^teaser\./.test(change.target_path ?? '') ? applyTranslation(stub, 'plant', change) : stub;
  if (change.type !== 'plant_name') return stub;
  const { name } = change.final_payload as unknown as NamePayload;
  const terms = unique([...stub.search_terms, ...termPieces(name)]);
  if (change.outcome === 'variant') {
    return {
      ...stub,
      digo_alt: withAlt(stub.digo_alt, stub.digo_headword, name),
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
    digo_alt: withAlt(stub.digo_alt.filter((a) => a.toLowerCase() !== name.toLowerCase()), name, stub.digo_headword),
    search_terms: terms,
    provenance: withProvenance(stub.provenance, 'digo_headword', change),
  };
}

/**
 * Apply every change for one plant in review order. A conflicting change is skipped and reported,
 * never thrown, so one stale suggestion can't break the page.
 */
export function applyAllToPlant(plant: Plant, changes: Change[], onConflict?: (e: ConflictError) => void): Plant {
  return changes
    // Plants and glossary terms share the overlay area; a term could share a plant's slug.
    .filter((c) => c.target_id === plant.slug && (c.target_type ?? 'plant') === 'plant')
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
  for (const c of changes) {
    if ((c.target_type ?? 'plant') === 'plant') bySlug.set(c.target_id, [...(bySlug.get(c.target_id) ?? []), c]);
  }
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
