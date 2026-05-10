/// <reference lib="webworker" />

import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist';
import { CacheFirst, ExpirationPlugin, NetworkFirst, Serwist, StaleWhileRevalidate } from 'serwist';

interface NetworkInformation {
  readonly effectiveType: '2g' | '3g' | '4g' | 'slow-2g';
  readonly saveData: boolean;
}

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const CACHE_DICT = 'chidigo-dict';
const CACHE_PROVERBS = 'chidigo-proverbs';
const CACHE_QUIZ = 'chidigo-quiz';
const CACHE_CONTENT = 'chidigo-content';
const CACHE_PAGES = 'chidigo-pages';
const CACHE_META = 'chidigo-meta';
const DATA_VERSION_URL = '/data/data-version.json';

const manifest = self.__SW_MANIFEST ?? [];
const htmlEntries = manifest.filter((entry) => {
  const url = typeof entry === 'string' ? entry : entry.url;
  return url.endsWith('.html') || (!url.includes('.') && url !== '/');
});
const nonHtmlEntries = manifest.filter((entry) => {
  const url = typeof entry === 'string' ? entry : entry.url;
  return !url.endsWith('.html') && (url.includes('.') || url === '/');
});

// Pre-populate the pages cache with HTML from the precache manifest so they're
// available offline, but served via NetworkFirst (not precache-first).
self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_PAGES);
    for (const entry of htmlEntries) {
      const url = typeof entry === 'string' ? entry : entry.url;
      try { await cache.add(url); } catch { /* skip */ }
    }
  })());
});

const serwist = new Serwist({
  precacheEntries: nonHtmlEntries,
  precacheOptions: {
    cleanURLs: true,
  },
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: false,
  runtimeCaching: [
    {
      matcher: ({ request }) => request.mode === 'navigate',
      handler: new NetworkFirst({
        cacheName: CACHE_PAGES,
        plugins: [new ExpirationPlugin({ maxEntries: 60 })],
      }),
    },
    {
      matcher: ({ url }) => /^\/data\/proverbs\/.*\.json$/.test(url.pathname),
      handler: new StaleWhileRevalidate({ cacheName: CACHE_PROVERBS }),
    },
    {
      matcher: ({ url }) => /^\/data\/quiz\/.*\.json$/.test(url.pathname),
      handler: new StaleWhileRevalidate({ cacheName: CACHE_QUIZ }),
    },
    {
      matcher: ({ url }) =>
        url.pathname === DATA_VERSION_URL,
      handler: new NetworkFirst({ cacheName: CACHE_META }),
    },
    {
      matcher: ({ url }) =>
        /^\/data\/.*\.json$/.test(url.pathname) &&
        url.pathname !== DATA_VERSION_URL,
      handler: new StaleWhileRevalidate({ cacheName: CACHE_DICT }),
    },
    {
      matcher: ({ url }) => /^\/fonts\/.*\.woff2$/.test(url.pathname),
      handler: new CacheFirst({
        cacheName: 'chidigo-fonts',
        plugins: [
          new ExpirationPlugin({ maxAgeSeconds: 90 * 24 * 60 * 60 }),
        ],
      }),
    },
  ],
  fallbacks: {
    entries: [
      {
        url: '/offline.html',
        matcher: ({ request }) => request.destination === 'document',
      },
    ],
  },
});

serwist.addEventListeners();

// --- Background data fetch (connection-aware) ---

const LIGHTWEIGHT_DATA: Record<string, string> = {
  '/data/proverbs/index.json': CACHE_PROVERBS,
  '/data/quiz/quiz-bank.json': CACHE_QUIZ,
  '/data/content-index.json': CACHE_CONTENT,
  '/data/fuzzy-rules.json': CACHE_CONTENT,
  '/data/variants.json': CACHE_CONTENT,
};

const DICT_LETTERS = [
  'a','b','ch','d','dz','e','f','g','gbw','h','i','j','k','kpw',
  'l','m','m\'','n','ndz','ng','ng\'','o','p','ph','r','s','sh',
  't','ts','u','v','w','y','z',
];

function getAllDictUrls(): string[] {
  const urls = [
    '/data/index.json',
    '/data/reverse-en.json',
    '/data/reverse-sw.json',
    '/data/fuzzy-rules.json',
    '/data/variants.json',
  ];
  for (const letter of DICT_LETTERS) {
    urls.push(`/data/${letter}.json`, `/data/${letter}.idx.json`);
  }
  return urls;
}

async function safeCacheAdd(cacheName: string, url: string): Promise<void> {
  try {
    const cache = await caches.open(cacheName);
    await cache.add(url);
  } catch {
    // Network failure or non-2xx — skip silently
  }
}

async function batchFetch(urls: string[], cacheName: string): Promise<void> {
  const cache = await caches.open(cacheName);
  const CONCURRENCY = 4;
  const STAGGER_MS = 200;

  for (let i = 0; i < urls.length; i += CONCURRENCY) {
    const batch = urls.slice(i, i + CONCURRENCY);
    await Promise.allSettled(
      batch.map(async (url) => {
        try { await cache.add(url); } catch { /* skip */ }
      }),
    );
    if (i + CONCURRENCY < urls.length) {
      await new Promise((r) => setTimeout(r, STAGGER_MS));
    }
  }
}

async function notifyClients(type: string, data?: Record<string, unknown>): Promise<void> {
  const clients = await self.clients.matchAll();
  for (const client of clients) {
    client.postMessage({ type, ...data });
  }
}

async function backgroundFetchData(): Promise<void> {
  const conn = (self.navigator as Navigator & { connection?: NetworkInformation }).connection;
  const saveData = conn?.saveData ?? false;
  const effectiveType = conn?.effectiveType ?? '4g';

  let estimate: StorageEstimate | undefined;
  try {
    estimate = await navigator.storage?.estimate();
  } catch { /* unavailable */ }
  const availableMB = ((estimate?.quota ?? Infinity) - (estimate?.usage ?? 0)) / (1024 * 1024);
  if (availableMB < 15) return;

  if (saveData || effectiveType === '2g' || effectiveType === 'slow-2g') {
    return;
  }

  if (effectiveType === '3g') {
    for (const [url, cacheName] of Object.entries(LIGHTWEIGHT_DATA)) {
      await safeCacheAdd(cacheName, url);
    }
    await notifyClients('DATA_CACHED', { tier: '3g' });
    return;
  }

  // 4g or unknown
  await batchFetch(getAllDictUrls(), CACHE_DICT);
  for (const [url, cacheName] of Object.entries(LIGHTWEIGHT_DATA)) {
    await safeCacheAdd(cacheName, url);
  }
  await notifyClients('DATA_CACHED', { tier: '4g' });
}

// --- Data versioning ---

async function getStoredVersion(): Promise<Record<string, string> | null> {
  try {
    const cache = await caches.open(CACHE_META);
    const response = await cache.match('chidigo-data-version');
    if (!response) return null;
    return response.json();
  } catch {
    return null;
  }
}

async function storeVersion(version: Record<string, string>): Promise<void> {
  const cache = await caches.open(CACHE_META);
  const response = new Response(JSON.stringify(version), {
    headers: { 'Content-Type': 'application/json' },
  });
  await cache.put('chidigo-data-version', response);
}

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    try {
      const response = await fetch(DATA_VERSION_URL, { cache: 'no-store' });
      const remote = await response.json();
      const local = await getStoredVersion();

      if (local) {
        let changed = false;
        if (remote.dict !== local.dict) {
          await caches.delete(CACHE_DICT);
          changed = true;
        }
        if (remote.proverbs !== local.proverbs) {
          await caches.delete(CACHE_PROVERBS);
          changed = true;
        }
        if (remote.quiz !== local.quiz) {
          await caches.delete(CACHE_QUIZ);
          changed = true;
        }
        if (changed) {
          await backgroundFetchData();
          await notifyClients('DATA_UPDATED');
        }
      } else {
        await backgroundFetchData();
      }

      await storeVersion(remote);
    } catch (err) {
      await backgroundFetchData();

      const clients = await self.clients.matchAll();
      for (const client of clients) {
        client.postMessage({
          type: "SW_ERROR",
          error: err instanceof Error ? { message: err.message, stack: err.stack } : String(err),
        });
      }
    }

    await self.clients.claim();
  })());
});
