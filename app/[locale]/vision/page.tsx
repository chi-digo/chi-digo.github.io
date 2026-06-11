import type { Metadata } from 'next';
import { VisionPage } from '@/components/VisionPage/VisionPage';
import { buildMetadata } from '@/lib/seo/metadata';
import type { Locale } from '@/lib/i18n/config';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildMetadata({
    title: 'Our Vision',
    description:
      'Our vision for Chidigo — a future where the Digo language thrives digitally, with comprehensive resources for learning, preservation, and cultural transmission.',
    path: '/vision',
    locale: locale as Locale,
  });
}

export default function Page() {
  return <VisionPage />;
}
