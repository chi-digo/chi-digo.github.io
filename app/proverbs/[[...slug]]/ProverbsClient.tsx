'use client';

import { useMemo, Suspense } from 'react';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { useTranslations } from '@/lib/i18n/context';

type ProverbsView = 'home' | 'detail' | 'theme' | 'letter' | 'search';

function deriveView(pathname: string, query: string | null): ProverbsView {
  if (query) return 'search';
  if (pathname === '/proverbs') return 'home';
  if (pathname.startsWith('/proverbs/theme/')) return 'theme';
  if (pathname.startsWith('/proverbs/letter/')) return 'letter';
  if (pathname.startsWith('/proverbs/p-')) return 'detail';
  return 'home';
}

function extractSlugParam(pathname: string, prefix: string): string {
  const rest = pathname.slice(prefix.length);
  return decodeURIComponent(rest.split('/')[0] || '');
}

/* ===== View placeholders ===== */

function HomeView() {
  const t = useTranslations();
  return (
    <div>
      <h1>{t.proverbs.title}</h1>
      <p>{t.proverbs.proverb_of_the_day}</p>
      <p>{t.proverbs.browse_by_theme}</p>
      <p>{t.proverbs.browse_by_letter}</p>
    </div>
  );
}

function DetailView({ slug }: { slug: string }) {
  const t = useTranslations();
  return (
    <div>
      <h1>{t.proverbs.title}</h1>
      <p>Proverb detail: {slug}</p>
    </div>
  );
}

function ThemeView({ theme }: { theme: string }) {
  const t = useTranslations();
  return (
    <div>
      <h1>{t.proverbs.browse_by_theme}</h1>
      <p>Theme: {theme}</p>
    </div>
  );
}

function LetterView({ letter }: { letter: string }) {
  const t = useTranslations();
  return (
    <div>
      <h1>{t.proverbs.browse_by_letter}</h1>
      <p>Letter: {letter}</p>
    </div>
  );
}

function SearchView({ query }: { query: string }) {
  const t = useTranslations();
  return (
    <div>
      <h1>{t.proverbs.title}</h1>
      <p>Search results for: {query}</p>
    </div>
  );
}

/* ===== Inner component (reads searchParams) ===== */

function ProverbsInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get('q');

  const view = useMemo(() => deriveView(pathname, query), [pathname, query]);

  // Navigation helpers for child components
  const navigate = useMemo(
    () => ({
      toHome: () => router.push('/proverbs'),
      toDetail: (slug: string) => router.push(`/proverbs/${slug}`),
      toTheme: (theme: string) => router.push(`/proverbs/theme/${theme}`),
      toLetter: (letter: string) =>
        router.push(`/proverbs/letter/${encodeURIComponent(letter.toLowerCase())}`),
      toSearch: (q: string) =>
        router.push(`/proverbs?q=${encodeURIComponent(q)}`),
    }),
    [router],
  );

  void navigate; // Will be wired into child components when UI is built

  switch (view) {
    case 'search':
      return <SearchView query={query || ''} />;
    case 'detail':
      return <DetailView slug={extractSlugParam(pathname, '/proverbs/')} />;
    case 'theme':
      return <ThemeView theme={extractSlugParam(pathname, '/proverbs/theme/')} />;
    case 'letter':
      return <LetterView letter={extractSlugParam(pathname, '/proverbs/letter/')} />;
    case 'home':
    default:
      return <HomeView />;
  }
}

/* ===== Exported shell ===== */

export function ProverbsClient() {
  return (
    <Suspense fallback={null}>
      <ProverbsInner />
    </Suspense>
  );
}
