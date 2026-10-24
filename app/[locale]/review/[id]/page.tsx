'use client';

import { Fragment, use, useCallback, useEffect, useState } from 'react';
import { Button, RadioGroup, Select, Skeleton, TextArea, TextField } from '@chi-digo/design-system';
import { PROVERB_THEMES } from '@/lib/proverbs/themes';
import { AuthGuard } from '@/components/AuthGuard';
import { TrackedLink } from '@/components/Analytics/TrackedLink';
import { useLocale, useTranslations } from '@/lib/i18n/context';
import { msg, useContributorStatus } from '@/lib/contributions/client';
import { payloadSummary } from '@/lib/contributions/display';
import { WordDiff } from '@/components/Contribute/WordDiff';
import { refreshPlantOverlay } from '@/lib/plants/loader';
import { refreshWordOverlay } from '@/lib/dictionary/loader';
import { refreshProverbOverlay } from '@/lib/proverbs/loader';
import { NEVER_PUBLIC, type ContributionType } from '@/lib/contributions/schemas';
import { track } from '@/lib/analytics/track';
import styles from '../review.module.css';

interface Item {
  id: string;
  type: string;
  scope: string;
  target_type: string | null;
  target_id: string | null;
  target_label: string | null;
  base?: { value: unknown } | null;
  page_path: string | null;
  payload: Record<string, unknown>;
  final_payload: Record<string, unknown> | null;
  note: string | null;
  region: string | null;
  village: string | null;
  confidence: string | null;
  status: string;
  live_status: string | null;
  fold_status: string | null;
  fold_error: string | null;
  reply: string | null;
  review_note: string | null;
  agree_count: number;
  raw_agree_count: number;
  held: boolean;
  hidden_at: string | null;
  created_at: string;
}

interface Detail {
  item: Item;
  contributor: { first_name: string | null; submitted: number; accepted: number; is_you: boolean };
  current: { label: string; value: unknown; source?: string | null; block?: string | null } | null;
  changed: boolean;
  warnings: { ruled_out: { found: string; right: string }[]; pii: boolean };
  agreements: { region: string | null; confidence: string | null; counted: boolean }[];
  others: { id: string; type: string; payload: Record<string, unknown>; status: string }[];
  can_self_confirm: boolean;
  dependants?: { id: string; type: string }[];
}

/** The text fields a reviewer may edit before accepting, per type. */
const EDITABLE: Record<string, string[]> = {
  plant_name: ['name', 'other_names'],
  plant_info: ['text'],
  word_addition: ['headword', 'meaning_en', 'meaning_sw', 'definition_dg', 'example_dg', 'example_en'],
  definition_update: ['text'],
  example_sentence: ['dg', 'en', 'sw'],
  spelling_variant: ['form'],
  proverb_addition: ['digo', 'meaning_en', 'meaning_sw', 'meaning_dg', 'literal_en', 'usage', 'literal_sw', 'swahili'],
  proverb_variant: ['form', 'note'],
  proverb_meaning: ['text'],
  proverb_context: ['text'],
  translation_fix: ['proposed'],
};

/** Proverb field labels (the word labels above are for the dictionary). */
const PROVERB_LABEL: Record<string, string> = {
  digo: 'pv_digo_label', meaning_en: 'pv_meaning_en', meaning_sw: 'pv_meaning_sw', meaning_dg: 'pv_meaning_dg',
  literal_en: 'pv_literal_en', usage: 'pv_usage_label', form: 'pv_variant_label', note: 'pv_variant_note_label',
};

/** Labels for the editable fields that aren't plain text areas. */
const FIELD_LABEL: Record<string, string> = {
  name: 'name_label', other_names: 'other_names_label', headword: 'newword_headword_label', meaning_en: 'newword_meaning_en',
  meaning_sw: 'newword_meaning_sw', definition_dg: 'newword_dg_label', example_dg: 'newword_example_dg', example_en: 'newword_example_en',
  dg: 'example_dg_label', en: 'example_en_label', sw: 'example_sw_label', form: 'variant_label', proposed: 'tf_label',
};
const LONG_FIELDS = ['text', 'definition_dg', 'example_dg', 'dg', 'usage', 'proposed'];

function currentText(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && 'digo_headword' in (value as object)) return String((value as { digo_headword: string | null }).digo_headword ?? '');
  if (typeof value === 'object' && 'text' in (value as object)) return String((value as { text: string | null }).text ?? '');
  return JSON.stringify(value);
}

function ReviewItem({ id }: { id: string }) {
  const t = useTranslations();
  const r = t.review;
  const c = t.contribute;
  const { locale } = useLocale();
  const { status } = useContributorStatus();
  const [detail, setDetail] = useState<Detail | null>(null);
  const [failed, setFailed] = useState(false);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [note, setNote] = useState('');
  const [duplicateOf, setDuplicateOf] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  // Completing a new proverb at accept (spec 34 §16.9): themes and the mature decision.
  const [themes, setThemes] = useState<string[]>([]);
  const [mature, setMature] = useState<'' | 'yes' | 'no'>('');

  const load = useCallback(() => {
    fetch(`/api/review/${id}`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((d: Detail) => {
        setDetail(d);
        setEdits(Object.fromEntries((EDITABLE[d.item.type] ?? []).map((k) => [k, String((d.item.final_payload ?? d.item.payload)[k] ?? '')])));
      })
      .catch(() => setFailed(true));
  }, [id]);

  useEffect(() => {
    load();
    track('contribute', 'review', 'review_open', {});
  }, [id, load]);

  // An open item someone else suggested is claimed for 30 minutes while it's on screen, so two
  // reviewers don't decide it at once; the claim is released on leaving.
  const claimable = !!detail && ['pending', 'needs_info'].includes(detail.item.status) && !detail.contributor.is_you;
  useEffect(() => {
    if (!claimable) return;
    const post = (action: string) =>
      fetch(`/api/review/${id}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action }), keepalive: true }).catch(() => {});
    post('claim');
    return () => {
      post('release');
    };
  }, [claimable, id]);

  if (failed) return <p className={styles.error}>{r.err_forbidden}</p>;
  if (!detail) return <Skeleton height="240px" />;
  const { item } = detail;
  const open = item.status === 'pending' || item.status === 'needs_info';
  const base = item.final_payload ?? item.payload;
  // Edits replace fields; an emptied optional field is removed.
  const finalPayload: Record<string, unknown> = { ...base };
  for (const [k, v] of Object.entries(edits)) {
    if (v.trim()) finalPayload[k] = v.trim();
    else delete finalPayload[k];
  }
  if (item.type === 'proverb_addition') {
    if (themes.length) finalPayload.themes = themes;
    if (mature) finalPayload.mature = mature === 'yes';
  }
  const edited = Object.keys(edits).some((k) => String(base[k] ?? '') !== edits[k].trim())
    || (item.type === 'proverb_addition' && (themes.length > 0 || mature !== ''));
  const label = (k: string) =>
    k === 'literal_sw' ? r.rv_literal_sw : k === 'swahili' ? r.rv_swahili
      : item.type.startsWith('proverb_') && PROVERB_LABEL[k] ? msg(c, PROVERB_LABEL[k])
      : k === 'text' ? c.info_label : msg(c, FIELD_LABEL[k] ?? k);

  const act = async (action: string, extra: Record<string, unknown> = {}) => {
    setBusy(action);
    setMessage('');
    const res = await fetch(`/api/review/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...(note.trim() && { note: note.trim() }), ...extra }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(null);
    if (!res.ok) {
      const map: Record<string, string> = {
        conflict: r.err_conflict,
        target_changed: r.err_target_changed,
        variant_required: r.err_variant_required,
        ruled_out: r.err_ruled_out,
        self_review: r.err_self,
        rate_cap: r.err_rate,
        forbidden: r.err_forbidden,
        not_acceptable: r.err_not_acceptable,
        locked_fields: r.err_locked_fields,
        note_required: r.err_note_required,
        has_dependants: r.err_has_dependants,
        pii: r.err_pii,
        too_long: r.err_too_long,
        mature_required: r.rv_mature_required,
      };
      setMessage(map[data.error] ?? c.error_generic);
      return;
    }
    track('contribute', 'review', action, { type: item.type });
    // This tab's plant pages must show the decision straight away.
    if (['accept', 'accept_variant', 'second_confirm', 'self_confirm', 'revert', 'retry_fold'].includes(action)) {
      refreshPlantOverlay();
      refreshWordOverlay();
      refreshProverbOverlay();
    }
    setMessage(r.done);
    load();
  };

  const accept = (variant: boolean) =>
    act(variant ? 'accept_variant' : 'accept', edited || item.final_payload ? { final_payload: finalPayload } : {});

  return (
    <>
      <TrackedLink href="/review" source="review_item" className={styles.muted}>← {r.back}</TrackedLink>
      <h1 className={styles.title}>{item.target_label || msg(c, `type_${item.type}`)}</h1>
      <div className={styles.flags}>
        <span>{msg(c, `type_${item.type}`)}</span>
        <span>{msg(c, `status_${item.status}`)}</span>
        {item.held && <span className={styles.flag}>{r.held}</span>}
        {item.hidden_at && <span className={styles.flag}>{r.hidden}</span>}
        {item.live_status === 'awaiting_second' && <span className={styles.flag}>{r.awaiting_second}</span>}
        {item.live_status === 'conflict' && <span className={styles.flag}>{r.conflict}</span>}
        {item.page_path && /^\/(?!\/)/.test(item.page_path) && (
          <a href={item.page_path} target="_blank" rel="noopener noreferrer" className={styles.link}>{r.open_page}</a>
        )}
      </div>

      {detail.changed && <p className={styles.warning}>{r.err_target_changed}</p>}
      {detail.can_self_confirm && <p className={styles.muted}>{r.self_confirm_note}</p>}
      {!!detail.dependants?.length && (
        <div className={styles.warning}>
          <p>{r.err_has_dependants}</p>
          <ul>{detail.dependants.map((d) => <li key={d.id}><TrackedLink href={`/review/${d.id}`} source="review_dependant">{msg(c, `type_${d.type}`)}</TrackedLink></li>)}</ul>
        </div>
      )}
      {detail.warnings.ruled_out.map((w) => (
        <p key={w.found} className={styles.warning}>{r.warn_ruled_out.replace('{found}', w.found).replace('{right}', w.right)}</p>
      ))}
      {detail.warnings.pii && <p className={styles.warning}>{r.warn_pii}</p>}
      {item.fold_error && <p className={styles.warning}>{item.fold_error}</p>}

      {item.type === 'translation_fix' && detail.current?.source && (
        <section className={styles.box}>
          <h2 className={styles.boxTitle}>{c.tf_source}</h2>
          <p className={styles.text} lang="en">{detail.current.source}</p>
        </section>
      )}
      {detail.current && (
        <section className={styles.box}>
          <h2 className={styles.boxTitle}>{r.current}</h2>
          <p className={styles.text}>{currentText(detail.current.value) || r.current_none}</p>
        </section>
      )}

      <section className={styles.box}>
        <h2 className={styles.boxTitle}>{r.suggestion}</h2>
        {item.type === 'plant_info' && (
          <p className={styles.muted}>
            {t.plants[String(base.section) as 'about'] ?? String(base.section)} · {msg(c, `lang_${base.lang}`)} · {base.mode === 'replace' ? c.info_mode_replace : c.info_mode_add}
          </p>
        )}
        {item.type === 'definition_update' && (
          <p className={styles.muted}>
            {msg(c, `lang_${base.lang}`)} · {base.mode === 'add_sense' ? c.def_mode_add : c.def_mode_replace}
            {base.mode === 'replace' ? ` · ${base.sense_id}` : ''}
          </p>
        )}
        {item.type === 'entry_flag' && <p className={styles.muted}>{msg(c, `flag_reason_${base.reason}`)}</p>}
        {item.type === 'word_addition' && (
          <dl className={styles.facts}>
            {(['meaning_en', 'meaning_sw', 'definition_dg', 'pos', 'example_dg', 'example_en', 'example_sw'] as const).map((k) =>
              base[k] ? (<Fragment key={k}><dt>{msg(c, FIELD_LABEL[k] ?? k)}</dt><dd>{String(base[k])}</dd></Fragment>) : null,
            )}
          </dl>
        )}
        {item.type === 'example_sentence' && (base.en || base.sw) ? <p className={styles.muted}>{[base.en, base.sw].filter(Boolean).join(' · ')}</p> : null}
        {item.type === 'spelling_variant' && <p className={styles.muted}>{base.kind === 'dialect' ? c.variant_kind_dialect : c.variant_kind_spelling}</p>}
        {item.type === 'proverb_meaning' && (
          <p className={styles.muted}>{base.kind === 'literal' ? c.pv_kind_literal : c.pv_kind_idiomatic} · {msg(c, `lang_${base.lang}`)}</p>
        )}
        {item.type === 'proverb_context' && <p className={styles.muted}>{msg(c, `lang_${base.lang}`)}</p>}
        {item.type === 'translation_fix' && (
          <>
            <p className={styles.muted}>{msg(c, `tf_${base.field}`).replace('{term}', detail.current?.block ?? '').replace(/^: /, '')} · {msg(c, `lang_${base.lang}`)}</p>
            {/* What changes, word by word, against the text the fix was made on. */}
            <WordDiff before={currentText(item.base?.value ?? detail.current?.value)} after={String(base.proposed ?? '')} />
            {base.reason ? <p className={styles.muted}><strong>{c.tf_reason}</strong> “{String(base.reason)}”</p> : null}
          </>
        )}
        {item.type === 'proverb_variant' && base.note ? <p className={styles.muted}>{String(base.note)}</p> : null}
        {item.type === 'proverb_addition' && (
          <dl className={styles.facts}>
            {(['meaning_en', 'meaning_sw', 'meaning_dg', 'literal_en', 'usage'] as const).map((k) =>
              base[k] ? (<Fragment key={k}><dt>{label(k)}</dt><dd>{String(base[k])}</dd></Fragment>) : null,
            )}
            {base.mature ? (<><dt>{r.rv_mature}</dt><dd>{r.rv_mature_yes}</dd></>) : null}
          </dl>
        )}
        <p className={styles.text}>
          {item.type === 'plant_name' ? String(item.payload.name)
            : item.type === 'word_addition' ? String(base.headword)
            : item.type === 'example_sentence' ? String(base.dg)
            : item.type === 'proverb_addition' ? String(base.digo)
            : item.type === 'proverb_variant' ? String(base.form)
            : item.type === 'entry_flag' ? String(base.detail ?? '')
            : item.type === 'translation_fix' ? ''
            : payloadSummary(item.payload)}
        </p>
        {item.type === 'definition_update' && base.reason ? <p className={styles.muted}>“{String(base.reason)}”</p> : null}
        {item.type === 'plant_name' && item.payload.other_names ? <p className={styles.muted}>{String(item.payload.other_names)}</p> : null}
        {item.note && <p className={styles.muted}>“{item.note}”</p>}
        {item.reply && <p className={styles.muted}><strong>{r.reply}:</strong> {item.reply}</p>}
        <dl className={styles.facts}>
          <dt>{r.contributor}</dt>
          <dd>
            {detail.contributor.is_you ? r.you : detail.contributor.first_name ?? '—'} ·{' '}
            {r.record.replace('{accepted}', String(detail.contributor.accepted)).replace('{submitted}', String(detail.contributor.submitted))}
          </dd>
          {item.region && (<><dt>{r.region}</dt><dd>{msg(c, `region_${item.region}`)}</dd></>)}
          {item.village && (<><dt>{r.village}</dt><dd>{item.village}</dd></>)}
          {item.confidence && (<><dt>{r.confidence}</dt><dd>{msg(c, `confidence_${item.confidence}`)}</dd></>)}
          <dt>{c.panel_agree}</dt>
          <dd>
            {r.agreements.replace('{n}', String(item.agree_count)).replace('{raw}', String(item.raw_agree_count))}
            {detail.agreements.length > 0 && ` · ${[...new Set(detail.agreements.map((a) => a.region).filter(Boolean))].map((x) => msg(c, `region_${x}`)).join(', ')}`}
          </dd>
        </dl>
      </section>

      {detail.others.length > 0 && (
        <section className={styles.box}>
          <h2 className={styles.boxTitle}>{r.others}</h2>
          {detail.others.map((o) => (
            <p key={o.id} className={styles.text}>
              <TrackedLink href={`/review/${o.id}`} source="review_item">{payloadSummary(o.payload)}</TrackedLink>
              <span className={styles.muted}> · {msg(c, `status_${o.status}`)}</span>
            </p>
          ))}
        </section>
      )}

      {(open || (status?.role === 'admin' && (item.live_status === 'conflict' || item.fold_status === 'failed'))) && (EDITABLE[item.type] ?? []).length > 0 && (
        <section className={styles.box}>
          <h2 className={styles.boxTitle}>{r.edit}</h2>
          {(EDITABLE[item.type] ?? []).map((k) =>
            LONG_FIELDS.includes(k) ? (
              <TextArea key={k} label={label(k)} value={edits[k] ?? ''} onChange={(e) => setEdits({ ...edits, [k]: e.target.value })} rows={k === 'text' ? 6 : 3} />
            ) : (
              <TextField key={k} label={label(k)} value={edits[k] ?? ''} onChange={(e) => setEdits({ ...edits, [k]: e.target.value })} />
            ),
          )}
          {item.type === 'proverb_addition' && open && (
            <>
              <p className={styles.boxTitle}>{r.rv_complete}</p>
              <p className={styles.muted}>{r.rv_themes}</p>
              <div className={styles.actions}>
                {PROVERB_THEMES.map((th) => (
                  <Button
                    key={th.slug}
                    variant={themes.includes(th.slug) ? 'primary' : 'secondary'}
                    onClick={() => setThemes(themes.includes(th.slug) ? themes.filter((x) => x !== th.slug) : [...themes, th.slug].slice(0, 5))}
                  >
                    {th.title[locale]}
                  </Button>
                ))}
              </div>
              <RadioGroup
                label={r.rv_mature}
                value={mature}
                onChange={(v) => setMature(v as 'yes' | 'no')}
                options={[{ value: 'no', label: r.rv_mature_no }, { value: 'yes', label: r.rv_mature_yes }]}
              />
            </>
          )}
        </section>
      )}

      <section className={styles.box}>
        <TextArea label={r.note} value={note} onChange={(e) => setNote(e.target.value)} maxLength={2000} rows={2} />
        <div className={styles.actions}>
          {open && NEVER_PUBLIC.includes(item.type as ContributionType) && (
            <>
              <Button onClick={() => act('resolve')} loading={busy === 'resolve'} disabled={!note.trim()}>{r.resolve}</Button>
              <Button variant="ghost" onClick={() => act('decline')} loading={busy === 'decline'}>{r.decline}</Button>
            </>
          )}
          {open && !NEVER_PUBLIC.includes(item.type as ContributionType) && (
            <>
              <Button onClick={() => accept(false)} loading={busy === 'accept'} disabled={item.type === 'proverb_addition' && !mature}>{r.accept}</Button>
              {item.type === 'plant_name' && (
                <Button variant="secondary" onClick={() => accept(true)} loading={busy === 'accept_variant'}>{r.accept_variant}</Button>
              )}
              <Button variant="secondary" onClick={() => act('needs_info')} loading={busy === 'needs_info'} disabled={!note.trim()}>{r.needs_info}</Button>
              <Button variant="ghost" onClick={() => act('decline')} loading={busy === 'decline'}>{r.decline}</Button>
            </>
          )}
          {item.status === 'accepted' && item.live_status === 'awaiting_second' && detail.can_self_confirm && (
            <Button onClick={() => act('self_confirm')} loading={busy === 'self_confirm'}>{r.self_confirm}</Button>
          )}
          {item.status === 'accepted' && item.live_status === 'awaiting_second' && !detail.can_self_confirm && (
            <>
              <Button onClick={() => act('second_confirm')} loading={busy === 'second_confirm'}>{r.second_confirm}</Button>
              <Button variant="ghost" onClick={() => act('second_reject')} loading={busy === 'second_reject'}>{r.second_reject}</Button>
            </>
          )}
          {item.status === 'accepted' && (item.live_status === 'conflict' || item.fold_status === 'failed') && (
            <Button onClick={() => act('retry_fold', edited ? { final_payload: finalPayload } : {})} loading={busy === 'retry_fold'}>{r.retry}</Button>
          )}
          {item.status === 'accepted' && status?.role === 'admin' && item.live_status !== 'reverting' && (
            <Button variant="danger" onClick={() => act('revert')} loading={busy === 'revert'} disabled={!!detail.dependants?.length}>{r.revert}</Button>
          )}
        </div>
        {open && detail.others.length > 0 && (
          <div className={styles.actions}>
            <Select
              label={r.duplicate}
              value={duplicateOf}
              placeholder="—"
              onChange={setDuplicateOf}
              options={detail.others.map((o) => ({ value: o.id, label: payloadSummary(o.payload).slice(0, 60) }))}
            />
            <Button variant="ghost" onClick={() => act('duplicate', { duplicate_of: duplicateOf })} disabled={!duplicateOf} loading={busy === 'duplicate'}>
              {r.duplicate}
            </Button>
          </div>
        )}
        {message && (message === r.done
          ? <p className={styles.muted} role="status">{message}</p>
          : <p className={styles.error} role="alert">{message}</p>)}
      </section>
    </>
  );
}

export default function ReviewItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const r = useTranslations().review;
  const { status } = useContributorStatus();
  return (
    <AuthGuard>
      <main className={styles.page}>
        <div className={styles.content}>
          {status && (status.role === 'admin' || status.role === 'reviewer') && !status.blocked ? <ReviewItem id={id} /> : status ? <p>{r.err_forbidden}</p> : null}
        </div>
      </main>
    </AuthGuard>
  );
}
