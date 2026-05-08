export interface Example {
  dg: string;
  en: string;
  sw: string;
  source: "mgombato" | "generated" | "bible" | "proverb" | "manual";
}

export interface Sense {
  sense_id: number;
  definition_en: string;
  definition_sw: string;
  definition_dg: string;
  definition_dg_status: "pending" | "draft" | "reviewed" | "published";
  examples: Example[];
  synonyms_dg: string[];
  antonyms_dg: string[];
  cross_refs: string[];
  cultural_note: string | null;
  register: "neutral" | "formal" | "colloquial" | "archaic" | "literary";
  dialect_tags: string[];
}

export interface SubEntry {
  id: string;
  form: string;
  pos: string;
  pos_en: string;
  definition_en: string;
  definition_sw: string;
  definition_dg: string | null;
  definition_dg_status: string;
  examples: Example[];
  register: string;
  dialect_tags: string[];
  editorial_state: string;
}

export interface Etymology {
  source: string | null;
  root: string | null;
  notes: string;
}

export interface DictionaryEntry {
  id: string;
  headword: string;
  homonym_index: number | null;
  sort_key: string;
  pos: string;
  pos_en: string;
  noun_class: number | null;
  plural_prefix: string | null;
  plural_form: string | null;
  ipa: string;
  audio: string[];
  equivalents_en: string[];
  equivalents_sw: string[];
  variants: { form: string; dialect: string; note: string }[];
  senses: Sense[];
  etymology: Etymology;
  bible_refs: string[];
  proverb_refs: string[];
  sub_entries: SubEntry[];
  editorial_state: string;
  is_redirect: boolean;
  redirect_target: string | null;
}

export interface LetterFile {
  letter: string;
  count: number;
  entries: DictionaryEntry[];
}

export interface SearchIndexEntry {
  sk: string;
  hw: string;
  id: string;
  pos: string;
  eq: string;
  eq_sw?: string;
  eq_dg?: string;
}

export interface IndexMetadata {
  schema_version: string;
  generated_at: string;
  total_entries: number;
  letters: Record<string, {
    count: number;
    file_size_kb?: number;
    first?: string;
    last?: string;
    digraph_sections?: Record<string, { count: number; first_index: number }>;
  }>;
  digo_alphabet: string[];
}

export type ReverseIndex = Record<string, [string, string][]>;

export interface FuzzyRule {
  id: string;
  swahili: string;
  digo: string;
  example: { sw: string; dg: string };
  position: string;
  note?: string;
}

export interface FuzzyRules {
  version: string;
  description: string;
  rules: FuzzyRule[];
  digraph_normalizations: { from: string; to: string; note: string }[];
}
