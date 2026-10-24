import type { Proverb } from './types';

/**
 * Deterministic daily proverb selection.
 * Uses a simple hash of the date string (YYYY-MM-DD) plus the year
 * to produce a stable index that changes once per day.
 */
/** Featured and random picks use shipped, non-mature proverbs only, so they don't shift with the overlay (spec 34 §16.9). */
function eligible(proverbs: Proverb[]): Proverb[] {
  const ok = proverbs.filter((p) => !(p as { provisional?: boolean }).provisional && p.content_flag !== 'mature');
  return ok.length ? ok : proverbs;
}

export function getFeaturedProverb(all: Proverb[]): Proverb {
  const proverbs = eligible(all);
  if (proverbs.length === 0) {
    throw new Error('Cannot select a featured proverb from an empty list');
  }

  const today = new Date();
  const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const seed = `${dateStr}:${today.getFullYear()}`;

  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }

  const index = Math.abs(hash) % proverbs.length;
  return proverbs[index];
}

/**
 * Random proverb selection for "Discover another".
 * Uses Math.random for a non-deterministic pick.
 */
export function getRandomProverb(all: Proverb[]): Proverb {
  const proverbs = eligible(all);
  if (proverbs.length === 0) {
    throw new Error('Cannot select a random proverb from an empty list');
  }

  const index = Math.floor(Math.random() * proverbs.length);
  return proverbs[index];
}
