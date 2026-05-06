export type Locale = 'en' | 'sw' | 'dig';

export interface LocaleConfig {
  code: Locale;
  name: string;
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
  footer: {
    copyright: string;
  };
}

export const locales: LocaleConfig[] = [
  { code: 'en', name: 'English', htmlLang: 'en', ogLocale: 'en_US' },
  { code: 'sw', name: 'Kiswahili', htmlLang: 'sw', ogLocale: 'sw_KE' },
  { code: 'dig', name: 'Chidigo', htmlLang: 'dig', ogLocale: 'dig' },
];

export const defaultLocale: Locale = 'en';

export const STORAGE_KEY = 'chidigo-lang';

export function isLocale(value: unknown): value is Locale {
  return value === 'en' || value === 'sw' || value === 'dig';
}

export function getLocaleConfig(locale: Locale): LocaleConfig {
  return locales.find((l) => l.code === locale)!;
}
