'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { useTranslations, useLocale } from '@/lib/i18n/context';
import { historyDomain } from '@/lib/articles/manifest';
import { figures } from '@/lib/history/figures';
import { eraLabels, eraColors, type Era } from '@/lib/history/timeline';
import type { TimelineEvent } from '@/lib/articles/types';
import { trackNavClick } from '@/lib/analytics/track';
import { useTrackView } from '@/hooks/useTrackView';
import { getHeroStyle } from '@/lib/images/hero-images';
import styles from './HistoryIndex.module.css';

const eras: Era[] = ['origins', 'kaya', 'colonial', 'modern'];
const eraPeriods: Record<Era, string> = {
  origins: 'pre-1500s',
  kaya: '1500s–1900s',
  colonial: '1886–1963',
  modern: '1963–present',
};

/** Figure cards shown on the History page; the rest are on /history/figures. */
const FIGURE_PREVIEW = 5;

/** A figure card; a link to the full article once one exists in all three languages. */
function FigureCard({ href, children }: { href: string | null; children: React.ReactNode }) {
  if (!href) return <div className={styles.figureCard}>{children}</div>;
  return (
    <Link href={href} className={`${styles.figureCard} ${styles.figureCardLink}`} onClick={() => trackNavClick('history_figures', href)}>
      {children}
    </Link>
  );
}

export function HistoryIndex({ figureArticles = [], timelineEvents }: { figureArticles?: string[]; timelineEvents: TimelineEvent[] }) {
  const t = useTranslations();
  const { locale } = useLocale();

  const timelineRef = useRef<HTMLElement>(null);
  const figuresRef = useRef<HTMLElement>(null);
  const topicsRef = useRef<HTMLElement>(null);

  useTrackView(timelineRef, 'history', 'timeline');
  useTrackView(figuresRef, 'history', 'figures');
  useTrackView(topicsRef, 'history', 'topics');

  return (
    <>
      {/* Hero */}
      <section className={styles.hero} style={getHeroStyle('history-index')}>
        <div className={styles.heroContent}>
          <p className={styles.eyebrow}>{t.history.eyebrow}</p>
          <h1 className={styles.heroTitle}>{t.history.title}</h1>
          <p className={styles.heroIntro}>{t.history.intro}</p>
          <p className={styles.proverb} lang="dg">
            <em>{historyDomain.proverb}</em>
          </p>
          <p className={styles.gloss}>{historyDomain.proverbGloss}</p>
        </div>
      </section>

      {/* Timeline */}
      <section ref={timelineRef} className={`${styles.section} ${styles.sectionCream}`}>
        <div className={styles.sectionInner}>
          <h2 className={styles.sectionHeading}>
            {t.history.timeline_heading}
          </h2>

          {/* Sticky legend */}
          <div className={styles.legend}>
            {eras.map((era) => (
              <div key={era} className={styles.legendItem}>
                <span
                  className={styles.legendDot}
                  style={{ background: eraColors[era] }}
                />
                <span className={styles.legendLabel}>
                  {eraLabels[era][locale]}
                </span>
                <span className={styles.legendPeriod}>
                  {eraPeriods[era]}
                </span>
              </div>
            ))}
          </div>

          {/* Custom era-colored timeline */}
          <div className={styles.timeline}>
            {timelineEvents.map((ev, i) => (
              <div key={i} className={styles.tlEvent}>
                <div className={styles.tlTrack}>
                  <div
                    className={styles.tlDot}
                    style={{ background: eraColors[ev.era] }}
                  />
                  {i < timelineEvents.length - 1 && (
                    <div
                      className={styles.tlLine}
                      style={{ background: eraColors[ev.era] }}
                    />
                  )}
                </div>
                <div className={styles.tlBody}>
                  <span className={styles.tlDate}>{ev.date}</span>
                  <h3 className={styles.tlTitle}>{ev.title[locale]}</h3>
                  <p className={styles.tlDesc}>{ev.description[locale]}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Notable figures */}
      <section ref={figuresRef} className={`${styles.section} ${styles.sectionSand}`}>
        <div className={styles.sectionInner}>
          <h2 className={styles.sectionHeading}>
            <Link href="/history/figures" className={styles.sectionHeadingLink} onClick={() => trackNavClick('history_figures', '/history/figures')}>
              {t.history.figures_heading}
            </Link>
          </h2>
          <div className={styles.figureGrid}>
            {figures.slice(0, FIGURE_PREVIEW).map((fig) => (
              <FigureCard key={fig.slug} href={figureArticles.includes(fig.slug) ? `/history/figures/${fig.slug}` : null}>
                <h3 className={styles.figureName}>{fig.name}</h3>
                <div className={styles.figureMeta}>
                  <span className={styles.figureEra}>{fig.era[locale]}</span>
                  <span className={styles.figureRegion}>{fig.region}</span>
                </div>
                <p className={styles.figureRole}>{fig.role[locale]}</p>
                <p className={styles.figureSummary}>{fig.summary[locale]}</p>
              </FigureCard>
            ))}
            <Link href="/history/figures" className={`${styles.figureCard} ${styles.figureCardLink} ${styles.figureSeeAll}`} onClick={() => trackNavClick('history_figures', '/history/figures')}>
              <h3 className={styles.figureName}>{t.history.figures_see_all} →</h3>
              <p className={styles.figureSummary}>{t.history.figures_see_all_text}</p>
            </Link>
          </div>
        </div>
      </section>

      {/* Deep dive topic cards */}
      <section ref={topicsRef} className={`${styles.section} ${styles.sectionDark}`}>
        <div className={styles.sectionInner}>
          <h2 className={`${styles.sectionHeading} ${styles.sectionHeadingLight}`}>
            {t.history.topics_heading}
          </h2>
          <div className={styles.topicGrid}>
            {historyDomain.topics.map((topic) => (
              <Link
                key={topic.slug}
                href={`/history/${topic.slug}`}
                className={styles.topicCard}
                onClick={() => trackNavClick('history_topics', `/history/${topic.slug}`)}
              >
                <h3 className={styles.topicTitle}>{topic.title[locale]}</h3>
                <p className={styles.topicIntro}>{topic.intro[locale]}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

    </>
  );
}
