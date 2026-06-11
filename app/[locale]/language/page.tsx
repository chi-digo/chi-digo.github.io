import type { Metadata } from 'next';
import { LanguageIndex } from '@/components/LanguageIndex/LanguageIndex';
import { buildMetadata } from '@/lib/seo/metadata';
import type { Locale } from '@/lib/i18n/config';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildMetadata({
    title: 'Digo Language & Oral Traditions',
    description:
      'Explore Chidigo oral traditions — folk tales, proverbs, riddles, poetry and song, oral history, and the transition to written literature.',
    path: '/language',
    locale: locale as Locale,
  });
}

export default function Page() {
  return <LanguageIndex />;
}
