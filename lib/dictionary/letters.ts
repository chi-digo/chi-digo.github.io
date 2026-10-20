/**
 * Which letter file a Digo headword or sort key lives in. Pure (no browser code), so the app and
 * scripts/dictionary/build-index.ts share one rule (spec 34 §15.1, invariant 3).
 */
export const DIGO_PREFIXES = [
  "gbw", "kpw", "ndz", "ng'", "ch", "dz", "m'", "ng", "ph", "sh", "ts",
  "a", "b", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m",
  "n", "o", "p", "r", "s", "t", "u", "v", "w", "y", "z",
];

/** The letter file for a headword or sort key. A leading "-" (affixes such as -ako) is ignored, as in sort_key (ISSUES DATA-3). */
export function digoLetterFile(letter: string): string {
  const lc = letter.toLowerCase().replace(/’/g, "'").replace(/^-/, "");
  for (const prefix of DIGO_PREFIXES) {
    if (lc.startsWith(prefix)) {
      return prefix.replace(/'/g, "_");
    }
  }
  return lc.charAt(0);
}
