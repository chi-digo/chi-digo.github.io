import { createSerwistRoute } from '@serwist/turbopack';

// Bundles worker/sw.ts with esbuild at build time and serves it as /serwist/sw.js
// (with Service-Worker-Allowed: / so it can control the whole site).
//
// Precache: the app's own code plus the small public assets needed to render
// offline. Dictionary/proverb/quiz data (public/data) is cached at runtime by the
// worker instead, and large images/sitemaps are left out.
export const { dynamic, dynamicParams, revalidate, generateStaticParams, GET } = createSerwistRoute({
  swSrc: 'worker/sw.ts',
  useNativeEsbuild: true,
  globPatterns: [
    '.next/static/**/*.{js,css,woff,woff2,ico,png,svg,webp,json}',
    'public/offline.html',
    'public/manifest.json',
    'public/icons/**/*',
    'public/fonts/**/*',
    'public/hero.webp',
    'public/pindo-diamond-chain.svg',
  ],
});
