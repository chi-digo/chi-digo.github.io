'use client';

import { RadioGroup, Select, TextArea, TextField } from '@chi-digo/design-system';
import { useLocale, useTranslations } from '@/lib/i18n/context';
import { msg, useContributionDraft } from '@/lib/contributions/client';
import type { DictionaryEntry } from '@/lib/dictionary/types';
import type { Locale } from '@/lib/i18n/config';
import { ContributionDialog } from './ContributionDialog';

/** The dictionary forms (spec 34 §15.3), all built on ContributionDialog with drafts and resume. */

interface EntryFormProps {
  open: boolean;
  onClose: () => void;
  entry: DictionaryEntry;
  onSubmitted?: () => void;
}

const target = (entry: DictionaryEntry) => ({ target_type: 'word' as const, target_id: entry.id });
const word = (entry: DictionaryEntry) => entry.headword.replace(/[\d;]+$/, '');
const senseText = (entry: DictionaryEntry, n: number, locale: Locale) => {
  const s = entry.senses.find((x) => x.sense_id === n);
  if (!s) return '';
  return (locale === 'dg' ? s.definition_dg : locale === 'sw' ? s.definition_sw : s.definition_en) || '';
};

/** "Improve this definition": replace a sense's text in the reader's language, or add a new meaning. */
export function DefinitionForm({ open, onClose, entry, onSubmitted, senseId }: EntryFormProps & { senseId: number }) {
  const c = useTranslations().contribute;
  const { locale } = useLocale();
  const key = `definition_update:${entry.id}:${senseId}:${locale}`;
  const current = senseText(entry, senseId, locale as Locale);
  // The sense exists, so the default is to fill or correct it (also when it is empty in this language).
  const [draft, setDraft, clear] = useContributionDraft(key, { mode: 'replace' as 'replace' | 'add_sense', text: current, reason: '' });
  const text = draft.text.trim();
  const changed = text && (draft.mode === 'add_sense' || text !== current.trim());
  const index = entry.senses.findIndex((s) => s.sense_id === senseId) + 1;

  return (
    <ContributionDialog
      open={open}
      onClose={onClose}
      type="definition_update"
      title={c.word_improve}
      intro={c.def_intro.replace('{n}', String(index || 1)).replace('{word}', word(entry)).replace('{language}', msg(c, `lang_${locale}`))}
      target={target(entry)}
      draftKey={key}
      resume={{ form: 'definition_update', target_id: entry.id, extra: { sense: String(senseId) } }}
      payload={changed ? { sense_id: String(senseId), lang: locale, mode: draft.mode, text, ...(draft.reason.trim() && { reason: draft.reason.trim() }) } : null}
      askSource
      onSubmitted={() => {
        clear();
        onSubmitted?.();
      }}
    >
      <TextArea label={c.def_label} value={draft.text} onChange={(e) => setDraft({ text: e.target.value })} maxLength={1000} rows={4} autoFocus />
      {(
        <RadioGroup
          label={c.info_mode_label}
          value={draft.mode}
          onChange={(v) => {
            const mode = v as 'replace' | 'add_sense';
            setDraft({ mode, ...(mode === 'add_sense' && draft.text === current && { text: '' }), ...(mode === 'replace' && !draft.text && { text: current }) });
          }}
          options={[
            { value: 'replace', label: c.def_mode_replace },
            { value: 'add_sense', label: c.def_mode_add },
          ]}
        />
      )}
      <TextField label={c.def_reason_label} value={draft.reason} onChange={(e) => setDraft({ reason: e.target.value })} maxLength={500} />
    </ContributionDialog>
  );
}

/** "Add an example sentence": Digo first, translations optional. */
export function ExampleForm({ open, onClose, entry, onSubmitted, senseId }: EntryFormProps & { senseId?: number }) {
  const c = useTranslations().contribute;
  const { locale } = useLocale();
  const key = `example_sentence:${entry.id}`;
  const first = senseId ?? entry.senses[0]?.sense_id ?? 1;
  const [draft, setDraft, clear] = useContributionDraft(key, { sense: String(first), dg: '', en: '', sw: '' });
  const dg = draft.dg.trim();

  return (
    <ContributionDialog
      open={open}
      onClose={onClose}
      type="example_sentence"
      title={c.word_menu_example}
      intro={c.example_intro.replace('{word}', word(entry))}
      target={target(entry)}
      draftKey={key}
      resume={{ form: 'example_sentence', target_id: entry.id }}
      payload={dg ? { sense_id: draft.sense, dg, ...(draft.en.trim() && { en: draft.en.trim() }), ...(draft.sw.trim() && { sw: draft.sw.trim() }) } : null}
      askSource
      onSubmitted={() => {
        clear();
        onSubmitted?.();
      }}
    >
      {entry.senses.length > 1 && (
        <Select
          label={c.example_sense_label}
          value={draft.sense}
          onChange={(v) => setDraft({ sense: String(v) })}
          options={entry.senses.map((s, i) => ({ value: String(s.sense_id), label: `${i + 1}. ${senseText(entry, s.sense_id, locale as Locale) || s.definition_en}`.slice(0, 80) }))}
        />
      )}
      <TextArea label={c.example_dg_label} value={draft.dg} onChange={(e) => setDraft({ dg: e.target.value })} maxLength={400} rows={2} autoFocus />
      <TextField label={c.example_en_label} value={draft.en} onChange={(e) => setDraft({ en: e.target.value })} maxLength={400} />
      <TextField label={c.example_sw_label} value={draft.sw} onChange={(e) => setDraft({ sw: e.target.value })} maxLength={400} />
    </ContributionDialog>
  );
}

/** "Another spelling or regional form". The region comes from the common fields. */
export function VariantForm({ open, onClose, entry, onSubmitted }: EntryFormProps) {
  const c = useTranslations().contribute;
  const key = `spelling_variant:${entry.id}`;
  const [draft, setDraft, clear] = useContributionDraft(key, { form: '', kind: 'dialect' as 'spelling' | 'dialect' });
  const form = draft.form.trim();

  return (
    <ContributionDialog
      open={open}
      onClose={onClose}
      type="spelling_variant"
      title={c.word_menu_variant}
      intro={c.variant_intro.replace('{word}', word(entry))}
      target={target(entry)}
      draftKey={key}
      resume={{ form: 'spelling_variant', target_id: entry.id }}
      payload={form ? { form, kind: draft.kind } : null}
      askSource
      onSubmitted={() => {
        clear();
        onSubmitted?.();
      }}
    >
      <TextField label={c.variant_label} value={draft.form} onChange={(e) => setDraft({ form: e.target.value })} maxLength={40} autoFocus />
      <RadioGroup
        label={c.variant_kind_label}
        value={draft.kind}
        onChange={(v) => setDraft({ kind: v as 'spelling' | 'dialect' })}
        options={[
          { value: 'dialect', label: c.variant_kind_dialect },
          { value: 'spelling', label: c.variant_kind_spelling },
        ]}
      />
    </ContributionDialog>
  );
}

const FLAG_REASONS = ['wrong_word', 'wrong_meaning', 'offensive', 'duplicate', 'other'] as const;

/** "Something's wrong": private to the dictionary editors, never published. */
export function FlagForm({ open, onClose, entry, onSubmitted }: EntryFormProps) {
  const c = useTranslations().contribute;
  const key = `entry_flag:${entry.id}`;
  const [draft, setDraft, clear] = useContributionDraft(key, { reason: '' as (typeof FLAG_REASONS)[number] | '', detail: '' });

  return (
    <ContributionDialog
      open={open}
      onClose={onClose}
      type="entry_flag"
      title={c.word_menu_flag}
      intro={c.flag_intro}
      target={target(entry)}
      draftKey={key}
      resume={{ form: 'entry_flag', target_id: entry.id }}
      payload={draft.reason ? { reason: draft.reason, ...(draft.detail.trim() && { detail: draft.detail.trim() }) } : null}
      onSubmitted={() => {
        clear();
        onSubmitted?.();
      }}
    >
      <RadioGroup
        label={c.flag_reason_label}
        value={draft.reason}
        onChange={(v) => setDraft({ reason: v as (typeof FLAG_REASONS)[number] })}
        options={FLAG_REASONS.map((r) => ({ value: r, label: msg(c, `flag_reason_${r}`) }))}
      />
      <TextArea label={c.flag_detail_label} value={draft.detail} onChange={(e) => setDraft({ detail: e.target.value })} maxLength={1000} rows={3} />
    </ContributionDialog>
  );
}

/** "Add a word to the dictionary", usually from a search that found nothing. */
export function NewWordForm({ open, onClose, onSubmitted, headword = '' }: { open: boolean; onClose: () => void; onSubmitted?: () => void; headword?: string }) {
  const c = useTranslations().contribute;
  const key = 'word_addition';
  const [draft, setDraft, clear] = useContributionDraft(key, {
    headword, pos: '', meaning_en: '', meaning_sw: '', definition_dg: '', example_dg: '', example_en: '',
  });
  const h = draft.headword.trim();
  const complete = h && (draft.meaning_en.trim() || draft.meaning_sw.trim());
  const opt = (k: keyof typeof draft) => (draft[k].trim() ? { [k]: draft[k].trim() } : {});

  return (
    <ContributionDialog
      open={open}
      onClose={onClose}
      type="word_addition"
      title={c.type_word_addition}
      intro={c.newword_intro}
      target={{ target_type: 'word' }}
      draftKey={key}
      resume={{ form: 'word_addition', target_id: 'new-word' }}
      payload={complete ? { headword: h, ...opt('pos'), ...opt('meaning_en'), ...opt('meaning_sw'), ...opt('definition_dg'), ...opt('example_dg'), ...opt('example_en') } : null}
      askSource
      onSubmitted={() => {
        clear();
        onSubmitted?.();
      }}
    >
      <TextField label={c.newword_headword_label} value={draft.headword} onChange={(e) => setDraft({ headword: e.target.value })} maxLength={40} autoFocus={!headword} />
      <TextField label={c.newword_meaning_en} value={draft.meaning_en} onChange={(e) => setDraft({ meaning_en: e.target.value })} maxLength={500} autoFocus={!!headword} />
      <TextField label={c.newword_meaning_sw} value={draft.meaning_sw} onChange={(e) => setDraft({ meaning_sw: e.target.value })} maxLength={500} helperText={c.newword_meaning_hint} />
      <TextArea label={c.newword_dg_label} value={draft.definition_dg} onChange={(e) => setDraft({ definition_dg: e.target.value })} maxLength={500} rows={2} />
      <TextField label={c.newword_pos_label} value={draft.pos} onChange={(e) => setDraft({ pos: e.target.value })} maxLength={40} />
      <TextArea label={c.newword_example_dg} value={draft.example_dg} onChange={(e) => setDraft({ example_dg: e.target.value })} maxLength={400} rows={2} />
      {draft.example_dg.trim() && (
        <TextField label={c.newword_example_en} value={draft.example_en} onChange={(e) => setDraft({ example_en: e.target.value })} maxLength={400} />
      )}
    </ContributionDialog>
  );
}
