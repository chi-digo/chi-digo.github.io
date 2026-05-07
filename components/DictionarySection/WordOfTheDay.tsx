'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from '@/lib/i18n/context';
import { loadEntriesByHeadword } from '@/lib/dictionary/loader';
import { POS_ABBREVIATIONS } from '@/lib/constants';
import type { DictionaryEntry } from '@/lib/dictionary/types';
import styles from './DictionarySection.module.css';

const CURATED_WORDS = [
  'mnazi', 'moyo', 'baraka', 'pembe', 'mbuzi', 'ngano', 'dzino', 'makuti',
  'mutu', 'kuku', 'damu', 'mviringo', 'phanga', 'unga', 'chapati',
  'mkpwono', 'tsongo', 'gulu', 'simba', 'tembo', 'ngalawa', 'meli',
  'kazi', 'fungu', 'tanga', 'shule', 'msikiti', 'sindano', 'pingu',
  'nguwo', 'dzuwa', 'luga', 'nyuni', 'matso', 'mgongo', 'baba',
  'mwana', 'bibi', 'ndugu', 'munda', 'mudzi', 'nyama', 'nazi',
  'hando', 'sengenya', 'muhi', 'chirimo', 'kusi', 'laga', 'hepa',
  'henda', 'rima', 'risa', 'dzenga',
];

function getWordForDate(): string {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  return CURATED_WORDS[dayOfYear % CURATED_WORDS.length];
}

export function WordOfTheDayCard({ onWordClick }: { onWordClick: (word: string) => void }) {
  const t = useTranslations();
  const [entry, setEntry] = useState<DictionaryEntry | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const word = getWordForDate();

    loadEntriesByHeadword(word).then((entries) => {
      if (cancelled) return;
      setEntry(entries[0] ?? null);
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className={styles.wotdCard}>
        <p className={styles.wotdLabel}>{t.dictionary.featured_word}</p>
        <p className={styles.wotdLoading}>{t.dictionary.searching}</p>
      </div>
    );
  }

  if (!entry) return null;

  const firstDef = entry.senses[0];

  return (
    <div className={styles.wotdCard}>
      <p className={styles.wotdLabel}>{t.dictionary.featured_word}</p>
      <p className={styles.wotdHeadword}>{entry.headword}</p>
      {entry.ipa && <p className={styles.wotdIpa}>/{entry.ipa}/</p>}
      <span className={styles.wotdPos}>
        {POS_ABBREVIATIONS[entry.pos] || entry.pos_en}
      </span>
      {firstDef?.definition_dg && (
        <p className={styles.wotdDef}>{firstDef.definition_dg}</p>
      )}
      {firstDef?.definition_en && (
        <p className={styles.wotdDefEn}>{firstDef.definition_en}</p>
      )}
      <button
        type="button"
        className={styles.wotdButton}
        onClick={() => onWordClick(entry.headword)}
      >
        {t.dictionary.see_also} →
      </button>
    </div>
  );
}
