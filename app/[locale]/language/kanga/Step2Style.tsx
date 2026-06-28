'use client';

import { useRef, useEffect, useCallback } from 'react';
import { useTranslations } from '@/lib/i18n/context';
import { Tabs } from '@chi-digo/design-system';
import { PALETTES, PALETTE_KEYS } from '@/lib/sharing/kanga/palettes';
import { MOTIFS, MOTIF_KEYS } from '@/lib/sharing/motifs';
import { PATTERNS, PATTERN_KEYS } from '@/lib/sharing/kanga/patterns';
import { COMPOSITION_KEYS, type MjiComposition } from '@/lib/sharing/kanga/compositions';
import { renderKanga } from '@/lib/sharing/kanga/renderer';
import type { Messages } from '@/lib/i18n/config';

interface Props {
  jina: string;
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
  gap: 'var(--space-1-5)',
  padding: 'var(--space-3)',
  borderRadius: 'var(--radius-md)',
  border: `var(--border-width-thick) solid ${selected ? 'var(--interactive-default)' : 'var(--border-default)'}`,
  background: selected ? 'var(--bg-surface-muted)' : 'transparent',
  cursor: 'pointer',
  transition: 'border-color var(--duration-fast), background var(--duration-fast)',
});

const labelStyle: React.CSSProperties = {
  fontSize: 'var(--text-xs)',
  fontWeight: 'var(--weight-medium)' as any,
  color: 'var(--fg-muted)',
  lineHeight: 1.2,
  textAlign: 'center',
};

function LivePreview({ jina, palette, pindoMotif, mjiComposition, mjiMotif }: {
  jina: string; palette: string; pindoMotif: string; mjiComposition: MjiComposition; mjiMotif: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const render = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const displayWidth = Math.min(600, window.innerWidth - 32);
    const displayHeight = Math.round(displayWidth * (2 / 3));
    canvas.width = displayWidth * dpr;
    canvas.height = displayHeight * dpr;
    canvas.style.width = `${displayWidth}px`;
    canvas.style.height = `${displayHeight}px`;
    try {
      await renderKanga(canvas, { jina, palette, pindoMotif, mjiComposition, mjiMotif });
    } catch {
      // silently fail on preview
    }
  }, [jina, palette, pindoMotif, mjiComposition, mjiMotif]);

  useEffect(() => { render(); }, [render]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--space-6)' }}>
      <div style={{ overflow: 'hidden', boxShadow: 'var(--shadow-md)', border: 'var(--border-width-thin) solid var(--border-default)', background: 'var(--bg-surface)' }}>
        <canvas ref={canvasRef} style={{ display: 'block', maxWidth: '100%' }} />
      </div>
    </div>
  );
}

export function Step2Style({
  jina,
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
      <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-semibold)' as any, color: 'var(--fg-heading)', marginBottom: 'var(--space-2)' }}>
        {t.kanga.choose_style_title}
      </h2>
      <p style={{ color: 'var(--fg-muted)', marginBottom: 'var(--space-6)' }}>
        {t.kanga.choose_style_description}
      </p>

      <LivePreview jina={jina} palette={palette} pindoMotif={pindoMotif} mjiComposition={mjiComposition} mjiMotif={mjiMotif} />

      <Tabs
        items={[
          {
            label: t.kanga.color_scheme,
            content: (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 'var(--space-2)' }}>
                {PALETTE_KEYS.map((key) => {
                  const p = PALETTES[key];
                  const selected = key === palette;
                  return (
                    <button
                      key={key}
                      onClick={() => onSetPalette(key)}
                      style={{
                        aspectRatio: '1',
                        borderRadius: 'var(--radius-md)',
                        border: `var(--border-width-thick) solid ${selected ? 'var(--interactive-default)' : 'var(--border-default)'}`,
                        overflow: 'hidden',
                        cursor: 'pointer',
                        transition: 'border-color var(--duration-fast), transform var(--duration-fast)',
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
            ),
          },
          {
            label: t.kanga.border_motif,
            content: (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-2)' }}>
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
            ),
          },
          {
            label: t.kanga.center_layout,
            content: (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 'var(--space-2)', marginBottom: showMotifSelector ? 'var(--space-6)' : undefined }}>
                  {COMPOSITION_KEYS.map((key) => {
                    const selected = key === mjiComposition;
                    return (
                      <button key={key} onClick={() => onSetComposition(key)} style={{ ...selectorBtn(selected), padding: 'var(--space-2)' }}>
                        <div style={{ width: '3.5rem', height: '2.375rem' }}>
                          <CompositionThumb compositionKey={key} />
                        </div>
                        <span style={labelStyle}>{t.kanga[COMP_LABEL_KEYS[key]]}</span>
                      </button>
                    );
                  })}
                </div>

                {showMotifSelector && (
                  <div>
                    {usePatternMotifs ? (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-2)' }}>
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
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-2)' }}>
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
            ),
          },
        ]}
      />
    </div>
  );
}
