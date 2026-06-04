'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useTranslations } from '@/lib/i18n/context';
import { Badge, EmptyState, Skeleton } from '@chi-digo/design-system';
import { track } from '@/lib/analytics/track';
import styles from './ChallengeHistory.module.css';

interface Challenge {
  id: string;
  short_code: string;
  score: number;
  total: number;
  status: string;
  created_at: string;
  completions_count: number;
}

function ChallengeSkeleton() {
  return (
    <div className={styles.container}>
      <ul className={styles.list}>
        {[1, 2, 3].map((i) => (
          <li key={i} className={styles.skeletonItem}>
            <div className={styles.skeletonInfo}>
              <Skeleton width={48} height={15} />
              <Skeleton width={120} height={13} />
            </div>
            <Skeleton width={10} height={19} />
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ChallengeHistory() {
  const t = useTranslations();
  const [challenges, setChallenges] = useState<Challenge[] | null>(null);
  const [loading, setLoading] = useState(true);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    fetch('/api/challenges/mine')
      .then((res) => (res.ok ? res.json() : { challenges: [] }))
      .then((data: { challenges: Challenge[] }) => setChallenges(data.challenges))
      .catch(() => setChallenges([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <ChallengeSkeleton />;
  }

  if (!challenges || challenges.length === 0) {
    return (
      <EmptyState
        title={t.profile?.no_challenges ?? 'No challenges yet'}
        description={t.profile?.no_challenges_hint ?? 'Complete a quiz and challenge a friend to see your challenges here.'}
      />
    );
  }

  return (
    <div className={styles.container}>
      <ul className={styles.list}>
        {challenges.map((c) => (
          <li key={c.id} className={styles.item}>
            <Link
              href={`/challenge/${c.short_code}/leaderboard`}
              className={styles.link}
              onClick={() => track('orientation', 'challenge_history', 'challenge_click', { challenge_id: c.id })}
            >
              <div className={styles.info}>
                <div className={styles.topRow}>
                  <span className={styles.score}>{c.score}/{c.total}</span>
                  {c.status === 'expired' && <Badge>{t.challenge?.expired_label ?? 'Expired'}</Badge>}
                </div>
                <div className={styles.meta}>
                  <span className={styles.date}>
                    {new Date(c.created_at).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                  <span className={styles.completions}>
                    {c.completions_count === 1
                      ? (t.profile?.challenge_completer_one ?? '1 response')
                      : (t.profile?.challenge_completers ?? '{n} responses').replace('{n}', String(c.completions_count))}
                  </span>
                </div>
              </div>
              <span className={styles.arrow} aria-hidden="true">›</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
