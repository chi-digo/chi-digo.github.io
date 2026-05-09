'use client';

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  forwardRef,
  type ReactNode,
  type KeyboardEvent,
} from 'react';
import styles from './SearchCombobox.module.css';

export interface ResultItem {
  id: string;
  href: string;
  node: ReactNode;
}

export interface ResultGroup {
  key: string;
  label: string;
  count: number;
  results: ResultItem[];
  seeAllHref?: string;
  seeAllLabel?: string;
}

export interface SelectMeta {
  group: string;
  seeAll: boolean;
}

export interface SearchComboboxProps {
  value: string;
  onChange: (value: string) => void;
  groups: ResultGroup[];
  loading?: boolean;
  onSelect: (href: string, meta: SelectMeta) => void;
  onSubmit?: (query: string) => void;
  placeholder?: string;
  emptyState?: ReactNode;
  autoFocus?: boolean;
}

export const SearchCombobox = forwardRef<HTMLInputElement, SearchComboboxProps>(
  function SearchCombobox(
    { value, onChange, groups, loading, onSelect, onSubmit, placeholder, emptyState, autoFocus },
    ref,
  ) {
    const [open, setOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const containerRef = useRef<HTMLDivElement>(null);
    const listboxRef = useRef<HTMLDivElement>(null);
    const internalRef = useRef<HTMLInputElement>(null);
    const inputRef = (ref as React.RefObject<HTMLInputElement>) ?? internalRef;

    const allItems = groups.flatMap((g) => g.results);
    const hasResults = allItems.length > 0;
    const showDropdown = open && value.trim().length >= 2;

    useEffect(() => {
      setActiveIndex(-1);
    }, [value]);

    useEffect(() => {
      if (!open) return;
      function handlePointerDown(e: PointerEvent) {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          setOpen(false);
        }
      }
      document.addEventListener('pointerdown', handlePointerDown);
      return () => document.removeEventListener('pointerdown', handlePointerDown);
    }, [open]);

    const findGroupForIndex = useCallback(
      (index: number): string => {
        let offset = 0;
        for (const g of groups) {
          if (index < offset + g.results.length) return g.key;
          offset += g.results.length;
        }
        return '';
      },
      [groups],
    );

    const handleKeyDown = useCallback(
      (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setActiveIndex((i) => Math.min(i + 1, allItems.length - 1));
          setOpen(true);
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setActiveIndex((i) => Math.max(i - 1, -1));
        } else if (e.key === 'Enter') {
          e.preventDefault();
          if (activeIndex >= 0 && activeIndex < allItems.length) {
            onSelect(allItems[activeIndex].href, { group: findGroupForIndex(activeIndex), seeAll: false });
            setOpen(false);
          } else if (onSubmit && value.trim()) {
            onSubmit(value.trim());
            setOpen(false);
          }
        } else if (e.key === 'Escape') {
          setOpen(false);
          inputRef.current?.blur();
        }
      },
      [activeIndex, allItems, onSelect, onSubmit, value, inputRef, findGroupForIndex],
    );

    useEffect(() => {
      if (activeIndex < 0 || !listboxRef.current) return;
      const active = listboxRef.current.querySelector(`[data-index="${activeIndex}"]`);
      active?.scrollIntoView({ block: 'nearest' });
    }, [activeIndex]);

    return (
      <div ref={containerRef} className={styles.wrapper}>
        <div className={styles.inputWrapper}>
          <svg
            className={styles.icon}
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <circle cx="8.5" cy="8.5" r="5.5" />
            <line x1="12.5" y1="12.5" x2="17" y2="17" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded={showDropdown && hasResults}
            aria-autocomplete="list"
            aria-controls="search-listbox"
            aria-activedescendant={activeIndex >= 0 ? `search-option-${activeIndex}` : undefined}
            className={styles.input}
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            autoFocus={autoFocus}
          />
          {loading && <span className={styles.spinner} aria-hidden="true" />}
        </div>

        {showDropdown && (
          <div
            ref={listboxRef}
            id="search-listbox"
            role="listbox"
            className={styles.listbox}
          >
            {hasResults ? (
              groups.map((group) => (
                <div key={group.key} className={styles.group}>
                  <div className={styles.groupHeader}>
                    <span className={styles.groupLabel}>{group.label}</span>
                    <span className={styles.groupCount}>{group.count}</span>
                  </div>
                  {group.results.map((item) => {
                    const flatIndex = allItems.indexOf(item);
                    return (
                      <div
                        key={item.id}
                        id={`search-option-${flatIndex}`}
                        role="option"
                        data-index={flatIndex}
                        aria-selected={flatIndex === activeIndex}
                        className={`${styles.option} ${flatIndex === activeIndex ? styles.optionActive : ''}`}
                        onPointerDown={(e) => {
                          e.preventDefault();
                          onSelect(item.href, { group: group.key, seeAll: false });
                          setOpen(false);
                        }}
                        onPointerEnter={() => setActiveIndex(flatIndex)}
                      >
                        {item.node}
                      </div>
                    );
                  })}
                  {group.seeAllHref && (
                    <a
                      href={group.seeAllHref}
                      className={styles.seeAll}
                      onPointerDown={(e) => {
                        e.preventDefault();
                        onSelect(group.seeAllHref!, { group: group.key, seeAll: true });
                        setOpen(false);
                      }}
                    >
                      {group.seeAllLabel}
                    </a>
                  )}
                </div>
              ))
            ) : (
              emptyState && <div className={styles.empty}>{emptyState}</div>
            )}
          </div>
        )}
      </div>
    );
  },
);
