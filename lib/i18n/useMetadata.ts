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

    document.documentElement.classList.remove('lang-en', 'lang-sw', 'lang-dig');
    if (locale !== 'en') {
      document.documentElement.classList.add(`lang-${locale}`);
    }

    document.title = t.meta.title;

    function setMeta(
      attr: 'name' | 'property',
      key: string,
      content: string,
    ) {
      let el = document.querySelector(
        `meta[${attr}="${key}"]`,
      ) as HTMLMetaElement | null;

      if (el) {
        el.content = content;
      } else {
        el = document.createElement('meta');
        el.setAttribute(attr, key);
        el.content = content;
        document.head.appendChild(el);
      }
    }

    setMeta('name', 'description', t.meta.description);
  }, [locale, t]);

  return null;
}
