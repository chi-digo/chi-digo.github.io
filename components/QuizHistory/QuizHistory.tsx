'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from '@/lib/i18n/context';
import { StatCard, Sparkline, EmptyState, KayambaLoader } from '@chi-digo/design-system';
import styles from './QuizHistory.module.css';

interface QuizRound {
  id: string;
  played_at: string;
  score: number;
  total: number;
  time_taken_ms: number | null;
  category_breakdown: Record<string, { correct: number; total: number }> | null;
}

export function QuizHistory() {
  const t = useTranslations();
  const [rounds, setRounds] = useState<QuizRound[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/quiz/rounds')
      .then((res) => (res.ok ? res.json() : []))
      .then((data: QuizRound[]) => setRounds(data))
      .catch(() => setRounds([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className={styles.loading}>
        <KayambaLoader size="md" />
      </div>
    );
  }

  if (rounds.length === 0) {
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
        {rounds.map((round) => (
          <li key={round.id} className={styles.roundItem}>
            <Link href={`/profile/quiz/${round.id}`} className={styles.roundLink}>
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
              <span className={styles.roundArrow} aria-hidden="true">›</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
