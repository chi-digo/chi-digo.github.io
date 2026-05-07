'use client';

import { useTranslations, useLocale } from '@/lib/i18n/context';
import { domains } from '@/lib/culture/content';
import styles from './CultureSection.module.css';

export function CultureSection() {
  const t = useTranslations();
  const { locale } = useLocale();

  return (
    <section id="culture" className={styles.section}>
      <div className={styles.inner}>
        <p className={styles.eyebrow}>{t.culture.section_title}</p>
        <h2 className={styles.heading}>{t.culture.section_subtitle}</h2>

        <div className={styles.cardGrid}>
          {domains.map((domain) => (
            <a
              key={domain.slug}
              href={`/culture/${domain.slug}`}
              className={styles.card}
            >
              <h3 className={styles.cardTitle}>{domain.title[locale]}</h3>
              <p className={styles.cardIntro}>{domain.intro[locale]}</p>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
