'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import type { Proverb } from '@/lib/proverbs/types';
import type { DictionaryEntry } from '@/lib/dictionary/types';
import type { Locale } from '@/lib/i18n/config';
import { renderProverbCard, renderWordCard, renderProverbCardSync } from '@/lib/sharing/canvas';
import { shareImage, copyToClipboard, type ShareResult } from '@/lib/sharing/share';
import { trackShare } from '@/lib/analytics/track';

export function useShareCard() {
  const [isGenerating, setIsGenerating] = useState(false);
  const mountedRef = useRef(true);
  const blobRef = useRef<Blob | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const prerenderProverb = useCallback(async (proverb: Proverb, lang: 'dg' | 'sw' = 'dg') => {
    setIsGenerating(true);
    try {
      blobRef.current = await renderProverbCard(proverb, lang);
    } catch {
      blobRef.current = null;
    } finally {
      if (mountedRef.current) setIsGenerating(false);
    }
  }, []);

  const prerenderWord = useCallback(async (entry: DictionaryEntry, locale: Locale) => {
    setIsGenerating(true);
    try {
      blobRef.current = await renderWordCard(entry, locale);
    } catch {
      blobRef.current = null;
    } finally {
      if (mountedRef.current) setIsGenerating(false);
    }
  }, []);

  const sharePrerendered = useCallback(async (
    contentType: 'proverb' | 'word',
    contentId: string,
    title: string,
    text: string,
    url: string
  ): Promise<ShareResult> => {
    const blob = blobRef.current;
    if (!blob) return 'cancelled';
    blobRef.current = null;
    const result = await shareImage(blob, `chidigo-${contentType}.png`, title, text, url);
    trackShare(contentType, result);
    return result;
  }, []);

  const shareProverbDirect = useCallback(async (
    proverb: Proverb,
    lang: 'dg' | 'sw' = 'dg'
  ): Promise<ShareResult> => {
    setIsGenerating(true);
    try {
      const blob = await renderProverbCard(proverb, lang);
      const url = `https://chidigo.org/language/proverbs/${encodeURIComponent(proverb.slug || proverb.digo)}`;
      const result = await shareImage(
        blob,
        'chidigo-proverb.png',
        'Chidigo',
        proverb.digo,
        url
      );
      trackShare('proverb', result);
      return result;
    } catch {
      trackShare('proverb', 'cancelled');
      return 'cancelled';
    } finally {
      if (mountedRef.current) setIsGenerating(false);
    }
  }, []);

  const shareWordDirect = useCallback(async (
    entry: DictionaryEntry,
    locale: Locale
  ): Promise<ShareResult> => {
    setIsGenerating(true);
    try {
      const blob = await renderWordCard(entry, locale);
      const url = `https://chidigo.org/language/dictionary/word/${encodeURIComponent(entry.headword)}`;
      const result = await shareImage(
        blob,
        `chidigo-${entry.headword}.png`,
        `Chidigo: ${entry.headword}`,
        entry.headword,
        url
      );
      trackShare('word', result);
      return result;
    } catch {
      trackShare('word', 'cancelled');
      return 'cancelled';
    } finally {
      if (mountedRef.current) setIsGenerating(false);
    }
  }, []);

  const copyLink = useCallback(async (url: string) => {
    const ok = await copyToClipboard(url);
    return ok;
  }, []);

  return {
    prerenderProverb,
    prerenderWord,
    sharePrerendered,
    shareProverbDirect,
    shareWordDirect,
    copyLink,
    isGenerating,
    hasPrenderedBlob: () => blobRef.current !== null,
  };
}
