#!/usr/bin/env npx tsx
/**
 * Parses markdown files from context/culture-content/ and generates
 * landing/lib/culture/content.ts with structured trilingual content data.
 *
 * Run: npx tsx scripts/build-culture-content.ts
 */

import { readFileSync, readdirSync, writeFileSync, statSync } from 'fs';
import { join, basename } from 'path';

const CONTENT_DIR = join(__dirname, '..', 'context', 'culture-content');
const OUTPUT_FILE = join(__dirname, '..', 'landing', 'lib', 'culture', 'content.ts');

type Locale = 'en' | 'sw' | 'dig';

type ContentBlock =
  | { type: 'heading'; text: string }
  | { type: 'paragraph'; text: string };

type Topic = {
  slug: string;
  title: Record<Locale, string>;
  intro: Record<Locale, string>;
  body: Record<Locale, ContentBlock[]>;
};

type CultureDomain = {
  slug: string;
  title: Record<Locale, string>;
  intro: Record<Locale, string>;
  proverb: string;
  proverbGloss: string;
  topics: Topic[];
};

const DOMAIN_ORDER = [
  'history', 'kayas', 'religion', 'music', 'food', 'dress',
  'crafts', 'society', 'rites', 'oral-traditions', 'ecology',
  'today', 'connections',
];

const PROVERBS: Record<string, { proverb: string; gloss: string }> = {
  history:          { proverb: 'Mutu asiye na asili ni kama muhi usio na midzi', gloss: 'A person without origins is like a tree without roots' },
  kayas:            { proverb: 'Muhi mmwenga tauhenda tsaka', gloss: 'One tree does not make a forest' },
  religion:         { proverb: 'Mulungu kamanyika kwa macho, anamanyika kwa mahendo', gloss: 'God is not known by sight, but by deeds' },
  music:            { proverb: 'Ngoma ikipigwa, magulu ganadzimanya', gloss: 'When the drum is beaten, the feet know themselves' },
  food:             { proverb: 'Mvula igodzwa na utseru', gloss: 'The rain is waited for with a cleared plot' },
  dress:            { proverb: 'Mutu ni nguwo', gloss: 'A person is their clothing' },
  crafts:           { proverb: 'Fundi ni kazi yakpwe', gloss: 'A craftsman is known by their work' },
  society:          { proverb: 'Mlatso tauchimbirana wala taurichana', gloss: 'Blood does not run from itself nor forsake itself' },
  rites:            { proverb: 'Mwana asiyefundzwa ni adui wa nine', gloss: "An untaught child is their mother's enemy" },
  'oral-traditions': { proverb: 'Achili ni nyere, chila mmwenga ana zakpwe', gloss: 'Intelligence is like hair — everyone has their own' },
  ecology:          { proverb: 'Bahari taina msena', gloss: 'The ocean has no friend' },
  today:            { proverb: 'Bandu-bandu yamala gogo', gloss: 'Persistent effort accomplishes large tasks' },
  connections:      { proverb: 'Mnazi mmwenga una uchi wani?', gloss: 'What wine from one palm tree?' },
};

function parseTitle(line: string): Record<Locale, string> {
  const cleaned = line.replace(/^#\s*/, '').trim();
  const parts = cleaned.split(' — ');
  return {
    en: (parts[0] || cleaned).trim(),
    sw: (parts[1] || parts[0] || cleaned).trim(),
    dig: (parts[2] || parts[1] || parts[0] || cleaned).trim(),
  };
}

function splitLocales(content: string): Record<Locale, string> {
  const result: Record<Locale, string> = { en: '', sw: '', dig: '' };

  const enMatch = content.indexOf('## English');
  const swMatch = content.indexOf('## Kiswahili');
  const digMatch = content.indexOf('## Chidigo');

  if (enMatch !== -1) {
    const enEnd = swMatch !== -1 ? swMatch : (digMatch !== -1 ? digMatch : content.length);
    result.en = content.slice(enMatch + '## English'.length, enEnd).trim();
  }

  if (swMatch !== -1) {
    const swEnd = digMatch !== -1 ? digMatch : content.length;
    result.sw = content.slice(swMatch + '## Kiswahili'.length, swEnd).trim();
  }

  if (digMatch !== -1) {
    result.dig = content.slice(digMatch + '## Chidigo'.length).trim();
  }

  return result;
}

function parseBlocks(text: string): ContentBlock[] {
  const blocks: ContentBlock[] = [];
  const lines = text.split('\n');
  let currentParagraph = '';

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed === '' || trimmed === '---') {
      if (currentParagraph.trim()) {
        blocks.push({ type: 'paragraph', text: currentParagraph.trim() });
        currentParagraph = '';
      }
      continue;
    }

    if (trimmed.startsWith('### ')) {
      if (currentParagraph.trim()) {
        blocks.push({ type: 'paragraph', text: currentParagraph.trim() });
        currentParagraph = '';
      }
      blocks.push({ type: 'heading', text: trimmed.replace(/^###\s*/, '') });
      continue;
    }

    // Skip the Tanbihi disclaimer and italic markers
    if (trimmed.startsWith('*[Tanbihi:')) continue;

    // Accumulate paragraph lines
    if (currentParagraph) {
      currentParagraph += ' ' + trimmed;
    } else {
      currentParagraph = trimmed;
    }
  }

  if (currentParagraph.trim()) {
    blocks.push({ type: 'paragraph', text: currentParagraph.trim() });
  }

  return blocks;
}

function extractIntro(blocks: ContentBlock[]): string {
  const firstParagraph = blocks.find(b => b.type === 'paragraph');
  if (!firstParagraph) return '';
  const text = firstParagraph.text;
  // Truncate to ~200 chars at word boundary for card display
  if (text.length <= 200) return text;
  const cut = text.lastIndexOf(' ', 200);
  return text.slice(0, cut > 0 ? cut : 200) + '…';
}

function processFile(filePath: string): { title: Record<Locale, string>; localeBlocks: Record<Locale, ContentBlock[]> } {
  const raw = readFileSync(filePath, 'utf-8');
  const lines = raw.split('\n');

  // Title is the first non-empty line starting with #
  const titleLine = lines.find(l => l.trim().startsWith('# ')) || '';
  const title = parseTitle(titleLine);

  const localeTexts = splitLocales(raw);
  const localeBlocks: Record<Locale, ContentBlock[]> = {
    en: parseBlocks(localeTexts.en),
    sw: parseBlocks(localeTexts.sw),
    dig: parseBlocks(localeTexts.dig),
  };

  return { title, localeBlocks };
}

function buildDomain(domainSlug: string): CultureDomain {
  const domainDir = join(CONTENT_DIR, domainSlug);
  const indexFile = join(domainDir, 'index.md');

  // Parse index.md for domain summary
  const { title: domainTitle, localeBlocks: indexBlocks } = processFile(indexFile);
  const domainIntro: Record<Locale, string> = {
    en: extractIntro(indexBlocks.en),
    sw: extractIntro(indexBlocks.sw),
    dig: extractIntro(indexBlocks.dig),
  };

  // Parse topic files
  const files = readdirSync(domainDir)
    .filter(f => f.endsWith('.md') && f !== 'index.md')
    .sort();

  const topics: Topic[] = files.map(file => {
    const slug = basename(file, '.md');
    const { title, localeBlocks } = processFile(join(domainDir, file));

    return {
      slug,
      title,
      intro: {
        en: extractIntro(localeBlocks.en),
        sw: extractIntro(localeBlocks.sw),
        dig: extractIntro(localeBlocks.dig),
      },
      body: localeBlocks,
    };
  });

  const prov = PROVERBS[domainSlug] || { proverb: '', gloss: '' };

  return {
    slug: domainSlug,
    title: domainTitle,
    intro: domainIntro,
    proverb: prov.proverb,
    proverbGloss: prov.gloss,
    topics,
  };
}

function escapeForTS(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\n/g, '\\n');
}

function generateTypeScript(domains: CultureDomain[]): string {
  const lines: string[] = [];

  lines.push("import type { Locale } from '@/lib/i18n/config';");
  lines.push('');
  lines.push('export type ContentBlock =');
  lines.push("  | { type: 'heading'; text: string }");
  lines.push("  | { type: 'paragraph'; text: string };");
  lines.push('');
  lines.push('export type Topic = {');
  lines.push('  slug: string;');
  lines.push('  title: Record<Locale, string>;');
  lines.push('  intro: Record<Locale, string>;');
  lines.push('  body: Record<Locale, ContentBlock[]>;');
  lines.push('};');
  lines.push('');
  lines.push('export type CultureDomain = {');
  lines.push('  slug: string;');
  lines.push('  title: Record<Locale, string>;');
  lines.push('  intro: Record<Locale, string>;');
  lines.push('  proverb: string;');
  lines.push('  proverbGloss: string;');
  lines.push('  topics: Topic[];');
  lines.push('};');
  lines.push('');

  // Serialize domains as JSON-compatible data
  lines.push('export const domains: CultureDomain[] = ');
  lines.push(JSON.stringify(domains, null, 2) + ';');
  lines.push('');

  // Helper functions
  lines.push('export function getDomain(slug: string): CultureDomain | undefined {');
  lines.push('  return domains.find(d => d.slug === slug);');
  lines.push('}');
  lines.push('');
  lines.push('export function getTopic(domainSlug: string, topicSlug: string): { domain: CultureDomain; topic: Topic } | undefined {');
  lines.push('  const domain = getDomain(domainSlug);');
  lines.push('  if (!domain) return undefined;');
  lines.push('  const topic = domain.topics.find(t => t.slug === topicSlug);');
  lines.push('  if (!topic) return undefined;');
  lines.push('  return { domain, topic };');
  lines.push('}');
  lines.push('');

  return lines.join('\n');
}

// Main
const domains = DOMAIN_ORDER
  .filter(slug => {
    const dir = join(CONTENT_DIR, slug);
    try { return statSync(dir).isDirectory(); } catch { return false; }
  })
  .map(buildDomain);

const output = generateTypeScript(domains);
writeFileSync(OUTPUT_FILE, output, 'utf-8');

const topicCount = domains.reduce((sum, d) => sum + d.topics.length, 0);
console.log(`Generated ${OUTPUT_FILE}`);
console.log(`  ${domains.length} domains, ${topicCount} topics`);
console.log(`  ${(output.length / 1024).toFixed(0)} KB`);
