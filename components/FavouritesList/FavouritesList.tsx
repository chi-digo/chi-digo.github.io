'use client';

import Link from 'next/link';
import { useTranslations } from '@/lib/i18n/context';
import { useFavourites } from '@/lib/favourites/context';
import { EmptyState, KayambaLoader } from '@chi-digo/design-system';
import { AppFavouriteButton } from '@/components/FavouriteButton/FavouriteButton';
import styles from './FavouritesList.module.css';

export function FavouritesList() {
  const t = useTranslations();
  const { favourites, loading } = useFavourites();

  if (loading) {
    return (
      <div className={styles.loading}>
        <KayambaLoader size="md" />
      </div>
    );
  }

  if (favourites.length === 0) {
    return (
      <EmptyState
        title={t.profile.no_favourites}
        description={t.profile.no_favourites_hint}
      />
    );
  }

  const words = favourites.filter((f) => f.entry_type === 'word');
  const proverbs = favourites.filter((f) => f.entry_type === 'proverb');

  return (
    <div className={styles.container}>
      {words.length > 0 && (
        <section>
          <h3 className={styles.sectionTitle}>{t.dictionary?.section_title ?? 'Dictionary'}</h3>
          <ul className={styles.list}>
            {words.map((fav) => (
              <li key={fav.id} className={styles.item}>
                <Link
                  href={`/language/dictionary/word/${encodeURIComponent(fav.entry_id)}`}
                  className={styles.itemLink}
                >
                  <span className={styles.itemLabel}>{fav.entry_label}</span>
                  {fav.entry_gloss && (
                    <span className={styles.itemGloss}>{fav.entry_gloss}</span>
                  )}
                </Link>
                <AppFavouriteButton
                  entryType="word"
                  entryId={fav.entry_id}
                  entryLabel={fav.entry_label}
                  entryGloss={fav.entry_gloss ?? undefined}
                  journey="dictionary"
                  size="sm"
                />
              </li>
            ))}
          </ul>
        </section>
      )}

      {proverbs.length > 0 && (
        <section>
          <h3 className={styles.sectionTitle}>{t.proverbs?.title ?? 'Proverbs'}</h3>
          <ul className={styles.list}>
            {proverbs.map((fav) => (
              <li key={fav.id} className={styles.item}>
                <Link
                  href={`/language/proverbs/${encodeURIComponent(fav.entry_id)}`}
                  className={styles.itemLink}
                >
                  <span className={styles.itemLabel}>{fav.entry_label}</span>
                  {fav.entry_gloss && (
                    <span className={styles.itemGloss}>{fav.entry_gloss}</span>
                  )}
                </Link>
                <AppFavouriteButton
                  entryType="proverb"
                  entryId={fav.entry_id}
                  entryLabel={fav.entry_label}
                  entryGloss={fav.entry_gloss ?? undefined}
                  journey="proverbs"
                  size="sm"
                />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
