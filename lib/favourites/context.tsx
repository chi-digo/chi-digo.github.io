'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/lib/auth/context';
import { track } from '@/lib/analytics/track';

interface Favourite {
  id: string;
  entry_type: 'word' | 'proverb';
  entry_id: string;
  entry_label: string;
}

interface FavouritesContextValue {
  favourites: Favourite[];
  loading: boolean;
  isFavourite: (type: string, id: string) => boolean;
  toggleFavourite: (type: 'word' | 'proverb', id: string, label: string) => Promise<void>;
}

const FavouritesContext = createContext<FavouritesContextValue>({
  favourites: [],
  loading: true,
  isFavourite: () => false,
  toggleFavourite: async () => {},
});

const MAX_RETRIES = 3;

export function FavouritesProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [favourites, setFavourites] = useState<Favourite[]>([]);
  const [loading, setLoading] = useState(true);
  const pendingRef = useRef<Map<string, { retries: number; payload: Omit<Favourite, 'id'> }>>(new Map());

  useEffect(() => {
    if (!user) {
      setFavourites([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    fetch('/api/favourites')
      .then((res) => res.ok ? res.json() : [])
      .then((data: Favourite[]) => setFavourites(data))
      .catch(() => setFavourites([]))
      .finally(() => setLoading(false));
  }, [user]);

  const isFavourite = useCallback(
    (type: string, id: string) => favourites.some((f) => f.entry_type === type && f.entry_id === id),
    [favourites],
  );

  const toggleFavourite = useCallback(
    async (type: 'word' | 'proverb', id: string, label: string) => {
      const existing = favourites.find((f) => f.entry_type === type && f.entry_id === id);
      const key = `${type}:${id}`;

      if (existing) {
        setFavourites((prev) => prev.filter((f) => f.id !== existing.id));
        try {
          const res = await fetch(`/api/favourites/${existing.id}`, { method: 'DELETE' });
          if (!res.ok) {
            track('orientation', 'favourites', 'remove_error', { entry_type: type, entry_id: id });
            setFavourites((prev) => [...prev, existing]);
          }
        } catch {
          track('orientation', 'favourites', 'remove_error', { entry_type: type, entry_id: id });
          setFavourites((prev) => [...prev, existing]);
        }
      } else {
        const optimistic: Favourite = {
          id: `pending-${key}`,
          entry_type: type,
          entry_id: id,
          entry_label: label,
        };
        setFavourites((prev) => [optimistic, ...prev]);

        const payload = { entry_type: type, entry_id: id, entry_label: label };

        const attempt = async (retries: number): Promise<void> => {
          try {
            const res = await fetch('/api/favourites', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            });
            if (res.ok) {
              const created: Favourite = await res.json();
              setFavourites((prev) =>
                prev.map((f) => (f.id === optimistic.id ? created : f)),
              );
              pendingRef.current.delete(key);
            } else if (res.status === 409) {
              pendingRef.current.delete(key);
            } else if (retries < MAX_RETRIES) {
              pendingRef.current.set(key, { retries: retries + 1, payload });
            } else {
              track('orientation', 'favourites', 'add_error', { entry_type: type, entry_id: id, retries });
              setFavourites((prev) => prev.filter((f) => f.id !== optimistic.id));
              pendingRef.current.delete(key);
            }
          } catch {
            if (retries < MAX_RETRIES) {
              pendingRef.current.set(key, { retries: retries + 1, payload });
            } else {
              track('orientation', 'favourites', 'add_error', { entry_type: type, entry_id: id, retries });
              setFavourites((prev) => prev.filter((f) => f.id !== optimistic.id));
              pendingRef.current.delete(key);
            }
          }
        };

        await attempt(0);
      }
    },
    [favourites],
  );

  useEffect(() => {
    function retryPending() {
      pendingRef.current.forEach(async (entry, key) => {
        const [type, id] = key.split(':') as ['word' | 'proverb', string];
        try {
          const res = await fetch('/api/favourites', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(entry.payload),
          });
          if (res.ok) {
            const created: Favourite = await res.json();
            setFavourites((prev) =>
              prev.map((f) => (f.id === `pending-${key}` ? created : f)),
            );
            pendingRef.current.delete(key);
          } else if (res.status === 409) {
            pendingRef.current.delete(key);
          } else if (entry.retries >= MAX_RETRIES) {
            setFavourites((prev) => prev.filter((f) => f.id !== `pending-${type}:${id}`));
            pendingRef.current.delete(key);
          } else {
            entry.retries++;
          }
        } catch {
          if (entry.retries >= MAX_RETRIES) {
            setFavourites((prev) => prev.filter((f) => f.id !== `pending-${key}`));
            pendingRef.current.delete(key);
          } else {
            entry.retries++;
          }
        }
      });
    }

    window.addEventListener('focus', retryPending);
    return () => window.removeEventListener('focus', retryPending);
  }, []);

  return (
    <FavouritesContext.Provider value={{ favourites, loading, isFavourite, toggleFavourite }}>
      {children}
    </FavouritesContext.Provider>
  );
}

export const useFavourites = () => useContext(FavouritesContext);
