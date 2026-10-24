'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from '@/lib/i18n/context';
import { msg, takeResumeIntent } from '@/lib/contributions/client';
import { payloadSummary } from '@/lib/contributions/display';
import type { Proverb } from '@/lib/proverbs/types';
import { refreshProverbOverlay } from '@/lib/proverbs/loader';
import { track } from '@/lib/analytics/track';
import { SuggestionsPanel, type PublicSuggestion } from './SuggestionsPanel';
import { ProverbContextForm, ProverbMeaningForm, ProverbReportForm, ProverbVariantForm } from './ProverbForms';
import styles from './Contribute.module.css';

export type ProverbForm = { kind: 'meaning'; meaning: 'idiomatic' | 'literal' } | { kind: 'context' } | { kind: 'variant' } | { kind: 'report' };
type Form = ProverbForm;

/** Form state for one proverb, reopened after sign-in (spec 34 §16.5). Null while the proverb loads. */
export function useProverbForms(proverb: Proverb | null) {
  const id = proverb?.id ?? null;
  const [form, setForm] = useState<Form | null>(null);
  const [panelKey, setPanelKey] = useState(0);

  useEffect(() => {
    let live = true;
    if (!id) return;
    Promise.resolve(takeResumeIntent(id)).then((intent) => {
      if (!live || !intent) return;
      if (intent.form === 'proverb_meaning') setForm({ kind: 'meaning', meaning: (intent.extra?.kind as 'idiomatic' | 'literal') ?? 'idiomatic' });
      if (intent.form === 'proverb_context') setForm({ kind: 'context' });
      if (intent.form === 'proverb_variant') setForm({ kind: 'variant' });
      if (intent.form === 'proverb_report') setForm({ kind: 'report' });
    });
    return () => {
      live = false;
    };
  }, [id]);

  const open = (f: Form) => {
    track('contribute', 'proverbs', `open_${f.kind}`, { id: id ?? '' });
    setForm(f);
  };
  const submitted = () => {
    setPanelKey((k) => k + 1);
    refreshProverbOverlay();
  };
  const forms = form && proverb && (
    <>
      {form.kind === 'meaning' && <ProverbMeaningForm open onClose={() => setForm(null)} proverb={proverb} kind={form.meaning} onSubmitted={submitted} />}
      {form.kind === 'context' && <ProverbContextForm open onClose={() => setForm(null)} proverb={proverb} onSubmitted={submitted} />}
      {form.kind === 'variant' && <ProverbVariantForm open onClose={() => setForm(null)} proverb={proverb} onSubmitted={submitted} />}
      {form.kind === 'report' && <ProverbReportForm open onClose={() => setForm(null)} proverb={proverb} />}
    </>
  );
  return { open, forms, panelKey };
}

/** The "Suggest an edit" menu and the suggestions under review, below the meaning and commentary. */
export function ProverbSuggest({ proverb, open, panelKey }: { proverb: Proverb; open: (f: Form) => void; panelKey: number }) {
  const c = useTranslations().contribute;
  const { locale } = useLocale();
  const [menu, setMenu] = useState(false);
  const meaning = locale === 'sw' ? proverb.idiomatic_sw : locale === 'dg' ? proverb.idiomatic_dg : proverb.idiomatic_en;
  // A word-for-word meaning is offered in English and Swahili (Digo has none: it is the proverb itself).
  const items: [Form, string][] = [
    [{ kind: 'meaning', meaning: 'idiomatic' }, meaning ? c.pv_fix_meaning : c.pv_add_meaning],
    ...(locale === 'dg' ? [] : [[{ kind: 'meaning', meaning: 'literal' }, c.pv_literal] as [Form, string]]),
    [{ kind: 'context' }, c.pv_context],
    [{ kind: 'variant' }, c.pv_variant],
    [{ kind: 'report' }, c.word_menu_flag],
  ];

  const render = (s: PublicSuggestion) => (
    <>
      <span className={styles.legend}>{msg(c, `type_${s.type}`)}: </span>
      <em>{payloadSummary(s.public_payload)}</em>
    </>
  );

  return (
    <div>
      <button type="button" className={styles.textBtn} aria-expanded={menu} onClick={() => setMenu((m) => !m)}>
        {c.word_suggest}
      </button>
      {menu && (
        <div className={styles.chips} role="menu">
          {items.map(([f, label]) => (
            <button
              key={label}
              type="button"
              role="menuitem"
              className={styles.chip}
              onClick={() => {
                setMenu(false);
                open(f);
              }}
            >
              {label}
            </button>
          ))}
        </div>
      )}
      <SuggestionsPanel
        targetType="proverb"
        targetId={proverb.id}
        refreshKey={panelKey}
        render={render}
        onDifferently={(s) =>
          open(s.type === 'proverb_variant' ? { kind: 'variant' } : s.type === 'proverb_context' ? { kind: 'context' } : { kind: 'meaning', meaning: (s.public_payload.kind as 'idiomatic' | 'literal') ?? 'idiomatic' })
        }
      />
    </div>
  );
}
