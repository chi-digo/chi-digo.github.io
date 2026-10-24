'use client';

import { RadioGroup, TextArea, TextField } from '@chi-digo/design-system';
import { useTranslations } from '@/lib/i18n/context';
import { msg, useContributionDraft } from '@/lib/contributions/client';
import { CreditLine } from './Credits';
import type { Provenance } from '@/lib/contributions/apply/types';
import type { TranslationField } from '@/lib/contributions/schemas';
import { ContributionDialog } from './ContributionDialog';
import styles from './Contribute.module.css';

/** One block a reader can fix: what it is, its text now, and the English it translates. */
export interface FixOption {
  key: string;
  label: string;
  field: TranslationField;
  part?: number;
  lang: 'en' | 'sw' | 'dg';
  current: string;
  source?: string | null;
  /** When fixing Digo: the Swahili of the same block, shown as well. */
  swahili?: string | null;
}

/**
 * "Fix this translation" (spec 34 §17, phase 5a): pick the block (when there are several), correct
 * the text, and say what was wrong. The English is shown alongside, read-only.
 */
export function TranslationFixForm({
  open, onClose, target, options, initial, onSubmitted,
}: {
  open: boolean;
  onClose: () => void;
  target: { target_type: 'plant' | 'glossary' | 'proverb'; target_id: string };
  options: FixOption[];
  initial?: string;
  onSubmitted?: () => void;
}) {
  const c = useTranslations().contribute;
  const first = options.find((o) => o.key === initial) ?? options[0];
  // One draft per block the form was opened on, so "Fix" on a part never reopens another block's draft.
  const draftKey = `translation_fix:${target.target_type}:${target.target_id}:${first?.key ?? ''}`;
  const [draft, setDraft, clear] = useContributionDraft(draftKey, { key: first?.key ?? '', text: first?.current ?? '', reason: '' });
  const chosen = options.find((o) => o.key === draft.key) ?? first;
  if (!chosen) return null;
  const proposed = draft.text.trim();
  const reason = draft.reason.trim();
  const changed = proposed && proposed !== chosen.current.trim();
  const marked = chosen.current.includes('*');

  return (
    <ContributionDialog
      open={open}
      onClose={onClose}
      type="translation_fix"
      title={chosen.lang === 'en' ? c.tf_correct_en : c.tf_title}
      intro={chosen.lang === 'en' ? c.tf_intro_en : c.tf_intro.replace('{language}', msg(c, `lang_${chosen.lang}`))}
      target={target}
      draftKey={draftKey}
      resume={{ form: 'translation_fix', target_id: target.target_id, extra: { key: chosen.key } }}
      payload={changed && reason ? { lang: chosen.lang, field: chosen.field, ...(chosen.part !== undefined && { part: chosen.part }), proposed, reason } : null}
      askSource
      onSubmitted={() => {
        clear();
        onSubmitted?.();
      }}
    >
      {options.length > 1 && (
        <RadioGroup
          label={c.tf_which}
          value={chosen.key}
          onChange={(v) => {
            const next = options.find((o) => o.key === v);
            if (next) setDraft({ key: next.key, text: next.current });
          }}
          options={options.map((o) => ({ value: o.key, label: o.label }))}
        />
      )}
      {chosen.source && (
        <details className={styles.source}>
          <summary>{c.tf_source}</summary>
          <p lang="en">{chosen.source}</p>
        </details>
      )}
      {chosen.lang === 'dg' && chosen.swahili && (
        <details className={styles.source}>
          <summary>{c.tf_source_sw}</summary>
          <p lang="sw">{chosen.swahili}</p>
        </details>
      )}
      <TextArea
        label={c.tf_label}
        value={draft.text}
        onChange={(e) => setDraft({ text: e.target.value })}
        maxLength={4000}
        rows={6}
        helperText={marked ? c.tf_markup : undefined}
        autoFocus
      />
      <TextField label={c.tf_reason} value={draft.reason} onChange={(e) => setDraft({ reason: e.target.value })} maxLength={300} />
    </ContributionDialog>
  );
}

/** "Translation improved by …": translation fixes are credited once, at the foot of the page (decision 6). */
export function TranslationCredits({ provenance }: { provenance: (Provenance | undefined)[] }) {
  const entries = provenance.flatMap((p) => Object.values(p ?? {}).flat());
  const ids = [...new Set(entries.filter((e) => e.kind === 'translation').map((e) => e.c))];
  if (!ids.length) return null;
  return (
    <div className={styles.translationCredits}>
      <CreditLine ids={ids} translation />
    </div>
  );
}
