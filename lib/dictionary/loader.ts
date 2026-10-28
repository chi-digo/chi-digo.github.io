import type {
  IndexMetadata,
  SearchIndexEntry,
  LetterFile,
  DictionaryEntry,
  ReverseIndex,
  VariantsMap,
  FuzzyRules,
} from "./types";
import * as Sentry from "@sentry/nextjs";
import { ensureFreshData, refetchFromNetwork } from "@/lib/pwa/data-version";
import { applyAllToEntries, formerHeadwords, sortKeyOf, wordAdditionEntry, type WordEntry } from "@/lib/contributions/apply/words";
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
  mergedReverse.clear();
  mergedVariants = null;
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
const bare = (h: string) => h.replace(/^-/, "").toLowerCase();

/** The entry's headword is this word (not just a former one). */
export function isHeadwordOf(e: DictionaryEntry, headword: string): boolean {
  return bare(cleanHeadword(e.headword)) === bare(headword);
}

/** Entries with this headword, then entries that used to have it (spec 34 §18.3: the old address still works). */
export function entriesFor(data: LetterFile, headword: string): DictionaryEntry[] {
  const current = data.entries.filter((e) => isHeadwordOf(e, headword));
  const former = data.entries.filter((e) => !isHeadwordOf(e, headword) && formerHeadwords(e).some((v) => bare(v.form) === bare(headword)));
  return [...current, ...former];
}

/** Current-headword entries first, then former ones; no entry twice. */
function mergeFound(headword: string, lists: DictionaryEntry[][]): DictionaryEntry[] {
  const seen = new Set<string>();
  const all = lists.flat().filter((e) => (seen.has(e.id) ? false : (seen.add(e.id), true)));
  return [...all.filter((e) => isHeadwordOf(e, headword)), ...all.filter((e) => !isHeadwordOf(e, headword))];
}

/**
 * Entries for a word that live in another letter file than the word's own: a headword made from a form
 * (live, the entry is still under its old id) or a former headword after the entry moved (spec 34 §18.3).
 * Only those resolve; an ordinary other form doesn't get a page.
 */
async function movedEntriesFor(headword: string, ownFile: string): Promise<DictionaryEntry[]> {
  let map: VariantsMap;
  try {
    map = await loadVariants();
  } catch {
    return [];
  }
  const key = [headword.toLowerCase(), bare(headword)].find((k) => Object.hasOwn(map, k));
  const id = key ? map[key] : null;
  if (!id || id.startsWith("c:")) return [];
  const file = digoLetterFile(id.replace(/\.\d+$/, ""));
  if (file === ownFile) return [];
  try {
    const entry = (await letterData(file)).entries.find((e) => e.id === id);
    return entry && entriesFor({ count: 1, entries: [entry] } as LetterFile, headword).length ? [entry] : [];
  } catch {
    return [];
  }
}

export async function loadEntriesByHeadword(
  headword: string
): Promise<DictionaryEntry[]> {
  const ownFile = digoLetterFile(headword);
  const [own, moved] = await Promise.all([loadLetterData(headword), movedEntriesFor(headword, ownFile)]);
  const found = mergeFound(headword, [entriesFor(own, headword), moved]);
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
  return mergeFound(headword, [entriesFor(fresh, headword), moved]);
}

const mergedReverse = new Map<string, Promise<ReverseIndex>>();
let mergedVariants: Promise<VariantsMap> | null = null;

/**
 * English or Swahili search terms, with community new words that aren't folded in yet (their meanings,
 * split as in their entry). A folded word is already in the file under its real id, so its live copy
 * is skipped when the term already points at that headword.
 */
export async function loadReverseIndex(
  lang: "en" | "sw"
): Promise<ReverseIndex> {
  if (!mergedReverse.has(lang)) {
    const p = Promise.all([fetchJson<ReverseIndex>(`/data/reverse-${lang}.json`), wordOverlay()]).then(([idx, changes]) => {
      const adds = changes.filter((c) => c.type === "word_addition");
      if (!adds.length) return idx;
      // No prototype: a term like "constructor" must be an ordinary key.
      const out: ReverseIndex = Object.assign(Object.create(null), idx);
      for (const c of adds) {
        const e = wordAdditionEntry(c);
        const hw = e.headword;
        for (const q of lang === "en" ? e.equivalents_en : e.equivalents_sw) {
          const term = q.toLowerCase().trim();
          if (!term) continue;
          const list = Object.hasOwn(out, term) ? out[term] : [];
          if (list.some((x) => x[1].replace(/\.\d+$/, "") === e.sort_key)) continue;
          out[term] = [...list, [e.sort_key.charAt(0) || "x", e.id, hw]];
        }
      }
      return out;
    });
    p.catch(() => mergedReverse.delete(lang));
    mergedReverse.set(lang, p);
  }
  return mergedReverse.get(lang)!;
}

/** Spelling and regional forms (form -> entry id), with live community forms. */
export async function loadVariants(): Promise<VariantsMap> {
  if (!mergedVariants) {
    mergedVariants = Promise.all([fetchJson<VariantsMap>("/data/variants.json"), wordOverlay()]).then(([map, changes]) => {
      const out: VariantsMap = Object.assign(Object.create(null), map);
      for (const c of changes) {
        if (!c.target_id || c.target_id === "__test__") continue;
        const form = String(c.final_payload.form ?? "").toLowerCase().trim();
        if (!form) continue;
        // A form made the headword (still under the entry's old id) wins over any other form.
        if (c.type === "headword_change") out[form] = c.target_id;
        else if (c.type === "spelling_variant" && !Object.hasOwn(out, form)) out[form] = c.target_id;
      }
      return out;
    });
    mergedVariants.catch(() => {
      mergedVariants = null;
    });
  }
  return mergedVariants;
}

export async function loadFuzzyRules(): Promise<FuzzyRules> {
  return fetchJson<FuzzyRules>("/data/fuzzy-rules.json");
}

export function clearCache(): void {
  cache.clear();
  refreshWordOverlay();
}
