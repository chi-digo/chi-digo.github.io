import type { Metadata } from 'next';
import { ContactPage } from '@/components/ContactPage/ContactPage';
import { buildMetadata } from '@/lib/seo/metadata';
import type { Locale } from '@/lib/i18n/config';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildMetadata({
    title: 'Contact',
    description:
      'Get in touch with the Chidigo project — questions, contributions, and collaboration on Digo language and cultural resources.',
    path: '/contact',
    locale: locale as Locale,
  });
}

export default function Page() {
  return <ContactPage />;
}
