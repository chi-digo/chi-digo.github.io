'use client';

import { useRef, useMemo } from 'react';
import { useTranslations, useLocale } from '@/lib/i18n/context';
import { getLanguageTopic } from '@/lib/articles/manifest';
import { renderInlineMarkdown } from '@/lib/articles/render';
import type { ContentBlock } from '@/lib/articles/types';
import type { Locale } from '@/lib/i18n/config';
import { track } from '@/lib/analytics/track';
import { useTrackReadComplete } from '@/hooks/useTrackReadComplete';
import { getHeroStyle } from '@/lib/images/hero-images';
import styles from './LanguageArticle.module.css';

function ArticleBody({ body }: { body: ContentBlock[] }) {
  return (
    <div className={styles.articleBody}>
      {body.map((block, i) =>
        block.type === 'heading' ? (
          <h3 key={i} className={styles.articleHeading}>
            {block.text}
          </h3>
        ) : (
          <p key={i} className={styles.bodyText}>
            {renderInlineMarkdown(block.text)}
          </p>
        ),
      )}
    </div>
  );
}

export function LanguageTopicArticle({ topicSlug, body: bodies }: { topicSlug: string; body: Record<Locale, ContentBlock[]> }) {
  const t = useTranslations();
  const { locale } = useLocale();

  const bottomRef = useRef<HTMLDivElement>(null);
  const readParams = useMemo(() => ({
    topic: topicSlug,
    content_language: locale,
  }), [topicSlug, locale]);
  useTrackReadComplete(bottomRef, 'language', 'article', readParams);

  const result = getLanguageTopic(topicSlug);
  if (!result) return <p>Article not found.</p>;

  const { domain, topic } = result;
  const body = bodies[locale];

  return (
    <>
      <section className={styles.hero} style={getHeroStyle(`lang/${topicSlug}`)}>
        <div className={styles.heroContent}>
          <p className={styles.eyebrow}>{domain.title[locale]}</p>
          <h1 className={styles.heroTitle}>{topic.title[locale]}</h1>
          <p className={styles.proverb} lang="dg">
            <em>{domain.proverb}</em>
          </p>
          <p className={styles.gloss}>{domain.proverbGloss}</p>
        </div>
      </section>

      <article className={styles.article}>
        <div className={styles.articleInner}>
          <ArticleBody body={body} />
          <div ref={bottomRef} />
        </div>
      </article>

      {domain.topics.length > 1 && (
        <section className={styles.relatedSection}>
          <div className={styles.relatedInner}>
            <p className={styles.relatedHeading}>
              {t.language.related_topics}
            </p>
            <div className={styles.relatedGrid}>
              {domain.topics
                .filter((tp) => tp.slug !== topicSlug)
                .slice(0, 3)
                .map((tp) => (
                  <a
                    key={tp.slug}
                    href={`/language/${tp.slug}`}
                    className={styles.relatedCard}
                    onClick={() => track('language', 'article', 'click_related', { topic: tp.slug })}
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
