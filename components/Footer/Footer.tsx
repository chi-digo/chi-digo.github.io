'use client';

import Link from 'next/link';
import { useTranslations } from '@/lib/i18n/context';
import { TrackedLink } from '@/components/Analytics/TrackedLink';
import { track } from '@/lib/analytics/track';
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

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="17.5" cy="6.5" r="1.25" fill="currentColor" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
    </svg>
  );
}

const SOCIAL_LINKS = [
  { platform: 'instagram', href: 'https://instagram.com/chidigo_org', Icon: InstagramIcon },
  { platform: 'facebook', href: 'https://facebook.com/chidigo.org', Icon: FacebookIcon },
] as const;

export function Footer() {
  const t = useTranslations();

  return (
    <footer className={styles.footer}>
      <div className={styles.footerInner}>
        <div className={styles.logo}>
          <Link href="/" aria-label="Chidigo home" className={styles.logoLink}>
            <VigangoMark />
            <span className={styles.brandName}>Chidigo</span>
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
              <li><TrackedLink href="/language/dictionary" source="footer" className={styles.columnLink}>{t.dictionary.section_title}</TrackedLink></li>
              <li><TrackedLink href="/language/proverbs" source="footer" className={styles.columnLink}>{t.proverbs.title}</TrackedLink></li>
              <li><TrackedLink href="/history" source="footer" className={styles.columnLink}>{t.nav.history_link}</TrackedLink></li>
            </ul>
          </div>

          <div>
            <h3 className={styles.columnHeading}>{t.footer.connect_heading}</h3>
            <ul className={styles.columnList}>
              <li><TrackedLink href="/contact" source="footer" className={styles.columnLink}>{t.footer.contact_link}</TrackedLink></li>
            </ul>
            <div className={styles.socialRow}>
              {SOCIAL_LINKS.map(({ platform, href, Icon }) => (
                <a
                  key={platform}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.socialIcon}
                  aria-label={t.social[`${platform}_label` as keyof typeof t.social]}
                  onClick={() => track('orientation', 'footer', 'social_click', { platform, href })}
                >
                  <Icon />
                </a>
              ))}
            </div>
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
