import type { Locale } from '@/lib/i18n/config';
import { localePath } from '@/lib/i18n/locale-path';

const SITE_URL = 'https://chidigo.org';
const SITE_NAME = 'Chidigo';
const SOCIAL_PROFILES = [
  'https://instagram.com/chidigo_org',
  'https://facebook.com/chidigo.org',
];

const PUBLISHER = {
  '@type': 'EducationalOrganization' as const,
  name: SITE_NAME,
  url: SITE_URL,
  sameAs: SOCIAL_PROFILES,
};

const LOCALE_TO_LANGUAGE: Record<string, string> = {
  en: 'en',
  sw: 'sw',
  dg: 'dg',
};

export function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    description:
      'Building the transmission tools for the Digo language — dictionary, proverbs, audio, and cultural resources for 600,000 speakers on the Kenya–Tanzania coast.',
    publisher: PUBLISHER,
    inLanguage: ['en', 'sw', 'dg'],
  };
}

export function breadcrumbJsonLd(items: { name: string; href: string }[], locale?: Locale) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}${locale ? localePath(item.href, locale) : item.href}`,
    })),
  };
}

export function articleJsonLd(opts: {
  title: string;
  description: string;
  path: string;
  section: string;
  datePublished: string;
  dateModified: string;
  locale?: Locale;
}) {
  const lang = opts.locale ? (LOCALE_TO_LANGUAGE[opts.locale] ?? 'en') : 'en';
  const url = opts.locale ? localePath(opts.path, opts.locale) : opts.path;
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: opts.title,
    description: opts.description,
    url: `${SITE_URL}${url}`,
    articleSection: opts.section,
    datePublished: opts.datePublished,
    dateModified: opts.dateModified,
    publisher: PUBLISHER,
    inLanguage: lang,
  };
}

export function definedTermJsonLd(opts: {
  term: string;
  definition: string;
  pos: string;
  path: string;
  locale?: Locale;
}) {
  const lang = opts.locale ? (LOCALE_TO_LANGUAGE[opts.locale] ?? 'en') : 'en';
  const url = opts.locale ? localePath(opts.path, opts.locale) : opts.path;
  return {
    '@context': 'https://schema.org',
    '@type': 'DefinedTerm',
    name: opts.term,
    description: opts.definition,
    inDefinedTermSet: {
      '@type': 'DefinedTermSet',
      name: 'Chidigo Dictionary',
      url: `${SITE_URL}/language/dictionary`,
    },
    termCode: opts.pos,
    url: `${SITE_URL}${url}`,
    inLanguage: lang,
  };
}

export function definedTermSetJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'DefinedTermSet',
    name: 'Chidigo Dictionary',
    description:
      'The largest searchable dictionary for the Chidigo (Digo) language, with 5,200+ entries and trilingual definitions in Chidigo, Swahili, and English.',
    url: `${SITE_URL}/language/dictionary`,
    inLanguage: ['dg', 'sw', 'en'],
    publisher: PUBLISHER,
  };
}

export function proverbJsonLd(opts: {
  digo: string;
  meaning: string;
  literal?: string;
  themes?: string[];
  path: string;
  locale?: Locale;
}) {
  const url = opts.locale ? localePath(opts.path, opts.locale) : opts.path;
  return {
    '@context': 'https://schema.org',
    '@type': 'Quotation',
    name: opts.digo,
    text: opts.digo,
    // The proverb text is Digo; description/abstract are in the page's language.
    inLanguage: 'dg',
    ...(opts.meaning ? { description: opts.meaning } : {}),
    ...(opts.literal ? { abstract: opts.literal } : {}),
    ...(opts.themes && opts.themes.length ? { keywords: opts.themes.join(', ') } : {}),
    isPartOf: {
      '@type': 'Collection',
      name: 'Chidigo Proverbs',
      url: `${SITE_URL}/language/proverbs`,
    },
    url: `${SITE_URL}${url}`,
    publisher: PUBLISHER,
    isAccessibleForFree: true,
  };
}

export function proverbCollectionJsonLd(count: number) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Collection',
    name: 'Chidigo Proverbs',
    description: `${count} Digo proverbs (ndarira) with literal and idiomatic translations in English and Swahili, meanings in Chidigo, and cultural commentary.`,
    url: `${SITE_URL}/language/proverbs`,
    inLanguage: ['dg', 'sw', 'en'],
    publisher: PUBLISHER,
  };
}

export function faqJsonLd(pairs: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: pairs.map((p) => ({
      '@type': 'Question',
      name: p.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: p.answer,
      },
    })),
  };
}

export function plantJsonLd(opts: {
  name: string;
  alternateNames: string[];
  scientific: string | null;
  authorship?: string | null;
  rank?: 'species' | 'genus';
  family?: string | null;
  description: string;
  sameAs: string[];
  path: string;
  locale?: Locale;
}) {
  const url = opts.locale ? localePath(opts.path, opts.locale) : opts.path;
  return {
    '@context': 'https://schema.org',
    '@type': 'Taxon',
    name: opts.scientific ?? opts.name,
    alternateName: [opts.name, ...opts.alternateNames].filter((n, i, a) => n && a.indexOf(n) === i),
    ...(opts.authorship ? { author: opts.authorship } : {}),
    ...(opts.scientific ? { taxonRank: opts.rank === 'genus' ? 'genus' : 'species' } : {}),
    ...(opts.family ? { parentTaxon: { '@type': 'Taxon', name: opts.family, taxonRank: 'family' } } : {}),
    description: opts.description,
    ...(opts.sameAs.length ? { sameAs: opts.sameAs } : {}),
    url: `${SITE_URL}${url}`,
    isPartOf: {
      '@type': 'DefinedTermSet',
      name: 'Coastal Plants of Digo Country',
      url: `${SITE_URL}/culture/ecology/plants`,
    },
  };
}

export function plantCollectionJsonLd(count: number) {
  return {
    '@context': 'https://schema.org',
    '@type': 'DefinedTermSet',
    name: 'Coastal Plants of Digo Country',
    description: `${count} plants of the Kenya south coast with their names in Chidigo, Kiswahili and English, scientific names, and how the Digo use them.`,
    url: `${SITE_URL}/culture/ecology/plants`,
    inLanguage: ['dg', 'sw', 'en'],
    publisher: PUBLISHER,
  };
}
