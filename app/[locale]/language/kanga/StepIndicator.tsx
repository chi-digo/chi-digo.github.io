'use client';

import { useTranslations } from '@/lib/i18n/context';

export function StepIndicator({ current, total }: { current: number; total: number }) {
  const t = useTranslations();
  const labels = [t.kanga.step_message, t.kanga.step_style, t.kanga.step_preview];

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-2)',
      fontFamily: 'var(--font-sans)',
    }}>
      {Array.from({ length: total }, (_, i) => {
        const step = i + 1;
        const active = step === current;
        const done = step < current;
        return (
          <div key={step} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <div
              style={{
                width: '1.75rem',
                height: '1.75rem',
                borderRadius: 'var(--radius-full)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 'var(--text-xs)',
                fontWeight: 'var(--weight-medium)' as any,
                background: active
                  ? 'var(--interactive-default)'
                  : done
                    ? 'var(--bg-surface-muted)'
                    : 'var(--bg-surface)',
                color: active
                  ? 'var(--fg-on-brand)'
                  : done
                    ? 'var(--fg-default)'
                    : 'var(--fg-subtle)',
                border: active || done
                  ? 'none'
                  : 'var(--border-width-thin) solid var(--border-default)',
                transition: `background var(--duration-moderate) var(--ease-default), color var(--duration-moderate) var(--ease-default)`,
              }}
            >
              {done ? (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2.5 6L5 8.5L9.5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                step
              )}
            </div>
            <span
              style={{
                fontSize: 'var(--text-xs)',
                fontWeight: 'var(--weight-medium)' as any,
                color: active ? 'var(--fg-default)' : 'var(--fg-subtle)',
              }}
              className="hidden sm:inline"
            >
              {labels[i]}
            </span>
            {step < total && (
              <div style={{
                width: 'var(--space-4)',
                height: 'var(--border-width-thin)',
                background: 'var(--border-default)',
                margin: '0 var(--space-0-5)',
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}
