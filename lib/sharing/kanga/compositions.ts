import type { Palette } from './palettes';
import { MOTIFS, createKangaMotifPattern } from '../motifs';
import { createMjiPattern } from './patterns';

export type MjiComposition =
  | 'grid_repeat'
  | 'central_medallion'
  | 'scattered'
  | 'horizontal_bands'
  | 'solid';

export const COMPOSITION_KEYS: MjiComposition[] = [
  'grid_repeat',
  'central_medallion',
  'scattered',
  'horizontal_bands',
  'solid',
];

interface MjiRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function drawComposition(
  ctx: CanvasRenderingContext2D,
  composition: MjiComposition,
  mji: MjiRect,
  motifKey: string,
  palette: Palette,
) {
  switch (composition) {
    case 'grid_repeat':
      drawGridRepeat(ctx, mji, motifKey, palette);
      break;
    case 'central_medallion':
      drawCentralMedallion(ctx, mji, motifKey, palette);
      break;
    case 'scattered':
      drawScattered(ctx, mji, motifKey, palette);
      break;
    case 'horizontal_bands':
      drawHorizontalBands(ctx, mji, motifKey, palette);
      break;
    case 'solid':
      break;
  }
}

function drawGridRepeat(
  ctx: CanvasRenderingContext2D,
  mji: MjiRect,
  motifKey: string,
  palette: Palette,
) {
  const tileSize = Math.round(Math.min(mji.w, mji.h) * 0.08);
  const pattern = createMjiPattern(ctx, motifKey, tileSize, palette.mjiFg, palette.mjiBg);
  if (pattern) {
    ctx.fillStyle = pattern;
    ctx.fillRect(mji.x, mji.y, mji.w, mji.h);
  }
}

function drawCentralMedallion(
  ctx: CanvasRenderingContext2D,
  mji: MjiRect,
  motifKey: string,
  palette: Palette,
) {
  const cx = mji.x + mji.w / 2;
  const cy = mji.y + mji.h * 0.45;
  const mainR = Math.min(mji.w, mji.h) * 0.28;
  const satSize = Math.min(mji.w, mji.h) * 0.14;
  const motif = MOTIFS[motifKey];
  if (!motif) return;

  ctx.save();
  ctx.globalAlpha = 0.12;
  const bgTile = Math.round(Math.min(mji.w, mji.h) * 0.04);
  const dotPattern = createDotPattern(ctx, bgTile, palette.mjiFg);
  if (dotPattern) {
    ctx.fillStyle = dotPattern;
    ctx.fillRect(mji.x, mji.y, mji.w, mji.h);
  }
  ctx.restore();

  ctx.fillStyle = palette.mjiBg;
  ctx.beginPath();
  ctx.arc(cx, cy, mainR, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = palette.accent;
  ctx.lineWidth = Math.max(2, mainR * 0.04);
  ctx.beginPath();
  ctx.arc(cx, cy, mainR, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = palette.mjiFg;
  ctx.lineWidth = Math.max(1, mainR * 0.02);
  ctx.beginPath();
  ctx.arc(cx, cy, mainR * 0.85, 0, Math.PI * 2);
  ctx.stroke();

  const motifSize = mainR * 1.4;

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, mainR * 0.8, 0, Math.PI * 2);
  ctx.clip();
  const mOffX = cx - motifSize / 2;
  const mOffY = cy - motifSize / 2;
  ctx.translate(mOffX, mOffY);
  motif.draw(ctx, motifSize, motifSize, palette.accent);
  ctx.restore();

  const insetX = mji.w * 0.18;
  const insetY = mji.h * 0.18;
  const satellites = [
    { x: mji.x + insetX, y: mji.y + insetY },
    { x: mji.x + mji.w - insetX, y: mji.y + insetY },
    { x: mji.x + insetX, y: mji.y + mji.h * 0.72 },
    { x: mji.x + mji.w - insetX, y: mji.y + mji.h * 0.72 },
  ];

  for (const sat of satellites) {
    ctx.save();
    ctx.translate(sat.x - satSize / 2, sat.y - satSize / 2);
    motif.draw(ctx, satSize, satSize, palette.mjiFg);
    ctx.restore();
  }
}

function drawScattered(
  ctx: CanvasRenderingContext2D,
  mji: MjiRect,
  motifKey: string,
  palette: Palette,
) {
  const motif = MOTIFS[motifKey];
  if (!motif) return;

  const motifSize = Math.min(mji.w, mji.h) * 0.2;

  const positions = [
    { x: 0.25, y: 0.22 },
    { x: 0.70, y: 0.18 },
    { x: 0.48, y: 0.42 },
    { x: 0.18, y: 0.55 },
    { x: 0.75, y: 0.52 },
    { x: 0.35, y: 0.72 },
    { x: 0.62, y: 0.70 },
  ];

  for (const pos of positions) {
    const px = mji.x + mji.w * pos.x - motifSize / 2;
    const py = mji.y + mji.h * pos.y - motifSize / 2;
    ctx.save();
    ctx.translate(px, py);
    motif.draw(ctx, motifSize, motifSize, palette.mjiFg);
    ctx.restore();
  }
}

function drawHorizontalBands(
  ctx: CanvasRenderingContext2D,
  mji: MjiRect,
  motifKey: string,
  palette: Palette,
) {
  const bandCount = 5;
  const bandH = mji.h / bandCount;
  const motif = MOTIFS[motifKey];

  ctx.save();
  ctx.beginPath();
  ctx.rect(mji.x, mji.y, mji.w, mji.h);
  ctx.clip();

  for (let i = 0; i < bandCount; i++) {
    const by = mji.y + i * bandH;
    const isAccent = i % 2 === 1;

    if (isAccent) {
      ctx.fillStyle = palette.accent;
      ctx.fillRect(mji.x, by, mji.w, bandH);

      if (motif) {
        const motifSize = Math.round(bandH * 0.6);
        const gap = motifSize * 0.4;
        const cellSize = motifSize + gap;
        const tileCount = Math.floor(mji.w / cellSize);
        const totalUsed = tileCount * cellSize - gap;
        const offsetX = mji.x + (mji.w - totalUsed) / 2;
        for (let t = 0; t < tileCount; t++) {
          ctx.save();
          ctx.translate(offsetX + t * cellSize, by + (bandH - motifSize) / 2);
          motif.draw(ctx, motifSize, motifSize, palette.mjiBg);
          ctx.restore();
        }
      }
    } else {
      ctx.save();
      ctx.globalAlpha = 0.2;
      const dotTile = Math.round(bandH * 0.3);
      const dots = createDotPattern(ctx, dotTile, palette.mjiFg);
      if (dots) {
        ctx.fillStyle = dots;
        ctx.fillRect(mji.x, by, mji.w, bandH);
      }
      ctx.restore();
    }

    if (i > 0) {
      ctx.strokeStyle = palette.accent;
      ctx.lineWidth = Math.max(1, mji.h * 0.002);
      ctx.beginPath();
      ctx.moveTo(mji.x, by);
      ctx.lineTo(mji.x + mji.w, by);
      ctx.stroke();
    }
  }

  ctx.restore();
}

function createDotPattern(
  ctx: CanvasRenderingContext2D,
  tileSize: number,
  color: string,
): CanvasPattern | null {
  const tile = document.createElement('canvas');
  tile.width = tileSize;
  tile.height = tileSize;
  const tCtx = tile.getContext('2d');
  if (!tCtx) return null;

  const r = Math.max(1, tileSize * 0.12);
  tCtx.fillStyle = color;
  tCtx.beginPath();
  tCtx.arc(tileSize / 2, tileSize / 2, r, 0, Math.PI * 2);
  tCtx.fill();

  return ctx.createPattern(tile, 'repeat');
}
