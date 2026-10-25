/**
 * What a contribution points at (spec 34 technical §3): checks the target exists in the published
 * data and records `base`, the text the suggestion was made against, for later conflict checks.
 * Reads the derived JSON the app ships, as the page routes already do.
 */
import { readFileSync, existsSync, statSync } from 'fs';
import { join } from 'path';
import { createHash } from 'crypto';
import type { GlossaryTerm, Plant } from '@/lib/plants/types';
import type { Locale } from '@/lib/i18n/config';
import { stableStringify, normaliseDigo } from './text';
import { plantNameBase, plantInfoBase, applyAllToPlant } from './apply/plants';
import type { Change } from './apply/types';
import { applyAllToEntries, definitionBase, sortKeyOf, type WordEntry } from './apply/words';
import { applyAllToProverbs, contextField, meaningField, proverbFieldBase, type ProverbEntry } from './apply/proverbs';
import { digoLetterFile } from '@/lib/dictionary/letters';
import { TEST_TARGET, WORD_ID, type ContributionType, type TargetType, type TranslationField } from './schemas';
import { applyAllToGlossary, translationPath, translationSource, translationText } from './apply/translations';
import { applyAllToArticle, articlePath, articleSource, articleText, type ArticleData } from './apply/articles';
import { articleData } from '@/lib/articles/load';
export { WORD_ID };

const PLANTS = join(process.cwd(), 'public/data/plants/p');
const DICT = join(process.cwd(), 'public/data');

export interface Target {
  label: string;
  /** The field the change touches, built on the server (never taken from the client). */
  path: string | null;
  base?: { value: unknown; hash: string };
  /** For a translation fix: the English text of the same block, shown beside it. */
  source?: string | null;
  /** For a fix on a plant part or a glossary term: which one (its term), for reviewers. */
  block?: string;
  /** For a Digo fix on an article: the Swahili of the same block, shown too. */
  swahili?: string | null;
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
    scientific: 'Testus plantus', family: null, section: 'test', themes: [], teaser: { en: 'Test', sw: 'Jaribio', dg: null },
    name_status: 'missing', has_parts: false, has_prose: { en: true, sw: false, dg: false }, digo: null, digo_source: null,
    other_mijikenda: null, summary: { en: 'Test', sw: 'Muhtasari wa majaribio', dg: null }, sections: { uses: { en: 'Test uses.', sw: null, dg: null } },
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
    idiomatic_en: 'Tests are useful', swahili: 'Methali ya majaribio', swahili_relationship: 'translation', commentary_en: 'Used in tests.', commentary_dg: '',
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
const GLOSSARY_FILE = join(process.cwd(), 'public/data/plants/glossary.json');

export function loadGlossaryTerm(term: string): GlossaryTerm | null {
  const list = JSON.parse(readFileSync(GLOSSARY_FILE, 'utf-8')) as GlossaryTerm[];
  return list.find((t) => t.term === term) ?? null;
}

/** A stand-in glossary term for automated tests. */
export function testGlossaryTerm(): GlossaryTerm {
  return { term: TEST_TARGET, kind: 'leaf', definition: { en: 'A test term.', sw: 'Neno la majaribio.', dg: 'Neno ra majaribio.' }, source: 'test' } as GlossaryTerm;
}

/**
 * A translation fix (spec 34 §17): the path comes from the structured fields (field, part, lang),
 * and the block must exist and hold text. Proverb fields keep their source in the base, as in §16.
 */
/** A stand-in article for automated tests (never shown; test rows never enter the article overlay). */
export function testArticle(): ArticleData & { id: string } {
  return {
    id: TEST_TARGET,
    title: { en: 'Test article', sw: 'Makala ya majaribio', dg: 'Makala ya majaribio' },
    blocks: [{ id: 'b001', type: 'paragraph', en: 'A test paragraph.', sw: 'Aya ya majaribio.', dg: 'Aya ya majaribio.' }],
  };
}

/** A fix on an article (spec 34 §17.11): a topic, a published figure or the timeline. */
function resolveArticleTarget(targetId: string, payload: Record<string, unknown>, opts: { isTest: boolean; liveChanges?: Change[] }): Target | null {
  const test = targetId === TEST_TARGET;
  if (test && !opts.isTest) return null;
  const raw = test ? testArticle() : (articleData(targetId) as ArticleData | null);
  if (!raw) return null;
  const path = articlePath(targetId, String(payload.field), payload.lang as 'en' | 'sw' | 'dg', typeof payload.block === 'string' ? payload.block : undefined);
  if (!path) return null;
  const a = applyAllToArticle(raw, targetId, opts.liveChanges ?? []);
  const text = articleText(a, path);
  if (!text) return null;
  const title = (a as { title?: { en?: string } }).title?.en ?? (targetId === 'timeline' ? 'Timeline' : targetId);
  const block = typeof payload.block === 'string' ? payload.block : undefined;
  return {
    label: title, path, base: withHash({ text }), source: articleSource(a, path),
    ...(path.endsWith('.dg') && { swahili: articleSource(a, path, 'sw') }),
    ...(block && { block }),
  };
}

function resolveTranslationTarget(targetType: TargetType | undefined, targetId: string | undefined, payload: Record<string, unknown>, opts: { isTest: boolean; liveChanges?: Change[] }): Target | null {
  if (targetId && targetType === 'article') return resolveArticleTarget(targetId, payload, opts);
  if (!targetId || (targetType !== 'plant' && targetType !== 'glossary' && targetType !== 'proverb')) return null;
  const lang = payload.lang as 'en' | 'sw' | 'dg';
  const part = typeof payload.part === 'number' ? payload.part : undefined;
  const path = translationPath(targetType, payload.field as TranslationField, lang, part);
  if (!path) return null;
  const test = targetId === TEST_TARGET;
  if (test && !opts.isTest) return null;

  if (targetType === 'proverb') {
    const raw = test ? testProverb() : loadProverb(targetId);
    if (!raw) return null;
    const [p] = applyAllToProverbs([raw], opts.liveChanges ?? []);
    const base = proverbFieldBase(p, path as Parameters<typeof proverbFieldBase>[1]);
    if (!base.text) return null;
    const en = path.startsWith('commentary_') ? p.commentary_en : path === 'swahili_equivalent' ? (p.english_equivalent || p.idiomatic_en) : p.idiomatic_en;
    return { label: [p.digo, p.idiomatic_en].filter(Boolean).join(' · '), path, base: withHash(base), source: path === 'commentary_en' ? null : en };
  }
  if (targetType === 'glossary') {
    const raw = test ? testGlossaryTerm() : loadGlossaryTerm(targetId);
    if (!raw) return null;
    const [t] = applyAllToGlossary([raw], opts.liveChanges ?? []);
    const text = translationText(t, 'glossary', path);
    return text ? { label: t.term, path, base: withHash({ text }), source: translationSource(t, 'glossary', path), block: t.term } : null;
  }
  const raw = test ? testPlant() : loadPlant(targetId);
  if (!raw) return null;
  const plant = applyAllToPlant(raw, opts.liveChanges ?? []);
  const text = translationText(plant, 'plant', path);
  if (!text) return null;
  const partTerm = /^parts\.(\d+)\./.exec(path) ? plant.parts[Number(path.split('.')[1])]?.term : undefined;
  return {
    label: [plant.digo_headword, plant.english].filter(Boolean).join(' · '), path, base: withHash({ text }),
    source: translationSource(plant, 'plant', path), ...(partTerm && { block: partTerm }),
  };
}

export function resolveTarget(
  type: ContributionType,
  targetType: TargetType | undefined,
  targetId: string | undefined,
  payload: Record<string, unknown>,
  opts: { isTest: boolean; liveChanges?: Change[] },
): Target | null {
  if (type === 'general_feedback') return { label: targetId ?? '', path: null };
  if (type === 'translation_fix') return resolveTranslationTarget(targetType, targetId, payload, opts);
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
