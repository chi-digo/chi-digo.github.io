/**
 * Fails the build when a message key exists in one language file but not another (spec 34
 * technical §7.4). The English fallback would otherwise hide the gap.
 *
 *   npm run check:i18n
 *
 * It also checks that placeholders ({name}) match English in every language.
 *
 * Empty strings are allowed only in namespaces that ship English-and-Swahili first (review), where
 * Digo falls back to English until a speaker checks it.
 */
import { readFileSync } from 'fs';
import { join } from 'path';

const DIR = join(process.cwd(), 'lib/i18n/messages');
const LANGS = ['en', 'sw', 'dg'] as const;
const EMPTY_OK: Record<string, string[]> = { dg: ['review', 'admin'] };

type Tree = { [k: string]: string | Tree | string[] };

function keys(tree: Tree, prefix = ''): Map<string, unknown> {
  const out = new Map<string, unknown>();
  for (const [k, v] of Object.entries(tree)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) for (const [p, x] of keys(v as Tree, path)) out.set(p, x);
    else out.set(path, v);
  }
  return out;
}

const files = Object.fromEntries(LANGS.map((l) => [l, keys(JSON.parse(readFileSync(join(DIR, `${l}.json`), 'utf-8')))]));
const all = new Set(LANGS.flatMap((l) => [...files[l].keys()]));
const problems: string[] = [];
for (const key of all) {
  for (const lang of LANGS) {
    if (!files[lang].has(key)) problems.push(`${lang}.json is missing ${key}`);
    else if (files[lang].get(key) === '' && !(EMPTY_OK[lang] ?? []).includes(key.split('.')[0])) {
      problems.push(`${lang}.json has an empty ${key}`);
    }
  }
}

// Placeholders ({name}, {count}…) must be the same in every language, or a translation drops or
// invents a value. Digo-term markers ({dig:…}) may differ, but only {dig:…} is rendered.
const placeholders = (v: unknown) => (typeof v === 'string' ? [...v.matchAll(/\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g)].map((m) => m[1]).sort().join(',') : '');
for (const key of all) {
  const en = placeholders(files.en.get(key));
  for (const lang of LANGS) {
    const v = files[lang].get(key);
    if (lang === 'en' || v === '' || v === undefined) continue;
    if (placeholders(v) !== en) problems.push(`${lang}.json ${key}: placeholders {${placeholders(v)}} differ from en {${en}}`);
    if (typeof v === 'string' && /\{dg:/.test(v)) problems.push(`${lang}.json ${key}: use {dig:…}, not {dg:…}`);
  }
}

if (problems.length) {
  for (const p of problems.slice(0, 50)) console.error(`error: ${p}`);
  console.error(`\n${problems.length} i18n gap(s).`);
  process.exit(1);
}
console.log(`i18n: ${all.size} keys in ${LANGS.join(', ')}, all present`);
