'use client';

import { useTranslations, useLocale } from '@/lib/i18n/context';
import { domains } from '@/lib/culture/content';
import { trackNavClick } from '@/lib/analytics/track';
import styles from './CultureSection.module.css';

interface CultureSectionProps {
  limit?: number;
  showSeeAll?: boolean;
}

export function CultureSection({ limit, showSeeAll = false }: CultureSectionProps) {
  const t = useTranslations();
  const { locale } = useLocale();

  const visibleDomains = limit ? domains.slice(0, limit) : domains;

  return (
    <section id="culture" className={styles.section}>
      <div className={styles.inner}>
        <p className={styles.eyebrow}>{t.culture.section_title}</p>
        <h2 className={styles.heading}>{t.culture.section_subtitle}</h2>

        <div className={styles.cardGrid}>
          {visibleDomains.map((domain) => (
            <a
              key={domain.slug}
              href={`/culture/${domain.slug}`}
              className={styles.card}
              onClick={() => trackNavClick('culture_section', `/culture/${domain.slug}`)}
            >
              <h3 className={styles.cardTitle}>{domain.title[locale]}</h3>
              <p className={styles.cardIntro}>{domain.intro[locale]}</p>
            </a>
          ))}
        </div>

        {showSeeAll && limit && limit < domains.length && (
          <div className={styles.seeAll}>
            <a href="/culture" className={styles.seeAllLink}>
              {locale === 'sw'
                ? `Angalia vikoa vyote ${domains.length} →`
                : locale === 'dig'
                  ? `Lola vikoa vyosi ${domains.length} →`
                  : `See all ${domains.length} culture domains →`}
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
