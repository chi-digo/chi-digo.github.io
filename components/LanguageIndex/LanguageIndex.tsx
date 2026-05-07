'use client';

import { useRef } from 'react';
import { useTranslations, useLocale } from '@/lib/i18n/context';
import { oralTraditionsDomain } from '@/lib/language/content';
import { dialects } from '@/lib/language/dialects';
import { languageTools } from '@/lib/language/tools';
import { trackNavClick } from '@/lib/analytics/track';
import { useTrackView } from '@/hooks/useTrackView';
import styles from './LanguageIndex.module.css';


export function LanguageIndex() {
  const t = useTranslations();
  const { locale } = useLocale();

  const dialectRef = useRef<HTMLElement>(null);
  const toolsRef = useRef<HTMLElement>(null);
  const topicsRef = useRef<HTMLElement>(null);

  useTrackView(dialectRef, 'language', 'dialects');
  useTrackView(toolsRef, 'language', 'tools');
  useTrackView(topicsRef, 'language', 'oral_traditions');

  return (
    <>
      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <p className={styles.eyebrow}>{t.language.eyebrow}</p>
          <h1 className={styles.heroTitle}>{t.language.title}</h1>
          <p className={styles.heroIntro}>{t.language.intro}</p>
          <p className={styles.proverb} lang="dig">
            <em>{oralTraditionsDomain.proverb}</em>
          </p>
          <p className={styles.gloss}>{oralTraditionsDomain.proverbGloss}</p>
        </div>
      </section>

      {/* Dialects */}
      <section ref={dialectRef} className={`${styles.section} ${styles.sectionCream}`}>
        <div className={styles.sectionInner}>
          <h2 className={styles.sectionHeading}>
            {t.language.dialects_heading}
          </h2>
          <div className={styles.dialectGrid}>
            {dialects.map((d) => (
              <div key={d.slug} className={styles.dialectCard}>
                <div className={styles.dialectHeader}>
                  <span
                    className={styles.dialectDot}
                    style={{ background: d.color }}
                  />
                  <h3 className={styles.dialectName}>{d.name}</h3>
                </div>
                <span className={styles.dialectRegion}>
                  {d.region[locale]}
                </span>
                <span className={styles.dialectArea}>{d.area}</span>
                <p className={styles.dialectDesc}>
                  {d.description[locale]}
                </p>
                <span className={styles.dialectSpeakers}>
                  {d.speakers[locale]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tools */}
      <section ref={toolsRef} className={`${styles.section} ${styles.sectionSand}`}>
        <div className={styles.sectionInner}>
          <h2 className={styles.sectionHeading}>
            {t.language.tools_heading}
          </h2>
          <div className={styles.toolGrid}>
            {languageTools.map((tool) => {
              const inner = (
                <>
                  <h3 className={styles.toolTitle}>{tool.title[locale]}</h3>
                  <p className={styles.toolDesc}>
                    {tool.description[locale]}
                  </p>
                  {!tool.available && (
                    <span className={styles.toolBadge}>Coming soon</span>
                  )}
                </>
              );

              return tool.available ? (
                <a
                  key={tool.slug}
                  href={tool.href}
                  className={styles.toolCard}
                  onClick={() => trackNavClick('language_tools', tool.href)}
                >
                  {inner}
                </a>
              ) : (
                <div
                  key={tool.slug}
                  className={`${styles.toolCard} ${styles.toolCardDisabled}`}
                >
                  {inner}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Oral tradition topic cards */}
      <section ref={topicsRef} className={`${styles.section} ${styles.sectionDark}`}>
        <div className={styles.sectionInner}>
          <h2
            className={`${styles.sectionHeading} ${styles.sectionHeadingLight}`}
          >
            {t.language.topics_heading}
          </h2>
          <div className={styles.topicGrid}>
            {oralTraditionsDomain.topics.map((topic) => (
              <a
                key={topic.slug}
                href={`/language/${topic.slug}`}
                className={styles.topicCard}
                onClick={() => trackNavClick('language_topics', `/language/${topic.slug}`)}
              >
                <h3 className={styles.topicTitle}>{topic.title[locale]}</h3>
                <p className={styles.topicIntro}>{topic.intro[locale]}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

    </>
  );
}
