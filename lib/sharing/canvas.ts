import type { Proverb } from '@/lib/proverbs/types';
import type { DictionaryEntry } from '@/lib/dictionary/types';
import type { Locale } from '@/lib/i18n/config';
import { drawMikekaTile, drawDoorFrameTile, createMotifPattern } from './motifs';
import { fitFontSize, wrapText } from './text';
import { loadShareFonts } from './fonts';
import { drawBrandFooter, drawBrandBar } from './brand';

const SIZE = 1080;
const PADDING = 80;
const CONTENT_W = SIZE - PADDING * 2;

const COLORS = {
  cream: '#F2EAD7',
  indigo: '#1F3A5F',
  gold: '#C99846',
};

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

  // Background (full bleed, no rounded corners)
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

  // Brand bar (centered, above bottom motif)
  const brandY = bandY2 - 40;
  drawBrandBar(ctx, SIZE / 2, brandY, COLORS.indigo, 'rgba(31,58,95,0.5)');

  // Text area (between top motif and brand bar)
  const textTop = bandY1 + bandH + 20;
  const textBottom = brandY - 30;
  const textH = textBottom - textTop;

  const text = getProverbText(proverb, lang);
  const { fontSize, lines } = fitFontSize(
    ctx, text, CONTENT_W, textH,
    'Fraunces, serif', '500',
    [72, 63, 54, 45, 36]
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

  // Background (full bleed, no rounded corners)
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
  const headwordSize = entry.headword.length > 15 ? 96 : 120;
  ctx.fillStyle = COLORS.cream;
  ctx.font = `500 ${headwordSize}px Fraunces, serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  const headwordY = SIZE * 0.22;
  ctx.fillText(entry.headword, contentX, headwordY);

  // Part of speech
  const posY = headwordY + headwordSize + 18;
  ctx.fillStyle = COLORS.gold;
  ctx.font = '600 36px Inter, sans-serif';
  ctx.fillText(entry.pos_en || entry.pos, contentX, posY);

  // Definition
  const defY = posY + 60;
  const defText = getDefinition(entry, locale);
  ctx.fillStyle = COLORS.cream;
  ctx.globalAlpha = 0.75;
  ctx.font = '400 48px "Source Serif 4", serif';
  const defLines = wrapText(ctx, defText, contentMaxW);
  const maxDefLines = Math.min(defLines.length, 4);
  for (let i = 0; i < maxDefLines; i++) {
    let line = defLines[i];
    if (i === maxDefLines - 1 && defLines.length > maxDefLines) {
      line = line.replace(/\s+\S*$/, '…');
    }
    ctx.fillText(line, contentX, defY + i * 66);
  }
  ctx.globalAlpha = 1;

  // Brand bar (bottom, centered)
  drawBrandBar(ctx, SIZE / 2, SIZE - 70, COLORS.cream, 'rgba(242,234,215,0.5)');

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Canvas toBlob failed'))),
      'image/png'
    );
  });
}

export interface QuizScoreData {
  score: number;
  total: number;
  message: string;
  breakdown: { category: string; correct: number; total: number }[];
}

export async function renderQuizScoreCard(data: QuizScoreData): Promise<Blob> {
  await loadShareFonts();

  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = COLORS.indigo;
  ctx.fillRect(0, 0, SIZE, SIZE);

  // Motif bands
  const bandH = 60;
  const bandY1 = 40;
  const bandY2 = SIZE - 40 - bandH;
  ctx.globalAlpha = 0.3;
  const pattern = createMotifPattern(ctx, drawMikekaTile, 40, 40, COLORS.cream);
  ctx.fillStyle = pattern;
  ctx.fillRect(PADDING, bandY1, CONTENT_W, bandH);
  ctx.fillRect(PADDING, bandY2, CONTENT_W, bandH);
  ctx.globalAlpha = 1;

  // Score circle
  const circleY = 320;
  const circleR = 140;
  ctx.beginPath();
  ctx.arc(SIZE / 2, circleY, circleR, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(242,234,215,0.1)';
  ctx.fill();
  ctx.lineWidth = 6;
  ctx.strokeStyle = COLORS.gold;
  ctx.stroke();

  // Score arc (progress)
  const pct = data.score / data.total;
  ctx.beginPath();
  ctx.arc(SIZE / 2, circleY, circleR, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * pct);
  ctx.lineWidth = 8;
  ctx.strokeStyle = COLORS.cream;
  ctx.stroke();

  // Score text
  ctx.fillStyle = COLORS.cream;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '500 96px Fraunces, serif';
  ctx.fillText(`${data.score}/${data.total}`, SIZE / 2, circleY);

  // Message
  ctx.font = '500 42px Fraunces, serif';
  ctx.fillStyle = COLORS.gold;
  ctx.fillText(data.message, SIZE / 2, circleY + circleR + 70);

  // Breakdown
  if (data.breakdown.length > 0) {
    const breakdownY = circleY + circleR + 140;
    ctx.font = '400 32px Inter, sans-serif';
    ctx.fillStyle = COLORS.cream;
    ctx.globalAlpha = 0.7;
    const rowH = 48;
    for (let i = 0; i < data.breakdown.length; i++) {
      const b = data.breakdown[i];
      ctx.fillText(`${b.category}: ${b.correct}/${b.total}`, SIZE / 2, breakdownY + i * rowH);
    }
    ctx.globalAlpha = 1;
  }

  // Brand bar
  drawBrandBar(ctx, SIZE / 2, bandY2 - 30, COLORS.cream, 'rgba(242,234,215,0.5)');

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

  const brandY = bandY2 - 40;
  drawBrandBar(ctx, SIZE / 2, brandY, COLORS.indigo, 'rgba(31,58,95,0.5)');

  const textTop = bandY1 + bandH + 20;
  const textBottom = brandY - 30;
  const textH = textBottom - textTop;
  const text = getProverbText(proverb, lang);
  const { fontSize, lines } = fitFontSize(
    ctx, text, CONTENT_W, textH,
    'Fraunces, serif', '500',
    [72, 63, 54, 45, 36]
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

  const dataUrl = canvas.toDataURL('image/png');
  const binary = atob(dataUrl.split(',')[1]);
  const arr = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i);
  return new Blob([arr], { type: 'image/png' });
}
