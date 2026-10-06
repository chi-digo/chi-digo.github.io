import type { Metadata } from 'next';
import { InstallPage } from '@/components/InstallPage/InstallPage';
import { buildMetadata } from '@/lib/seo/metadata';
import type { Locale } from '@/lib/i18n/config';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildMetadata({
    title: 'Install Chidigo',
    description:
      'Access the dictionary, proverbs, and quiz — even offline.',
    path: '/install',
    locale: locale as Locale,
  });
}

export default function Page() {
  return <InstallPage />;
}
