'use client';

import { useState, useMemo } from 'react';
import { useTranslations, useLocale } from '@/lib/i18n/context';
import type { ProverbStub } from './page';

interface Props {
  proverbs: ProverbStub[];
  selectedId?: string;
  onSelect: (proverb: ProverbStub) => void;
}

function getSubtitle(p: ProverbStub, locale: string): string {
  if (locale === 'dg') return p.idiomatic_dg;
  if (locale === 'sw') return p.idiomatic_sw;
  return p.idiomatic_en;
}

export function ProverbPicker({ proverbs, selectedId, onSelect }: Props) {
  const t = useTranslations();
  const { locale } = useLocale();
  const [search, setSearch] = useState('');

  const { filtered, matchCount } = useMemo(() => {
    if (!search.trim()) return { filtered: proverbs.slice(0, 30), matchCount: proverbs.length };
    const q = search.toLowerCase();
    const matched = proverbs.filter(
      (p) =>
        p.digo.toLowerCase().includes(q) ||
        p.idiomatic_en.toLowerCase().includes(q) ||
        p.idiomatic_sw.toLowerCase().includes(q) ||
        p.idiomatic_dg.toLowerCase().includes(q),
    );
    return { filtered: matched.slice(0, 30), matchCount: matched.length };
  }, [proverbs, search]);

  return (
    <div>
      <div style={{ position: 'relative', marginBottom: 'var(--space-3)' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          background: '#fff',
          border: '1.5px solid var(--color-vigango-black, #1a1a1a)',
          borderRadius: 'var(--radius-md)',
          padding: '0.75rem 1rem',
          transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
        }}>
          <svg
            width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{ flexShrink: 0, color: 'var(--color-vigango-black)', opacity: 0.45 }}
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.kanga.search_proverbs}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontFamily: 'var(--font-serif)',
              fontSize: 'var(--text-base)',
              color: 'var(--color-vigango-black)',
            }}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              aria-label="Clear search"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'none',
                border: 'none',
                padding: '2px',
                cursor: 'pointer',
                color: 'var(--color-vigango-black)',
                opacity: 0.45,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1-5)', maxHeight: '18rem', overflowY: 'auto' }}>
        {filtered.length === 0 && (
          <div style={{ color: 'var(--fg-muted)', fontSize: 'var(--text-sm)', padding: 'var(--space-4) 0', textAlign: 'center' }}>
            {t.kanga.no_proverbs_found}
          </div>
        )}
        {filtered.map((p) => {
          const selected = selectedId === p.digo;
          const subtitle = getSubtitle(p, locale);
          return (
            <button
              key={p.id}
              onClick={() => onSelect(p)}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: 'var(--space-3) var(--space-4)',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                background: selected ? 'var(--bg-surface-muted)' : 'transparent',
                cursor: 'pointer',
                transition: 'border-color var(--duration-fast), background var(--duration-fast)',
              }}
            >
              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)' as any, color: 'var(--fg-default)' }}>
                {p.digo}
              </div>
              {subtitle && (
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--fg-muted)', marginTop: 'var(--space-0-5)' }}>
                  {subtitle}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {matchCount > 30 && (
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--fg-muted)', textAlign: 'right', marginTop: 'var(--space-2)' }}>
          {t.kanga.showing_of
            .replace('{shown}', '30')
            .replace('{total}', String(matchCount))}
          {!search.trim() && ` — ${t.kanga.search_to_find_more}`}
        </div>
      )}
    </div>
  );
}
