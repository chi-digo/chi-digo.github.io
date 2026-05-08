import type { Proverb } from './types';

const cache = new Map<string, unknown>();

const DIGO_PREFIXES = [
  'gbw', 'kpw', 'ndz', "ng'", 'ch', 'dz', "m'", 'ng', 'ph', 'sh', 'ts',
  'a', 'b', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm',
  'n', 'o', 'p', 'r', 's', 't', 'u', 'v', 'w', 'y', 'z',
];

function digoLetterKey(text: string): string {
  const lc = text.toLowerCase().trim();
  for (const prefix of DIGO_PREFIXES) {
    if (lc.startsWith(prefix)) {
      return prefix.replace(/'/g, '_');
    }
  }
  return lc.charAt(0);
}

async function fetchJson<T>(path: string): Promise<T> {
  const cached = cache.get(path);
  if (cached) return cached as T;

  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
  const data: T = await res.json();
  cache.set(path, data);
  return data;
}

export async function loadProverbs(): Promise<Proverb[]> {
  return fetchJson<Proverb[]>('/data/proverbs/index.json');
}

export async function getProverbById(id: string): Promise<Proverb | null> {
  const proverbs = await loadProverbs();
  return proverbs.find((p) => p.id === id) ?? null;
}

export async function getProverbBySlug(slug: string): Promise<Proverb | null> {
  const proverbs = await loadProverbs();
  return proverbs.find((p) => p.slug === slug) ?? null;
}

export async function getProverbsByTheme(theme: string): Promise<Proverb[]> {
  const proverbs = await loadProverbs();
  return proverbs.filter((p) => p.themes.includes(theme));
}

export async function getProverbsByLetter(letter: string): Promise<Proverb[]> {
  const proverbs = await loadProverbs();
  const target = digoLetterKey(letter);
  return proverbs.filter((p) => {
    const key = digoLetterKey(p.digo);
    return key === target;
  });
}

export async function getAllThemeCounts(): Promise<Record<string, number>> {
  const proverbs = await loadProverbs();
  const counts: Record<string, number> = {};
  for (const p of proverbs) {
    for (const theme of p.themes) {
      counts[theme] = (counts[theme] || 0) + 1;
    }
  }
  return counts;
}

export function clearCache(): void {
  cache.clear();
}
