'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations, useLocale } from '@/lib/i18n/context';
import { useFavourites } from '@/lib/favourites/context';
import { Badge, EmptyState, Skeleton } from '@chi-digo/design-system';
import { AppFavouriteButton } from '@/components/FavouriteButton/FavouriteButton';
import { savedWordEntry } from '@/lib/dictionary/loader';
import { track } from '@/lib/analytics/track';
import styles from './FavouritesList.module.css';
import { loadProverbs } from '@/lib/proverbs/loader';

interface ProverbIndex {
  slug: string;
  idiomatic_en: string;
  idiomatic_sw?: string;
  literal_en: string;
  swahili: string;
  commentary_dg?: string;
}

function FavouritesSkeleton() {
  return (
    <div className={styles.container}>
      <ul className={styles.list}>
        {[1, 2, 3].map((i) => (
          <li key={i} className={styles.skeletonItem}>
            <div className={styles.skeletonText}>
              <div className={styles.itemTop}>
                <Skeleton width="40%" height={15} />
                <Skeleton variant="rectangular" width={56} height={18} />
              </div>
              <Skeleton width="60%" height={13} />
            </div>
            <Skeleton variant="circular" width={28} height={28} />
          </li>
        ))}
      </ul>
    </div>
  );
}

export function FavouritesList() {
  const t = useTranslations();
  const { locale } = useLocale();
  const { favourites, loading } = useFavourites();
  const [glosses, setGlosses] = useState<Record<string, string>>({});
  /** Saved headword -> the word's headword now (the same unless it changed). */
  const [headwords, setHeadwords] = useState<Record<string, string>>({});

  useEffect(() => {
    if (favourites.length === 0) return;

    const words = favourites.filter((f) => f.entry_type === 'word');
    const proverbs = favourites.filter((f) => f.entry_type === 'proverb');

    const resolved: Record<string, string> = {};
    const current: Record<string, string> = {};

    // Each saved word as it reads now: a word whose headword changed is still the one saved (spec 34 §18.6).
    const fetchWords = words.map(async (w) => {
      try {
        const entry = await savedWordEntry(w.entry_id);
        if (!entry) return;
        const gloss =
          locale === 'dg' ? (entry.senses[0]?.definition_dg || entry.equivalents_en.join(', ')) :
          locale === 'sw' ? (entry.equivalents_sw.join(', ') || entry.equivalents_en.join(', ')) :
          entry.equivalents_en.join(', ');
        resolved[`word:${w.entry_id}`] = gloss;
        current[w.entry_id] = entry.headword.replace(/[\d;]+$/, '');
      } catch {}
    });

    const fetchProverbs = proverbs.length > 0
      // Through the loader, so a favourited community proverb (not folded in yet) still has its gloss.
      ? loadProverbs()
          .then((list) => list as unknown as ProverbIndex[])
          .then((all: ProverbIndex[]) => {
            for (const p of proverbs) {
              const match = all.find((a) => a.slug === p.entry_id);
              if (match) {
                const gloss =
                  locale === 'dg' ? (match.commentary_dg || match.idiomatic_en) :
                  locale === 'sw' ? (match.idiomatic_sw || match.swahili || match.idiomatic_en) :
                  match.idiomatic_en;
                resolved[`proverb:${p.entry_id}`] = gloss;
              }
            }
          })
          .catch(() => {})
      : Promise.resolve();

    Promise.all([...fetchWords, fetchProverbs]).then(() => {
      setGlosses(resolved);
      setHeadwords(current);
    });
  }, [favourites, locale]);

  if (loading) {
    return <FavouritesSkeleton />;
  }

  if (favourites.length === 0) {
    return (
      <EmptyState
        title={t.profile.no_favourites}
        description={t.profile.no_favourites_hint}
      />
    );
  }

  const hrefForFav = (fav: typeof favourites[number]) =>
    fav.entry_type === 'word'
      ? `/language/dictionary/word/${encodeURIComponent(headwords[fav.entry_id] ?? fav.entry_id)}`
      : `/language/proverbs/${encodeURIComponent(fav.entry_id)}`;

  const badgeLabel = (type: string) =>
    type === 'word'
      ? (t.dictionary?.section_title ?? 'Dictionary')
      : (t.proverbs?.title ?? 'Proverbs');

  return (
    <div className={styles.container}>
      <ul className={styles.list}>
        {favourites.map((fav) => {
          const gloss = glosses[`${fav.entry_type}:${fav.entry_id}`];
          return (
            <li key={fav.id} className={styles.item}>
              <Link
                href={hrefForFav(fav)}
                className={styles.itemLink}
                onClick={() => track('orientation', 'favourites', 'item_click', { entry_type: fav.entry_type, entry_id: fav.entry_id })}
              >
                <div className={styles.itemTop}>
                  <span className={styles.itemLabel}>{fav.entry_type === 'word' ? headwords[fav.entry_id] ?? fav.entry_label : fav.entry_label}</span>
                  <Badge>{badgeLabel(fav.entry_type)}</Badge>
                </div>
                {gloss && (
                  <span className={styles.itemGloss}>{gloss}</span>
                )}
              </Link>
              <AppFavouriteButton
                entryType={fav.entry_type}
                entryId={fav.entry_id}
                entryLabel={fav.entry_label}
                journey={fav.entry_type === 'word' ? 'dictionary' : 'proverbs'}
                size="sm"
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
