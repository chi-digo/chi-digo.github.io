'use client';

import { useTranslations } from '@/lib/i18n/context';
import { useLocale } from '@/lib/i18n/context';
import { CultureSection } from '@/components/CultureSection/CultureSection';
import { DictionarySection } from '@/components/DictionarySection/DictionarySection';
import styles from "./page.module.css";

function ChidigoLogo() {
  return (
    <svg
      viewBox="0 0 480 160"
      role="img"
      aria-label="Chi-digo"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g transform="translate(56, 20)">
        <circle cx="40" cy="16" r="14" fill="currentColor" />
        <rect
          x="22"
          y="38"
          width="36"
          height="84"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <g fill="currentColor">
          <polygon points="22,38 58,38 40,56" />
          <polygon points="22,74 58,74 40,56" />
          <polygon points="22,74 58,74 40,92" />
          <polygon points="22,110 58,110 40,92" />
          <polygon points="22,110 58,110 40,122" />
        </g>
      </g>
      <g transform="translate(160, 0)">
        <text
          x="0"
          y="100"
          fontFamily="var(--font-fraunces), Fraunces, serif"
          fontSize="76"
          fontWeight="500"
          letterSpacing="-1"
          fill="currentColor"
        >
          Chi-digo
        </text>
      </g>
    </svg>
  );
}

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
    if (start === -1) {
      parts.push(remaining);
      break;
    }
    const end = remaining.indexOf('}', start);
    if (end === -1) {
      parts.push(remaining);
      break;
    }

    if (start > 0) {
      parts.push(remaining.slice(0, start));
    }
    const term = remaining.slice(start + 5, end);
    parts.push(<em key={key++} lang="dig">{term}</em>);
    remaining = remaining.slice(end + 1);
  }

  return parts;
}

export default function Home() {
  const t = useTranslations();
  const { locale } = useLocale();

  return (
    <>
      {/* ===== Hero ===== */}
      <section className={styles.hero}>
        <div className={styles.bandBottom} />

        <div className={styles.backgroundImage} />
        <div className={styles.gradient} />

        <div className={styles.content}>
          <h1 className={styles.title}>{t.hero.title}</h1>
          <p className={styles.proverb} lang="dig">
            {t.hero.proverb_digo}
          </p>
          <p className={styles.gloss} lang={locale}>
            {t.hero.proverb_gloss}
          </p>
        </div>

        <div className={styles.logo}>
          <ChidigoLogo />
        </div>
      </section>

      {/* ===== What is Digo ===== */}
      <section className={`${styles.section} ${styles.whatIsDigo}`}>
        <div className={styles.sectionInner}>
          <p className={styles.eyebrow}>{t.what_is_digo.eyebrow}</p>
          <h2 className={styles.sectionHeading}>
            {t.what_is_digo.heading}
          </h2>
          <div className={styles.twoColumns}>
            <div>
              <div className={styles.factLabel}>
                {t.what_is_digo.geography_label}
              </div>
              <p className={styles.bodyText}>
                {renderDigoTerms(t.what_is_digo.geography_text)}
              </p>

              <div className={styles.factLabel}>
                {t.what_is_digo.family_label}
              </div>
              <p className={styles.bodyText}>
                {t.what_is_digo.family_text}
              </p>

              <div className={styles.factLabel}>
                {t.what_is_digo.numbers_label}
              </div>
              <p className={styles.bodyText}>
                {t.what_is_digo.numbers_text}
              </p>
            </div>
            <div className={styles.culturalAnchorsCard}>
              <div className={styles.factLabel}>
                {t.what_is_digo.cultural_anchors_label}
              </div>
              <p className={styles.bodyText}>
                {renderDigoTerms(t.what_is_digo.kayas_text)}
              </p>
              <p className={styles.bodyText}>
                {renderDigoTerms(t.what_is_digo.coastal_life_text)}
              </p>
              <p className={styles.bodyText}>
                {renderDigoTerms(t.what_is_digo.music_text)}
              </p>
              <p className={styles.bodyText}>
                {renderDigoTerms(t.what_is_digo.dress_text)}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Culture ===== */}
      <CultureSection />

      {/* ===== The Dictionary (search + word of the day) ===== */}
      <DictionarySection />

      {/* ===== The Problem ===== */}
      <section className={`${styles.section} ${styles.theProblem}`}>
        <div className={styles.pindoMotif} />
        <div className={styles.sectionInner}>
          <p className={styles.eyebrow}>{t.the_problem.eyebrow}</p>
          <blockquote className={styles.pullQuote}>
            {t.the_problem.pull_quote}
          </blockquote>
          <p className={styles.bodyText}>
            {interpolate(
              t.the_problem.body_1,
              'cliff',
              t.the_problem.body_1_cliff,
              (text) => (
                <strong key="cliff" className={styles.cliffHighlight}>
                  {text}
                </strong>
              ),
            )}
          </p>
          <p className={styles.bodyText}>
            {t.the_problem.body_2}
          </p>
        </div>
      </section>

      {/* ===== Our Mission ===== */}
      <section className={`${styles.section} ${styles.ourMission}`}>
        <div className={styles.sectionInner}>
          <p className={styles.eyebrow}>{t.our_mission.eyebrow}</p>
          <p className={styles.missionStatement}>
            {interpolate(
              t.our_mission.statement,
              'highlight',
              t.our_mission.statement_highlight,
              (text) => (
                <span key="highlight" className={styles.missionHighlight}>
                  {text}
                </span>
              ),
            )}
          </p>
        </div>
      </section>

      {/* ===== Footer ===== */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerLogo}>
            <ChidigoLogo />
          </div>
          <p className={styles.footerCopy}>
            &copy; {new Date().getFullYear()} {t.footer.copyright}
          </p>
        </div>
      </footer>
    </>
  );
}
