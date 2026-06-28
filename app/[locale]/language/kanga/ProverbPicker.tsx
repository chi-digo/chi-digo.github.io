'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from '@/lib/i18n/context';
import type { ProverbStub } from './page';

interface Props {
  proverbs: ProverbStub[];
  selectedId?: string;
  onSelect: (proverb: ProverbStub) => void;
}

export function ProverbPicker({ proverbs, selectedId, onSelect }: Props) {
  const t = useTranslations();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return proverbs.slice(0, 30);
    const q = search.toLowerCase();
    return proverbs
      .filter(
        (p) =>
          p.digo.toLowerCase().includes(q) ||
          p.english.toLowerCase().includes(q),
      )
      .slice(0, 30);
  }, [proverbs, search]);

  return (
    <div>
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={t.kanga.search_proverbs}
        style={{
          width: '100%',
          border: '1px solid var(--border, #ddd)',
          borderRadius: '0.5rem',
          padding: '0.625rem 1rem',
          fontSize: '0.875rem',
          background: 'var(--color-bg, #fff)',
          marginBottom: '0.75rem',
          outline: 'none',
        }}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', maxHeight: '18rem', overflowY: 'auto' }}>
        {filtered.length === 0 && (
          <div style={{ color: 'var(--fg-muted, #888)', fontSize: '0.875rem', padding: '1rem 0', textAlign: 'center' }}>
            {t.kanga.no_proverbs_found}
          </div>
        )}
        {filtered.map((p) => {
          const selected = selectedId === p.digo;
          return (
            <button
              key={p.id}
              onClick={() => onSelect(p)}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '0.75rem 1rem',
                borderRadius: '0.5rem',
                border: `1px solid ${selected ? 'var(--color-bahari-accent, #2563eb)' : 'var(--border, #ddd)'}`,
                background: selected ? 'rgba(37, 99, 235, 0.05)' : 'transparent',
                cursor: 'pointer',
                transition: 'border-color 0.15s, background 0.15s',
              }}
            >
              <div style={{ fontSize: '0.875rem', fontWeight: 500, color: selected ? 'var(--color-bahari-accent, #2563eb)' : 'var(--fg-default, #222)' }}>
                {p.digo}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--fg-muted, #888)', marginTop: '0.125rem' }}>
                {p.english}
              </div>
            </button>
          );
        })}
      </div>

      {!search.trim() && proverbs.length > 30 && (
        <div style={{ fontSize: '0.75rem', color: 'var(--fg-muted, #888)', textAlign: 'center', marginTop: '0.5rem' }}>
          {t.kanga.showing_of
            .replace('{shown}', '30')
            .replace('{total}', String(proverbs.length))}
        </div>
      )}
    </div>
  );
}
