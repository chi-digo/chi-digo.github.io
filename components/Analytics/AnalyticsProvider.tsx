'use client';

import Script from 'next/script';
import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { GA_ID, initConsent, hasConsent, grantConsent, setUserProperties } from '@/lib/analytics/gtag';
import { track, type Journey } from '@/lib/analytics/track';
import { useLocale } from '@/lib/i18n/context';

/** Map pathname to a journey + stage for automatic page-view events. */
function getPageView(pathname: string): { journey: Journey; stage: string } | null {
  if (pathname === '/') return { journey: 'orientation', stage: 'home' };
  if (pathname === '/about') return { journey: 'orientation', stage: 'about' };
  if (pathname === '/mission') return { journey: 'orientation', stage: 'mission' };
  if (pathname === '/vision') return { journey: 'orientation', stage: 'vision' };
  if (pathname === '/contact') return { journey: 'contact', stage: 'form' };
  if (pathname === '/culture') return { journey: 'culture', stage: 'overview' };
  if (pathname.startsWith('/culture/') && pathname.split('/').length === 3) return { journey: 'culture', stage: 'domain' };
  if (pathname.startsWith('/culture/') && pathname.split('/').length === 4) return { journey: 'culture', stage: 'article' };
  if (pathname === '/language') return { journey: 'language', stage: 'overview' };
  if (pathname === '/language/dictionary') return { journey: 'dictionary', stage: 'home' };
  if (pathname.startsWith('/language/dictionary/word/')) return { journey: 'dictionary', stage: 'word' };
  if (pathname.startsWith('/language/dictionary/letter/')) return { journey: 'dictionary', stage: 'browse' };
  if (pathname.startsWith('/language/dictionary')) return { journey: 'dictionary', stage: 'search' };
  if (pathname === '/language/proverbs') return { journey: 'proverbs', stage: 'home' };
  if (pathname.startsWith('/language/proverbs/theme/')) return { journey: 'proverbs', stage: 'theme' };
  if (pathname.startsWith('/language/proverbs/letter/')) return { journey: 'proverbs', stage: 'browse' };
  if (pathname.startsWith('/language/proverbs/p-')) return { journey: 'proverbs', stage: 'detail' };
  if (pathname === '/language/quiz') return { journey: 'language', stage: 'quiz' };
  if (pathname.startsWith('/language/')) return { journey: 'language', stage: 'article' };
  if (pathname === '/history') return { journey: 'history', stage: 'overview' };
  if (pathname.startsWith('/history/')) return { journey: 'history', stage: 'article' };
  return null;
}

export function AnalyticsProvider() {
  const pathname = usePathname();
  const { locale } = useLocale();
  const prevPathname = useRef(pathname);
  const initialized = useRef(false);

  // Initialize consent mode on first mount
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    initConsent();
    if (hasConsent()) {
      grantConsent();
    }
    // Set user properties
    setUserProperties({
      preferred_locale: locale,
      first_locale: localStorage.getItem('chidigo-first-locale') || locale,
    });
    if (!localStorage.getItem('chidigo-first-locale')) {
      localStorage.setItem('chidigo-first-locale', locale);
    }
  }, [locale]);

  // Track page views on pathname change
  useEffect(() => {
    const pageView = getPageView(pathname);
    if (pageView) {
      const params: Record<string, string> = {
        locale,
        pathname,
      };
      if (prevPathname.current !== pathname) {
        params.referrer_path = prevPathname.current;
      }
      // Extract content identifiers from path
      const segments = pathname.split('/').filter(Boolean);
      if (segments[0] === 'culture' && segments[1]) params.domain = segments[1];
      if (segments[0] === 'culture' && segments[2]) params.topic = segments[2];
      if (segments[0] === 'language' && segments[1]) params.topic = segments[1];
      if (segments[0] === 'history' && segments[1]) params.topic = segments[1];
      if (segments[0] === 'dictionary' && segments[1] === 'word' && segments[2]) {
        params.headword = decodeURIComponent(segments[2]);
      }
      if (segments[0] === 'dictionary' && segments[1] === 'letter' && segments[2]) {
        params.letter = decodeURIComponent(segments[2]);
      }
      if (segments[0] === 'proverbs' && segments[1] === 'theme' && segments[2]) {
        params.theme = decodeURIComponent(segments[2]);
      }
      if (segments[0] === 'proverbs' && segments[1] === 'letter' && segments[2]) {
        params.letter = decodeURIComponent(segments[2]);
      }
      if (segments[0] === 'proverbs' && segments[1]?.startsWith('p-')) {
        params.proverb_slug = decodeURIComponent(segments[1]);
      }

      track(
        pageView.journey,
        pageView.stage,
        'view',
        params,
      );
    }
    prevPathname.current = pathname;
  }, [pathname, locale]);

  // Update user properties when locale changes
  useEffect(() => {
    setUserProperties({ preferred_locale: locale });
  }, [locale]);

  if (!GA_ID || process.env.NODE_ENV !== 'production') return null;

  return (
    <Script
      src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
      strategy="afterInteractive"
    />
  );
}
