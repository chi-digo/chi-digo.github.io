import type { Metadata } from 'next';
import { AboutPage } from '@/components/AboutPage/AboutPage';
import { buildMetadata } from '@/lib/seo/metadata';
import type { Locale } from '@/lib/i18n/config';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildMetadata({
    title: 'About Chidigo',
    description:
      'Learn about Chidigo, a language transmission project building dictionary, cultural, and educational resources for the Digo people and the Chidigo language.',
    path: '/about',
    locale: locale as Locale,
  });
}

export default function Page() {
  return <AboutPage />;
}
