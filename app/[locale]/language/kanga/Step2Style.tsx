'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
import { useTranslations } from '@/lib/i18n/context';
import { Tabs, IconButton } from '@chi-digo/design-system';
import { PALETTES, PALETTE_KEYS, type Palette } from '@/lib/sharing/kanga/palettes';
import { MOTIFS, MOTIF_KEYS } from '@/lib/sharing/motifs';
import { PATTERNS, PATTERN_KEYS } from '@/lib/sharing/kanga/patterns';
import { COMPOSITION_KEYS, type MjiComposition } from '@/lib/sharing/kanga/compositions';
import { renderKanga } from '@/lib/sharing/kanga/renderer';
import type { Messages } from '@/lib/i18n/config';

interface Props {
  fumbo: string;
  palette: string;
  resolvedPalette?: Palette;
  customPalette: Palette;
  pindoMotif: string;
  mjiComposition: MjiComposition;
  mjiMotif: string;
  onSetPalette: (palette: string) => void;
  onSetCustomColor: (field: keyof Palette, color: string) => void;
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

function hslToHex(h: number, s: number, l: number): string {
  const s1 = s / 100, l1 = l / 100;
  const a = s1 * Math.min(l1, 1 - l1);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const c = l1 - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * c).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

const COLOR_SWATCHES: string[] = (() => {
  const colors: string[] = [];
  const hues = [0, 30, 60, 120, 180, 210, 240, 270, 300, 330];
  const levels: [number, number][] = [[100, 70], [100, 50], [80, 35]];
  for (const [s, l] of levels) {
    for (const h of hues) {
      colors.push(hslToHex(h, s, l));
    }
  }
  colors.push('#FFFFFF', '#C0C0C0', '#808080', '#404040', '#1A1A1A', '#000000');
  return colors;
})();

const editIcon = <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M11.5 1.5l3 3L5 14H2v-3L11.5 1.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /></svg>;

const PALETTE_FIELD_LABELS: Record<keyof Palette, string> = {
  pindoBg: 'border_color',
  pindoFg: 'border_color',
  mjiBg: 'center_color',
  mjiFg: 'center_color',
  accent: 'accent_color',
  fumboBoxBg: 'border_color',
  fumboBoxText: 'center_color',
};

const labelStyle: React.CSSProperties = {
  fontSize: 'var(--text-xs)',
  fontWeight: 'var(--weight-medium)' as any,
  color: 'var(--fg-muted)',
  lineHeight: 1.2,
  textAlign: 'center',
};

function LivePreview({ fumbo, palette, resolvedPalette, pindoMotif, mjiComposition, mjiMotif }: {
  fumbo: string; palette: string; resolvedPalette?: Palette; pindoMotif: string; mjiComposition: MjiComposition; mjiMotif: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const render = useCallback(async () => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const dpr = window.devicePixelRatio || 1;
    const displayWidth = Math.min(600, container.clientWidth);
    const displayHeight = Math.round(displayWidth * (2 / 3));
    canvas.width = displayWidth * dpr;
    canvas.height = displayHeight * dpr;
    canvas.style.width = `${displayWidth}px`;
    canvas.style.height = `${displayHeight}px`;
    try {
      await renderKanga(canvas, { fumbo, palette, resolvedPalette, pindoMotif, mjiComposition, mjiMotif });
    } catch {
      // silently fail on preview
    }
  }, [fumbo, palette, resolvedPalette, pindoMotif, mjiComposition, mjiMotif]);

  useEffect(() => { render(); }, [render]);

  return (
    <div ref={containerRef} style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--space-6)' }}>
      <div style={{ overflow: 'hidden', boxShadow: 'var(--shadow-md)', border: 'var(--border-width-thin) solid var(--border-default)', background: 'var(--bg-surface)' }}>
        <canvas ref={canvasRef} style={{ display: 'block' }} />
      </div>
    </div>
  );
}

export function Step2Style({
  fumbo,
  palette,
  resolvedPalette,
  customPalette,
  pindoMotif,
  mjiComposition,
  mjiMotif,
  onSetPalette,
  onSetCustomColor,
  onSetPindo,
  onSetComposition,
  onSetMjiMotif,
}: Props) {
  const t = useTranslations();
  const currentPalette = resolvedPalette ?? PALETTES[palette];
  const [colorPickerField, setColorPickerField] = useState<keyof Palette | null>(null);
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

      <LivePreview fumbo={fumbo} palette={palette} resolvedPalette={resolvedPalette} pindoMotif={pindoMotif} mjiComposition={mjiComposition} mjiMotif={mjiMotif} />

      <Tabs
        items={[
          {
            label: t.kanga.color_scheme,
            content: (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 'var(--space-2)' }}>
                  {PALETTE_KEYS.map((key, idx) => {
                    const isLast = idx === PALETTE_KEYS.length - 1;
                    const p = isLast ? customPalette : PALETTES[key];
                    const isCustomActive = palette === 'custom';
                    const selected = isLast ? (key === palette || isCustomActive) : key === palette && !isCustomActive;
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
                          position: 'relative',
                        }}
                        title={key.replace(/_/g, ' ')}
                      >
                        {/* Row 1: pindoBg */}
                        <div style={{ width: '100%', height: '40%', backgroundColor: p.pindoBg }} />
                        {/* Row 2: mjiBg */}
                        <div style={{ width: '100%', height: '40%', backgroundColor: p.mjiBg }} />
                        {/* Row 3: pindoFg | accent | mjiFg | fumboBoxBg | fumboBoxText */}
                        <div style={{ display: 'flex', width: '100%', height: '20%' }}>
                          <div style={{ flex: 1, backgroundColor: p.pindoFg }} />
                          <div style={{ flex: 1, backgroundColor: p.accent }} />
                          <div style={{ flex: 1, backgroundColor: p.mjiFg }} />
                          <div style={{ flex: 1, backgroundColor: p.fumboBoxBg }} />
                          <div style={{ flex: 1, backgroundColor: p.fumboBoxText }} />
                        </div>
                        {/* Edit overlay for last palette */}
                        {isLast && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            style={{ position: 'absolute', inset: 0, display: 'grid', gridTemplateRows: '40% 40% 20%' }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <IconButton icon={editIcon} label={t.kanga.border_color} variant="ghost" size="sm" onClick={() => setColorPickerField('pindoBg')} />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <IconButton icon={editIcon} label={t.kanga.center_color} variant="ghost" size="sm" onClick={() => setColorPickerField('mjiBg')} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <IconButton icon={editIcon} label={t.kanga.border_color} variant="ghost" size="sm" onClick={() => setColorPickerField('pindoFg')} />
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <IconButton icon={editIcon} label={t.kanga.accent_color} variant="ghost" size="sm" onClick={() => setColorPickerField('accent')} />
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <IconButton icon={editIcon} label={t.kanga.center_color} variant="ghost" size="sm" onClick={() => setColorPickerField('mjiFg')} />
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <IconButton icon={editIcon} label={t.kanga.border_color} variant="ghost" size="sm" onClick={() => setColorPickerField('fumboBoxBg')} />
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <IconButton icon={editIcon} label={t.kanga.center_color} variant="ghost" size="sm" onClick={() => setColorPickerField('fumboBoxText')} />
                              </div>
                            </div>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {colorPickerField !== null && (
                  <div
                    style={{
                      position: 'fixed', inset: 0, zIndex: 1000,
                      display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
                    }}
                  >
                    <div
                      onClick={() => setColorPickerField(null)}
                      style={{ flex: 1, background: 'rgba(0,0,0,0.3)' }}
                    />
                    <div style={{
                      background: 'var(--bg-surface, #fff)',
                      borderTop: 'var(--border-width-thin) solid var(--border-default)',
                      padding: 'var(--space-4) var(--space-4) calc(var(--space-4) + env(safe-area-inset-bottom, 0px))',
                      borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
                      boxShadow: 'var(--shadow-lg, 0 -4px 24px rgba(0,0,0,0.12))',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
                        <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)' as any, color: 'var(--fg-heading)' }}>
                          {colorPickerField && t.kanga[PALETTE_FIELD_LABELS[colorPickerField] as keyof typeof t.kanga]}
                        </span>
                        <button
                          onClick={() => setColorPickerField(null)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 'var(--space-1)', color: 'var(--fg-muted)', fontSize: 'var(--text-lg)' }}
                        >
                          &times;
                        </button>
                      </div>
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, 30px)',
                        gap: 4,
                        justifyContent: 'center',
                      }}>
                        {COLOR_SWATCHES.map((color, i) => {
                          return (
                            <button
                              key={i}
                              onClick={() => onSetCustomColor(colorPickerField!, color)}
                              style={{
                                width: 30, height: 30,
                                backgroundColor: color,
                                border: 'none',
                                borderRadius: 'var(--radius-sm, 2px)',
                                cursor: 'pointer',
                                padding: 0,
                                outline: (colorPickerField && customPalette[colorPickerField]) === color ? '2px solid var(--interactive-default)' : 'none',
                                outlineOffset: -1,
                              }}
                            />
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </>
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
