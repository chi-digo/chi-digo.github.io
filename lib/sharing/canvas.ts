import type { Proverb } from '@/lib/proverbs/types';
import type { DictionaryEntry } from '@/lib/dictionary/types';
import type { Locale } from '@/lib/i18n/config';
import { drawMikekaTile, drawDoorFrameTile, createMotifPattern } from './motifs';
import { fitFontSize, wrapText } from './text';
import { loadShareFonts } from './fonts';
import { drawBrandFooter } from './brand';

const SIZE = 1080;
const PADDING = 80;
const CONTENT_W = SIZE - PADDING * 2;
const RADIUS = 24;

const COLORS = {
  cream: '#F2EAD7',
  indigo: '#1F3A5F',
  gold: '#C99846',
};

function roundedRect(ctx: CanvasRenderingContext2D, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.lineTo(w - r, 0);
  ctx.arcTo(w, 0, w, r, r);
  ctx.lineTo(w, h - r);
  ctx.arcTo(w, h, w - r, h, r);
  ctx.lineTo(r, h);
  ctx.arcTo(0, h, 0, h - r, r);
  ctx.lineTo(0, r);
  ctx.arcTo(0, 0, r, 0, r);
  ctx.closePath();
}

function getProverbText(proverb: Proverb, lang: 'dg' | 'sw'): string {
  if (lang === 'sw') return proverb.swahili || proverb.digo;
  return proverb.digo;
}

function getDefinition(entry: DictionaryEntry, locale: Locale): string {
  const sense = entry.senses?.[0];
  if (!sense) return entry.equivalents_en?.[0] || '';
  if (locale === 'sw') return sense.definition_sw || sense.definition_en || '';
  if (locale === 'dig') return sense.definition_dg || sense.definition_en || '';
  return sense.definition_en || '';
}

export async function renderProverbCard(
  proverb: Proverb,
  lang: 'dg' | 'sw' = 'dg'
): Promise<Blob> {
  await loadShareFonts();

  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d')!;

  // Clip to rounded rect
  roundedRect(ctx, SIZE, SIZE, RADIUS);
  ctx.clip();

  // Background
  ctx.fillStyle = COLORS.cream;
  ctx.fillRect(0, 0, SIZE, SIZE);

  // Motif bands
  const bandH = 80;
  const bandY1 = 40;
  const bandY2 = SIZE - 40 - bandH;
  const pattern = createMotifPattern(ctx, drawMikekaTile, 40, 40, COLORS.indigo);
  ctx.fillStyle = pattern;
  ctx.fillRect(PADDING, bandY1, CONTENT_W, bandH);
  ctx.fillRect(PADDING, bandY2, CONTENT_W, bandH);

  // Horizontal rules
  ctx.strokeStyle = COLORS.indigo;
  ctx.globalAlpha = 0.2;
  ctx.lineWidth = 1;
  for (const y of [bandY1, bandY1 + bandH, bandY2, bandY2 + bandH]) {
    ctx.beginPath();
    ctx.moveTo(PADDING, y);
    ctx.lineTo(SIZE - PADDING, y);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // Text area
  const textTop = bandY1 + bandH + 20;
  const textBottom = bandY2 - 20;
  const textH = textBottom - textTop;

  const text = getProverbText(proverb, lang);
  const { fontSize, lines } = fitFontSize(
    ctx, text, CONTENT_W, textH,
    'Fraunces, serif', '500',
    [48, 42, 36, 30, 24]
  );

  ctx.fillStyle = COLORS.indigo;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `500 ${fontSize}px Fraunces, serif`;

  const lineH = fontSize * 1.4;
  const blockH = lines.length * lineH;
  const startY = textTop + (textH - blockH) / 2 + lineH / 2;

  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], SIZE / 2, startY + i * lineH);
  }

  // Brand footer
  drawBrandFooter(ctx, SIZE, COLORS.indigo, 0.4);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Canvas toBlob failed'))),
      'image/png'
    );
  });
}

export async function renderWordCard(
  entry: DictionaryEntry,
  locale: Locale
): Promise<Blob> {
  await loadShareFonts();

  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d')!;

  // Clip to rounded rect
  roundedRect(ctx, SIZE, SIZE, RADIUS);
  ctx.clip();

  // Background
  ctx.fillStyle = COLORS.indigo;
  ctx.fillRect(0, 0, SIZE, SIZE);

  // Motif strip (left side)
  const stripW = 100;
  const stripX = 40;
  const stripY = 60;
  const stripH = SIZE - 120;
  ctx.globalAlpha = 0.8;
  const pattern = createMotifPattern(ctx, drawDoorFrameTile, 60, 80, COLORS.cream);
  ctx.fillStyle = pattern;
  ctx.fillRect(stripX, stripY, stripW, stripH);
  ctx.globalAlpha = 1;

  // Content area
  const contentX = 180;
  const contentMaxW = SIZE - contentX - PADDING;

  // Headword
  const headwordSize = entry.headword.length > 15 ? 44 : 56;
  ctx.fillStyle = COLORS.cream;
  ctx.font = `500 ${headwordSize}px Fraunces, serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  const headwordY = SIZE * 0.3;
  ctx.fillText(entry.headword, contentX, headwordY);

  // Part of speech
  const posY = headwordY + headwordSize + 16;
  ctx.fillStyle = COLORS.gold;
  ctx.font = '500 18px Inter, sans-serif';
  ctx.fillText(entry.pos_en || entry.pos, contentX, posY);

  // Definition
  const defY = posY + 36;
  const defText = getDefinition(entry, locale);
  ctx.fillStyle = COLORS.cream;
  ctx.globalAlpha = 0.7;
  ctx.font = '400 24px "Source Serif 4", serif';
  const defLines = wrapText(ctx, defText, contentMaxW);
  const maxDefLines = Math.min(defLines.length, 3);
  for (let i = 0; i < maxDefLines; i++) {
    let line = defLines[i];
    if (i === maxDefLines - 1 && defLines.length > 3) {
      line = line.replace(/\s+\S*$/, '…');
    }
    ctx.fillText(line, contentX, defY + i * 36);
  }
  ctx.globalAlpha = 1;

  // Brand footer
  drawBrandFooter(ctx, SIZE, COLORS.cream, 0.3);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Canvas toBlob failed'))),
      'image/png'
    );
  });
}

export function renderProverbCardSync(
  proverb: Proverb,
  lang: 'dg' | 'sw' = 'dg'
): Blob {
  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d')!;

  roundedRect(ctx, SIZE, SIZE, RADIUS);
  ctx.clip();

  ctx.fillStyle = COLORS.cream;
  ctx.fillRect(0, 0, SIZE, SIZE);

  const bandH = 80;
  const bandY1 = 40;
  const bandY2 = SIZE - 40 - bandH;
  const pattern = createMotifPattern(ctx, drawMikekaTile, 40, 40, COLORS.indigo);
  ctx.fillStyle = pattern;
  ctx.fillRect(PADDING, bandY1, CONTENT_W, bandH);
  ctx.fillRect(PADDING, bandY2, CONTENT_W, bandH);

  ctx.strokeStyle = COLORS.indigo;
  ctx.globalAlpha = 0.2;
  ctx.lineWidth = 1;
  for (const y of [bandY1, bandY1 + bandH, bandY2, bandY2 + bandH]) {
    ctx.beginPath();
    ctx.moveTo(PADDING, y);
    ctx.lineTo(SIZE - PADDING, y);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  const textTop = bandY1 + bandH + 20;
  const textBottom = bandY2 - 20;
  const textH = textBottom - textTop;
  const text = getProverbText(proverb, lang);
  const { fontSize, lines } = fitFontSize(
    ctx, text, CONTENT_W, textH,
    'Fraunces, serif', '500',
    [48, 42, 36, 30, 24]
  );

  ctx.fillStyle = COLORS.indigo;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `500 ${fontSize}px Fraunces, serif`;
  const lineH = fontSize * 1.4;
  const blockH = lines.length * lineH;
  const startY = textTop + (textH - blockH) / 2 + lineH / 2;
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], SIZE / 2, startY + i * lineH);
  }

  drawBrandFooter(ctx, SIZE, COLORS.indigo, 0.4);

  const dataUrl = canvas.toDataURL('image/png');
  const binary = atob(dataUrl.split(',')[1]);
  const arr = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i);
  return new Blob([arr], { type: 'image/png' });
}
