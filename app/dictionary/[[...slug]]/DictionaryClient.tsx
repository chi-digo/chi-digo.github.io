'use client';

import { useState, useCallback, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useTranslations } from '@/lib/i18n/context';
import { useSearch } from '@/hooks/useSearch';
import { loadEntriesByHeadword } from '@/lib/dictionary/loader';
import { searchAll, type GroupedSearchResults, type SearchResult } from '@/lib/dictionary/search';
import { POS_ABBREVIATIONS, DIGO_ALPHABET } from '@/lib/constants';
import type { DictionaryEntry } from '@/lib/dictionary/types';
import styles from '../dictionary.module.css';

const LANG_LABELS: Record<string, string> = {
  dg: 'Chidigo',
  sw: 'Chiswahili',
  en: 'Chiingereza',
};

const IDX_FILES = [
  'a','b','ch','d','dz','e','f','g','gbw','h',
  'i','j','k','kpw','l','m','m_','n','ndz','ng',
  'ng_','o','p','ph','r','s','sh','t','ts','u',
  'v','w','y','z',
];

function cleanHeadword(raw: string): string {
  return raw.replace(/[\d;]+$/, '').replace(/\.\d+$/, '');
}

type Navigate = (path: string) => void;

function goToWord(nav: Navigate, headword: string) {
  nav(`/dictionary/word/${encodeURIComponent(cleanHeadword(headword))}`);
}

function goToLetter(nav: Navigate, letter: string) {
  nav(`/dictionary/letter/${encodeURIComponent(letter.toLowerCase())}`);
}

function goToSearch(nav: Navigate, q: string) {
  nav(`/dictionary?q=${encodeURIComponent(q)}`);
}

/* ===== Search dropdown (shared) ===== */

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

/* ===== Search bar (shared) ===== */

function DictionarySearchBar({ nav }: { nav: Navigate }) {
  const t = useTranslations();
  const { query, setQuery, results, isLoading } = useSearch();
  const [isFocused, setIsFocused] = useState(false);

  const handleSelect = useCallback(
    (result: SearchResult) => {
      setIsFocused(false);
      setQuery('');
      goToWord(nav, result.headword);
    },
    [setQuery, nav],
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (query.trim()) {
        setIsFocused(false);
        goToSearch(nav, query.trim());
      }
    },
    [query, nav],
  );

  return (
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
          onFocus={() => setIsFocused(true)}
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
            onClick={() => setQuery('')}
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
  );
}

/* ===== Featured Word card ===== */

function FeaturedWordCard({ nav }: { nav: Navigate }) {
  const t = useTranslations();
  const [entry, setEntry] = useState<DictionaryEntry | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const file = IDX_FILES[Math.floor(Math.random() * IDX_FILES.length)];

    fetch(`/data/${file}.idx.json`)
      .then((r) => r.json())
      .then((idx: { hw: string }[]) => {
        if (cancelled || idx.length === 0) return;
        const pick = idx[Math.floor(Math.random() * idx.length)];
        return loadEntriesByHeadword(cleanHeadword(pick.hw));
      })
      .then((entries) => {
        if (cancelled) return;
        setEntry(entries?.[0] ?? null);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className={styles.wotdCard}>
        <p className={styles.wotdLabel}>{t.dictionary.featured_word}</p>
        <p className={styles.wotdLoading}>{t.dictionary.searching}</p>
      </div>
    );
  }

  if (!entry) return null;

  const firstDef = entry.senses[0];

  return (
    <button
      type="button"
      className={styles.wotdCard}
      onClick={() => goToWord(nav, entry.headword)}
    >
      <p className={styles.wotdLabel}>{t.dictionary.featured_word}</p>
      <p className={styles.wotdHeadword}>{entry.headword}</p>
      {entry.ipa && <p className={styles.wotdIpa}>/{entry.ipa}/</p>}
      <span className={styles.wotdPos}>
        {POS_ABBREVIATIONS[entry.pos] || entry.pos_en}
      </span>
      {firstDef?.definition_dg && <p className={styles.wotdDef}>{firstDef.definition_dg}</p>}
      {firstDef?.definition_en && <p className={styles.wotdDefEn}>{firstDef.definition_en}</p>}
    </button>
  );
}

/* ===== Entry display (word view) ===== */

function EntrySection({
  entry,
  isHomonym,
  nav,
}: {
  entry: DictionaryEntry;
  isHomonym: boolean;
  nav: Navigate;
}) {
  const t = useTranslations();

  return (
    <div className={styles.entryBody}>
      {isHomonym && (
        <div className={styles.homonymLabel}>
          <span className={styles.homonymIndex}>{entry.homonym_index}</span>
          <span className={styles.entryPos}>
            {POS_ABBREVIATIONS[entry.pos] || entry.pos_en}
          </span>
          {entry.noun_class && (
            <span className={styles.entryNounClass}>cl. {entry.noun_class}</span>
          )}
        </div>
      )}

      {entry.is_redirect && entry.redirect_target && (
        <p className={styles.redirect}>
          {t.dictionary.see_also}:{' '}
          <button
            type="button"
            className={styles.redirectLink}
            onClick={() => goToWord(nav, entry.redirect_target!)}
          >
            {cleanHeadword(entry.redirect_target)}
          </button>
        </p>
      )}

      {entry.senses.map((sense) => (
        <div key={sense.sense_id} className={styles.sense}>
          {entry.senses.length > 1 && (
            <span className={styles.senseNum}>{sense.sense_id}.</span>
          )}
          {sense.definition_dg && <p className={styles.defDg}>{sense.definition_dg}</p>}
          {sense.definition_en && <p className={styles.defEn}>{sense.definition_en}</p>}
          {sense.examples.length > 0 && (
            <div className={styles.examples}>
              {sense.examples.map((ex, i) => (
                <div key={i} className={styles.example}>
                  <p className={styles.exDg}>{ex.dg}</p>
                  {ex.en && <p className={styles.exEn}>{ex.en}</p>}
                </div>
              ))}
            </div>
          )}
          {sense.synonyms_dg.length > 0 && (
            <p className={styles.synonyms}>
              <span className={styles.synonymLabel}>{t.dictionary.synonyms}:</span>{' '}
              {sense.synonyms_dg.map((syn, i) => (
                <span key={syn}>
                  {i > 0 && ', '}
                  <button
                    type="button"
                    className={styles.synonymLink}
                    onClick={() => goToWord(nav, syn)}
                  >
                    {syn}
                  </button>
                </span>
              ))}
            </p>
          )}
        </div>
      ))}

      {(entry.equivalents_en.length > 0 || entry.equivalents_sw.length > 0) && (
        <div className={styles.equivalents}>
          {entry.equivalents_en.length > 0 && (
            <p>
              <span className={styles.equivLabel}>{t.dictionary.equivalents_en}:</span>{' '}
              {entry.equivalents_en.join(', ')}
            </p>
          )}
          {entry.equivalents_sw.length > 0 && (
            <p>
              <span className={styles.equivLabel}>{t.dictionary.equivalents_sw}:</span>{' '}
              {entry.equivalents_sw.join(', ')}
            </p>
          )}
        </div>
      )}

      {entry.sub_entries.length > 0 && (
        <div className={styles.subEntries}>
          <p className={styles.subEntriesLabel}>{t.dictionary.sub_entries}</p>
          {entry.sub_entries.map((sub) => (
            <div key={sub.id} className={styles.subEntry}>
              <span className={styles.subForm}>{sub.form}</span>
              <span className={styles.subPos}>
                {POS_ABBREVIATIONS[sub.pos] || sub.pos_en}
              </span>
              {sub.definition_en && <span className={styles.subDef}>{sub.definition_en}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function WordView({ headword, nav }: { headword: string; nav: Navigate }) {
  const t = useTranslations();
  const [entries, setEntries] = useState<DictionaryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    loadEntriesByHeadword(headword)
      .then((found) => {
        setEntries(found);
        setLoading(false);
      })
      .catch(() => {
        setEntries([]);
        setLoading(false);
      });
  }, [headword]);

  const mainEntries = entries.filter((e) => !e.is_redirect);
  const redirectEntries = entries.filter((e) => e.is_redirect);
  const isHomonym = mainEntries.length > 1;
  const primary = mainEntries[0] ?? entries[0];

  return (
    <>
      <DictionarySearchBar nav={nav} />

      {loading && <p className={styles.loading}>{t.dictionary.searching}</p>}

      {!loading && entries.length === 0 && (
        <div className={styles.emptyState}>
          <p className={styles.emptyTitle}>{t.dictionary.entry_not_found}</p>
          <p className={styles.emptyBody}>{t.dictionary.try_different_word}</p>
        </div>
      )}

      {!loading && primary && (
        <article className={styles.entry}>
          <header className={styles.entryHeader}>
            <h1 className={styles.entryHeadword}>{cleanHeadword(primary.headword)}</h1>
            {primary.ipa && <span className={styles.entryIpa}>/{primary.ipa}/</span>}
            {!isHomonym && (
              <span className={styles.entryPos}>
                {POS_ABBREVIATIONS[primary.pos] || primary.pos_en}
              </span>
            )}
            {!isHomonym && primary.noun_class && (
              <span className={styles.entryNounClass}>cl. {primary.noun_class}</span>
            )}
          </header>

          {mainEntries.map((entry) => (
            <EntrySection key={entry.id} entry={entry} isHomonym={isHomonym} nav={nav} />
          ))}

          {redirectEntries.map((entry) => (
            <EntrySection key={entry.id} entry={entry} isHomonym={false} nav={nav} />
          ))}
        </article>
      )}
    </>
  );
}

/* ===== Search results view ===== */

function ResultCard({ result, nav }: { result: SearchResult; nav: Navigate }) {
  const pos = POS_ABBREVIATIONS[result.pos] || result.pos;
  return (
    <button
      type="button"
      className={styles.resultCard}
      onClick={() => goToWord(nav, result.headword)}
    >
      <div className={styles.resultCardHeader}>
        <span className={styles.resultCardWord}>{result.headword}</span>
        {pos && <span className={styles.resultCardPos}>{pos}</span>}
      </div>
      <p className={styles.resultCardEquiv}>{result.equivalent}</p>
    </button>
  );
}

function ResultGroup({ lang, results, nav }: { lang: 'dg' | 'sw' | 'en'; results: SearchResult[]; nav: Navigate }) {
  if (results.length === 0) return null;
  return (
    <div className={styles.resultGroup}>
      <p className={styles.resultGroupLabel}>{LANG_LABELS[lang]}</p>
      {results.map((result) => (
        <ResultCard key={result.id + '-' + lang} result={result} nav={nav} />
      ))}
    </div>
  );
}

function LetterView({ letter, nav }: { letter: string; nav: Navigate }) {
  const t = useTranslations();
  const [results, setResults] = useState<GroupedSearchResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!letter) return;
    setIsLoading(true);
    searchAll(letter)
      .then((r) => {
        setResults(r);
        setIsLoading(false);
      })
      .catch(() => {
        setResults({ dg: [], sw: [], en: [], total: 0 });
        setIsLoading(false);
      });
  }, [letter]);

  const displayLetter = letter.charAt(0).toUpperCase() + letter.slice(1);

  return (
    <>
      <DictionarySearchBar nav={nav} />

      <p className={styles.resultsInfo}>
        {isLoading
          ? t.dictionary.searching
          : results
            ? t.dictionary.results_for
                .replace('{count}', String(results.total))
                .replace('{query}', displayLetter)
            : ''}
      </p>

      {results && results.total === 0 && !isLoading && (
        <div className={styles.emptyState}>
          <p className={styles.emptyTitle}>
            {t.dictionary.no_results.replace('{query}', displayLetter)}
          </p>
          <p className={styles.emptyBody}>{t.dictionary.try_different_word}</p>
        </div>
      )}

      {results && results.total > 0 && (
        <div>
          <ResultGroup lang="dg" results={results.dg} nav={nav} />
          <ResultGroup lang="sw" results={results.sw} nav={nav} />
          <ResultGroup lang="en" results={results.en} nav={nav} />
        </div>
      )}
    </>
  );
}

function SearchView({ q, nav }: { q: string; nav: Navigate }) {
  const t = useTranslations();
  const [results, setResults] = useState<GroupedSearchResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!q) return;
    setIsLoading(true);
    searchAll(q)
      .then((r) => {
        setResults(r);
        setIsLoading(false);
      })
      .catch(() => {
        setResults({ dg: [], sw: [], en: [], total: 0 });
        setIsLoading(false);
      });
  }, [q]);

  return (
    <>
      <DictionarySearchBar nav={nav} />

      {q && (
        <p className={styles.resultsInfo}>
          {isLoading
            ? t.dictionary.searching
            : results
              ? t.dictionary.results_for
                  .replace('{count}', String(results.total))
                  .replace('{query}', q)
              : ''}
        </p>
      )}

      {results && results.total === 0 && !isLoading && (
        <div className={styles.emptyState}>
          <p className={styles.emptyTitle}>
            {t.dictionary.no_results.replace('{query}', q)}
          </p>
          <p className={styles.emptyBody}>{t.dictionary.try_different_word}</p>
        </div>
      )}

      {results && results.total > 0 && (
        <div>
          <ResultGroup lang="dg" results={results.dg} nav={nav} />
          <ResultGroup lang="sw" results={results.sw} nav={nav} />
          <ResultGroup lang="en" results={results.en} nav={nav} />
        </div>
      )}
    </>
  );
}

/* ===== Home view ===== */

function HomeView({ nav }: { nav: Navigate }) {
  const t = useTranslations();

  return (
    <>
      <DictionarySearchBar nav={nav} />

      <section className={styles.mt4}>
        <p className={styles.sectionLabel}>{t.dictionary.featured_word}</p>
        <FeaturedWordCard nav={nav} />
      </section>

      <section className={styles.mt6}>
        <p className={styles.sectionLabel}>{t.dictionary.browse_letters}</p>
        <div className={styles.alphabetGrid}>
          {DIGO_ALPHABET.map((letter) => (
            <button
              key={letter}
              type="button"
              className={styles.letterCard}
              onClick={() => goToLetter(nav, letter)}
            >
              {letter}
            </button>
          ))}
        </div>
      </section>
    </>
  );
}

/* ===== Router ===== */

function DictionaryRouter() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const q = searchParams.get('q');
  const t = useTranslations();
  const nav: Navigate = useCallback((path: string) => router.push(path), [router]);

  const slug = useMemo(() => {
    const prefix = '/dictionary';
    if (!pathname.startsWith(prefix)) return [];
    const rest = pathname.slice(prefix.length).replace(/^\//, '');
    if (!rest) return [];
    return rest.split('/').map(decodeURIComponent);
  }, [pathname]);

  let view: React.ReactNode;
  if (slug[0] === 'word' && slug[1]) {
    view = <WordView headword={cleanHeadword(slug[1])} nav={nav} />;
  } else if (slug[0] === 'letter' && slug[1]) {
    view = <LetterView letter={slug[1]} nav={nav} />;
  } else if (q) {
    view = <SearchView q={q} nav={nav} />;
  } else {
    view = <HomeView nav={nav} />;
  }

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        {view}
      </main>
    </div>
  );
}

export function DictionaryClient() {
  return (
    <Suspense>
      <DictionaryRouter />
    </Suspense>
  );
}
