/**
 * Translation fixes (spec 34 §17, phase 5a): one corrected sw or dg text on a plant (teaser, summary,
 * a part's definition, use or meaning) or a glossary term's definition. Proverb fields are handled in
 * ./proverbs.ts with the same path rules.
 *
 * Paths are built by the server from structured fields and checked here against fixed patterns. Each
 * surface is read and written explicitly (own properties only), never by a generic path setter, so a
 * path can't reach a prototype or another field.
 */
import type { Locale } from '@/lib/i18n/config';
import type { TranslationField } from '../schemas';
import { ConflictError, hasChange, withProvenance, withoutProvenance, type Change, type Provenance } from './types';

export type TranslationTarget = 'plant' | 'glossary' | 'proverb';
type Lang = 'en' | 'sw' | 'dg';
type L10nLike = Partial<Record<Locale, string | null>>;
/** The parts of a plant (source or shipped) and a glossary term that translation fixes touch. */
type Fixable = {
  teaser?: L10nLike | null;
  summary?: L10nLike | null;
  parts?: readonly object[] | null;
  definition?: L10nLike | null;
  meaning?: L10nLike | null;
  provenance?: Provenance;
};

// Reading allows en (the source shown beside a fix); writing refuses it for plants and the glossary.
const PLANT_PROSE = /^(teaser|summary)\.(en|sw|dg)$/;
const PLANT_PART = /^parts\.(\d{1,2})\.(definition|use|meaning)\.(en|sw|dg)$/;
const GLOSSARY = /^(definition|meaning)\.(en|sw|dg)$/;
const PROVERB = /^(swahili|swahili_equivalent|commentary_(?:en|sw|dg))$/;

/**
 * The path a fix writes to, from the structured fields the client sent, or null if that combination
 * isn't a fixable block. English is allowed only for proverb commentary (owner decision 2).
 */
export function translationPath(target: TranslationTarget, field: TranslationField, lang: Lang, part?: number): string | null {
  if (target === 'plant') {
    if (lang === 'en') return null;
    if ((field === 'teaser' || field === 'summary') && part === undefined) return `${field}.${lang}`;
    if ((field === 'definition' || field === 'use' || field === 'meaning') && part !== undefined) return `parts.${part}.${field}.${lang}`;
    return null;
  }
  if (target === 'glossary') return (field === 'definition' || field === 'meaning') && lang !== 'en' && part === undefined ? `${field}.${lang}` : null;
  if (part !== undefined) return null;
  if (field === 'swahili' || field === 'swahili_equivalent') return lang === 'sw' ? field : null;
  if (field === 'commentary') return `commentary_${lang}`;
  return null;
}

/** The language a path is in (proverb fields carry it in the name). */
export function pathLang(path: string): Lang | null {
  const m = /(?:\.|_)(en|sw|dg)$/.exec(path);
  if (m) return m[1] as Lang;
  return path === 'swahili' || path === 'swahili_equivalent' ? 'sw' : null;
}

const own = (o: unknown, k: string): unknown =>
  o && typeof o === 'object' && Object.hasOwn(o as object, k) ? (o as Record<string, unknown>)[k] : undefined;
const str = (v: unknown) => (typeof v === 'string' ? v : null);

/** The current text at a plant or glossary path; null if the block doesn't exist (nothing to fix). */
export function translationText(item: Fixable, target: 'plant' | 'glossary', path: string): string | null {
  if (target === 'glossary') {
    const m = GLOSSARY.exec(path);
    return m ? str(own(own(item, m[1]), m[2])) : null;
  }
  const prose = PLANT_PROSE.exec(path);
  if (prose) return str(own(own(item, prose[1]), prose[2]));
  const part = PLANT_PART.exec(path);
  if (!part) return null;
  const parts = own(item, 'parts');
  if (!Array.isArray(parts)) return null;
  const i = Number(part[1]);
  return i < parts.length ? str(own(own(parts[i], part[2]), part[3])) : null;
}

/** The English text of the same block (shown to the contributor and the reviewer). */
export function translationSource(item: Fixable, target: 'plant' | 'glossary', path: string): string | null {
  return translationText(item, target, path.replace(/\.(sw|dg)$/, '.en'));
}

function withText<T extends Fixable>(item: T, target: 'plant' | 'glossary', path: string, text: string): T {
  if (target === 'glossary') {
    const m = GLOSSARY.exec(path)!;
    const key = m[1] as 'definition' | 'meaning';
    return { ...item, [key]: { ...(item[key] ?? {}), [m[2]]: text } };
  }
  const prose = PLANT_PROSE.exec(path);
  if (prose) {
    const key = prose[1] as 'teaser' | 'summary';
    return { ...item, [key]: { ...(item[key] ?? {}), [prose[2]]: text } };
  }
  const m = PLANT_PART.exec(path)!;
  const i = Number(m[1]);
  const parts = [...(item.parts ?? [])] as Record<string, unknown>[];
  parts[i] = { ...parts[i], [m[2]]: { ...(parts[i][m[2]] as L10nLike), [m[3]]: text } };
  return { ...item, parts };
}

/** Apply a translation fix to a plant (source or shipped) or a glossary term. */
export function applyTranslation<T extends Fixable>(item: T, target: 'plant' | 'glossary', change: Change): T {
  if (hasChange(item.provenance, change.contribution_id)) return item;
  const path = change.target_path ?? '';
  if (pathLang(path) === 'en') throw new ConflictError(change.contribution_id, path);
  const current = translationText(item, target, path);
  const base = (change.base?.value as { text?: string } | undefined)?.text;
  if (current === null || base === undefined || current !== base) throw new ConflictError(change.contribution_id, path);
  const next = withText(item, target, path, String(change.final_payload.proposed));
  return { ...next, provenance: withProvenance(item.provenance, path, change) };
}

/** Undo a folded translation fix, only if the block still holds exactly the fixed text. */
export function unapplyTranslation<T extends Fixable>(item: T, target: 'plant' | 'glossary', change: Change): T {
  if (!hasChange(item.provenance, change.contribution_id)) return item;
  const path = change.target_path ?? '';
  if (translationText(item, target, path) !== String(change.final_payload.proposed)) throw new ConflictError(change.contribution_id, path);
  const base = String((change.base?.value as { text?: string }).text);
  const { provenance: _p, ...rest } = withText(item, target, path, base);
  const provenance = withoutProvenance(item.provenance, change.contribution_id);
  return (provenance ? { ...rest, provenance } : rest) as T;
}

/** Apply the live glossary fixes (target_type 'glossary', target_id = the term) in review order. */
export function applyAllToGlossary<T extends Fixable & { term: string }>(terms: T[], changes: Change[], onConflict?: (e: ConflictError) => void): T[] {
  const mine = changes.filter((c) => c.target_type === 'glossary' && c.type === 'translation_fix');
  if (!mine.length) return terms;
  return terms.map((t) =>
    mine
      .filter((c) => c.target_id === t.term)
      .reduce((acc, c) => {
        try {
          return applyTranslation(acc, 'glossary', c);
        } catch (e) {
          if (e instanceof ConflictError) {
            onConflict?.(e);
            return acc;
          }
          throw e;
        }
      }, t),
  );
}

export { PROVERB as PROVERB_TRANSLATION_PATH };
