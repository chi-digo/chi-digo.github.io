'use client';

import Link from 'next/link';
import { useTranslations } from '@/lib/i18n/context';
import { TrackedLink } from '@/components/Analytics/TrackedLink';
import styles from './Footer.module.css';

function VigangoMark() {
  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g fill="currentColor">
        <circle cx="16" cy="9" r="4" />
        <rect
          x="13"
          y="15"
          width="6"
          height="14"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
        />
        <polygon points="13,15 19,15 16,22" />
        <polygon points="13,29 19,29 16,22" />
      </g>
    </svg>
  );
}

export function Footer() {
  const t = useTranslations();

  return (
    <footer className={styles.footer}>
      <div className={styles.footerInner}>
        <div className={styles.logo}>
          <Link href="/" aria-label="Chi-digo home">
            <VigangoMark />
          </Link>
        </div>

        <div className={styles.columns}>
          <div>
            <h3 className={styles.columnHeading}>{t.footer.about_heading}</h3>
            <ul className={styles.columnList}>
              <li><TrackedLink href="/about" source="footer" className={styles.columnLink}>{t.footer.about_link}</TrackedLink></li>
              <li><TrackedLink href="/mission" source="footer" className={styles.columnLink}>{t.footer.mission_link}</TrackedLink></li>
              <li><TrackedLink href="/vision" source="footer" className={styles.columnLink}>{t.footer.vision_link}</TrackedLink></li>
            </ul>
          </div>

          <div>
            <h3 className={styles.columnHeading}>{t.footer.explore_heading}</h3>
            <ul className={styles.columnList}>
              <li><TrackedLink href="/culture" source="footer" className={styles.columnLink}>{t.nav.culture_link}</TrackedLink></li>
              <li><TrackedLink href="/language" source="footer" className={styles.columnLink}>{t.nav.language_link}</TrackedLink></li>
              <li><TrackedLink href="/dictionary" source="footer" className={styles.columnLink}>{t.dictionary.section_title}</TrackedLink></li>
              <li><TrackedLink href="/proverbs" source="footer" className={styles.columnLink}>{t.proverbs.title}</TrackedLink></li>
              <li><TrackedLink href="/history" source="footer" className={styles.columnLink}>{t.nav.history_link}</TrackedLink></li>
            </ul>
          </div>

          <div>
            <h3 className={styles.columnHeading}>{t.footer.connect_heading}</h3>
            <ul className={styles.columnList}>
              <li><TrackedLink href="/contact" source="footer" className={styles.columnLink}>{t.footer.contact_link}</TrackedLink></li>
            </ul>
          </div>
        </div>

        <div className={styles.bottomBar}>
          <p className={styles.copyright}>
            &copy; {new Date().getFullYear()} {t.footer.copyright}
          </p>
          <p className={styles.license}>{t.footer.license}</p>
        </div>
      </div>
    </footer>
  );
}
