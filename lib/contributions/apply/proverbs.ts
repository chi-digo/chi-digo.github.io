/**
 * Pure appliers for proverb contributions (spec 34 §16, v2). They work on the shipped shape
 * (public/data/proverbs/index.json), so the live overlay and fold-in run the same code. Apply is
 * idempotent through `provenance`; unapply restores exactly what apply changed, or refuses
 * (ConflictError) if the field moved on.
 */
import type { Proverb, FieldSource } from '@/lib/proverbs/types';
import { proverbSlug } from '@/lib/proverbs/slug';
import { stableStringify } from '../strings';
import { ConflictError, hasChange, withProvenance, withoutProvenance, type Change, type Provenance } from './types';

/** The fixed key order of a proverb (that of the shipped data); `provenance` may follow. */
export const PROVERB_KEYS = ['id', 'slug', 'source_number', 'digo', 'ipa', 'audio', 'literal_en', 'idiomatic_en', 'swahili',
  'swahili_relationship', 'commentary_en', 'commentary_dg', 'commentary_source', 'themes', 'functions', 'keywords_en', 'keywords_sw',
  'related_proverbs', 'lexical_links', 'english_equivalent', 'swahili_equivalent', 'variants', 'content_flag', 'region',
  'source_attribution', 'editorial_status', 'idiomatic_sw', 'commentary_sw', 'field_sources', 'literal_sw', 'idiomatic_dg'] as const;

/** Each commentary field stays readable: at most this many characters (spec 34 §16.9). */
export const COMMENTARY_MAX = 6000;

export type ProverbEntry = Proverb & { provenance?: Provenance; provisional?: boolean };
type Lang = 'en' | 'sw' | 'dg';
type Variant = { form: string; note: string; region?: string | null; c?: string };
type Field = keyof Proverb & string;

/** Keep the fixed key order after a spread, with provenance (if any) and provisional last. */
function shaped(p: ProverbEntry): ProverbEntry {
  const out = Object.fromEntries(PROVERB_KEYS.map((k) => [k, p[k]])) as unknown as ProverbEntry;
  if (p.provenance && Object.keys(p.provenance).length) out.provenance = p.provenance;
  if (p.provisional) out.provisional = true;
  return out;
}

const same = (a: unknown, b: unknown) => stableStringify(a ?? null) === stableStringify(b ?? null);
const text = (p: ProverbEntry, f: Field) => String((p as unknown as Record<string, unknown>)[f] ?? '');

export function meaningField(kind: 'idiomatic' | 'literal', lang: Lang): Field {
  return `${kind}_${lang}` as Field;
}
export function contextField(lang: Lang): Field {
  return `commentary_${lang}` as Field;
}

/**
 * What a meaning or context change is checked against, and what an undo restores: the field's text and
 * its field_sources value (null when the key was absent, so an undo deletes it again).
 */
export function proverbFieldBase(p: ProverbEntry, f: Field) {
  return { text: text(p, f), source: (p.field_sources?.[f] ?? null) as FieldSource | null };
}

function withSource(p: ProverbEntry, f: Field, source: FieldSource | null): ProverbEntry {
  const fs = { ...(p.field_sources ?? {}) };
  if (source === null) delete fs[f];
  else fs[f] = source;
  return { ...p, field_sources: fs };
}

function set(p: ProverbEntry, f: Field, value: string): ProverbEntry {
  return { ...p, [f]: value } as ProverbEntry;
}

/** Apply an accepted change to one proverb. Throws ConflictError if the target moved on. */
export function applyProverb(p: ProverbEntry, change: Change): ProverbEntry {
  if (hasChange(p.provenance, change.contribution_id)) return p;
  const pl = change.final_payload;

  if (change.type === 'proverb_meaning') {
    const f = meaningField(pl.kind as 'idiomatic' | 'literal', pl.lang as Lang);
    // Only a missing base conflicts: an empty field (e.g. p-123) can be filled.
    const base = change.base?.value as { text: string; source: FieldSource | null } | undefined;
    if (!base || !same(proverbFieldBase(p, f), base)) throw new ConflictError(change.contribution_id, f);
    const next = withSource(set(p, f, String(pl.text)), f, 'community' as FieldSource);
    return shaped({ ...next, provenance: withProvenance(p.provenance, f, change) });
  }

  if (change.type === 'proverb_context') {
    // Appends never conflict with each other: each adds its own paragraph.
    const f = contextField(pl.lang as Lang);
    const current = text(p, f);
    const value = current ? `${current}\n\n${String(pl.text)}` : String(pl.text);
    if (value.length > COMMENTARY_MAX) throw new ConflictError(change.contribution_id, f);
    let next = set(p, f, value);
    // The field keeps its existing source (the rest is still what it was); an empty field becomes community.
    if (!current && !p.field_sources?.[f]) next = withSource(next, f, 'community' as FieldSource);
    return shaped({ ...next, provenance: withProvenance(p.provenance, f, change) });
  }

  if (change.type === 'proverb_variant') {
    const v: Variant = { form: String(pl.form), note: String(pl.note ?? ''), region: change.region ?? null, c: change.contribution_id };
    return shaped({
      ...p,
      variants: [...p.variants, v as unknown as Proverb['variants'][number]],
      provenance: withProvenance(p.provenance, 'variants', change),
    });
  }

  return p;
}

/** Undo a change on the data file (revert after fold-in). */
export function unapplyProverb(p: ProverbEntry, change: Change): ProverbEntry {
  if (!hasChange(p.provenance, change.contribution_id)) return p;
  const pl = change.final_payload;
  const c = change.contribution_id;
  const drop = (x: ProverbEntry) => shaped({ ...x, provenance: withoutProvenance(x.provenance, c) });
  const othersOn = (f: string) => (p.provenance?.[f] ?? []).some((e) => e.c !== c);

  if (change.type === 'proverb_meaning') {
    const f = meaningField(pl.kind as 'idiomatic' | 'literal', pl.lang as Lang);
    if (text(p, f) !== String(pl.text)) throw new ConflictError(c, f);
    const base = change.base?.value as { text: string; source: FieldSource | null };
    return drop(withSource(set(p, f, base.text), f, base.source));
  }

  if (change.type === 'proverb_context') {
    // Remove exactly this paragraph, wherever it sits, so another person's story is never lost.
    const f = contextField(pl.lang as Lang);
    const cur = text(p, f);
    const t = String(pl.text);
    let next: string;
    if (cur === t) next = '';
    else if (cur.endsWith(`\n\n${t}`)) next = cur.slice(0, cur.length - t.length - 2);
    else if (cur.startsWith(`${t}\n\n`)) next = cur.slice(t.length + 2);
    else if (cur.includes(`\n\n${t}\n\n`)) next = cur.replace(`\n\n${t}\n\n`, '\n\n');
    else throw new ConflictError(c, f);
    let out = set(p, f, next);
    if (!othersOn(f)) {
      const base = change.base?.value as { text: string; source: FieldSource | null } | undefined;
      if (base) out = withSource(out, f, base.source);
    }
    return drop(out);
  }

  if (change.type === 'proverb_variant') {
    return drop({ ...p, variants: p.variants.filter((v) => (v as Variant).c !== c) });
  }
  return p;
}

/** The proverb region for a contributor's region (spec 34 §16.9). */
const REGION: Record<string, string> = {
  kwale_north: 'KE-coast', kwale_south: 'KE-coast', kinondo_diani: 'KE-coast', tanga: 'TZ-coast', diaspora: 'KE-coast', other: 'KE-coast',
};

/**
 * The proverb a proverb_addition creates. In the overlay: id `c:<uuid>`, slug `p-c-<8 hex>`, provisional.
 * At fold-in: the id the database reserved at accept (`p-NNN`) and `source_number` its number.
 */
export function proverbAdditionEntry(change: Change, id = `c:${change.contribution_id}`): ProverbEntry {
  const pl = change.final_payload as Record<string, unknown>;
  const str = (k: string) => (typeof pl[k] === 'string' ? (pl[k] as string) : '');
  const usageLang = (pl.usage_lang as Lang | undefined) ?? 'en';
  const provisional = id.startsWith('c:');
  const num = provisional ? null : Number(id.slice(2));
  const fields: Record<string, string> = {
    literal_en: str('literal_en'),
    literal_sw: str('literal_sw'),
    idiomatic_en: str('meaning_en'),
    idiomatic_sw: str('meaning_sw'),
    idiomatic_dg: str('meaning_dg'),
    swahili: str('swahili'),
    commentary_en: '', commentary_sw: '', commentary_dg: '',
  };
  if (str('usage')) fields[`commentary_${usageLang}`] = str('usage');
  const field_sources = Object.fromEntries(Object.entries(fields).filter(([, v]) => v).map(([k]) => [k, 'community'])) as Record<string, FieldSource>;
  const p = {
    id,
    slug: provisional ? `p-c-${change.contribution_id.replace(/-/g, '').slice(0, 8)}` : proverbSlug(id, str('digo')),
    source_number: num,
    digo: str('digo').normalize('NFC'),
    ipa: '',
    audio: [],
    ...fields,
    swahili_relationship: 'translation',
    commentary_source: 'native',
    themes: Array.isArray(pl.themes) ? (pl.themes as string[]) : [],
    functions: [],
    keywords_en: [],
    keywords_sw: [],
    related_proverbs: [],
    lexical_links: [],
    english_equivalent: '',
    swahili_equivalent: '',
    variants: [],
    content_flag: pl.mature === true ? 'mature' : null,
    region: REGION[change.region ?? ''] ?? 'KE-coast',
    source_attribution: 'Community contribution',
    editorial_status: 'draft',
    field_sources,
  } as unknown as ProverbEntry;
  return shaped({ ...p, provisional: provisional || undefined, provenance: withProvenance(undefined, 'proverb', change) });
}

/** Apply every change for the proverbs in review order; conflicts are skipped and reported. */
export function applyAllToProverbs(list: ProverbEntry[], changes: Change[], onConflict?: (e: ConflictError) => void): ProverbEntry[] {
  const edits = changes.filter((c) => c.type !== 'proverb_addition');
  if (!edits.length) return list;
  const byId = new Map<string, Change[]>();
  for (const c of edits) byId.set(c.target_id, [...(byId.get(c.target_id) ?? []), c]);
  return list.map((p) => {
    const mine = byId.get(p.id);
    if (!mine) return p;
    return mine.reduce((acc, c) => {
      try {
        return applyProverb(acc, c);
      } catch (e) {
        if (e instanceof ConflictError) {
          onConflict?.(e);
          return acc;
        }
        throw e;
      }
    }, p);
  });
}
