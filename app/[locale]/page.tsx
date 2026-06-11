import type { Metadata } from 'next';
import HomeClient from './HomeClient';
import { buildMetadata } from '@/lib/seo/metadata';
import type { Locale } from '@/lib/i18n/config';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildMetadata({
    title: 'Chidigo — Building the transmission tools for the Digo language',
    description:
      'Building the transmission tools for the Digo language — dictionary, proverbs, audio, and cultural resources for 600,000 speakers on the Kenya–Tanzania coast.',
    path: '/',
    locale: locale as Locale,
  });
}

export default function Home() {
  return <HomeClient />;
}
