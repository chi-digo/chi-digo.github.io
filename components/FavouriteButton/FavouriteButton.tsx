'use client';

import { useRouter } from 'next/navigation';
import { FavouriteButton as FavouriteButtonPrimitive } from '@chi-digo/design-system';
import { useAuth } from '@/lib/auth/context';
import { useFavourites } from '@/lib/favourites/context';
import { useTranslations } from '@/lib/i18n/context';
import { track } from '@/lib/analytics/track';
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
  const router = useRouter();
  const t = useTranslations();

  const filled = isFavourite(entryType, entryId);

  const handleToggle = () => {
    if (!user) {
      router.push(`/sign-in?returnTo=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    const action = filled ? 'favourite_remove' : 'favourite_add';
    track(journey, entryType, action, { entry_id: entryId, entry_label: entryLabel });
    toggleFavourite(entryType, entryId, entryLabel, entryGloss);
  };

  return (
    <FavouriteButtonPrimitive
      filled={filled}
      onToggle={handleToggle}
      label={t.profile.favourites}
      size={size}
    />
  );
}
