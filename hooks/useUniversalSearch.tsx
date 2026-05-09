'use client';

import { useState, useEffect, useRef } from 'react';
import type { ResultGroup } from '@/components/SearchCombobox';
import { universalSearch, type UniversalSearchResults } from '@/lib/search/universal';
import type { Locale } from '@/lib/i18n/config';

export function useUniversalSearch(locale: Locale) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UniversalSearchResults>({ words: [], proverbs: [], articles: [] });
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    if (query.trim().length < 2) {
      setResults({ words: [], proverbs: [], articles: [] });
      setLoading(false);
      return;
    }

    setLoading(true);
    timerRef.current = setTimeout(() => {
      universalSearch(query, locale).then((r) => {
        setResults(r);
        setLoading(false);
      });
    }, 300);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query, locale]);

  return { query, setQuery, results, loading };
}

export function buildSearchGroups(
  results: UniversalSearchResults,
  locale: Locale,
  query: string,
): ResultGroup[] {
  const groups: ResultGroup[] = [];

  if (results.words.length > 0) {
    groups.push({
      key: 'words',
      label: locale === 'sw' ? 'Maneno' : locale === 'dig' ? 'Maneno' : 'Words',
      count: results.words.length,
      results: results.words.map((w) => ({
        id: `w-${w.id}`,
        href: `/language/dictionary/word/${encodeURIComponent(w.headword)}`,
        node: (
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
            <span style={{ fontWeight: 600, fontFamily: 'var(--font-display)' }}>{w.headword}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--fg-muted)', fontStyle: 'italic' }}>{w.pos}</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--fg-default)' }}>
              {locale === 'sw' ? w.equivalent_sw : locale === 'dig' ? w.equivalent_dg : w.equivalent}
            </span>
          </div>
        ),
      })),
      seeAllHref: `/search?q=${encodeURIComponent(query)}&type=words`,
      seeAllLabel: locale === 'sw' ? 'Angalia maneno yote →' : locale === 'dig' ? 'Lola maneno gosi →' : 'See all words →',
    });
  }

  if (results.proverbs.length > 0) {
    groups.push({
      key: 'proverbs',
      label: locale === 'sw' ? 'Methali' : locale === 'dig' ? 'Ndarira' : 'Proverbs',
      count: results.proverbs.length,
      results: results.proverbs.map((p) => ({
        id: `p-${p.id}`,
        href: `/language/proverbs/${p.slug}`,
        node: (
          <div>
            <div style={{ fontWeight: 500, fontFamily: 'var(--font-display)', fontSize: '0.85rem' }} lang="dig">{p.digo}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--fg-muted)' }}>
              {locale === 'sw'
                ? (p.idiomatic_sw || p.literal_sw)
                : locale === 'dig'
                  ? p.idiomatic_dg
                  : (p.idiomatic_en || p.literal_en)}
            </div>
          </div>
        ),
      })),
      seeAllHref: `/search?q=${encodeURIComponent(query)}&type=proverbs`,
      seeAllLabel: locale === 'sw' ? 'Angalia methali zote →' : locale === 'dig' ? 'Lola ndarira zosi →' : 'See all proverbs →',
    });
  }

  if (results.articles.length > 0) {
    groups.push({
      key: 'articles',
      label: locale === 'sw' ? 'Makala' : locale === 'dig' ? 'Makala' : 'Articles',
      count: results.articles.length,
      results: results.articles.map((a) => ({
        id: `a-${a.slug}`,
        href: a.href,
        node: (
          <div>
            <div style={{ fontWeight: 500, fontSize: '0.85rem' }}>{a.title[locale]}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--fg-muted)' }}>
              {a.intro[locale]?.slice(0, 80)}{(a.intro[locale]?.length ?? 0) > 80 ? '…' : ''}
            </div>
          </div>
        ),
      })),
      seeAllHref: `/search?q=${encodeURIComponent(query)}&type=articles`,
      seeAllLabel: locale === 'sw' ? 'Angalia makala yote →' : locale === 'dig' ? 'Lola makala gosi →' : 'See all articles →',
    });
  }

  return groups;
}

export function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
      className={className}
    >
      <circle cx="8.5" cy="8.5" r="5.5" />
      <line x1="12.5" y1="12.5" x2="17" y2="17" />
    </svg>
  );
}
