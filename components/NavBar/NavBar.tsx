'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';

import { SearchCombobox } from '@/components/SearchCombobox';
import { useLocale, useTranslations } from '@/lib/i18n/context';
import { locales, type Locale } from '@/lib/i18n/config';
import { TrackedLink } from '@/components/Analytics/TrackedLink';
import { trackLocaleSwitch } from '@/lib/analytics/track';
import { track } from '@/lib/analytics/track';
import { useUniversalSearch, buildSearchGroups, SearchIcon } from '@/hooks/useUniversalSearch';
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
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const hamburgerRef = useRef<HTMLButtonElement>(null);
  const searchBtnRef = useRef<HTMLButtonElement>(null);

  const { query, setQuery, results, loading } = useUniversalSearch(locale);
  const searchGroups = buildSearchGroups(results, locale, query);

  const closeSearch = useCallback(() => {
    setMobileSearchOpen(false);
    setQuery('');
    searchBtnRef.current?.focus();
  }, [setQuery]);

  const handleSearchSelect = useCallback((href: string) => {
    router.push(href);
    closeSearch();
    track('orientation', 'search', 'select_result', { href });
  }, [router, closeSearch]);

  const handleSearchSubmit = useCallback((q: string) => {
    router.push(`/search?q=${encodeURIComponent(q)}`);
    closeSearch();
    track('orientation', 'search', 'submit', { query: q });
  }, [router, closeSearch]);

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
    if (!mobileOpen) return;

    function handlePointerDown(e: PointerEvent) {
      const target = e.target as Node;
      if (
        drawerRef.current &&
        !drawerRef.current.contains(target) &&
        !hamburgerRef.current?.contains(target)
      ) {
        setMobileOpen(false);
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [mobileOpen]);

  useEffect(() => {
    if (!open && !mobileOpen && !mobileSearchOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (mobileSearchOpen) {
          closeSearch();
          return;
        }
        if (open) {
          setOpen(false);
          buttonRef.current?.focus();
        }
        if (mobileOpen) {
          setMobileOpen(false);
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, mobileOpen, mobileSearchOpen, closeSearch]);

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
    (newLocale: Locale, source: string) => {
      if (newLocale !== locale) {
        trackLocaleSwitch(locale, newLocale, source);
      }
      setLocale(newLocale);
      setOpen(false);
      buttonRef.current?.focus();
    },
    [setLocale, locale],
  );

  const currentConfig = locales.find((l) => l.code === locale)!;
  const pathname = usePathname();

  function linkClass(href: string, mobile?: boolean) {
    const active =
      href === '/'
        ? pathname === '/'
        : pathname.startsWith(href);
    const base = mobile ? styles.drawerLink : styles.navLink;
    const activeClass = mobile ? styles.drawerLinkActive : styles.navLinkActive;
    return active ? `${base} ${activeClass}` : base;
  }

  return (
    <nav
      className={styles.navbar}
      aria-label="Site navigation"
    >
      <Link href="/" className={styles.homeLink} aria-label="Chi-digo home">
        <VigangoMark />
      </Link>

      <div className={styles.desktopLinks}>
        <TrackedLink href="/" source="navbar" className={linkClass('/')}>
          {t.nav.home_link}
        </TrackedLink>
        <TrackedLink href="/history" source="navbar" className={linkClass('/history')}>
          {t.nav.history_link}
        </TrackedLink>
        <TrackedLink href="/culture" source="navbar" className={linkClass('/culture')}>
          {t.nav.culture_link}
        </TrackedLink>
        <TrackedLink href="/language" source="navbar" className={linkClass('/language')}>
          {t.nav.language_link}
        </TrackedLink>
      </div>

      <div className={styles.centre} />

      {/* Search icon button (mobile only, hidden on desktop via CSS) */}
      <button
        ref={searchBtnRef}
        type="button"
        className={styles.searchBtn}
        onClick={() => {
          if (mobileSearchOpen) return;
          setMobileSearchOpen(true);
          setMobileOpen(false);
          track('orientation', 'search', 'open', { device: 'mobile' });
        }}
        aria-label={locale === 'sw' ? 'Tafuta' : locale === 'dig' ? 'Tafuta' : 'Search'}
      >
        <SearchIcon className={styles.searchIcon} />
      </button>

      <div className={`${styles.selector} ${styles.desktopOnly}`} ref={dropdownRef} onBlur={handleFocusOut}>
        <button
          ref={buttonRef}
          type="button"
          className={styles.selectorButton}
          onClick={() => setOpen((prev) => !prev)}
          aria-haspopup="true"
          aria-expanded={open}
          aria-label={t.nav.language_selector_label}
        >
          <span className={styles.selectorLabel}>{currentConfig.shortName}</span>
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
                onClick={() => handleSelect(loc.code, 'navbar_desktop')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSelect(loc.code, 'navbar_desktop');
                  }
                }}
              >
                <span className={styles.checkMark} aria-hidden="true">
                  {loc.code === locale ? '✓' : ''}
                </span>
                {loc.shortName}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Mobile hamburger */}
      <button
        ref={hamburgerRef}
        type="button"
        className={styles.hamburger}
        onClick={() => {
          const next = !mobileOpen;
          setMobileOpen(next);
          track('orientation', 'navbar', next ? 'menu_open' : 'menu_close', { device: 'mobile' });
        }}
        aria-expanded={mobileOpen}
        aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
      >
        <span className={`${styles.hamburgerBar} ${mobileOpen ? styles.hamburgerBarTop : ''}`} />
        <span className={`${styles.hamburgerBar} ${mobileOpen ? styles.hamburgerBarMid : ''}`} />
        <span className={`${styles.hamburgerBar} ${mobileOpen ? styles.hamburgerBarBot : ''}`} />
      </button>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className={styles.drawer} ref={drawerRef}>
          <TrackedLink href="/" source="navbar_mobile" className={linkClass('/', true)} onClick={() => setMobileOpen(false)}>
            {t.nav.home_link}
          </TrackedLink>
          <TrackedLink href="/history" source="navbar_mobile" className={linkClass('/history', true)} onClick={() => setMobileOpen(false)}>
            {t.nav.history_link}
          </TrackedLink>
          <TrackedLink href="/culture" source="navbar_mobile" className={linkClass('/culture', true)} onClick={() => setMobileOpen(false)}>
            {t.nav.culture_link}
          </TrackedLink>
          <TrackedLink href="/language" source="navbar_mobile" className={linkClass('/language', true)} onClick={() => setMobileOpen(false)}>
            {t.nav.language_link}
          </TrackedLink>

          <div className={styles.drawerDivider} />

          <div className={styles.drawerLocale}>
            {locales.map((loc) => (
              <button
                key={loc.code}
                type="button"
                className={`${styles.drawerLocaleBtn} ${loc.code === locale ? styles.drawerLocaleBtnActive : ''}`}
                onClick={() => {
                  if (loc.code !== locale) {
                    trackLocaleSwitch(locale, loc.code, 'navbar_mobile');
                  }
                  setLocale(loc.code);
                  setMobileOpen(false);
                }}
                aria-label={loc.name}
              >
                {loc.shortName}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Mobile full-screen search overlay */}
      {mobileSearchOpen && (
        <div className={styles.mobileSearchOverlay}>
          <div className={styles.mobileSearchHeader}>
            <SearchCombobox
              value={query}
              onChange={setQuery}
              groups={searchGroups}
              loading={loading}
              onSelect={handleSearchSelect}
              onSubmit={handleSearchSubmit}
              autoFocus
              placeholder={
                locale === 'sw' ? 'Tafuta…'
                  : locale === 'dig' ? 'Tafuta…'
                    : 'Search…'
              }
              emptyState={
                query.trim().length >= 2 ? (
                  <p style={{ textAlign: 'center', color: 'var(--fg-muted)', fontSize: '0.85rem', margin: 0 }}>
                    {locale === 'sw' ? 'Hakuna matokeo' : locale === 'dig' ? 'Takuna matokeo' : 'No results found'}
                  </p>
                ) : undefined
              }
            />
            <button
              type="button"
              className={styles.mobileSearchClose}
              onClick={closeSearch}
              aria-label="Close search"
            >
              {locale === 'sw' ? 'Ghairi' : locale === 'dig' ? 'Ghairi' : 'Cancel'}
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
