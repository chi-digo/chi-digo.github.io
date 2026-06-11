'use client';

import { useEffect } from 'react';
import { isLocale, STORAGE_KEY, defaultLocale } from './config';
import type { Locale } from './config';
import { localePath, localeFromPathname } from './locale-path';

const MIGRATED_KEY = 'chidigo-locale-migrated';

export function LocaleMigration(): null {
  useEffect(() => {
    try {
      if (localStorage.getItem(MIGRATED_KEY)) return;

      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored || stored === defaultLocale || !isLocale(stored)) return;

      localStorage.setItem(MIGRATED_KEY, '1');

      const path = window.location.pathname;
      if (localeFromPathname(path) !== defaultLocale) return;

      const dest = localePath(path, stored as Locale);
      const url = dest + window.location.search + window.location.hash;
      window.location.replace(url);
    } catch { /* SSR or storage unavailable */ }
  }, []);

  return null;
}
