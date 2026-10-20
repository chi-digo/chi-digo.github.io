'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { useTranslations, useLocale } from '@/lib/i18n/context';
import { figures } from '@/lib/history/figures';
import { trackNavClick } from '@/lib/analytics/track';
import { useTrackView } from '@/hooks/useTrackView';
import { getHeroStyle } from '@/lib/images/hero-images';
import styles from './FiguresIndex.module.css';

/** The Notable Figures page: a short introduction, then a picture card for every figure with a published article. */
export function FiguresIndex({ published, scenes }: { published: string[]; scenes: Record<string, string> }) {
  const t = useTranslations();
  const { locale } = useLocale();
  const gridRef = useRef<HTMLElement>(null);
  useTrackView(gridRef, 'history', 'figures_index');

  return (
    <>
      <section className={styles.hero} style={getHeroStyle('history-index')}>
        <div className={styles.heroContent}>
          <p className={styles.eyebrow}><Link href="/history">{t.history.eyebrow}</Link></p>
          <h1 className={styles.heroTitle}>{t.history.figures_heading}</h1>
          <p className={styles.heroIntro}>{t.history.figures_intro}</p>
        </div>
      </section>

      <section ref={gridRef} className={styles.section}>
        <div className={styles.sectionInner}>
          <p className={styles.note}>{t.history.figures_note}</p>
          <div className={styles.grid}>
            {figures.filter((f) => published.includes(f.slug)).map((fig) => (
              <a
                key={fig.slug}
                href={`/history/figures/${fig.slug}`}
                className={styles.card}
                onClick={() => trackNavClick('figures_index', `/history/figures/${fig.slug}`)}
              >
                <div
                  className={styles.picture}
                  style={{ backgroundImage: `url(${scenes[fig.slug] ?? '/images/hero/hist-singwaya.webp'})` }}
                  role="img"
                  aria-label={t.history.figure_scene_credit}
                />
                <div className={styles.body}>
                  <h2 className={styles.name}>{fig.name}</h2>
                  <div className={styles.meta}>
                    <span className={styles.era}>{fig.era[locale]}</span>
                    <span className={styles.region}>{fig.region}</span>
                  </div>
                  <p className={styles.role}>{fig.role[locale]}</p>
                  <p className={styles.summary}>{fig.summary[locale]}</p>
                </div>
              </a>
            ))}
          </div>
          <p className={styles.back}><Link href="/history">{t.history.back_to_history}</Link></p>
        </div>
      </section>
    </>
  );
}
