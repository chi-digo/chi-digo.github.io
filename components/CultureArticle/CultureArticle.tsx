'use client';

import { useTranslations } from '@/lib/i18n/context';
import { useLocale } from '@/lib/i18n/context';
import { getTopic, type ContentBlock } from '@/lib/culture/content';
import styles from './CultureArticle.module.css';

function renderInlineMarkdown(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*)/g;
  let lastIndex = 0;
  let match;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    if (match[2]) {
      parts.push(<strong key={key++}>{match[2]}</strong>);
    } else if (match[3]) {
      parts.push(<em key={key++}>{match[3]}</em>);
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

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

export function TopicArticle({
  domainSlug,
  topicSlug,
}: {
  domainSlug: string;
  topicSlug: string;
}) {
  const t = useTranslations();
  const { locale } = useLocale();

  const result = getTopic(domainSlug, topicSlug);
  if (!result) return <p>Article not found.</p>;

  const { domain, topic } = result;
  const body = topic.body[locale];

  return (
    <>
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <p className={styles.eyebrow}>{domain.title[locale]}</p>
          <h1 className={styles.heroTitle}>{topic.title[locale]}</h1>
          <p className={styles.proverb} lang="dig">
            <em>{domain.proverb}</em>
          </p>
          <p className={styles.gloss}>{domain.proverbGloss}</p>
        </div>
      </section>

      <article className={styles.article}>
        <div className={styles.articleInner}>
          <ArticleBody body={body} />
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
