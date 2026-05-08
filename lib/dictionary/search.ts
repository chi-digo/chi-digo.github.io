import type { SearchIndexEntry, ReverseIndex } from "./types";
import { loadLetterIndex, loadReverseIndex } from "./loader";
import { digoize } from "./fuzzy";
import { stripPrefixes } from "./morphology";

export interface SearchResult {
  id: string;
  headword: string;
  pos: string;
  equivalent: string;
  equivalent_sw: string;
  equivalent_dg: string;
  letter: string;
  language: "dg" | "sw" | "en";
}

const MAX_RESULTS_PER_TIER = 10;

const DIGO_PREFIXES_SEARCH = [
  "gbw", "kpw", "ndz", "ng'", "ch", "dz", "m'", "ng", "ph", "sh", "ts",
];

function letterForQuery(query: string): string {
  const q = query.toLowerCase();
  for (const prefix of DIGO_PREFIXES_SEARCH) {
    if (q.startsWith(prefix)) return prefix;
  }
  return q[0];
}

function binarySearch(
  entries: SearchIndexEntry[],
  target: string
): SearchIndexEntry | null {
  let lo = 0;
  let hi = entries.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >>> 1;
    const cmp = entries[mid].sk.localeCompare(target);
    if (cmp === 0) return entries[mid];
    if (cmp < 0) lo = mid + 1;
    else hi = mid - 1;
  }
  return null;
}

function prefixSearch(
  entries: SearchIndexEntry[],
  prefix: string,
  limit: number = MAX_RESULTS_PER_TIER
): SearchIndexEntry[] {
  let lo = 0;
  let hi = entries.length - 1;
  let start = entries.length;

  while (lo <= hi) {
    const mid = (lo + hi) >>> 1;
    if (entries[mid].sk >= prefix) {
      start = mid;
      hi = mid - 1;
    } else {
      lo = mid + 1;
    }
  }

  const results: SearchIndexEntry[] = [];
  for (
    let i = start;
    i < entries.length && results.length < limit;
    i++
  ) {
    if (!entries[i].sk.startsWith(prefix)) break;
    results.push(entries[i]);
  }
  return results;
}

function cleanHw(raw: string): string {
  return raw.replace(/[\d;]+$/, "");
}

function toSearchResult(
  entry: SearchIndexEntry,
  language: "dg" | "sw" | "en"
): SearchResult {
  return {
    id: entry.id,
    headword: cleanHw(entry.hw),
    pos: entry.pos,
    equivalent: entry.eq,
    equivalent_sw: entry.eq_sw || '',
    equivalent_dg: entry.eq_dg || '',
    letter: entry.id.charAt(0),
    language,
  };
}

async function searchDigo(query: string): Promise<SearchResult[]> {
  const q = query.toLowerCase();
  const letter = letterForQuery(q);

  let idx: SearchIndexEntry[];
  try {
    idx = await loadLetterIndex(letter);
  } catch {
    return [];
  }

  const exact = binarySearch(idx, q);
  if (exact) {
    const allExact = idx.filter((e) => e.sk === q);
    const rest = prefixSearch(idx, q, MAX_RESULTS_PER_TIER).filter(
      (e) => e.sk !== q
    );
    return [...allExact, ...rest].map((e) => toSearchResult(e, "dg"));
  }

  const prefixResults = prefixSearch(idx, q);
  if (prefixResults.length > 0) {
    return prefixResults.map((e) => toSearchResult(e, "dg"));
  }

  return [];
}

async function searchReverse(
  query: string,
  lang: "en" | "sw"
): Promise<SearchResult[]> {
  const q = query.toLowerCase();
  let reverseIdx: ReverseIndex;
  try {
    reverseIdx = await loadReverseIndex(lang);
  } catch {
    return [];
  }

  const results: SearchResult[] = [];
  const seen = new Set<string>();

  for (const [term, entries] of Object.entries(reverseIdx)) {
    if (results.length >= MAX_RESULTS_PER_TIER) break;
    if (term.toLowerCase().includes(q)) {
      for (const [letter, id] of entries) {
        if (seen.has(id)) continue;
        seen.add(id);
        results.push({
          id,
          headword: cleanHw(id.replace(/\.\d+$/, "")),
          pos: "",
          equivalent: term,
          equivalent_sw: '',
          equivalent_dg: '',
          letter,
          language: lang === "sw" ? "sw" : "en",
        });
        if (results.length >= MAX_RESULTS_PER_TIER) break;
      }
    }
  }

  return results;
}

async function searchDigoFuzzy(query: string): Promise<SearchResult[]> {
  const digoized = await digoize(query);
  if (digoized === query.toLowerCase()) return [];

  const letter = letterForQuery(digoized);
  let idx: SearchIndexEntry[];
  try {
    idx = await loadLetterIndex(letter);
  } catch {
    return [];
  }

  const results = prefixSearch(idx, digoized);
  return results.map((e) => toSearchResult(e, "dg"));
}

async function searchMorphological(query: string): Promise<SearchResult[]> {
  const q = query.toLowerCase();
  const stems = stripPrefixes(q);
  const results: SearchResult[] = [];
  const seen = new Set<string>();

  for (const stem of stems) {
    if (stem === q || stem.length < 2) continue;
    const letter = letterForQuery(stem);
    let idx: SearchIndexEntry[];
    try {
      idx = await loadLetterIndex(letter);
    } catch {
      continue;
    }

    const matches = prefixSearch(idx, stem, 5);
    for (const m of matches) {
      if (seen.has(m.id)) continue;
      seen.add(m.id);
      results.push(toSearchResult(m, "dg"));
    }
    if (results.length >= MAX_RESULTS_PER_TIER) break;
  }

  return results;
}

export interface GroupedSearchResults {
  dg: SearchResult[];
  sw: SearchResult[];
  en: SearchResult[];
  total: number;
}

export async function searchAll(query: string): Promise<GroupedSearchResults> {
  if (!query || query.trim().length === 0) {
    return { dg: [], sw: [], en: [], total: 0 };
  }

  const q = query.trim();

  const dg = await searchDigo(q);

  let sw: SearchResult[] = [];
  let en: SearchResult[] = [];

  if (dg.length < MAX_RESULTS_PER_TIER) {
    [sw, en] = await Promise.all([
      searchReverse(q, "sw"),
      searchReverse(q, "en"),
    ]);
  }

  if (dg.length === 0 && sw.length === 0 && en.length === 0) {
    const fuzzyDg = await searchDigoFuzzy(q);
    if (fuzzyDg.length > 0) {
      dg.push(...fuzzyDg);
    } else {
      const morphDg = await searchMorphological(q);
      dg.push(...morphDg);
    }
  }

  const seenHeadwords = new Set<string>();
  const dedup = (results: SearchResult[]) =>
    results.filter((r) => {
      const key = r.headword + '::' + r.language;
      if (seenHeadwords.has(key)) return false;
      seenHeadwords.add(key);
      return true;
    });

  const dgDeduped = dedup(dg);
  const swDeduped = dedup(sw);
  const enDeduped = dedup(en);

  return {
    dg: dgDeduped,
    sw: swDeduped,
    en: enDeduped,
    total: dgDeduped.length + swDeduped.length + enDeduped.length,
  };
}

export async function searchDropdown(
  query: string
): Promise<GroupedSearchResults> {
  if (!query || query.trim().length < 2) {
    return { dg: [], sw: [], en: [], total: 0 };
  }
  return searchAll(query);
}
