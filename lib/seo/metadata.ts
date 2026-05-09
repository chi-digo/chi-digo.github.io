import type { Metadata } from 'next';

const SITE_URL = 'https://chidigo.org';
const SITE_NAME = 'Chidigo';
const DEFAULT_DESCRIPTION =
  'Building the transmission tools for the Digo language — dictionary, proverbs, audio, and cultural resources for 600,000 speakers on the Kenya–Tanzania coast.';

export function buildMetadata(opts: {
  title: string;
  description?: string;
  path: string;
  type?: 'website' | 'article';
  section?: string;
  datePublished?: string;
  dateModified?: string;
}): Metadata {
  const { title, description = DEFAULT_DESCRIPTION, path, type = 'website' } = opts;
  const url = `${SITE_URL}${path}`;
  return {
    title: `${title} | ${SITE_NAME}`,
    description,
    alternates: { canonical: url },
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
