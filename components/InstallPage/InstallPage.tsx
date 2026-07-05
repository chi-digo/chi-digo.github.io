'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Button, Text, Heading, DisplayText, Accordion,
  Container, Stack, Grid, Box, Inline, Skeleton, Divider,
} from '@chi-digo/design-system';
import { useTranslations } from '@/lib/i18n/context';
import { useLocale } from '@/lib/i18n/context';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';
import { detectPlatform, type InstallPlatform } from '@/lib/pwa/detect';
import { track } from '@/lib/analytics/track';
import { TrackedLink } from '@/components/Analytics/TrackedLink';
import {
  ShareIcon, PlusSquareIcon, DownloadIcon,
  DictIcon, ProverbIcon, QuizIcon, OfflineIcon,
  CopyIcon, CheckIcon,
} from '@/components/icons/install';
import styles from './InstallPage.module.css';

function VigangoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 80 144" aria-hidden="true" className={className} xmlns="http://www.w3.org/2000/svg">
      <circle cx="40" cy="16" r="14" fill="currentColor" />
      <rect x="22" y="38" width="36" height="84" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <g fill="currentColor">
        <polygon points="22,38 58,38 40,56" />
        <polygon points="22,74 58,74 40,56" />
        <polygon points="22,74 58,74 40,92" />
        <polygon points="22,110 58,110 40,92" />
        <polygon points="22,110 58,110 40,122" />
      </g>
    </svg>
  );
}

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

function CopyLinkButton({ url, t, trackRef }: { url: string; t: ReturnType<typeof useTranslations>; trackRef: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      track('install', 'page', 'copy_link', { ref: trackRef });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  }, [url, trackRef]);

  return (
    <button type="button" className={styles.copyBtn} onClick={handleCopy}>
      {copied ? <CheckIcon width="16" height="16" /> : <CopyIcon width="16" height="16" />}
      {copied ? t.install.copied : t.install.copy_link}
    </button>
  );
}

function IosSteps({ t }: { t: ReturnType<typeof useTranslations> }) {
  return (
    <Stack gap="var(--space-4)">
      <Inline gap="var(--space-3)" align="center">
        <span className={styles.stepIcon}><ShareIcon /></span>
        <Text variant="body-sm">{t.install.ios_step_1}</Text>
      </Inline>
      <Inline gap="var(--space-3)" align="center">
        <span className={styles.stepIcon}><PlusSquareIcon /></span>
        <Text variant="body-sm">{t.install.ios_step_2}</Text>
      </Inline>
      <Inline gap="var(--space-3)" align="center">
        <span className={styles.stepNum}>3</span>
        <Text variant="body-sm">{t.install.ios_step_3}</Text>
      </Inline>
    </Stack>
  );
}

function AndroidSteps({ t }: { t: ReturnType<typeof useTranslations> }) {
  return (
    <Stack gap="var(--space-4)">
      <Inline gap="var(--space-3)" align="center">
        <span className={styles.stepNum}>1</span>
        <Text variant="body-sm">{t.install.android_step_1}</Text>
      </Inline>
      <Inline gap="var(--space-3)" align="center">
        <span className={styles.stepNum}>2</span>
        <Text variant="body-sm">{t.install.android_step_2}</Text>
      </Inline>
      <Inline gap="var(--space-3)" align="center">
        <span className={styles.stepNum}>3</span>
        <Text variant="body-sm">{t.install.ios_step_3}</Text>
      </Inline>
    </Stack>
  );
}

function Features({ t }: { t: ReturnType<typeof useTranslations> }) {
  const features = [
    { icon: <DictIcon />, title: t.install.feature_dict_title, desc: t.install.feature_dict_desc },
    { icon: <ProverbIcon />, title: t.install.feature_proverbs_title, desc: t.install.feature_proverbs_desc },
    { icon: <QuizIcon />, title: t.install.feature_quiz_title, desc: t.install.feature_quiz_desc },
    { icon: <OfflineIcon />, title: t.install.feature_offline_title, desc: t.install.feature_offline_desc },
  ];

  return (
    <Box as="section" padding="clamp(1.5rem, 4vw, 2rem)" radius="var(--radius-lg, 12px)" className={styles.features}>
      <Stack gap="var(--space-4)">
        <Text variant="ui-sm" className={styles.eyebrow}>{t.install.features_heading}</Text>
        <Grid columns={2} gap="clamp(1rem, 2.5vw, 1.5rem)">
          {features.map((f) => (
            <Stack key={f.title} gap="var(--space-2)" align="center" className={styles.featureItem}>
              <span className={styles.featureIcon}>{f.icon}</span>
              <Text variant="ui-sm" weight="semibold" className={styles.featureTitle}>{f.title}</Text>
              <Text variant="body-sm" className={styles.featureDesc}>{f.desc}</Text>
            </Stack>
          ))}
        </Grid>
      </Stack>
    </Box>
  );
}

export function InstallPage() {
  const t = useTranslations();
  const { locale } = useLocale();
  const searchParams = useSearchParams();
  const ref = searchParams.get('ref') ?? 'direct';
  const { canInstall, isInstalled, install } = useInstallPrompt();
  const [platform, setPlatform] = useState<InstallPlatform | null>(null);
  const [manualPlatform, setManualPlatform] = useState<InstallPlatform | null>(null);

  const activePlatform = manualPlatform ?? platform;

  useEffect(() => {
    setPlatform(detectPlatform());
  }, []);

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

  const handleManualSelect = useCallback((selected: InstallPlatform) => {
    setManualPlatform(selected);
    track('install', 'page', 'manual_select', { detected: platform ?? 'unknown', selected, ref });
  }, [platform, ref]);

  const pageUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/${locale}/install`
    : `https://chidigo.org/${locale}/install`;

  const scrollToInstall = useCallback(() => {
    document.getElementById('install-section')?.scrollIntoView({ behavior: 'smooth' });
    track('install', 'page', 'hero_cta_tap', { platform: activePlatform ?? 'unknown', ref });
  }, [activePlatform, ref]);

  const dsLang = locale === 'dg' ? 'dig' as const : locale === 'sw' ? 'sw' as const : 'en' as const;

  // --- Already installed ---
  if (isInstalled) {
    return (
      <main className={styles.page}>
        <section className={styles.hero}>
          <Container size="content">
            <Stack gap="var(--space-4)" align="center">
              <VigangoMark className={styles.heroMark} />
              <DisplayText size="lg" as="h1" lang={dsLang} className={styles.heroTitle}>
                {t.install.hero_title}
              </DisplayText>
              <Text variant="body" color="muted" className={styles.heroSubtitle}>
                {t.install.already_installed}
              </Text>
            </Stack>
          </Container>
          <PindoBorder className={styles.pindo} />
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

  // --- Hero section ---
  const heroSection = (
    <section className={styles.hero}>
      <Container size="content">
        <Stack gap="var(--space-4)" align="center">
          <VigangoMark className={styles.heroMark} />

          <Text variant="body" as="p" className={styles.proverb} lang="dig">
            {t.hero.proverb_digo}
          </Text>
          <Text variant="body-sm" color="muted" className={styles.proverbGloss}>
            {t.hero.proverb_gloss}
          </Text>

          <DisplayText size="lg" as="h1" lang={dsLang} className={styles.heroTitle}>
            {t.install.hero_title}
          </DisplayText>
          <Text variant="body" className={styles.heroSubtitle}>
            {t.install.page_subtitle}
          </Text>

          <Stack gap="var(--space-3)" align="center">
            <Button variant="primary" onClick={scrollToInstall} iconLeft={<DownloadIcon />}>
              {t.install.hero_install_cta}
            </Button>
            <TrackedLink
              href="/"
              source="install_page"
              className={styles.heroExploreLink}
              onClick={() => track('install', 'page', 'explore_first', { platform: activePlatform ?? 'unknown', ref })}
            >
              {t.install.explore_first} →
            </TrackedLink>
          </Stack>
        </Stack>
      </Container>
      <PindoBorder className={styles.pindo} />
    </section>
  );

  // --- Value prop section ---
  const valuePropSection = (
    <section className={styles.valueProp}>
    <Stack gap="var(--space-3)">
      <div className={styles.pullQuote}>
        <Text variant="body-lg" weight="medium" className={styles.valuePropEmotional}>
          {t.install.value_prop_emotional}
        </Text>
      </div>
      <Text variant="body" color="muted">
        {t.install.value_prop_practical}
      </Text>
    </Stack>
    </section>
  );

  // --- Loading: show persuasion + shimmer ---
  if (!platform) {
    return (
      <main className={styles.page}>
        {heroSection}
        <div className={styles.body}>
          <Container size="content">
            <Stack gap="clamp(2rem, 4vw, 3rem)">
              {valuePropSection}
              <Features t={t} />
              <Text variant="ui-sm" weight="semibold" className={styles.communityLine}>
                {t.install.community_line}
              </Text>
              <Skeleton variant="rectangular" height="200px" style={{ borderRadius: 'var(--radius-lg, 12px)' }} />
            </Stack>
          </Container>
        </div>
      </main>
    );
  }

  // --- Full page with install instructions ---
  const isWebview = activePlatform === 'webview';
  const isIos = activePlatform === 'ios-safari';
  const isIosChrome = activePlatform === 'ios-chrome';
  const isAndroid = activePlatform === 'android';
  const isDesktop = activePlatform === 'desktop';

  const platformLabel = isWebview
    ? t.install.webview_title
    : isIos
      ? 'iPhone (Safari)'
      : isIosChrome
        ? 'iPhone (Chrome)'
        : isAndroid
          ? 'Android'
          : t.install.platform_desktop;

  const accordionItems = [];

  if (!isIos && !isIosChrome) {
    accordionItems.push({
      id: 'ios',
      title: 'iPhone / iPad (Safari)',
      content: <IosSteps t={t} />,
    });
  }

  if (!isAndroid) {
    accordionItems.push({
      id: 'android',
      title: t.install.platform_android,
      content: canInstall ? (
        <Stack align="center" gap="var(--space-2)">
          <Button variant="primary" onClick={handleInstall} iconLeft={<DownloadIcon />}>
            {t.install.install_button}
          </Button>
        </Stack>
      ) : (
        <AndroidSteps t={t} />
      ),
    });
  }

  if (!isDesktop) {
    accordionItems.push({
      id: 'desktop',
      title: t.install.platform_desktop,
      content: (
        <Stack gap="var(--space-4)">
          <Inline gap="var(--space-3)" align="center">
            <span className={styles.stepNum}>1</span>
            <Text variant="body-sm">{t.install.android_step_1}</Text>
          </Inline>
          <Inline gap="var(--space-3)" align="center">
            <span className={styles.stepNum}>2</span>
            <Text variant="body-sm">{`"${t.install.install_button}"`}</Text>
          </Inline>
        </Stack>
      ),
    });
  }

  return (
    <main className={styles.page}>
      {heroSection}

      <div className={styles.body}>
        <Container size="content">
          <Stack gap="clamp(2rem, 4vw, 3rem)">
            {valuePropSection}
            <Features t={t} />

            <Text variant="ui-sm" weight="semibold" className={styles.communityLine}>
              {t.install.community_line}
            </Text>

            <Divider />

            {/* Transition heading */}
            <Heading level={2} id="install-section" className={styles.installHeading}>
              {t.install.install_heading}
            </Heading>

            {/* Primary instructions for detected platform */}
            <Box as="section" padding="clamp(1.5rem, 4vw, 2rem)" radius="var(--radius-lg, 12px)" className={styles.primaryCard}>
              <Stack gap="var(--space-4)">
                <Text variant="ui-sm" className={styles.platformLabel}>{platformLabel}</Text>

                {isWebview && (
                  <Stack gap="var(--space-4)" align="center">
                    <Text variant="body" weight="medium" className={styles.webviewExplain}>
                      {t.install.webview_title}
                    </Text>
                    {/Android/i.test(typeof navigator !== 'undefined' ? navigator.userAgent : '') ? (
                      <Button
                        variant="primary"
                        onClick={() => {
                          track('install', 'page', 'open_browser', { platform: 'webview', target_browser: 'chrome', ref });
                          window.location.href = `intent://${pageUrl.replace(/^https?:\/\//, '')}#Intent;scheme=https;end`;
                        }}
                      >
                        {t.install.webview_open_chrome}
                      </Button>
                    ) : (
                      <Button
                        variant="primary"
                        onClick={() => {
                          track('install', 'page', 'open_browser', { platform: 'webview', target_browser: 'safari', ref });
                        }}
                        disabled
                        style={{ opacity: 0.5 }}
                      >
                        {t.install.webview_open_safari}
                      </Button>
                    )}
                    <CopyLinkButton url={pageUrl} t={t} trackRef={ref} />
                    <Text variant="body-sm" color="muted">{t.install.webview_then}</Text>
                  </Stack>
                )}

                {isIos && <IosSteps t={t} />}

                {isIosChrome && (
                  <Stack gap="var(--space-4)" align="center">
                    <Text variant="body">{t.install.ios_chrome_hint}</Text>
                    <CopyLinkButton url={pageUrl} t={t} trackRef={ref} />
                  </Stack>
                )}

                {isAndroid && canInstall && (
                  <Stack align="center" gap="var(--space-2)">
                    <Button variant="primary" onClick={handleInstall} iconLeft={<DownloadIcon />}>
                      {t.install.install_button}
                    </Button>
                  </Stack>
                )}

                {isAndroid && !canInstall && <AndroidSteps t={t} />}

                {isDesktop && canInstall && (
                  <Stack align="center" gap="var(--space-2)">
                    <Button variant="primary" onClick={handleInstall} iconLeft={<DownloadIcon />}>
                      {t.install.install_button}
                    </Button>
                  </Stack>
                )}

                {isDesktop && !canInstall && (
                  <Stack gap="var(--space-4)">
                    <Inline gap="var(--space-3)" align="center">
                      <span className={styles.stepNum}>1</span>
                      <Text variant="body-sm">{t.install.android_step_1}</Text>
                    </Inline>
                    <Inline gap="var(--space-3)" align="center">
                      <span className={styles.stepNum}>2</span>
                      <Text variant="body-sm">{`"${t.install.install_button}"`}</Text>
                    </Inline>
                  </Stack>
                )}
              </Stack>
            </Box>

            {/* Other platforms */}
            {accordionItems.length > 0 && (
              <Accordion items={accordionItems} />
            )}

            {/* Manual platform selector */}
            <Inline gap="var(--space-3)" align="center" wrap>
              <Text variant="body-sm" color="muted">{t.install.not_your_device}</Text>
              <Inline gap="var(--space-2)" wrap>
                {(['ios-safari', 'android', 'desktop'] as const).filter(p => p !== activePlatform).map(p => (
                  <button
                    key={p}
                    type="button"
                    className={styles.manualBtn}
                    onClick={() => handleManualSelect(p)}
                  >
                    {p === 'ios-safari' ? 'iPhone / iPad' : p === 'android' ? 'Android' : t.install.platform_desktop}
                  </button>
                ))}
              </Inline>
            </Inline>

            {/* QR code section — desktop only */}
            <Box as="section" padding="clamp(1.5rem, 4vw, 2rem)" radius="var(--radius-lg, 12px)" className={styles.qrSection}>
              <Stack gap="var(--space-2)" align="center">
                <Heading level={3}>{t.install.qr_heading}</Heading>
                <Text variant="body-sm" color="muted">{t.install.qr_body}</Text>
                <div className={styles.qrPlaceholder}>
                  <Text variant="body-sm" color="muted">QR → chidigo.org/install</Text>
                </div>
              </Stack>
            </Box>

            {/* Explore first */}
            <Stack align="center">
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
