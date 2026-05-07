'use client';

import { useEffect, useRef } from 'react';
import { track, type Journey } from '@/lib/analytics/track';

/**
 * Fire a one-shot `{journey}_{stage}_view` event when the target element
 * becomes 50 % visible. Deduplicates across React Strict Mode double-mounts.
 */
export function useTrackView(
  ref: React.RefObject<HTMLElement | null>,
  journey: Journey,
  stage: string,
  params?: Record<string, string | number | boolean>,
): void {
  const hasFired = useRef(false);

  useEffect(() => {
    if (!ref.current || hasFired.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasFired.current) {
          hasFired.current = true;
          track(journey, stage, 'view', params);
          observer.disconnect();
        }
      },
      { threshold: 0.5 },
    );

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [ref, journey, stage, params]);
}
