import type { GlossaryTerm, Plant, PlantStub } from './types';

const cache = new Map<string, unknown>();

async function fetchJson<T>(path: string): Promise<T> {
  const cached = cache.get(path);
  if (cached) return cached as T;
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
  const data: T = await res.json();
  cache.set(path, data);
  return data;
}

// Same Digo letter keys as the proverbs and dictionary (multigraphs first).
const DIGO_PREFIXES = [
  'gbw', 'kpw', 'ndz', "ng'", 'ch', 'dz', "m'", 'ng', 'ph', 'sh', 'ts',
  'a', 'b', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm',
  'n', 'o', 'p', 'r', 's', 't', 'u', 'v', 'w', 'y', 'z',
];

export function digoLetterKey(text: string): string {
  const lc = text.toLowerCase().trim().replace(/[’‘]/g, "'");
  for (const prefix of DIGO_PREFIXES) {
    if (lc.startsWith(prefix)) return prefix;
  }
  return lc.charAt(0);
}

export async function loadPlants(): Promise<PlantStub[]> {
  return fetchJson<PlantStub[]>('/data/plants/index.json');
}

export async function getPlant(slug: string): Promise<Plant | null> {
  try {
    return await fetchJson<Plant>(`/data/plants/p/${encodeURIComponent(slug)}.json`);
  } catch {
    return null;
  }
}

export async function loadGlossary(): Promise<GlossaryTerm[]> {
  return fetchJson<GlossaryTerm[]>('/data/plants/glossary.json');
}

/** Alphabetical by Digo headword; plants with no Digo name sort last (spec 33 §6). */
export function sortPlants(plants: PlantStub[]): PlantStub[] {
  return [...plants].sort((a, b) => {
    if (!a.digo_headword !== !b.digo_headword) return a.digo_headword ? -1 : 1;
    return (a.digo_headword || a.english || '').localeCompare(b.digo_headword || b.english || '');
  });
}

export async function getPlantsByTheme(theme: string): Promise<PlantStub[]> {
  return sortPlants((await loadPlants()).filter((p) => p.themes.includes(theme)));
}

export async function getPlantsByLetter(letter: string): Promise<PlantStub[]> {
  const target = digoLetterKey(letter);
  return sortPlants((await loadPlants()).filter((p) => p.digo_headword && digoLetterKey(p.digo_headword) === target));
}

export async function getThemeCounts(): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};
  for (const p of await loadPlants()) {
    for (const t of p.themes) counts[t] = (counts[t] || 0) + 1;
  }
  return counts;
}

export async function getLettersWithPlants(): Promise<Set<string>> {
  const set = new Set<string>();
  for (const p of await loadPlants()) {
    if (p.digo_headword) set.add(digoLetterKey(p.digo_headword));
  }
  return set;
}

/** Plants whose Digo name is missing or disputed: the "Help name these plants" list (spec 34 §4.1). */
export async function getNamesWanted(): Promise<PlantStub[]> {
  return (await loadPlants()).filter((p) => p.name_status === 'missing' || p.name_status === 'conflict');
}
