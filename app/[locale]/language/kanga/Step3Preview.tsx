'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { useTranslations, useLocale } from '@/lib/i18n/context';
import { renderKanga, exportKanga, type KangaSpec } from '@/lib/sharing/kanga/renderer';
import { shareImage } from '@/lib/sharing/share';
import { track, trackShare } from '@/lib/analytics/track';
import { Button } from '@chi-digo/design-system';

interface Props {
  spec: KangaSpec;
}

const downloadIcon = <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ display: 'inline-block', verticalAlign: '-0.15em', marginRight: '0.375rem' }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;

const shareIcon = <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ display: 'inline-block', verticalAlign: '-0.15em', marginRight: '0.375rem' }}><circle cx="18" cy="5" r="3" stroke="currentColor" strokeWidth="2" /><circle cx="6" cy="12" r="3" stroke="currentColor" strokeWidth="2" /><circle cx="18" cy="19" r="3" stroke="currentColor" strokeWidth="2" /><path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" stroke="currentColor" strokeWidth="2" /></svg>;

export function Step3Preview({ spec }: Props) {
  const t = useTranslations();
  const { locale } = useLocale();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rendering, setRendering] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  const render = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setRendering(true);
    setError(null);

    try {
      const dpr = window.devicePixelRatio || 1;
      const displayWidth = Math.min(600, window.innerWidth - 32);
      const displayHeight = Math.round(displayWidth * (2 / 3));
      canvas.width = displayWidth * dpr;
      canvas.height = displayHeight * dpr;
      canvas.style.width = `${displayWidth}px`;
      canvas.style.height = `${displayHeight}px`;

      await renderKanga(canvas, spec);
    } catch (e) {
      setError(e instanceof Error ? e.message : t.kanga.render_error);
    } finally {
      setRendering(false);
    }
  }, [spec, t.kanga.render_error]);

  useEffect(() => {
    render();
  }, [render]);

  const handleDownload = useCallback(async () => {
    setDownloading(true);
    try {
      const { highRes } = await exportKanga(spec);
      const a = document.createElement('a');
      a.href = URL.createObjectURL(highRes);
      a.download = 'kanga-chidigo.png';
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 60_000);
      track('language', 'kanga', 'downloaded', { locale });
    } finally {
      setDownloading(false);
    }
  }, [spec, locale]);

  const handleShare = useCallback(async () => {
    const { social } = await exportKanga(spec);
    const result = await shareImage(
      social,
      'kanga-chidigo.png',
      'My Kanga — Chidigo',
      spec.fumbo,
      window.location.href,
    );
    trackShare('kanga', result);
    track('language', 'kanga', 'shared', { result, locale });
  }, [spec, locale]);

  return (
    <div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-kaya-deep, #0E1A2A)', marginBottom: '0.5rem' }}>
        {t.kanga.preview_title}
      </h2>
      <p style={{ color: 'rgba(14, 26, 42, 0.55)', marginBottom: '1.5rem' }}>
        {t.kanga.preview_description}
      </p>

      {/* Canvas */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
        <div style={{ position: 'relative', overflow: 'hidden', boxShadow: 'var(--shadow-md)', border: 'var(--border-width-thin) solid var(--border-default)', background: 'var(--bg-surface)' }}>
          <canvas
            ref={canvasRef}
            style={{ display: 'block', maxWidth: '100%' }}
          />
          {rendering && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.7)' }}>
              <span style={{ fontSize: '0.875rem', color: 'rgba(14, 26, 42, 0.55)' }}>{t.kanga.rendering}</span>
            </div>
          )}
          {error && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.9)' }}>
              <span style={{ fontSize: '0.875rem', color: '#dc2626' }}>{error}</span>
            </div>
          )}
        </div>
      </div>

      {/* What you get */}
      <div style={{ padding: '1rem', background: 'var(--color-hando-cream, #F2EAD7)', borderRadius: '0.5rem', border: '1px solid rgba(14, 26, 42, 0.15)', marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 500, color: 'rgba(14, 26, 42, 0.55)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
          {t.kanga.what_you_get}
        </div>
        <ul style={{ fontSize: '0.875rem', color: 'var(--color-kaya-deep, #0E1A2A)', listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <li>{t.kanga.high_res_png}</li>
          <li>{t.kanga.social_crop}</li>
          <li>{t.kanga.includes_watermark}</li>
        </ul>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
        <Button
          onClick={handleDownload}
          disabled={downloading || rendering}
          style={{ flex: 1 }}
        >
          {downloadIcon}{downloading ? t.kanga.downloading : t.kanga.download}
        </Button>
        <Button
          onClick={handleShare}
          disabled={rendering}
          variant="secondary"
          style={{ flex: 1 }}
        >
          {shareIcon}{t.share.share_image}
        </Button>
      </div>

    </div>
  );
}
