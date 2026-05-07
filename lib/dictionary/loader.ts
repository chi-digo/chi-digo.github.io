import type {
  IndexMetadata,
  SearchIndexEntry,
  LetterFile,
  DictionaryEntry,
  ReverseIndex,
  FuzzyRules,
} from "./types";

const cache = new Map<string, unknown>();

const DIGO_PREFIXES = [
  "gbw", "kpw", "ndz", "ng'", "ch", "dz", "m'", "ng", "ph", "sh", "ts",
  "a", "b", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m",
  "n", "o", "p", "r", "s", "t", "u", "v", "w", "y", "z",
];

function digoLetterFile(letter: string): string {
  const lc = letter.toLowerCase();
  for (const prefix of DIGO_PREFIXES) {
    if (lc.startsWith(prefix)) {
      return prefix.replace(/'/g, "_");
    }
  }
  return lc.charAt(0);
}

async function fetchJson<T>(path: string): Promise<T> {
  const cached = cache.get(path);
  if (cached) {
    console.debug(`[DICT-DEBUG] fetchJson cache HIT: ${path}`);
    return cached as T;
  }

  console.debug(`[DICT-DEBUG] fetchJson cache MISS, fetching: ${path}`);
  const res = await fetch(path);
  console.debug(`[DICT-DEBUG] fetchJson response: ${path} → status=${res.status}, type=${res.headers.get('content-type')}`);
  if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
  const data: T = await res.json();
  cache.set(path, data);
  console.debug(`[DICT-DEBUG] fetchJson cached OK: ${path}`);
  return data;
}

export async function loadMetadata(): Promise<IndexMetadata> {
  return fetchJson<IndexMetadata>("/data/index.json");
}

export async function loadLetterIndex(
  letter: string
): Promise<SearchIndexEntry[]> {
  return fetchJson<SearchIndexEntry[]>(
    `/data/${digoLetterFile(letter)}.idx.json`
  );
}

export async function loadLetterData(letter: string): Promise<LetterFile> {
  return fetchJson<LetterFile>(`/data/${digoLetterFile(letter)}.json`);
}

export async function loadEntry(
  letter: string,
  id: string
): Promise<DictionaryEntry | undefined> {
  const data = await loadLetterData(letter);
  return data.entries.find((e) => e.id === id);
}

function cleanHeadword(raw: string): string {
  return raw.replace(/[\d;]+$/, "");
}

export async function loadEntriesByHeadword(
  headword: string
): Promise<DictionaryEntry[]> {
  const data = await loadLetterData(headword);
  const seen = new Set<string>();
  return data.entries.filter((e) => {
    if (cleanHeadword(e.headword) !== headword) return false;
    if (seen.has(e.id)) return false;
    seen.add(e.id);
    return true;
  });
}

export async function loadReverseIndex(
  lang: "en" | "sw"
): Promise<ReverseIndex> {
  return fetchJson<ReverseIndex>(`/data/reverse-${lang}.json`);
}

export async function loadFuzzyRules(): Promise<FuzzyRules> {
  return fetchJson<FuzzyRules>("/data/fuzzy-rules.json");
}

export function clearCache(): void {
  cache.clear();
}
