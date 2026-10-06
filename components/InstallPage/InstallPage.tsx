'use client';

import { useState, useEffect, useCallback, useSyncExternalStore, type ReactNode } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button, Text, Heading, DisplayText, Container, Stack, Skeleton } from '@chi-digo/design-system';
import { useTranslations, useLocale } from '@/lib/i18n/context';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';
import { detectPlatform, type InstallPlatform } from '@/lib/pwa/detect';
import { track } from '@/lib/analytics/track';
import { TrackedLink } from '@/components/Analytics/TrackedLink';
import {
  ShareIcon, PlusSquareIcon, DownloadIcon, CopyIcon, CheckIcon,
  DictIcon, ProverbIcon, QuizIcon,
} from '@/components/icons/install';
import styles from './InstallPage.module.css';

type T = ReturnType<typeof useTranslations>;

const PROD_INSTALL_URL = 'https://chidigo.org/install';

const noopSubscribe = () => () => {};

function PindoBorder({ className }: { className?: string }) {
  return (
    <div className={className} aria-hidden="true">
      <svg viewBox="0 0 80 24" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <line x1="0" y1="3" x2="80" y2="3" stroke="currentColor" strokeWidth="0.6" />
        <line x1="0" y1="21" x2="80" y2="21" stroke="currentColor" strokeWidth="0.6" />
        <polygon points="10,6 16,12 10,18 4,12" fill="currentColor" />
        <polygon points="30,6 36,12 30,18 24,12" fill="none" stroke="currentColor" strokeWidth="0.6" />
        <polygon points="50,6 56,12 50,18 44,12" fill="currentColor" />
        <polygon points="70,6 76,12 70,18 64,12" fill="none" stroke="currentColor" strokeWidth="0.6" />
      </svg>
    </div>
  );
}

/** The app icon as it appears on a phone home screen. */
function HomeScreenIcon({ size = 'md' }: { size?: 'md' | 'lg' }) {
  return (
    <div className={`${styles.homeIcon} ${size === 'lg' ? styles.homeIconLg : ''}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/icons/icon-192.png" alt="" width={192} height={192} />
      <span>Chidigo</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Mini mock-ups of browser UI. Each one shows the control the user should tap,
// highlighted, so they can match it against what's on their own screen.
// ---------------------------------------------------------------------------

function Dots({ vertical }: { vertical?: boolean }) {
  return <span className={styles.dots} aria-hidden="true">{vertical ? '⋮' : '⋯'}</span>;
}

function Hit({ children }: { children: ReactNode }) {
  return <span className={styles.hit}>{children}</span>;
}

type VisualKind =
  | 'android-menu' | 'android-item' | 'android-confirm'
  | 'ios-share' | 'ios-chrome-share' | 'ios-item' | 'ios-confirm'
  | 'webview-menu' | 'webview-item';

function StepVisual({ kind }: { kind: VisualKind }) {
  switch (kind) {
    case 'android-menu':
      return (
        <div className={styles.mock} aria-hidden="true">
          <div className={styles.mockBar}>
            <span className={styles.mockUrl}>chidigo.org</span>
            <Hit><Dots vertical /></Hit>
          </div>
        </div>
      );
    case 'android-item':
      return (
        <div className={styles.mock} aria-hidden="true">
          <div className={styles.mockSheet}>
            <span className={styles.mockRow}>New tab</span>
            <span className={styles.mockRow}>Bookmarks</span>
            <Hit><span className={styles.mockRowHit}><DownloadIcon width="14" height="14" /> Add to home screen</span></Hit>
          </div>
        </div>
      );
    case 'android-confirm':
      return (
        <div className={styles.mock} aria-hidden="true">
          <div className={styles.mockDialog}>
            <span className={styles.mockDialogTitle}>Install app?</span>
            <span className={styles.mockDialogActions}>
              <span>Cancel</span>
              <Hit><span className={styles.mockAction}>Install</span></Hit>
            </span>
          </div>
        </div>
      );
    case 'ios-share':
      return (
        <div className={styles.mock} aria-hidden="true">
          <div className={styles.mockBar}>
            <span>‹</span><span>›</span>
            <Hit><ShareIcon width="16" height="16" /></Hit>
            <span className={styles.mockGlyph}>▢</span><span className={styles.mockGlyph}>⧉</span>
          </div>
        </div>
      );
    case 'ios-chrome-share':
      return (
        <div className={styles.mock} aria-hidden="true">
          <div className={styles.mockBar}>
            <span className={styles.mockUrl}>chidigo.org</span>
            <Hit><ShareIcon width="16" height="16" /></Hit>
          </div>
        </div>
      );
    case 'ios-item':
      return (
        <div className={styles.mock} aria-hidden="true">
          <div className={styles.mockSheet}>
            <span className={styles.mockRow}>Copy</span>
            <span className={styles.mockRow}>Add to Reading List</span>
            <Hit><span className={styles.mockRowHit}>Add to Home Screen <PlusSquareIcon width="14" height="14" className={styles.mockTrail} /></span></Hit>
          </div>
        </div>
      );
    case 'ios-confirm':
      return (
        <div className={styles.mock} aria-hidden="true">
          <div className={styles.mockBar}>
            <span>Cancel</span>
            <span className={styles.mockBarTitle}>Add to Home Screen</span>
            <Hit><span className={styles.mockAction}>Add</span></Hit>
          </div>
        </div>
      );
    case 'webview-menu':
      return (
        <div className={styles.mock} aria-hidden="true">
          <div className={styles.mockBar}>
            <span>✕</span>
            <span className={styles.mockUrl}>chidigo.org</span>
            <Hit><Dots /></Hit>
          </div>
        </div>
      );
    case 'webview-item':
      return (
        <div className={styles.mock} aria-hidden="true">
          <div className={styles.mockSheet}>
            <span className={styles.mockRow}>Copy link</span>
            <Hit><span className={styles.mockRowHit}>Open in browser</span></Hit>
          </div>
        </div>
      );
  }
}

/** Secondary guidance inside the card — one style for every tip and fallback. */
function Note({ children }: { children: ReactNode }) {
  return <Text variant="body-sm" className={styles.note}>{children}</Text>;
}

type Step = { text: string; visual?: VisualKind };

function Steps({ steps }: { steps: Step[] }) {
  return (
    <ol className={styles.steps}>
      {steps.map((s, i) => (
        <li key={s.text} className={styles.step}>
          <span className={styles.stepNum}>{i + 1}</span>
          <Text variant="ui" weight="medium" className={styles.stepText}>{s.text}</Text>
          {s.visual && <div className={styles.stepVisual}><StepVisual kind={s.visual} /></div>}
        </li>
      ))}
    </ol>
  );
}

function CopyLinkButton({ url, t, trackRef }: { url: string; t: T; trackRef: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      track('install', 'page', 'copy_link', { ref: trackRef });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable (some in-app browsers) — the URL is shown as text instead.
    }
  }, [url, trackRef]);

  return (
    <button type="button" className={styles.secondaryBtn} onClick={handleCopy}>
      {copied ? <CheckIcon width="16" height="16" /> : <CopyIcon width="16" height="16" />}
      {copied ? t.install.copied : t.install.copy_link}
    </button>
  );
}

function webviewAppName(t: T): string {
  if (typeof navigator === 'undefined') return t.install.webview_app_generic;
  const ua = navigator.userAgent;
  if (/WhatsApp/i.test(ua)) return 'WhatsApp';
  if (/Instagram/i.test(ua)) return 'Instagram';
  if (/FBAN|FBAV/i.test(ua)) return 'Facebook';
  return t.install.webview_app_generic;
}

export function InstallPage() {
  const t = useTranslations();
  const { locale } = useLocale();
  const searchParams = useSearchParams();
  const ref = searchParams.get('ref') ?? 'direct';
  const { canInstall, isInstalled, install } = useInstallPrompt();
  // Detected client-side only; null during SSR so the instructions render after hydration.
  const platform = useSyncExternalStore<InstallPlatform | null>(noopSubscribe, detectPlatform, () => null);
  const [manualPlatform, setManualPlatform] = useState<InstallPlatform | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [flashId, setFlashId] = useState<string | null>(null);

  const activePlatform = manualPlatform ?? platform;

  useEffect(() => {
    if (platform) {
      track('install', 'page', 'view', { platform, ref });
    }
  }, [platform, ref]);

  const handleInstall = useCallback(async () => {
    track('install', 'page', 'tap_install', { platform: activePlatform ?? 'unknown', ref });
    const outcome = await install();
    if (outcome) {
      track('install', 'prompt', outcome, { platform: activePlatform ?? 'unknown', ref });
    }
  }, [install, activePlatform, ref]);

  // Hero button: native prompt where the browser offers one, otherwise point at the steps.
  const handleHeroInstall = useCallback(async () => {
    if (canInstall) {
      track('install', 'page', 'hero_install', { platform: platform ?? 'unknown', ref, result: 'prompt' });
      await handleInstall();
      return;
    }
    track('install', 'page', 'hero_install', { platform: platform ?? 'unknown', ref, result: 'instructions' });
    setManualPlatform(null);
    setShowPicker(false);
    const id = platform === 'desktop' ? 'install-here' : 'install-card';
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setFlashId(id);
    setTimeout(() => setFlashId(null), 2400);
  }, [canInstall, handleInstall, platform, ref]);

  const handleManualSelect = useCallback((selected: InstallPlatform) => {
    setManualPlatform(selected);
    setShowPicker(false);
    track('install', 'page', 'manual_select', { detected: platform ?? 'unknown', selected, ref });
  }, [platform, ref]);

  const pageUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${locale === 'en' ? '' : `/${locale}`}/install`
    : PROD_INSTALL_URL;

  const dsLang = locale === 'dg' ? 'dig' as const : locale === 'sw' ? 'sw' as const : 'en' as const;

  // --- Already installed ---
  if (isInstalled) {
    return (
      <main className={styles.page}>
        <section className={styles.hero}>
          <Container size="content">
            <Stack gap="var(--space-4)" align="center">
              <HomeScreenIcon size="lg" />
              <DisplayText size="lg" as="h1" lang={dsLang} className={styles.heroTitle}>
                {t.install.already_installed}
              </DisplayText>
            </Stack>
          </Container>
        </section>
        <div className={styles.body}>
          <Container size="content">
            <Stack gap="var(--space-3)" align="center" className={styles.installedActions}>
              <TrackedLink href="/language/dictionary" source="install_page">
                <Button variant="primary">{t.install.offline_dict}</Button>
              </TrackedLink>
              <TrackedLink href="/language/proverbs" source="install_page">
                <Button variant="secondary">{t.install.offline_proverbs}</Button>
              </TrackedLink>
              <TrackedLink href="/language/quiz" source="install_page">
                <Button variant="secondary">{t.install.offline_quiz}</Button>
              </TrackedLink>
            </Stack>
          </Container>
        </div>
      </main>
    );
  }

  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const isAndroidUA = /Android/i.test(ua);
  const isFirefox = /Firefox|FxiOS/i.test(ua);
  const isMacSafari = /Macintosh/.test(ua) && /Safari/.test(ua) && !/Chrome|Chromium|Edg|OPR|Firefox/.test(ua);

  // --- Instructions for the active platform ---
  let platformLabel = '';
  let instructions: ReactNode = null;

  switch (activePlatform) {
    case 'android':
      platformLabel = t.install.on_android;
      instructions = canInstall ? (
        <Stack gap="var(--space-4)">
          <Button variant="primary" onClick={handleInstall} iconLeft={<DownloadIcon />} size="lg" className={styles.bigBtn}>
            {t.install.android_add_button}
          </Button>
          <Note>{t.install.android_prompt_note}</Note>
          <StepVisual kind="android-confirm" />
          <details className={styles.disclosure}>
            <summary>{t.install.android_menu_fallback}</summary>
            <Steps steps={[
              { text: t.install.android_s1, visual: 'android-menu' },
              { text: t.install.android_s2, visual: 'android-item' },
              { text: t.install.android_s3, visual: 'android-confirm' },
            ]} />
          </details>
        </Stack>
      ) : (
        <Steps steps={[
          { text: t.install.android_s1, visual: 'android-menu' },
          { text: t.install.android_s2, visual: 'android-item' },
          { text: t.install.android_s3, visual: 'android-confirm' },
        ]} />
      );
      break;

    case 'ios-safari':
      platformLabel = t.install.on_iphone;
      instructions = (
        <Stack gap="var(--space-4)">
          <Steps steps={[
            { text: t.install.ios_s1, visual: 'ios-share' },
            { text: t.install.ios_s2, visual: 'ios-item' },
            { text: t.install.ios_s3, visual: 'ios-confirm' },
          ]} />
          <Note>{t.install.ios_compass_hint}</Note>
        </Stack>
      );
      break;

    case 'ios-chrome':
      platformLabel = t.install.on_iphone;
      instructions = (
        <Stack gap="var(--space-4)">
          <Steps steps={[
            { text: t.install.ios_chrome_s1, visual: 'ios-chrome-share' },
            { text: t.install.ios_s2, visual: 'ios-item' },
            { text: t.install.ios_s3, visual: 'ios-confirm' },
          ]} />
          <Note>{t.install.ios_chrome_fallback}</Note>
          <CopyLinkButton url={pageUrl} t={t} trackRef={ref} />
        </Stack>
      );
      break;

    case 'webview': {
      const app = webviewAppName(t);
      platformLabel = t.install.in_app.replace('{app}', app);
      instructions = (
        <Stack gap="var(--space-4)">
          <Heading level={3} className={styles.cardTitle}>{t.install.webview_title}</Heading>
          <Text variant="ui">{t.install.webview_body.replace('{app}', app)}</Text>
          {isAndroidUA ? (
            <Button
              variant="primary"
              size="lg" className={styles.bigBtn}
              onClick={() => {
                track('install', 'page', 'open_browser', { platform: 'webview', target_browser: 'chrome', ref });
                window.location.href = `intent://${pageUrl.replace(/^https?:\/\//, '')}#Intent;scheme=https;package=com.android.chrome;end`;
              }}
            >
              {t.install.webview_open_chrome}
            </Button>
          ) : (
            <Steps steps={[
              { text: t.install.webview_ios_s1, visual: 'webview-menu' },
              { text: t.install.webview_ios_s2, visual: 'webview-item' },
            ]} />
          )}
          <Note>{t.install.webview_copy_hint}</Note>
          <CopyLinkButton url={pageUrl} t={t} trackRef={ref} />
        </Stack>
      );
      break;
    }

    case 'desktop': {
      const waText = encodeURIComponent(`${t.install.share_message} ${PROD_INSTALL_URL}?ref=whatsapp`);
      platformLabel = t.install.on_computer;
      instructions = (
        <div className={styles.desktopGrid}>
          <div className={styles.qrBox}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/install-qr.svg" alt={PROD_INSTALL_URL} width={176} height={176} />
          </div>
          <Stack gap="var(--space-3)">
            <Heading level={3} className={styles.cardTitle}>{t.install.desktop_title}</Heading>
            <Text variant="ui">{t.install.desktop_body}</Text>
            <div className={styles.btnRow}>
              <a
                className={styles.secondaryBtn}
                href={`https://wa.me/?text=${waText}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => track('install', 'page', 'share_whatsapp', { ref })}
              >
                {t.install.desktop_whatsapp}
              </a>
              <CopyLinkButton url={PROD_INSTALL_URL} t={t} trackRef={ref} />
            </div>
            <div id="install-here" className={`${styles.desktopLocal} ${flashId === 'install-here' ? styles.flash : ''}`}>
              {canInstall ? (
                <button type="button" className={styles.textBtn} onClick={handleInstall}>
                  <DownloadIcon width="16" height="16" /> {t.install.desktop_install_here}
                </button>
              ) : (
                <Stack gap="var(--space-3)">
                  <Heading level={3} className={styles.cardTitle}>{t.install.desktop_here_title}</Heading>
                  {isMacSafari ? (
                    <Steps steps={[
                      { text: t.install.mac_safari_s1 },
                      { text: t.install.mac_safari_s2 },
                      { text: t.install.mac_safari_s3 },
                    ]} />
                  ) : (
                    <Note>{isFirefox ? t.install.desktop_unsupported : t.install.desktop_chromium_hint}</Note>
                  )}
                </Stack>
              )}
            </div>
          </Stack>
        </div>
      );
      break;
    }
  }

  const pickerOptions = (['ios-safari', 'android', 'desktop'] as const).filter((p) => {
    if (p === 'ios-safari') return activePlatform !== 'ios-safari' && activePlatform !== 'ios-chrome';
    return p !== activePlatform;
  });

  const pickerLabel = (p: InstallPlatform) =>
    p === 'ios-safari' ? t.install.device_iphone : p === 'android' ? t.install.device_android : t.install.device_computer;

  return (
    <main className={styles.page}>
      {/* Hero: what this is, in one glance */}
      <section className={styles.hero}>
        <Container size="content">
          <div className={styles.heroInner}>
            <HomeScreenIcon size="lg" />
            <DisplayText size="lg" as="h1" lang={dsLang} className={styles.heroTitle}>
              {t.install.hero_title}
            </DisplayText>
            <Text variant="body-lg" className={styles.heroSub}>{t.install.hero_sub}</Text>
            <Button variant="primary" size="lg" onClick={handleHeroInstall} iconLeft={<DownloadIcon />} className={styles.heroBtn}>
              {t.install.install_cta}
            </Button>
          </div>
        </Container>
      </section>

      <div className={styles.body}>
        <Container size="content">
          <Stack gap="clamp(2rem, 5vw, 3rem)">
            {/* Instructions — the reason this page exists */}
            <section
              id="install-card"
              className={`${styles.card} ${flashId === 'install-card' ? styles.flash : ''}`}
              aria-labelledby="install-steps-label"
            >
              {activePlatform ? (
                <Stack gap="var(--space-5, 1.25rem)">
                  <span id="install-steps-label" className={styles.chip}>{platformLabel}</span>
                  {instructions}
                </Stack>
              ) : (
                <Skeleton variant="rectangular" height="260px" style={{ borderRadius: 'var(--radius-md, 8px)' }} />
              )}
            </section>

            {activePlatform && (
              <div className={styles.picker}>
                {showPicker ? (
                  <div className={styles.btnRow}>
                    {pickerOptions.map((p) => (
                      <button key={p} type="button" className={styles.secondaryBtn} onClick={() => handleManualSelect(p)}>
                        {pickerLabel(p)}
                      </button>
                    ))}
                  </div>
                ) : (
                  <button type="button" className={styles.textBtn} onClick={() => setShowPicker(true)}>
                    {t.install.other_device}
                  </button>
                )}
              </div>
            )}

            {/* What success looks like */}
            {activePlatform !== 'desktop' && (
              <section className={styles.done}>
                <HomeScreenIcon />
                <div>
                  <Heading level={3} className={styles.doneTitle}>{t.install.done_title}</Heading>
                  <Text variant="body-sm" className={styles.muted}>{t.install.done_body}</Text>
                </div>
              </section>
            )}

            {/* Reassurance */}
            <ul className={styles.reassure}>
              <li>{t.install.reassure_free}</li>
              <li>{t.install.reassure_no_store}</li>
              <li>{t.install.reassure_offline}</li>
              <li>{t.install.reassure_remove}</li>
            </ul>

            {/* What's inside — short, after the job is done */}
            <section className={styles.inside}>
              <Text variant="ui-sm" className={styles.eyebrow}>{t.install.inside_heading}</Text>
              <div className={styles.insideGrid}>
                {[
                  { icon: <DictIcon />, title: t.install.feature_dict_title, desc: t.install.feature_dict_desc },
                  { icon: <ProverbIcon />, title: t.install.feature_proverbs_title, desc: t.install.feature_proverbs_desc },
                  { icon: <QuizIcon />, title: t.install.feature_quiz_title, desc: t.install.feature_quiz_desc },
                ].map((f) => (
                  <div key={f.title} className={styles.insideItem}>
                    <span className={styles.insideIcon}>{f.icon}</span>
                    <div>
                      <Text variant="ui" weight="semibold">{f.title}</Text>
                      <Text variant="body-sm" className={styles.muted}>{f.desc}</Text>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Closing */}
            <Stack gap="var(--space-2)" align="center" className={styles.closing}>
              <PindoBorder className={styles.pindo} />
              <Text variant="body" as="p" className={styles.proverb} lang="dig">{t.hero.proverb_digo}</Text>
              <Text variant="body-sm" className={styles.muted}>{t.hero.proverb_gloss}</Text>
              <TrackedLink
                href="/"
                source="install_page"
                className={styles.exploreLink}
                onClick={() => track('install', 'page', 'explore_first', { platform: activePlatform ?? 'unknown', ref })}
              >
                {t.install.explore_first} →
              </TrackedLink>
            </Stack>
          </Stack>
        </Container>
      </div>
    </main>
  );
}
