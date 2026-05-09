'use client';

import { useState, useEffect } from 'react';
import { Button, Text, IconButton } from '@chi-digo/design-system';
import { useTranslations } from '@/lib/i18n/context';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';
import { detectPlatform, type InstallPlatform } from '@/lib/pwa/detect';
import { track } from '@/lib/analytics/track';
import styles from './InstallCard.module.css';

const DEV_PREVIEW = false;

const DISMISS_KEY = 'chidigo-install-dismissed';
const DISMISS_DAYS = 3;

function useIosDismiss() {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (raw && Date.now() - Number(raw) < DISMISS_DAYS * 86_400_000) {
      setDismissed(true);
    }
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setDismissed(true);
  };

  return { dismissed, dismiss };
}

function ShareIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  );
}

function PlusSquareIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function DictIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}

function ProverbIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function QuizIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function OfflineIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M1 1l22 22" />
      <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
      <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
      <path d="M10.71 5.05A16 16 0 0 1 22.56 9" />
      <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
      <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
      <line x1="12" y1="20" x2="12.01" y2="20" />
    </svg>
  );
}

export function InstallCard() {
  const t = useTranslations();
  const { showCard, isInstalled, install, dismiss } = useInstallPrompt();
  const [platform, setPlatform] = useState<InstallPlatform | null>(null);
  const iosDismiss = useIosDismiss();

  useEffect(() => {
    setPlatform(detectPlatform());
  }, []);

  useEffect(() => {
    if (isInstalled) return;
    if (platform === 'ios-safari' || platform === 'ios-chrome' || platform === 'webview') {
      if (!iosDismiss.dismissed) {
        track('install', 'card', 'view', { platform: platform });
      }
    } else if (showCard) {
      track('install', 'card', 'view', { platform: platform ?? 'unknown' });
    }
  }, [platform, showCard, isInstalled, iosDismiss.dismissed]);

  const shouldShow = DEV_PREVIEW || (() => {
    if (isInstalled || !platform) return false;
    if (platform === 'ios-safari' || platform === 'ios-chrome' || platform === 'webview') {
      return !iosDismiss.dismissed;
    }
    return showCard;
  })();

  if (!shouldShow) return null;

  const isIos = platform === 'ios-safari';
  const isIosChrome = platform === 'ios-chrome';
  const isWebview = platform === 'webview';

  const handleDismiss = () => {
    if (isIos || isIosChrome || isWebview) {
      iosDismiss.dismiss();
    } else {
      dismiss();
    }
    track('install', 'card', 'dismiss', { platform: platform ?? 'unknown' });
  };

  const handleInstall = async () => {
    track('install', 'card', 'tap_install', { platform: platform ?? 'unknown' });
    const outcome = await install();
    if (outcome) {
      track('install', 'prompt', outcome, { platform: platform ?? 'unknown' });
    }
  };

  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <div className={styles.dismissRow}>
          <IconButton
            variant="ghost"
            size="sm"
            icon={<CloseIcon />}
            label={t.install.dismiss}
            onClick={handleDismiss}
            className={styles.dismissBtn}
          />
        </div>

        <p className={styles.eyebrow}>{t.install.eyebrow}</p>
        <h2 className={styles.heading}>{t.install.body}</h2>

        <div className={styles.features}>
          <div className={styles.feature}>
            <span className={styles.featureIcon}><DictIcon /></span>
            <Text variant="ui-sm" className={styles.featureTitle}>{t.install.feature_dict_title}</Text>
            <Text variant="body-sm" className={styles.featureDesc}>{t.install.feature_dict_desc}</Text>
          </div>
          <div className={styles.feature}>
            <span className={styles.featureIcon}><ProverbIcon /></span>
            <Text variant="ui-sm" className={styles.featureTitle}>{t.install.feature_proverbs_title}</Text>
            <Text variant="body-sm" className={styles.featureDesc}>{t.install.feature_proverbs_desc}</Text>
          </div>
          <div className={styles.feature}>
            <span className={styles.featureIcon}><QuizIcon /></span>
            <Text variant="ui-sm" className={styles.featureTitle}>{t.install.feature_quiz_title}</Text>
            <Text variant="body-sm" className={styles.featureDesc}>{t.install.feature_quiz_desc}</Text>
          </div>
          <div className={styles.feature}>
            <span className={styles.featureIcon}><OfflineIcon /></span>
            <Text variant="ui-sm" className={styles.featureTitle}>{t.install.feature_offline_title}</Text>
            <Text variant="body-sm" className={styles.featureDesc}>{t.install.feature_offline_desc}</Text>
          </div>
        </div>

        {isIos && (
          <div className={styles.iosSteps}>
            <div className={styles.step}>
              <span className={styles.stepIcon}><ShareIcon /></span>
              <Text variant="body-sm">{t.install.ios_step_1}</Text>
            </div>
            <div className={styles.step}>
              <span className={styles.stepIcon}><PlusSquareIcon /></span>
              <Text variant="body-sm">{t.install.ios_step_2}</Text>
            </div>
            <div className={styles.step}>
              <span className={styles.stepNum}>3</span>
              <Text variant="body-sm">{t.install.ios_step_3}</Text>
            </div>
          </div>
        )}

        {isIosChrome && (
          <Text variant="body" className={styles.hint}>{t.install.ios_chrome_hint}</Text>
        )}

        {isWebview && (
          <Text variant="body" className={styles.hint}>{t.install.webview_hint}</Text>
        )}

        {!isIos && !isIosChrome && !isWebview && (
          <div className={styles.actions}>
            <Button variant="primary" onClick={handleInstall} iconLeft={<DownloadIcon />}>
              {t.install.cta}
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
