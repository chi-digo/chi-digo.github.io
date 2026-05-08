export type FieldSource = 'original' | 'ai-draft' | 'ai-reviewed' | 'native';

export interface Proverb {
  id: string;
  slug: string;
  source_number: number;
  digo: string;
  ipa: string;
  audio: { file: string; voice: string }[];
  literal_en: string;
  idiomatic_en: string;
  idiomatic_sw: string;
  swahili: string;
  swahili_relationship: 'cognate' | 'parallel' | 'translation';
  commentary_en: string;
  commentary_sw: string;
  commentary_dg: string;
  commentary_source: 'original' | 'expanded' | 'native';
  field_sources: Record<string, FieldSource>;
  themes: string[];
  functions: string[];
  keywords_en: string[];
  keywords_sw: string[];
  related_proverbs: string[];
  lexical_links: { term: string; dict_id: string }[];
  english_equivalent: string;
  swahili_equivalent: string;
  variants: { form: string; note: string }[];
  content_flag: 'mature' | null;
  region: string;
  source_attribution: string;
  editorial_status: 'draft' | 'reviewed' | 'published';
}

export interface GroupedProverbResults {
  dg: Proverb[];
  en: Proverb[];
  sw: Proverb[];
  total: number;
}
