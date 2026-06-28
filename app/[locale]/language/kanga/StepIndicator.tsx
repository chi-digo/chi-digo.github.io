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
                  ? 'var(--color-kaya-deep, #0E1A2A)'
                  : done
                    ? 'rgba(14, 26, 42, 0.15)'
                    : 'var(--color-hando-cream, #F2EAD7)',
                color: active
                  ? '#fff'
                  : done
                    ? 'var(--color-kaya-deep, #0E1A2A)'
                    : 'rgba(14, 26, 42, 0.45)',
                transition: 'background 0.2s, color 0.2s',
              }}
            >
              {step}
            </div>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 500,
                color: active ? 'var(--color-kaya-deep, #0E1A2A)' : 'rgba(14, 26, 42, 0.45)',
              }}
              className="hidden sm:inline"
            >
              {labels[i]}
            </span>
            {step < total && (
              <div style={{ width: '1rem', height: '1px', background: 'rgba(14, 26, 42, 0.15)', margin: '0 0.125rem' }} />
            )}
          </div>
        );
      })}
    </div>
  );
}
