/**
 * What a contribution points at (spec 34 technical §3): checks the target exists in the published
 * data and records `base`, the text the suggestion was made against, for later conflict checks.
 * Reads the derived JSON the app ships, as the page routes already do.
 */
import { readFileSync, existsSync, statSync } from 'fs';
import { join } from 'path';
import { createHash } from 'crypto';
import type { Plant } from '@/lib/plants/types';
import type { Locale } from '@/lib/i18n/config';
import { stableStringify, normaliseDigo } from './text';
import { plantNameBase, plantInfoBase, applyAllToPlant } from './apply/plants';
import type { Change } from './apply/types';
import { applyAllToEntries, definitionBase, sortKeyOf, type WordEntry } from './apply/words';
import { applyAllToProverbs, contextField, meaningField, proverbFieldBase, type ProverbEntry } from './apply/proverbs';
import { digoLetterFile } from '@/lib/dictionary/letters';
import { TEST_TARGET, WORD_ID, type ContributionType, type TargetType } from './schemas';
export { WORD_ID };

const PLANTS = join(process.cwd(), 'public/data/plants/p');
const DICT = join(process.cwd(), 'public/data');

export interface Target {
  label: string;
  /** The field the change touches, built on the server (never taken from the client). */
  path: string | null;
  base?: { value: unknown; hash: string };
}

function withHash(value: unknown) {
  return { value, hash: createHash('sha256').update(stableStringify(value ?? null)).digest('hex') };
}

export function loadPlant(slug: string): Plant | null {
  if (!/^[\w-]+$/.test(slug)) return null;
  const file = join(PLANTS, `${slug}.json`);
  if (!existsSync(file)) return null;
  return JSON.parse(readFileSync(file, 'utf-8')) as Plant;
}

/** A stand-in plant for automated tests (never listed; test rows are invisible elsewhere). */
export function testPlant(): Plant {
  return {
    id: 'test', slug: TEST_TARGET, digo_headword: 'jina ra majaribio', digo_alt: [], english: 'Test plant', swahili: null,
    scientific: 'Testus plantus', family: null, section: 'test', themes: [], teaser: { en: 'Test', sw: null, dg: null },
    name_status: 'missing', has_parts: false, has_prose: { en: true, sw: false, dg: false }, digo: null, digo_source: null,
    other_mijikenda: null, summary: { en: 'Test', sw: null, dg: null }, sections: { uses: { en: 'Test uses.', sw: null, dg: null } },
    related: [], parts: [], taxon: null, mgombato: [], sources: [], digo_proposals: [], name_credit: null,
  };
}


/**
 * The letter file a sort key belongs in, as a key of index.json's letters (file name with ' as _).
 * Throws for anything else, so no file name ever comes from raw text.
 */
export function entryFile(sortKey: string): string {
  const meta = JSON.parse(readFileSync(join(DICT, 'index.json'), 'utf-8')) as { letters: Record<string, unknown> };
  const file = digoLetterFile(sortKey);
  const key = Object.keys(meta.letters).find((k) => k.replace(/'/g, '_') === file);
  if (!key || !/^[a-z_]+$/.test(file)) throw new Error(`no letter file for ${JSON.stringify(sortKey)}`);
  return file;
}

/** A shipped dictionary entry by id, or null. */
export function loadWord(id: string): WordEntry | null {
  if (!WORD_ID.test(id)) return null;
  let file: string;
  try {
    file = entryFile(id.replace(/\.\d+$/, ''));
  } catch {
    return null;
  }
  const data = JSON.parse(readFileSync(join(DICT, `${file}.json`), 'utf-8')) as { entries: WordEntry[] };
  return data.entries.find((e) => e.id === id) ?? null;
}

/** Whether a headword (any case, leading - ignored) is already in the shipped dictionary. */
export function headwordExists(headword: string): boolean {
  const sk = sortKeyOf(headword);
  try {
    const data = JSON.parse(readFileSync(join(DICT, `${entryFile(sk)}.json`), 'utf-8')) as { entries: WordEntry[] };
    return data.entries.some((e) => e.sort_key === sk);
  } catch {
    return false;
  }
}

/**
 * A shipped headword (or variant form) that reads the same as `headword` once case, apostrophes and
 * ng'/ng, dz/z are ignored, or null. Returns the headword to link to.
 */
export function similarHeadwords(headword: string): string | null {
  const key = normaliseDigo(headword);
  let file: string;
  try {
    file = entryFile(sortKeyOf(headword));
  } catch {
    return null;
  }
  // dz/z and ng'/ng differences can move a word to another letter file: check both spellings' files.
  const files = new Set([file]);
  for (const alt of [headword.replace(/^dz/i, 'z'), headword.replace(/^z/i, 'dz'), headword.replace(/^ng'/i, 'ng'), headword.replace(/^ng(?!')/i, "ng'")]) {
    try {
      files.add(entryFile(sortKeyOf(alt)));
    } catch {
      /* not a letter file */
    }
  }
  for (const f of files) {
    const data = JSON.parse(readFileSync(join(DICT, `${f}.json`), 'utf-8')) as { entries: WordEntry[] };
    for (const e of data.entries) {
      if (e.is_redirect) continue;
      if (normaliseDigo(e.headword.replace(/^-/, '')) === key.replace(/^-/, '')) return e.headword;
      if ((e.variants ?? []).some((v) => normaliseDigo(v.form) === key)) return e.headword;
    }
  }
  return null;
}

/** A stand-in entry for automated tests (never listed; test rows are invisible elsewhere). */
export function testWord(): WordEntry {
  return {
    id: TEST_TARGET, headword: TEST_TARGET, homonym_index: null, sort_key: TEST_TARGET, pos: 'dzina', pos_en: 'noun', noun_class: null,
    plural_prefix: null, plural_form: null, ipa: '', audio: [], equivalents_en: ['test'], equivalents_sw: ['jaribio'], variants: [],
    senses: [{ sense_id: 1, definition_en: 'test', definition_sw: 'jaribio', definition_dg: 'majaribio', definition_dg_status: 'draft', examples: [],
      synonyms_dg: [], antonyms_dg: [], cross_refs: [], cultural_note: null, register: 'neutral', dialect_tags: [] }],
    etymology: { source: null, root: null, notes: '' } as WordEntry['etymology'], bible_refs: [], proverb_refs: [], sub_entries: [],
    editorial_state: 'draft', is_redirect: false, redirect_target: null,
  };
}

function resolveWordTarget(
  type: ContributionType,
  targetId: string | undefined,
  payload: Record<string, unknown>,
  opts: { isTest: boolean; liveChanges?: Change[] },
): Target | null {
  if (type === 'word_addition') return { label: String(payload.headword ?? ''), path: null };
  if (!targetId) return null;
  // A flag may point at a provisional new word (c:<uuid>) that only exists in the overlay.
  if (type === 'entry_flag' && /^c:[0-9a-f-]{36}$/.test(targetId)) {
    const add = (opts.liveChanges ?? []).find((c) => c.type === 'word_addition' && `c:${c.contribution_id}` === targetId);
    return add ? { label: String(add.final_payload.headword ?? ''), path: null } : null;
  }
  const raw = targetId === TEST_TARGET ? (opts.isTest ? testWord() : null) : loadWord(targetId);
  if (!raw) return null;
  const [entry] = applyAllToEntries([raw], opts.liveChanges ?? []);
  const label = [entry.headword, entry.equivalents_en[0] ?? entry.senses[0]?.definition_en].filter(Boolean).join(' · ');
  const n = Number(payload.sense_id);
  if (type === 'definition_update') {
    const lang = payload.lang as Locale;
    if (payload.mode === 'add_sense') return { label, path: null }; // the sense id is allocated at accept
    const base = definitionBase(entry, n, lang);
    if (!base) return null;
    return { label, path: `senses.${n}.definition_${lang}`, base: withHash(base) };
  }
  if (type === 'example_sentence') {
    if (!entry.senses.some((s) => s.sense_id === n)) return null;
    return { label, path: `senses.${n}.examples` };
  }
  if (type === 'spelling_variant') return { label, path: 'variants' };
  if (type === 'entry_flag') return { label, path: null };
  return null;
}

/** Proverb ids (spec 34 §16). */
export const PROVERB_ID = /^p-\d{3,4}$/;

let proverbsCache: { mtime: number; list: ProverbEntry[] } | null = null;
/** The shipped proverbs, read once per file change. */
export function loadProverbList(): ProverbEntry[] {
  const file = join(DICT, 'proverbs/index.json');
  const mtime = statSync(file).mtimeMs;
  if (!proverbsCache || proverbsCache.mtime !== mtime) proverbsCache = { mtime, list: JSON.parse(readFileSync(file, 'utf-8')) };
  return proverbsCache.list;
}
export function loadProverb(id: string): ProverbEntry | null {
  if (!PROVERB_ID.test(id)) return null;
  return loadProverbList().find((p) => p.id === id) ?? null;
}

/**
 * A shipped or live new proverb that reads the same as `digo` (case, apostrophes, punctuation, ng'/ng and
 * dz/z ignored), compared with its Digo text, forms, Swahili version and literal Swahili.
 */
export function similarProverb(digo: string, liveChanges: Change[] = []): { digo: string; slug: string } | null {
  const key = normaliseDigo(digo);
  if (!key) return null;
  for (const p of loadProverbList()) {
    const forms = [p.digo, p.swahili, p.literal_sw, ...(p.variants ?? []).map((v) => v.form)].filter(Boolean);
    if (forms.some((f) => normaliseDigo(f) === key)) return { digo: p.digo, slug: p.slug };
  }
  const live = liveChanges.find((c) => c.type === 'proverb_addition' && normaliseDigo(String(c.final_payload.digo ?? '')) === key);
  if (live) return { digo: String(live.final_payload.digo), slug: `p-c-${live.contribution_id.replace(/-/g, '').slice(0, 8)}` };
  return null;
}

/** A stand-in proverb for automated tests (never listed; test rows are invisible elsewhere). */
export function testProverb(): ProverbEntry {
  return {
    id: TEST_TARGET, slug: 'p-test', source_number: 0, digo: 'Methali ya majaribio', ipa: '', audio: [], literal_en: 'A test proverb',
    idiomatic_en: 'Tests are useful', swahili: '', swahili_relationship: 'translation', commentary_en: 'Used in tests.', commentary_dg: '',
    commentary_source: 'native', themes: [], functions: [], keywords_en: [], keywords_sw: [], related_proverbs: [], lexical_links: [],
    english_equivalent: '', swahili_equivalent: '', variants: [], content_flag: null, region: 'KE-coast', source_attribution: 'test',
    editorial_status: 'draft', idiomatic_sw: '', commentary_sw: '', field_sources: { idiomatic_en: 'ai-draft' }, literal_sw: '', idiomatic_dg: '',
  } as unknown as ProverbEntry;
}

function resolveProverbTarget(
  type: ContributionType,
  targetId: string | undefined,
  payload: Record<string, unknown>,
  opts: { isTest: boolean; liveChanges?: Change[] },
): Target | null {
  if (type === 'proverb_addition') return { label: String(payload.digo ?? ''), path: null };
  if (!targetId) return null;
  const raw = targetId === TEST_TARGET ? (opts.isTest ? testProverb() : null) : loadProverb(targetId);
  if (!raw) return null;
  const [p] = applyAllToProverbs([raw], opts.liveChanges ?? []);
  const label = [p.digo, p.idiomatic_en || p.literal_en].filter(Boolean).join(' · ');
  if (type === 'proverb_meaning') {
    const f = meaningField(payload.kind as 'idiomatic' | 'literal', payload.lang as 'en' | 'sw' | 'dg');
    return { label, path: f, base: withHash(proverbFieldBase(p, f)) };
  }
  if (type === 'proverb_context') {
    const f = contextField(payload.lang as 'en' | 'sw' | 'dg');
    return { label, path: f, base: withHash(proverbFieldBase(p, f)) };
  }
  if (type === 'proverb_variant') return { label, path: 'variants' };
  return null;
}

/**
 * The target as readers currently see it (published data plus live accepted changes), with the
 * base for update types. Returns null if the target doesn't exist.
 */
export function resolveTarget(
  type: ContributionType,
  targetType: TargetType | undefined,
  targetId: string | undefined,
  payload: Record<string, unknown>,
  opts: { isTest: boolean; liveChanges?: Change[] },
): Target | null {
  if (type === 'general_feedback') return { label: targetId ?? '', path: null };
  if (targetType === 'word') return resolveWordTarget(type, targetId, payload, opts);
  if (targetType === 'proverb') return resolveProverbTarget(type, targetId, payload, opts);
  if (targetType !== 'plant' || !targetId) return null;

  const raw = targetId === TEST_TARGET ? (opts.isTest ? testPlant() : null) : loadPlant(targetId);
  if (!raw) return null;
  const plant = applyAllToPlant(raw, opts.liveChanges ?? []);
  const label = [plant.digo_headword, plant.english].filter(Boolean).join(' · ');

  if (type === 'plant_name') return { label, path: 'digo_headword', base: withHash(plantNameBase(plant)) };
  if (type === 'plant_info') {
    const section = payload.section as Parameters<typeof plantInfoBase>[1];
    const lang = payload.lang as Locale;
    return { label, path: `sections.${section}.${lang}`, base: withHash(plantInfoBase(plant, section, lang)) };
  }
  return null;
}
