'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from '@/lib/i18n/context';
import { msg, takeResumeIntent } from '@/lib/contributions/client';
import { payloadSummary } from '@/lib/contributions/display';
import type { DictionaryEntry } from '@/lib/dictionary/types';
import type { WordEntry } from '@/lib/contributions/apply/words';
import { refreshWordOverlay } from '@/lib/dictionary/loader';
import { track } from '@/lib/analytics/track';
import { WORD_ID } from '@/lib/contributions/schemas';
import { SuggestionsPanel, type PublicSuggestion } from './SuggestionsPanel';
import { CreditLine } from './Credits';
import { DefinitionForm, ExampleForm, FlagForm, VariantForm } from './WordForms';
import styles from './Contribute.module.css';

type Form = { kind: 'definition'; sense: number } | { kind: 'example'; sense?: number } | { kind: 'variant' } | { kind: 'flag' };

/**
 * What the dictionary shows around one entry for contributions (spec 34 §15.3): the community note on a
 * new word, regional forms with their credits, "Improve this definition" per sense, the "Suggest an
 * edit" menu, and the suggestions under review. `contributions: 'flag_only'` keeps just "Something's
 * wrong" (phrasebook and other reuse, product §5).
 */
export function useWordForms(entry: DictionaryEntry) {
  const [form, setForm] = useState<Form | null>(null);
  const [panelKey, setPanelKey] = useState(0);

  // After signing in from a form, reopen it with its draft.
  useEffect(() => {
    // Read after mount (browser storage), as the plants page does.
    let live = true;
    Promise.resolve(takeResumeIntent(entry.id)).then((intent) => {
      if (!live || !intent) return;
      if (intent.form === 'definition_update') setForm({ kind: 'definition', sense: Number(intent.extra?.sense ?? 1) });
      if (intent.form === 'example_sentence') setForm({ kind: 'example' });
      if (intent.form === 'spelling_variant') setForm({ kind: 'variant' });
      if (intent.form === 'entry_flag') setForm({ kind: 'flag' });
    });
    return () => {
      live = false;
    };
  }, [entry.id]);

  const open = (f: Form) => {
    track('contribute', 'dictionary', `open_${f.kind}`, { id: entry.id });
    setForm(f);
  };
  const submitted = () => {
    setPanelKey((k) => k + 1);
    refreshWordOverlay();
  };
  const forms = form && (
    <>
      {form.kind === 'definition' && <DefinitionForm open onClose={() => setForm(null)} entry={entry} senseId={form.sense} onSubmitted={submitted} />}
      {form.kind === 'example' && <ExampleForm open onClose={() => setForm(null)} entry={entry} senseId={form.sense} onSubmitted={submitted} />}
      {form.kind === 'variant' && <VariantForm open onClose={() => setForm(null)} entry={entry} onSubmitted={submitted} />}
      {form.kind === 'flag' && <FlagForm open onClose={() => setForm(null)} entry={entry} onSubmitted={submitted} />}
    </>
  );
  return { open, forms, panelKey };
}

/** The note on a word added by the community and not yet folded into the dictionary. */
export function NewWordNote({ entry }: { entry: DictionaryEntry }) {
  const c = useTranslations().contribute;
  const w = entry as WordEntry;
  if (!w.provisional) return null;
  return <p className={styles.intro}>{c.word_new_note}</p>;
}

/** Regional and spelling forms, each community form with its credit line. */
export function VariantsLine({ entry }: { entry: DictionaryEntry }) {
  const c = useTranslations().contribute;
  if (!entry.variants?.length) return null;
  return (
    <div className={styles.intro}>
      <strong>{c.variants_heading}:</strong>{' '}
      {entry.variants.map((v, i) => (
        <span key={`${v.form}-${i}`}>
          {i > 0 && ', '}
          <em>{v.form}</em>
          {v.dialect ? ` (${msg(c, `region_${v.dialect}`) === `region_${v.dialect}` ? v.dialect : msg(c, `region_${v.dialect}`)})` : ''}
        </span>
      ))}
      {entry.variants.some((v) => v.c) && <CreditLine ids={entry.variants.flatMap((v) => (v.c ? [v.c] : []))} />}
    </div>
  );
}

/** Whether an entry can take suggestions: provisional new words (flags only) and well-formed ids. */
export function canSuggest(entry: DictionaryEntry): boolean {
  return !!(entry as WordEntry).provisional || WORD_ID.test(entry.id);
}

/** "Improve this definition", under one sense. */
export function ImproveLink({ onClick }: { onClick: () => void }) {
  const c = useTranslations().contribute;
  return (
    <button type="button" className={styles.textBtn} onClick={onClick}>
      {c.word_improve}
    </button>
  );
}

/** The "Suggest an edit" menu and the suggestions under review for one entry. */
export function WordSuggest({
  entry,
  open,
  panelKey,
  contributions = 'all',
}: {
  entry: DictionaryEntry;
  open: (f: Form) => void;
  panelKey: number;
  contributions?: 'all' | 'flag_only';
}) {
  const c = useTranslations().contribute;
  const [menu, setMenu] = useState(false);
  const provisional = !!(entry as WordEntry).provisional;
  // A provisional new word offers only "Something's wrong".
  const flagOnly = contributions === 'flag_only' || provisional;

  const render = (s: PublicSuggestion) => (
    <>
      <span className={styles.legend}>{msg(c, `type_${s.type}`)}: </span>
      <em>{payloadSummary(s.public_payload)}</em>
    </>
  );

  return (
    <div>
      {flagOnly ? (
        <button type="button" className={styles.textBtn} onClick={() => open({ kind: 'flag' })}>{c.word_menu_flag}</button>
      ) : (
        <>
          <button type="button" className={styles.textBtn} aria-expanded={menu} onClick={() => setMenu((m) => !m)}>
            {c.word_suggest}
          </button>
          {menu && (
            <div className={styles.chips} role="menu">
              {(
                [
                  ['definition', c.word_menu_definition],
                  ['example', c.word_menu_example],
                  ['variant', c.word_menu_variant],
                  ['flag', c.word_menu_flag],
                ] as const
              ).map(([kind, label]) => (
                <button
                  key={kind}
                  type="button"
                  role="menuitem"
                  className={styles.chip}
                  onClick={() => {
                    setMenu(false);
                    open(kind === 'definition' ? { kind, sense: entry.senses[0]?.sense_id ?? 1 } : { kind });
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </>
      )}
      {!provisional && contributions === 'all' && (
        <SuggestionsPanel
          targetType="word"
          targetId={entry.id}
          refreshKey={panelKey}
          render={render}
          onDifferently={(s) =>
            open(
              s.type === 'example_sentence' ? { kind: 'example' }
                : s.type === 'spelling_variant' ? { kind: 'variant' }
                : { kind: 'definition', sense: Number(s.public_payload.sense_id ?? entry.senses[0]?.sense_id ?? 1) },
            )
          }
        />
      )}
    </div>
  );
}
