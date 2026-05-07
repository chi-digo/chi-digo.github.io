'use client';

import { useState, useCallback, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
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

const CURATED_WORDS = [
  'mnazi', 'moyo', 'baraka', 'pembe', 'mbuzi', 'ngano', 'dzino', 'makuti',
  'mutu', 'kuku', 'damu', 'mviringo', 'phanga', 'unga', 'chapati',
  'mkpwono', 'tsongo', 'gulu', 'simba', 'tembo', 'ngalawa', 'meli',
  'kazi', 'fungu', 'tanga', 'shule', 'msikiti', 'sindano', 'pingu',
  'nguwo', 'dzuwa', 'luga', 'nyuni', 'matso', 'mgongo', 'baba',
  'mwana', 'bibi', 'ndugu', 'munda', 'mudzi', 'nyama', 'nazi',
  'hando', 'sengenya', 'muhi', 'chirimo', 'kusi', 'laga', 'hepa',
  'henda', 'rima', 'risa', 'dzenga',
];

function cleanHeadword(raw: string): string {
  return raw.replace(/[\d;]+$/, '').replace(/\.\d+$/, '');
}

function goToWord(headword: string) {
  window.location.href = `/dictionary/word/${encodeURIComponent(cleanHeadword(headword))}`;
}

function goToLetter(letter: string) {
  window.location.href = `/dictionary/letter/${encodeURIComponent(letter.toLowerCase())}`;
}

function goToSearch(q: string) {
  window.location.href = `/dictionary?q=${encodeURIComponent(q)}`;
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

function DictionarySearchBar() {
  const t = useTranslations();
  const { query, setQuery, results, isLoading } = useSearch();
  const [isFocused, setIsFocused] = useState(false);

  const handleSelect = useCallback(
    (result: SearchResult) => {
      setIsFocused(false);
      setQuery('');
      goToWord(result.headword);
    },
    [setQuery],
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (query.trim()) {
        setIsFocused(false);
        goToSearch(query.trim());
      }
    },
    [query],
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

/* ===== Word of the Day card ===== */

function WordOfTheDayCard() {
  const t = useTranslations();
  const [entry, setEntry] = useState<DictionaryEntry | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const dayOfYear = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const word = CURATED_WORDS[dayOfYear % CURATED_WORDS.length];

    loadEntriesByHeadword(word).then((entries) => {
      if (cancelled) return;
      setEntry(entries[0] ?? null);
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className={styles.wotdCard}>
        <p className={styles.wotdLabel}>{t.dictionary.word_of_the_day}</p>
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
      onClick={() => goToWord(entry.headword)}
    >
      <p className={styles.wotdLabel}>{t.dictionary.word_of_the_day}</p>
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
}: {
  entry: DictionaryEntry;
  isHomonym: boolean;
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
            onClick={() => goToWord(entry.redirect_target!)}
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
                    onClick={() => goToWord(syn)}
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

function WordView({ headword }: { headword: string }) {
  const t = useTranslations();
  const [entries, setEntries] = useState<DictionaryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    loadEntriesByHeadword(headword).then((found) => {
      setEntries(found);
      setLoading(false);
    });
  }, [headword]);

  const mainEntries = entries.filter((e) => !e.is_redirect);
  const redirectEntries = entries.filter((e) => e.is_redirect);
  const isHomonym = mainEntries.length > 1;
  const primary = mainEntries[0] ?? entries[0];

  return (
    <>
      <DictionarySearchBar />

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
            <EntrySection key={entry.id} entry={entry} isHomonym={isHomonym} />
          ))}

          {redirectEntries.map((entry) => (
            <EntrySection key={entry.id} entry={entry} isHomonym={false} />
          ))}
        </article>
      )}
    </>
  );
}

/* ===== Search results view ===== */

function ResultCard({ result }: { result: SearchResult }) {
  const pos = POS_ABBREVIATIONS[result.pos] || result.pos;
  return (
    <button
      type="button"
      className={styles.resultCard}
      onClick={() => goToWord(result.headword)}
    >
      <div className={styles.resultCardHeader}>
        <span className={styles.resultCardWord}>{result.headword}</span>
        {pos && <span className={styles.resultCardPos}>{pos}</span>}
      </div>
      <p className={styles.resultCardEquiv}>{result.equivalent}</p>
    </button>
  );
}

function ResultGroup({ lang, results }: { lang: 'dg' | 'sw' | 'en'; results: SearchResult[] }) {
  if (results.length === 0) return null;
  return (
    <div className={styles.resultGroup}>
      <p className={styles.resultGroupLabel}>{LANG_LABELS[lang]}</p>
      {results.map((result) => (
        <ResultCard key={result.id + '-' + lang} result={result} />
      ))}
    </div>
  );
}

function LetterView({ letter }: { letter: string }) {
  const t = useTranslations();
  const [results, setResults] = useState<GroupedSearchResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!letter) return;
    setIsLoading(true);
    searchAll(letter).then((r) => {
      setResults(r);
      setIsLoading(false);
    });
  }, [letter]);

  const displayLetter = letter.charAt(0).toUpperCase() + letter.slice(1);

  return (
    <>
      <DictionarySearchBar />

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
          <ResultGroup lang="dg" results={results.dg} />
          <ResultGroup lang="sw" results={results.sw} />
          <ResultGroup lang="en" results={results.en} />
        </div>
      )}
    </>
  );
}

function SearchView({ q }: { q: string }) {
  const t = useTranslations();
  const [results, setResults] = useState<GroupedSearchResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!q) return;
    setIsLoading(true);
    searchAll(q).then((r) => {
      setResults(r);
      setIsLoading(false);
    });
  }, [q]);

  return (
    <>
      <DictionarySearchBar />

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
          <ResultGroup lang="dg" results={results.dg} />
          <ResultGroup lang="sw" results={results.sw} />
          <ResultGroup lang="en" results={results.en} />
        </div>
      )}
    </>
  );
}

/* ===== Home view ===== */

function HomeView() {
  const t = useTranslations();

  return (
    <>
      <DictionarySearchBar />

      <section className={styles.mt4}>
        <p className={styles.sectionLabel}>{t.dictionary.word_of_the_day}</p>
        <WordOfTheDayCard />
      </section>

      <section className={styles.mt6}>
        <p className={styles.sectionLabel}>{t.dictionary.browse_letters}</p>
        <div className={styles.alphabetGrid}>
          {DIGO_ALPHABET.map((letter) => (
            <button
              key={letter}
              type="button"
              className={styles.letterCard}
              onClick={() => goToLetter(letter)}
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

function DictionaryRouter({ slug }: { slug: string[] }) {
  const searchParams = useSearchParams();
  const q = searchParams.get('q');
  const t = useTranslations();

  let view: React.ReactNode;
  if (slug[0] === 'word' && slug[1]) {
    view = <WordView headword={cleanHeadword(decodeURIComponent(slug[1]))} />;
  } else if (slug[0] === 'letter' && slug[1]) {
    view = <LetterView letter={decodeURIComponent(slug[1])} />;
  } else if (q) {
    view = <SearchView q={q} />;
  } else {
    view = <HomeView />;
  }

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        {view}
      </main>
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <p className={styles.footerCopy}>
            &copy; {new Date().getFullYear()} {t.footer.copyright}
          </p>
        </div>
      </footer>
    </div>
  );
}

export function DictionaryClient({ slug }: { slug: string[] }) {
  return (
    <Suspense>
      <DictionaryRouter slug={slug} />
    </Suspense>
  );
}
