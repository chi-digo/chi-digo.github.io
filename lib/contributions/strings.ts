/** String helpers shared by the browser and the server, with no dependencies (kept out of zod's way). */

/**
 * A comparison key for Digo words: case, apostrophe variants, ng'/ng and dz/z differences ignored.
 * Used only to spot likely duplicates; the stored text is always what the contributor typed.
 */
export function normaliseDigo(s: string): string {
  return s
    .normalize('NFC')
    .toLocaleLowerCase('en')
    .replace(/[’ʼ‘`´]/g, "'")
    .replace(/ng'/g, 'ng')
    .replace(/dz/g, 'z')
    .replace(/[^a-z' ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Order-independent JSON, so the same value always hashes the same in the API and in fold-in. */
export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  const obj = value as Record<string, unknown>;
  return `{${Object.keys(obj)
    .filter((k) => obj[k] !== undefined)
    .sort()
    .map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`)
    .join(',')}}`;
}
