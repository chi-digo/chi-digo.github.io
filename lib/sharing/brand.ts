export function drawBrandMark(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string,
  alpha: number
) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);

  const s = size / 32;
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.2 * s;

  // Head circle
  ctx.beginPath();
  ctx.arc(16 * s, 9 * s, 4 * s, 0, Math.PI * 2);
  ctx.fill();

  // Body rectangle (stroked)
  ctx.strokeRect(13 * s, 15 * s, 6 * s, 14 * s);

  // Upper triangle
  ctx.beginPath();
  ctx.moveTo(13 * s, 15 * s);
  ctx.lineTo(19 * s, 15 * s);
  ctx.lineTo(16 * s, 22 * s);
  ctx.closePath();
  ctx.fill();

  // Lower triangle
  ctx.beginPath();
  ctx.moveTo(13 * s, 29 * s);
  ctx.lineTo(19 * s, 29 * s);
  ctx.lineTo(16 * s, 22 * s);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

export function drawBrandFooter(
  ctx: CanvasRenderingContext2D,
  canvasSize: number,
  color: string,
  alpha: number
) {
  const padding = 40;
  const markSize = 24;
  const textGap = 8;

  drawBrandMark(ctx, padding, canvasSize - padding - markSize, markSize, color, alpha);

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.font = '400 14px Inter, sans-serif';
  ctx.textBaseline = 'middle';
  ctx.fillText(
    'chidigo.org',
    padding + markSize + textGap,
    canvasSize - padding - markSize / 2
  );
  ctx.restore();
}
