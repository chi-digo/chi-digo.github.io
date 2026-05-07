export type Locale = 'en' | 'sw' | 'dig';

export interface LocaleConfig {
  code: Locale;
  name: string;
  shortName: string;
  htmlLang: string;
  ogLocale: string;
}

export interface Messages {
  meta: {
    title: string;
    description: string;
    og_title: string;
    og_description: string;
    og_locale: string;
    twitter_title: string;
    twitter_description: string;
  };
  nav: {
    language_selector_label: string;
    language_name: string;
    home_link: string;
    culture_link: string;
    language_link: string;
    history_link: string;
  };
  culture: {
    overview_eyebrow: string;
    overview_title: string;
    section_title: string;
    section_subtitle: string;
    back_to_culture: string;
    back_to_domain: string;
    related_topics: string;
    map_heading: string;
    fuko_heading: string;
    topics_heading: string;
  };
  language: {
    eyebrow: string;
    title: string;
    intro: string;
    dialects_heading: string;
    tools_heading: string;
    topics_heading: string;
    back_to_language: string;
    related_topics: string;
  };
  dictionary: {
    section_title: string;
    section_subtitle: string;
    search_placeholder: string;
    word_of_the_day: string;
    no_results: string;
    searching: string;
    results_for: string;
    entry_not_found: string;
    equivalents_en: string;
    equivalents_sw: string;
    sub_entries: string;
    synonyms: string;
    see_also: string;
    browse_letters: string;
    back_to_dictionary: string;
    try_different_word: string;
  };
  hero: {
    title: string;
    proverb_digo: string;
    proverb_gloss: string;
  };
  what_is_digo: {
    eyebrow: string;
    heading: string;
    geography_label: string;
    geography_text: string;
    family_label: string;
    family_text: string;
    numbers_label: string;
    numbers_text: string;
    cultural_anchors_label: string;
    kayas_text: string;
    coastal_life_text: string;
    music_text: string;
    dress_text: string;
  };
  the_problem: {
    eyebrow: string;
    pull_quote: string;
    body_1: string;
    body_1_cliff: string;
    body_2: string;
  };
  our_mission: {
    eyebrow: string;
    statement: string;
    statement_highlight: string;
  };
  history: {
    eyebrow: string;
    title: string;
    intro: string;
    timeline_heading: string;
    figures_heading: string;
    topics_heading: string;
    back_to_history: string;
  };
  breadcrumb: {
    home: string;
    culture: string;
    language: string;
    dictionary: string;
    history: string;
  };
  footer: {
    copyright: string;
  };
}

export const locales: LocaleConfig[] = [
  { code: 'en', name: 'English', shortName: 'ENG', htmlLang: 'en', ogLocale: 'en_US' },
  { code: 'sw', name: 'Kiswahili', shortName: 'SWA', htmlLang: 'sw', ogLocale: 'sw_KE' },
  { code: 'dig', name: 'Chidigo', shortName: 'DIG', htmlLang: 'dig', ogLocale: 'dig' },
];

export const defaultLocale: Locale = 'en';

export const STORAGE_KEY = 'chidigo-lang';

export function isLocale(value: unknown): value is Locale {
  return value === 'en' || value === 'sw' || value === 'dig';
}

export function getLocaleConfig(locale: Locale): LocaleConfig {
  return locales.find((l) => l.code === locale)!;
}
