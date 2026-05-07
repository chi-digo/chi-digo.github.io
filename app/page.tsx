import HomeClient from './HomeClient';
import { buildMetadata } from '@/lib/seo/metadata';

export const metadata = buildMetadata({
  title: 'Chi-digo — Building the transmission tools for the Digo language',
  description:
    'Building the transmission tools for the Digo language — dictionary, proverbs, audio, and cultural resources for 600,000 speakers on the Kenya–Tanzania coast.',
  path: '/',
});

export default function Home() {
  return <HomeClient />;
}
