import { Suspense } from 'react';
import { buildMetadata } from '@/lib/seo/metadata';
import SearchResultsClient from './SearchResultsClient';

export const metadata = buildMetadata({
  title: 'Search — Chidigo',
  description: 'Search the Chidigo dictionary, proverbs, and cultural articles.',
  path: '/search',
});

export default function SearchPage() {
  return (
    <Suspense>
      <SearchResultsClient />
    </Suspense>
  );
}
