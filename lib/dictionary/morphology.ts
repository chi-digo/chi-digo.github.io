const DIGO_PREFIXES = [
  "aka", "ala", "ana", "ari",
  "chi", "vi",
  "ka", "ku", "ki",
  "ma", "mi", "mu", "m'",
  "wa", "zi",
  "ha", "hu",
  "ni", "na",
  "ri",
];

const SORTED_PREFIXES = [...DIGO_PREFIXES].sort(
  (a, b) => b.length - a.length
);

export function stripPrefixes(word: string): string[] {
  const stems: string[] = [];
  const seen = new Set<string>();

  function strip(remaining: string, depth: number) {
    if (depth > 2 || remaining.length < 2) return;

    for (const prefix of SORTED_PREFIXES) {
      if (remaining.startsWith(prefix)) {
        const stem = remaining.slice(prefix.length);
        if (stem.length >= 2 && !seen.has(stem)) {
          seen.add(stem);
          stems.push(stem);
          strip(stem, depth + 1);
        }
      }
    }
  }

  strip(word.toLowerCase(), 0);
  return stems;
}
