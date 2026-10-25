'use client';

import { useRef, useMemo } from 'react';
import { useTranslations } from '@/lib/i18n/context';
import { useLocale } from '@/lib/i18n/context';
import { getTopic } from '@/lib/articles/manifest';
import { renderInlineMarkdown } from '@/lib/articles/render';
import type { ReactNode } from 'react';
import type { ArticleBlock, ArticleFile } from '@/lib/articles/types';
import { useArticleFix } from '@/components/Contribute/ArticleFix';
import type { Locale } from '@/lib/i18n/config';
import { track } from '@/lib/analytics/track';
import { useTrackReadComplete } from '@/hooks/useTrackReadComplete';
import { getHeroStyle } from '@/lib/images/hero-images';
import styles from './CultureArticle.module.css';

function ArticleBody({ blocks, locale, pencil }: { blocks: ArticleBlock[]; locale: Locale; pencil?: (b: ArticleBlock) => ReactNode }) {
  const text = (b: ArticleBlock) => b[locale] ?? '';
  return (
    <div className={styles.articleBody}>
      {blocks.map((block) =>
        block.type === 'heading' ? (
          <h3 key={block.id} id={block.id} className={styles.articleHeading}>
            {text(block)}
            {pencil?.(block)}
          </h3>
        ) : (
          <p key={block.id} id={block.id} className={styles.bodyText}>
            {renderInlineMarkdown(text(block))}
            {pencil?.(block)}
          </p>
        ),
      )}
    </div>
  );
}

export function TopicArticle({
  domainSlug,
  topicSlug,
  article,
}: {
  domainSlug: string;
  topicSlug: string;
  /** The article in all three languages with its block ids, from the server (locale switching happens here). */
  article: ArticleFile;
}) {
  const t = useTranslations();
  const { locale } = useLocale();

  const fix = useArticleFix(`culture/${domainSlug}/${topicSlug}`, article);
  const bottomRef = useRef<HTMLDivElement>(null);
  const readParams = useMemo(() => ({
    topic: topicSlug,
    domain: domainSlug,
    content_language: locale,
  }), [topicSlug, domainSlug, locale]);
  useTrackReadComplete(bottomRef, 'culture', 'article', readParams);

  const result = getTopic(domainSlug, topicSlug);
  if (!result) return <p>Article not found.</p>;

  const { domain } = result;

  return (
    <>
      <section className={styles.hero} style={getHeroStyle(`${domainSlug}/${topicSlug}`)}>
        <div className={styles.heroContent}>
          <p className={styles.eyebrow}>{domain.title[locale]}</p>
          <h1 className={styles.heroTitle}>{fix.merged.title[locale]}{fix.pencil({ field: 'title', onDark: true })}</h1>
          <p className={styles.proverb} lang="dg">
            <em>{domain.proverb}</em>
          </p>
          <p className={styles.gloss}>{domain.proverbGloss}</p>
        </div>
      </section>

      <article className={styles.article}>
        <div className={styles.articleInner}>
          {fix.toggle}
          <ArticleBody
            blocks={fix.merged.blocks}
            locale={locale}
            pencil={(b) => fix.pencil({ field: 'block', block: b.id })}
          />
          {fix.toggle}
          {fix.credits}
          {fix.form}
          <div ref={bottomRef} />
        </div>
      </article>

      {domain.topics.length > 1 && (
        <section className={styles.relatedSection}>
          <div className={styles.relatedInner}>
            <p className={styles.relatedHeading}>
              {t.culture.related_topics}
            </p>
            <div className={styles.relatedGrid}>
              {domain.topics
                .filter((tp) => tp.slug !== topicSlug)
                .slice(0, 3)
                .map((tp) => (
                  <a
                    key={tp.slug}
                    href={`/culture/${domain.slug}/${tp.slug}`}
                    className={styles.relatedCard}
                    onClick={() => track('culture', 'article', 'click_related', { topic: tp.slug })}
                  >
                    <h3 className={styles.relatedTitle}>
                      {tp.title[locale]}
                    </h3>
                    <p className={styles.relatedIntro}>
                      {tp.intro[locale]}
                    </p>
                  </a>
                ))}
            </div>
          </div>
        </section>
      )}

    </>
  );
}
