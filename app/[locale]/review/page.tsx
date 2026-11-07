'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Button, EmptyState, Skeleton, Tabs } from '@chi-digo/design-system';
import { AuthGuard } from '@/components/AuthGuard';
import { TrackedLink } from '@/components/Analytics/TrackedLink';
import { useTranslations } from '@/lib/i18n/context';
import { msg, useContributorStatus } from '@/lib/contributions/client';
import { payloadSummary } from '@/lib/contributions/display';
import { track } from '@/lib/analytics/track';
import { BulkSheet, type BulkAction } from './BulkReview';
import styles from './review.module.css';

interface QueueItem {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  base?: { value?: { headword?: string } } | null;
  region: string | null;
  confidence: string | null;
  status: string;
  live_status: string | null;
  fold_status: string | null;
  agree_count: number;
  held: boolean;
  hidden_at: string | null;
  stale: boolean; overdue?: boolean; overdue_days?: number;
  claimed_by_other: boolean;
  changed: boolean;
  contributor: { first_name: string | null; submitted: number; accepted: number; is_you: boolean };
}

interface Group {
  target_type: string | null;
  target_id: string | null;
  target_label: string | null;
  items: QueueItem[];
}

type View = 'open' | 'attention' | 'live';

/** Translation fixes this reviewer could decide alone, in this tab (spec 34 §19.1). */
function selectable(it: QueueItem, view: View) {
  if (it.type !== 'translation_fix' || it.contributor.is_you || it.claimed_by_other) return false;
  return view === 'open' ? ['pending', 'needs_info'].includes(it.status) : it.status === 'accepted' && it.live_status === 'awaiting_second';
}

/** A tri-state "select these" checkbox: all, some (mixed) or none of the given ids. */
function SelectBox({ ids, selected, onChange, label }: { ids: string[]; selected: Set<string>; onChange: (ids: string[], on: boolean) => void; label: string }) {
  const ref = useRef<HTMLInputElement>(null);
  const n = ids.filter((id) => selected.has(id)).length;
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = n > 0 && n < ids.length;
  }, [n, ids.length]);
  return (
    <label className={styles.bulkCheck}>
      <input ref={ref} type="checkbox" checked={n === ids.length && n > 0} onChange={(e) => onChange(ids, e.target.checked)} />
      <span>{label}</span>
    </label>
  );
}

function QueueList({ view, confirmAlone }: { view: View; confirmAlone: boolean }) {
  const t = useTranslations();
  const r = t.review;
  const c = t.contribute;
  const [groups, setGroups] = useState<Group[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sheet, setSheet] = useState<BulkAction | null>(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    fetch(`/api/review/queue?view=${view}`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((d) => setGroups(d.groups))
      .catch(() => setFailed(true));
  }, [view, reload]);

  if (failed) return <p className={styles.error}>{c.error_generic}</p>;
  if (!groups) return <Skeleton height="120px" />;
  if (!groups.length) return <EmptyState title={r.empty} />;

  const bulk = view === 'open' || view === 'attention';
  const all = groups.flatMap((g) => g.items.filter((it) => selectable(it, view)).map((it) => it.id));
  const pick = (ids: string[], on: boolean) => setSelected((s) => {
    const next = new Set(s);
    for (const id of ids) {
      if (on && next.size < 50) next.add(id);
      if (!on) next.delete(id);
    }
    return next;
  });
  const ids = [...selected].filter((id) => all.includes(id));

  return (
    <div className={bulk && all.length ? styles.withBar : undefined}>
      {bulk && all.length > 1 && <SelectBox ids={all.slice(0, 50)} selected={selected} onChange={pick} label={r.bulk_select_all} />}
      {groups.map((g) => {
        const eligible = g.items.filter((it) => selectable(it, view)).map((it) => it.id);
        return (
        <section key={`${g.target_type}:${g.target_id ?? g.items[0].id}`} className={styles.group}>
          <h2 className={styles.groupTitle}>
            {g.target_label || g.target_id || msg(c, `type_${g.items[0].type}`)}
            {g.items.length > 1 && <span className={styles.muted}> · {r.suggestions_count.replace('{n}', String(g.items.length))}</span>}
          </h2>
          {bulk && eligible.length > 1 && (
            <SelectBox ids={eligible} selected={selected} onChange={pick}
              label={r.bulk_select_group.replace('{n}', String(eligible.length)).replace('{m}', String(g.items.length))} />
          )}
          <ul className={styles.items}>
            {g.items.map((it) => (
              <li key={it.id} className={styles.bulkRow}>
                {bulk && selectable(it, view) && (
                  <input
                    type="checkbox"
                    className={styles.rowCheck}
                    checked={selected.has(it.id)}
                    onChange={(e) => pick([it.id], e.target.checked)}
                    aria-label={r.bulk_select_item.replace('{item}', `${msg(c, `type_${it.type}`)}: ${payloadSummary(it.payload)}`)}
                  />
                )}
                <TrackedLink href={`/review/${it.id}`} source="review_queue" className={styles.itemLink}>
                  <span className={styles.itemMain}>
                    {it.type === 'headword_change'
                      ? <strong>{r.headword_change_label.replace('{from}', it.base?.value?.headword ?? '').replace('{to}', payloadSummary(it.payload))}</strong>
                      : <><strong>{msg(c, `type_${it.type}`)}</strong>: {payloadSummary(it.payload)}</>}
                  </span>
                  <span className={styles.flags}>
                    {it.region && <span>{msg(c, `region_${it.region}`)}</span>}
                    {it.confidence && <span>{msg(c, `confidence_${it.confidence}`)}</span>}
                    {it.agree_count > 0 && <span>{c.panel_agree_count.replace('{n}', String(it.agree_count))}</span>}
                    {it.type !== 'headword_change' && <span>{it.contributor.is_you ? r.you : it.contributor.first_name ?? '—'}</span>}
                    {it.held && <span className={styles.flag}>{r.held}</span>}
                    {it.hidden_at && <span className={styles.flag}>{r.hidden}</span>}
                    {it.stale && <span className={styles.flag}>{r.stale}</span>}
                    {it.overdue && <span className={styles.flag}>{it.overdue_days === 7 ? r.overdue_7d : r.overdue}</span>}
                    {it.changed && <span className={styles.flag}>{r.changed}</span>}
                    {it.claimed_by_other && <span className={styles.flag}>{r.claimed}</span>}
                    {it.live_status === 'awaiting_second' && <span className={styles.flag}>{r.awaiting_second}</span>}
                    {it.live_status === 'conflict' && <span className={styles.flag}>{r.conflict}</span>}
                  </span>
                </TrackedLink>
              </li>
            ))}
          </ul>
        </section>
        );
      })}
      {bulk && all.length > 0 && (
        <div className={styles.bulkBar} role="region" aria-label={r.bulk_bar}>
          <span aria-live="polite">{r.bulk_selected.replace('{n}', String(ids.length))}</span>
          {view === 'open' ? (
            <>
              <Button size="sm" disabled={!ids.length} onClick={() => setSheet('accept')}>{r.bulk_accept}</Button>
              {confirmAlone && <Button size="sm" variant="secondary" disabled={!ids.length} onClick={() => setSheet('accept_confirm')}>{r.bulk_accept_confirm}</Button>}
              <Button size="sm" variant="ghost" disabled={!ids.length} onClick={() => setSheet('decline')}>{r.bulk_decline}</Button>
            </>
          ) : (
            <Button size="sm" disabled={!ids.length} onClick={() => setSheet('confirm')}>{r.bulk_confirm}</Button>
          )}
        </div>
      )}
      {sheet && (
        <BulkSheet
          action={sheet}
          ids={ids}
          onClose={() => setSheet(null)}
          onDone={() => {
            setSelected(new Set());
            setReload((n) => n + 1);
          }}
        />
      )}
    </div>
  );
}

function PublishingSwitch({ onConfirmAlone }: { onConfirmAlone: (on: boolean) => void }) {
  const r = useTranslations().review;
  const [paused, setPaused] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [lastFold, setLastFold] = useState<string | null>(null);
  const [folding, setFolding] = useState(false);
  const [foldAsked, setFoldAsked] = useState(false);
  const [uiAlone, setUiAlone] = useState(false);

  const load = useCallback(() => {
    fetch('/api/admin/settings')
      .then((res) => (res.ok ? res.json() : null))
      .then((d) => {
        if (!d) return;
        setPaused(d.publishing_paused);
        setUiAlone(d.ui_self_confirm === true);
        onConfirmAlone(d.ui_self_confirm === true);
        const last = (d.fold_events as { action: string; created_at: string }[]).find((e) => e.action !== 'fold_requested');
        setLastFold(last ? `${new Date(last.created_at).toLocaleString()} (${last.action.replace('fold_', '')})` : null);
      })
      .catch(() => {});
  }, [onConfirmAlone]);
  useEffect(load, [load]);

  if (paused === null) return null;
  const toggle = async () => {
    setBusy(true);
    const res = await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ publishing_paused: !paused }),
    });
    setBusy(false);
    if (res.ok) {
      track('contribute', 'review', paused ? 'resume_publishing' : 'pause_publishing', {});
      setPaused(!paused);
    }
  };
  const foldNow = async () => {
    setFolding(true);
    const res = await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fold_now: true }),
    });
    setFolding(false);
    if (res.ok) {
      track('contribute', 'review', 'fold_now', {});
      setFoldAsked(true);
    }
  };
  const toggleUiAlone = async () => {
    const res = await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ui_self_confirm: !uiAlone }),
    });
    if (res.ok) {
      track('contribute', 'review', uiAlone ? 'ui_two_voices' : 'ui_self_confirm', {});
      setUiAlone(!uiAlone);
      onConfirmAlone(!uiAlone);
    }
  };
  return (
    <>
      <div className={styles.banner} role="status">
        <span>{paused ? r.paused_banner : r.live_banner}</span>
        <Button size="sm" variant={paused ? 'primary' : 'secondary'} onClick={toggle} loading={busy}>
          {paused ? r.resume : r.pause}
        </Button>
      </div>
      <div className={styles.banner}>
        <span>{foldAsked ? r.fold_requested : lastFold ? r.fold_last.replace('{when}', lastFold) : r.fold_never}</span>
        <Button size="sm" variant="secondary" onClick={foldNow} loading={folding} disabled={foldAsked}>{r.fold_now}</Button>
      </div>
      {/* Interface fixes need two voices; the owner may let an admin confirm one alone (spec 34 §17.12). */}
      <div className={styles.banner}>
        <span>{uiAlone ? r.ui_alone_on : r.ui_alone_off}</span>
        <Button size="sm" variant="secondary" onClick={toggleUiAlone}>{uiAlone ? r.ui_alone_turn_off : r.ui_alone_turn_on}</Button>
      </div>
    </>
  );
}

function ReviewQueue() {
  const t = useTranslations();
  const r = t.review;
  const { status } = useContributorStatus();
  const [confirmAlone, setConfirmAlone] = useState(false);
  if (!status) return null;
  if (status.blocked || (status.role !== 'admin' && status.role !== 'reviewer')) {
    return <main className={styles.page}><div className={styles.content}><p>{r.err_forbidden}</p></div></main>;
  }
  return (
    <main className={styles.page}>
      <div className={styles.content}>
        <header>
          <h1 className={styles.title}>{r.title}</h1>
          <p className={styles.muted}>{r.intro}</p>
        </header>
        {status.role === 'admin' && <PublishingSwitch onConfirmAlone={setConfirmAlone} />}
        <Tabs
          items={[
            { id: 'open', label: r.tab_open, content: <QueueList view="open" confirmAlone={confirmAlone} /> },
            { id: 'attention', label: r.tab_attention, content: <QueueList view="attention" confirmAlone={confirmAlone} /> },
            { id: 'live', label: r.tab_live, content: <QueueList view="live" confirmAlone={confirmAlone} /> },
          ]}
        />
      </div>
    </main>
  );
}

export default function ReviewPage() {
  return (
    <AuthGuard>
      <ReviewQueue />
    </AuthGuard>
  );
}
