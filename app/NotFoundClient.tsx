'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from '@/lib/i18n/context';
import { useLocale } from '@/lib/i18n/context';
import { Button } from '@chi-digo/design-system';
import styles from './not-found.module.css';

interface NotFoundProverb {
  digo: string;
  en: string;
  sw: string;
  dig: string;
}

const PROVERBS: NotFoundProverb[] = [
  {
    digo: 'Umanya wako kumanya uphiyako',
    en: 'Know where you come from so you can understand where you are going.',
    sw: 'Ujue unatoka wapi ili ujue unakokwenda.',
    dig: 'Manya asili yako na atu ako, ili uweze kuelewa uphiyako maishani.',
  },
  {
    digo: 'Takuna mtsakarira charoni',
    en: 'There is no one who searches in vain.',
    sw: 'Hakuna mtu atafutaye bure.',
    dig: 'Mlungu andakuruzuku poposi uendapho; tausakale safarini.',
  },
  {
    digo: 'Kusagala bure si kama kunyendeka bure',
    en: 'Wandering beats standing still.',
    sw: 'Ni bora kutembea bure kuliko kukaa bure.',
    dig: 'Ni bora kunyendeka bure kuriko kusagala bure.',
  },
  {
    digo: 'Magulu ni manyendesi',
    en: 'Your legs take you wherever you need to go.',
    sw: 'Miguu ndiyo inayokupeleka popote.',
    dig: 'Magulu gako ndiyo ganakuphirika phophosi unachodza.',
  },
  {
    digo: 'Manono ni njdzira',
    en: 'Good deeds pave the way forward.',
    sw: 'Matendo mazuri ndiyo yanayokuongoza mbele.',
    dig: 'Matendo manono ndiyo ganagokulongoza njira ya mbere.',
  },
  {
    digo: 'Chiphala kudosa lugbwe siko kumala makonje',
    en: 'One setback does not mean all is lost.',
    sw: 'Kushindwa mara moja haimaanishi umeshindwa kabisa.',
    dig: 'Kushindwa mara mwenga taimaanishe kpwamba kpwosi kukamala — usikate tamaa.',
  },
  {
    digo: 'Zinaphya-zinaphya ndiko kuivwakpwe',
    en: 'When things seem to be going wrong, it may mean success is near.',
    sw: 'Mambo yanapooneekana kuharibika, inaweza maanisha mafanikio yako karibu.',
    dig: 'Mambo gachikuonekana ganakuharibikira, inaweza kukala mafanikio gako ga phephi.',
  },
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
  const t = useTranslations();
  const { locale } = useLocale();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  const proverb = getProverbForDate();

  useEffect(() => {
    setReady(true);
  }, []);

  const gloss =
    locale === 'sw' ? proverb.sw
      : locale === 'dig' ? proverb.dig
        : proverb.en;

  return (
    <div className={styles.page}>
      <VigangoMark />

      <div className={styles.code}>404</div>

      <h2 className={styles.heading}>{t.not_found.title}</h2>

      <p className={styles.description}>{t.not_found.description}</p>

      <div className={`${styles.proverbCard} ${ready ? styles.proverbCardVisible : ''}`}>
        <p className={styles.proverbDigo} lang="dig">{proverb.digo}</p>
        <p className={styles.proverbGloss} lang={locale}>{gloss}</p>
      </div>

      <div className={styles.actions}>
        <Button variant="primary" onClick={() => router.push('/')}>
          {t.not_found.back_home}
        </Button>
        <Button variant="secondary" onClick={() => router.push('/dictionary')}>
          {t.not_found.search}
        </Button>
      </div>
    </div>
  );
}
