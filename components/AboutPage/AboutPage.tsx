'use client';

import { useTranslations } from '@/lib/i18n/context';
import styles from './AboutPage.module.css';

function interpolate(
  template: string,
  marker: string,
  replacement: string,
  wrapper: (text: string) => React.ReactNode,
): React.ReactNode[] {
  const placeholder = `{${marker}}`;
  const index = template.indexOf(placeholder);
  if (index === -1) return [template];
  return [
    template.slice(0, index),
    wrapper(replacement),
    template.slice(index + placeholder.length),
  ];
}

function renderDigoTerms(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;
  while (remaining.length > 0) {
    const start = remaining.indexOf('{dig:');
    if (start === -1) { parts.push(remaining); break; }
    const end = remaining.indexOf('}', start);
    if (end === -1) { parts.push(remaining); break; }
    if (start > 0) parts.push(remaining.slice(0, start));
    const term = remaining.slice(start + 5, end);
    parts.push(<em key={key++} lang="dig">{term}</em>);
    remaining = remaining.slice(end + 1);
  }
  return parts;
}

export function AboutPage() {
  const t = useTranslations();

  return (
    <>
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <p className={styles.eyebrow}>{t.about.eyebrow}</p>
          <h1 className={styles.heroTitle}>{t.about.title}</h1>
        </div>
      </section>

      <section className={`${styles.section} ${styles.whoWeAre}`}>
        <div className={styles.sectionInner}>
          <h2 className={styles.sectionHeading}>{t.about.who_we_are_heading}</h2>
          <p className={styles.bodyText}>{t.about.who_we_are_body}</p>
        </div>
      </section>

      <section className={`${styles.section} ${styles.problem}`}>
        <div className={styles.pindoMotif} />
        <div className={styles.sectionInner}>
          <h2 className={styles.sectionHeading}>{t.about.problem_heading}</h2>
          <blockquote className={styles.pullQuote}>
            {t.about.problem_quote}
          </blockquote>
          <p className={styles.bodyText}>
            {interpolate(
              t.about.problem_body_1,
              'cliff',
              t.about.problem_body_1_cliff,
              (text) => (
                <strong key="cliff" className={styles.cliffHighlight}>{text}</strong>
              ),
            )}
          </p>
          <p className={styles.bodyText}>{t.about.problem_body_2}</p>
          <p className={styles.bodyText}>{renderDigoTerms(t.about.problem_body_3)}</p>
        </div>
      </section>

      <section className={`${styles.section} ${styles.approach}`}>
        <div className={styles.sectionInner}>
          <h2 className={styles.sectionHeading}>{t.about.approach_heading}</h2>
          <div className={styles.pillarGrid}>
            <div className={styles.pillarCard}>
              <div className={styles.pillarTitle}>{t.mission.tools_heading}</div>
              <p className={styles.bodyText}>{t.about.approach_tools}</p>
            </div>
            <div className={styles.pillarCard}>
              <div className={styles.pillarTitle}>{t.mission.content_heading}</div>
              <p className={styles.bodyText}>{t.about.approach_content}</p>
            </div>
            <div className={styles.pillarCard}>
              <div className={styles.pillarTitle}>{t.mission.platforms_heading}</div>
              <p className={styles.bodyText}>{t.about.approach_platforms}</p>
            </div>
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.whyNow}`}>
        <div className={styles.sectionInner}>
          <h2 className={styles.sectionHeading}>{t.about.why_now_heading}</h2>
          <p className={styles.bodyText}>{t.about.why_now_body}</p>
        </div>
      </section>
    </>
  );
}
