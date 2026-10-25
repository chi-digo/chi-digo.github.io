/**
 * Live article fixes (spec 34 §17.11): accepted translation fixes not yet folded into the files,
 * fetched once per page load. Offline or failing: none (the published text shows).
 */
import type { Change } from '@/lib/contributions/apply/types';

let overlay: Promise<Change[]> | null = null;

export function articleOverlay(): Promise<Change[]> {
  if (!overlay) {
    overlay = fetch('/api/overlay/article')
      .then((r) => (r.ok ? r.json() : { changes: [] }))
      .then((d: { changes?: Change[] }) => d.changes ?? [])
      .catch(() => {
        overlay = null;
        return [];
      });
  }
  return overlay;
}

export function refreshArticleOverlay() {
  overlay = null;
}
