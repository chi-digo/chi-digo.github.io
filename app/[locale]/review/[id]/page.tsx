'use client';

import { use, useCallback, useEffect, useState } from 'react';
import { Button, Select, Skeleton, TextArea, TextField } from '@chi-digo/design-system';
import { AuthGuard } from '@/components/AuthGuard';
import { TrackedLink } from '@/components/Analytics/TrackedLink';
import { useTranslations } from '@/lib/i18n/context';
import { msg, useContributorStatus } from '@/lib/contributions/client';
import { payloadSummary } from '@/lib/contributions/display';
import { refreshPlantOverlay } from '@/lib/plants/loader';
import { track } from '@/lib/analytics/track';
import styles from '../review.module.css';

interface Item {
  id: string;
  type: string;
  scope: string;
  target_type: string | null;
  target_id: string | null;
  target_label: string | null;
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
  current: { label: string; value: unknown } | null;
  changed: boolean;
  warnings: { ruled_out: { found: string; right: string }[]; pii: boolean };
  agreements: { region: string | null; confidence: string | null; counted: boolean }[];
  others: { id: string; type: string; payload: Record<string, unknown>; status: string }[];
}

/** The text fields a reviewer may edit before accepting, per type. */
const EDITABLE: Record<string, string[]> = {
  plant_name: ['name', 'other_names'],
  plant_info: ['text'],
};

function currentText(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && 'digo_headword' in (value as object)) return String((value as { digo_headword: string | null }).digo_headword ?? '');
  return JSON.stringify(value);
}

function ReviewItem({ id }: { id: string }) {
  const t = useTranslations();
  const r = t.review;
  const c = t.contribute;
  const { status } = useContributorStatus();
  const [detail, setDetail] = useState<Detail | null>(null);
  const [failed, setFailed] = useState(false);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [note, setNote] = useState('');
  const [duplicateOf, setDuplicateOf] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState('');

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
  const edited = Object.keys(edits).some((k) => String(base[k] ?? '') !== edits[k].trim());

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
      };
      setMessage(map[data.error] ?? c.error_generic);
      return;
    }
    track('contribute', 'review', action, { type: item.type });
    // This tab's plant pages must show the decision straight away.
    if (['accept', 'accept_variant', 'second_confirm', 'revert', 'retry_fold'].includes(action)) refreshPlantOverlay();
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
      {detail.warnings.ruled_out.map((w) => (
        <p key={w.found} className={styles.warning}>{r.warn_ruled_out.replace('{found}', w.found).replace('{right}', w.right)}</p>
      ))}
      {detail.warnings.pii && <p className={styles.warning}>{r.warn_pii}</p>}
      {item.fold_error && <p className={styles.warning}>{item.fold_error}</p>}

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
        <p className={styles.text}>{item.type === 'plant_name' ? String(item.payload.name) : payloadSummary(item.payload)}</p>
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
            k === 'text' ? (
              <TextArea key={k} label={c.info_label} value={edits[k] ?? ''} onChange={(e) => setEdits({ ...edits, [k]: e.target.value })} rows={6} />
            ) : (
              <TextField key={k} label={k === 'name' ? c.name_label : c.other_names_label} value={edits[k] ?? ''} onChange={(e) => setEdits({ ...edits, [k]: e.target.value })} />
            ),
          )}
        </section>
      )}

      <section className={styles.box}>
        <TextArea label={r.note} value={note} onChange={(e) => setNote(e.target.value)} maxLength={2000} rows={2} />
        <div className={styles.actions}>
          {open && (
            <>
              <Button onClick={() => accept(false)} loading={busy === 'accept'}>{r.accept}</Button>
              {item.type === 'plant_name' && (
                <Button variant="secondary" onClick={() => accept(true)} loading={busy === 'accept_variant'}>{r.accept_variant}</Button>
              )}
              <Button variant="secondary" onClick={() => act('needs_info')} loading={busy === 'needs_info'} disabled={!note.trim()}>{r.needs_info}</Button>
              <Button variant="ghost" onClick={() => act('decline')} loading={busy === 'decline'}>{r.decline}</Button>
            </>
          )}
          {item.status === 'accepted' && item.live_status === 'awaiting_second' && (
            <>
              <Button onClick={() => act('second_confirm')} loading={busy === 'second_confirm'}>{r.second_confirm}</Button>
              <Button variant="ghost" onClick={() => act('second_reject')} loading={busy === 'second_reject'}>{r.second_reject}</Button>
            </>
          )}
          {item.status === 'accepted' && (item.live_status === 'conflict' || item.fold_status === 'failed') && (
            <Button onClick={() => act('retry_fold', edited ? { final_payload: finalPayload } : {})} loading={busy === 'retry_fold'}>{r.retry}</Button>
          )}
          {item.status === 'accepted' && status?.role === 'admin' && item.live_status !== 'reverting' && (
            <Button variant="danger" onClick={() => act('revert')} loading={busy === 'revert'}>{r.revert}</Button>
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
