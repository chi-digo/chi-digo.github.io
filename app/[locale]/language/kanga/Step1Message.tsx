'use client';

import { useTranslations } from '@/lib/i18n/context';
import { Tabs, TextArea } from '@chi-digo/design-system';
import { ProverbPicker } from './ProverbPicker';
import type { ProverbStub } from './page';

const MAX_CHARS = 80;

interface Props {
  proverbs: ProverbStub[];
  fumbo: string;
  fumboSource: 'proverb' | 'custom';
  onSetFumbo: (fumbo: string, source: 'proverb' | 'custom', sourceId?: string) => void;
}

export function Step1Message({ proverbs, fumbo, fumboSource, onSetFumbo }: Props) {
  const t = useTranslations();

  return (
    <div>
      <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-semibold)' as any, color: 'var(--fg-heading)', marginBottom: 'var(--space-2)' }}>
        {t.kanga.choose_message_title}
      </h2>
      <p style={{ color: 'var(--fg-muted)', marginBottom: 'var(--space-6)' }}>
        {t.kanga.choose_message_description}
      </p>

      <Tabs
        items={[
          {
            label: t.kanga.browse_proverbs,
            content: (
              <ProverbPicker
                proverbs={proverbs}
                selectedId={fumboSource === 'proverb' ? fumbo : undefined}
                onSelect={(proverb) => onSetFumbo(proverb.digo, 'proverb', proverb.id)}
              />
            ),
          },
          {
            label: t.kanga.type_your_own,
            content: (
              <div>
                <TextArea
                  label={t.kanga.custom_label}
                  value={fumboSource === 'custom' ? fumbo : ''}
                  onChange={(e) => {
                    const text = e.target.value.slice(0, MAX_CHARS);
                    onSetFumbo(text, 'custom');
                  }}
                  placeholder={t.kanga.custom_placeholder}
                  rows={3}
                  resize="none"
                  maxCharacters={MAX_CHARS}
                  currentLength={fumboSource === 'custom' ? fumbo.length : 0}
                  helperText={t.kanga.fumbo_length_hint}
                />
              </div>
            ),
          },
        ]}
        defaultIndex={fumboSource === 'proverb' ? 0 : 1}
      />

      {fumbo.trim() && (
        <div style={{
          marginTop: 'var(--space-6)',
          padding: 'var(--space-4)',
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-md)',
          border: 'var(--border-width-thin) solid var(--border-default)',
        }}>
          <div style={{
            fontSize: 'var(--text-xs)',
            fontWeight: 'var(--weight-medium)' as any,
            color: 'var(--fg-muted)',
            marginBottom: 'var(--space-1)',
            textTransform: 'uppercase',
            letterSpacing: 'var(--tracking-wider)',
          }}>
            {t.kanga.your_fumbo}
          </div>
          <div style={{
            fontSize: 'var(--text-lg)',
            color: 'var(--fg-default)',
            fontFamily: 'var(--font-display)',
          }}>
            {fumbo}
          </div>
        </div>
      )}
    </div>
  );
}
