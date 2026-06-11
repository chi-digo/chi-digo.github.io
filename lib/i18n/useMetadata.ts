'use client';

import { useEffect } from 'react';
import { useLocale, useTranslations } from './context';
import { getLocaleConfig } from './config';

export function MetadataUpdater(): null {
  const { locale } = useLocale();
  const t = useTranslations();

  useEffect(() => {
    const config = getLocaleConfig(locale);
    document.documentElement.lang = config.htmlLang;
    document.documentElement.classList.remove('lang-en', 'lang-sw', 'lang-dg');
    if (locale !== 'en') {
      document.documentElement.classList.add(`lang-${locale}`);
    }
    document.title = t.meta.title;
  }, [locale, t]);

  return null;
}
