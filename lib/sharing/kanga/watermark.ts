function sampleLuminance(ctx: CanvasRenderingContext2D, x: number, y: number): number {
  const [r, g, b] = ctx.getImageData(x, y, 1, 1).data;
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

export function drawWatermark(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
) {
  const lum = sampleLuminance(ctx, Math.round(width / 2), Math.round(height / 2));
  const color = lum > 0.5 ? '#000' : '#fff';

  ctx.save();
  ctx.globalAlpha = 0.5;
  const fontSize = Math.round(width * 0.06);
  ctx.font = `600 ${fontSize}px Inter, system-ui, -apple-system, sans-serif`;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('chidigo.org', width / 2, height / 2);
  ctx.restore();
}
