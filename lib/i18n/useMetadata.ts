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
    setMeta('property', 'og:title', t.meta.og_title);
    setMeta('property', 'og:description', t.meta.og_description);
    setMeta('property', 'og:locale', t.meta.og_locale);
    setMeta('name', 'twitter:title', t.meta.twitter_title);
    setMeta('name', 'twitter:description', t.meta.twitter_description);
  }, [locale, t]);

  return null;
}
