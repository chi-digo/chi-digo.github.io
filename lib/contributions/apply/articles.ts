/**
 * Translation fixes on articles (spec 34 §17.11, phase 5c): a topic, a figure or the timeline. Paths are
 * built by the server from structured fields and read and written here explicitly, own properties only:
 *   title.<lang> · subtitle.<lang> · blocks.<bNNN>.<lang> · meta.<mNN>.<lang>
 *   events.<t-xxxx>.(title|description).<lang>
 * Base {text}; idempotent through the file's provenance (keyed by path); undo restores the exact bytes.
 * The same code runs in the live overlay (in the browser) and in fold-in.
 */
import type { Provenance } from './types';
import { ConflictError, hasChange, withProvenance, withoutProvenance, type Change } from './types';

type Lang = 'en' | 'sw' | 'dg';
type Texts = Partial<Record<Lang, string>>;
/** Any article file: a topic, a figure or the timeline. */
export type ArticleData = {
  title?: Texts;
  subtitle?: Texts;
  blocks?: ({ id: string; type?: string } & Texts)[];
  meta?: ({ id: string } & Texts)[];
  events?: { id: string; title: Texts; description: Texts }[];
  provenance?: Provenance;
};

const TOP = /^(title|subtitle)\.(en|sw|dg)$/;
const BLOCK = /^(blocks|meta)\.([bm]\d{2,4})\.(en|sw|dg)$/;
const EVENT = /^events\.(t-[0-9a-f]{4})\.(title|description)\.(en|sw|dg)$/;

/** The path for the structured fields a client sent, or null. Article fixes are sw/dg only. */
export function articlePath(articleId: string, field: string, lang: Lang, block?: string): string | null {
  if (lang === 'en') return null;
  if (articleId === 'timeline') {
    return (field === 'title' || field === 'description') && block && /^t-[0-9a-f]{4}$/.test(block) ? `events.${block}.${field}.${lang}` : null;
  }
  // A figure's page shows its card name and no detail lines: those aren't fixable until they are shown.
  if (field === 'title' && !block && !articleId.startsWith('figures/')) return `title.${lang}`;
  if (field === 'subtitle' && !block && articleId.startsWith('figures/')) return `subtitle.${lang}`;
  if (field === 'block' && block && /^b\d{3,4}$/.test(block)) return `blocks.${block}.${lang}`;
  return null;
}

const own = (o: unknown, k: string): unknown =>
  o && typeof o === 'object' && Object.hasOwn(o as object, k) ? (o as Record<string, unknown>)[k] : undefined;
const str = (v: unknown) => (typeof v === 'string' ? v : null);
const byId = <T extends { id: string }>(list: unknown, id: string): T | undefined =>
  Array.isArray(list) ? (list as T[]).find((x) => x && x.id === id) : undefined;

/** The text at a path, or null when the block doesn't exist. */
export function articleText(a: ArticleData, path: string): string | null {
  let m = TOP.exec(path);
  if (m) return str(own(own(a, m[1]), m[2]));
  m = BLOCK.exec(path);
  if (m) return str(own(byId(own(a, m[1]), m[2]), m[3]));
  m = EVENT.exec(path);
  if (m) return str(own(own(byId(own(a, 'events'), m[1]), m[2]), m[3]));
  return null;
}

/** The English of the same block (shown to contributors and reviewers). */
export function articleSource(a: ArticleData, path: string, lang: 'en' | 'sw' = 'en'): string | null {
  return articleText(a, path.replace(/\.(sw|dg)$/, `.${lang}`));
}

function withText<T extends ArticleData>(a: T, path: string, text: string): T {
  let m = TOP.exec(path);
  if (m) return { ...a, [m[1]]: { ...(a[m[1] as 'title' | 'subtitle'] ?? {}), [m[2]]: text } };
  m = BLOCK.exec(path);
  if (m) {
    const key = m[1] as 'blocks' | 'meta';
    const list = (a[key] ?? []) as { id: string }[];
    return { ...a, [key]: list.map((x) => (x.id === m![2] ? { ...x, [m![3]]: text } : x)) };
  }
  m = EVENT.exec(path)!;
  return {
    ...a,
    events: (a.events ?? []).map((e) => (e.id === m![1] ? { ...e, [m![2]]: { ...(e[m![2] as 'title' | 'description'] ?? {}), [m![3]]: text } } : e)),
  };
}

/** The file's keys in their usual order, with provenance last and only when it has entries. */
function tidy<T extends ArticleData>(a: T, provenance: Provenance | undefined): T {
  const { provenance: _p, ...rest } = a;
  return (provenance && Object.keys(provenance).length ? { ...rest, provenance } : rest) as T;
}

export function applyArticle<T extends ArticleData>(a: T, change: Change): T {
  if (hasChange(a.provenance, change.contribution_id)) return a;
  const path = change.target_path ?? '';
  const base = (change.base?.value as { text?: string } | undefined)?.text;
  if (/\.en$/.test(path) || base === undefined || articleText(a, path) !== base) throw new ConflictError(change.contribution_id, path);
  return tidy(withText(a, path, String(change.final_payload.proposed)), withProvenance(a.provenance, path, change));
}

export function unapplyArticle<T extends ArticleData>(a: T, change: Change): T {
  if (!hasChange(a.provenance, change.contribution_id)) return a;
  const path = change.target_path ?? '';
  if (articleText(a, path) !== String(change.final_payload.proposed)) throw new ConflictError(change.contribution_id, path);
  const base = String((change.base?.value as { text?: string }).text);
  return tidy(withText(a, path, base), withoutProvenance(a.provenance, change.contribution_id));
}

/** Live fixes for one article (target_type 'article', target_id = its id), in review order. */
export function applyAllToArticle<T extends ArticleData>(a: T, articleId: string, changes: Change[], onConflict?: (e: ConflictError) => void): T {
  return changes
    .filter((c) => c.type === 'translation_fix' && c.target_type === 'article' && c.target_id === articleId)
    .reduce((acc, c) => {
      try {
        return applyArticle(acc, c);
      } catch (e) {
        if (e instanceof ConflictError) {
          onConflict?.(e);
          return acc;
        }
        throw e;
      }
    }, a);
}
