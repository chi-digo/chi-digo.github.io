import type { Locale } from '@/lib/i18n/config';
import { searchDropdown, type SearchResult } from '@/lib/dictionary/search';
import { searchProverbsDropdown } from '@/lib/proverbs/search';
import type { Proverb } from '@/lib/proverbs/types';
import { searchContent, type ContentSearchResult } from './content';

export interface UniversalSearchResults {
  words: SearchResult[];
  proverbs: Proverb[];
  articles: ContentSearchResult[];
}

function flattenDictionaryResults(grouped: {
  dg: SearchResult[];
  sw: SearchResult[];
  en: SearchResult[];
}): SearchResult[] {
  const seen = new Set<string>();
  const flat: SearchResult[] = [];
  for (const result of [...grouped.dg, ...grouped.en, ...grouped.sw]) {
    if (seen.has(result.id)) continue;
    seen.add(result.id);
    flat.push(result);
  }
  return flat.slice(0, 3);
}

function flattenProverbResults(grouped: {
  dg: Proverb[];
  en: Proverb[];
  sw: Proverb[];
}): Proverb[] {
  const seen = new Set<string>();
  const flat: Proverb[] = [];
  for (const result of [...grouped.dg, ...grouped.en, ...grouped.sw]) {
    if (seen.has(result.id)) continue;
    seen.add(result.id);
    flat.push(result);
  }
  return flat.slice(0, 3);
}

export async function universalSearch(
  query: string,
  locale: Locale = 'en',
): Promise<UniversalSearchResults> {
  if (!query || query.trim().length < 2) {
    return { words: [], proverbs: [], articles: [] };
  }

  const [dictResults, proverbResults, articleResults] = await Promise.all([
    searchDropdown(query),
    searchProverbsDropdown(query),
    searchContent(query, locale),
  ]);

  return {
    words: flattenDictionaryResults(dictResults),
    proverbs: flattenProverbResults(proverbResults),
    articles: articleResults.slice(0, 3),
  };
}

export async function universalSearchFull(
  query: string,
  locale: Locale = 'en',
): Promise<UniversalSearchResults> {
  if (!query || query.trim().length < 2) {
    return { words: [], proverbs: [], articles: [] };
  }

  const { searchAll } = await import('@/lib/dictionary/search');
  const { searchProverbs } = await import('@/lib/proverbs/search');

  const [dictResults, proverbResults, articleResults] = await Promise.all([
    searchAll(query),
    searchProverbs(query),
    searchContent(query, locale),
  ]);

  const words: SearchResult[] = [];
  const seenWords = new Set<string>();
  for (const r of [...dictResults.dg, ...dictResults.en, ...dictResults.sw]) {
    if (seenWords.has(r.id)) continue;
    seenWords.add(r.id);
    words.push(r);
  }

  const proverbs: Proverb[] = [];
  const seenProverbs = new Set<string>();
  for (const r of [...proverbResults.dg, ...proverbResults.en, ...proverbResults.sw]) {
    if (seenProverbs.has(r.id)) continue;
    seenProverbs.add(r.id);
    proverbs.push(r);
  }

  return {
    words,
    proverbs,
    articles: articleResults,
  };
}
