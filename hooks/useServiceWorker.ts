'use client';

import { useEffect, useState, useCallback } from 'react';

export function useServiceWorker() {
  const [updateAvailable, setUpdateAvailable] = useState(false);

  const dismissUpdate = useCallback(() => setUpdateAvailable(false), []);

  const applyUpdate = useCallback(() => {
    setUpdateAvailable(false);
    window.location.reload();
  }, []);

  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      !('serviceWorker' in navigator) ||
      process.env.NODE_ENV !== 'production'
    ) return;

    // Served by app/serwist/[path]/route.ts (Service-Worker-Allowed: /).
    navigator.serviceWorker
      .register('/serwist/sw.js', { scope: '/', updateViaCache: 'none' })
      .catch((err) => console.error('[sw] registration failed', err));

    let refreshing = false;
    const onControllerChange = () => {
      if (refreshing) return;
      refreshing = true;
    };
    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);

    const onMessage = (event: MessageEvent) => {
      if (event.data?.type === 'DATA_UPDATED') {
        setUpdateAvailable(true);
      }
    };
    navigator.serviceWorker.addEventListener('message', onMessage);

    // Request persistent storage after SW is ready
    navigator.serviceWorker.ready.then(() => {
      navigator.storage?.persist?.();
    });

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
      navigator.serviceWorker.removeEventListener('message', onMessage);
    };
  }, []);

  return { updateAvailable, applyUpdate, dismissUpdate };
}
