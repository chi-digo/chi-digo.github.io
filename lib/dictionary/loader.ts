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

/** Entries whose headword is this word now (an address is a spelling: owner ruling 2026-11-07). */
export function entriesFor(data: LetterFile, headword: string): DictionaryEntry[] {
  return data.entries.filter((e) => isHeadwordOf(e, headword));
}

/** Entries that gave this headword up (it is now one of their other forms). */
function renamedIn(data: LetterFile, headword: string): DictionaryEntry[] {
  return data.entries.filter((e) => !isHeadwordOf(e, headword) && formerHeadwords(e).some((v) => bare(v.form) === bare(headword)));
}

const dedupe = (list: DictionaryEntry[]) => {
  const seen = new Set<string>();
  return list.filter((e) => (seen.has(e.id) ? false : (seen.add(e.id), true)));
};

/**
 * Entries in another letter file than the word's own that the forms map links to the word: a form made
 * the headword while live (the entry still sits under its old id), or a word that gave the spelling up
 * after it moved. Callers keep only what they need.
 */
async function elsewhere(headword: string, ownFile: string): Promise<LetterFile> {
  let map: VariantsMap;
  try {
    map = await loadVariants();
  } catch {
    return { letter: "", count: 0, entries: [] };
  }
  const ids = [...new Set([headword.toLowerCase(), bare(headword)].flatMap((k) => (Object.hasOwn(map, k) ? map[k] : [])))]
    .filter((id) => !id.startsWith("c:") && digoLetterFile(id.replace(/\.\d+$/, "")) !== ownFile);
  const found = await Promise.all(ids.map(async (id) => {
    try {
      return (await letterData(digoLetterFile(id.replace(/\.\d+$/, "")))).entries.filter((e) => e.id === id);
    } catch {
      return [];
    }
  }));
  const entries = found.flat();
  return { letter: "", count: entries.length, entries };
}

/** The words whose headword is this spelling now, with every meaning (homonyms). */
export async function loadEntriesByHeadword(
  headword: string
): Promise<DictionaryEntry[]> {
  const ownFile = digoLetterFile(headword);
  const [own, other] = await Promise.all([loadLetterData(headword), elsewhere(headword, ownFile)]);
  const found = dedupe([...entriesFor(own, headword), ...entriesFor(other, headword)]);
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
  return dedupe([...entriesFor(fresh, headword), ...entriesFor(other, headword)]);
}

/**
 * The words that gave this spelling up (renamed by a headword change), for "mnazi is now spelled mnadzi"
 * when no word has the spelling now (owner ruling 2026-11-07).
 */
export async function renamedFrom(headword: string): Promise<DictionaryEntry[]> {
  const ownFile = digoLetterFile(headword);
  const [own, other] = await Promise.all([loadLetterData(headword).catch(() => ({ letter: "", count: 0, entries: [] }) as LetterFile), elsewhere(headword, ownFile)]);
  return dedupe([...renamedIn(own, headword), ...renamedIn(other, headword)]);
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
      const lists = changes.filter((c) => c.type === "equivalents_fix" && c.final_payload.lang === lang && c.target_id && !c.target_id.startsWith("c:") && c.target_id !== "__test__");
      if (!adds.length && !lists.length) return idx;
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
      // A live equivalents fix (spec 34 §20.4): its old terms stop pointing at the entry, its new ones start.
      for (const c of lists) {
        const id = c.target_id;
        for (const q of ((c.base?.value as { list?: string[] } | undefined)?.list ?? [])) {
          const term = q.toLowerCase().trim();
          if (Object.hasOwn(out, term)) out[term] = out[term].filter((x) => x[1] !== id);
        }
        for (const q of (c.final_payload.items as string[] | undefined) ?? []) {
          const term = q.toLowerCase().trim();
          if (!term) continue;
          const list = Object.hasOwn(out, term) ? out[term] : [];
          if (!list.some((x) => x[1] === id)) out[term] = [...list, [id.charAt(0) || "x", id]];
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
    mergedVariants = Promise.all([fetchJson<Record<string, string | string[]>>("/data/variants.json"), wordOverlay()]).then(([map, changes]) => {
      // An older cached copy maps each form to one id.
      const out: VariantsMap = Object.create(null);
      for (const [form, ids] of Object.entries(map)) out[form] = Array.isArray(ids) ? [...ids] : [ids];
      for (const c of changes) {
        if (!c.target_id || c.target_id === "__test__") continue;
        const form = String(c.final_payload.form ?? "").toLowerCase().trim();
        if (!form) continue;
        const ids = Object.hasOwn(out, form) ? out[form].filter((id) => id !== c.target_id) : [];
        // A form made the headword (still under the entry's old id) comes first; any other form after.
        if (c.type === "headword_change") out[form] = [c.target_id, ...ids];
        else if (c.type === "spelling_variant") out[form] = [...ids, c.target_id];
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
