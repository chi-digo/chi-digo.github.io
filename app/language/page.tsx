import { LanguageIndex } from '@/components/LanguageIndex/LanguageIndex';
import { buildMetadata } from '@/lib/seo/metadata';

export const metadata = buildMetadata({
  title: 'Digo Language & Oral Traditions',
  description:
    'Explore Chidigo oral traditions — folk tales, proverbs, riddles, poetry and song, oral history, and the transition to written literature.',
  path: '/language',
});

export default function Page() {
  return <LanguageIndex />;
}
