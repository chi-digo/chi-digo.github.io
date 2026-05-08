import type { Proverb } from './types';

/**
 * Deterministic daily proverb selection.
 * Uses a simple hash of the date string (YYYY-MM-DD) plus the year
 * to produce a stable index that changes once per day.
 */
export function getFeaturedProverb(proverbs: Proverb[]): Proverb {
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
export function getRandomProverb(proverbs: Proverb[]): Proverb {
  if (proverbs.length === 0) {
    throw new Error('Cannot select a random proverb from an empty list');
  }

  const index = Math.floor(Math.random() * proverbs.length);
  return proverbs[index];
}
