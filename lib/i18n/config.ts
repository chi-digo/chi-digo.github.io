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
    overview_intro: string;
    overview_proverb: string;
    overview_proverb_gloss: string;
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
    featured_word: string;
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
  proverbs: {
    title: string;
    search_placeholder: string;
    browse_by_theme: string;
    browse_by_letter: string;
    proverb_of_the_day: string;
    discover_another: string;
    related: string;
    when_to_use: string;
    share: string;
    english_equivalent: string;
    swahili_cognate: string;
    swahili_parallel: string;
    no_results: string;
    cultural_context: string;
    all_themes: string;
    count: string;
    mature_content: string;
    ai_assisted: string;
    contribute: string;
    see_all: string;
    searching: string;
    results_for: string;
    back_to_proverbs: string;
    literal_translation: string;
    idiomatic_translation: string;
    try_different_search: string;
    swahili_translation: string;
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
    proverbs: string;
    history: string;
    about: string;
    mission: string;
    vision: string;
    contact: string;
  };
  about: {
    eyebrow: string;
    title: string;
    who_we_are_heading: string;
    who_we_are_body: string;
    problem_heading: string;
    problem_quote: string;
    problem_body_1: string;
    problem_body_1_cliff: string;
    problem_body_2: string;
    problem_body_3: string;
    approach_heading: string;
    approach_tools: string;
    approach_content: string;
    approach_platforms: string;
    why_now_heading: string;
    why_now_body: string;
  };
  mission: {
    eyebrow: string;
    title: string;
    statement: string;
    statement_highlight: string;
    tools_heading: string;
    tools_body: string;
    content_heading: string;
    content_body: string;
    platforms_heading: string;
    platforms_body: string;
    principles_heading: string;
    principle_1: string;
    principle_2: string;
    principle_3: string;
    principle_4: string;
    principle_5: string;
    principle_6: string;
    principle_7: string;
    commitments_heading: string;
    commitment_1: string;
    commitment_2: string;
    commitment_3: string;
    commitment_4: string;
  };
  vision: {
    eyebrow: string;
    title: string;
    picture_heading: string;
    picture_body: string;
    tiers_heading: string;
    tier1_name: string;
    tier1_subtitle: string;
    tier1_body: string;
    tier2_name: string;
    tier2_subtitle: string;
    tier2_body: string;
    tier3_name: string;
    tier3_subtitle: string;
    tier3_body: string;
    tier4_name: string;
    tier4_subtitle: string;
    tier4_body: string;
    roadmap_heading: string;
    year1: string;
    year2: string;
    year3: string;
    year4_5: string;
    theory_heading: string;
    theory_body: string;
  };
  contact: {
    eyebrow: string;
    title: string;
    form_name_label: string;
    form_name_placeholder: string;
    form_email_label: string;
    form_email_placeholder: string;
    form_message_label: string;
    form_message_placeholder: string;
    form_submit: string;
    form_sending: string;
    form_success: string;
    form_error: string;
    location: string;
    get_involved_heading: string;
    get_involved_intro: string;
    role_word_title: string;
    role_word_body: string;
    role_review_title: string;
    role_review_body: string;
    role_proverb_title: string;
    role_proverb_body: string;
    role_audio_title: string;
    role_audio_body: string;
    partners_heading: string;
    partners_body: string;
  };
  not_found: {
    title: string;
    description: string;
    back_home: string;
    search: string;
  };
  cta: {
    section_eyebrow: string;
    about_title: string;
    about_body: string;
    mission_title: string;
    mission_body: string;
    vision_title: string;
    vision_body: string;
    contact_title: string;
    contact_body: string;
  };
  quiz: {
    title: string;
    loading: string;
    loadingProgress: string;
    loadError: string;
    retry: string;
    questionOf: string;
    correct: string;
    incorrect: string;
    continue: string;
    explanation: string;
    results: {
      title: string;
      perfect: string;
      great: string;
      good: string;
      tryAgain: string;
      score: string;
      playAgain: string;
      backToTools: string;
    };
    categories: {
      vocabulary: string;
      proverbs: string;
      riddles: string;
    };
    difficulty: {
      easy: string;
      medium: string;
      hard: string;
    };
  };
  footer: {
    copyright: string;
    about_heading: string;
    explore_heading: string;
    connect_heading: string;
    about_link: string;
    mission_link: string;
    vision_link: string;
    contact_link: string;
    license: string;
  };
  share: {
    button_label: string;
    share_image: string;
    copy_link: string;
    link_copied: string;
    image_saved: string;
    generating: string;
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
