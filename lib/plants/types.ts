import type { Locale } from '@/lib/i18n/config';

/** Text in the three site languages. sw/dg are null until translated (spec 33 §10). */
export type L10n = Record<Locale, string | null> & { en: string };

export type NameStatus = 'attested' | 'conflict' | 'missing' | 'confirmed';

export type PartKind = 'leaf' | 'stem' | 'root' | 'flower' | 'fruit' | 'fruit_stage' | 'seed' | 'bunch' | 'product' | 'other';

export interface PlantPart {
  term: string;
  plural?: string;
  kind: PartKind;
  stage_order?: number;
  definition: L10n;
  use?: L10n | null;
  meaning?: L10n | null;
  english?: string;
  swahili?: string;
  shared_with?: string[];
  source: string;
  dict_headword?: string;
}

export interface Taxon {
  accepted_name: string;
  accepted_authorship: string | null;
  family: string | null;
  order: string | null;
  status: 'ACCEPTED' | 'SYNONYM' | null;
  level: 'species' | 'genus';
  gbif_key: number;
  links: { gbif: string; powo?: string; ipni?: string; index_fungorum?: string };
  note?: string | null;
}

/** Lightweight record from /data/plants/index.json, used by the list views and search. */
export interface PlantStub {
  id: string;
  slug: string;
  digo_headword: string | null;
  digo_alt: string[];
  english: string | null;
  swahili: string | null;
  /** Accepted scientific name, or null for unidentified mushrooms. */
  scientific: string | null;
  family: string | null;
  section: string;
  themes: string[];
  teaser: L10n;
  name_status: NameStatus;
  has_parts: boolean;
  has_prose: Record<Locale, boolean>;
  search_terms: string[];
}

export type SectionKey = 'about' | 'where' | 'uses' | 'culture' | 'names' | 'conservation';

/** Full record from /data/plants/p/<slug>.json, used by the plant page. */
export interface Plant extends Omit<PlantStub, 'search_terms' | 'scientific' | 'family'> {
  digo: string | null;
  digo_source: string | null;
  /** Scientific name as recorded in our sources (may be a synonym of taxon.accepted_name). */
  scientific: string;
  family: string | null;
  other_mijikenda: string | null;
  summary: L10n;
  sections: Partial<Record<SectionKey, L10n | null>>;
  related: { slug: string; reason: L10n }[];
  parts: PlantPart[];
  taxon: Taxon | null;
  mgombato: string[];
  sources: string[];
  digo_proposals: { name: string; source: string; note?: string }[];
  name_credit: string | null;
}

export interface GlossaryTerm {
  term: string;
  plural?: string;
  kind: PartKind;
  definition: L10n;
  meaning?: L10n | null;
  english?: string;
  swahili?: string;
  source: string;
  dict_headword?: string;
  notes?: string;
}

export interface GroupedPlantResults {
  dg: PlantStub[];
  sw: PlantStub[];
  en: PlantStub[];
  sci: PlantStub[];
  total: number;
}

/** Prose in the reader's language, falling back to English (spec 33 §10.4). */
export function localized(text: L10n | null | undefined, locale: Locale): { text: string; fallback: boolean } | null {
  if (!text || !text.en) return null;
  const value = text[locale];
  return value ? { text: value, fallback: false } : { text: text.en, fallback: locale !== 'en' };
}
