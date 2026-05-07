'use client';

import { useTranslations, useLocale } from '@/lib/i18n/context';
import { historyDomain } from '@/lib/history/content';
import { figures } from '@/lib/history/figures';
import { timelineEvents, eraLabels, eraColors, type Era } from '@/lib/history/timeline';
import styles from './HistoryIndex.module.css';

const eras: Era[] = ['origins', 'kaya', 'colonial', 'modern'];
const eraPeriods: Record<Era, string> = {
  origins: 'pre-1500s',
  kaya: '1500s–1900s',
  colonial: '1886–1963',
  modern: '1963–present',
};

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
