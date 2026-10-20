/**
 * Pure appliers for dictionary contributions (spec 34 technical §15.3). They work on the letter-file
 * entry shape, which is also what the app ships, so the live overlay and fold-in run the same code.
 * Each apply is idempotent (a change already in `provenance` is skipped) and each unapply restores
 * exactly what apply replaced, or refuses with a ConflictError if the field changed since.
 */
import type { DictionaryEntry, Example, Sense } from '@/lib/dictionary/types';
import type { Locale } from '@/lib/i18n/config';
import { stableStringify } from '../strings';
import { ConflictError, hasChange, withProvenance, withoutProvenance, type Change, type Provenance } from './types';

/** The fixed key order of an entry and a sense (spec 34 §15.1, invariant 4). `provenance` may follow. */
export const ENTRY_KEYS = ['id', 'headword', 'homonym_index', 'sort_key', 'pos', 'pos_en', 'noun_class', 'plural_prefix', 'plural_form', 'ipa',
  'audio', 'equivalents_en', 'equivalents_sw', 'variants', 'senses', 'etymology', 'bible_refs', 'proverb_refs', 'sub_entries',
  'editorial_state', 'is_redirect', 'redirect_target'] as const;
export const SENSE_KEYS = ['sense_id', 'definition_en', 'definition_sw', 'definition_dg', 'definition_dg_status', 'examples', 'synonyms_dg',
  'antonyms_dg', 'cross_refs', 'cultural_note', 'register', 'dialect_tags'] as const;

export type WordEntry = DictionaryEntry & { provenance?: Provenance; provisional?: boolean };
type CommunityExample = Omit<Example, 'source'> & { source: Example['source'] | 'community'; c?: string };
type Variant = { form: string; dialect: string; note: string | null; c?: string };

/** sort_key by the §15.1 rule: lower case, no leading "-", ’ as '. */
export function sortKeyOf(headword: string): string {
  return headword.normalize('NFC').toLowerCase().replace(/^-/, '').replace(/’/g, "'");
}

export function newSense(n: number, fields: Partial<Sense> = {}): Sense {
  const s: Sense = {
    sense_id: n, definition_en: '', definition_sw: '', definition_dg: '', definition_dg_status: 'pending', examples: [],
    synonyms_dg: [], antonyms_dg: [], cross_refs: [], cultural_note: null, register: 'neutral', dialect_tags: [],
  };
  const out = { ...s, ...fields };
  return Object.fromEntries(SENSE_KEYS.map((k) => [k, out[k]])) as unknown as Sense;
}

export function newEntry(fields: Partial<DictionaryEntry>): WordEntry {
  const e: DictionaryEntry = {
    id: '', headword: '', homonym_index: null, sort_key: '', pos: '', pos_en: '', noun_class: null, plural_prefix: null,
    plural_form: null, ipa: '', audio: [], equivalents_en: [], equivalents_sw: [], variants: [], senses: [],
    etymology: { source: null, root: null, notes: '' } as DictionaryEntry['etymology'], bible_refs: [], proverb_refs: [],
    sub_entries: [], editorial_state: 'draft', is_redirect: false, redirect_target: null,
  };
  const out = { ...e, ...fields };
  return Object.fromEntries(ENTRY_KEYS.map((k) => [k, out[k]])) as unknown as WordEntry;
}

/** Keep the fixed key order after a spread, with provenance (if any) last. */
function shaped(e: WordEntry): WordEntry {
  const out = Object.fromEntries(ENTRY_KEYS.map((k) => [k, e[k]])) as unknown as WordEntry;
  if (e.provenance && Object.keys(e.provenance).length) out.provenance = e.provenance;
  if (e.provisional) out.provisional = true;
  return out;
}

const same = (a: unknown, b: unknown) => stableStringify(a ?? null) === stableStringify(b ?? null);
const field = (lang: Locale) => `definition_${lang}` as 'definition_en' | 'definition_sw' | 'definition_dg';

export function senseNumber(path: string | null | undefined): number | null {
  const m = /^senses\.(\d{1,3})(?:\.|$)/.exec(path ?? '');
  return m ? Number(m[1]) : null;
}

/** What a definition replace is checked against: the text, and the status for Digo. */
export function definitionBase(e: DictionaryEntry, senseId: number, lang: Locale) {
  const s = e.senses.find((x) => x.sense_id === senseId);
  if (!s) return null;
  return lang === 'dg' ? { text: s.definition_dg ?? '', status: s.definition_dg_status } : { text: s[field(lang)] ?? '' };
}

/** The next free sense id for an add_sense, allocated once at accept. */
export function nextSenseId(e: DictionaryEntry, liveAddSenses: (string | null | undefined)[] = []): number {
  const taken = [...e.senses.map((s) => s.sense_id), ...liveAddSenses.map(senseNumber).filter((n): n is number => n !== null)];
  return Math.max(0, ...taken) + 1;
}

function withSense(e: WordEntry, n: number, fn: (s: Sense) => Sense): WordEntry {
  return { ...e, senses: e.senses.map((s) => (s.sense_id === n ? fn(s) : s)) };
}

/** Apply an accepted change to one entry. Throws ConflictError if the target moved on. */
export function applyWord(entry: WordEntry, change: Change): WordEntry {
  if (hasChange(entry.provenance, change.contribution_id)) return entry;
  const p = change.final_payload;

  if (change.type === 'definition_update') {
    const lang = p.lang as Locale;
    if (p.mode === 'add_sense') {
      const n = senseNumber(change.target_path);
      if (n === null || entry.senses.some((s) => s.sense_id === n)) throw new ConflictError(change.contribution_id, change.target_path ?? 'senses');
      const sense = newSense(n, { [field(lang)]: String(p.text), ...(lang === 'dg' ? { definition_dg_status: 'community' as Sense['definition_dg_status'] } : {}) });
      return shaped({ ...entry, senses: [...entry.senses, sense], provenance: withProvenance(entry.provenance, `senses.${n}`, change) });
    }
    const n = Number(p.sense_id);
    const path = `senses.${n}.${field(lang)}`;
    const current = definitionBase(entry, n, lang);
    // A replace is always checked against the text it was suggested for; with no base it can't be.
    if (!current || !change.base || !same(current, change.base.value)) throw new ConflictError(change.contribution_id, path);
    const next = withSense(entry, n, (s) => ({
      ...s,
      [field(lang)]: String(p.text),
      ...(lang === 'dg' ? { definition_dg_status: 'community' as Sense['definition_dg_status'] } : {}),
    }));
    return shaped({ ...next, provenance: withProvenance(entry.provenance, path, change) });
  }

  if (change.type === 'example_sentence') {
    const n = Number(p.sense_id);
    if (!entry.senses.some((s) => s.sense_id === n)) throw new ConflictError(change.contribution_id, `senses.${n}.examples`);
    const ex: CommunityExample = { dg: String(p.dg), en: String(p.en ?? ''), sw: String(p.sw ?? ''), source: 'community', c: change.contribution_id };
    const next = withSense(entry, n, (s) => ({ ...s, examples: [...s.examples, ex as unknown as Example] }));
    return shaped({ ...next, provenance: withProvenance(entry.provenance, `senses.${n}.examples`, change) });
  }

  if (change.type === 'spelling_variant') {
    const v: Variant = { form: String(p.form), dialect: change.region ?? '', note: p.kind === 'dialect' ? 'dialect' : null, c: change.contribution_id };
    return shaped({
      ...entry,
      variants: [...entry.variants, v as unknown as DictionaryEntry['variants'][number]],
      provenance: withProvenance(entry.provenance, 'variants', change),
    });
  }

  return entry; // entry_flag never changes content
}

/**
 * Undo a change on the data files (revert after fold-in). Restores what apply replaced, only if the
 * field still holds what the change set; otherwise ConflictError.
 */
export function unapplyWord(entry: WordEntry, change: Change): WordEntry {
  if (!hasChange(entry.provenance, change.contribution_id)) return entry;
  const p = change.final_payload;
  const c = change.contribution_id;
  const drop = (e: WordEntry) => shaped({ ...e, provenance: withoutProvenance(e.provenance, c) });

  if (change.type === 'definition_update') {
    const lang = p.lang as Locale;
    if (p.mode === 'add_sense') {
      const n = senseNumber(change.target_path);
      const s = entry.senses.find((x) => x.sense_id === n);
      if (!s || s[field(lang)] !== String(p.text)) throw new ConflictError(c, `senses.${n}`);
      const others = Object.entries(entry.provenance ?? {}).some(
        ([path, list]) => path.startsWith(`senses.${n}.`) && list.some((x) => x.c !== c),
      );
      if (others) throw new ConflictError(c, `senses.${n}`);
      return drop({ ...entry, senses: entry.senses.filter((x) => x.sense_id !== n) });
    }
    const n = Number(p.sense_id);
    const s = entry.senses.find((x) => x.sense_id === n);
    if (!s || s[field(lang)] !== String(p.text)) throw new ConflictError(c, `senses.${n}.${field(lang)}`);
    const base = (change.base?.value ?? {}) as { text?: string; status?: Sense['definition_dg_status'] };
    return drop(withSense(entry, n, (x) => ({
      ...x,
      [field(lang)]: base.text ?? '',
      ...(lang === 'dg' && base.status ? { definition_dg_status: base.status } : {}),
    })));
  }

  if (change.type === 'example_sentence') {
    const n = Number(p.sense_id);
    return drop(withSense(entry, n, (s) => ({ ...s, examples: s.examples.filter((x) => (x as CommunityExample).c !== c) })));
  }

  if (change.type === 'spelling_variant') {
    return drop({ ...entry, variants: entry.variants.filter((v) => (v as Variant).c !== c) });
  }
  return entry;
}

/** The entry a word_addition creates. `id` is `c:<uuid>` in the overlay and the real id at fold-in. */
export function wordAdditionEntry(change: Change, id = `c:${change.contribution_id}`): WordEntry {
  const p = change.final_payload as Record<string, string | undefined>;
  const headword = String(p.headword).normalize('NFC').replace(/’/g, "'");
  const split = (s?: string) => (s ? s.split(/[;,]\s*/).map((x) => x.trim()).filter(Boolean) : []);
  const example = p.example_dg
    ? [{ dg: p.example_dg, en: p.example_en ?? '', sw: p.example_sw ?? '', source: 'community', c: change.contribution_id } as unknown as Example]
    : [];
  const sense = newSense(1, {
    definition_en: p.meaning_en ?? '',
    definition_sw: p.meaning_sw ?? '',
    definition_dg: p.definition_dg ?? '',
    definition_dg_status: (p.definition_dg ? 'community' : 'pending') as Sense['definition_dg_status'],
    examples: example,
  });
  const n = /\.(\d{1,3})$/.exec(id);
  const e = newEntry({
    id,
    headword,
    homonym_index: n ? Number(n[1]) : null,
    sort_key: sortKeyOf(headword),
    pos: p.pos ?? '',
    equivalents_en: split(p.meaning_en),
    equivalents_sw: split(p.meaning_sw),
    senses: [sense],
  });
  return shaped({ ...e, provenance: withProvenance(undefined, 'entry', change) });
}

/** The id a folded new word gets: the sort_key, or `<sort_key>.N` if taken (N = max(existing, 1) + 1). */
export function foldedId(sortKey: string, existingIds: string[]): string {
  const taken = existingIds.filter((id) => id === sortKey || id.startsWith(`${sortKey}.`));
  if (!taken.length) return sortKey;
  const nums = taken.map((id) => (id === sortKey ? 1 : Number(id.slice(sortKey.length + 1)) || 1));
  return `${sortKey}.${Math.max(1, ...nums) + 1}`;
}

/** Apply every change for the entries of one letter file, in review order; conflicts are skipped and reported. */
export function applyAllToEntries(entries: WordEntry[], changes: Change[], onConflict?: (e: ConflictError) => void): WordEntry[] {
  if (!changes.length) return entries;
  const byId = new Map<string, Change[]>();
  for (const c of changes) if (c.type !== 'word_addition') byId.set(c.target_id, [...(byId.get(c.target_id) ?? []), c]);
  return entries.map((e) => {
    const list = byId.get(e.id);
    if (!list) return e;
    return list.reduce((acc, c) => {
      try {
        return applyWord(acc, c);
      } catch (err) {
        if (err instanceof ConflictError) {
          onConflict?.(err);
          return acc;
        }
        throw err;
      }
    }, e);
  });
}
