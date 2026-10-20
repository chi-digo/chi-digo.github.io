import type {
  IndexMetadata,
  SearchIndexEntry,
  LetterFile,
  DictionaryEntry,
  ReverseIndex,
  FuzzyRules,
} from "./types";
import * as Sentry from "@sentry/nextjs";
import { ensureFreshData, refetchFromNetwork } from "@/lib/pwa/data-version";
import { applyAllToEntries, sortKeyOf, wordAdditionEntry, type WordEntry } from "@/lib/contributions/apply/words";
import type { Change, ConflictError } from "@/lib/contributions/apply/types";
import { digoLetterFile } from "./letters";

export { digoLetterFile };

const cache = new Map<string, unknown>();

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

/* ===== Community overlay (spec 34 §15.3): accepted changes not yet in the data files ===== */

let overlay: Promise<Change[]> | null = null;
const merged = new Map<string, Promise<LetterFile>>();
const mergedIdx = new Map<string, Promise<SearchIndexEntry[]>>();

/** Accepted dictionary changes, fetched once per page load. Offline or failing: no changes. */
export function wordOverlay(): Promise<Change[]> {
  if (!overlay) {
    overlay = fetch("/api/overlay/word")
      .then((r) => (r.ok ? r.json() : { changes: [] }))
      .then((d: { changes?: Change[] }) => d.changes ?? [])
      .catch(() => {
        overlay = null;
        return [];
      });
  }
  return overlay;
}

/** Forget the overlay, e.g. right after a reviewer accepts or reverts a change. */
export function refreshWordOverlay() {
  overlay = null;
  merged.clear();
  mergedIdx.clear();
}

function reportConflict(e: ConflictError) {
  Sentry.captureMessage(e.message, { level: "warning", tags: { feature: "contributions", area: "word_overlay" } });
}

const byCodePoint = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

/** The changes that touch one letter file: edits to its entries and new words that sort into it. */
function changesFor(file: string, changes: Change[]) {
  const edits = changes.filter((c) => c.type !== "word_addition" && c.target_id && digoLetterFile(c.target_id.replace(/\.\d+$/, "")) === file);
  const adds = changes.filter((c) => c.type === "word_addition" && digoLetterFile(sortKeyOf(String(c.final_payload.headword ?? ""))) === file);
  return { edits, adds };
}

/** A letter file with the overlay applied. New words are skipped once their fold-in has shipped. */
export function mergeLetter(file: string, data: LetterFile, changes: Change[]): LetterFile {
  const { edits, adds } = changesFor(file, changes);
  if (!edits.length && !adds.length) return data;
  const entries = applyAllToEntries(data.entries as WordEntry[], edits, reportConflict);
  const folded = new Set(entries.flatMap((e) => Object.values(e.provenance ?? {}).flatMap((list) => list.map((p) => p.c))));
  const provisional = adds
    .filter((c) => !folded.has(c.contribution_id))
    .map((c) => ({ ...wordAdditionEntry(c), provisional: true }) as WordEntry);
  const all = provisional.length ? [...entries, ...provisional].sort((a, b) => byCodePoint(a.sort_key, b.sort_key)) : entries;
  return { ...data, count: all.length, entries: all };
}

function indexRow(e: DictionaryEntry): SearchIndexEntry {
  return {
    sk: e.sort_key, hw: e.headword, id: e.id, pos: e.pos,
    eq: (e.equivalents_en || []).join(", "), eq_sw: (e.equivalents_sw || []).join(", "), eq_dg: e.senses[0]?.definition_dg || "",
  };
}

async function letterData(file: string): Promise<LetterFile> {
  if (!merged.has(file)) {
    const p = Promise.all([fetchJson<LetterFile>(`/data/${file}.json`), wordOverlay()]).then(([data, changes]) => mergeLetter(file, data, changes));
    p.catch(() => merged.delete(file));
    merged.set(file, p);
  }
  return merged.get(file)!;
}

export async function loadLetterIndex(
  letter: string
): Promise<SearchIndexEntry[]> {
  const file = digoLetterFile(letter);
  if (!mergedIdx.has(file)) {
    const p = Promise.all([fetchJson<SearchIndexEntry[]>(`/data/${file}.idx.json`), wordOverlay()]).then(async ([rows, changes]) => {
      const { edits, adds } = changesFor(file, changes);
      if (!edits.length && !adds.length) return rows;
      // Rebuild the rows the overlay touches from the merged entries (a Digo change to sense 1 moves eq_dg).
      const data = await letterData(file);
      const touched = new Set([...edits.map((c) => c.target_id), ...data.entries.filter((e) => (e as WordEntry).provisional).map((e) => e.id)]);
      const byId = new Map(data.entries.map((e) => [e.id, e]));
      const kept = rows.map((r) => (touched.has(r.id) && byId.has(r.id) ? indexRow(byId.get(r.id)!) : r));
      const extra = data.entries.filter((e) => (e as WordEntry).provisional).map(indexRow);
      return extra.length ? [...kept, ...extra].sort((a, b) => byCodePoint(a.sk, b.sk)) : kept;
    });
    p.catch(() => mergedIdx.delete(file));
    mergedIdx.set(file, p);
  }
  return mergedIdx.get(file)!;
}

export async function loadLetterData(letter: string): Promise<LetterFile> {
  return letterData(digoLetterFile(letter));
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

/** Headwords match without a leading "-", so /word/-ako and /word/ako both find the affix -ako. */
const bare = (h: string) => h.replace(/^-/, "");

export function entriesFor(data: LetterFile, headword: string): DictionaryEntry[] {
  return data.entries.filter((e) => bare(cleanHeadword(e.headword)) === bare(headword));
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
  const file = digoLetterFile(headword);
  const raw = (await res.json()) as LetterFile;
  cache.set(path, raw);
  const fresh = mergeLetter(file, raw, await wordOverlay());
  merged.set(file, Promise.resolve(fresh));
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
  refreshWordOverlay();
}
