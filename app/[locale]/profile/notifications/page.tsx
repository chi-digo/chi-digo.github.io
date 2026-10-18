'use client';

import { useEffect, useState } from 'react';
import { EmptyState, Skeleton, VisuallyHidden } from '@chi-digo/design-system';
import { AuthGuard } from '@/components/AuthGuard';
import { TrackedLink } from '@/components/Analytics/TrackedLink';
import { useLocale, useTranslations } from '@/lib/i18n/context';
import { msg, useContributorStatus } from '@/lib/contributions/client';
import { track } from '@/lib/analytics/track';
import styles from '../contributions/contributions.module.css';

interface Notification {
  id: number;
  kind: string;
  contribution_id: string | null;
  read_at: string | null;
  created_at: string;
  contribution: {
    type: string;
    target_label: string | null;
    summary: string;
    review_note: string | null;
  } | null;
}

/** Where a notification leads: your own suggestions, or the item to review. */
function hrefFor(n: Notification): string {
  if (n.kind === 'second_review' || n.kind === 'report_hidden') return n.contribution_id ? `/review/${n.contribution_id}` : '/review';
  if (n.kind === 'fold_failed') return '/review';
  return n.contribution_id ? `/profile/contributions#c-${n.contribution_id}` : '/profile/contributions';
}

function NotificationsContent() {
  const c = useTranslations().contribute;
  const { locale } = useLocale();
  const { refresh } = useContributorStatus();
  const [items, setItems] = useState<Notification[] | null>(null);
  const [failed, setFailed] = useState(false);
  const dateLocale = locale === 'en' ? 'en-GB' : 'sw-KE';

  useEffect(() => {
    let live = true;
    fetch('/api/notifications')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((list: Notification[]) => {
        if (!live) return;
        setItems(list);
        track('contribute', 'notifications', 'view', { unread: list.filter((n) => !n.read_at).length });
        // Seeing the list reads what was shown (not anything that arrived since).
        const unread = list.filter((n) => !n.read_at).map((n) => n.id);
        if (unread.length) {
          return fetch('/api/notifications', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids: unread }),
          }).then(() => refresh());
        }
      })
      .catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
  }, [refresh]);

  const sentence = (n: Notification) => {
    const summary = n.contribution?.summary || msg(c, `type_${n.contribution?.type ?? 'general_feedback'}`);
    const target = n.contribution?.target_label ?? '';
    // Sentences that name the item have a version without it, so no language is left with a dangling "for".
    const key = !target && (n.kind === 'accepted' || n.kind === 'second_review') ? `notif_${n.kind}_notarget` : `notif_${n.kind}`;
    return msg(c, key).replace('{summary}', summary).replace('{target}', target);
  };

  return (
    <main className={styles.page}>
      <div className={styles.content}>
        <header className={styles.header}>
          <h1 className={styles.title}>{c.notifications_title}</h1>
          <p className={styles.muted}>{c.notifications_intro}</p>
        </header>
        {failed ? (
          <p className={styles.error}>{c.error_generic}</p>
        ) : items === null ? (
          <Skeleton height="120px" />
        ) : items.length === 0 ? (
          <EmptyState title={c.notifications_empty} />
        ) : (
          <ul className={styles.list}>
            {items.map((n) => (
              <li key={n.id} className={styles.item}>
                <p className={styles.summary} id={`n-${n.id}`}>
                  {!n.read_at && (
                    <>
                      <span className={styles.unread} aria-hidden="true" />
                      <VisuallyHidden>{c.unread.replace('{n}', '1')}: </VisuallyHidden>
                    </>
                  )}
                  {sentence(n)}
                </p>
                {n.contribution?.review_note && <p className={styles.reviewNote}>{n.contribution.review_note}</p>}
                <div className={styles.itemFoot}>
                  <span>{new Date(n.created_at).toLocaleString(dateLocale, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                  <TrackedLink href={hrefFor(n)} source="notifications" className={styles.link} aria-describedby={`n-${n.id}`}>{c.notif_open}</TrackedLink>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}

export default function NotificationsPage() {
  return (
    <AuthGuard>
      <NotificationsContent />
    </AuthGuard>
  );
}
