'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button, EmptyState, Skeleton, Tabs } from '@chi-digo/design-system';
import { AuthGuard } from '@/components/AuthGuard';
import { TrackedLink } from '@/components/Analytics/TrackedLink';
import { useTranslations } from '@/lib/i18n/context';
import { msg, useContributorStatus } from '@/lib/contributions/client';
import { payloadSummary } from '@/lib/contributions/display';
import { track } from '@/lib/analytics/track';
import styles from './review.module.css';

interface QueueItem {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  region: string | null;
  confidence: string | null;
  status: string;
  live_status: string | null;
  fold_status: string | null;
  agree_count: number;
  held: boolean;
  hidden_at: string | null;
  stale: boolean;
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

function QueueList({ view }: { view: View }) {
  const t = useTranslations();
  const r = t.review;
  const c = t.contribute;
  const [groups, setGroups] = useState<Group[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    fetch(`/api/review/queue?view=${view}`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((d) => setGroups(d.groups))
      .catch(() => setFailed(true));
  }, [view]);

  if (failed) return <p className={styles.error}>{c.error_generic}</p>;
  if (!groups) return <Skeleton height="120px" />;
  if (!groups.length) return <EmptyState title={r.empty} />;

  return (
    <div>
      {groups.map((g) => (
        <section key={`${g.target_type}:${g.target_id ?? g.items[0].id}`} className={styles.group}>
          <h2 className={styles.groupTitle}>
            {g.target_label || g.target_id || msg(c, `type_${g.items[0].type}`)}
            {g.items.length > 1 && <span className={styles.muted}> · {r.suggestions_count.replace('{n}', String(g.items.length))}</span>}
          </h2>
          <ul className={styles.items}>
            {g.items.map((it) => (
              <li key={it.id}>
                <TrackedLink href={`/review/${it.id}`} source="review_queue" className={styles.itemLink}>
                  <span className={styles.itemMain}>
                    <strong>{msg(c, `type_${it.type}`)}</strong>: {payloadSummary(it.payload)}
                  </span>
                  <span className={styles.flags}>
                    {it.region && <span>{msg(c, `region_${it.region}`)}</span>}
                    {it.confidence && <span>{msg(c, `confidence_${it.confidence}`)}</span>}
                    {it.agree_count > 0 && <span>{c.panel_agree_count.replace('{n}', String(it.agree_count))}</span>}
                    <span>{it.contributor.is_you ? r.you : it.contributor.first_name ?? '—'}</span>
                    {it.held && <span className={styles.flag}>{r.held}</span>}
                    {it.hidden_at && <span className={styles.flag}>{r.hidden}</span>}
                    {it.stale && <span className={styles.flag}>{r.stale}</span>}
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
      ))}
    </div>
  );
}

function PublishingSwitch() {
  const r = useTranslations().review;
  const [paused, setPaused] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [lastFold, setLastFold] = useState<string | null>(null);
  const [folding, setFolding] = useState(false);
  const [foldAsked, setFoldAsked] = useState(false);

  const load = useCallback(() => {
    fetch('/api/admin/settings')
      .then((res) => (res.ok ? res.json() : null))
      .then((d) => {
        if (!d) return;
        setPaused(d.publishing_paused);
        const last = (d.fold_events as { action: string; created_at: string }[]).find((e) => e.action !== 'fold_requested');
        setLastFold(last ? `${new Date(last.created_at).toLocaleString()} (${last.action.replace('fold_', '')})` : null);
      })
      .catch(() => {});
  }, []);
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
    </>
  );
}

function ReviewQueue() {
  const t = useTranslations();
  const r = t.review;
  const { status } = useContributorStatus();
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
        {status.role === 'admin' && <PublishingSwitch />}
        <Tabs
          items={[
            { id: 'open', label: r.tab_open, content: <QueueList view="open" /> },
            { id: 'attention', label: r.tab_attention, content: <QueueList view="attention" /> },
            { id: 'live', label: r.tab_live, content: <QueueList view="live" /> },
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
