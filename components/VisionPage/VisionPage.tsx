'use client';

import { useTranslations } from '@/lib/i18n/context';
import styles from './VisionPage.module.css';

export function VisionPage() {
  const t = useTranslations();

  return (
    <>
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <p className={styles.eyebrow}>{t.vision.eyebrow}</p>
          <h1 className={styles.heroTitle}>{t.vision.title}</h1>
        </div>
      </section>

      <section className={`${styles.section} ${styles.picture}`}>
        <div className={styles.sectionInner}>
          <h2 className={styles.sectionHeading}>{t.vision.picture_heading}</h2>
          <p className={styles.visionQuote}>{t.vision.picture_body}</p>
        </div>
      </section>

      <section className={`${styles.section} ${styles.tiers}`}>
        <div className={styles.sectionInner}>
          <h2 className={styles.sectionHeading}>{t.vision.tiers_heading}</h2>
          <div className={styles.tierGrid}>
            <div className={styles.tierCard}>
              <div className={styles.tierName}>{t.vision.tier1_name}</div>
              <div className={styles.tierSubtitle}>{t.vision.tier1_subtitle}</div>
              <p className={styles.bodyText}>{t.vision.tier1_body}</p>
            </div>
            <div className={styles.tierCard}>
              <div className={styles.tierName}>{t.vision.tier2_name}</div>
              <div className={styles.tierSubtitle}>{t.vision.tier2_subtitle}</div>
              <p className={styles.bodyText}>{t.vision.tier2_body}</p>
            </div>
            <div className={styles.tierCard}>
              <div className={styles.tierName}>{t.vision.tier3_name}</div>
              <div className={styles.tierSubtitle}>{t.vision.tier3_subtitle}</div>
              <p className={styles.bodyText}>{t.vision.tier3_body}</p>
            </div>
            <div className={styles.tierCard}>
              <div className={styles.tierName}>{t.vision.tier4_name}</div>
              <div className={styles.tierSubtitle}>{t.vision.tier4_subtitle}</div>
              <p className={styles.bodyText}>{t.vision.tier4_body}</p>
            </div>
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.roadmap}`}>
        <div className={styles.sectionInner}>
          <h2 className={styles.sectionHeading}>{t.vision.roadmap_heading}</h2>
          <ul className={styles.yearList}>
            <li className={styles.yearItem}>{t.vision.year1}</li>
            <li className={styles.yearItem}>{t.vision.year2}</li>
            <li className={styles.yearItem}>{t.vision.year3}</li>
            <li className={styles.yearItem}>{t.vision.year4_5}</li>
          </ul>
        </div>
      </section>

      <section className={`${styles.section} ${styles.theory}`}>
        <div className={styles.sectionInner}>
          <h2 className={styles.sectionHeading}>{t.vision.theory_heading}</h2>
          <p className={styles.bodyText}>{t.vision.theory_body}</p>
        </div>
      </section>
    </>
  );
}
