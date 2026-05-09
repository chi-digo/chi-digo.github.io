'use client';

import { useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useLocale } from '@/lib/i18n/context';
import { universalSearchFull, type UniversalSearchResults } from '@/lib/search/universal';
import type { SearchResult } from '@/lib/dictionary/search';
import type { Proverb } from '@/lib/proverbs/types';
import type { ContentSearchResult } from '@/lib/search/content';
import { POS_ABBREVIATIONS } from '@/lib/constants';
import { TrackedLink } from '@/components/Analytics/TrackedLink';
import styles from './search.module.css';

type SectionType = 'words' | 'proverbs' | 'articles';

function WordResultRow({ result, locale }: { result: SearchResult; locale: string }) {
  return (
    <TrackedLink
      href={`/dictionary/word/${encodeURIComponent(result.headword)}`}
      source="search_results"
      className={styles.resultRow}
    >
      <span className={styles.wordHeadword}>{result.headword}</span>
      <span className={styles.wordPos}>
        {POS_ABBREVIATIONS[result.pos] || result.pos}
      </span>
      <span className={styles.wordDef}>
        {locale === 'sw' ? result.equivalent_sw : locale === 'dig' ? result.equivalent_dg : result.equivalent}
      </span>
    </TrackedLink>
  );
}

function ProverbResultRow({ proverb, locale }: { proverb: Proverb; locale: string }) {
  return (
    <TrackedLink
      href={`/proverbs/${proverb.slug}`}
      source="search_results"
      className={styles.resultRow}
    >
      <span className={styles.proverbDigo} lang="dig">{proverb.digo}</span>
      <span className={styles.proverbTranslation}>
        {locale === 'sw'
          ? (proverb.idiomatic_sw || proverb.literal_sw)
          : locale === 'dig'
            ? proverb.idiomatic_dg
            : (proverb.idiomatic_en || proverb.literal_en)}
      </span>
    </TrackedLink>
  );
}

function ArticleResultRow({ article, locale }: { article: ContentSearchResult; locale: string }) {
  const sectionLabels: Record<string, Record<string, string>> = {
    culture: { en: 'Culture', sw: 'Utamaduni', dig: 'Chimila' },
    history: { en: 'History', sw: 'Historia', dig: 'Historia' },
    language: { en: 'Language', sw: 'Lugha', dig: 'Luga' },
  };

  return (
    <TrackedLink
      href={article.href}
      source="search_results"
      className={styles.resultRow}
    >
      <span className={styles.articleBadge}>
        {sectionLabels[article.section]?.[locale] || article.section}
        {article.domain && ` · ${article.domain}`}
      </span>
      <span className={styles.articleTitle}>{article.title[locale as 'en' | 'sw' | 'dig']}</span>
      <span className={styles.articleIntro}>{article.intro[locale as 'en' | 'sw' | 'dig']}</span>
    </TrackedLink>
  );
}

export default function SearchResultsClient() {
  const searchParams = useSearchParams();
  const { locale } = useLocale();
  const q = searchParams.get('q') || '';
  const typeFilter = searchParams.get('type') as SectionType | null;

  const [results, setResults] = useState<UniversalSearchResults | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!q || q.trim().length < 2) {
      setResults(null);
      return;
    }

    setLoading(true);
    universalSearchFull(q, locale).then((r) => {
      setResults(r);
      setLoading(false);
    });
  }, [q, locale]);

  const sections: { key: SectionType; label: string; count: number }[] = [];
  if (results) {
    if (results.words.length > 0) sections.push({
      key: 'words',
      label: locale === 'sw' ? 'Maneno' : locale === 'dig' ? 'Maneno' : 'Words',
      count: results.words.length,
    });
    if (results.proverbs.length > 0) sections.push({
      key: 'proverbs',
      label: locale === 'sw' ? 'Methali' : locale === 'dig' ? 'Ndarira' : 'Proverbs',
      count: results.proverbs.length,
    });
    if (results.articles.length > 0) sections.push({
      key: 'articles',
      label: locale === 'sw' ? 'Makala' : locale === 'dig' ? 'Makala' : 'Articles',
      count: results.articles.length,
    });
    sections.sort((a, b) => b.count - a.count);
  }

  const filteredSections = typeFilter
    ? sections.filter((s) => s.key === typeFilter)
    : sections;

  const totalResults = results
    ? results.words.length + results.proverbs.length + results.articles.length
    : 0;

  return (
    <main className={styles.page}>
      <div className={styles.inner}>
        <h1 className={styles.heading}>
          {q ? (
            <>
              {locale === 'sw' ? 'Matokeo ya' : locale === 'dig' ? 'Matokeo ga' : 'Results for'}{' '}
              <span className={styles.queryHighlight}>"{q}"</span>
            </>
          ) : (
            locale === 'sw' ? 'Tafuta' : locale === 'dig' ? 'Tafuta' : 'Search'
          )}
        </h1>

        {q && !loading && results && (
          <p className={styles.summary}>
            {totalResults === 0
              ? (locale === 'sw' ? 'Hakuna matokeo yaliyopatikana.' : locale === 'dig' ? 'Takuna matokeo garigophahikana.' : 'No results found.')
              : `${totalResults} ${locale === 'sw' ? 'matokeo' : locale === 'dig' ? 'matokeo' : totalResults === 1 ? 'result' : 'results'}`}
          </p>
        )}

        {typeFilter && (
          <div className={styles.filterBar}>
            <span className={styles.filterLabel}>
              {locale === 'sw' ? 'Kichujio:' : locale === 'dig' ? 'Kichujio:' : 'Filter:'}
            </span>
            <span className={styles.filterBadge}>
              {filteredSections[0]?.label || typeFilter}
            </span>
            <TrackedLink
              href={`/search?q=${encodeURIComponent(q)}`}
              source="search_filter"
              className={styles.filterClear}
            >
              {locale === 'sw' ? 'Ondoa kichujio' : locale === 'dig' ? 'Usa kichujio' : 'Clear filter'}
            </TrackedLink>
          </div>
        )}

        {loading && (
          <div className={styles.loading}>
            <div className={styles.spinner} />
            <p>{locale === 'sw' ? 'Inatafuta…' : locale === 'dig' ? 'Inatafuta…' : 'Searching…'}</p>
          </div>
        )}

        {!loading && results && filteredSections.map((section) => (
          <section key={section.key} className={styles.resultSection}>
            <h2 className={styles.sectionHeading}>
              {section.label}
              <span className={styles.sectionCount}>{section.count}</span>
            </h2>

            <div className={styles.resultList}>
              {section.key === 'words' && results.words.map((w) => (
                <WordResultRow key={w.id} result={w} locale={locale} />
              ))}
              {section.key === 'proverbs' && results.proverbs.map((p) => (
                <ProverbResultRow key={p.id} proverb={p} locale={locale} />
              ))}
              {section.key === 'articles' && results.articles.map((a) => (
                <ArticleResultRow key={a.slug} article={a} locale={locale} />
              ))}
            </div>
          </section>
        ))}

        {!loading && !q && (
          <div className={styles.emptyPrompt}>
            <p>
              {locale === 'sw'
                ? 'Andika neno, methali, au mada kutafuta.'
                : locale === 'dig'
                  ? 'Andika neno, ndarira, au mada kutafuta.'
                  : 'Type a word, proverb, or topic to search.'}
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
