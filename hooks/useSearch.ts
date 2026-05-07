"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  searchDropdown,
  searchAll,
  type GroupedSearchResults,
} from "@/lib/dictionary/search";
import { track } from "@/lib/analytics/track";

const EMPTY: GroupedSearchResults = { dg: [], sw: [], en: [], total: 0 };

export function useSearch(source?: string, debounceMs: number = 150) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GroupedSearchResults>(EMPTY);
  const [isLoading, setIsLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);
  const abortRef = useRef(0);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    if (!query || query.trim().length < 2) {
      setResults(EMPTY);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const id = ++abortRef.current;

    timerRef.current = setTimeout(async () => {
      track('dictionary', 'search', 'type', {
        query,
        query_length: query.length,
        ...(source ? { source } : {}),
      });
      try {
        const r = await searchDropdown(query);
        if (abortRef.current === id) {
          setResults(r);
          setIsLoading(false);
        }
      } catch {
        if (abortRef.current === id) {
          setResults(EMPTY);
          setIsLoading(false);
        }
      }
    }, debounceMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query, debounceMs]);

  const searchImmediate = useCallback(async (q: string) => {
    if (!q || q.trim().length === 0) {
      setResults(EMPTY);
      return EMPTY;
    }
    setIsLoading(true);
    const id = ++abortRef.current;
    try {
      const r = await searchAll(q);
      if (abortRef.current === id) {
        setResults(r);
        setIsLoading(false);
      }
      return r;
    } catch {
      if (abortRef.current === id) {
        setResults(EMPTY);
        setIsLoading(false);
      }
      return EMPTY;
    }
  }, []);

  const clear = useCallback(() => {
    setQuery("");
    setResults(EMPTY);
    setIsLoading(false);
  }, []);

  return { query, setQuery, results, isLoading, searchImmediate, clear };
}
