'use client';

import { useState, useEffect, useSyncExternalStore } from 'react';
import { useStoredDismissal } from '@/hooks/useStoredDismissal';
import { Button, Text, IconButton } from '@chi-digo/design-system';
import { useTranslations } from '@/lib/i18n/context';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';
import { detectPlatform, type InstallPlatform } from '@/lib/pwa/detect';
import { track } from '@/lib/analytics/track';
import {
  ShareIcon, PlusSquareIcon, DownloadIcon, CloseIcon,
  DictIcon, ProverbIcon, QuizIcon, OfflineIcon,
} from '@/components/icons/install';
import styles from './InstallCard.module.css';

const DEV_PREVIEW = false;

const DISMISS_KEY = 'chidigo-install-dismissed';
const DISMISS_DAYS = 3;

function useIosDismiss() {
  const stored = useStoredDismissal(DISMISS_KEY, DISMISS_DAYS);
  const [dismissedNow, setDismissedNow] = useState(false);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setDismissedNow(true);
  };

  return { dismissed: stored || dismissedNow, dismiss };
}

const noSubscribe = () => () => {};

export function InstallCard() {
  const t = useTranslations();
  const { showCard, isInstalled, install, dismiss } = useInstallPrompt();
  const platform = useSyncExternalStore<InstallPlatform | null>(noSubscribe, detectPlatform, () => null);
  const iosDismiss = useIosDismiss();

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
              <Text variant="body-sm" className={styles.stepText}>{t.install.ios_step_1}</Text>
            </div>
            <div className={styles.step}>
              <span className={styles.stepIcon}><PlusSquareIcon /></span>
              <Text variant="body-sm" className={styles.stepText}>{t.install.ios_step_2}</Text>
            </div>
            <div className={styles.step}>
              <span className={styles.stepNum}>3</span>
              <Text variant="body-sm" className={styles.stepText}>{t.install.ios_step_3}</Text>
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
