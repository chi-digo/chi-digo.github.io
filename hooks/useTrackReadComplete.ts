'use client';

import { useEffect, useRef } from 'react';
import { track, type Journey } from '@/lib/analytics/track';

/**
 * Fire a `{journey}_{stage}_read_complete` event when a sentinel element
 * (placed at the bottom of an article) scrolls into view.
 * Includes `reading_time_seconds` measuring time since mount.
 */
export function useTrackReadComplete(
  ref: React.RefObject<HTMLElement | null>,
  journey: Journey,
  stage: string,
  params?: Record<string, string | number | boolean>,
): void {
  const hasFired = useRef(false);
  const startTime = useRef<number>(0);

  useEffect(() => {
    startTime.current = Date.now();
  }, []);

  useEffect(() => {
    if (!ref.current || hasFired.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasFired.current) {
          hasFired.current = true;
          const readingTimeSeconds = Math.round((Date.now() - startTime.current) / 1000);
          track(journey, stage, 'read_complete', {
            ...params,
            reading_time_seconds: readingTimeSeconds,
          });
          observer.disconnect();
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [ref, journey, stage, params]);
}
