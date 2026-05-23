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
  entryGloss?: string;
  journey: Journey;
  size?: 'sm' | 'md' | 'lg';
}

export function AppFavouriteButton({
  entryType,
  entryId,
  entryLabel,
  entryGloss,
  journey,
  size = 'md',
}: AppFavouriteButtonProps) {
  const { user } = useAuth();
  const { isFavourite, toggleFavourite } = useFavourites();
  const t = useTranslations();
  const [sheetOpen, setSheetOpen] = useState(false);

  const filled = isFavourite(entryType, entryId);

  const handleToggle = useCallback(() => {
    if (!user) {
      track(journey, 'auth', 'sheet_open', { entry_type: entryType, entry_id: entryId });
      setSheetOpen(true);
      return;
    }

    const action = filled ? 'favourite_remove' : 'favourite_add';
    track(journey, entryType, action, { entry_id: entryId, entry_label: entryLabel });
    toggleFavourite(entryType, entryId, entryLabel, entryGloss);
  }, [user, filled, journey, entryType, entryId, entryLabel, entryGloss, toggleFavourite]);

  return (
    <>
      <FavouriteButtonPrimitive
        filled={filled}
        onToggle={handleToggle}
        label={t.profile.favourites}
        size={size}
      />
      <SignInSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </>
  );
}
