'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from '@/lib/i18n/context';
import { useLocale } from '@/lib/i18n/context';
import { SearchCombobox } from '@/components/SearchCombobox';
import { CultureSection } from '@/components/CultureSection/CultureSection';
import { TrackedLink } from '@/components/Analytics/TrackedLink';
import { useTrackView } from '@/hooks/useTrackView';
import { useUniversalSearch, buildSearchGroups } from '@/hooks/useUniversalSearch';
import { track } from '@/lib/analytics/track';
import { getFeaturedArticle } from '@/lib/home/featured';
import { languageTools } from '@/lib/language/tools';
import { loadEntriesByHeadword } from '@/lib/dictionary/loader';
import { POS_ABBREVIATIONS } from '@/lib/constants';
import type { DictionaryEntry } from '@/lib/dictionary/types';
import styles from './page.module.css';

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

function getWordForDate(): string {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  return CURATED_WORDS[dayOfYear % CURATED_WORDS.length];
}

const QUICK_LINKS = [
  { label: 'Dictionary', labelSw: 'Kamusi', labelDig: 'Kamusi', href: '/dictionary' },
  { label: 'Proverbs', labelSw: 'Methali', labelDig: 'Ndarira', href: '/proverbs' },
  { label: 'Games', labelSw: 'Michezo', labelDig: 'Michezo', href: '/language/quiz' },
  { label: 'Culture', labelSw: 'Utamaduni', labelDig: 'Chimila', href: '/culture' },
  { label: 'History', labelSw: 'Historia', labelDig: 'Historia', href: '/history' },
] as const;

const SECTION_LABELS: Record<string, Record<string, string>> = {
  culture: { en: 'Culture', sw: 'Utamaduni', dig: 'Chimila' },
  history: { en: 'History', sw: 'Historia', dig: 'Historia' },
  language: { en: 'Language', sw: 'Lugha', dig: 'Luga' },
};

export default function HomeClient() {
  const t = useTranslations();
  const { locale } = useLocale();

  const router = useRouter();
  const heroRef = useRef<HTMLElement>(null);
  const exploreRef = useRef<HTMLElement>(null);
  const discoverRef = useRef<HTMLElement>(null);

  useTrackView(heroRef, 'orientation', 'hero');
  useTrackView(exploreRef, 'orientation', 'explore');
  useTrackView(discoverRef, 'orientation', 'discover');

  const { query, setQuery, results, loading } = useUniversalSearch(locale);
  const searchGroups = buildSearchGroups(results, locale, query);

  const handleSearchSelect = useCallback((href: string, meta: { group: string; seeAll: boolean }) => {
    router.push(href);
    setQuery('');
    track('orientation', 'search', meta.seeAll ? 'see_all' : 'select_result', {
      href,
      result_type: meta.group,
      query,
    });
  }, [router, setQuery, query]);

  const handleSearchSubmit = useCallback((q: string) => {
    router.push(`/search?q=${encodeURIComponent(q)}`);
    setQuery('');
    track('orientation', 'search', 'submit', { query: q });
  }, [router, setQuery]);

  const [wotdEntry, setWotdEntry] = useState<DictionaryEntry | null>(null);

  useEffect(() => {
    const word = getWordForDate();
    loadEntriesByHeadword(word).then((entries) => {
      setWotdEntry(entries[0] ?? null);
    });
  }, []);

  const featured = getFeaturedArticle();

  const dictionary = languageTools.find((t) => t.slug === 'dictionary')!;
  const proverbs = languageTools.find((t) => t.slug === 'proverbs')!;
  const quiz = languageTools.find((t) => t.slug === 'quiz')!;

  return (
    <>
      {/* ===== Hero ===== */}
      <section ref={heroRef} className={styles.hero}>
        <div className={styles.bandBottom} />
        <div className={styles.backgroundImage} />
        <div className={styles.gradient} />

        <div className={styles.content}>
          <h1 className={styles.title}>{t.hero.title}</h1>

          <p className={styles.subtitle}>
            {locale === 'sw'
              ? 'Chunguza lugha, utamaduni, na historia ya Kidigo'
              : locale === 'dig'
                ? 'Chunguza luga, chimila, na historia ya Chidigo'
                : 'Explore the Digo language, culture, and history'}
          </p>

          <div className={styles.heroSearch}>
            <SearchCombobox
              value={query}
              onChange={setQuery}
              groups={searchGroups}
              loading={loading}
              onSelect={handleSearchSelect}
              onSubmit={handleSearchSubmit}
              placeholder={
                locale === 'sw' ? 'Tafuta maneno, methali, makala…'
                  : locale === 'dig' ? 'Tafuta maneno, ndarira, makala…'
                    : 'Search words, proverbs, articles…'
              }
              emptyState={
                query.trim().length >= 2 ? (
                  <p style={{ textAlign: 'center', color: 'var(--fg-muted)', fontSize: '0.85rem', margin: 0 }}>
                    {locale === 'sw' ? 'Hakuna matokeo' : locale === 'dig' ? 'Takuna matokeo' : 'No results found'}
                  </p>
                ) : undefined
              }
            />
          </div>

          <div className={styles.pills}>
            {QUICK_LINKS.map((link) => (
              <TrackedLink
                key={link.href}
                href={link.href}
                source="hero_pill"
                className={styles.pill}
              >
                {locale === 'sw' ? link.labelSw : locale === 'dig' ? link.labelDig : link.label}
              </TrackedLink>
            ))}
          </div>

        </div>
      </section>

      {/* ===== Explore Chi-digo ===== */}
      <section ref={exploreRef} className={styles.exploreSection}>
        <div className={styles.sectionInner}>
          <p className={styles.eyebrow}>
            {locale === 'sw' ? 'Chunguza' : locale === 'dig' ? 'Chunguza' : 'Explore'}
          </p>
          <h2 className={styles.sectionHeading}>
            {locale === 'sw'
              ? 'Zana, hadithi, na uvumbuzi wa kila siku'
              : locale === 'dig'
                ? 'Zana, hadisi, na uvumbuzi wa chila siku'
                : 'Tools, stories, and daily discoveries'}
          </h2>

          <div className={styles.exploreGrid}>
            {/* 1. Dictionary */}
            <TrackedLink href="/dictionary" source="explore_grid" className={styles.featureCard}>
              <span className={styles.featureStat}>{dictionary.description[locale]?.split('.')[0]}</span>
              <span className={styles.featureTitle}>{dictionary.title[locale]}</span>
              <span className={styles.featureDesc}>
                {locale === 'sw'
                  ? 'Tafuta, vinjari kwa herufi, na gundua maneno yanayotokana.'
                  : locale === 'dig'
                    ? 'Tafuta, hakiki kwa herufi, na gundua maneno garigo ndani.'
                    : 'Search, browse by letter, and explore derived forms.'}
              </span>
            </TrackedLink>

            {/* 2. Word of the Day */}
            <TrackedLink
              href={wotdEntry ? `/dictionary/word/${encodeURIComponent(wotdEntry.headword)}` : '/dictionary'}
              source="explore_grid"
              className={`${styles.featureCard} ${styles.featureCardHighlight}`}
            >
              <span className={styles.featureBadge}>
                {locale === 'sw' ? 'Neno la Leo' : locale === 'dig' ? 'Neno ra Rero' : 'Word of the Day'}
              </span>
              {wotdEntry ? (
                <>
                  <span className={styles.featureWotdWord}>{wotdEntry.headword}</span>
                  <span className={styles.featureWotdMeta}>
                    {wotdEntry.ipa && <span className={styles.featureWotdIpa}>/{wotdEntry.ipa}/</span>}
                    <span className={styles.featureWotdPos}>
                      {POS_ABBREVIATIONS[wotdEntry.pos] || wotdEntry.pos_en}
                    </span>
                  </span>
                  <span className={styles.featureDesc}>
                    {(() => {
                      const sense = wotdEntry.senses[0];
                      if (!sense) return '';
                      return locale === 'sw' ? sense.definition_sw
                        : locale === 'dig' ? sense.definition_dg
                          : sense.definition_en;
                    })()}
                  </span>
                </>
              ) : (
                <span className={styles.featureDesc}>Loading...</span>
              )}
            </TrackedLink>

            {/* 3. Proverbs */}
            <TrackedLink href="/proverbs" source="explore_grid" className={styles.featureCard}>
              <span className={styles.featureStat}>{proverbs.description[locale]?.split('.')[0]}</span>
              <span className={styles.featureTitle}>{proverbs.title[locale]}</span>
              <span className={styles.featureDesc}>
                {locale === 'sw'
                  ? 'Methali za Kidigo zenye tafsiri, maoni ya kitamaduni, na kuvinjari kwa mada.'
                  : locale === 'dig'
                    ? 'Ndarira za Chidigo na tafsiri, madzo ga chisomo, na kuhakiki kwa mada.'
                    : 'Cultural wisdom with translations, commentary, and thematic browsing.'}
              </span>
            </TrackedLink>

            {/* 4. Featured Article */}
            <TrackedLink href={featured.href} source="explore_grid" className={styles.featureCard}>
              <span className={styles.featureBadge}>
                {SECTION_LABELS[featured.section]?.[locale] || featured.section}
                {featured.domain && ` · ${featured.domain}`}
              </span>
              <span className={styles.featureTitle}>{featured.title[locale]}</span>
              <span className={styles.featureDesc}>{featured.intro[locale]}</span>
            </TrackedLink>

            {/* 5. History Timeline */}
            <TrackedLink href="/history" source="explore_grid" className={styles.featureCard}>
              <span className={styles.featureStat}>
                {locale === 'sw' ? 'Kutoka Singwaya hadi leo' : locale === 'dig' ? 'Kula Singwaya hadi rero' : 'From Singwaya to today'}
              </span>
              <span className={styles.featureTitle}>
                {locale === 'sw' ? 'Historia' : locale === 'dig' ? 'Historia' : 'History'}
              </span>
              <span className={styles.featureDesc}>
                {locale === 'sw'
                  ? 'Mstari wa wakati wa makazi ya Digo, makaya, na enzi ya kisasa.'
                  : locale === 'dig'
                    ? 'Mstari wa wakati wa makalo ga Adigo, makaya, na enzi ya chisambi.'
                    : 'A timeline of Digo settlement, the kaya period, and the modern era.'}
              </span>
            </TrackedLink>

            {/* 6. Quiz (Coming Soon) */}
            <div className={`${styles.featureCard} ${styles.featureCardDisabled}`}>
              <span className={styles.featureBadgeSoon}>
                {locale === 'sw' ? 'Inakuja hivi karibuni' : locale === 'dig' ? 'Inakpwedza vi karibuni' : 'Coming soon'}
              </span>
              <span className={styles.featureTitle}>{quiz.title[locale]}</span>
              <span className={styles.featureDesc}>
                {quiz.description[locale]?.split('.')[0]}.
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Discover ===== */}
      <div ref={discoverRef}>
        <CultureSection />
      </div>
    </>
  );
}
