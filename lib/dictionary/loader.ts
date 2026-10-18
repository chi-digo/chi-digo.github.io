import type {
  IndexMetadata,
  SearchIndexEntry,
  LetterFile,
  DictionaryEntry,
  ReverseIndex,
  FuzzyRules,
} from "./types";
import { ensureFreshData, refetchFromNetwork } from "@/lib/pwa/data-version";

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
  if (cached) return cached as T;

  await ensureFreshData();
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
  const data: T = await res.json();
  cache.set(path, data);
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

function entriesFor(data: LetterFile, headword: string): DictionaryEntry[] {
  const seen = new Set<string>();
  return data.entries.filter((e) => {
    if (cleanHeadword(e.headword) !== headword) return false;
    if (seen.has(e.id)) return false;
    seen.add(e.id);
    return true;
  });
}

export async function loadEntriesByHeadword(
  headword: string
): Promise<DictionaryEntry[]> {
  const found = entriesFor(await loadLetterData(headword), headword);
  if (found.length) return found;
  // Not in this copy of the letter file: it may be an old cached copy (ISSUES DATA-1). Fetch it once
  // from the network before saying the word doesn't exist.
  const path = `/data/${digoLetterFile(headword)}.json`;
  const res = await refetchFromNetwork(path, "dict");
  if (!res) return found;
  const fresh: LetterFile = await res.json();
  cache.set(path, fresh);
  return entriesFor(fresh, headword);
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
