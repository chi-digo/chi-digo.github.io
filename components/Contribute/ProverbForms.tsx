'use client';

import { usePathname } from 'next/navigation';
import { Checkbox, RadioGroup, TextArea, TextField } from '@chi-digo/design-system';
import { useLocale, useTranslations } from '@/lib/i18n/context';
import { msg, useContributionDraft } from '@/lib/contributions/client';
import type { Proverb } from '@/lib/proverbs/types';
import { ContributionDialog } from './ContributionDialog';
import styles from './Contribute.module.css';

/** The proverb forms (spec 34 §16, v2), on ContributionDialog with drafts and sign-in resume. */

interface FormProps {
  open: boolean;
  onClose: () => void;
  proverb: Proverb;
  onSubmitted?: () => void;
}

type Lang = 'en' | 'sw' | 'dg';
const LANGS: Lang[] = ['dg', 'sw', 'en'];
const target = (p: Proverb) => ({ target_type: 'proverb' as const, target_id: p.id });

/** A live character count under long text (spec 34 §16.9). */
function Count({ n, max }: { n: number; max: number }) {
  const c = useTranslations().contribute;
  return <p className={styles.legend}>{c.pv_count.replace('{n}', String(n)).replace('{max}', String(max))}</p>;
}

/** "Fix the meaning" / "Add a meaning": one meaning, in the reader's language. */
export function ProverbMeaningForm({ open, onClose, proverb, onSubmitted, kind }: FormProps & { kind: 'idiomatic' | 'literal' }) {
  const c = useTranslations().contribute;
  const { locale } = useLocale();
  const lang = (kind === 'literal' && locale === 'dg' ? 'en' : locale) as Lang;
  const field = `${kind}_${lang}` as keyof Proverb;
  const current = String(proverb[field] ?? '');
  const key = `proverb_meaning:${proverb.id}:${kind}:${lang}`;
  const [draft, setDraft, clear] = useContributionDraft(key, { text: current });
  const text = draft.text.trim();

  return (
    <ContributionDialog
      open={open}
      onClose={onClose}
      type="proverb_meaning"
      title={kind === 'literal' ? c.pv_literal : current ? c.pv_fix_meaning : c.pv_add_meaning}
      intro={c.pv_meaning_intro.replace('{proverb}', proverb.digo).replace('{language}', msg(c, `lang_${lang}`))}
      target={target(proverb)}
      draftKey={key}
      resume={{ form: 'proverb_meaning', target_id: proverb.id, extra: { kind } }}
      payload={text && text !== current.trim() ? { lang, kind, mode: 'replace', text } : null}
      askSource
      onSubmitted={() => {
        clear();
        onSubmitted?.();
      }}
    >
      <TextArea label={kind === 'literal' ? c.pv_kind_literal : c.pv_kind_idiomatic} value={draft.text} onChange={(e) => setDraft({ text: e.target.value })} maxLength={500} rows={3} autoFocus />
    </ContributionDialog>
  );
}

/** "Tell us how it's used": a story or a situation, in a language the writer chooses. */
export function ProverbContextForm({ open, onClose, proverb, onSubmitted }: FormProps) {
  const c = useTranslations().contribute;
  const { locale } = useLocale();
  const key = `proverb_context:${proverb.id}`;
  const [draft, setDraft, clear] = useContributionDraft(key, { lang: locale as Lang, text: '' });
  const text = draft.text.trim();

  return (
    <ContributionDialog
      open={open}
      onClose={onClose}
      type="proverb_context"
      title={c.pv_context}
      intro={c.pv_context_hint}
      target={target(proverb)}
      draftKey={key}
      resume={{ form: 'proverb_context', target_id: proverb.id }}
      payload={text ? { lang: draft.lang, text } : null}
      askSource
      onSubmitted={() => {
        clear();
        onSubmitted?.();
      }}
    >
      <TextArea label={c.pv_context_label} value={draft.text} onChange={(e) => setDraft({ text: e.target.value })} maxLength={1500} rows={6} autoFocus />
      <Count n={draft.text.length} max={1500} />
      <RadioGroup
        label={c.pv_lang_label}
        value={draft.lang}
        onChange={(v) => setDraft({ lang: v as Lang })}
        options={LANGS.map((l) => ({ value: l, label: msg(c, `lang_${l}`) }))}
      />
      <p className={styles.legend}>{c.pv_lang_note.replace('{language}', msg(c, `lang_${draft.lang}`))}</p>
    </ContributionDialog>
  );
}

/** "Do you say it differently?": a regional or alternative wording. */
export function ProverbVariantForm({ open, onClose, proverb, onSubmitted }: FormProps) {
  const c = useTranslations().contribute;
  const key = `proverb_variant:${proverb.id}`;
  const [draft, setDraft, clear] = useContributionDraft(key, { form: '', note: '' });
  const form = draft.form.trim();

  return (
    <ContributionDialog
      open={open}
      onClose={onClose}
      type="proverb_variant"
      title={c.pv_variant}
      intro={proverb.digo}
      target={target(proverb)}
      draftKey={key}
      resume={{ form: 'proverb_variant', target_id: proverb.id }}
      payload={form ? { form, ...(draft.note.trim() && { note: draft.note.trim() }) } : null}
      askSource
      onSubmitted={() => {
        clear();
        onSubmitted?.();
      }}
    >
      <TextField label={c.pv_variant_label} value={draft.form} onChange={(e) => setDraft({ form: e.target.value })} maxLength={400} autoFocus />
      <TextField label={c.pv_variant_note_label} value={draft.note} onChange={(e) => setDraft({ note: e.target.value })} maxLength={300} />
    </ContributionDialog>
  );
}

/** "Something's wrong": private feedback about this proverb (or a new one awaiting an editor), for reviewers only. */
export function ProverbReportForm({ open, onClose, proverb, onSubmitted }: FormProps) {
  const c = useTranslations().contribute;
  const pathname = usePathname();
  const key = `feedback:${pathname}`;
  const [draft, setDraft, clear] = useContributionDraft(key, { text: '' });

  return (
    <ContributionDialog
      open={open}
      onClose={onClose}
      type="general_feedback"
      title={c.word_menu_flag}
      intro={`${proverb.digo}. ${c.feedback_intro}`}
      target={{ target_type: 'page', target_id: pathname }}
      draftKey={key}
      resume={{ form: 'proverb_report', target_id: proverb.id }}
      payload={draft.text.trim() ? { text: draft.text.trim() } : null}
      onSubmitted={() => {
        clear();
        onSubmitted?.();
      }}
    >
      <TextArea label={c.feedback_label} value={draft.text} onChange={(e) => setDraft({ text: e.target.value })} maxLength={2000} rows={5} autoFocus />
    </ContributionDialog>
  );
}

/** "Add a proverb": the Digo text, at least one meaning, and how it is used. */
export function NewProverbForm({ open, onClose, onSubmitted, digo = '' }: { open: boolean; onClose: () => void; onSubmitted?: () => void; digo?: string }) {
  const c = useTranslations().contribute;
  const { locale } = useLocale();
  const key = 'proverb_addition';
  const [draft, setDraft, clear] = useContributionDraft(key, {
    digo, literal_en: '', meaning_en: '', meaning_sw: '', meaning_dg: '', usage: '', usage_lang: locale as Lang, mature: false,
  });
  const d = draft.digo.trim();
  const complete = d && (draft.meaning_en.trim() || draft.meaning_sw.trim() || draft.meaning_dg.trim());
  const opt = (k: 'literal_en' | 'meaning_en' | 'meaning_sw' | 'meaning_dg' | 'usage') => (draft[k].trim() ? { [k]: draft[k].trim() } : {});

  return (
    <ContributionDialog
      open={open}
      onClose={onClose}
      type="proverb_addition"
      title={c.pv_add}
      intro={c.pv_add_intro}
      target={{ target_type: 'proverb' }}
      draftKey={key}
      resume={{ form: 'proverb_addition', target_id: 'new-proverb' }}
      payload={complete ? {
        digo: d, ...opt('literal_en'), ...opt('meaning_en'), ...opt('meaning_sw'), ...opt('meaning_dg'), ...opt('usage'),
        ...(draft.usage.trim() && { usage_lang: draft.usage_lang }), ...(draft.mature && { mature: true }),
      } : null}
      askSource
      onSubmitted={() => {
        clear();
        onSubmitted?.();
      }}
    >
      <TextField label={c.pv_digo_label} value={draft.digo} onChange={(e) => setDraft({ digo: e.target.value })} maxLength={400} autoFocus />
      <TextField label={c.pv_meaning_en} value={draft.meaning_en} onChange={(e) => setDraft({ meaning_en: e.target.value })} maxLength={500} />
      <TextField label={c.pv_meaning_sw} value={draft.meaning_sw} onChange={(e) => setDraft({ meaning_sw: e.target.value })} maxLength={500} />
      <TextField label={c.pv_meaning_dg} value={draft.meaning_dg} onChange={(e) => setDraft({ meaning_dg: e.target.value })} maxLength={500} helperText={c.pv_meaning_hint} />
      <TextField label={c.pv_literal_en} value={draft.literal_en} onChange={(e) => setDraft({ literal_en: e.target.value })} maxLength={400} />
      <TextArea label={c.pv_usage_label} value={draft.usage} onChange={(e) => setDraft({ usage: e.target.value })} maxLength={1500} rows={4} />
      {draft.usage.trim() && (
        <>
          <Count n={draft.usage.length} max={1500} />
          <RadioGroup
            label={c.pv_lang_label}
            value={draft.usage_lang}
            onChange={(v) => setDraft({ usage_lang: v as Lang })}
            options={LANGS.map((l) => ({ value: l, label: msg(c, `lang_${l}`) }))}
          />
        </>
      )}
      <Checkbox label={c.pv_mature} checked={draft.mature} onChange={(e) => setDraft({ mature: e.target.checked })} />
    </ContributionDialog>
  );
}

