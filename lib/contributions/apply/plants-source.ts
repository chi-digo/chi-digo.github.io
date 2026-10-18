/**
 * Fold-in appliers for the plants source (content/plants/plants.json; spec 34 technical §5, §6).
 * They mirror the overlay appliers in ./plants.ts but write source fields: an earlier headword goes to
 * `digo_alt_extra` and regional forms to `digo_variants`, which the build turns into `digo_alt` and
 * search terms. A round-trip test keeps the two in step: deriving after a source change gives the same
 * shipped record as applying the change to the shipped record.
 */
import type { SourcePlant } from '@/lib/plants/derive';
import type { Locale } from '@/lib/i18n/config';
import type { L10n, SectionKey } from '@/lib/plants/types';
import { stableStringify } from '../strings';
import { plantNameBase, plantInfoBase } from './plants';
import { ConflictError, hasChange, withProvenance, withoutProvenance, type Change } from './types';

const same = (a: unknown, b: unknown) => stableStringify(a ?? null) === stableStringify(b ?? null);
const unique = (list: (string | null | undefined)[]) => [...new Set(list.filter((x): x is string => !!x))];
const addedText = (current: string | null, text: string) => (current ? `${current}\n\n${text}` : text);

export function applySourcePlant(p: SourcePlant, change: Change): SourcePlant {
  if (hasChange(p.provenance, change.contribution_id)) return p;

  if (change.type === 'plant_name') {
    const name = String(change.final_payload.name);
    if (change.outcome === 'variant') {
      return {
        ...p,
        digo_variants: [...(p.digo_variants ?? []), { form: name, region: change.region ?? null, c: change.contribution_id }],
        provenance: withProvenance(p.provenance, 'digo_variants', change),
      };
    }
    if (change.base && !same(plantNameBase(p), change.base.value)) throw new ConflictError(change.contribution_id, 'digo_headword');
    const low = name.toLowerCase();
    const extra = unique([
      ...(p.digo_alt_extra ?? []).filter((a) => a.toLowerCase() !== low),
      p.digo_headword?.toLowerCase() !== low ? p.digo_headword : null,
    ]);
    return {
      ...p,
      digo_headword: name,
      name_status: 'confirmed',
      ...(extra.length ? { digo_alt_extra: extra } : {}),
      provenance: withProvenance(p.provenance, 'digo_headword', change),
    };
  }

  if (change.type === 'plant_info') {
    const { section, lang, mode, text } = change.final_payload as { section: SectionKey; lang: Locale; mode: 'add' | 'replace'; text: string };
    const current = plantInfoBase(p, section, lang);
    if (change.base && !same(current, change.base.value)) throw new ConflictError(change.contribution_id, `sections.${section}.${lang}`);
    const existing: L10n = p.sections?.[section] ?? { en: '', sw: null, dg: null };
    return {
      ...p,
      sections: { ...p.sections, [section]: { ...existing, [lang]: mode === 'add' ? addedText(current, text) : text } },
      provenance: withProvenance(p.provenance, `sections.${section}.${lang}`, change),
    };
  }
  return p;
}

/** Undo a folded change (revert after fold-in), only if the field still holds what the change set. */
export function unapplySourcePlant(p: SourcePlant, change: Change): SourcePlant {
  if (!hasChange(p.provenance, change.contribution_id)) return p;
  const provenance = withoutProvenance(p.provenance, change.contribution_id);
  const withProv = (q: SourcePlant): SourcePlant => {
    const { provenance: _drop, ...rest } = q;
    return provenance ? { ...rest, provenance } : rest;
  };

  if (change.type === 'plant_name') {
    const name = String(change.final_payload.name);
    if (change.outcome === 'variant') {
      const variants = (p.digo_variants ?? []).filter((v) => v.c !== change.contribution_id);
      const { digo_variants: _v, ...rest } = p;
      return withProv(variants.length ? { ...rest, digo_variants: variants } : rest);
    }
    if (p.digo_headword !== name) throw new ConflictError(change.contribution_id, 'digo_headword');
    const base = (change.base?.value ?? {}) as { digo_headword: string | null; name_status: SourcePlant['name_status'] };
    const extra = (p.digo_alt_extra ?? []).filter((a) => a !== base.digo_headword);
    const { digo_alt_extra: _e, ...rest } = p;
    return withProv({
      ...rest,
      ...(extra.length ? { digo_alt_extra: extra } : {}),
      digo_headword: base.digo_headword ?? null,
      name_status: base.name_status ?? p.name_status,
    });
  }

  if (change.type === 'plant_info') {
    const { section, lang, mode, text } = change.final_payload as { section: SectionKey; lang: Locale; mode: 'add' | 'replace'; text: string };
    const before = (change.base?.value ?? null) as string | null;
    const applied = mode === 'add' ? addedText(before, text) : text;
    if (plantInfoBase(p, section, lang) !== applied) throw new ConflictError(change.contribution_id, `sections.${section}.${lang}`);
    const restored = { ...(p.sections?.[section] ?? { en: '', sw: null, dg: null }), [lang]: before } as L10n;
    // The change created this section: back to null (how the data marks an empty section), in place.
    const sections = { ...p.sections, [section]: !restored.en && !restored.sw && !restored.dg ? null : restored };
    return withProv({ ...p, sections } as SourcePlant);
  }
  return p;
}
