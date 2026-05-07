/**
 * Build-time sitemap generation script.
 * Generates sitemap-index.xml, sitemap.xml, and dictionary-sitemap.xml in public/.
 *
 * Run: npx tsx scripts/generate-seo.ts
 */

import fs from 'fs';
import path from 'path';

const SITE_URL = 'https://chidigo.org';
const TODAY = new Date().toISOString().split('T')[0];

// ----- Resolve project root (works from scripts/ or project root) -----
const __filename = new URL(import.meta.url).pathname;
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const PUBLIC = path.join(ROOT, 'public');
const DATA_DIR = path.join(PUBLIC, 'data');

// ----- Helpers -----
function xmlUrl(loc: string, priority: number, changefreq: string): string {
  return `  <url>
    <loc>${SITE_URL}${loc}</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority.toFixed(1)}</priority>
  </url>`;
}

function wrapUrlset(urls: string[]): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;
}

// ----- Load content data via dynamic import (uses tsconfig paths via tsx) -----
async function loadCultureDomains() {
  const mod = await import(path.join(ROOT, 'lib/culture/content.ts'));
  return mod.domains as Array<{
    slug: string;
    topics: Array<{ slug: string }>;
  }>;
}

async function loadHistoryDomain() {
  const mod = await import(path.join(ROOT, 'lib/history/content.ts'));
  return mod.historyDomain as {
    slug: string;
    topics: Array<{ slug: string }>;
  };
}

async function loadLanguageDomain() {
  const mod = await import(path.join(ROOT, 'lib/language/content.ts'));
  return mod.oralTraditionsDomain as {
    slug: string;
    topics: Array<{ slug: string }>;
  };
}

function loadDictionaryIndex() {
  const raw = fs.readFileSync(path.join(DATA_DIR, 'index.json'), 'utf-8');
  return JSON.parse(raw) as {
    total_entries: number;
    digo_alphabet: string[];
    letters: Record<string, { count: number }>;
  };
}

function loadAllHeadwords(): string[] {
  const headwords: string[] = [];
  for (const file of fs.readdirSync(DATA_DIR)) {
    if (!file.endsWith('.json') || file.endsWith('.idx.json')) continue;
    if (['corpus-to-dict.json', 'fuzzy-rules.json', 'index.json', 'reverse-en.json'].includes(file)) continue;
    const raw = fs.readFileSync(path.join(DATA_DIR, file), 'utf-8');
    const data = JSON.parse(raw);
    if (data && Array.isArray(data.entries)) {
      for (const entry of data.entries) {
        if (entry.headword) {
          headwords.push(entry.headword.replace(/[\d;]+$/, ''));
        }
      }
    }
  }
  return [...new Set(headwords)];
}

// ----- Main -----
async function main() {
  console.log('Generating SEO files...');

  const domains = await loadCultureDomains();
  const historyDomain = await loadHistoryDomain();
  const languageDomain = await loadLanguageDomain();
  const dictIndex = loadDictionaryIndex();
  const headwords = loadAllHeadwords();

  // ===== sitemap.xml (editorial pages) =====
  const urls: string[] = [];

  // Home
  urls.push(xmlUrl('/', 1.0, 'weekly'));

  // Static pages
  for (const p of ['/about', '/mission', '/vision', '/contact']) {
    urls.push(xmlUrl(p, 0.7, 'monthly'));
  }

  // Culture section
  urls.push(xmlUrl('/culture', 0.8, 'weekly'));
  for (const domain of domains) {
    urls.push(xmlUrl(`/culture/${domain.slug}`, 0.8, 'weekly'));
    for (const topic of domain.topics) {
      urls.push(xmlUrl(`/culture/${domain.slug}/${topic.slug}`, 0.7, 'monthly'));
    }
  }

  // History section
  urls.push(xmlUrl('/history', 0.8, 'weekly'));
  for (const topic of historyDomain.topics) {
    urls.push(xmlUrl(`/history/${topic.slug}`, 0.7, 'monthly'));
  }

  // Language section
  urls.push(xmlUrl('/language', 0.8, 'weekly'));
  for (const topic of languageDomain.topics) {
    urls.push(xmlUrl(`/language/${topic.slug}`, 0.7, 'monthly'));
  }

  // Dictionary home + letter indexes
  urls.push(xmlUrl('/dictionary', 0.8, 'weekly'));
  for (const letter of dictIndex.digo_alphabet) {
    urls.push(xmlUrl(`/dictionary/letter/${encodeURIComponent(letter.toLowerCase())}`, 0.7, 'weekly'));
  }

  const sitemapXml = wrapUrlset(urls);
  fs.writeFileSync(path.join(PUBLIC, 'sitemap.xml'), sitemapXml, 'utf-8');
  console.log(`  sitemap.xml: ${urls.length} URLs`);

  // ===== dictionary-sitemap.xml =====
  const dictUrls: string[] = [];
  for (const hw of headwords) {
    dictUrls.push(xmlUrl(`/dictionary/word/${encodeURIComponent(hw)}`, 0.5, 'monthly'));
  }

  const dictSitemapXml = wrapUrlset(dictUrls);
  fs.writeFileSync(path.join(PUBLIC, 'dictionary-sitemap.xml'), dictSitemapXml, 'utf-8');
  console.log(`  dictionary-sitemap.xml: ${dictUrls.length} URLs`);

  // ===== sitemap-index.xml =====
  const sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${SITE_URL}/sitemap.xml</loc>
    <lastmod>${TODAY}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${SITE_URL}/dictionary-sitemap.xml</loc>
    <lastmod>${TODAY}</lastmod>
  </sitemap>
</sitemapindex>`;
  fs.writeFileSync(path.join(PUBLIC, 'sitemap-index.xml'), sitemapIndex, 'utf-8');
  console.log('  sitemap-index.xml written');

  console.log('SEO files generated successfully.');
}

main().catch((err) => {
  console.error('Failed to generate SEO files:', err);
  process.exit(1);
});
