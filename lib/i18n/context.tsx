'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';

import type { Locale, Messages } from './config';
import { defaultLocale, isLocale, STORAGE_KEY } from './config';
import { localePath, pathnameWithoutLocale } from './locale-path';

import en from './messages/en.json';
import sw from './messages/sw.json';
import dg from './messages/dg.json';

const allMessages: Record<Locale, Messages> = {
  en: en as Messages,
  sw: sw as Messages,
  dg: dg as Messages,
};

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  messages: Messages;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

function createFallbackMessages(locale: Locale): Messages {
  if (locale === 'en') return allMessages.en;

  const target = allMessages[locale];
  const fallback = allMessages.en;

  const result = {} as Record<string, Record<string, string>>;

  for (const section of Object.keys(fallback) as Array<keyof Messages>) {
    const targetSection = target[section] as Record<string, string>;
    const fallbackSection = fallback[section] as Record<string, string>;

    result[section] = new Proxy(targetSection, {
      get(obj, prop: string | symbol, receiver) {
        if (typeof prop === 'symbol') return Reflect.get(obj, prop, receiver);
        const value = obj[prop];
        if (value !== undefined && value !== '') return value;
        return fallbackSection[prop];
      },
    });
  }

  return result as unknown as Messages;
}

interface LocaleProviderProps {
  children: ReactNode;
  initialLocale?: Locale;
}

export function LocaleProvider({ children, initialLocale }: LocaleProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale ?? defaultLocale);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);

    try {
      localStorage.setItem(STORAGE_KEY, newLocale);
    } catch {
      // Silently fail
    }

    // Update URL to reflect the new locale without a server round-trip
    if (typeof window !== 'undefined') {
      const bare = pathnameWithoutLocale(window.location.pathname);
      const newPath = localePath(bare, newLocale);
      const newUrl = newPath + window.location.search + window.location.hash;
      window.history.replaceState(null, '', newUrl);
    }
  }, []);

  const messages = useMemo(() => createFallbackMessages(locale), [locale]);

  const value = useMemo<LocaleContextValue>(
    () => ({ locale, setLocale, messages }),
    [locale, setLocale, messages],
  );

  return (
    <LocaleContext.Provider value={value}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale(): { locale: Locale; setLocale: (l: Locale) => void } {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error('useLocale must be used within LocaleProvider');
  return { locale: ctx.locale, setLocale: ctx.setLocale };
}

export function useTranslations(): Messages {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error('useTranslations must be used within LocaleProvider');
  return ctx.messages;
}
