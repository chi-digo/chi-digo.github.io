'use client';

import { useState, useCallback, useRef } from 'react';
import { useTranslations } from '@/lib/i18n/context';
import { useSearch } from '@/hooks/useSearch';
import { track } from '@/lib/analytics/track';
import type { SearchResult } from '@/lib/dictionary/search';
import { WordOfTheDayCard } from './WordOfTheDay';
import styles from './DictionarySection.module.css';

function SearchDropdown({
  results,
  visible,
  isLoading,
  onSelect,
}: {
  results: { dg: SearchResult[]; sw: SearchResult[]; en: SearchResult[]; total: number };
  visible: boolean;
  isLoading: boolean;
  onSelect: (result: SearchResult) => void;
}) {
  const t = useTranslations();
  const LANG_LABELS: Record<string, string> = {
    dg: 'Chidigo',
    sw: 'Chiswahili',
    en: 'Chiingereza',
  };

  if (!visible || (results.total === 0 && !isLoading)) return null;

  return (
    <div className={styles.dropdown}>
      {isLoading && results.total === 0 && (
        <div className={styles.dropdownLoading}>{t.dictionary.searching}</div>
      )}
      {(['dg', 'sw', 'en'] as const).map((lang) => {
        const items = results[lang];
        if (items.length === 0) return null;
        return (
          <div key={lang}>
            <div className={styles.dropdownLang}>{LANG_LABELS[lang]}</div>
            {items.map((result) => (
              <button
                key={result.id + '-' + lang}
                className={styles.dropdownItem}
                onClick={() => onSelect(result)}
                type="button"
              >
                <span className={styles.dropdownHeadword}>{result.headword}</span>
                <span className={styles.dropdownEquiv}>{result.equivalent}</span>
              </button>
            ))}
          </div>
        );
      })}
    </div>
  );
}

export function DictionarySection() {
  const t = useTranslations();
  const { query, setQuery, results, isLoading } = useSearch('homepage');
  const [isFocused, setIsFocused] = useState(false);
  const focusTracked = useRef(false);

  const handleSelect = useCallback(
    (result: SearchResult) => {
      track('dictionary', 'search', 'select_result', { headword: result.headword, query, source: 'homepage' });
      setIsFocused(false);
      setQuery('');
      window.location.href = `/dictionary/word/${encodeURIComponent(result.headword)}`;
    },
    [setQuery, query],
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (query.trim()) {
        track('dictionary', 'search', 'submit', { query: query.trim(), source: 'homepage' });
        setIsFocused(false);
        window.location.href = `/dictionary?q=${encodeURIComponent(query.trim())}`;
      }
    },
    [query],
  );

  const handleWordClick = useCallback((headword: string) => {
    window.location.href = `/dictionary/word/${encodeURIComponent(headword)}`;
  }, []);

  return (
    <section id="dictionary" className={styles.section}>
      <div className={styles.inner}>
        <p className={styles.eyebrow}>{t.dictionary.section_title}</p>
        <h2 className={styles.heading}>{t.dictionary.section_subtitle}</h2>

        <form onSubmit={handleSubmit} className={styles.searchWrapper}>
          <div className={styles.searchBar}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.searchIcon}>
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => {
                setIsFocused(true);
                if (!focusTracked.current) {
                  focusTracked.current = true;
                  track('dictionary', 'search', 'focus', { source: 'homepage' });
                }
              }}
              onBlur={() => setTimeout(() => setIsFocused(false), 200)}
              placeholder={t.dictionary.search_placeholder}
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              className={styles.searchInput}
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  track('dictionary', 'search', 'clear', { source: 'homepage' });
                  setQuery('');
                }}
                className={styles.clearBtn}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>
          <SearchDropdown
            results={results}
            visible={isFocused && query.length >= 2}
            isLoading={isLoading}
            onSelect={handleSelect}
          />
        </form>

        <WordOfTheDayCard onWordClick={handleWordClick} />
      </div>
    </section>
  );
}
