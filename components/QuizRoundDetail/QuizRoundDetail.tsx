'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from '@/lib/i18n/context';
import { Skeleton, Badge } from '@chi-digo/design-system';
import styles from './QuizRoundDetail.module.css';

interface QuizAnswer {
  id: string;
  question_index: number;
  question_text: string;
  options: { id: string; text: string }[];
  selected_option_id: string;
  correct_option_id: string;
  is_correct: boolean;
  category: string;
  difficulty: string;
  explanation: string | null;
}

interface RoundWithAnswers {
  id: string;
  played_at: string;
  score: number;
  total: number;
  time_taken_ms: number | null;
  answers: QuizAnswer[];
  challenge_code: string | null;
}

export function QuizRoundDetail({ roundId }: { roundId: string }) {
  const t = useTranslations();
  const [round, setRound] = useState<RoundWithAnswers | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/quiz/rounds/${roundId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: RoundWithAnswers | null) => setRound(data))
      .catch(() => setRound(null))
      .finally(() => setLoading(false));
  }, [roundId]);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.skeletonHeader}>
          <Skeleton width={80} height={32} />
          <Skeleton width={180} height={14} />
        </div>
        <div className={styles.skeletonList}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={styles.skeletonQuestion}>
              <div className={styles.skeletonQuestionHeader}>
                <Skeleton width={20} height={14} />
                <Skeleton variant="rectangular" width={64} height={22} />
                <Skeleton width={16} height={16} style={{ marginLeft: 'auto' }} />
              </div>
              <div className={styles.skeletonQuestionText}>
                <Skeleton width="95%" height={15} />
                <Skeleton width="60%" height={15} />
              </div>
              <div className={styles.skeletonOptions}>
                <Skeleton width="70%" height={22} />
                <Skeleton width="55%" height={22} />
                <Skeleton width="65%" height={22} />
                <Skeleton width="50%" height={22} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!round) {
    return <p className={styles.error}>Round not found.</p>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.score}>{round.score}/{round.total}</h2>
        <p className={styles.date}>
          {new Date(round.played_at).toLocaleDateString(undefined, {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })}
        </p>
        {round.challenge_code && (
          <Link href={`/challenge/${round.challenge_code}/leaderboard`} className={styles.leaderboardLink}>
            {t.challenge?.view_leaderboard ?? 'View leaderboard'} →
          </Link>
        )}
      </div>

      <ol className={styles.questionList}>
        {round.answers.map((answer) => (
          <li
            key={answer.id}
            className={`${styles.questionItem} ${answer.is_correct ? styles.correct : styles.incorrect}`}
          >
            <div className={styles.questionHeader}>
              <span className={styles.questionNumber}>Q{answer.question_index + 1}</span>
              <Badge>{answer.category}</Badge>
              <span className={styles.resultIcon} aria-hidden="true">
                {answer.is_correct ? '✓' : '✗'}
              </span>
            </div>
            <p className={styles.questionText}>{answer.question_text}</p>
            <ul className={styles.optionsList}>
              {answer.options.map((opt) => {
                const isSelected = opt.id === answer.selected_option_id;
                const isCorrect = opt.id === answer.correct_option_id;
                let className = styles.option;
                if (isCorrect) className += ` ${styles.optionCorrect}`;
                else if (isSelected && !answer.is_correct) className += ` ${styles.optionWrong}`;

                return (
                  <li key={opt.id} className={className}>
                    {opt.text}
                    {isSelected && <span className={styles.selectedMark}> ← your answer</span>}
                  </li>
                );
              })}
            </ul>
            {answer.explanation && !answer.is_correct && (
              <p className={styles.explanation}>{answer.explanation}</p>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
