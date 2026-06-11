import type { Metadata } from 'next';
import type { Locale } from '@/lib/i18n/config';
import { defaultLocale } from '@/lib/i18n/config';
import { localePath } from '@/lib/i18n/locale-path';

const SITE_URL = 'https://chidigo.org';
const SITE_NAME = 'Chidigo';
const DEFAULT_DESCRIPTION =
  'Building the transmission tools for the Digo language — dictionary, proverbs, audio, and cultural resources for 600,000 speakers on the Kenya–Tanzania coast.';

export function buildMetadata(opts: {
  title: string;
  description?: string;
  path: string;
  locale?: Locale;
  type?: 'website' | 'article';
  section?: string;
  datePublished?: string;
  dateModified?: string;
}): Metadata {
  const { title, description = DEFAULT_DESCRIPTION, path, locale, type = 'website' } = opts;
  const effectiveLocale = locale ?? defaultLocale;
  const canonicalPath = localePath(path, effectiveLocale);
  const url = `${SITE_URL}${canonicalPath}`;

  const languages: Record<string, string> = {
    en: `${SITE_URL}${path}`,
    sw: `${SITE_URL}/sw${path === '/' ? '' : path}`,
    dg: `${SITE_URL}/dg${path === '/' ? '' : path}`,
    'x-default': `${SITE_URL}${path}`,
  };

  return {
    title: `${title} | ${SITE_NAME}`,
    description,
    alternates: {
      canonical: url,
      languages,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      type: type === 'article' ? 'article' : 'website',
      locale: 'en_US',
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
  };
}
