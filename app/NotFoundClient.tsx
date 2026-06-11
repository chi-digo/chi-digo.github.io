'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@chi-digo/design-system';
import styles from './not-found.module.css';

interface NotFoundProverb {
  digo: string;
  en: string;
}

const PROVERBS: NotFoundProverb[] = [
  { digo: 'Umanya wako kumanya uphiyako', en: 'Know where you come from so you can understand where you are going.' },
  { digo: 'Takuna mtsakarira charoni', en: 'There is no one who searches in vain.' },
  { digo: 'Kusagala bure si kama kunyendeka bure', en: 'Wandering beats standing still.' },
  { digo: 'Magulu ni manyendesi', en: 'Your legs take you wherever you need to go.' },
  { digo: 'Manono ni njdzira', en: 'Good deeds pave the way forward.' },
  { digo: 'Chiphala kudosa lugbwe siko kumala makonje', en: 'One setback does not mean all is lost.' },
  { digo: 'Zinaphya-zinaphya ndiko kuivwakpwe', en: 'When things seem to be going wrong, it may mean success is near.' },
];

function getProverbForDate(): NotFoundProverb {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  return PROVERBS[dayOfYear % PROVERBS.length];
}

function VigangoMark() {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={styles.mark}
      aria-hidden="true"
    >
      <circle cx="24" cy="8" r="6" fill="currentColor" />
      <polygon points="16,18 32,18 24,28" fill="currentColor" />
      <polygon points="16,28 32,28 24,18" fill="currentColor" opacity="0.5" />
      <polygon points="16,28 32,28 24,38" fill="currentColor" />
      <polygon points="16,38 32,38 24,28" fill="currentColor" opacity="0.5" />
      <polygon points="16,38 32,38 24,44" fill="currentColor" />
    </svg>
  );
}

export default function NotFoundClient() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const proverb = getProverbForDate();

  useEffect(() => {
    setReady(true);
  }, []);

  return (
    <div className={styles.page}>
      <VigangoMark />

      <div className={styles.code}>404</div>

      <h2 className={styles.heading}>Page not found</h2>

      <p className={styles.description}>
        The path you followed doesn&apos;t lead anywhere — but there&apos;s plenty to explore.
      </p>

      <div className={`${styles.proverbCard} ${ready ? styles.proverbCardVisible : ''}`}>
        <p className={styles.proverbDigo} lang="dg">{proverb.digo}</p>
        <p className={styles.proverbGloss} lang="en">{proverb.en}</p>
      </div>

      <div className={styles.actions}>
        <Button variant="primary" onClick={() => router.push('/')}>
          Back to home
        </Button>
      </div>
    </div>
  );
}
