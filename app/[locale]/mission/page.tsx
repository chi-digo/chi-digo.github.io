import type { Metadata } from 'next';
import { MissionPage } from '@/components/MissionPage/MissionPage';
import { buildMetadata } from '@/lib/seo/metadata';
import type { Locale } from '@/lib/i18n/config';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildMetadata({
    title: 'Our Mission',
    description:
      'Our mission is to build the most comprehensive digital transmission tools for the Chidigo language — serving 600,000+ speakers on the Kenya–Tanzania coast.',
    path: '/mission',
    locale: locale as Locale,
  });
}

export default function Page() {
  return <MissionPage />;
}
