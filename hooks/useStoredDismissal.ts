'use client';

import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};

/**
 * Whether a prompt was dismissed (a timestamp stored under `key`) within the
 * last `days`. False during server render; read from localStorage in the browser.
 */
export function useStoredDismissal(key: string, days: number): boolean {
  return useSyncExternalStore(
    subscribe,
    () => {
      try {
        const raw = localStorage.getItem(key);
        return !!raw && Date.now() - Number(raw) < days * 86_400_000;
      } catch {
        return false;
      }
    },
    () => false,
  );
}
