export type MotifDrawFn = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  color: string
) => void;

const TWO_PI = Math.PI * 2;

export function drawDiamondChain(ctx: CanvasRenderingContext2D, w: number, h: number, color: string) {
  const cx = w / 2;
  const cy = h / 2;
  const dx = w * 0.4;
  const dy = h * 0.4;

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(cx, cy - dy);
  ctx.lineTo(cx + dx, cy);
  ctx.lineTo(cx, cy + dy);
  ctx.lineTo(cx - dx, cy);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  const ox = dx * 0.5;
  const oy = dy * 0.5;
  ctx.strokeRect(cx - ox, cy - oy, ox * 2, oy * 2);
}

export function drawMikekaTile(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  color: string
) {
  const hw = width / 2;
  const hh = height / 2;

  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;

  // Top chevron (filled)
  ctx.beginPath();
  ctx.moveTo(0, hh);
  ctx.lineTo(hw, 0);
  ctx.lineTo(width, hh);
  ctx.closePath();
  ctx.fill();

  // Bottom chevron (outlined)
  ctx.beginPath();
  ctx.moveTo(0, hh);
  ctx.lineTo(hw, height);
  ctx.lineTo(width, hh);
  ctx.closePath();
  ctx.stroke();
}

export function drawDoorFrameTile(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  color: string
) {
  const pad = 4;
  const innerW = width - pad * 2;
  const innerH = height - pad * 2;
  const cx = width / 2;
  const cy = height / 2;

  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 1.5;

  // Outer rectangle
  ctx.strokeRect(pad, pad, innerW, innerH);

  // Inner diamond
  const dw = innerW * 0.35;
  const dh = innerH * 0.35;
  ctx.beginPath();
  ctx.moveTo(cx, cy - dh);
  ctx.lineTo(cx + dw, cy);
  ctx.lineTo(cx, cy + dh);
  ctx.lineTo(cx - dw, cy);
  ctx.closePath();
  ctx.fill();
}

export function drawVigangoTile(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  color: string
) {
  const pad = 2;
  const cx = width / 2;

  ctx.fillStyle = color;

  // Left triangle (pointing right)
  ctx.beginPath();
  ctx.moveTo(pad, pad);
  ctx.lineTo(cx, height / 2);
  ctx.lineTo(pad, height - pad);
  ctx.closePath();
  ctx.fill();

  // Right triangle (pointing left)
  ctx.beginPath();
  ctx.moveTo(width - pad, pad);
  ctx.lineTo(cx, height / 2);
  ctx.lineTo(width - pad, height - pad);
  ctx.closePath();
  ctx.fill();
}

export function drawMedallion(ctx: CanvasRenderingContext2D, w: number, h: number, color: string) {
  const cx = w / 2;
  const cy = h / 2;
  const r = Math.min(w, h) * 0.38;

  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;

  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, TWO_PI);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.6, 0, TWO_PI);
  ctx.stroke();

  ctx.fillStyle = color;
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * TWO_PI;
    const px = cx + Math.cos(angle) * r * 0.78;
    const py = cy + Math.sin(angle) * r * 0.78;
    ctx.beginPath();
    ctx.arc(px, py, r * 0.08, 0, TWO_PI);
    ctx.fill();
  }
}

export function drawKorosho(ctx: CanvasRenderingContext2D, w: number, h: number, color: string) {
  const cx = w / 2;
  const cy = h / 2;
  const r = Math.min(w, h) * 0.35;

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(cx, cy - r);
  ctx.bezierCurveTo(cx + r * 1.2, cy - r * 0.6, cx + r * 0.8, cy + r * 0.8, cx, cy + r);
  ctx.bezierCurveTo(cx - r * 0.8, cy + r * 0.8, cx - r * 1.2, cy - r * 0.6, cx, cy - r);
  ctx.closePath();
  ctx.fill();
}

export function drawKnots(ctx: CanvasRenderingContext2D, w: number, h: number, color: string) {
  const cx = w / 2;
  const cy = h / 2;
  const s = Math.min(w, h) * 0.3;

  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';

  ctx.beginPath();
  ctx.arc(cx - s * 0.3, cy, s, -Math.PI * 0.5, Math.PI * 0.5);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(cx + s * 0.3, cy, s, Math.PI * 0.5, -Math.PI * 0.5);
  ctx.stroke();
}

export const MOTIFS: Record<string, { draw: MotifDrawFn; label: string }> = {
  diamond_chain: { draw: drawDiamondChain, label: 'Diamond Chain' },
  mikeka: { draw: drawMikekaTile, label: 'Mikeka' },
  door_frame: { draw: drawDoorFrameTile, label: 'Door Frame' },
  medallion: { draw: drawMedallion, label: 'Medallion' },
  korosho: { draw: drawKorosho, label: 'Korosho' },
  knots: { draw: drawKnots, label: 'Knots' },
};

export const MOTIF_KEYS = Object.keys(MOTIFS);

export function createKangaMotifPattern(
  ctx: CanvasRenderingContext2D,
  motifKey: string,
  tileSize: number,
  fg: string,
  bg: string,
): CanvasPattern {
  const tile = document.createElement('canvas');
  tile.width = tileSize;
  tile.height = tileSize;
  const tileCtx = tile.getContext('2d')!;
  tileCtx.fillStyle = bg;
  tileCtx.fillRect(0, 0, tileSize, tileSize);
  MOTIFS[motifKey].draw(tileCtx, tileSize, tileSize, fg);
  return ctx.createPattern(tile, 'repeat')!;
}

export function createMotifPattern(
  ctx: CanvasRenderingContext2D,
  drawTile: (tileCtx: CanvasRenderingContext2D, w: number, h: number, color: string) => void,
  tileWidth: number,
  tileHeight: number,
  color: string
): CanvasPattern {
  const tile = document.createElement('canvas');
  tile.width = tileWidth;
  tile.height = tileHeight;
  const tileCtx = tile.getContext('2d')!;
  drawTile(tileCtx, tileWidth, tileHeight, color);
  return ctx.createPattern(tile, 'repeat')!;
}
