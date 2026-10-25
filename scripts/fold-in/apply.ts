/**
 * Write claimed changes into a data checkout (spec 34 technical §6.1). No secrets: it reads the
 * claimed rows from a file and writes a results file that rpc.mjs reports back.
 *
 *   npx tsx scripts/fold-in/apply.ts --data <checkout> --in claimed.json --out results.json [--dry-run]
 *
 * Each change is applied on its own, in review order, and checked; a conflict or failure sets that one
 * aside and the rest continue. Applying twice changes nothing (provenance carries the contribution id).
 * Reverts ("reverting") are undone the same way.
 */
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { applySourcePlant, unapplySourcePlant } from '../../lib/contributions/apply/plants-source';
import { applyTranslation, unapplyTranslation } from '../../lib/contributions/apply/translations';
import { applyArticle, unapplyArticle, type ArticleData } from '../../lib/contributions/apply/articles';
import type { GlossaryTerm } from '../../lib/plants/types';
import { ConflictError, type Change } from '../../lib/contributions/apply/types';
import { derivePlant, type SourcePlant } from '../../lib/plants/derive';
import { ruledOutIn } from '../../lib/digo/ruled-out';
import { applyWord, unapplyWord, wordAdditionEntry, foldedId, sortKeyOf, type WordEntry } from '../../lib/contributions/apply/words';
import { digoLetterFile } from '../../lib/dictionary/letters';
import { applyProverb, unapplyProverb, proverbAdditionEntry, type ProverbEntry } from '../../lib/contributions/apply/proverbs';

interface ClaimedRow {
  id: string;
  type: Change['type'];
  target_type: string | null;
  target_id: string | null;
  target_path: string | null;
  final_payload: Record<string, unknown>;
  outcome: Change['outcome'];
  region: Change['region'];
  confidence: Change['confidence'];
  base: { value: unknown } | null;
  live_status: string;
  edited: boolean;
}

const args = process.argv.slice(2);
const opt = (n: string) => args[args.indexOf(n) + 1];
const dataDir = opt('--data');
const claimed = JSON.parse(readFileSync(opt('--in'), 'utf-8')) as { nonce: string; rows: ClaimedRow[] };
const dryRun = args.includes('--dry-run');

const plantsPath = join(dataDir, 'content/plants/plants.json');
const glossaryPath = join(dataDir, 'content/plants/glossary.json');
let glossary: (GlossaryTerm & { term: string })[] | null = null;
let glossaryDirty = false;

/** Article files changed by this run (spec 34 §17.11), written once at the end in the standard format. */
const articles = new Map<string, ArticleData>();
const ARTICLE_ID = /^(culture\/[a-z0-9-]+\/[a-z0-9-]+|(history|language|figures)\/[a-z0-9-]+|timeline)$/;

/** A translation fix on an article: the file comes from the id (strict pattern, must exist), never from text. */
function foldArticle(row: ClaimedRow, change: Change): 'applied' | 'reverted' {
  const id = row.target_id ?? '';
  if (!ARTICLE_ID.test(id)) throw new Error(`bad article id ${JSON.stringify(id)}`);
  const file = join(dataDir, 'content/articles', `${id}.json`);
  if (!articles.has(file)) {
    if (!existsSync(file)) throw new Error(`article ${id} not found`);
    articles.set(file, JSON.parse(readFileSync(file, 'utf-8')) as ArticleData);
  }
  const reverting = row.live_status === 'reverting';
  if (!reverting && row.final_payload.lang === 'dg') {
    const ruled = ruledOutIn(String(row.final_payload.proposed));
    if (ruled.length) throw new Error(`ruled-out Digo: ${ruled.map((r) => r.found).join(', ')}`);
  }
  const a = articles.get(file)!;
  articles.set(file, reverting ? unapplyArticle(a, change) : applyArticle(a, change));
  return reverting ? 'reverted' : 'applied';
}

/** A translation fix on a glossary term's definition (spec 34 §17), on the source glossary. */
function foldGlossary(row: ClaimedRow, change: Change): 'applied' | 'reverted' {
  glossary ??= JSON.parse(readFileSync(glossaryPath, 'utf-8')) as (GlossaryTerm & { term: string })[];
  const reverting = row.live_status === 'reverting';
  const i = glossary.findIndex((t) => t.term === row.target_id);
  if (i < 0) throw new Error(`glossary term ${row.target_id} not found`);
  if (!reverting && row.final_payload.lang === 'dg') {
    const ruled = ruledOutIn(String(row.final_payload.proposed));
    if (ruled.length) throw new Error(`ruled-out Digo: ${ruled.map((r) => r.found).join(', ')}`);
  }
  glossary[i] = reverting ? unapplyTranslation(glossary[i], 'glossary', change) : applyTranslation(glossary[i], 'glossary', change);
  glossaryDirty = true;
  return reverting ? 'reverted' : 'applied';
}
let plants = JSON.parse(readFileSync(plantsPath, 'utf-8')) as SourcePlant[];

const results = {
  nonce: claimed.nonce, applied: [] as string[], reverted: [] as string[], conflict: [] as { id: string; error: string }[],
  failed: [] as { id: string; error: string }[], skipped: [] as string[],
  /** The real id each folded new word got, written back by fold_mark('in_preview'). */
  target_ids: {} as Record<string, string>,
};

/* ----- Dictionary letter files (spec 34 §15.3): loaded on demand, written compactly ----- */

const dictDir = join(dataDir, 'public/data');
const letters = existsSync(join(dictDir, 'index.json'))
  ? Object.keys((JSON.parse(readFileSync(join(dictDir, 'index.json'), 'utf-8')) as { letters: Record<string, unknown> }).letters).map((l) => l.replace(/'/g, '_'))
  : [];
const letterFiles = new Map<string, { count: number; entries: WordEntry[] }>();
const dirty = new Set<string>();
/** The file a sort key belongs in; never a name from raw text. */
function entryFile(sortKey: string): string {
  const f = digoLetterFile(sortKey);
  if (!letters.includes(f)) throw new Error(`no letter file for ${JSON.stringify(sortKey)}`);
  return f;
}
function letterFile(f: string) {
  if (!letterFiles.has(f)) letterFiles.set(f, JSON.parse(readFileSync(join(dictDir, `${f}.json`), 'utf-8')));
  return letterFiles.get(f)!;
}
const byCodePoint = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);
const hasC = (e: WordEntry, c: string) => Object.values(e.provenance ?? {}).some((l) => l.some((x) => x.c === c));
/** The Digo text a word change adds, for the standards check. */
function wordDigo(type: string, p: Record<string, unknown>): string[] {
  const s = (k: string) => (typeof p[k] === 'string' ? [p[k] as string] : []);
  if (type === 'word_addition') return [...s('headword'), ...s('definition_dg'), ...s('example_dg')];
  if (type === 'definition_update') return p.lang === 'dg' ? s('text') : [];
  if (type === 'example_sentence') return s('dg');
  if (type === 'spelling_variant') return s('form');
  return [];
}

/* ----- Proverbs (spec 34 §16): one file, written as JSON.stringify(_, null, 2) + newline ----- */

const proverbsPath = join(dataDir, 'public/data/proverbs/index.json');
let proverbs: ProverbEntry[] | null = null;
let proverbsDirty = false;
const proverbList = () => (proverbs ??= JSON.parse(readFileSync(proverbsPath, 'utf-8')) as ProverbEntry[]);
function proverbDigo(type: string, p: Record<string, unknown>): string[] {
  const s = (k: string) => (typeof p[k] === 'string' ? [p[k] as string] : []);
  if (type === 'proverb_addition') return [...s('digo'), ...s('meaning_dg'), ...(p.usage_lang === 'dg' ? s('usage') : [])];
  if (type === 'proverb_variant') return s('form');
  if (type === 'proverb_meaning' || type === 'proverb_context') return p.lang === 'dg' ? s('text') : [];
  if (type === 'translation_fix') return p.lang === 'dg' ? s('proposed') : [];
  return [];
}

function foldProverb(row: ClaimedRow, change: Change): 'applied' | 'reverted' {
  const reverting = row.live_status === 'reverting';
  if (!reverting) {
    const ruled = proverbDigo(row.type, row.final_payload).flatMap(ruledOutIn);
    if (ruled.length) throw new Error(`ruled-out Digo: ${ruled.map((r) => r.found).join(', ')}`);
  }
  const list = proverbList();
  if (row.type === 'proverb_addition') {
    const at = list.findIndex((p) => hasC(p as unknown as WordEntry, row.id));
    if (reverting) {
      if (at < 0) return 'reverted';
      const others = Object.values(list[at].provenance ?? {}).some((l) => l.some((x) => x.c !== row.id));
      if (others) throw new Error(`new proverb ${list[at].id} has other changes that depend on it; revert those first`);
      list.splice(at, 1);
      proverbsDirty = true;
      return 'reverted';
    }
    if (at >= 0) return 'applied';
    // The id the database reserved at accept; never chosen here.
    const id = row.target_id ?? '';
    if (!/^p-\d{3,4}$/.test(id)) throw new Error(`new proverb has no reserved id (${JSON.stringify(id)})`);
    if (list.some((p) => p.id === id)) throw new Error(`reserved id ${id} is already used`);
    const entry = proverbAdditionEntry(change, id);
    if (list.some((p) => p.slug === entry.slug)) throw new Error(`slug ${entry.slug} is already used`);
    // Ids are reserved in accept order but may fold in any order: keep the list sorted by number.
    const n = Number(entry.source_number);
    const after = list.findIndex((p) => Number(p.source_number) > n);
    if (after < 0) list.push(entry);
    else list.splice(after, 0, entry);
    proverbsDirty = true;
    return 'applied';
  }
  const at = list.findIndex((p) => p.id === row.target_id);
  if (at < 0) throw new Error(`proverb ${row.target_id} not found`);
  list[at] = reverting ? unapplyProverb(list[at], change) : applyProverb(list[at], change);
  proverbsDirty = true;
  return reverting ? 'reverted' : 'applied';
}

function foldWord(row: ClaimedRow, change: Change): 'applied' | 'reverted' {
  const reverting = row.live_status === 'reverting';
  if (!reverting) {
    const ruled = wordDigo(row.type, row.final_payload).flatMap(ruledOutIn);
    if (ruled.length) throw new Error(`ruled-out Digo: ${ruled.map((r) => r.found).join(', ')}`);
  }
  if (row.type === 'word_addition') {
    const sk = sortKeyOf(String(row.final_payload.headword ?? ''));
    const f = entryFile(sk);
    const file = letterFile(f);
    const at = file.entries.findIndex((e) => hasC(e, row.id));
    if (reverting) {
      if (at < 0) return 'reverted';
      const e = file.entries[at];
      const others = Object.values(e.provenance ?? {}).some((l) => l.some((x) => x.c !== row.id));
      if (others) throw new Error(`new word ${e.id} has other changes that depend on it; revert those first`);
      file.entries.splice(at, 1);
    } else {
      if (at >= 0) {
        results.target_ids[row.id] = file.entries[at].id;
        return 'applied';
      }
      const id = foldedId(sk, file.entries.map((e) => e.id));
      const entry = wordAdditionEntry(change, id);
      delete entry.provisional;
      // After every entry with the same or an earlier sort key, so an existing homonym is never renumbered.
      let i = file.entries.length;
      while (i > 0 && byCodePoint(file.entries[i - 1].sort_key, sk) > 0) i--;
      file.entries.splice(i, 0, entry);
      results.target_ids[row.id] = id;
    }
    file.count = file.entries.length;
    dirty.add(f);
    return reverting ? 'reverted' : 'applied';
  }
  const id = row.target_id ?? '';
  const f = entryFile(id.replace(/\.\d+$/, ''));
  const file = letterFile(f);
  const at = file.entries.findIndex((e) => e.id === id);
  if (at < 0) throw new Error(`entry ${id} not found`);
  file.entries[at] = reverting ? unapplyWord(file.entries[at], change) : applyWord(file.entries[at], change);
  dirty.add(f);
  return reverting ? 'reverted' : 'applied';
}

for (const row of claimed.rows) {
  const change: Change = {
    contribution_id: row.id, type: row.type, target_id: row.target_id ?? '', target_path: row.target_path,
    final_payload: row.final_payload, outcome: row.outcome, region: row.region, confidence: row.confidence,
    edited: row.edited, base: row.base,
  };
  if (row.target_type === 'proverb' && ['proverb_addition', 'proverb_variant', 'proverb_meaning', 'proverb_context', 'translation_fix'].includes(row.type)) {
    try {
      results[foldProverb(row, change)].push(row.id);
    } catch (err) {
      if (err instanceof ConflictError && row.live_status !== 'reverting') results.conflict.push({ id: row.id, error: err.message });
      else results.failed.push({ id: row.id, error: String((err as Error).message ?? err).slice(0, 500) });
    }
    continue;
  }
  if (row.target_type === 'word' && ['word_addition', 'definition_update', 'example_sentence', 'spelling_variant'].includes(row.type)) {
    try {
      results[foldWord(row, change)].push(row.id);
    } catch (err) {
      if (err instanceof ConflictError && row.live_status !== 'reverting') results.conflict.push({ id: row.id, error: err.message });
      else results.failed.push({ id: row.id, error: String((err as Error).message ?? err).slice(0, 500) });
    }
    continue;
  }
  if (row.target_type === 'article' && row.type === 'translation_fix') {
    try {
      results[foldArticle(row, change)].push(row.id);
    } catch (err) {
      if (err instanceof ConflictError && row.live_status !== 'reverting') results.conflict.push({ id: row.id, error: err.message });
      else results.failed.push({ id: row.id, error: String((err as Error).message ?? err).slice(0, 500) });
    }
    continue;
  }
  if (row.target_type === 'glossary' && row.type === 'translation_fix') {
    try {
      results[foldGlossary(row, change)].push(row.id);
    } catch (err) {
      if (err instanceof ConflictError && row.live_status !== 'reverting') results.conflict.push({ id: row.id, error: err.message });
      else results.failed.push({ id: row.id, error: String((err as Error).message ?? err).slice(0, 500) });
    }
    continue;
  }
  if (row.target_type !== 'plant' || !['plant_name', 'plant_info', 'translation_fix'].includes(row.type)) {
    // Areas without an applier yet (dictionary, proverbs, translations) wait for their phase.
    results.skipped.push(row.id);
    continue;
  }
  const i = plants.findIndex((p) => p.slug === row.target_id);
  if (i < 0) {
    results.failed.push({ id: row.id, error: `plant ${row.target_id} not found` });
    continue;
  }
  try {
    const reverting = row.live_status === 'reverting';
    const next = reverting ? unapplySourcePlant(plants[i], change) : applySourcePlant(plants[i], change);
    // Check the result before keeping it: it must derive, and Digo text must pass the standards.
    derivePlant(next);
    const text = row.type === 'translation_fix' ? row.final_payload.proposed : row.final_payload.text;
    const digo = row.type === 'plant_name' ? [String(row.final_payload.name)] : row.final_payload.lang === 'dg' ? [String(text)] : [];
    const ruled = reverting ? [] : digo.flatMap(ruledOutIn);
    if (ruled.length) throw new Error(`ruled-out Digo: ${ruled.map((r) => r.found).join(', ')}`);
    plants = plants.map((p, j) => (j === i ? next : p));
    (reverting ? results.reverted : results.applied).push(row.id);
  } catch (err) {
    // A conflict sends a live change back to its reviewer. A revert has no reviewer step to go back to
    // (it's already off the overlay), so it fails and admins are told.
    if (err instanceof ConflictError && row.live_status !== 'reverting') results.conflict.push({ id: row.id, error: err.message });
    else results.failed.push({ id: row.id, error: String((err as Error).message ?? err).slice(0, 500) });
  }
}

const plantsChanged = claimed.rows.some((r) => r.target_type === 'plant' && [...results.applied, ...results.reverted].includes(r.id));
if (!dryRun && plantsChanged) {
  writeFileSync(plantsPath, JSON.stringify(plants, null, 1));
}
// The glossary source keeps the plants file's format (one-space indent, no trailing newline).
if (!dryRun && glossaryDirty && glossary) writeFileSync(glossaryPath, JSON.stringify(glossary, null, 1));
// Articles: 2-space JSON with a trailing newline (check:articles enforces it).
if (!dryRun) for (const [file, data] of articles) writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
if (!dryRun) {
  // Letter files are compact JSON with no trailing newline (build-index.ts then rebuilds the indexes).
  for (const f of dirty) writeFileSync(join(dictDir, `${f}.json`), JSON.stringify(letterFile(f)));
  if (proverbsDirty && proverbs) {
    writeFileSync(proverbsPath, JSON.stringify(proverbs, null, 2) + '\n');
    // Proverbs changed: make installed apps drop their cached copy.
    const vp = join(dataDir, 'public/data/data-version.json');
    const v = JSON.parse(readFileSync(vp, 'utf-8'));
    const n = new Date();
    const pad = (x: number) => String(x).padStart(2, '0');
    const stamp = `${n.getUTCFullYear()}.${pad(n.getUTCMonth() + 1)}.${pad(n.getUTCDate())}.${pad(n.getUTCHours())}${pad(n.getUTCMinutes())}`;
    v.proverbs = stamp;
    v.version = stamp;
    writeFileSync(vp, JSON.stringify(v, null, 2) + '\n');
  }
}
writeFileSync(opt('--out'), JSON.stringify(results, null, 2));
console.log(`applied ${results.applied.length}, reverted ${results.reverted.length}, conflicts ${results.conflict.length}, failed ${results.failed.length}, skipped ${results.skipped.length}${dryRun ? ' (dry run)' : ''}`);
