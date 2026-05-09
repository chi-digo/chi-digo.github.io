'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslations } from '@/lib/i18n/context';
import styles from './ShareMenu.module.css';

interface ShareMenuProps {
  onMenuOpen: () => void;
  onShareImage: () => void;
  onCopyLink: () => void;
  isGenerating: boolean;
  /** For proverbs: show language toggle */
  proverbLangToggle?: {
    lang: 'dg' | 'sw';
    onToggle: (lang: 'dg' | 'sw') => void;
  };
  /** For multi-sense dictionary words: show sense picker */
  sensePicker?: {
    count: number;
    selected: number;
    onSelect: (index: number) => void;
    getLabel: (index: number) => string;
  };
}

function ShareIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  );
}

function ImageIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

export function ShareMenu({
  onMenuOpen,
  onShareImage,
  onCopyLink,
  isGenerating,
  proverbLangToggle,
  sensePicker,
}: ShareMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const t = useTranslations();

  const open = useCallback(() => {
    setIsOpen(true);
    setCopied(false);
    onMenuOpen();
  }, [onMenuOpen]);

  const close = useCallback(() => {
    setIsOpen(false);
    setCopied(false);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        close();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen, close]);

  const handleShareImage = () => {
    onShareImage();
    close();
  };

  const handleCopyLink = () => {
    onCopyLink();
    setCopied(true);
    setTimeout(() => close(), 1200);
  };

  return (
    <div ref={menuRef} className={styles.container}>
      <button
        className={styles.trigger}
        onClick={isOpen ? close : open}
        aria-label={t.share.button_label}
        aria-expanded={isOpen}
        type="button"
      >
        <ShareIcon />
      </button>

      {isOpen && (
        <div className={styles.menu} role="menu">
          {proverbLangToggle && (
            <div className={styles.langToggle}>
              <button
                type="button"
                className={`${styles.langBtn} ${proverbLangToggle.lang === 'dg' ? styles.langActive : ''}`}
                onClick={() => proverbLangToggle.onToggle('dg')}
              >
                Chidigo
              </button>
              <button
                type="button"
                className={`${styles.langBtn} ${proverbLangToggle.lang === 'sw' ? styles.langActive : ''}`}
                onClick={() => proverbLangToggle.onToggle('sw')}
              >
                Kiswahili
              </button>
            </div>
          )}

          {sensePicker && sensePicker.count > 1 && (
            <div className={styles.sensePicker}>
              <span className={styles.senseLabel}>{t.share.meaning}</span>
              <div className={styles.sensePills} role="radiogroup" aria-label={t.share.meaning}>
                {Array.from({ length: sensePicker.count }, (_, i) => (
                  <button
                    key={i}
                    type="button"
                    role="radio"
                    aria-checked={sensePicker.selected === i}
                    className={`${styles.sensePill} ${sensePicker.selected === i ? styles.sensePillActive : ''}`}
                    onClick={() => sensePicker.onSelect(i)}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <p className={styles.sensePreview} aria-live="polite">
                {sensePicker.getLabel(sensePicker.selected)}
              </p>
            </div>
          )}

          <button
            className={styles.menuItem}
            onClick={handleShareImage}
            disabled={isGenerating}
            role="menuitem"
            type="button"
          >
            <ImageIcon />
            <span>{isGenerating ? t.share.generating : t.share.share_image}</span>
          </button>

          <button
            className={styles.menuItem}
            onClick={handleCopyLink}
            role="menuitem"
            type="button"
          >
            <LinkIcon />
            <span>{copied ? t.share.link_copied : t.share.copy_link}</span>
          </button>
        </div>
      )}
    </div>
  );
}
