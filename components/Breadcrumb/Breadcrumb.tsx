'use client';

import { type ReactNode, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { useTranslations, useLocale } from '@/lib/i18n/context';
import { getDomain, getTopic } from '@/lib/culture/content';
import { getHistoryTopic, historyDomain } from '@/lib/history/content';
import { getLanguageTopic } from '@/lib/language/content';
import { getTheme } from '@/lib/proverbs/themes';
import { trackNavClick } from '@/lib/analytics/track';
import { Breadcrumb as BreadcrumbDS, type BreadcrumbItem } from '@chi-digo/design-system';

export function Breadcrumb() {
  const pathname = usePathname();
  const t = useTranslations();
  const { locale } = useLocale();

  if (pathname === '/') return null;

  const segments = pathname.split('/').filter(Boolean);
  const items: BreadcrumbItem[] = [{ label: t.breadcrumb.home, href: '/' }];

  if (segments[0] === 'culture') {
    items.push({
      label: t.breadcrumb.culture,
      href: segments.length > 1 ? '/culture' : undefined,
    });

    if (segments[1]) {
      const domain = getDomain(segments[1]);
      if (domain) {
        items.push({
          label: domain.title[locale],
          href: segments[2] ? `/culture/${segments[1]}` : undefined,
        });
      }

      if (segments[2]) {
        const result = getTopic(segments[1], segments[2]);
        if (result) {
          items.push({ label: result.topic.title[locale] });
        }
      }
    }
  } else if (segments[0] === 'history') {
    items.push({
      label: t.breadcrumb.history,
      href: segments.length > 1 ? '/history' : undefined,
    });

    if (segments[1]) {
      const result = getHistoryTopic(segments[1]);
      if (result) {
        items.push({ label: result.topic.title[locale] });
      }
    }
  } else if (segments[0] === 'language') {
    items.push({
      label: t.breadcrumb.language,
      href: segments.length > 1 ? '/language' : undefined,
    });

    if (segments[1]) {
      const result = getLanguageTopic(segments[1]);
      if (result) {
        items.push({ label: result.topic.title[locale] });
      }
    }
  } else if (segments[0] === 'about') {
    items.push({ label: t.breadcrumb.about });
  } else if (segments[0] === 'mission') {
    items.push({ label: t.breadcrumb.mission });
  } else if (segments[0] === 'vision') {
    items.push({ label: t.breadcrumb.vision });
  } else if (segments[0] === 'contact') {
    items.push({ label: t.breadcrumb.contact });
  } else if (segments[0] === 'proverbs') {
    items.push({ label: t.breadcrumb.language, href: '/language' });
    items.push({
      label: t.breadcrumb.proverbs,
      href: segments.length > 1 ? '/proverbs' : undefined,
    });

    if (segments[1] === 'theme' && segments[2]) {
      const theme = getTheme(segments[2]);
      if (theme) {
        items.push({ label: theme.title[locale] });
      }
    } else if (segments[1] === 'letter' && segments[2]) {
      const letter = decodeURIComponent(segments[2]);
      items.push({ label: letter.charAt(0).toUpperCase() + letter.slice(1) });
    } else if (segments[1] && segments[1].startsWith('p-')) {
      const slug = decodeURIComponent(segments[1]);
      const digoText = slug.replace(/^p-\d+-/, '').replace(/-/g, ' ');
      const label = digoText.charAt(0).toUpperCase() + digoText.slice(1);
      items.push({ label });
    }
  } else if (segments[0] === 'dictionary') {
    items.push({ label: t.breadcrumb.language, href: '/language' });
    items.push({
      label: t.breadcrumb.dictionary,
      href: segments.length > 1 ? '/dictionary' : undefined,
    });

    if (segments[1] === 'word' && segments[2]) {
      items.push({ label: decodeURIComponent(segments[2]) });
    } else if (segments[1] === 'letter' && segments[2]) {
      const letter = decodeURIComponent(segments[2]);
      items.push({ label: letter.charAt(0).toUpperCase() + letter.slice(1) });
    }
  }

  const renderLink = useCallback((href: string, children: ReactNode) => (
    <a
      href={href}
      onClick={() => trackNavClick('breadcrumb', href)}
      style={{ color: 'var(--fg-muted)', textDecoration: 'none' }}
    >
      {children}
    </a>
  ), []);

  if (items.length <= 1) return null;

  return (
    <BreadcrumbDS
      items={items}
      renderLink={renderLink}
      style={{
        position: 'fixed',
        top: 'var(--nav-height, 48px)',
        marginTop: '-4px',
        left: 0,
        right: 0,
        zIndex: 9,
        backgroundColor: 'var(--color-kaya-deep)',
        borderBottom: '1px solid rgba(242, 234, 215, 0.08)',
        padding: '0.375rem 5.25%',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        '--fg-default': 'var(--color-hando-cream)',
        '--fg-muted': 'rgba(242, 234, 215, 0.55)',
        '--fg-subtle': 'rgba(242, 234, 215, 0.3)',
        '--font-sans': 'var(--font-sans)',
        '--text-sm': '0.7rem',
        '--space-1': '0.35rem',
      } as React.CSSProperties}
    />
  );
}
