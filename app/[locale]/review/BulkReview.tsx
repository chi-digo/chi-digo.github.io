'use client';

import { useEffect, useRef, useState } from 'react';
import { BottomSheet, Button, Select, TextArea } from '@chi-digo/design-system';
import { TrackedLink } from '@/components/Analytics/TrackedLink';
import { WordDiff } from '@/components/Contribute/WordDiff';
import { useTranslations } from '@/lib/i18n/context';
import { msg } from '@/lib/contributions/client';
import { DECLINE_REASONS } from '@/lib/contributions/schemas';
import { track } from '@/lib/analytics/track';
import styles from './review.module.css';

export type BulkAction = 'accept' | 'accept_confirm' | 'confirm' | 'decline';
type Item = { label: string | null; lang: unknown; current: string | null; proposed: unknown; source: string | null; swahili: string | null; reason: unknown };
type Result = { id: string; ok: boolean; would?: 'live' | 'awaiting_second'; status?: string; live_status?: string; error?: string; item?: Item };

/** What a skipped or failed item says, in the reviewer's language. */
function useReasonText() {
  const t = useTranslations();
  const r = t.review;
  const c = t.contribute;
  const map: Record<string, string> = {
    ruled_out: r.err_ruled_out, pii: r.err_pii, target_changed: r.err_target_changed, conflict: r.err_conflict, forbidden: r.err_forbidden,
    self_review: r.bulk_err_self_review, rate_cap: r.err_rate, not_attempted: r.bulk_err_not_attempted, claimed: r.bulk_err_claimed,
    already_decided: r.bulk_err_already_decided, same_target_in_batch: r.bulk_err_same_target, own_accept: r.bulk_err_own_accept,
    not_found: r.bulk_err_not_found, too_long_ui: c.error_too_long_ui, placeholders: c.error_placeholders, links: c.error_links,
    markers: c.error_markers, unchanged: c.error_unchanged, markup: c.error_markup,
  };
  return (code?: string) => (code && map[code]) || c.error_generic;
}

/**
 * The check-then-send sheet for bulk review (spec 34 §19.1): the server's dry run says what each selected fix
 * would do; the reviewer can drop any of them, then sends. Results stay on screen with what wasn't done.
 */
export function BulkSheet({ action, ids, onClose, onDone }: { action: BulkAction; ids: string[]; onClose: () => void; onDone: () => void }) {
  const t = useTranslations();
  const r = t.review;
  const c = t.contribute;
  const reasonText = useReasonText();
  const [plan, setPlan] = useState<{ results: Result[]; accepts_left: number } | null>(null);
  const [failed, setFailed] = useState(false);
  const [keep, setKeep] = useState<Set<string>>(new Set());
  const [reason, setReason] = useState<string>('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<Result[] | null>(null);
  const doneRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    let live = true;
    fetch('/api/review/bulk', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, ids, dry_run: true, ...(action === 'decline' && { reason: 'wrong_text' }) }) })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((d: { results: Result[]; accepts_left: number }) => {
        if (!live) return;
        setPlan(d);
        setKeep(new Set(d.results.filter((x) => x.ok).map((x) => x.id)));
      })
      .catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
  }, [action, ids]);

  useEffect(() => {
    if (done) doneRef.current?.focus();
  }, [done]);

  const send = async () => {
    setBusy(true);
    const res = await fetch('/api/review/bulk', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ids: [...keep], ...(action === 'decline' && { reason, ...(note.trim() && { note: note.trim() }) }) }),
    });
    setBusy(false);
    if (!res.ok) {
      setFailed(true);
      onDone();
      return;
    }
    const d = (await res.json()) as { results: Result[] };
    track('contribute', 'review', `bulk_${action}`, { count: keep.size, ok: d.results.filter((x) => x.ok).length });
    setDone(d.results);
    onDone();
  };

  const ok = plan?.results.filter((x) => x.ok) ?? [];
  const skipped = plan?.results.filter((x) => !x.ok) ?? [];
  const goLive = ok.filter((x) => keep.has(x.id) && (x.would === 'live' || action === 'confirm' || action === 'decline')).length;
  const wait = ok.filter((x) => keep.has(x.id) && x.would === 'awaiting_second').length;
  const submitLabel = { accept: r.bulk_submit_accept, accept_confirm: r.bulk_submit_accept_confirm, confirm: r.bulk_submit_confirm, decline: r.bulk_submit_decline }[action];
  const fate = (x: Result) =>
    action === 'decline' ? r.bulk_will_decline : action === 'accept_confirm' ? r.bulk_alone : x.would === 'awaiting_second' ? r.bulk_waits : r.bulk_go_live;

  return (
    <BottomSheet open onClose={onClose} title={r.bulk_sheet_title.replace('{n}', String(ids.length))} size="full">
      <div className={styles.sheet}>
        {failed && <p className={styles.error} role="alert">{c.error_generic}</p>}
        {!plan && !failed && <p className={styles.muted}>{t.dictionary.searching}</p>}
        {done ? (
          <section aria-labelledby="bulk-done">
            <h3 id="bulk-done" ref={doneRef} tabIndex={-1} className={styles.boxTitle}>
              {r.bulk_results_counts.replace('{ok}', String(done.filter((x) => x.ok).length)).replace('{failed}', String(done.filter((x) => !x.ok).length))}
            </h3>
            <ul className={styles.items}>
              {done.map((x) => (
                <li key={x.id} className={styles.bulkRow}>
                  <TrackedLink href={`/review/${x.id}`} source="review_bulk" className={styles.link}>
                    {x.ok ? (x.live_status === 'awaiting_second' ? r.bulk_waits : x.status === 'declined' ? r.bulk_declined : r.bulk_live) : reasonText(x.error)}
                  </TrackedLink>
                </li>
              ))}
            </ul>
            <Button onClick={onClose}>{r.bulk_close}</Button>
          </section>
        ) : plan && (
          <>
            <p role="status">
              {action === 'decline'
                ? r.bulk_counts_decline.replace('{n}', String(keep.size)).replace('{skip}', String(skipped.length))
                : r.bulk_counts.replace('{live}', String(goLive)).replace('{wait}', String(wait)).replace('{skip}', String(skipped.length))}
              {(action === 'accept' || action === 'accept_confirm') && <> · {r.bulk_accepts_left.replace('{n}', String(plan.accepts_left))}</>}
            </p>
            {skipped.length > 0 && (
              <details className={styles.bulkSkipped}>
                <summary>{r.bulk_skipped.replace('{n}', String(skipped.length))}</summary>
                <ul>
                  {skipped.map((x) => (
                    <li key={x.id}>
                      {x.item?.label ?? ''}: {reasonText(x.error)} ·{' '}
                      <TrackedLink href={`/review/${x.id}`} source="review_bulk" className={styles.link}>{r.bulk_open_alone}</TrackedLink>
                    </li>
                  ))}
                </ul>
              </details>
            )}
            <ul className={styles.items}>
              {ok.map((x) => (
                <li key={x.id} className={styles.bulkCard}>
                  <label className={styles.bulkCheck}>
                    <input
                      type="checkbox"
                      checked={keep.has(x.id)}
                      onChange={(e) => setKeep((s) => {
                        const next = new Set(s);
                        if (e.target.checked) next.add(x.id);
                        else next.delete(x.id);
                        return next;
                      })}
                    />
                    <strong>{x.item?.label ?? ''}</strong>
                    {x.item?.lang ? <span className={styles.muted}> · {msg(c, `lang_${x.item.lang}`)}</span> : null}
                  </label>
                  <p className={styles.muted}>{fate(x)}</p>
                  {x.item?.source && <p className={styles.text}><span className={styles.muted}>{r.bulk_source}: </span><span lang="en">{x.item.source}</span></p>}
                  {x.item?.swahili && x.item.lang === 'dg' && <p className={styles.text}><span className={styles.muted}>{r.bulk_source_sw}: </span><span lang="sw">{x.item.swahili}</span></p>}
                  <p className={styles.text}>
                    <WordDiff before={x.item?.current ?? ''} after={String(x.item?.proposed ?? '')} />
                  </p>
                  {x.item?.reason ? <p className={styles.muted}>{r.bulk_why}: {String(x.item.reason)}</p> : null}
                  <TrackedLink href={`/review/${x.id}`} source="review_bulk" className={styles.link}>{r.bulk_open_alone}</TrackedLink>
                </li>
              ))}
            </ul>
            {action === 'decline' && (
              <div className={styles.bulkDecline}>
                <Select
                  label={r.bulk_reason}
                  value={reason}
                  placeholder="—"
                  onChange={setReason}
                  options={DECLINE_REASONS.map((k) => ({ value: k, label: msg(c, `decline_${k}`) }))}
                />
                <TextArea label={r.bulk_note} value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} rows={2} />
              </div>
            )}
            <div className={styles.bulkSubmit}>
              <Button onClick={send} loading={busy} disabled={busy || keep.size === 0 || (action === 'decline' && !reason)}>
                {submitLabel.replace('{n}', String(keep.size))}
              </Button>
              <Button variant="ghost" onClick={onClose}>{r.cancel}</Button>
            </div>
          </>
        )}
      </div>
    </BottomSheet>
  );
}
