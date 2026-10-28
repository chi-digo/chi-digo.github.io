'use client';

import { useState, useCallback } from 'react';
import { FavouriteButton as FavouriteButtonPrimitive } from '@chi-digo/design-system';
import { useAuth } from '@/lib/auth/context';
import { useFavourites } from '@/lib/favourites/context';
import { useTranslations } from '@/lib/i18n/context';
import { track } from '@/lib/analytics/track';
import { SignInSheet } from '@/components/SignInSheet/SignInSheet';
import type { Journey } from '@/lib/analytics/track';

interface AppFavouriteButtonProps {
  entryType: 'word' | 'proverb';
  entryId: string;
  entryLabel: string;
  journey: Journey;
  size?: 'sm' | 'md' | 'lg';
  inverted?: boolean;
  /** Other ids this same item was saved under: a word's former headwords no other word has (spec 34 §18.6). */
  aliases?: string[];
}

export function AppFavouriteButton({
  entryType,
  entryId,
  entryLabel,
  journey,
  size = 'md',
  inverted,
  aliases,
}: AppFavouriteButtonProps) {
  const { user } = useAuth();
  const { isFavourite, toggleFavourite } = useFavourites();
  const t = useTranslations();
  const [sheetOpen, setSheetOpen] = useState(false);

  // Saved under the current id or one the word gave up: filled, and removing it removes the saved one.
  const savedAs = [entryId, ...(aliases ?? [])].find((id) => isFavourite(entryType, id));
  const filled = !!savedAs;

  const handleToggle = useCallback(() => {
    if (!user) {
      track(journey, 'auth', 'sign_in_sheet_open', { source: 'favourite', entry_type: entryType, entry_id: entryId });
      setSheetOpen(true);
      return;
    }

    const action = filled ? 'favourite_remove' : 'favourite_add';
    track(journey, entryType, action, { entry_id: entryId, entry_label: entryLabel });
    toggleFavourite(entryType, savedAs ?? entryId, entryLabel);
  }, [user, filled, savedAs, journey, entryType, entryId, entryLabel, toggleFavourite]);

  return (
    <>
      <FavouriteButtonPrimitive
        filled={filled}
        onToggle={handleToggle}
        label={t.profile.favourites}
        size={size}
        style={inverted && !filled ? { color: 'rgba(255,255,255,0.7)' } : undefined}
      />
      <SignInSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </>
  );
}
