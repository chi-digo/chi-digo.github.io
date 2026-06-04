'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useTranslations } from '@/lib/i18n/context';
import { track } from '@/lib/analytics/track';
import { Button, Badge, Skeleton } from '@chi-digo/design-system';
import styles from './LeaderboardPage.module.css';

interface Completion {
  id: string;
  display_name: string;
  avatar_url: string | null;
  score: number;
  time_taken_ms: number | null;
  completed_at: string;
}

interface ChallengeData {
  id: string;
  challenger: { display_name: string | null; avatar_url: string | null; score: number };
  score: number;
  total: number;
  created_at: string;
  completions_count: number;
  status: string;
}

function formatTime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return minutes > 0 ? `${minutes}m ${secs}s` : `${secs}s`;
}

export function LeaderboardPage({ code }: { code: string }) {
  const t = useTranslations();
  const [challenge, setChallenge] = useState<ChallengeData | null>(null);
  const [completions, setCompletions] = useState<Completion[]>([]);
  const [loading, setLoading] = useState(true);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    fetch(`/api/challenges/${code}/completions`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setChallenge(data.challenge);
          setCompletions(data.completions ?? []);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [code]);

  if (loading) {
    return (
      <div className={styles.page}>
        <main className={styles.main}>
          <div className={styles.card}>
            <div className={styles.header}>
              <Skeleton width={200} height={28} />
              <Skeleton width={70} height={50} />
              <Skeleton width={110} height={14} />
            </div>
            <div className={styles.shareRow}>
              <Skeleton width={185} height={44} />
            </div>
            <div className={styles.leaderboardSection}>
              <Skeleton width={130} height={22} />
              <Skeleton width="100%" height={44} />
              <Skeleton width="100%" height={44} />
            </div>
            <Skeleton width={100} height={14} />
          </div>
        </main>
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className={styles.page}>
        <main className={styles.main}>
          <p className={styles.notFound}>{t.challenge?.not_found ?? 'Challenge not found'}</p>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.card}>
          <div className={styles.header}>
            <h1 className={styles.title}>{t.challenge?.your_challenge ?? 'Your Challenge'}</h1>
            <div className={styles.scoreBadge}>
              <span className={styles.scoreNumber}>{challenge.score}</span>
              <span className={styles.scoreTotal}>/{challenge.total}</span>
            </div>
            <p className={styles.date}>
              {new Date(challenge.created_at).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
            {challenge.status === 'expired' && (
              <Badge>{t.challenge?.expired_label ?? 'Expired'}</Badge>
            )}
          </div>

          <div className={styles.shareRow}>
            <Button
              onClick={() => {
                const baseUrl = window.location.origin;
                const url = `${baseUrl}/challenge/${code}`;
                const text = (t.challenge?.share_competitive ?? 'I scored {n}/{total} on the Chidigo quiz. Think you can beat me? {link}')
                  .replace('{n}', String(challenge.score))
                  .replace('{total}', String(challenge.total))
                  .replace('{link}', url);
                track('language', 'challenge', 'share_back', { challenge_id: challenge.id, action: 'reshare', message_tone: 'competitive' });
                if (typeof navigator.share === 'function') {
                  navigator.share({ title: 'Chidigo Quiz Challenge', text, url }).catch(() => {});
                } else {
                  navigator.clipboard?.writeText(text);
                }
              }}
            >
              {t.challenge?.share_button ?? 'Share Challenge'}
            </Button>
          </div>

          <div className={styles.leaderboardSection}>
            <h2 className={styles.leaderboardTitle}>
              {t.challenge?.leaderboard ?? 'Responses'}
              {completions.length > 0 && <span className={styles.count}> ({completions.length})</span>}
            </h2>
            {completions.length === 0 ? (
              <p className={styles.empty}>{t.challenge?.no_responses ?? 'No one has taken this challenge yet. Share the link!'}</p>
            ) : (
              <ol className={styles.list}>
                {completions.map((c, i) => (
                  <li key={c.id} className={styles.row}>
                    <span className={styles.rank}>{i + 1}</span>
                    <span className={styles.name}>{c.display_name}</span>
                    <span className={styles.score}>{c.score}/{challenge.total}</span>
                    {c.time_taken_ms != null && (
                      <span className={styles.time}>{formatTime(c.time_taken_ms)}</span>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </div>

          <Link href="/profile?tab=challenges" className={styles.backLink}>
            {t.profile?.back_to_profile ?? 'Back to profile'}
          </Link>
        </div>
      </main>
    </div>
  );
}
