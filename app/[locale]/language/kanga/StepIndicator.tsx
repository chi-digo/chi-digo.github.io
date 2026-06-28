'use client';

import { useTranslations } from '@/lib/i18n/context';

export function StepIndicator({ current, total }: { current: number; total: number }) {
  const t = useTranslations();
  const labels = [t.kanga.step_message, t.kanga.step_style, t.kanga.step_preview];

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
      {Array.from({ length: total }, (_, i) => {
        const step = i + 1;
        const active = step === current;
        const done = step < current;
        return (
          <div key={step} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <div
              style={{
                width: '1.75rem',
                height: '1.75rem',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: 500,
                background: active
                  ? 'var(--color-bahari-accent, #2563eb)'
                  : done
                    ? 'rgba(37, 99, 235, 0.2)'
                    : 'var(--color-surface, #f5f5f5)',
                color: active
                  ? '#fff'
                  : done
                    ? 'var(--color-bahari-accent, #2563eb)'
                    : 'var(--fg-muted, #888)',
                transition: 'background 0.2s, color 0.2s',
              }}
            >
              {step}
            </div>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 500,
                color: active ? 'var(--color-bahari-accent, #2563eb)' : 'var(--fg-muted, #888)',
              }}
              className="hidden sm:inline"
            >
              {labels[i]}
            </span>
            {step < total && (
              <div style={{ width: '1rem', height: '1px', background: 'var(--border, #ddd)', margin: '0 0.125rem' }} />
            )}
          </div>
        );
      })}
    </div>
  );
}
