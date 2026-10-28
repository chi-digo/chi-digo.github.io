/**
 * Interface-string fixes (spec 34 §17.12, phase 5d): one corrected Swahili or Digo string of the site's
 * own text, lib/i18n/messages/<lang>.json, addressed by its two-level key (section.key). Message files
 * can't hold provenance, so a fix is applied when the value equals the proposal, and undone only from
 * the proposal back to the base. Keys are read and written as own properties only.
 */
import { ConflictError, type Change } from './types';

export type MessageTree = Record<string, unknown>;

/** A key a reader may fix: section.key, not in the namespaces that stay with the team. */
export const UI_KEY = /^[a-z_]+\.[a-z0-9_]+$/;
export const UI_DENIED = ['meta', 'auth', 'contribute', 'review', 'admin'];
export const UI_TEST_KEY = '__test__.label';

export function uiKeyAllowed(key: string): boolean {
  return UI_KEY.test(key) && !UI_DENIED.includes(key.split('.')[0]);
}

const own = (o: unknown, k: string): unknown =>
  o && typeof o === 'object' && Object.hasOwn(o as object, k) ? (o as Record<string, unknown>)[k] : undefined;

/** The string at section.key, or null when it isn't an own string leaf. */
export function uiText(messages: MessageTree, key: string): string | null {
  if (!UI_KEY.test(key)) return null;
  const [section, name] = key.split('.');
  const v = own(own(messages, section), name);
  return typeof v === 'string' ? v : null;
}

function withText(messages: MessageTree, key: string, text: string): MessageTree {
  const [section, name] = key.split('.');
  return { ...messages, [section]: { ...(messages[section] as Record<string, unknown>), [name]: text } };
}

/** Problems with a proposed string against its English (spec 34 §17.12). */
export function uiTextProblem(en: string, base: string, proposed: string): 'unchanged' | 'placeholders' | 'markers' | 'too_long' | null {
  const p = proposed.trim();
  if (p === base.trim() || (!base && p === en.trim())) return 'unchanged';
  const holes = (t: string) => [...t.matchAll(/\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g)].map((m) => m[1]).sort().join(',');
  if (holes(p) !== holes(en)) return 'placeholders';
  const marks = (t: string) => (t.match(/\{dig:[^}]*\}/g) ?? []).length;
  if (marks(p) !== marks(en)) return 'markers';
  if (p.length > en.length * 3 + 40) return 'too_long';
  return null;
}

export function applyUi(messages: MessageTree, change: Change): MessageTree {
  const key = change.target_path ?? '';
  const now = uiText(messages, key);
  const proposed = String(change.final_payload.proposed);
  const base = (change.base?.value as { text?: string } | undefined)?.text;
  if (now === proposed) return messages;
  if (now === null || base === undefined || now !== base) throw new ConflictError(change.contribution_id, key);
  return withText(messages, key, proposed);
}

export function unapplyUi(messages: MessageTree, change: Change): MessageTree {
  const key = change.target_path ?? '';
  const now = uiText(messages, key);
  const base = String((change.base?.value as { text?: string }).text ?? '');
  if (now === base) return messages;
  if (now !== String(change.final_payload.proposed)) throw new ConflictError(change.contribution_id, key);
  return withText(messages, key, base);
}
