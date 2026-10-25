import type { Locale } from '@/lib/i18n/config';
import type { ArticleBlock, ContentBlock } from './types';

/** The blocks in one language, as the renderers expect them (client-safe). */
export function bodyIn(blocks: ArticleBlock[], locale: Locale): ContentBlock[] {
  return blocks.map((b) => ({ type: b.type, text: b[locale] ?? '' }));
}
