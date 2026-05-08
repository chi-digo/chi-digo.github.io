import { buildMetadata } from '@/lib/seo/metadata';
import SearchResultsClient from './SearchResultsClient';

export const metadata = buildMetadata({
  title: 'Search — Chi-digo',
  description: 'Search the Chi-digo dictionary, proverbs, and cultural articles.',
  path: '/search',
});

export default function SearchPage() {
  return <SearchResultsClient />;
}
