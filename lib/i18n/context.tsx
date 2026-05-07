'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';

import type { Locale, Messages } from './config';
import { defaultLocale, isLocale, STORAGE_KEY } from './config';

import en from './messages/en.json';
import sw from './messages/sw.json';
import dig from './messages/dig.json';

const allMessages: Record<Locale, Messages> = {
  en: en as Messages,
  sw: sw as Messages,
  dig: dig as Messages,
};

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  messages: Messages;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

function readStoredLocale(): Locale {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (isLocale(stored)) return stored;
  } catch {
    // localStorage unavailable
  }
  return defaultLocale;
}

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
}

export function LocaleProvider({ children }: LocaleProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);

  useEffect(() => {
    const stored = readStoredLocale();
    if (stored !== defaultLocale) setLocaleState(stored);
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    try {
      localStorage.setItem(STORAGE_KEY, newLocale);
    } catch {
      // Silently fail
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
