'use client';

/**
 * Keeps the offline data caches in step with the published data (ISSUES DATA-1).
 *
 * The service worker serves data files stale-while-revalidate and only clears them when a new worker
 * activates, so a device could pair a fresh search index with an old letter file. Once per page load
 * this reads data-version.json from the network and, for each area whose version changed (or when no
 * version has been recorded on this device yet), deletes that area's cache from the page itself.
 * Data loaders wait for it before their first fetch.
 */

const KEY = 'chidigo-data-version-seen';
const CACHES: Record<string, string> = {
  dict: 'chidigo-dict',
  proverbs: 'chidigo-proverbs',
  plants: 'chidigo-plants',
  quiz: 'chidigo-quiz',
};

export type DataVersion = Record<string, string>;

let ready: Promise<DataVersion | null> | null = null;

async function check(): Promise<DataVersion | null> {
  if (typeof window === 'undefined') return null;
  let remote: DataVersion;
  try {
    const res = await fetch('/data/data-version.json', { cache: 'no-store' });
    if (!res.ok) return null;
    remote = await res.json();
  } catch {
    return null; // offline: use whatever is cached
  }

  let seen: DataVersion | null = null;
  try {
    seen = JSON.parse(localStorage.getItem(KEY) ?? 'null');
  } catch {
    seen = null;
  }

  if ('caches' in window) {
    const stale = Object.keys(CACHES).filter((area) => !seen || seen[area] !== remote[area]);
    await Promise.all(stale.map((area) => caches.delete(CACHES[area]).catch(() => false)));
  }
  try {
    localStorage.setItem(KEY, JSON.stringify(remote));
  } catch {
    /* not kept: the next load checks again */
  }
  return remote;
}

/** Resolves once stale data caches are gone (at most ~2.5 s, so a slow network never blocks data). */
export function ensureFreshData(): Promise<DataVersion | null> {
  if (!ready) {
    ready = Promise.race([check(), new Promise<null>((r) => setTimeout(() => r(null), 2500))]);
  }
  return ready;
}

/** Fetch one data file straight from the network and put it back in the service worker's cache. */
export async function refetchFromNetwork(path: string, area: keyof typeof CACHES): Promise<Response | null> {
  try {
    const version = (await ensureFreshData())?.[area] ?? String(Date.now());
    const sep = path.includes('?') ? '&' : '?';
    const res = await fetch(`${path}${sep}fresh=${encodeURIComponent(version)}`, { cache: 'no-store' });
    if (!res.ok) return null;
    if ('caches' in window) {
      const cache = await caches.open(CACHES[area]);
      await cache.put(path, res.clone()).catch(() => {});
      // The cache-busting copy isn't needed later.
      await cache.delete(`${path}${sep}fresh=${encodeURIComponent(version)}`).catch(() => {});
    }
    return res;
  } catch {
    return null;
  }
}
