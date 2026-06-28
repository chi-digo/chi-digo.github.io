export type PatternDrawFn = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  color: string,
) => void;

export function drawSunburst(ctx: CanvasRenderingContext2D, w: number, h: number, color: string) {
  const cx = w / 2;
  const cy = h / 2;
  const r = Math.min(w, h) * 0.45;
  const rays = 12;

  ctx.fillStyle = color;
  for (let i = 0; i < rays; i++) {
    const a1 = (i / rays) * Math.PI * 2;
    const a2 = ((i + 0.35) / rays) * Math.PI * 2;

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(a1) * r, cy + Math.sin(a1) * r);
    ctx.lineTo(cx + Math.cos(a2) * r, cy + Math.sin(a2) * r);
    ctx.closePath();
    ctx.fill();
  }
}

export function drawGeometricGrid(ctx: CanvasRenderingContext2D, w: number, h: number, color: string) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;

  const step = w / 4;
  for (let x = 0; x <= w; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = 0; y <= h; y += step) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  for (let x = 0; x < w; x += step) {
    for (let y = 0; y < h; y += step) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + step, y + step);
      ctx.stroke();
    }
  }
}

export function drawPaisley(ctx: CanvasRenderingContext2D, w: number, h: number, color: string) {
  const cx = w / 2;
  const cy = h / 2;
  const s = Math.min(w, h) * 0.35;

  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.lineCap = 'round';

  ctx.beginPath();
  ctx.moveTo(cx, cy - s);
  ctx.bezierCurveTo(cx + s * 1.5, cy - s, cx + s, cy + s * 0.5, cx, cy + s);
  ctx.bezierCurveTo(cx - s * 0.5, cy + s * 0.5, cx - s * 0.5, cy - s * 0.3, cx, cy - s);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(cx + s * 0.2, cy - s * 0.1, s * 0.15, 0, Math.PI * 2);
  ctx.stroke();
}

export const PATTERNS: Record<string, { draw: PatternDrawFn; label: string }> = {
  sunburst: { draw: drawSunburst, label: 'Sunburst' },
  geometric: { draw: drawGeometricGrid, label: 'Geometric' },
  paisley: { draw: drawPaisley, label: 'Paisley' },
  solid: { draw: () => {}, label: 'Solid Color' },
};

export const PATTERN_KEYS = Object.keys(PATTERNS);

export function createMjiPattern(
  ctx: CanvasRenderingContext2D,
  patternKey: string,
  tileSize: number,
  fg: string,
  bg: string,
): CanvasPattern | null {
  if (patternKey === 'solid') return null;

  const tile = document.createElement('canvas');
  tile.width = tileSize;
  tile.height = tileSize;
  const tileCtx = tile.getContext('2d')!;

  tileCtx.fillStyle = bg;
  tileCtx.fillRect(0, 0, tileSize, tileSize);

  PATTERNS[patternKey].draw(tileCtx, tileSize, tileSize, fg);
  return ctx.createPattern(tile, 'repeat')!;
}
