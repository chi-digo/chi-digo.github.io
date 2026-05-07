'use client';

import { useState, useCallback, useEffect, useMemo, useRef, Suspense } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useTranslations } from '@/lib/i18n/context';
import { useLocale } from '@/lib/i18n/context';
import { loadProverbs, getProverbBySlug, getProverbsByTheme, getProverbsByLetter, getAllThemeCounts } from '@/lib/proverbs/loader';
import { searchProverbs, searchProverbsDropdown } from '@/lib/proverbs/search';
import { getFeaturedProverb, getRandomProverb } from '@/lib/proverbs/featured';
import { PROVERB_THEMES, PROVERB_FUNCTIONS, getTheme, getFunction } from '@/lib/proverbs/themes';
import { DIGO_ALPHABET } from '@/lib/constants';
import { track } from '@/lib/analytics/track';
import type { Proverb, GroupedProverbResults } from '@/lib/proverbs/types';
import type { Locale } from '@/lib/i18n/config';
import styles from '../proverbs.module.css';

type Navigate = (path: string) => void;

const LANG_LABELS: Record<string, string> = {
  dg: 'Chidigo',
  sw: 'Chiswahili',
  en: 'Chiingereza',
};

function goToProverb(nav: Navigate, slug: string) {
  nav(`/proverbs/${encodeURIComponent(slug)}`);
}

function goToTheme(nav: Navigate, theme: string) {
  nav(`/proverbs/theme/${encodeURIComponent(theme)}`);
}

function goToLetter(nav: Navigate, letter: string) {
  nav(`/proverbs/letter/${encodeURIComponent(letter.toLowerCase())}`);
}

function goToSearch(nav: Navigate, q: string) {
  nav(`/proverbs?q=${encodeURIComponent(q)}`);
}

/* ===== Search dropdown ===== */

function SearchDropdown({
  results,
  visible,
  isLoading,
  onSelect,
}: {
  results: GroupedProverbResults;
  visible: boolean;
  isLoading: boolean;
  onSelect: (proverb: Proverb) => void;
}) {
  const t = useTranslations();
  if (!visible || (results.total === 0 && !isLoading)) return null;

  return (
    <div className={styles.dropdown}>
      {isLoading && results.total === 0 && (
        <div className={styles.dropdownLoading}>{t.proverbs.searching}</div>
      )}
      {(['dg', 'sw', 'en'] as const).map((lang) => {
        const items = results[lang];
        if (items.length === 0) return null;
        return (
          <div key={lang}>
            <div className={styles.dropdownLang}>{LANG_LABELS[lang]}</div>
            {items.map((proverb) => (
              <button
                key={proverb.id + '-' + lang}
                className={styles.dropdownItem}
                onClick={() => onSelect(proverb)}
                type="button"
              >
                <span className={styles.dropdownDigo}>{proverb.digo}</span>
                <span className={styles.dropdownGloss}>
                  {proverb.literal_en || proverb.idiomatic_en}
                </span>
              </button>
            ))}
          </div>
        );
      })}
    </div>
  );
}

/* ===== Search bar ===== */

function ProverbSearchBar({ nav }: { nav: Navigate }) {
  const t = useTranslations();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GroupedProverbResults>({ dg: [], en: [], sw: [], total: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);
  const abortRef = useRef(0);
  const focusTracked = useRef(false);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!query || query.trim().length < 2) {
      setResults({ dg: [], en: [], sw: [], total: 0 });
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const id = ++abortRef.current;
    timerRef.current = setTimeout(async () => {
      track('proverbs', 'search', 'type', { query, query_length: query.length });
      try {
        const r = await searchProverbsDropdown(query);
        if (abortRef.current === id) { setResults(r); setIsLoading(false); }
      } catch {
        if (abortRef.current === id) { setResults({ dg: [], en: [], sw: [], total: 0 }); setIsLoading(false); }
      }
    }, 150);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [query]);

  const handleSelect = useCallback((proverb: Proverb) => {
    track('proverbs', 'search', 'select_result', { slug: proverb.slug, query });
    setIsFocused(false);
    setQuery('');
    goToProverb(nav, proverb.slug);
  }, [nav, query]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      track('proverbs', 'search', 'submit', { query: query.trim() });
      setIsFocused(false);
      goToSearch(nav, query.trim());
    }
  }, [query, nav]);

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
              track('proverbs', 'search', 'focus');
            }
          }}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          placeholder={t.proverbs.search_placeholder}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          className={styles.searchInput}
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              track('proverbs', 'search', 'clear');
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
  );
}

/* ===== Proverb list card ===== */

function ProverbCard({ proverb, nav, locale }: { proverb: Proverb; nav: Navigate; locale: Locale }) {
  return (
    <button
      type="button"
      className={styles.proverbCard}
      onClick={() => {
        track('proverbs', 'browse', 'click_proverb', { slug: proverb.slug });
        goToProverb(nav, proverb.slug);
      }}
    >
      <p className={styles.proverbCardDigo}>{proverb.digo}</p>
      <p className={styles.proverbCardGloss}>
        {proverb.idiomatic_en || proverb.literal_en}
      </p>
      {proverb.themes.length > 0 && (
        <div className={styles.proverbCardThemes}>
          {proverb.themes.slice(0, 3).map((theme) => {
            const entry = getTheme(theme);
            return (
              <span key={theme} className={styles.themeTag}>
                {entry ? entry.title[locale] : theme}
              </span>
            );
          })}
        </div>
      )}
    </button>
  );
}

/* ===== Featured proverb card ===== */

function FeaturedProverbCard({ nav, locale }: { nav: Navigate; locale: Locale }) {
  const t = useTranslations();
  const [proverb, setProverb] = useState<Proverb | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    loadProverbs()
      .then((all) => {
        if (cancelled) return;
        const featured = getFeaturedProverb(all);
        setProverb(featured);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className={styles.featuredCard}>
        <p className={styles.featuredLabel}>{t.proverbs.proverb_of_the_day}</p>
        <p className={styles.featuredLoading}>{t.proverbs.searching}</p>
      </div>
    );
  }

  if (!proverb) return null;

  return (
    <button
      type="button"
      className={styles.featuredCard}
      onClick={() => {
        track('proverbs', 'featured', 'click', { slug: proverb.slug });
        goToProverb(nav, proverb.slug);
      }}
    >
      <p className={styles.featuredLabel}>{t.proverbs.proverb_of_the_day}</p>
      <p className={styles.featuredDigo}>{proverb.digo}</p>
      <p className={styles.featuredEnglish}>
        {proverb.idiomatic_en || proverb.literal_en}
      </p>
      {proverb.themes.length > 0 && (
        <div className={styles.featuredThemes}>
          {proverb.themes.map((theme) => {
            const entry = getTheme(theme);
            return (
              <span key={theme} className={styles.featuredThemeTag}>
                {entry ? entry.title[locale] : theme}
              </span>
            );
          })}
        </div>
      )}
    </button>
  );
}

/* ===== Home view ===== */

function HomeView({ nav, locale }: { nav: Navigate; locale: Locale }) {
  const t = useTranslations();
  const [themeCounts, setThemeCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    getAllThemeCounts().then(setThemeCounts).catch(() => {});
  }, []);

  return (
    <>
      <ProverbSearchBar nav={nav} />

      <section className={styles.mt4}>
        <p className={styles.sectionLabel}>{t.proverbs.proverb_of_the_day}</p>
        <FeaturedProverbCard nav={nav} locale={locale} />
      </section>

      <section className={styles.mt6}>
        <p className={styles.sectionLabel}>{t.proverbs.browse_by_theme}</p>
        <div className={styles.themeGrid}>
          {PROVERB_THEMES.map((theme) => (
            <button
              key={theme.slug}
              type="button"
              className={styles.themeCard}
              onClick={() => {
                track('proverbs', 'browse', 'click_theme', { theme: theme.slug });
                goToTheme(nav, theme.slug);
              }}
            >
              <span className={styles.themeTitle}>{theme.title[locale]}</span>
              {themeCounts[theme.slug] && (
                <span className={styles.themeCount}>
                  {t.proverbs.count.replace('{count}', String(themeCounts[theme.slug]))}
                </span>
              )}
            </button>
          ))}
        </div>
      </section>

      <section className={styles.mt6}>
        <p className={styles.sectionLabel}>{t.proverbs.browse_by_letter}</p>
        <div className={styles.alphabetGrid}>
          {DIGO_ALPHABET.map((letter) => (
            <button
              key={letter}
              type="button"
              className={styles.letterCard}
              onClick={() => {
                track('proverbs', 'browse', 'click_letter', { letter });
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

/* ===== Detail view ===== */

function DetailView({ slug, nav, locale }: { slug: string; nav: Navigate; locale: Locale }) {
  const t = useTranslations();
  const [proverb, setProverb] = useState<Proverb | null>(null);
  const [related, setRelated] = useState<Proverb[]>([]);
  const [loading, setLoading] = useState(true);
  const viewTracked = useRef(false);

  useEffect(() => {
    viewTracked.current = false;
    setLoading(true);
    getProverbBySlug(slug)
      .then(async (found) => {
        setProverb(found);
        setLoading(false);
        if (!viewTracked.current) {
          viewTracked.current = true;
          if (found) {
            track('proverbs', 'detail', 'view', { slug: found.slug, id: found.id });
          } else {
            track('proverbs', 'detail', 'not_found', { slug });
          }
        }
        if (found && found.related_proverbs.length > 0) {
          const all = await loadProverbs();
          const rels = found.related_proverbs
            .map((id) => all.find((p) => p.id === id))
            .filter(Boolean) as Proverb[];
          setRelated(rels);
        }
      })
      .catch(() => {
        setProverb(null);
        setLoading(false);
      });
  }, [slug]);

  const handleDiscover = useCallback(async () => {
    const all = await loadProverbs();
    const pick = getRandomProverb(all);
    track('proverbs', 'detail', 'discover_another', { from: slug, to: pick.slug });
    goToProverb(nav, pick.slug);
  }, [nav, slug]);

  const swRelLabel = useMemo(() => {
    if (!proverb) return '';
    switch (proverb.swahili_relationship) {
      case 'cognate': return t.proverbs.swahili_cognate;
      case 'parallel': return t.proverbs.swahili_parallel;
      default: return t.proverbs.swahili_translation;
    }
  }, [proverb, t]);

  if (loading) return <p className={styles.loading}>{t.proverbs.searching}</p>;

  if (!proverb) {
    return (
      <>
        <ProverbSearchBar nav={nav} />
        <div className={styles.emptyState}>
          <p className={styles.emptyTitle}>{t.proverbs.no_results.replace('{query}', slug)}</p>
          <p className={styles.emptyBody}>{t.proverbs.try_different_search}</p>
        </div>
      </>
    );
  }

  return (
    <>
      <button type="button" className={styles.backLink} onClick={() => nav('/proverbs')}>
        {t.proverbs.back_to_proverbs}
      </button>

      <article className={styles.detailArticle}>
        <h1 className={styles.detailDigo}>{proverb.digo}</h1>

        {proverb.ipa && <p className={styles.detailIpa}>/{proverb.ipa}/</p>}

        {proverb.content_flag === 'mature' && (
          <p className={styles.matureWarning}>{t.proverbs.mature_content}</p>
        )}

        {proverb.literal_en && (
          <div className={styles.translationSection}>
            <p className={styles.translationLabel}>{t.proverbs.literal_translation}</p>
            <p className={styles.translationText}>{proverb.literal_en}</p>
          </div>
        )}

        {proverb.idiomatic_en && (
          <div className={styles.translationSection}>
            <p className={styles.translationLabel}>{t.proverbs.idiomatic_translation}</p>
            <p className={styles.translationTextSecondary}>{proverb.idiomatic_en}</p>
          </div>
        )}

        {proverb.swahili && (
          <div className={styles.translationSection}>
            <p className={styles.translationLabel}>
              {swRelLabel}
            </p>
            <p className={styles.translationText}>{proverb.swahili}</p>
          </div>
        )}

        {proverb.commentary_en && (
          <div className={styles.commentarySection}>
            <p className={styles.commentaryLabel}>{t.proverbs.cultural_context}</p>
            <p className={styles.commentaryText}>{proverb.commentary_en}</p>
            {proverb.commentary_source !== 'original' && (
              <p className={styles.commentarySource}>{t.proverbs.ai_assisted}</p>
            )}
          </div>
        )}

        <div className={styles.detailMeta}>
          {proverb.english_equivalent && (
            <div className={styles.metaRow}>
              <span className={styles.metaLabel}>{t.proverbs.english_equivalent}</span>
              <span className={styles.metaValue}>{proverb.english_equivalent}</span>
            </div>
          )}

          {proverb.swahili_equivalent && (
            <div className={styles.metaRow}>
              <span className={styles.metaLabel}>{t.proverbs.swahili_cognate}</span>
              <span className={styles.metaValue}>{proverb.swahili_equivalent}</span>
            </div>
          )}

          {proverb.variants.length > 0 && proverb.variants.map((v, i) => (
            <div key={i} className={styles.metaRow}>
              <span className={styles.metaLabel}>Variant</span>
              <span className={styles.metaValue}>{v.form}{v.note ? ` — ${v.note}` : ''}</span>
            </div>
          ))}
        </div>

        {proverb.themes.length > 0 && (
          <div className={styles.detailThemes}>
            {proverb.themes.map((theme) => {
              const entry = getTheme(theme);
              return (
                <button
                  key={theme}
                  type="button"
                  className={styles.detailThemeBtn}
                  onClick={() => {
                    track('proverbs', 'detail', 'click_theme', { theme });
                    goToTheme(nav, theme);
                  }}
                >
                  {entry ? entry.title[locale] : theme}
                </button>
              );
            })}
          </div>
        )}

        {proverb.functions.length > 0 && (
          <div className={styles.detailFunctions}>
            {proverb.functions.map((fn) => {
              const entry = getFunction(fn);
              return (
                <span key={fn} className={styles.functionTag}>
                  {entry ? entry.title[locale] : fn}
                </span>
              );
            })}
          </div>
        )}

        {related.length > 0 && (
          <div className={styles.relatedSection}>
            <p className={styles.relatedLabel}>{t.proverbs.related}</p>
            {related.map((rel) => (
              <ProverbCard key={rel.id} proverb={rel} nav={nav} locale={locale} />
            ))}
          </div>
        )}

        <button type="button" className={styles.discoverBtn} onClick={handleDiscover}>
          {t.proverbs.discover_another}
        </button>
      </article>
    </>
  );
}

/* ===== Theme view ===== */

function ThemeView({ themeSlug, nav, locale }: { themeSlug: string; nav: Navigate; locale: Locale }) {
  const t = useTranslations();
  const theme = getTheme(themeSlug);
  const [proverbs, setProverbs] = useState<Proverb[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    track('proverbs', 'theme', 'view', { theme: themeSlug });
    getProverbsByTheme(themeSlug)
      .then((r) => { setProverbs(r); setLoading(false); })
      .catch(() => { setProverbs([]); setLoading(false); });
  }, [themeSlug]);

  return (
    <>
      <button type="button" className={styles.backLink} onClick={() => nav('/proverbs')}>
        {t.proverbs.back_to_proverbs}
      </button>

      <ProverbSearchBar nav={nav} />

      <div className={styles.themeHeader}>
        <h1 className={styles.themeHeaderTitle}>
          {theme ? theme.title[locale] : themeSlug}
        </h1>
        {theme && (
          <p className={styles.themeHeaderDesc}>{theme.description[locale]}</p>
        )}
        {!loading && (
          <p className={styles.themeHeaderCount}>
            {t.proverbs.count.replace('{count}', String(proverbs.length))}
          </p>
        )}
      </div>

      {loading && <p className={styles.loading}>{t.proverbs.searching}</p>}

      {!loading && proverbs.length === 0 && (
        <div className={styles.emptyState}>
          <p className={styles.emptyTitle}>
            {t.proverbs.no_results.replace('{query}', themeSlug)}
          </p>
        </div>
      )}

      {proverbs.map((p) => (
        <ProverbCard key={p.id} proverb={p} nav={nav} locale={locale} />
      ))}
    </>
  );
}

/* ===== Letter view ===== */

function LetterView({ letter, nav, locale }: { letter: string; nav: Navigate; locale: Locale }) {
  const t = useTranslations();
  const [proverbs, setProverbs] = useState<Proverb[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    track('proverbs', 'letter', 'view', { letter });
    getProverbsByLetter(letter)
      .then((r) => { setProverbs(r); setLoading(false); })
      .catch(() => { setProverbs([]); setLoading(false); });
  }, [letter]);

  const displayLetter = letter.charAt(0).toUpperCase() + letter.slice(1);

  return (
    <>
      <button type="button" className={styles.backLink} onClick={() => nav('/proverbs')}>
        {t.proverbs.back_to_proverbs}
      </button>

      <ProverbSearchBar nav={nav} />

      <p className={styles.resultsInfo}>
        {loading
          ? t.proverbs.searching
          : t.proverbs.results_for
              .replace('{count}', String(proverbs.length))
              .replace('{query}', displayLetter)}
      </p>

      {!loading && proverbs.length === 0 && (
        <div className={styles.emptyState}>
          <p className={styles.emptyTitle}>
            {t.proverbs.no_results.replace('{query}', displayLetter)}
          </p>
        </div>
      )}

      {proverbs.map((p) => (
        <ProverbCard key={p.id} proverb={p} nav={nav} locale={locale} />
      ))}
    </>
  );
}

/* ===== Search results view ===== */

function SearchResultsView({ q, nav, locale }: { q: string; nav: Navigate; locale: Locale }) {
  const t = useTranslations();
  const [results, setResults] = useState<GroupedProverbResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!q) return;
    setIsLoading(true);
    searchProverbs(q)
      .then((r) => {
        setResults(r);
        setIsLoading(false);
        if (r.total === 0) {
          track('proverbs', 'search', 'no_results', { query: q });
        }
      })
      .catch(() => {
        setResults({ dg: [], en: [], sw: [], total: 0 });
        setIsLoading(false);
      });
  }, [q]);

  return (
    <>
      <ProverbSearchBar nav={nav} />

      {q && (
        <p className={styles.resultsInfo}>
          {isLoading
            ? t.proverbs.searching
            : results
              ? t.proverbs.results_for
                  .replace('{count}', String(results.total))
                  .replace('{query}', q)
              : ''}
        </p>
      )}

      {results && results.total === 0 && !isLoading && (
        <div className={styles.emptyState}>
          <p className={styles.emptyTitle}>
            {t.proverbs.no_results.replace('{query}', q)}
          </p>
          <p className={styles.emptyBody}>{t.proverbs.try_different_search}</p>
        </div>
      )}

      {results && results.total > 0 && (
        <div>
          {(['dg', 'sw', 'en'] as const).map((lang) => {
            const items = results[lang];
            if (items.length === 0) return null;
            return (
              <div key={lang} className={styles.resultGroup}>
                <p className={styles.resultGroupLabel}>{LANG_LABELS[lang]}</p>
                {items.map((p) => (
                  <ProverbCard key={p.id + '-' + lang} proverb={p} nav={nav} locale={locale} />
                ))}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

/* ===== Router ===== */

function ProverbsRouter() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const q = searchParams.get('q');
  const { locale } = useLocale();
  const nav: Navigate = useCallback((path: string) => router.push(path), [router]);

  const slug = useMemo(() => {
    const prefix = '/proverbs';
    if (!pathname.startsWith(prefix)) return [];
    const rest = pathname.slice(prefix.length).replace(/^\//, '');
    if (!rest) return [];
    return rest.split('/').map(decodeURIComponent);
  }, [pathname]);

  let view: React.ReactNode;
  if (q) {
    view = <SearchResultsView q={q} nav={nav} locale={locale} />;
  } else if (slug[0] === 'theme' && slug[1]) {
    view = <ThemeView themeSlug={slug[1]} nav={nav} locale={locale} />;
  } else if (slug[0] === 'letter' && slug[1]) {
    view = <LetterView letter={slug[1]} nav={nav} locale={locale} />;
  } else if (slug[0]?.startsWith('p-')) {
    view = <DetailView slug={slug[0]} nav={nav} locale={locale} />;
  } else {
    view = <HomeView nav={nav} locale={locale} />;
  }

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        {view}
      </main>
    </div>
  );
}

export function ProverbsClient() {
  return (
    <Suspense>
      <ProverbsRouter />
    </Suspense>
  );
}
