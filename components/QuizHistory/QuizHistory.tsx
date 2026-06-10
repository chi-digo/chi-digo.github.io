'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useTranslations } from '@/lib/i18n/context';
import { StatCard, Sparkline, EmptyState, Skeleton, Badge } from '@chi-digo/design-system';
import { track } from '@/lib/analytics/track';
import styles from './QuizHistory.module.css';

interface QuizRound {
  id: string;
  played_at: string;
  score: number;
  total: number;
  time_taken_ms: number | null;
  category_breakdown: Record<string, { correct: number; total: number }> | null;
  type?: 'quiz' | 'challenge';
  short_code?: string | null;
  spawned_challenge?: string | null;
}

function QuizSkeleton() {
  return (
    <div className={styles.container}>
      <div className={styles.stats}>
        <Skeleton variant="rectangular" height={72} />
        <Skeleton variant="rectangular" height={72} />
        <Skeleton variant="rectangular" height={72} />
      </div>
      <div className={styles.sparklineWrapper}>
        <Skeleton variant="rectangular" width={280} height={48} />
      </div>
      <ul className={styles.roundList}>
        {[1, 2, 3, 4].map((i) => (
          <li key={i} className={styles.skeletonRound}>
            <div className={styles.skeletonRoundInfo}>
              <Skeleton width={48} height={15} />
              <Skeleton width={100} height={13} />
            </div>
            <Skeleton width={10} height={19} />
          </li>
        ))}
      </ul>
    </div>
  );
}

export function QuizHistory() {
  const t = useTranslations();
  const [rounds, setRounds] = useState<QuizRound[] | null>(null);
  const [loading, setLoading] = useState(true);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    fetch('/api/quiz/rounds')
      .then((res) => (res.ok ? res.json() : []))
      .then((data: QuizRound[]) => setRounds(data))
      .catch(() => setRounds([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <QuizSkeleton />;
  }

  if (!rounds || rounds.length === 0) {
    return (
      <EmptyState
        title={t.profile.no_quiz_history}
        description={t.profile.no_quiz_history_hint}
      />
    );
  }

  const scores = rounds.map((r) => r.score).reverse();
  const totalRounds = rounds.length;
  const avgScore = (rounds.reduce((sum, r) => sum + r.score, 0) / totalRounds).toFixed(1);
  const bestScore = Math.max(...rounds.map((r) => r.score));

  return (
    <div className={styles.container}>
      <div className={styles.stats}>
        <StatCard label={t.profile.total_rounds} value={totalRounds} />
        <StatCard label={t.profile.average_score} value={`${avgScore}/10`} />
        <StatCard label={t.profile.best_score} value={`${bestScore}/10`} />
      </div>

      {scores.length >= 2 && (
        <div className={styles.sparklineWrapper}>
          <Sparkline
            data={scores}
            width={280}
            height={48}
            color="var(--color-mnazi-gold)"
            strokeWidth={2}
            aria-label="Score trend"
          />
        </div>
      )}

      <ul className={styles.roundList}>
        {rounds.map((round) => {
          const isChallenge = round.type === 'challenge';
          const hasSpawnedChallenge = !isChallenge && !!round.spawned_challenge;
          const href = isChallenge && round.short_code
            ? `/challenge/${round.short_code}/leaderboard`
            : hasSpawnedChallenge
              ? `/challenge/${round.spawned_challenge}/leaderboard`
              : `/profile/quiz/${round.id}`;

          return (
            <li key={round.id} className={styles.roundItem}>
              <Link
                href={href}
                className={styles.roundLink}
                onClick={() => track('orientation', 'quiz_history', 'round_click', { round_id: round.id, score: round.score, type: round.type ?? 'quiz' })}
              >
                <div className={styles.roundInfo}>
                  <span className={styles.roundScore}>
                    {round.score}/{round.total}
                  </span>
                  <span className={styles.roundDate}>
                    {new Date(round.played_at).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <span className={styles.roundEnd}>
                  {isChallenge && <Badge>{t.profile?.challenge_badge ?? 'Challenge'}</Badge>}
                  {hasSpawnedChallenge && <Badge variant="editorial">{t.profile?.challenge_badge ?? 'Challenge'}</Badge>}
                  <span className={styles.roundArrow} aria-hidden="true">›</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
