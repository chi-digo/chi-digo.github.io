'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations, useLocale } from '@/lib/i18n/context';
import { useAuth } from '@/lib/auth/context';
import { Skeleton, Badge } from '@chi-digo/design-system';
import type { ChallengeQuestionFull } from '@/lib/challenge/types';
import styles from './ChallengeCompletionDetail.module.css';

type LocaleKey = 'e' | 's' | 'd';
const LOCALE_MAP: Record<string, LocaleKey> = { en: 'e', sw: 's', dig: 'd' };

interface PlayerAnswer {
  source_question_id: string;
  selected_answer_index: number;
  is_correct: boolean;
}

interface Player {
  display_name: string | null;
  avatar_url?: string | null;
  answers: PlayerAnswer[];
  score: number;
  time_taken_ms: number | null;
  completed_at?: string;
}

interface CompareData {
  questions: ChallengeQuestionFull[];
  player_a: Player;
  player_b: Player;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function shortName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length <= 1) return capitalize(fullName);
  const last = parts[parts.length - 1];
  return `${capitalize(parts[0])} ${last[0].toUpperCase()}.`;
}

export function ChallengeCompletionDetail({ code, completionId }: { code: string; completionId: string }) {
  const t = useTranslations();
  const { user } = useAuth();
  const { locale } = useLocale();
  const lk: LocaleKey = LOCALE_MAP[locale] || 'e';
  const [data, setData] = useState<CompareData | null>(null);
  const [loading, setLoading] = useState(true);

  const categoryLabels: Record<string, string> = {
    vocabulary: t.quiz?.categories?.vocabulary ?? 'Vocabulary',
    proverbs: t.quiz?.categories?.proverbs ?? 'Proverbs',
    riddles: t.quiz?.categories?.riddles ?? 'Riddles',
  };

  useEffect(() => {
    fetch(`/api/challenges/${code}/compare?with=${completionId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((d: CompareData | null) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [code, completionId]);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.skeletonHeader}>
          <Skeleton width={200} height={32} />
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

  if (!data) {
    return <p className={styles.error}>Completion not found.</p>;
  }

  const challengerName = shortName(data.player_a.display_name ?? 'Mtu wa Chidigo');
  const myAvatarUrl = user?.user_metadata?.avatar_url as string | undefined;
  const myInitial = user?.user_metadata?.full_name?.[0]?.toUpperCase() ?? '?';
  const challengerAvatarUrl = data.player_a.avatar_url;
  const challengerInitial = (data.player_a.display_name ?? 'M')[0].toUpperCase();

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.scoreCompare}>
          <div className={styles.playerScore}>
            {myAvatarUrl ? (
              <img src={myAvatarUrl} alt="" className={styles.avatar} referrerPolicy="no-referrer" />
            ) : (
              <div className={styles.avatarFallback}>{myInitial}</div>
            )}
            <span className={styles.playerValue}>{data.player_b.score}/{data.questions.length}</span>
          </div>
          <span className={styles.vs}>vs</span>
          <div className={styles.playerScore}>
            {challengerAvatarUrl ? (
              <img src={challengerAvatarUrl} alt="" className={styles.avatar} referrerPolicy="no-referrer" />
            ) : (
              <div className={styles.avatarFallback}>{challengerInitial}</div>
            )}
            <span className={styles.playerValue}>{data.player_a.score}/{data.questions.length}</span>
          </div>
        </div>
        {data.player_b.completed_at && (
          <p className={styles.date}>
            {new Date(data.player_b.completed_at).toLocaleDateString(undefined, {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
        )}
        <Link href={`/challenge/${code}/leaderboard`} className={styles.leaderboardLink}>
          {t.challenge?.view_leaderboard ?? 'View leaderboard'} →
        </Link>
      </div>

      <ol className={styles.questionList}>
        {data.questions.map((q, i) => {
          const myAnswer = data.player_b.answers.find((a) => a.source_question_id === q.source_question_id);
          const challengerAnswer = data.player_a.answers.find((a) => a.source_question_id === q.source_question_id);
          const myCorrect = myAnswer?.is_correct ?? false;
          const opts = q.options[lk];

          return (
            <li
              key={q.source_question_id}
              className={`${styles.questionItem} ${myCorrect ? styles.correct : styles.incorrect}`}
            >
              <div className={styles.questionHeader}>
                <span className={styles.questionNumber}>Q{i + 1}</span>
                <Badge>{categoryLabels[q.category]}</Badge>
                <span className={styles.resultIcon} aria-hidden="true">
                  {myCorrect ? '✓' : '✗'}
                </span>
              </div>
              <p className={styles.questionText}>{q.question_text[lk]}</p>
              <ul className={styles.optionsList}>
                {opts.map((opt, idx) => {
                  const isMySelection = myAnswer?.selected_answer_index === idx;
                  const isChallengerSelection = challengerAnswer?.selected_answer_index === idx;
                  const isCorrectOpt = idx === q.correct_answer_index;
                  let cls = styles.option;
                  if (isCorrectOpt) cls += ` ${styles.optionCorrect}`;
                  else if (isMySelection && !myCorrect) cls += ` ${styles.optionWrong}`;

                  return (
                    <li key={idx} className={cls}>
                      {opt}
                      {isMySelection && <span className={styles.selectedMark}> ← {t.challenge?.you ?? 'you'}</span>}
                      {isChallengerSelection && <span className={styles.selectedMark}> ← {challengerName}</span>}
                    </li>
                  );
                })}
              </ul>
              {!myCorrect && q.explanation && (
                <p className={styles.explanation}>{q.explanation[lk]}</p>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
