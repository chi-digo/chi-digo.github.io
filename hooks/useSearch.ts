"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  searchDropdown,
  searchAll,
  type GroupedSearchResults,
} from "@/lib/dictionary/search";

const EMPTY: GroupedSearchResults = { dg: [], sw: [], en: [], total: 0 };

export function useSearch(debounceMs: number = 150) {
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
    console.debug(`[DICT-DEBUG] useSearch effect: query="${query}", id=${id}`);

    timerRef.current = setTimeout(async () => {
      try {
        console.debug(`[DICT-DEBUG] useSearch debounce fired: query="${query}", id=${id}, current=${abortRef.current}`);
        const r = await searchDropdown(query);
        if (abortRef.current === id) {
          console.debug(`[DICT-DEBUG] useSearch results applied: total=${r.total}`);
          setResults(r);
          setIsLoading(false);
        } else {
          console.debug(`[DICT-DEBUG] useSearch results STALE: id=${id} vs current=${abortRef.current}`);
        }
      } catch (err) {
        console.error(`[DICT-DEBUG] useSearch error:`, err);
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
