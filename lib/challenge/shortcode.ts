const ALPHABET = '23456789abcdefghjkmnpqrstuvwxyz'; // 29 chars — no 0/1/i/l/o (ambiguous)
const LIMIT = 256 - (256 % ALPHABET.length); // rejection sampling to eliminate modulo bias

export function generateShortCode(length = 6): string {
  const result: string[] = [];
  while (result.length < length) {
    const bytes = crypto.getRandomValues(new Uint8Array(length - result.length + 4));
    for (const b of bytes) {
      if (b < LIMIT && result.length < length) {
        result.push(ALPHABET[b % ALPHABET.length]);
      }
    }
  }
  return result.join('');
}
