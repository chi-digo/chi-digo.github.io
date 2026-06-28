'use client';

import { useState } from 'react';
import { useTranslations } from '@/lib/i18n/context';
import { ProverbPicker } from './ProverbPicker';
import type { ProverbStub } from './page';

const MAX_CHARS = 80;

interface Props {
  proverbs: ProverbStub[];
  jina: string;
  jinaSource: 'proverb' | 'custom';
  onSetJina: (jina: string, source: 'proverb' | 'custom', sourceId?: string) => void;
}

export function Step1Message({ proverbs, jina, jinaSource, onSetJina }: Props) {
  const t = useTranslations();
  const [tab, setTab] = useState<'proverbs' | 'custom'>(
    jinaSource === 'proverb' ? 'proverbs' : 'custom',
  );

  return (
    <div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-kaya-deep, #0E1A2A)', marginBottom: '0.5rem' }}>
        {t.kanga.choose_message_title}
      </h2>
      <p style={{ color: 'rgba(14, 26, 42, 0.55)', marginBottom: '1.5rem' }}>
        {t.kanga.choose_message_description}
      </p>

      <div style={{ display: 'flex', gap: '0.25rem', background: 'var(--color-hando-cream, #F2EAD7)', borderRadius: '0.5rem', padding: '0.25rem', marginBottom: '1.25rem' }}>
        <button
          onClick={() => setTab('proverbs')}
          style={{
            flex: 1,
            padding: '0.5rem',
            borderRadius: '0.375rem',
            fontSize: '0.875rem',
            fontWeight: 500,
            border: 'none',
            cursor: 'pointer',
            background: tab === 'proverbs' ? 'var(--color-hando-cream, #F2EAD7)' : 'transparent',
            color: tab === 'proverbs' ? 'var(--color-kaya-deep, #0E1A2A)' : 'rgba(14, 26, 42, 0.55)',
            boxShadow: tab === 'proverbs' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            transition: 'all 0.15s',
          }}
        >
          {t.kanga.browse_proverbs}
        </button>
        <button
          onClick={() => setTab('custom')}
          style={{
            flex: 1,
            padding: '0.5rem',
            borderRadius: '0.375rem',
            fontSize: '0.875rem',
            fontWeight: 500,
            border: 'none',
            cursor: 'pointer',
            background: tab === 'custom' ? 'var(--color-hando-cream, #F2EAD7)' : 'transparent',
            color: tab === 'custom' ? 'var(--color-kaya-deep, #0E1A2A)' : 'rgba(14, 26, 42, 0.55)',
            boxShadow: tab === 'custom' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            transition: 'all 0.15s',
          }}
        >
          {t.kanga.type_your_own}
        </button>
      </div>

      {tab === 'proverbs' ? (
        <ProverbPicker
          proverbs={proverbs}
          selectedId={jinaSource === 'proverb' ? jina : undefined}
          onSelect={(proverb) => onSetJina(proverb.digo, 'proverb', proverb.id)}
        />
      ) : (
        <div>
          <textarea
            value={jinaSource === 'custom' ? jina : ''}
            onChange={(e) => {
              const text = e.target.value.slice(0, MAX_CHARS);
              onSetJina(text, 'custom');
            }}
            placeholder={t.kanga.custom_placeholder}
            rows={3}
            style={{
              width: '100%',
              border: '1px solid rgba(14, 26, 42, 0.15)',
              borderRadius: '0.5rem',
              padding: '0.75rem 1rem',
              fontSize: '1rem',
              background: 'var(--color-hando-cream, #F2EAD7)',
              resize: 'none',
              outline: 'none',
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.375rem', fontSize: '0.75rem', color: 'rgba(14, 26, 42, 0.55)' }}>
            <span>
              {t.kanga.char_limit
                .replace('{count}', String(jinaSource === 'custom' ? jina.length : 0))
                .replace('{max}', String(MAX_CHARS))}
            </span>
            <span>{t.kanga.jina_length_hint}</span>
          </div>
        </div>
      )}

      {jina.trim() && (
        <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'var(--color-hando-cream, #F2EAD7)', borderRadius: '0.5rem', border: '1px solid rgba(14, 26, 42, 0.15)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 500, color: 'rgba(14, 26, 42, 0.55)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {t.kanga.your_jina}
          </div>
          <div style={{ fontSize: '1.125rem', color: 'var(--color-kaya-deep, #0E1A2A)', fontFamily: 'var(--font-display, serif)' }}>
            {jina}
          </div>
        </div>
      )}
    </div>
  );
}
