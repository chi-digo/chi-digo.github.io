'use client';

import { RadioGroup, TextArea, TextField } from '@chi-digo/design-system';
import { useLocale, useTranslations } from '@/lib/i18n/context';
import { msg, useContributionDraft } from '@/lib/contributions/client';
import type { Plant, SectionKey } from '@/lib/plants/types';
import type { Locale } from '@/lib/i18n/config';
import { ContributionDialog } from './ContributionDialog';
import styles from './Contribute.module.css';

interface FormProps {
  open: boolean;
  onClose: () => void;
  plant: Plant;
  onSubmitted?: () => void;
}

/** "Do you know the right name?" (plant_name, product spec §5). Pick a proposal or write another. */
export function PlantNameForm({ open, onClose, plant, onSubmitted, prefill }: FormProps & { prefill?: string }) {
  const c = useTranslations().contribute;
  // "I say it differently" starts from the suggestion it answers, not from an older draft.
  const key = prefill ? `plant_name:${plant.slug}:variant` : `plant_name:${plant.slug}`;
  const [draft, setDraft, clear] = useContributionDraft(key, { name: prefill ?? '', other_names: '', choice: 'other' as 'proposal' | 'other' });
  const name = draft.name.trim();
  const proposals = [...new Set(plant.digo_proposals.map((p) => p.name))];

  return (
    <ContributionDialog
      open={open}
      onClose={onClose}
      type="plant_name"
      title={c.name_title}
      intro={c.name_intro}
      target={{ target_type: 'plant', target_id: plant.slug }}
      draftKey={key}
      resume={{ form: 'plant_name', target_id: plant.slug }}
      payload={name ? { name, choice: draft.choice, ...(draft.other_names.trim() && { other_names: draft.other_names.trim() }) } : null}
      askSource
      onSubmitted={() => {
        clear();
        onSubmitted?.();
      }}
    >
      {proposals.length > 0 && (
        <div>
          <p className={styles.legend}>{c.name_pick}</p>
          <div className={styles.chips}>
            {proposals.map((p) => (
              <button
                key={p}
                type="button"
                className={`${styles.chip} ${draft.choice === 'proposal' && draft.name === p ? styles.chipOn : ''}`}
                aria-pressed={draft.choice === 'proposal' && draft.name === p}
                onClick={() => setDraft({ name: p, choice: 'proposal' })}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}
      <TextField
        label={c.name_label}
        value={draft.name}
        onChange={(e) => setDraft({ name: e.target.value, choice: proposals.includes(e.target.value) ? 'proposal' : 'other' })}
        maxLength={80}
        autoFocus
      />
      <TextField label={c.other_names_label} value={draft.other_names} onChange={(e) => setDraft({ other_names: e.target.value })} maxLength={300} />
    </ContributionDialog>
  );
}

/** "Suggest a correction" on a plant section (plant_info), in the language being read. */
export function PlantInfoForm({ open, onClose, plant, onSubmitted, section, sectionTitle }: FormProps & { section: SectionKey; sectionTitle: string }) {
  const t = useTranslations();
  const c = t.contribute;
  const { locale } = useLocale();
  const key = `plant_info:${plant.slug}:${section}:${locale}`;
  const [draft, setDraft, clear] = useContributionDraft(key, { mode: 'add' as 'add' | 'replace', text: '' });
  // The text the reader sees: their language, or the English shown in its place.
  const current = plant.sections[section]?.[locale as Locale] || plant.sections[section]?.en || '';
  const text = draft.text.trim();

  return (
    <ContributionDialog
      open={open}
      onClose={onClose}
      type="plant_info"
      title={c.info_title}
      intro={c.info_intro.replace('{section}', sectionTitle).replace('{language}', msg(c, `lang_${locale}`))}
      target={{ target_type: 'plant', target_id: plant.slug }}
      draftKey={key}
      resume={{ form: 'plant_info', target_id: plant.slug, extra: { section } }}
      payload={text ? { section, lang: locale, mode: draft.mode, text } : null}
      askSource
      onSubmitted={() => {
        clear();
        onSubmitted?.();
      }}
    >
      <TextArea
        label={c.info_label}
        value={draft.text}
        onChange={(e) => setDraft({ text: e.target.value })}
        maxLength={2000}
        rows={5}
        autoFocus
      />
      {current && (
        <RadioGroup
          label={c.info_mode_label}
          value={draft.mode}
          onChange={(v) => {
            const mode = v as 'add' | 'replace';
            setDraft({ mode, ...(mode === 'replace' && !draft.text && { text: current }) });
          }}
          options={[
            { value: 'add', label: c.info_mode_add },
            { value: 'replace', label: c.info_mode_replace },
          ]}
        />
      )}
    </ContributionDialog>
  );
}
