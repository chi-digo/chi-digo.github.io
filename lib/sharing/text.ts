export function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export function fitFontSize(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxHeight: number,
  fontFamily: string,
  fontWeight: string,
  sizes: number[],
  lineHeightRatio = 1.4
): { fontSize: number; lines: string[] } {
  for (const size of sizes) {
    ctx.font = `${fontWeight} ${size}px ${fontFamily}`;
    const lines = wrapText(ctx, text, maxWidth);
    const totalHeight = lines.length * size * lineHeightRatio;
    if (totalHeight <= maxHeight) {
      return { fontSize: size, lines };
    }
  }
  const smallest = sizes[sizes.length - 1];
  ctx.font = `${fontWeight} ${smallest}px ${fontFamily}`;
  return { fontSize: smallest, lines: wrapText(ctx, text, maxWidth) };
}
