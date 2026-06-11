'use client';

import { useEffect, useState, useRef } from 'react';
import { useTranslations } from '@/lib/i18n/context';
import { useAuth } from '@/lib/auth/context';
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
  challenger_id: string;
  challenger: { display_name: string | null; avatar_url: string | null; score: number; time_taken_ms: number | null };
  score: number;
  total: number;
  created_at: string;
  completions_count: number;
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

function formatTime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return minutes > 0 ? `${minutes}m ${secs}s` : `${secs}s`;
}

export function LeaderboardPage({ code }: { code: string }) {
  const t = useTranslations();
  const { user } = useAuth();
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
              <div className={styles.row}>
                <Skeleton width={16} height={14} />
                <Skeleton width={140} height={16} />
                <Skeleton width={40} height={16} />
                <Skeleton width={28} height={14} />
              </div>
            </div>
            <Skeleton width={105} height={14} style={{ alignSelf: 'center' }} />
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
          <div className={styles.heroSection}>
            <div className={styles.header}>
              {challenge.challenger.avatar_url && (
                <img
                  src={challenge.challenger.avatar_url}
                  alt=""
                  className={styles.challengerAvatar}
                />
              )}
              <h1 className={styles.title}>
                {(t.challenge?.challenge_by ?? 'Challenge by {name}').replace(
                  '{name}',
                  shortName(challenge.challenger.display_name ?? 'Mtu wa Chidigo'),
                )}
              </h1>
              <div className={styles.scoreBadge}>
                <span className={styles.scoreNumber}>{challenge.score}</span>
                <span className={styles.scoreTotal}>/{challenge.total}</span>
              </div>
              <p className={styles.date}>
                {new Date(challenge.created_at).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
              {Date.now() - new Date(challenge.created_at).getTime() > 7 * 24 * 60 * 60 * 1000 && (
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
          </div>

          <div className={styles.leaderboardSection}>
            {(() => {
              const challengerEntry = {
                id: 'challenger',
                display_name: challenge.challenger.display_name ?? 'Mtu wa Chidigo',
                avatar_url: challenge.challenger.avatar_url,
                score: challenge.score,
                time_taken_ms: challenge.challenger.time_taken_ms,
                isChallenger: true,
              };
              const allParticipants = [
                challengerEntry,
                ...completions.map((c) => ({ ...c, isChallenger: false })),
              ].sort((a, b) => {
                if (b.score !== a.score) return b.score - a.score;
                if (a.time_taken_ms == null && b.time_taken_ms == null) return 0;
                if (a.time_taken_ms == null) return 1;
                if (b.time_taken_ms == null) return -1;
                return a.time_taken_ms - b.time_taken_ms;
              });

              return (
                <>
                  <h2 className={styles.leaderboardTitle}>
                    {t.challenge?.participants ?? 'Participants'}
                    <span className={styles.count}> ({allParticipants.length})</span>
                  </h2>
                  <ol className={styles.list}>
                    {allParticipants.map((p, i) => (
                      <li key={p.id} className={styles.row}>
                        <span className={styles.rank}>
                          {i <= 2 ? (
                            <svg aria-label={['Winner', '2nd place', '3rd place'][i]} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={['var(--color-mnazi-gold)', '#A0A0A0', '#CD7F32'][i]} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                              <path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
                              <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
                              <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
                            </svg>
                          ) : (i + 1)}
                        </span>
                        <span className={styles.name}>
                          {shortName(p.display_name)}
                        </span>
                        {p.isChallenger && <Badge>{t.challenge?.challenger_label ?? 'Challenger'}</Badge>}
                        <span className={styles.score}>{p.score}/{challenge.total}</span>
                        {p.time_taken_ms != null && (
                          <span className={styles.time}>{formatTime(p.time_taken_ms)}</span>
                        )}
                      </li>
                    ))}
                  </ol>
                </>
              );
            })()}
          </div>

        </div>
      </main>
    </div>
  );
}
