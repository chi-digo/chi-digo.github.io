import { PALETTES, type Palette } from './palettes';
import { createKangaMotifPattern } from '../motifs';
import { loadShareFonts } from '../fonts';
import { drawBrandFooterRect } from '../brand';

import { drawComposition, type MjiComposition } from './compositions';

export type { MjiComposition } from './compositions';

export interface KangaSpec {
  fumbo: string;
  palette: string;
  resolvedPalette?: Palette;
  pindoMotif: string;
  mjiComposition: MjiComposition;
  mjiMotif: string;
}

const LAYOUT = {
  pindoRatio: 0.15,
  transitionGap: 0.008,
  transitionLines: 3,
  fumboYRatio: 0.88,
  fumboWidthRatio: 0.50,
  fumboHeightRatio: 0.04,
} as const;

export async function renderKanga(
  canvas: HTMLCanvasElement,
  spec: KangaSpec,
): Promise<void> {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');

  const { width: w, height: h } = canvas;
  const palette = spec.resolvedPalette ?? PALETTES[spec.palette];
  if (!palette) throw new Error(`Unknown palette: ${spec.palette}`);

  await loadShareFonts();

  const pindoW = w * LAYOUT.pindoRatio;
  const pindoH = h * LAYOUT.pindoRatio;
  const transGap = w * LAYOUT.transitionGap;
  const mjiX = pindoW + transGap * (LAYOUT.transitionLines + 1);
  const mjiY = pindoH + transGap * (LAYOUT.transitionLines + 1);
  const mjiW = w - mjiX * 2;
  const mjiH = h - mjiY * 2;

  ctx.fillStyle = palette.pindoBg;
  ctx.fillRect(0, 0, w, h);

  const pindoTile = Math.max(16, Math.round(pindoW * 0.4));
  const pindoPattern = createKangaMotifPattern(ctx, spec.pindoMotif, pindoTile, palette.pindoFg, palette.pindoBg);
  ctx.fillStyle = pindoPattern;
  ctx.fillRect(0, 0, w, pindoH);
  ctx.fillRect(0, h - pindoH, w, pindoH);
  ctx.fillRect(0, pindoH, pindoW, h - pindoH * 2);
  ctx.fillRect(w - pindoW, pindoH, pindoW, h - pindoH * 2);

  drawTransitionLines(ctx, w, h, pindoW, pindoH, transGap, palette);

  ctx.fillStyle = palette.mjiBg;
  ctx.fillRect(mjiX, mjiY, mjiW, mjiH);

  drawComposition(ctx, spec.mjiComposition, { x: mjiX, y: mjiY, w: mjiW, h: mjiH }, spec.mjiMotif, palette);

  drawFumbo(ctx, w, h, spec.fumbo, palette);

  drawBrandFooterRect(ctx, w, h);
}

function drawTransitionLines(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  pindoW: number,
  pindoH: number,
  gap: number,
  palette: Palette,
) {
  const colors = [palette.accent, palette.pindoFg, palette.accent];
  const lineWidth = Math.max(1, w * 0.0015);

  for (let i = 0; i < LAYOUT.transitionLines; i++) {
    const offset = gap * (i + 1);
    const x = pindoW + offset;
    const y = pindoH + offset;
    const rw = w - x * 2;
    const rh = h - y * 2;

    ctx.strokeStyle = colors[i % colors.length];
    ctx.lineWidth = lineWidth;
    ctx.strokeRect(x, y, rw, rh);
  }
}

function drawFumbo(
  ctx: CanvasRenderingContext2D,
  kangaW: number,
  kangaH: number,
  text: string,
  palette: Palette,
) {
  if (!text.trim()) return;

  const boxW = kangaW * LAYOUT.fumboWidthRatio;
  const boxH = kangaH * LAYOUT.fumboHeightRatio;
  const boxX = (kangaW - boxW) / 2;
  const boxY = kangaH * LAYOUT.fumboYRatio;

  ctx.fillStyle = palette.fumboBoxBg;
  ctx.fillRect(boxX, boxY, boxW, boxH);

  ctx.strokeStyle = palette.accent;
  ctx.lineWidth = Math.max(1, kangaW * 0.001);
  ctx.strokeRect(boxX, boxY, boxW, boxH);

  const upperText = text.toUpperCase();
  const chars = upperText.split('');
  const maxTextW = boxW * 0.90;
  const maxFontSize = boxH * 0.55;
  const minFontSize = Math.max(8, boxH * 0.25);

  let fontSize = maxFontSize;
  let spacingRatio = 0.25;

  const measure = () => {
    ctx.font = `600 ${fontSize}px Inter, system-ui, sans-serif`;
    const spacing = fontSize * spacingRatio;
    let total = 0;
    for (const ch of chars) {
      total += ctx.measureText(ch).width + spacing;
    }
    return total - spacing;
  };

  while (measure() > maxTextW && fontSize > minFontSize) {
    fontSize -= 1;
  }

  if (measure() > maxTextW && spacingRatio > 0.1) {
    spacingRatio = 0.1;
  }

  let displayChars = chars;
  if (measure() > maxTextW) {
    displayChars = [...chars];
    while (displayChars.length > 3) {
      displayChars.pop();
      displayChars[displayChars.length - 1] = '.';
      displayChars.push('.', '.');
      ctx.font = `600 ${fontSize}px Inter, system-ui, sans-serif`;
      const spacing = fontSize * spacingRatio;
      let tw = 0;
      for (const ch of displayChars) {
        tw += ctx.measureText(ch).width + spacing;
      }
      tw -= spacing;
      if (tw <= maxTextW) break;
      displayChars = displayChars.slice(0, -3);
    }
  }

  ctx.font = `600 ${fontSize}px Inter, system-ui, sans-serif`;
  ctx.fillStyle = palette.fumboBoxText;
  ctx.textBaseline = 'middle';

  const spacing = fontSize * spacingRatio;
  let totalWidth = 0;
  for (const ch of displayChars) {
    totalWidth += ctx.measureText(ch).width + spacing;
  }
  totalWidth -= spacing;

  let cursorX = boxX + (boxW - totalWidth) / 2;
  const centerY = boxY + boxH / 2;

  for (const ch of displayChars) {
    ctx.fillText(ch, cursorX, centerY);
    cursorX += ctx.measureText(ch).width + spacing;
  }
}

export async function exportKanga(spec: KangaSpec): Promise<{
  highRes: Blob;
  social: Blob;
}> {
  const canvas = document.createElement('canvas');
  canvas.width = 3000;
  canvas.height = 2000;

  await renderKanga(canvas, spec);

  const highRes = await canvasToBlob(canvas);

  const socialCanvas = document.createElement('canvas');
  socialCanvas.width = 1080;
  socialCanvas.height = 1080;
  const sCtx = socialCanvas.getContext('2d')!;

  const sourceSize = Math.min(canvas.width, canvas.height);
  const sx = (canvas.width - sourceSize) / 2;
  const sy = canvas.height - sourceSize;
  sCtx.drawImage(canvas, sx, sy, sourceSize, sourceSize, 0, 0, 1080, 1080);

  const social = await canvasToBlob(socialCanvas);

  return { highRes, social };
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas toBlob failed'));
      },
      'image/png',
    );
  });
}
