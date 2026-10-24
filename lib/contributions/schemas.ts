/**
 * Community contributions (spec 34): types, scopes, regions, statuses and the payload schema for
 * each type. Shared by the API (validation), the review screen and the forms.
 */
import { z } from 'zod';
import { safeText, optSafeText } from './text';
import { PROVERB_THEMES } from '@/lib/proverbs/themes';

const PROVERB_THEME_SLUGS = PROVERB_THEMES.map((t) => t.slug);

export const SCOPES = ['dictionary', 'proverbs', 'plants', 'translations', 'feedback'] as const;
export type Scope = (typeof SCOPES)[number];
/** Reviewer scopes: the content scopes plus `all`. */
export const REVIEW_SCOPES = [...SCOPES, 'all'] as const;
export type ReviewScope = (typeof REVIEW_SCOPES)[number];

export const ROLES = ['member', 'reviewer', 'admin'] as const;
export type Role = (typeof ROLES)[number];

export const STATUSES = ['pending', 'needs_info', 'accepted', 'declined', 'duplicate', 'withdrawn', 'reverted', 'resolved'] as const;
export type Status = (typeof STATUSES)[number];

export const LIVE_STATUSES = ['awaiting_second', 'live', 'paused', 'conflict', 'reverting'] as const;
export type LiveStatus = (typeof LIVE_STATUSES)[number];

/** Where the knowledge comes from (product spec §4.1). Shown publicly; the village never is. */
export const REGIONS = ['kwale_north', 'kwale_south', 'kinondo_diani', 'tanga', 'diaspora', 'other'] as const;
export type Region = (typeof REGIONS)[number];

export const CONFIDENCE = ['native', 'heard', 'unsure'] as const;
export type Confidence = (typeof CONFIDENCE)[number];

const lang3 = z.enum(['en', 'sw', 'dg']);
const senseId = z.string().trim().regex(/^\d{1,3}$/);

/**
 * A Digo headword or variant form (spec 34 §15.3): NFC, ’ as ', then letters of Digo orthography
 * only (c only in ch; no q or x; tone accents allowed), words joined by spaces or hyphens, an optional
 * leading or trailing hyphen for affixes, at most 40 characters. Stored as typed.
 */
const DIGO_L = "(?:ch|[abd-pr-wyzáéíóú'])+";
const DIGO_WORD = new RegExp(`^-?${DIGO_L}(?:[- ]${DIGO_L})*-?$`);
/** Backslashes and lone surrogates, on top of safeText's rules. */
const UNSAFE_WORD = /[\\]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/;
export function isDigoWord(s: string): boolean {
  const t = s.normalize('NFC').replace(/’/g, "'");
  // It must also start with a plain letter, so it sorts into a letter file (not á…, not ').
  return t.length <= 40 && DIGO_WORD.test(t.toLowerCase()) && /^-?[a-z]/.test(t.toLowerCase());
}

/** Dictionary ids: a sort key with an optional .N (spec 34 §15.3; tone accents and spaces occur, e.g. mwanáo). */
export const WORD_ID = /^[a-z' áéíóú_-]+(\.\d{1,3})?$/;
const digoWord = safeText(40)
  .transform((s) => s.normalize('NFC').replace(/’/g, "'"))
  // __test__ is the automated tests' new word; the API lets only test accounts use it.
  .refine((s) => isDigoWord(s) || s === TEST_TARGET, { message: 'Use Digo letters only (no digits or symbols)' });
/** Zero-width characters (U+200B–D, U+2060, U+FEFF): they can hide a ruled-out Digo form (spec 34 §16.9). */
const ZERO_WIDTH = /[\u200B-\u200D\u2060\uFEFF]/;
const paragraphs = (s: string) => s.split(/\n\s*\n/).filter((x) => x.trim()).length;
/** Long proverb text: no zero-width characters, at most five paragraphs. */
const proverbText = (max: number) =>
  safeText(max)
    .refine((s) => !ZERO_WIDTH.test(s) && !UNSAFE_WORD.test(s), { message: 'Contains characters that are not allowed' })
    .refine((s) => paragraphs(s) <= 5, { message: 'At most five paragraphs' });
const optProverbText = (max: number) =>
  optSafeText(max)
    .refine((s) => !s || (!ZERO_WIDTH.test(s) && !UNSAFE_WORD.test(s)), { message: 'Contains characters that are not allowed' })
    .refine((s) => !s || paragraphs(s) <= 5, { message: 'At most five paragraphs' });
/**
 * A proverb or its variant in Digo: letters of Digo orthography with tone accents, spaces, apostrophes,
 * hyphens and sentence punctuation (, . ? ! ; : / ( ) as in the existing data); no digits or symbols.
 */
const PROVERB_DIGO = /^[a-záéíóú'’‘ ,.?!;:/()-]+$/;
export function isProverbDigo(s: string): boolean {
  const t = s.normalize('NFC');
  return t.length <= 400 && /[a-z]/.test(t.toLowerCase()) && PROVERB_DIGO.test(t.toLowerCase()) && !ZERO_WIDTH.test(t);
}
const proverbDigo = safeText(400)
  .transform((s) => s.normalize('NFC'))
  // __test__ is the automated tests' new proverb; the API lets only test accounts use it.
  .refine((s) => isProverbDigo(s) || s === TEST_TARGET, { message: 'Use Digo letters and punctuation only' });
const wordText = (max: number) => safeText(max).refine((s) => !UNSAFE_WORD.test(s), { message: 'Contains characters that are not allowed' });
const optWordText = (max: number) => optSafeText(max).refine((s) => !s || !UNSAFE_WORD.test(s), { message: 'Contains characters that are not allowed' });

export const PAYLOADS = {
  word_addition: z
    .object({
      headword: digoWord,
      pos: optWordText(40),
      meaning_en: optWordText(500),
      meaning_sw: optWordText(500),
      definition_dg: optWordText(500),
      example_dg: optWordText(400),
      example_en: optWordText(400),
      example_sw: optWordText(400),
    })
    .refine((p) => p.meaning_en || p.meaning_sw, { message: 'Give a meaning in English or Swahili' }),
  definition_update: z.object({
    sense_id: senseId,
    lang: lang3,
    text: wordText(1000),
    mode: z.enum(['replace', 'add_sense']),
    reason: optWordText(500),
  }),
  example_sentence: z.object({ sense_id: senseId, dg: wordText(400), en: optWordText(400), sw: optWordText(400) }),
  spelling_variant: z.object({ form: digoWord, kind: z.enum(['spelling', 'dialect']) }),
  entry_flag: z.object({
    reason: z.enum(['wrong_word', 'wrong_meaning', 'offensive', 'duplicate', 'other']),
    detail: optWordText(1000),
  }),
  proverb_addition: z
    .object({
      digo: proverbDigo,
      literal_en: optProverbText(400),
      meaning_en: optProverbText(500),
      meaning_sw: optProverbText(500),
      meaning_dg: optProverbText(500),
      usage: optProverbText(1500),
      /** The language `usage` is written in; it becomes that language's commentary (spec 34 §16.9). */
      usage_lang: lang3.optional(),
      /** "This proverb is for adults" (the reviewer decides at accept). */
      mature: z.boolean().optional(),
      // Filled in by the reviewer at accept (spec 34 §16.9): themes, the literal Swahili, a Swahili version.
      themes: z.array(z.enum(PROVERB_THEME_SLUGS as [string, ...string[]])).max(5).optional(),
      literal_sw: optProverbText(400),
      swahili: optProverbText(400),
    })
    .refine((p) => p.meaning_en || p.meaning_sw || p.meaning_dg, { message: 'Give a meaning' })
    .refine((p) => !p.usage || p.usage_lang, { message: 'Say which language the usage is in' }),
  proverb_variant: z.object({ form: proverbDigo, note: optProverbText(300) }),
  proverb_meaning: z
    .object({ lang: lang3, text: proverbText(500), kind: z.enum(['idiomatic', 'literal']), mode: z.literal('replace').default('replace') })
    .refine((p) => !(p.kind === 'literal' && p.lang === 'dg'), { message: 'Literal meanings are in English or Swahili' }),
  proverb_context: z.object({ lang: lang3, text: proverbText(1500) }),
  plant_name: z.object({ name: safeText(80), choice: z.enum(['proposal', 'other']), other_names: optSafeText(300) }),
  plant_info: z.object({
    section: z.enum(['about', 'where', 'uses', 'culture', 'names', 'conservation']),
    lang: lang3,
    mode: z.enum(['replace', 'add']),
    text: safeText(2000),
  }),
  plant_addition: z
    .object({
      digo: optSafeText(80),
      swahili: optSafeText(80),
      english: optSafeText(120),
      description: safeText(2000),
      uses: optSafeText(2000),
    })
    .refine((p) => p.digo || p.swahili || p.english, { message: 'Give at least one name' }),
  translation_fix: z.object({ lang: z.enum(['sw', 'dg']), current: safeText(4000), proposed: safeText(4000) }),
  general_feedback: z.object({ text: safeText(2000) }),
} as const;

export type ContributionType = keyof typeof PAYLOADS;
export const TYPES = Object.keys(PAYLOADS) as ContributionType[];
export type Payload<T extends ContributionType> = z.output<(typeof PAYLOADS)[T]>;

/** Which review scope each type belongs to. */
export const TYPE_SCOPE: Record<ContributionType, Scope> = {
  word_addition: 'dictionary',
  definition_update: 'dictionary',
  example_sentence: 'dictionary',
  spelling_variant: 'dictionary',
  entry_flag: 'dictionary',
  proverb_addition: 'proverbs',
  proverb_variant: 'proverbs',
  proverb_meaning: 'proverbs',
  proverb_context: 'proverbs',
  plant_name: 'plants',
  plant_info: 'plants',
  plant_addition: 'plants',
  translation_fix: 'translations',
  general_feedback: 'feedback',
};

/** Types that add something new, so they have no existing target. */
export const NEW_ITEM_TYPES: ContributionType[] = ['word_addition', 'proverb_addition', 'plant_addition', 'general_feedback'];

/** Types this build accepts. Each later phase adds its types here as its forms and appliers land. */
export const ENABLED_TYPES: ContributionType[] = [
  'plant_name', 'plant_info', 'general_feedback',
  'word_addition', 'definition_update', 'example_sentence', 'spelling_variant', 'entry_flag',
  'proverb_addition', 'proverb_variant', 'proverb_meaning', 'proverb_context',
];

export const TARGET_TYPES = ['word', 'proverb', 'plant', 'article', 'glossary', 'ui', 'page'] as const;
export type TargetType = (typeof TARGET_TYPES)[number];

/** The plant used by automated flow tests; it exists only for rows flagged as test data. */
export const TEST_TARGET = '__test__';

export const recordedForSchema = z.object({
  name: safeText(60),
  region: z.enum(REGIONS),
  age_band: z.enum(['u30', '30_60', 'o60']),
});

export const submitSchema = z.object({
  type: z.enum(TYPES as [ContributionType, ...ContributionType[]]),
  target_type: z.enum(TARGET_TYPES).optional(),
  target_id: optSafeText(200),
  payload: z.record(z.string(), z.unknown()),
  note: optSafeText(2000),
  region: z.enum(REGIONS).optional(),
  village: optSafeText(120),
  confidence: z.enum(CONFIDENCE).optional(),
  credit_opt_in: z.boolean().default(false),
  recorded_for: recordedForSchema.optional(),
  locale: lang3,
  page_path: z.string().max(300).regex(/^\/(?!\/)[\w/%.~-]*$/).optional(),
  /** Submit even though a similar plant name is already suggested. */
  force_new: z.boolean().optional(),
});
export type SubmitInput = z.input<typeof submitSchema>;

export const REVIEW_ACTIONS = [
  'claim', 'release', 'accept', 'accept_variant', 'needs_info', 'decline', 'duplicate',
  'second_confirm', 'second_reject', 'self_confirm', 'revert', 'retry_fold', 'resolve',
] as const;
export type ReviewAction = (typeof REVIEW_ACTIONS)[number];

export const reviewSchema = z.object({
  action: z.enum(REVIEW_ACTIONS),
  final_payload: z.record(z.string(), z.unknown()).optional(),
  note: optSafeText(2000),
  duplicate_of: z.string().uuid().optional(),
  merge_ids: z.array(z.string().uuid()).max(50).optional(),
});

/** Limits mirrored from the database functions, for messages and tests (spec §12). */
export const LIMITS = { perDay: 30, perDayNew: 5, agreementsPerDay: 30, agreementsPerDayNew: 10, perTarget: 5, acceptedToApply: 5, wordsPerDay: 10 };

/** Types that are never published: closed with resolve or decline (spec 34 §15.3). */
export const NEVER_PUBLIC: ContributionType[] = ['entry_flag', 'general_feedback'];
