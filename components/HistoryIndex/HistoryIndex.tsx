'use client';

import { useTranslations, useLocale } from '@/lib/i18n/context';
import { historyDomain } from '@/lib/history/content';
import { figures } from '@/lib/history/figures';
import { timelineEvents } from '@/lib/history/timeline';
import { Timeline, type TimelineItem } from '@chi-digo/design-system';
import styles from './HistoryIndex.module.css';

function Footer() {
  const t = useTranslations();
  return (
    <footer className={styles.footer}>
      <div className={styles.footerInner}>
        <span className={styles.footerCopy}>{t.footer.copyright}</span>
      </div>
    </footer>
  );
}

export function HistoryIndex() {
  const t = useTranslations();
  const { locale } = useLocale();

  const tlItems: TimelineItem[] = timelineEvents.map((ev) => ({
    date: ev.date,
    title: ev.title[locale],
    description: ev.description[locale],
  }));

  return (
    <>
      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <p className={styles.eyebrow}>{t.history.eyebrow}</p>
          <h1 className={styles.heroTitle}>{t.history.title}</h1>
          <p className={styles.heroIntro}>{t.history.intro}</p>
          <p className={styles.proverb} lang="dig">
            <em>{historyDomain.proverb}</em>
          </p>
          <p className={styles.gloss}>{historyDomain.proverbGloss}</p>
        </div>
      </section>

      {/* Timeline */}
      <section className={`${styles.section} ${styles.sectionCream}`}>
        <div className={styles.sectionInner}>
          <h2 className={styles.sectionHeading}>
            {t.history.timeline_heading}
          </h2>
          <div className={styles.timelineWrap}>
            <Timeline items={tlItems} />
          </div>
        </div>
      </section>

      {/* Notable figures */}
      <section className={`${styles.section} ${styles.sectionSand}`}>
        <div className={styles.sectionInner}>
          <h2 className={styles.sectionHeading}>
            {t.history.figures_heading}
          </h2>
          <div className={styles.figureGrid}>
            {figures.map((fig) => (
              <div key={fig.slug} className={styles.figureCard}>
                <h3 className={styles.figureName}>{fig.name}</h3>
                <div className={styles.figureMeta}>
                  <span className={styles.figureEra}>{fig.era[locale]}</span>
                  <span className={styles.figureRegion}>{fig.region}</span>
                </div>
                <p className={styles.figureRole}>{fig.role[locale]}</p>
                <p className={styles.figureSummary}>{fig.summary[locale]}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Deep dive topic cards */}
      <section className={`${styles.section} ${styles.sectionDark}`}>
        <div className={styles.sectionInner}>
          <h2 className={`${styles.sectionHeading} ${styles.sectionHeadingLight}`}>
            {t.history.topics_heading}
          </h2>
          <div className={styles.topicGrid}>
            {historyDomain.topics.map((topic) => (
              <a
                key={topic.slug}
                href={`/history/${topic.slug}`}
                className={styles.topicCard}
              >
                <h3 className={styles.topicTitle}>{topic.title[locale]}</h3>
                <p className={styles.topicIntro}>{topic.intro[locale]}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
