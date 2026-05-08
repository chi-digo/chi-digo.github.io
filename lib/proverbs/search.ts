import type { Proverb, GroupedProverbResults } from './types';
import { loadProverbs } from './loader';

const MAX_RESULTS = 20;
const MAX_DROPDOWN = 6;

function normalize(text: string): string {
  return text.toLowerCase().trim();
}

function matchesDigo(proverb: Proverb, query: string): boolean {
  return normalize(proverb.digo).includes(query);
}

function matchesEnglish(proverb: Proverb, query: string): boolean {
  if (normalize(proverb.literal_en).includes(query)) return true;
  if (normalize(proverb.idiomatic_en).includes(query)) return true;
  if (normalize(proverb.commentary_en).includes(query)) return true;
  if (normalize(proverb.english_equivalent).includes(query)) return true;
  if (proverb.keywords_en.some((k) => normalize(k).includes(query))) return true;
  return false;
}

function matchesSwahili(proverb: Proverb, query: string): boolean {
  if (normalize(proverb.swahili).includes(query)) return true;
  if (normalize(proverb.literal_sw).includes(query)) return true;
  if (normalize(proverb.idiomatic_sw).includes(query)) return true;
  if (normalize(proverb.commentary_sw).includes(query)) return true;
  if (normalize(proverb.swahili_equivalent).includes(query)) return true;
  if (proverb.keywords_sw.some((k) => normalize(k).includes(query))) return true;
  return false;
}

function emptyResults(): GroupedProverbResults {
  return { dg: [], en: [], sw: [], total: 0 };
}

export async function searchProverbs(
  query: string,
): Promise<GroupedProverbResults> {
  if (!query || query.trim().length === 0) return emptyResults();

  const q = normalize(query);
  let proverbs: Proverb[];
  try {
    proverbs = await loadProverbs();
  } catch {
    return emptyResults();
  }

  const dg: Proverb[] = [];
  const en: Proverb[] = [];
  const sw: Proverb[] = [];
  const seen = new Set<string>();

  for (const p of proverbs) {
    if (dg.length + en.length + sw.length >= MAX_RESULTS) break;

    if (matchesDigo(p, q) && !seen.has(p.id)) {
      seen.add(p.id);
      dg.push(p);
    } else if (matchesEnglish(p, q) && !seen.has(p.id)) {
      seen.add(p.id);
      en.push(p);
    } else if (matchesSwahili(p, q) && !seen.has(p.id)) {
      seen.add(p.id);
      sw.push(p);
    }
  }

  return {
    dg,
    en,
    sw,
    total: dg.length + en.length + sw.length,
  };
}

export async function searchProverbsDropdown(
  query: string,
): Promise<GroupedProverbResults> {
  if (!query || query.trim().length < 2) return emptyResults();

  const full = await searchProverbs(query);

  // Trim to MAX_DROPDOWN total, preserving the language grouping order
  const trimmed: GroupedProverbResults = { dg: [], en: [], sw: [], total: 0 };
  let remaining = MAX_DROPDOWN;

  for (const lang of ['dg', 'en', 'sw'] as const) {
    const take = Math.min(full[lang].length, remaining);
    trimmed[lang] = full[lang].slice(0, take);
    remaining -= take;
    if (remaining <= 0) break;
  }

  trimmed.total = trimmed.dg.length + trimmed.en.length + trimmed.sw.length;
  return trimmed;
}
