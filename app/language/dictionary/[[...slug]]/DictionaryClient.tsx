'use client';

import { useState, useCallback, useEffect, useMemo, useRef, Suspense } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useTranslations, useLocale } from '@/lib/i18n/context';
import type { Locale } from '@/lib/i18n/config';
import { useSearch } from '@/hooks/useSearch';
import { loadEntriesByHeadword } from '@/lib/dictionary/loader';
import { searchAll, type GroupedSearchResults, type SearchResult } from '@/lib/dictionary/search';
import { POS_ABBREVIATIONS, DIGO_ALPHABET } from '@/lib/constants';
import { track } from '@/lib/analytics/track';
import { ShareMenu } from '@/components/ShareMenu/ShareMenu';
import { useShareCard } from '@/hooks/useShareCard';
import type { DictionaryEntry } from '@/lib/dictionary/types';
import styles from '../dictionary.module.css';

// Module-level counter for words viewed in a session
let sessionWordCount = 0;

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
  nav(`/language/dictionary/word/${encodeURIComponent(cleanHeadword(headword))}`);
}

function goToLetter(nav: Navigate, letter: string) {
  nav(`/language/dictionary/letter/${encodeURIComponent(letter.toLowerCase())}`);
}

function goToSearch(nav: Navigate, q: string) {
  nav(`/language/dictionary?q=${encodeURIComponent(q)}`);
}

/* ===== Search dropdown (shared) ===== */

function getEquivByLocale(result: SearchResult, locale: Locale): string {
  if (locale === 'sw') return result.equivalent_sw || result.equivalent;
  if (locale === 'dig') return result.equivalent_dg || result.equivalent;
  return result.equivalent;
}

function SearchDropdown({
  results,
  visible,
  isLoading,
  onSelect,
  locale,
}: {
  results: { dg: SearchResult[]; sw: SearchResult[]; en: SearchResult[]; total: number };
  visible: boolean;
  isLoading: boolean;
  onSelect: (result: SearchResult) => void;
  locale: Locale;
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
                <span className={styles.dropdownEquiv}>{getEquivByLocale(result, locale)}</span>
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
  const { locale } = useLocale();
  const { query, setQuery, results, isLoading } = useSearch('dictionary');
  const [isFocused, setIsFocused] = useState(false);
  const focusTracked = useRef(false);

  const handleSelect = useCallback(
    (result: SearchResult) => {
      track('dictionary', 'search', 'select_result', { headword: result.headword, query });
      setIsFocused(false);
      setQuery('');
      goToWord(nav, result.headword);
    },
    [setQuery, nav, query],
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (query.trim()) {
        track('dictionary', 'search', 'submit', { query: query.trim() });
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
          onFocus={() => {
            setIsFocused(true);
            if (!focusTracked.current) {
              focusTracked.current = true;
              track('dictionary', 'search', 'focus');
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
              track('dictionary', 'search', 'clear');
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
        locale={locale}
      />
    </form>
  );
}

/* ===== Featured Word card ===== */

function FeaturedWordCard({ nav }: { nav: Navigate }) {
  const t = useTranslations();
  const { locale } = useLocale();
  const [entry, setEntry] = useState<DictionaryEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const { prerenderWord, sharePrerendered, copyLink, isGenerating } = useShareCard();

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
    <div
      role="button"
      tabIndex={0}
      className={styles.wotdCard}
      onClick={() => {
        track('dictionary', 'featured', 'click', { headword: entry.headword });
        goToWord(nav, entry.headword);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          track('dictionary', 'featured', 'click', { headword: entry.headword });
          goToWord(nav, entry.headword);
        }
      }}
    >
      <div className={styles.wotdTop}>
        <p className={styles.wotdLabel}>{t.dictionary.featured_word}</p>
        {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
        <div onClick={(e) => e.stopPropagation()}>
          <ShareMenu
            onMenuOpen={() => prerenderWord(entry, locale)}
            onShareImage={() => {
              const url = `https://chidigo.org/dictionary/word/${encodeURIComponent(entry.headword)}`;
              sharePrerendered('word', entry.headword, `Chidigo: ${entry.headword}`, entry.headword, url);
            }}
            onCopyLink={() => {
              const url = `${window.location.origin}/dictionary/word/${encodeURIComponent(entry.headword)}`;
              copyLink(url);
            }}
            isGenerating={isGenerating}
          />
        </div>
      </div>
      <p className={styles.wotdHeadword}>{entry.headword}</p>
      {entry.ipa && <p className={styles.wotdIpa}>/{entry.ipa}/</p>}
      <span className={styles.wotdPos}>
        {POS_ABBREVIATIONS[entry.pos] || entry.pos_en}
      </span>
      {(() => {
        const primary = locale === 'sw' ? firstDef?.definition_sw
          : locale === 'dig' ? firstDef?.definition_dg
          : firstDef?.definition_en;
        const secondary = locale === 'dig' ? null : firstDef?.definition_dg;
        return (
          <>
            {primary && <p className={styles.wotdDef}>{primary}</p>}
            {secondary && secondary !== primary && <p className={styles.wotdDefEn}>{secondary}</p>}
          </>
        );
      })()}
    </div>
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
  const { locale } = useLocale();

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
            onClick={() => {
              track('dictionary', 'word', 'click_redirect', { target: cleanHeadword(entry.redirect_target!) });
              goToWord(nav, entry.redirect_target!);
            }}
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
          {(() => {
            const primary = locale === 'sw' ? sense.definition_sw
              : locale === 'dig' ? sense.definition_dg
              : sense.definition_en;
            const secondary = locale === 'dig' ? null
              : (sense.definition_dg && sense.definition_dg !== primary ? sense.definition_dg : null);
            return (
              <>
                {primary && <p className={styles.defDg}>{primary}</p>}
                {secondary && <p className={styles.defEn}>{secondary}</p>}
              </>
            );
          })()}
          {sense.examples.length > 0 && (
            <div className={styles.examples}>
              {sense.examples.map((ex, i) => {
                const translation = locale === 'sw' ? ex.sw : locale === 'dig' ? null : ex.en;
                return (
                  <div key={i} className={styles.example}>
                    <p className={styles.exDg}>{ex.dg}</p>
                    {translation && <p className={styles.exEn}>{translation}</p>}
                  </div>
                );
              })}
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
                    onClick={() => {
                      track('dictionary', 'word', 'click_synonym', { synonym: syn });
                      goToWord(nav, syn);
                    }}
                  >
                    {syn}
                  </button>
                </span>
              ))}
            </p>
          )}
        </div>
      ))}

      {(() => {
        const showEn = locale !== 'en' && entry.equivalents_en.length > 0;
        const showSw = locale !== 'sw' && entry.equivalents_sw.length > 0;
        if (!showEn && !showSw) return null;
        return (
          <div className={styles.equivalents}>
            {showEn && (
              <p>
                <span className={styles.equivLabel}>{t.dictionary.equivalents_en}:</span>{' '}
                {entry.equivalents_en.join(', ')}
              </p>
            )}
            {showSw && (
              <p>
                <span className={styles.equivLabel}>{t.dictionary.equivalents_sw}:</span>{' '}
                {entry.equivalents_sw.join(', ')}
              </p>
            )}
          </div>
        );
      })()}

      {entry.sub_entries.length > 0 && (
        <div className={styles.subEntries}>
          <p className={styles.subEntriesLabel}>{t.dictionary.sub_entries}</p>
          {entry.sub_entries.map((sub) => (
            <div key={sub.id} className={styles.subEntry}>
              <span className={styles.subForm}>{sub.form}</span>
              <span className={styles.subPos}>
                {POS_ABBREVIATIONS[sub.pos] || sub.pos_en}
              </span>
              {(() => {
                const def = locale === 'sw' ? (sub.definition_sw || sub.definition_en)
                  : locale === 'dig' ? (sub.definition_dg || sub.definition_en)
                  : sub.definition_en;
                return def ? <span className={styles.subDef}>{def}</span> : null;
              })()}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function WordView({ headword, nav, query }: { headword: string; nav: Navigate; query?: string }) {
  const t = useTranslations();
  const { locale } = useLocale();
  const [entries, setEntries] = useState<DictionaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const viewTracked = useRef(false);
  const { prerenderWord, sharePrerendered, copyLink, isGenerating } = useShareCard();

  useEffect(() => {
    viewTracked.current = false;
    setLoading(true);
    loadEntriesByHeadword(headword)
      .then((found) => {
        setEntries(found);
        setLoading(false);
        if (!viewTracked.current) {
          viewTracked.current = true;
          if (found.length > 0) {
            sessionWordCount++;
            track('dictionary', 'word', 'view', {
              headword,
              session_word_count: sessionWordCount,
              ...(query ? { query } : {}),
            });
          } else {
            track('dictionary', 'word', 'not_found', { headword });
          }
        }
      })
      .catch(() => {
        setEntries([]);
        setLoading(false);
        if (!viewTracked.current) {
          viewTracked.current = true;
          track('dictionary', 'word', 'not_found', { headword });
        }
      });
  }, [headword, query]);

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
            <div className={styles.entryHeaderLeft}>
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
            </div>
            <ShareMenu
              onMenuOpen={() => prerenderWord(primary, locale)}
              onShareImage={() => {
                const url = `https://chidigo.org/dictionary/word/${encodeURIComponent(primary.headword)}`;
                sharePrerendered('word', primary.headword, `Chidigo: ${primary.headword}`, primary.headword, url);
              }}
              onCopyLink={() => {
                const url = `${window.location.origin}/dictionary/word/${encodeURIComponent(primary.headword)}`;
                copyLink(url);
              }}
              isGenerating={isGenerating}
            />
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
  const { locale } = useLocale();
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
      <p className={styles.resultCardEquiv}>{getEquivByLocale(result, locale)}</p>
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
        if (r.total === 0) {
          track('dictionary', 'search', 'no_results', { query: q });
        }
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
              onClick={() => {
                track('dictionary', 'browse', 'click_letter', { letter });
                goToLetter(nav, letter);
              }}
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
    view = <WordView headword={cleanHeadword(slug[1])} nav={nav} query={q || undefined} />;
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
