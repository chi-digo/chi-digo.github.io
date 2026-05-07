'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

import { useLocale, useTranslations } from '@/lib/i18n/context';
import { locales, type Locale } from '@/lib/i18n/config';
import styles from './NavBar.module.css';

function VigangoMark() {
  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden="true"
      className={styles.mark}
      xmlns="http://www.w3.org/2000/svg"
    >
      <g fill="currentColor">
        <circle cx="16" cy="9" r="4" />
        <rect
          x="13"
          y="15"
          width="6"
          height="14"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
        />
        <polygon points="13,15 19,15 16,22" />
        <polygon points="13,29 19,29 16,22" />
      </g>
    </svg>
  );
}

export function NavBar() {
  const { locale, setLocale } = useLocale();
  const t = useTranslations();

  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(e: PointerEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  const handleFocusOut = useCallback(
    (e: React.FocusEvent<HTMLDivElement>) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.relatedTarget as Node)
      ) {
        setOpen(false);
      }
    },
    [],
  );

  const handleMenuKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLUListElement>) => {
      const items = menuRef.current?.querySelectorAll<HTMLLIElement>(
        '[role="menuitemradio"]',
      );
      if (!items || items.length === 0) return;

      const currentIndex = Array.from(items).findIndex(
        (item) => item === document.activeElement,
      );

      switch (e.key) {
        case 'ArrowDown': {
          e.preventDefault();
          const next = (currentIndex + 1) % items.length;
          items[next].focus();
          break;
        }
        case 'ArrowUp': {
          e.preventDefault();
          const prev = (currentIndex - 1 + items.length) % items.length;
          items[prev].focus();
          break;
        }
        case 'Home': {
          e.preventDefault();
          items[0].focus();
          break;
        }
        case 'End': {
          e.preventDefault();
          items[items.length - 1].focus();
          break;
        }
      }
    },
    [],
  );

  useEffect(() => {
    if (open && menuRef.current) {
      const firstItem = menuRef.current.querySelector<HTMLLIElement>(
        '[role="menuitemradio"]',
      );
      firstItem?.focus();
    }
  }, [open]);

  const handleSelect = useCallback(
    (newLocale: Locale) => {
      setLocale(newLocale);
      setOpen(false);
      buttonRef.current?.focus();
    },
    [setLocale],
  );

  const currentConfig = locales.find((l) => l.code === locale)!;

  return (
    <nav
      className={styles.navbar}
      aria-label="Site navigation"
    >
      <a href="/" className={styles.homeLink} aria-label="Chi-digo home">
        <VigangoMark />
      </a>

      <a href="/" className={styles.navLink}>
        {t.nav.home_link}
      </a>
      <a href="/history" className={styles.navLink}>
        {t.nav.history_link}
      </a>
      <a href="/culture" className={styles.navLink}>
        {t.nav.culture_link}
      </a>
      <a href="/dictionary" className={styles.navLink}>
        {t.nav.dictionary_link}
      </a>

      <div className={styles.centre} />

      <div className={styles.selector} ref={dropdownRef} onBlur={handleFocusOut}>
        <button
          ref={buttonRef}
          type="button"
          className={styles.selectorButton}
          onClick={() => setOpen((prev) => !prev)}
          aria-haspopup="true"
          aria-expanded={open}
          aria-label={t.nav.language_selector_label}
        >
          {currentConfig.name}
          <span className={styles.selectorChevron} aria-hidden="true">
            ▾
          </span>
        </button>

        {open && (
          <ul
            ref={menuRef}
            role="menu"
            aria-label={t.nav.language_selector_label}
            className={styles.dropdown}
            onKeyDown={handleMenuKeyDown}
          >
            {locales.map((loc) => (
              <li
                key={loc.code}
                role="menuitemradio"
                aria-checked={loc.code === locale}
                tabIndex={-1}
                className={`${styles.dropdownItem} ${loc.code === locale ? styles.dropdownItemActive : ''}`}
                onClick={() => handleSelect(loc.code)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSelect(loc.code);
                  }
                }}
              >
                <span className={styles.checkMark} aria-hidden="true">
                  {loc.code === locale ? '✓' : ''}
                </span>
                {loc.name}
              </li>
            ))}
          </ul>
        )}
      </div>
    </nav>
  );
}
