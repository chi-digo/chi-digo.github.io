/**
 * Article data (spec 34 §17.10): culture, history and language topics, figure articles and the
 * timeline, stored in content/articles/** with one block per paragraph, heading or quote and all three
 * languages side by side. Block ids are frozen: a correction (phase 5c) names the block it fixes.
 */
import type { Locale } from '@/lib/i18n/config';
import type { Provenance } from '@/lib/contributions/apply/types';

export type BlockType = 'heading' | 'paragraph' | 'quote';

/** One block as a page renders it, in one language. */
export type ContentBlock = { type: BlockType; text: string };

/** One block as stored: its id, type and text in each language. */
export type ArticleBlock = { id: string; type: BlockType } & Partial<Record<Locale, string>>;

export type L10n = Record<Locale, string>;

export interface ArticleFile {
  id: string;
  title: L10n;
  intro: L10n;
  blocks: ArticleBlock[];
  provenance?: Provenance;
}

export interface DomainMeta {
  slug: string;
  title: L10n;
  intro: L10n;
  proverb: string;
  proverbGloss: string;
  topics: string[];
}

/** A topic as the pages use it: titles, intros and the body per language. */
export interface Topic {
  slug: string;
  title: L10n;
  intro: L10n;
  body: Record<Locale, ContentBlock[]>;
}

export interface FigureFile {
  id: string;
  published: boolean;
  title: Partial<L10n>;
  subtitle: Partial<L10n>;
  meta: Partial<L10n>[];
  blocks: ArticleBlock[];
  sources: string[];
  provenance?: Provenance;
}

/** A figure article in one language, as FigureArticle renders it. */
export interface FigureArticle {
  title: string;
  subtitle: string;
  meta: string[];
  body: ContentBlock[];
  sources: string[];
}

import type { Era } from '@/lib/history/timeline';
export type { Era };

export interface TimelineEvent {
  id: string;
  era: Era;
  date: string;
  title: L10n;
  description: L10n;
}

/** The manifest: everything but the article bodies, for client components (breadcrumb, indexes). */
export interface TopicMeta { slug: string; title: L10n; intro: L10n }
export interface DomainManifest extends Omit<DomainMeta, 'topics'> { topics: TopicMeta[] }
export interface Manifest {
  culture: DomainManifest[];
  history: DomainManifest;
  language: DomainManifest;
}
