const SHARE_FONTS = [
  '500 48px Fraunces',
  '600 24px Fraunces',
  'italic 400 24px "Source Serif 4"',
  '400 14px Inter',
  '400 16px Inter',
  '500 18px Inter',
  '600 36px Inter',
];

export async function loadShareFonts(): Promise<boolean> {
  try {
    const loads = SHARE_FONTS.map((spec) => document.fonts.load(spec));
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Font load timeout')), 3000)
    );
    await Promise.race([Promise.all(loads), timeout]);
    await document.fonts.ready;
    return true;
  } catch {
    return false;
  }
}
