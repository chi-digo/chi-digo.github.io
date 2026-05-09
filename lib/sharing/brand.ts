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

export function drawBrandBar(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  color: string,
  secondaryColor: string
) {
  const markSize = 40;
  const gap = 14;
  const nameFont = '600 24px Fraunces, serif';
  const urlFont = '400 16px Inter, sans-serif';

  ctx.save();

  ctx.font = nameFont;
  const nameW = ctx.measureText('Chidigo').width;
  const totalW = markSize + gap + nameW;
  const startX = centerX - totalW / 2;

  drawBrandMark(ctx, startX, centerY - markSize / 2, markSize, color, 1);

  const textX = startX + markSize + gap;

  ctx.textAlign = 'left';

  ctx.fillStyle = color;
  ctx.font = nameFont;
  ctx.textBaseline = 'bottom';
  ctx.fillText('Chidigo', textX, centerY - 1);

  ctx.fillStyle = secondaryColor;
  ctx.font = urlFont;
  ctx.textBaseline = 'top';
  ctx.fillText('chidigo.org', textX, centerY + 7);

  ctx.restore();
}
