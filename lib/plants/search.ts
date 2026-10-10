import type { GroupedPlantResults, PlantStub } from './types';
import { loadPlants } from './loader';

const MAX_RESULTS = 30;
const MAX_DROPDOWN = 6;

// Fold Digo spelling variants so "mkwadzu" finds "mkpwadzu" and "mpingo" finds "mphingo".
function fold(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[’‘']/g, '')
    .replace(/kpw/g, 'kw')
    .replace(/gbw/g, 'gw')
    .replace(/ph/g, 'p')
    .trim();
}

function empty(): GroupedPlantResults {
  return { dg: [], sw: [], en: [], sci: [], total: 0 };
}

function has(value: string | null | undefined, q: string): boolean {
  return !!value && fold(value).includes(q);
}

export async function searchPlants(query: string): Promise<GroupedPlantResults> {
  const q = fold(query || '');
  if (!q) return empty();
  let plants: PlantStub[];
  try {
    plants = await loadPlants();
  } catch {
    return empty();
  }
  const out = empty();
  for (const p of plants) {
    if (out.dg.length + out.sw.length + out.en.length + out.sci.length >= MAX_RESULTS) break;
    if (has(p.digo_headword, q) || p.digo_alt.some((n) => has(n, q))) out.dg.push(p);
    else if (has(p.swahili, q)) out.sw.push(p);
    else if (has(p.english, q)) out.en.push(p);
    else if (has(p.scientific, q) || has(p.family, q) || p.search_terms.some((t) => has(t, q))) out.sci.push(p);
  }
  out.total = out.dg.length + out.sw.length + out.en.length + out.sci.length;
  return out;
}

export async function searchPlantsDropdown(query: string): Promise<GroupedPlantResults> {
  if (!query || query.trim().length < 2) return empty();
  const full = await searchPlants(query);
  const trimmed = empty();
  let remaining = MAX_DROPDOWN;
  for (const group of ['dg', 'sw', 'en', 'sci'] as const) {
    trimmed[group] = full[group].slice(0, remaining);
    remaining -= trimmed[group].length;
    if (remaining <= 0) break;
  }
  trimmed.total = trimmed.dg.length + trimmed.sw.length + trimmed.en.length + trimmed.sci.length;
  return trimmed;
}
