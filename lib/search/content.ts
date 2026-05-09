import type { Locale } from '@/lib/i18n/config';

export type ContentIndexEntry = {
  slug: string;
  section: 'culture' | 'history' | 'language';
  domain?: string;
  title: Record<Locale, string>;
  intro: Record<Locale, string>;
  keywords: string[];
  digo_terms: string[];
};

export type ContentSearchResult = ContentIndexEntry & {
  score: number;
  href: string;
};

let indexCache: ContentIndexEntry[] | null = null;

async function loadContentIndex(): Promise<ContentIndexEntry[]> {
  if (indexCache) return indexCache;
  const res = await fetch('/data/content-index.json');
  indexCache = await res.json();
  return indexCache!;
}

function scoreEntry(entry: ContentIndexEntry, query: string, locale: Locale): number {
  const q = query.toLowerCase();
  let score = 0;

  const titleLocal = entry.title[locale]?.toLowerCase() ?? '';
  const titleEn = entry.title.en?.toLowerCase() ?? '';
  const titleSw = entry.title.sw?.toLowerCase() ?? '';
  const titleDig = entry.title.dig?.toLowerCase() ?? '';

  if (titleLocal === q || titleEn === q || titleSw === q || titleDig === q) {
    score = 100;
  } else if (titleLocal.startsWith(q) || titleEn.startsWith(q) || titleSw.startsWith(q) || titleDig.startsWith(q)) {
    score = 80;
  } else if (entry.keywords.some((k) => k === q)) {
    score = 60;
  } else if (entry.digo_terms.some((t) => t === q || t.startsWith(q))) {
    score = 40;
  } else if (
    titleLocal.includes(q) || titleEn.includes(q) || titleSw.includes(q) || titleDig.includes(q)
  ) {
    score = 30;
  } else {
    const introLocal = entry.intro[locale]?.toLowerCase() ?? '';
    if (introLocal.includes(q) || entry.intro.en?.toLowerCase().includes(q)) {
      score = 20;
    } else if (entry.keywords.some((k) => k.includes(q))) {
      score = 15;
    } else if (entry.digo_terms.some((t) => t.includes(q))) {
      score = 10;
    }
  }

  return score;
}

function buildHref(entry: ContentIndexEntry): string {
  switch (entry.section) {
    case 'culture':
      return `/culture/${entry.slug}`;
    case 'history':
      return `/history/${entry.slug}`;
    case 'language':
      return `/language/${entry.slug}`;
  }
}

export async function searchContent(
  query: string,
  locale: Locale = 'en',
): Promise<ContentSearchResult[]> {
  if (!query || query.trim().length < 2) return [];

  const index = await loadContentIndex();
  const q = query.trim();

  const scored: ContentSearchResult[] = [];

  for (const entry of index) {
    const score = scoreEntry(entry, q, locale);
    if (score > 0) {
      scored.push({ ...entry, score, href: buildHref(entry) });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 10);
}
