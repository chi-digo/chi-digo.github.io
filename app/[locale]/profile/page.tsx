'use client';

import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import { useTranslations, useLocale } from '@/lib/i18n/context';
import { localePath } from '@/lib/i18n/locale-path';
import { AuthGuard } from '@/components/AuthGuard';
import { FavouritesList } from '@/components/FavouritesList/FavouritesList';
import { QuizHistory } from '@/components/QuizHistory/QuizHistory';
import { ChallengeHistory } from '@/components/ChallengeHistory/ChallengeHistory';
import { Avatar, Tabs } from '@chi-digo/design-system';
import { track } from '@/lib/analytics/track';
import styles from './profile.module.css';

function GearIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

const TAB_IDS = ['favourites', 'quiz', 'challenges'] as const;

function ProfileContent() {
  const { user } = useAuth();
  const t = useTranslations();
  const { locale } = useLocale();
  const searchParams = useSearchParams();
  const router = useRouter();

  const tabParam = searchParams.get('tab');
  const defaultTabIndex = Math.max(0, TAB_IDS.indexOf(tabParam as typeof TAB_IDS[number]));

  const name = user?.user_metadata?.full_name || user?.user_metadata?.display_name || user?.email || '';
  const avatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture || '';
  const initials = name
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
    : '';

  const tabItems = [
    {
      id: 'favourites',
      label: t.profile.favourites,
      content: <FavouritesList />,
    },
    {
      id: 'quiz',
      label: t.profile.quiz_history,
      content: <QuizHistory />,
    },
    {
      id: 'challenges',
      label: t.profile.challenges ?? 'Challenges',
      content: <ChallengeHistory />,
    },
  ];

  return (
    <main className={styles.page}>
      <div className={styles.content}>
        <div className={styles.header}>
          <h1 className={styles.title}>{t.profile.title}</h1>
          <div className={styles.userRow}>
            <Avatar
              src={avatarUrl}
              alt={name}
              size="md"
              fallback={initials}
            />
            <div className={styles.userInfo}>
              <span className={styles.name}>{name}</span>
              {memberSince && (
                <p className={styles.memberSince}>
                  {(t.profile.member_since || 'Member since {date}').replace('{date}', memberSince)}
                </p>
              )}
            </div>
            <Link
              href="/profile/manage"
              className={styles.manageLink}
              onClick={() => track('orientation', 'profile', 'manage_click', {})}
              aria-label={t.profile.manage_profile ?? 'Manage profile'}
            >
              <GearIcon />
            </Link>
          </div>
        </div>

        <Tabs
          key={defaultTabIndex}
          items={tabItems}
          defaultIndex={defaultTabIndex}
          onTabChange={(_index, item) => {
            if (item.id) {
              track('orientation', 'profile', 'tab_switch', { tab: item.id });
              const params = new URLSearchParams(searchParams.toString());
              params.set('tab', item.id);
              router.replace(localePath(`/profile?${params.toString()}`, locale), { scroll: false });
            }
          }}
        />
      </div>
    </main>
  );
}

export default function ProfilePage() {
  return (
    <AuthGuard>
      <ProfileContent />
    </AuthGuard>
  );
}
