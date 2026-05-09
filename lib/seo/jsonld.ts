const SITE_URL = 'https://chidigo.org';
const SITE_NAME = 'Chidigo';
const PUBLISHER = {
  '@type': 'EducationalOrganization' as const,
  name: SITE_NAME,
  url: SITE_URL,
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
    inLanguage: ['en', 'sw', 'dig'],
  };
}

export function breadcrumbJsonLd(items: { name: string; href: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}${item.href}`,
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
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: opts.title,
    description: opts.description,
    url: `${SITE_URL}${opts.path}`,
    articleSection: opts.section,
    datePublished: opts.datePublished,
    dateModified: opts.dateModified,
    publisher: PUBLISHER,
    inLanguage: 'en',
  };
}

export function definedTermJsonLd(opts: {
  term: string;
  definition: string;
  pos: string;
  path: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'DefinedTerm',
    name: opts.term,
    description: opts.definition,
    inDefinedTermSet: {
      '@type': 'DefinedTermSet',
      name: 'Chidigo Dictionary',
      url: `${SITE_URL}/dictionary`,
    },
    termCode: opts.pos,
    url: `${SITE_URL}${opts.path}`,
  };
}

export function definedTermSetJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'DefinedTermSet',
    name: 'Chidigo Dictionary',
    description:
      'The largest searchable dictionary for the Chidigo (Digo) language, with 5,200+ entries and trilingual definitions in Chidigo, Swahili, and English.',
    url: `${SITE_URL}/dictionary`,
    inLanguage: ['dig', 'sw', 'en'],
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
