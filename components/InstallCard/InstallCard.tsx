'use client';

import { useState, useEffect } from 'react';
import { Card, Button, Text, Stack, IconButton } from '@chi-digo/design-system';
import { useTranslations } from '@/lib/i18n/context';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';
import { detectPlatform, type InstallPlatform } from '@/lib/pwa/detect';
import { track } from '@/lib/analytics/track';
import styles from './InstallCard.module.css';

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

export function InstallCard() {
  const t = useTranslations();
  const { canInstall, showCard, isInstalled, install, dismiss } = useInstallPrompt();
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

  if (isInstalled || !platform) return null;

  if (platform === 'ios-safari') {
    if (iosDismiss.dismissed) return null;
    return (
      <section className={styles.section}>
        <Card className={styles.card}>
          <div className={styles.header}>
            <Text variant="ui-sm" className={styles.eyebrow}>{t.install.eyebrow}</Text>
            <IconButton
              variant="ghost"
              size="sm"
              icon={<CloseIcon />}
              label={t.install.ios_dismiss}
              onClick={() => {
                iosDismiss.dismiss();
                track('install', 'card', 'dismiss', { platform });
              }}
            />
          </div>
          <Text variant="body">{t.install.body}</Text>
          <Stack gap="var(--space-3)" className={styles.steps}>
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
          </Stack>
        </Card>
      </section>
    );
  }

  if (platform === 'ios-chrome') {
    if (iosDismiss.dismissed) return null;
    return (
      <section className={styles.section}>
        <Card className={styles.card}>
          <div className={styles.header}>
            <Text variant="ui-sm" className={styles.eyebrow}>{t.install.eyebrow}</Text>
            <IconButton
              variant="ghost"
              size="sm"
              icon={<CloseIcon />}
              label={t.install.dismiss}
              onClick={() => {
                iosDismiss.dismiss();
                track('install', 'card', 'dismiss', { platform });
              }}
            />
          </div>
          <Text variant="body">{t.install.ios_chrome_hint}</Text>
        </Card>
      </section>
    );
  }

  if (platform === 'webview') {
    if (iosDismiss.dismissed) return null;
    return (
      <section className={styles.section}>
        <Card className={styles.card}>
          <div className={styles.header}>
            <Text variant="ui-sm" className={styles.eyebrow}>{t.install.eyebrow}</Text>
            <IconButton
              variant="ghost"
              size="sm"
              icon={<CloseIcon />}
              label={t.install.dismiss}
              onClick={() => {
                iosDismiss.dismiss();
                track('install', 'card', 'dismiss', { platform });
              }}
            />
          </div>
          <Text variant="body">{t.install.webview_hint}</Text>
        </Card>
      </section>
    );
  }

  // Android / Desktop — standard beforeinstallprompt flow
  if (!showCard) return null;

  return (
    <section className={styles.section}>
      <Card className={styles.card}>
        <div className={styles.header}>
          <Text variant="ui-sm" className={styles.eyebrow}>{t.install.eyebrow}</Text>
          <IconButton
            variant="ghost"
            size="sm"
            icon={<CloseIcon />}
            label={t.install.dismiss}
            onClick={() => {
              dismiss();
              track('install', 'card', 'dismiss', { platform });
            }}
          />
        </div>
        <Text variant="body">{t.install.body}</Text>
        <div className={styles.actions}>
          <Button
            variant="primary"
            onClick={() => {
              install();
              track('install', 'card', 'tap_install', { platform });
            }}
          >
            {t.install.cta}
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              dismiss();
              track('install', 'card', 'dismiss', { platform });
            }}
          >
            {t.install.dismiss}
          </Button>
        </div>
      </Card>
    </section>
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
