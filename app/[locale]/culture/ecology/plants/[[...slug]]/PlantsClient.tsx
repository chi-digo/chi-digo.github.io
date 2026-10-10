'use client';

import { useState, useCallback, useEffect, useMemo, useRef, Suspense, Fragment, type ReactNode } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { localePath, pathnameWithoutLocale } from '@/lib/i18n/locale-path';
import { useTranslations, useLocale } from '@/lib/i18n/context';
import {
  loadPlants, getPlant, getPlantsByTheme, getPlantsByLetter, getThemeCounts, getLettersWithPlants,
  getNamesWanted, loadGlossary, digoLetterKey,
} from '@/lib/plants/loader';
import { searchPlants, searchPlantsDropdown } from '@/lib/plants/search';
import { PLANT_THEMES, getPlantTheme } from '@/lib/plants/themes';
import { localized, type GlossaryTerm, type GroupedPlantResults, type L10n, type Plant, type PlantPart, type PlantStub, type SectionKey } from '@/lib/plants/types';
import { DIGO_ALPHABET } from '@/lib/constants';
import { track } from '@/lib/analytics/track';
import { Skeleton } from '@chi-digo/design-system';
import type { Locale } from '@/lib/i18n/config';
import base from '@/app/[locale]/language/proverbs/proverbs.module.css';
import styles from '../plants.module.css';

type Navigate = (path: string) => void;

const ROOT = '/culture/ecology/plants';
const goToPlant = (nav: Navigate, slug: string) => nav(`${ROOT}/${encodeURIComponent(slug)}`);
const goToTheme = (nav: Navigate, theme: string) => nav(`${ROOT}/theme/${encodeURIComponent(theme)}`);
const goToLetter = (nav: Navigate, letter: string) => nav(`${ROOT}/letter/${encodeURIComponent(letter.toLowerCase())}`);
const goToSearch = (nav: Navigate, q: string) => nav(`${ROOT}?q=${encodeURIComponent(q)}`);

const EMPTY: GroupedPlantResults = { dg: [], sw: [], en: [], sci: [], total: 0 };

/* ===== Helpers ===== */

/** Render prose with *italic* Digo words and blank-line paragraphs. */
function Rich({ text, as = 'p' }: { text: string; as?: 'p' | 'span' }) {
  const paragraphs = as === 'p' ? text.split(/\n\s*\n/) : [text];
  const inline = (t: string) =>
    t.split(/(\*[^*\n]+\*)/g).map((piece, i) =>
      piece.startsWith('*') && piece.endsWith('*') && piece.length > 2
        ? <em key={i}>{piece.slice(1, -1)}</em>
        : <Fragment key={i}>{piece}</Fragment>,
    );
  if (as === 'span') return <>{inline(text)}</>;
  return <>{paragraphs.map((para, i) => <p key={i}>{inline(para)}</p>)}</>;
}

function displayName(p: { digo_headword: string | null; english: string | null; scientific: string | null }) {
  return p.digo_headword || firstName(p.english) || p.scientific || '';
}

function firstName(names: string | null | undefined): string {
  return (names || '').split(/[;,(]/)[0].trim();
}

/** English and Swahili names; on /dg Swahili comes first (spec 33 §6). */
function glossLine(p: { english: string | null; swahili: string | null; digo_headword: string | null }, locale: Locale) {
  const en = p.digo_headword ? firstName(p.english) : '';
  const sw = firstName(p.swahili);
  const parts = locale === 'dg' ? [sw, en] : [en, sw];
  return parts.filter(Boolean).join(' · ');
}

function text(value: L10n | null | undefined, locale: Locale): string {
  return localized(value, locale)?.text ?? '';
}

function NameChip({ status }: { status: string }) {
  const t = useTranslations();
  if (status === 'missing') return <span className={styles.chip}>{t.plants.name_wanted_chip}</span>;
  if (status === 'conflict') return <span className={styles.chip}>{t.plants.name_unconfirmed_chip}</span>;
  return null;
}

function ShareButton({ title, body, path, contentId }: { title: string; body: string; path: string; contentId: string }) {
  const [copied, setCopied] = useState(false);
  const onClick = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}${path}`;
    track('plants', 'share', 'click', { slug: contentId });
    try {
      if (navigator.share) {
        await navigator.share({ title, text: body, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* dismissed */
    }
  }, [title, body, path, contentId]);
  return (
    <button type="button" className={styles.shareBtn} onClick={onClick} aria-label="Share">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7" />
        <polyline points="16 6 12 2 8 6" />
        <line x1="12" y1="2" x2="12" y2="15" />
      </svg>
      {copied && <span className={styles.copied}>✓</span>}
    </button>
  );
}

/* ===== Loading skeletons (ISSUES PL-1) ===== */

const gap = (px: number) => ({ marginTop: px });

function CardSkeleton() {
  return (
    <div className={base.proverbCard} aria-hidden="true">
      <Skeleton width="38%" height={22} />
      <Skeleton width="30%" height={14} style={gap(10)} />
      <Skeleton width="24%" height={13} style={gap(6)} />
      <Skeleton width="88%" height={15} style={gap(14)} />
      <div style={{ display: 'flex', gap: 6, marginTop: 14 }}>
        <Skeleton width={52} height={16} />
        <Skeleton width={72} height={16} />
      </div>
    </div>
  );
}

function ListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div role="status" aria-busy="true">
      {Array.from({ length: count }, (_, i) => <CardSkeleton key={i} />)}
    </div>
  );
}

function DetailSkeleton() {
  return (
    <article className={base.detailArticle} role="status" aria-busy="true">
      <Skeleton width="42%" height={34} />
      <Skeleton width="34%" height={16} style={gap(14)} />
      <Skeleton width="26%" height={15} style={gap(8)} />
      <div style={gap(28)}>
        <Skeleton width="100%" height={17} />
        <Skeleton width="96%" height={17} style={gap(10)} />
        <Skeleton width="70%" height={17} style={gap(10)} />
      </div>
      <div className={styles.namesPanel}>
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className={styles.namesRow}>
            <Skeleton width="60%" height={12} />
            <Skeleton width={`${70 - i * 8}%`} height={15} />
          </div>
        ))}
      </div>
      {[0, 1].map((i) => (
        <div key={i} className={styles.prose}>
          <Skeleton width="22%" height={22} />
          <Skeleton width="100%" height={16} style={gap(14)} />
          <Skeleton width="97%" height={16} style={gap(10)} />
          <Skeleton width="92%" height={16} style={gap(10)} />
          <Skeleton width="58%" height={16} style={gap(10)} />
        </div>
      ))}
    </article>
  );
}

function GlossarySkeleton() {
  return (
    <div role="status" aria-busy="true">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className={styles.glossaryItem} aria-hidden="true">
          <Skeleton width="20%" height={18} />
          <Skeleton width="90%" height={15} style={gap(10)} />
          <Skeleton width="30%" height={13} style={gap(8)} />
        </div>
      ))}
    </div>
  );
}

/* ===== Search ===== */

const GROUP_ORDER = ['dg', 'sw', 'en', 'sci'] as const;

function useGroupLabels() {
  const t = useTranslations();
  return { dg: t.plants.lang_digo, sw: t.plants.lang_swahili, en: t.plants.lang_english, sci: t.plants.sci_group };
}

function PlantSearchBar({ nav, locale }: { nav: Navigate; locale: Locale }) {
  const t = useTranslations();
  const labels = useGroupLabels();
  const [query, setQueryState] = useState('');
  const [results, setResults] = useState<GroupedPlantResults>(EMPTY);
  const [focused, setFocused] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(null);
  const run = useRef(0);

  const setQuery = useCallback((q: string) => {
    setQueryState(q);
    if (!q || q.trim().length < 2) {
      ++run.current;
      setResults(EMPTY);
    }
  }, []);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (!query || query.trim().length < 2) return;
    const id = ++run.current;
    timer.current = setTimeout(async () => {
      track('plants', 'search', 'type', { query, query_length: query.length });
      const r = await searchPlantsDropdown(query).catch(() => EMPTY);
      if (run.current === id) setResults(r);
    }, 150);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [query]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    track('plants', 'search', 'submit', { query: query.trim() });
    setFocused(false);
    goToSearch(nav, query.trim());
  };

  return (
    <form onSubmit={submit} className={base.searchWrapper}>
      <div className={base.searchBar}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={base.searchIcon}>
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 200)}
          placeholder={t.plants.search_placeholder}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          className={base.searchInput}
        />
      </div>
      {focused && query.length >= 2 && results.total > 0 && (
        <div className={base.dropdown}>
          {GROUP_ORDER.map((g) => results[g].length > 0 && (
            <div key={g}>
              <div className={base.dropdownLang}>{labels[g]}</div>
              {results[g].map((p) => (
                <button
                  key={p.id + g}
                  type="button"
                  className={base.dropdownItem}
                  onClick={() => {
                    track('plants', 'search', 'select_result', { slug: p.slug, query });
                    setQuery('');
                    goToPlant(nav, p.slug);
                  }}
                >
                  <span className={base.dropdownDigo}>{displayName(p)}</span>
                  <span className={base.dropdownGloss}>
                    {glossLine(p, locale)}{p.scientific ? <> · <em>{p.scientific}</em></> : null}
                  </span>
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </form>
  );
}

/* ===== Plant card ===== */

function PlantCard({ plant, nav, locale, reason }: { plant: PlantStub; nav: Navigate; locale: Locale; reason?: string }) {
  const t = useTranslations();
  return (
    <button
      type="button"
      className={base.proverbCard}
      onClick={() => {
        track('plants', reason ? 'detail' : 'browse', reason ? 'click_related' : 'click_plant', { slug: plant.slug });
        goToPlant(nav, plant.slug);
      }}
    >
      <p className={base.proverbCardDigo}>
        {displayName(plant)}
        <NameChip status={plant.name_status} />
      </p>
      <p className={base.proverbCardGloss}>{glossLine(plant, locale)}</p>
      <p className={styles.cardSci}>{plant.scientific || t.plants.not_identified}</p>
      <p className={styles.cardTeaser}><Rich as="span" text={reason || text(plant.teaser, locale)} /></p>
      {plant.themes.length > 0 && (
        <div className={base.proverbCardThemes}>
          {plant.themes.slice(0, 3).map((th) => (
            <span key={th} className={base.themeTag}>{getPlantTheme(th)?.title[locale] ?? th}</span>
          ))}
        </div>
      )}
    </button>
  );
}

/* ===== Plant of the day ===== */

function todaysIndex(n: number): number {
  const d = new Date();
  const seed = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}:plants`;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
  return Math.abs(hash) % n;
}

function FeaturedPlantCard({ nav, locale }: { nav: Navigate; locale: Locale }) {
  const t = useTranslations();
  const [plant, setPlant] = useState<PlantStub | null>(null);

  useEffect(() => {
    loadPlants().then((all) => {
      // Only plants with prose in the reader's language, and a Digo name to feature (spec 33 §5.3).
      const pool = all.filter((p) => p.has_prose[locale] && p.digo_headword);
      const list = pool.length ? pool : all.filter((p) => p.digo_headword);
      setPlant(list[todaysIndex(list.length)]);
    }).catch(() => {});
  }, [locale]);

  if (!plant) {
    return (
      <div className={base.featuredCard}>
        <p className={base.featuredLabel}>{t.plants.plant_of_the_day}</p>
        <div role="status" aria-busy="true">
          <Skeleton width="34%" height={30} style={{ ...{ background: 'rgba(242, 234, 215, 0.14)' }, marginTop: 14 }} />
          <Skeleton width="28%" height={15} style={{ ...{ background: 'rgba(242, 234, 215, 0.14)' }, marginTop: 12 }} />
          <Skeleton width="22%" height={14} style={{ ...{ background: 'rgba(242, 234, 215, 0.14)' }, marginTop: 8 }} />
          <Skeleton width="80%" height={15} style={{ ...{ background: 'rgba(242, 234, 215, 0.14)' }, marginTop: 14 }} />
        </div>
      </div>
    );
  }
  const open = () => {
    track('plants', 'featured', 'click', { slug: plant.slug });
    goToPlant(nav, plant.slug);
  };
  return (
    <div
      className={base.featuredCard}
      onClick={open}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } }}
    >
      <div className={base.featuredTop}>
        <p className={base.featuredLabel}>{t.plants.plant_of_the_day}</p>
        <div className={base.featuredActions} onClick={(e) => e.stopPropagation()}>
          <ShareButton
            title={displayName(plant)}
            body={text(plant.teaser, locale)}
            path={localePath(`${ROOT}/${plant.slug}`, locale)}
            contentId={plant.slug}
          />
        </div>
      </div>
      <p className={base.featuredDigo}>{displayName(plant)}<NameChip status={plant.name_status} /></p>
      <p className={base.featuredGloss}>{glossLine(plant, locale)}</p>
      {plant.scientific && <p className={styles.featuredSci}>{plant.scientific}</p>}
      <p className={base.featuredGloss}><Rich as="span" text={text(plant.teaser, locale)} /></p>
      {plant.themes.length > 0 && (
        <div className={base.featuredThemes}>
          {plant.themes.map((th) => (
            <span key={th} className={base.featuredThemeTag}>{getPlantTheme(th)?.title[locale] ?? th}</span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ===== Home ===== */

function HomeView({ nav, locale }: { nav: Navigate; locale: Locale }) {
  const t = useTranslations();
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [letters, setLetters] = useState<Set<string> | null>(null);
  const [wanted, setWanted] = useState<PlantStub[]>([]);

  useEffect(() => {
    getThemeCounts().then(setCounts).catch(() => {});
    getLettersWithPlants().then(setLetters).catch(() => {});
    getNamesWanted().then(setWanted).catch(() => {});
  }, []);

  return (
    <>
      <PlantSearchBar nav={nav} locale={locale} />

      <section className={base.mt4}>
        <p className={base.sectionLabel}>{t.plants.plant_of_the_day}</p>
        <FeaturedPlantCard nav={nav} locale={locale} />
      </section>

      <section className={base.mt6}>
        <p className={base.sectionLabel}>{t.plants.browse_by_theme}</p>
        <div className={base.themeGrid}>
          {PLANT_THEMES.map((theme) => (
            <button
              key={theme.slug}
              type="button"
              className={base.themeCard}
              onClick={() => {
                track('plants', 'browse', 'click_theme', { theme: theme.slug });
                goToTheme(nav, theme.slug);
              }}
            >
              <span className={base.themeTitle}>{theme.title[locale]}</span>
              {counts[theme.slug] ? (
                <span className={base.themeCount}>{t.plants.count.replace('{count}', String(counts[theme.slug]))}</span>
              ) : null}
            </button>
          ))}
        </div>
      </section>

      <section className={base.mt6}>
        <p className={base.sectionLabel}>{t.plants.browse_by_letter}</p>
        <div className={base.alphabetGrid}>
          {DIGO_ALPHABET.map((letter) => {
            const empty = letters !== null && !letters.has(digoLetterKey(letter));
            return (
              <button
                key={letter}
                type="button"
                className={`${base.letterCard} ${empty ? styles.letterDisabled : ''}`}
                disabled={empty}
                onClick={() => {
                  track('plants', 'browse', 'click_letter', { letter });
                  goToLetter(nav, letter);
                }}
              >
                {letter}
              </button>
            );
          })}
        </div>
        <button type="button" className={styles.glossaryLink} onClick={() => nav(`${ROOT}/parts`)}>
          {t.plants.glossary_link} →
        </button>
      </section>

      {wanted.length > 0 && (
        <section className={styles.helpSection}>
          <p className={base.sectionLabel}>{t.plants.help_name}</p>
          <p className={styles.helpIntro}>{t.plants.help_name_intro}</p>
          <div className={styles.helpList}>
            {wanted.map((p) => (
              <button
                key={p.slug}
                type="button"
                className={styles.helpItem}
                onClick={() => {
                  track('plants', 'browse', 'click_name_wanted', { slug: p.slug, status: p.name_status });
                  goToPlant(nav, p.slug);
                }}
              >
                {displayName(p)}
              </button>
            ))}
          </div>
        </section>
      )}
    </>
  );
}

/* ===== Plant page ===== */

const SECTION_ORDER: SectionKey[] = ['about', 'where', 'uses', 'culture', 'names', 'conservation'];
const KIND_ORDER: PlantPart['kind'][] = ['leaf', 'flower', 'fruit_stage', 'fruit', 'seed', 'bunch', 'stem', 'root', 'product', 'other'];

function PartsSection({ parts, locale }: { parts: PlantPart[]; locale: Locale }) {
  const t = useTranslations();
  const describe = (x: PlantPart) => (
    <>
      <span className={styles.partTerm}>{x.term}</span>
      {x.plural && <span className={styles.partEq}>/ {x.plural}</span>}
      {(x.english || x.swahili) && (
        <span className={styles.partEq}>{[x.english, x.swahili && `${t.plants.lang_swahili}: ${x.swahili}`].filter(Boolean).join(' · ')}</span>
      )}
      <p className={styles.partDef}><Rich as="span" text={text(x.definition, locale)} /></p>
      {x.use && <p className={styles.partMeta}>{t.plants.use_label}: <Rich as="span" text={text(x.use, locale)} /></p>}
      {x.meaning && <p className={styles.partMeta}>{t.plants.word_meaning}: <Rich as="span" text={text(x.meaning, locale)} /></p>}
      <p className={styles.partMeta}>{x.source}</p>
    </>
  );
  return (
    <section className={styles.prose}>
      <h2 className={styles.proseHeading}>{t.plants.parts}</h2>
      {KIND_ORDER.map((kind) => {
        const items = parts.filter((x) => x.kind === kind);
        if (!items.length) return null;
        if (kind === 'fruit_stage') {
          items.sort((a, b) => (a.stage_order ?? 0) - (b.stage_order ?? 0));
          return (
            <div key={kind}>
              <p className={styles.partGroupLabel}>{t.plants.kinds.fruit_stage}: {items.map((x) => x.term).join(' → ')}</p>
              <div className={styles.stages}>
                {items.map((x, i) => (
                  <div key={x.term} className={styles.stage}>
                    <span className={styles.stageNum}>{i + 1}</span>
                    <div>{describe(x)}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        }
        // Long groups (the coconut has 10+ leaf and product words) start collapsed.
        return (
          <details key={kind} className={styles.partGroup} open={items.length <= 4}>
            <summary className={styles.partGroupLabel}>{t.plants.kinds[kind]} ({items.length})</summary>
            <ul className={styles.partList}>
              {items.map((x) => <li key={x.term + kind} className={styles.partItem}>{describe(x)}</li>)}
            </ul>
          </details>
        );
      })}
    </section>
  );
}

function NamesPanel({ plant }: { plant: Plant }) {
  const t = useTranslations();
  const tx = plant.taxon;
  const recordedAs = tx && (tx.status === 'SYNONYM' || !plant.scientific.toLowerCase().includes(tx.accepted_name.toLowerCase().replace('× ', '')));
  const linkLabels: Record<string, string> = { gbif: 'GBIF', powo: 'Plants of the World Online', ipni: 'IPNI', index_fungorum: 'Index Fungorum' };
  const rows: [string, ReactNode][] = [];
  rows.push([t.plants.lang_digo, plant.digo ? <Rich as="span" text={plant.digo} /> : t.plants.digo_name_wanted]);
  if (plant.swahili) rows.push([t.plants.lang_swahili, plant.swahili]);
  if (plant.english) rows.push([t.plants.lang_english, plant.english]);
  if (plant.other_mijikenda) rows.push([t.plants.other_mijikenda, plant.other_mijikenda]);
  rows.push([
    t.plants.scientific_name,
    tx ? (
      <>
        <em>{tx.accepted_name}</em>{tx.accepted_authorship ? ` ${tx.accepted_authorship}` : ''}
        {tx.family ? ` · ${t.plants.family}: ${tx.family}` : ''}
        {tx.level === 'genus' && <p className={styles.namesNote}>{t.plants.genus_only}</p>}
        {recordedAs && <p className={styles.namesNote}>{t.plants.recorded_as.replace('{name}', plant.scientific)}</p>}
        <span className={styles.refLinks}>
          {Object.entries(tx.links).map(([k, href]) => (
            <a key={k} href={href} target="_blank" rel="noopener noreferrer">{linkLabels[k] ?? k}</a>
          ))}
        </span>
      </>
    ) : t.plants.not_identified,
  ]);
  if (plant.mgombato.length) rows.push([t.plants.mgombato, <>{plant.mgombato.map((m) => <p key={m} className={styles.namesNote}>{m}</p>)}</>]);
  return (
    <div className={styles.namesPanel}>
      {rows.map(([label, value]) => (
        <div key={label} className={styles.namesRow}>
          <span className={styles.namesLabel}>{label}</span>
          <span>{value}</span>
        </div>
      ))}
      <p className={styles.namesNote}>{plant.name_status === 'confirmed' && plant.name_credit ? plant.name_credit : t.plants.names_unconfirmed}</p>
    </div>
  );
}

function DetailView({ slug, nav, locale }: { slug: string; nav: Navigate; locale: Locale }) {
  const t = useTranslations();
  const [loaded, setLoaded] = useState<{ slug: string; plant: Plant | null } | null>(null);
  const [relatedFor, setRelatedFor] = useState<{ slug: string; items: { stub: PlantStub; reason: string }[] } | null>(null);
  const plant = loaded?.slug === slug ? loaded.plant : null;
  const loading = loaded?.slug !== slug;
  const related = relatedFor?.slug === slug ? relatedFor.items : [];

  useEffect(() => {
    let cancelled = false;
    getPlant(slug).then(async (found) => {
      if (cancelled) return;
      setLoaded({ slug, plant: found });
      track('plants', 'detail', found ? 'view' : 'not_found', { slug });
      if (found?.related.length) {
        const all = await loadPlants();
        const items = found.related
          .map((r) => ({ stub: all.find((p) => p.slug === r.slug), reason: text(r.reason, locale) }))
          .filter((x): x is { stub: PlantStub; reason: string } => !!x.stub);
        if (!cancelled) setRelatedFor({ slug, items });
      }
    });
    return () => { cancelled = true; };
  }, [slug, locale]);

  const discover = useCallback(async () => {
    const all = await loadPlants();
    const pick = all[Math.floor(Math.random() * all.length)];
    track('plants', 'detail', 'discover_another', { from: slug, to: pick.slug });
    goToPlant(nav, pick.slug);
  }, [nav, slug]);

  if (loading) return <DetailSkeleton />;
  if (!plant) {
    return (
      <>
        <PlantSearchBar nav={nav} locale={locale} />
        <div className={base.emptyState}>
          <p className={base.emptyTitle}>{t.plants.no_results.replace('{query}', slug)}</p>
          <p className={base.emptyBody}>{t.plants.try_different_search}</p>
        </div>
      </>
    );
  }

  const fallback = locale !== 'en' && !plant.has_prose[locale];
  const name = displayName({ ...plant, scientific: plant.taxon?.accepted_name ?? null });
  const summary = text(plant.summary, locale);

  return (
    <article className={base.detailArticle}>
      <div className={base.detailHeader}>
        <div>
          <h1 className={base.detailDigo}>{name}</h1>
          {plant.digo_alt.length > 0 && <p className={styles.altNames}>{plant.digo_alt.join(' · ')}</p>}
          <p className={styles.headerNames}>{glossLine(plant, locale)}</p>
          <p className={styles.headerSci}>{plant.taxon?.accepted_name ?? t.plants.not_identified}</p>
        </div>
        <ShareButton title={name} body={text(plant.teaser, locale)} path={localePath(`${ROOT}/${plant.slug}`, locale)} contentId={plant.slug} />
      </div>

      {fallback && <p className={styles.notice}>{t.plants.not_translated}</p>}

      {plant.name_status === 'conflict' && plant.digo_proposals.length > 0 && (
        <div className={styles.callout}>
          <p className={styles.calloutTitle}>{t.plants.names_not_confirmed}</p>
          <ul className={styles.proposals}>
            {plant.digo_proposals.map((q) => (
              <li key={q.name + q.source}>
                <em>{q.name}</em> <span className={styles.proposalSource}>({q.source}){q.note ? ` · ${q.note}` : ''}</span>
              </li>
            ))}
          </ul>
          <p className={styles.calloutAction}>{t.plants.do_you_know} {t.plants.contribute}</p>
        </div>
      )}
      {plant.name_status === 'missing' && (
        <div className={styles.callout}>
          <p className={styles.calloutTitle}>{t.plants.digo_name_wanted}</p>
          <p className={styles.calloutAction}>{t.plants.do_you_know} {t.plants.contribute}</p>
        </div>
      )}

      {summary && <div className={styles.summary}><Rich text={summary} /></div>}

      <NamesPanel plant={plant} />

      {SECTION_ORDER.map((key) => {
        const value = text(plant.sections[key], locale);
        if (!value) return null;
        return (
          <section key={key} className={styles.prose}>
            <h2 className={styles.proseHeading}>{t.plants[key]}</h2>
            {key === 'uses' && plant.themes.includes('medicine') && <p className={styles.notice}>{t.plants.medicine_notice}</p>}
            <Rich text={value} />
          </section>
        );
      })}

      {plant.parts.length > 0 && <PartsSection parts={plant.parts} locale={locale} />}

      {plant.themes.length > 0 && (
        <div className={base.detailThemes}>
          {plant.themes.map((th) => (
            <button
              key={th}
              type="button"
              className={base.detailThemeBtn}
              onClick={() => {
                track('plants', 'detail', 'click_theme', { theme: th });
                goToTheme(nav, th);
              }}
            >
              {getPlantTheme(th)?.title[locale] ?? th}
            </button>
          ))}
        </div>
      )}

      {related.length > 0 && (
        <div className={base.relatedSection}>
          <p className={base.relatedLabel}>{t.plants.related}</p>
          {related.map(({ stub, reason }) => (
            <PlantCard key={stub.slug} plant={stub} nav={nav} locale={locale} reason={reason} />
          ))}
        </div>
      )}

      <button type="button" className={base.discoverBtn} onClick={discover}>{t.plants.discover_another}</button>

      <p className={styles.contribute}>{t.plants.contribute}</p>

      {plant.sources.length > 0 && (
        <details className={styles.sources}>
          <summary>{t.plants.sources} ({plant.sources.length})</summary>
          <ul>{plant.sources.map((s) => <li key={s}>{s}</li>)}</ul>
        </details>
      )}
    </article>
  );
}

/* ===== Lists ===== */

function ListView({ title, description, load, nav, locale, viewEvent }: {
  title: string; description?: string; load: () => Promise<PlantStub[]>; nav: Navigate; locale: Locale; viewEvent: [string, Record<string, string>];
}) {
  const t = useTranslations();
  const [plants, setPlants] = useState<PlantStub[] | null>(null);
  const [event, params] = viewEvent;
  const key = JSON.stringify(params);

  useEffect(() => {
    track('plants', event, 'view', params);
    load().then(setPlants).catch(() => setPlants([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `key` captures params and load's inputs
  }, [key]);

  return (
    <>
      <PlantSearchBar nav={nav} locale={locale} />
      <div className={base.themeHeader}>
        <h1 className={base.themeHeaderTitle}>{title}</h1>
        {description && <p className={base.themeHeaderDesc}>{description}</p>}
        {plants && <p className={base.themeHeaderCount}>{t.plants.count.replace('{count}', String(plants.length))}</p>}
      </div>
      {!plants && <ListSkeleton />}
      {plants && plants.length === 0 && (
        <div className={base.emptyState}><p className={base.emptyTitle}>{t.plants.no_results.replace('{query}', title)}</p></div>
      )}
      {plants?.map((p) => <PlantCard key={p.id} plant={p} nav={nav} locale={locale} />)}
    </>
  );
}

function SearchResultsView({ q, nav, locale }: { q: string; nav: Navigate; locale: Locale }) {
  const t = useTranslations();
  const labels = useGroupLabels();
  const [loaded, setLoaded] = useState<{ q: string; results: GroupedPlantResults } | null>(null);
  const results = loaded?.q === q ? loaded.results : null;

  useEffect(() => {
    searchPlants(q).then((r) => {
      setLoaded({ q, results: r });
      if (r.total === 0) track('plants', 'search', 'no_results', { query: q });
    });
  }, [q]);

  return (
    <>
      <PlantSearchBar nav={nav} locale={locale} />
      <p className={base.resultsInfo}>
        {results ? t.plants.results_for.replace('{count}', String(results.total)).replace('{query}', q) : t.plants.searching}
      </p>
      {!results && <ListSkeleton count={3} />}
      {results && results.total === 0 && (
        <div className={base.emptyState}>
          <p className={base.emptyTitle}>{t.plants.no_results.replace('{query}', q)}</p>
          <p className={base.emptyBody}>{t.plants.try_different_search}</p>
        </div>
      )}
      {results && GROUP_ORDER.map((g) => results[g].length > 0 && (
        <div key={g} className={base.resultGroup}>
          <p className={base.resultGroupLabel}>{labels[g]}</p>
          {results[g].map((p) => <PlantCard key={p.id + g} plant={p} nav={nav} locale={locale} />)}
        </div>
      ))}
    </>
  );
}

function GlossaryView({ locale }: { locale: Locale }) {
  const t = useTranslations();
  const [terms, setTerms] = useState<GlossaryTerm[] | null>(null);
  useEffect(() => {
    track('plants', 'glossary', 'view');
    loadGlossary().then((g) => setTerms([...g].sort((a, b) => a.term.localeCompare(b.term)))).catch(() => setTerms([]));
  }, []);
  return (
    <>
      <div className={base.themeHeader}>
        <h1 className={base.themeHeaderTitle}>{t.plants.glossary_title}</h1>
        <p className={base.themeHeaderDesc}>{t.plants.glossary_intro}</p>
      </div>
      {!terms && <GlossarySkeleton />}
      {terms?.map((g) => (
        <div key={g.term} className={styles.glossaryItem}>
          <span className={styles.partTerm}>{g.term}</span>
          {g.plural && <span className={styles.partEq}>/ {g.plural}</span>}
          {(g.english || g.swahili) && <span className={styles.partEq}>{[g.english, g.swahili && `${t.plants.lang_swahili}: ${g.swahili}`].filter(Boolean).join(' · ')}</span>}
          <p className={styles.partDef}><Rich as="span" text={text(g.definition, locale)} /></p>
          {g.meaning && <p className={styles.partMeta}>{t.plants.word_meaning}: <Rich as="span" text={text(g.meaning, locale)} /></p>}
          <p className={styles.partMeta}>{g.source}</p>
        </div>
      ))}
    </>
  );
}

/* ===== Router ===== */

function PlantsRouter() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const q = searchParams.get('q');
  const { locale } = useLocale();
  const nav: Navigate = useCallback((path: string) => router.push(localePath(path, locale)), [router, locale]);

  const slug = useMemo(() => {
    const bare = pathnameWithoutLocale(pathname);
    if (!bare.startsWith(ROOT)) return [];
    const rest = bare.slice(ROOT.length).replace(/^\//, '');
    return rest ? rest.split('/').map(decodeURIComponent) : [];
  }, [pathname]);

  let view: ReactNode;
  if (q) {
    view = <SearchResultsView q={q} nav={nav} locale={locale} />;
  } else if (slug[0] === 'theme' && slug[1]) {
    const theme = getPlantTheme(slug[1]);
    view = (
      <ListView
        title={theme?.title[locale] ?? slug[1]}
        description={theme?.description[locale]}
        load={() => getPlantsByTheme(slug[1])}
        nav={nav}
        locale={locale}
        viewEvent={['theme', { theme: slug[1] }]}
      />
    );
  } else if (slug[0] === 'letter' && slug[1]) {
    const letter = slug[1].charAt(0).toUpperCase() + slug[1].slice(1);
    view = (
      <ListView title={letter} load={() => getPlantsByLetter(slug[1])} nav={nav} locale={locale} viewEvent={['letter', { letter: slug[1] }]} />
    );
  } else if (slug[0] === 'parts') {
    view = <GlossaryView locale={locale} />;
  } else if (slug[0]) {
    view = <DetailView slug={slug[0]} nav={nav} locale={locale} />;
  } else {
    view = <HomeView nav={nav} locale={locale} />;
  }

  return (
    <div className={base.page}>
      <main className={base.main}>{view}</main>
    </div>
  );
}

export function PlantsClient() {
  return (
    <Suspense>
      <PlantsRouter />
    </Suspense>
  );
}
