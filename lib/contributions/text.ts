/**
 * Text rules for community contributions (spec 34 technical §3): what free text may contain,
 * how Digo spellings are compared, and how JSON is made safe inside a <script> tag.
 */
import { z } from 'zod';

/** C0/C1 controls except newline and tab, and the bidirectional overrides used to disguise text. */
const DISALLOWED = /[<>\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F‪-‮⁦-⁩]/;

export function isSafeText(s: string): boolean {
  return !DISALLOWED.test(s);
}

/** A trimmed, non-empty string of at most `max` characters with no markup or control characters. */
export function safeText(max: number) {
  return z.string().trim().min(1).max(max).refine(isSafeText, { message: 'Contains characters that are not allowed' });
}

/** The same rules for an optional field; empty strings become undefined. */
export function optSafeText(max: number) {
  return z
    .string()
    .trim()
    .max(max)
    .refine(isSafeText, { message: 'Contains characters that are not allowed' })
    .optional()
    .transform((v) => v || undefined);
}

export { normaliseDigo, stableStringify } from './strings';

const PII = [
  /(https?:\/\/|www\.)\S+/i,
  /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/,
  /(^|\s)@[A-Za-z0-9_.]{2,}/,
  /\+?\d[\d\s().-]{7,}\d/,
];

/** Whether text looks like it holds a link, email, handle or phone number (mirrors private.mask_pii). */
export function hasPII(s: string): boolean {
  return PII.some((re) => re.test(s));
}

/** JSON for a <script> element: escapes characters that could close the tag or break the parser. */
export function safeJsonForScript(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}
