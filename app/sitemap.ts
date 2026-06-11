import type { MetadataRoute } from 'next';
import { domains } from '@/lib/culture/content';
import { historyDomain } from '@/lib/history/content';
import { oralTraditionsDomain } from '@/lib/language/content';
import { localePath } from '@/lib/i18n/locale-path';
import { DIGO_ALPHABET } from '@/lib/constants';

const SITE_URL = 'https://chidigo.org';
const LAST_MOD = '2026-06-11';

type ChangeFreq = MetadataRoute.Sitemap[0]['changeFrequency'];

function entry(
  path: string,
  opts: { priority?: number; changeFrequency?: ChangeFreq } = {},
): MetadataRoute.Sitemap[0] {
  return {
    url: `${SITE_URL}${path}`,
    lastModified: LAST_MOD,
    changeFrequency: opts.changeFrequency ?? 'monthly',
    priority: opts.priority ?? 0.7,
    alternates: {
      languages: {
        en: `${SITE_URL}${path}`,
        sw: `${SITE_URL}${localePath(path, 'sw')}`,
        dg: `${SITE_URL}${localePath(path, 'dg')}`,
      } as Record<string, string>,
    },
  };
}

export default function sitemap(): MetadataRoute.Sitemap {
  const urls: MetadataRoute.Sitemap = [];

  urls.push(entry('/', { priority: 1.0, changeFrequency: 'weekly' }));
  urls.push(entry('/about'));
  urls.push(entry('/mission'));
  urls.push(entry('/vision'));
  urls.push(entry('/contact'));

  urls.push(entry('/culture', { priority: 0.8, changeFrequency: 'weekly' }));
  for (const d of domains) {
    urls.push(entry(`/culture/${d.slug}`, { priority: 0.8, changeFrequency: 'weekly' }));
    for (const t of d.topics) {
      urls.push(entry(`/culture/${d.slug}/${t.slug}`));
    }
  }

  urls.push(entry('/history', { priority: 0.8, changeFrequency: 'weekly' }));
  for (const t of historyDomain.topics) {
    urls.push(entry(`/history/${t.slug}`));
  }

  urls.push(entry('/language', { priority: 0.8, changeFrequency: 'weekly' }));
  for (const t of oralTraditionsDomain.topics) {
    urls.push(entry(`/language/${t.slug}`));
  }

  urls.push(entry('/language/proverbs', { priority: 0.8, changeFrequency: 'weekly' }));
  urls.push(entry('/language/quiz', { priority: 0.7, changeFrequency: 'monthly' }));

  urls.push(entry('/language/dictionary', { priority: 0.8, changeFrequency: 'weekly' }));
  for (const letter of DIGO_ALPHABET) {
    urls.push(entry(`/language/dictionary/letter/${letter.toLowerCase()}`));
  }

  return urls;
}
