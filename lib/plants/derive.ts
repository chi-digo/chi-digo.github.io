/**
 * Turns the plants source (content/plants/plants.json) into the files the app ships:
 * index.json stubs and p/<slug>.json records (spec 33 §11, spec 34 technical §6.3).
 *
 * A TypeScript port of context/plants/sync-to-app.py, kept byte-for-byte compatible with it, so the
 * build, fold-in and the round-trip tests all derive plants the same way. It adds the community
 * fields: `provenance` (on stubs and records), `digo_variants`, and `digo_alt_extra` names, which are
 * folded into `digo_alt` and the search terms.
 */
import type { L10n, Plant, PlantStub } from './types';
import type { Provenance } from '@/lib/contributions/apply/types';

/** A plant as stored in content/plants/plants.json (no derived fields, no review-only fields). */
export interface SourcePlant {
  id: string;
  slug: string;
  digo_headword: string | null;
  digo: string | null;
  digo_source: string | null;
  english: string | null;
  swahili: string | null;
  scientific: string;
  family: string | null;
  other_mijikenda: string | null;
  section: string;
  themes: string[];
  teaser: L10n;
  summary: L10n;
  sections: Plant['sections'];
  related: Plant['related'];
  parts: Plant['parts'];
  taxon: (Plant['taxon'] & { matched_name?: string | null }) | null;
  mgombato: string[];
  sources: string[];
  name_status: Plant['name_status'];
  digo_proposals: Plant['digo_proposals'];
  name_credit: string | null;
  field_sources?: Record<string, string>;
  editorial_status?: unknown;
  /** Community: earlier headwords and other names to keep listed as alternatives. */
  digo_alt_extra?: string[];
  digo_variants?: { form: string; region: string | null; c: string }[];
  provenance?: Provenance;
}

// English notes that research left inside the Digo name field ("also healers' name: …", "(tree)").
const NOTE_WORDS = /\b(also|healers'?|name|names|tree|fruit|seed|seeds|pod|leaf|leaves|cob|plant|stem|north|south|n|s|pl|plural|see|variant|spelling|or)\b[:.]?/gi;

function pyStrip(s: string, chars: string): string {
  let a = 0;
  let b = s.length;
  while (a < b && chars.includes(s[a])) a++;
  while (b > a && chars.includes(s[b - 1])) b--;
  return s.slice(a, b);
}

/** Alternative Digo names: those in the `digo` notes, then community extras and regional forms. */
export function digoAlt(p: SourcePlant): string[] {
  const head = (p.digo_headword ?? '').toLowerCase();
  const partTerms = new Set((p.parts ?? []).map((x) => x.term.toLowerCase()));
  const out: string[] = [];
  const digo = p.digo ?? '';
  // Names given inside notes, e.g. "Mvumo (also Dzova; fruit Ngolokolo)" or "healers' name: Mkulu kazingwa".
  const extra = [...digo.matchAll(/(?:also|healers'? name:?)\s+([A-Z][a-z'’]+(?: [a-z'’]+)?)/g)].map((m) => m[1]);
  const pieces = digo.replace(/\(.*?\)/g, '').split(/[;/]/);
  for (const raw of [...pieces, ...extra]) {
    let name = raw.replace(NOTE_WORDS, ' ');
    name = pyStrip(name.replace(/\s+/g, ' ').trim(), " ,:-'’");
    if (!name || name.length < 3 || !/^[A-Za-z'’ -]+$/.test(name)) continue;
    const low = name.toLowerCase();
    if (low === head || partTerms.has(low) || out.some((o) => o.toLowerCase() === low)) continue;
    out.push(name[0].toUpperCase() + name.slice(1));
  }
  // Community names: earlier headwords and accepted regional forms.
  for (const name of [...(p.digo_alt_extra ?? []), ...(p.digo_variants ?? []).map((v) => v.form)]) {
    const low = name.toLowerCase();
    if (!name || low === head || out.some((o) => o.toLowerCase() === low)) continue;
    out.push(name);
  }
  return out;
}

/** How a name becomes search terms (shared with the overlay's stub applier). */
export function termPieces(t: string | null | undefined): string[] {
  return (t ?? '').split(/[;,/]/).map((piece) => piece.replace(/\(.*?\)/g, '').trim().toLowerCase()).filter(Boolean);
}

export function searchTerms(p: SourcePlant): string[] {
  const tx = p.taxon;
  const terms: (string | null | undefined)[] = [p.digo_headword, p.english, p.swahili, p.scientific, p.other_mijikenda];
  terms.push(...digoAlt(p));
  terms.push(...(p.digo_proposals ?? []).map((q) => q.name));
  terms.push(tx?.accepted_name, tx?.family);
  terms.push(...(p.parts ?? []).map((x) => x.term));
  // Older or variant Latin names quoted in Mgombato lines, e.g. 'Bauhinia thonningii' for Piliostigma.
  for (const line of p.mgombato ?? []) terms.push(...[...line.matchAll(/\(([A-Z][a-z]+ [a-z]+)/g)].map((m) => m[1]));
  terms.push(tx?.matched_name);
  const out: string[] = [];
  for (const t of terms) {
    for (const clean of termPieces(t)) if (!out.includes(clean)) out.push(clean);
  }
  return out;
}

function scientificDisplay(p: SourcePlant): string | null {
  if (p.taxon?.accepted_name) return p.taxon.accepted_name;
  return (p.scientific ?? '').startsWith('Unidentified') ? null : p.scientific;
}

export function hasProse(p: Pick<SourcePlant, 'summary' | 'sections'>, lang: 'en' | 'sw' | 'dg'): boolean {
  return !!p.summary?.[lang] && Object.values(p.sections ?? {}).every((v) => !v || !v.en || !!v[lang]);
}

export function deriveStub(p: SourcePlant): PlantStub {
  const stub: PlantStub = {
    id: p.id,
    slug: p.slug,
    digo_headword: p.digo_headword ?? null,
    digo_alt: digoAlt(p),
    english: p.english ?? null,
    swahili: p.swahili ?? null,
    scientific: scientificDisplay(p),
    family: p.taxon?.family || p.family || null,
    section: p.section,
    themes: p.themes,
    teaser: p.teaser,
    name_status: p.name_status,
    has_parts: (p.parts ?? []).length > 0,
    has_prose: { en: hasProse(p, 'en'), sw: hasProse(p, 'sw'), dg: hasProse(p, 'dg') },
    search_terms: searchTerms(p),
  };
  if (p.provenance) stub.provenance = p.provenance;
  return stub;
}

const FULL_KEYS = [
  'id', 'slug', 'digo_headword', 'digo', 'digo_source', 'english', 'swahili', 'scientific', 'family',
  'other_mijikenda', 'section', 'themes', 'teaser', 'summary', 'sections', 'related', 'parts', 'taxon',
  'mgombato', 'sources', 'name_status', 'digo_proposals', 'name_credit', 'field_sources', 'editorial_status',
] as const;

export function derivePlant(p: SourcePlant, stub: PlantStub = deriveStub(p)): Plant {
  const full: Record<string, unknown> = {};
  for (const k of FULL_KEYS) full[k] = (p as unknown as Record<string, unknown>)[k] ?? null;
  full.digo_alt = stub.digo_alt;
  full.has_prose = stub.has_prose;
  if (p.digo_variants?.length) full.digo_variants = p.digo_variants;
  if (p.provenance) full.provenance = p.provenance;
  return full as unknown as Plant;
}

/** JSON exactly as the Python sync wrote it (compact, non-ASCII kept). */
export function compactJson(value: unknown): string {
  return JSON.stringify(value);
}
