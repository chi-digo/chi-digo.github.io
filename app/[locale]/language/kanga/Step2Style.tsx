'use client';

import { useRef, useEffect } from 'react';
import { useTranslations } from '@/lib/i18n/context';
import { PALETTES, PALETTE_KEYS } from '@/lib/sharing/kanga/palettes';
import { MOTIFS, MOTIF_KEYS } from '@/lib/sharing/motifs';
import { PATTERNS, PATTERN_KEYS } from '@/lib/sharing/kanga/patterns';
import { COMPOSITION_KEYS, type MjiComposition } from '@/lib/sharing/kanga/compositions';
import type { Messages } from '@/lib/i18n/config';

interface Props {
  palette: string;
  pindoMotif: string;
  mjiComposition: MjiComposition;
  mjiMotif: string;
  onSetPalette: (palette: string) => void;
  onSetPindo: (motif: string) => void;
  onSetComposition: (composition: MjiComposition) => void;
  onSetMjiMotif: (motif: string) => void;
}

const COMP_LABEL_KEYS: Record<MjiComposition, keyof Messages['kanga']> = {
  grid_repeat: 'comp_grid_repeat',
  central_medallion: 'comp_central_medallion',
  scattered: 'comp_scattered',
  horizontal_bands: 'comp_horizontal_bands',
  solid: 'comp_solid',
};

const MOTIF_LABEL_KEYS: Record<string, keyof Messages['kanga']> = {
  diamond_chain: 'motif_diamond_chain',
  mikeka: 'motif_mikeka',
  door_frame: 'motif_door_frame',
  medallion: 'motif_medallion',
  korosho: 'motif_korosho',
  knots: 'motif_knots',
};

const PATTERN_LABEL_KEYS: Record<string, keyof Messages['kanga']> = {
  sunburst: 'pattern_sunburst',
  geometric: 'pattern_geometric',
  paisley: 'pattern_paisley',
  solid: 'pattern_solid',
};

function MotifThumb({ motifKey, color }: { motifKey: string; color: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, 48, 48);
    MOTIFS[motifKey]?.draw(ctx, 48, 48, color);
  }, [motifKey, color]);

  return <canvas ref={ref} width={48} height={48} style={{ width: '100%', height: '100%' }} />;
}

function PatternThumb({ patternKey, color }: { patternKey: string; color: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, 48, 48);
    if (patternKey === 'solid') {
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.3;
      ctx.fillRect(0, 0, 48, 48);
      ctx.globalAlpha = 1;
    } else {
      PATTERNS[patternKey]?.draw(ctx, 48, 48, color);
    }
  }, [patternKey, color]);

  return <canvas ref={ref} width={48} height={48} style={{ width: '100%', height: '100%' }} />;
}

function CompositionThumb({ compositionKey }: { compositionKey: MjiComposition }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = 56;
    const h = 38;
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = '#5A6B7A';
    ctx.lineWidth = 1;
    ctx.strokeRect(1, 1, w - 2, h - 2);
    ctx.fillStyle = '#5A6B7A';

    switch (compositionKey) {
      case 'grid_repeat': {
        const s = 5;
        for (let r = 0; r < 3; r++) {
          for (let c = 0; c < 5; c++) {
            ctx.fillRect(8 + c * (s + 3), 8 + r * (s + 3), s, s);
          }
        }
        break;
      }
      case 'central_medallion': {
        ctx.beginPath();
        ctx.arc(w / 2, h / 2 - 2, 8, 0, Math.PI * 2);
        ctx.stroke();
        const dots = [[12, 8], [w - 12, 8], [12, h - 10], [w - 12, h - 10]];
        for (const [dx, dy] of dots) {
          ctx.beginPath();
          ctx.arc(dx, dy, 3, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      }
      case 'scattered': {
        const pts = [[14, 10], [38, 8], [26, 18], [12, 26], [42, 24], [22, 30], [36, 30]];
        for (const [px, py] of pts) {
          ctx.beginPath();
          ctx.arc(px, py, 3, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      }
      case 'horizontal_bands': {
        for (let i = 0; i < 5; i++) {
          const by = 5 + i * 6;
          if (i % 2 === 1) {
            ctx.fillStyle = '#5A6B7A';
            ctx.fillRect(5, by, w - 10, 4);
          } else {
            ctx.strokeStyle = '#5A6B7A';
            ctx.lineWidth = 0.5;
            ctx.strokeRect(5, by, w - 10, 4);
          }
        }
        ctx.fillStyle = '#5A6B7A';
        break;
      }
      case 'solid': {
        ctx.fillStyle = '#5A6B7A';
        ctx.globalAlpha = 0.15;
        ctx.fillRect(5, 5, w - 10, h - 10);
        ctx.globalAlpha = 1;
        break;
      }
    }
  }, [compositionKey]);

  return <canvas ref={ref} width={56} height={38} style={{ width: '100%', height: '100%' }} />;
}

const selectorBtn = (selected: boolean): React.CSSProperties => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '0.375rem',
  padding: '0.75rem',
  borderRadius: '0.5rem',
  border: `2px solid ${selected ? 'var(--color-bahari-accent, #2563eb)' : 'var(--border, #ddd)'}`,
  background: selected ? 'rgba(37, 99, 235, 0.05)' : 'transparent',
  cursor: 'pointer',
  transition: 'border-color 0.15s, background 0.15s',
});

const labelStyle: React.CSSProperties = {
  fontSize: '0.625rem',
  fontWeight: 500,
  color: 'var(--fg-muted, #888)',
  lineHeight: 1.2,
  textAlign: 'center',
};

const sectionLabel: React.CSSProperties = {
  fontSize: '0.75rem',
  fontWeight: 500,
  color: 'var(--fg-muted, #888)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  marginBottom: '0.75rem',
  display: 'block',
};

export function Step2Style({
  palette,
  pindoMotif,
  mjiComposition,
  mjiMotif,
  onSetPalette,
  onSetPindo,
  onSetComposition,
  onSetMjiMotif,
}: Props) {
  const t = useTranslations();
  const currentPalette = PALETTES[palette];
  const showMotifSelector = mjiComposition !== 'solid';
  const usePatternMotifs = mjiComposition === 'grid_repeat';

  return (
    <div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-bahari-accent, #2563eb)', marginBottom: '0.5rem' }}>
        {t.kanga.choose_style_title}
      </h2>
      <p style={{ color: 'var(--fg-muted, #888)', marginBottom: '1.5rem' }}>
        {t.kanga.choose_style_description}
      </p>

      {/* Palettes */}
      <div style={{ marginBottom: '2rem' }}>
        <label style={sectionLabel}>{t.kanga.color_scheme}</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem' }}>
          {PALETTE_KEYS.map((key) => {
            const p = PALETTES[key];
            const selected = key === palette;
            return (
              <button
                key={key}
                onClick={() => onSetPalette(key)}
                style={{
                  aspectRatio: '1',
                  borderRadius: '0.5rem',
                  border: `2px solid ${selected ? 'var(--color-bahari-accent, #2563eb)' : 'var(--border, #ddd)'}`,
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'border-color 0.15s, transform 0.15s',
                  transform: selected ? 'scale(1.05)' : 'scale(1)',
                  padding: 0,
                }}
                title={key.replace(/_/g, ' ')}
              >
                <div style={{ width: '100%', height: '50%', backgroundColor: p.pindoBg }} />
                <div style={{ width: '100%', height: '50%', backgroundColor: p.mjiBg }} />
              </button>
            );
          })}
        </div>
      </div>

      {/* Pindo motifs */}
      <div style={{ marginBottom: '2rem' }}>
        <label style={sectionLabel}>{t.kanga.border_motif}</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
          {MOTIF_KEYS.map((key) => {
            const selected = key === pindoMotif;
            return (
              <button key={key} onClick={() => onSetPindo(key)} style={selectorBtn(selected)}>
                <div style={{ width: '3rem', height: '3rem' }}>
                  <MotifThumb motifKey={key} color={currentPalette.pindoFg} />
                </div>
                <span style={labelStyle}>{t.kanga[MOTIF_LABEL_KEYS[key]]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Mji composition */}
      <div style={{ marginBottom: '2rem' }}>
        <label style={sectionLabel}>{t.kanga.center_layout}</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem' }}>
          {COMPOSITION_KEYS.map((key) => {
            const selected = key === mjiComposition;
            return (
              <button key={key} onClick={() => onSetComposition(key)} style={{ ...selectorBtn(selected), padding: '0.5rem' }}>
                <div style={{ width: '3.5rem', height: '2.375rem' }}>
                  <CompositionThumb compositionKey={key} />
                </div>
                <span style={labelStyle}>{t.kanga[COMP_LABEL_KEYS[key]]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Center motif — conditional */}
      {showMotifSelector && (
        <div>
          <label style={sectionLabel}>{t.kanga.center_motif}</label>
          {usePatternMotifs ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
              {PATTERN_KEYS.map((key) => {
                const selected = key === mjiMotif;
                return (
                  <button key={key} onClick={() => onSetMjiMotif(key)} style={selectorBtn(selected)}>
                    <div style={{ width: '3rem', height: '3rem' }}>
                      <PatternThumb patternKey={key} color={currentPalette.mjiFg} />
                    </div>
                    <span style={labelStyle}>{t.kanga[PATTERN_LABEL_KEYS[key]]}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
              {MOTIF_KEYS.map((key) => {
                const selected = key === mjiMotif;
                return (
                  <button key={key} onClick={() => onSetMjiMotif(key)} style={selectorBtn(selected)}>
                    <div style={{ width: '3rem', height: '3rem' }}>
                      <MotifThumb motifKey={key} color={currentPalette.mjiFg} />
                    </div>
                    <span style={labelStyle}>{t.kanga[MOTIF_LABEL_KEYS[key]]}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
