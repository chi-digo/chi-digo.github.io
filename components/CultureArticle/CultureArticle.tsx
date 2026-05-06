'use client';

import { useTranslations } from '@/lib/i18n/context';
import { useLocale } from '@/lib/i18n/context';
import { getTopic, type ContentBlock } from '@/lib/culture/content';
import { Heading, Text, Stack, Card, Link, Divider } from '@chi-digo/design-system';
import styles from './CultureArticle.module.css';

function Footer() {
  const t = useTranslations();
  return (
    <footer className={styles.footer}>
      <div className={styles.footerInner}>
        <Text style={{ fontSize: 'var(--text-xs)', color: 'rgba(242, 234, 215, 0.4)' }}>
          {t.footer.copyright}
        </Text>
      </div>
    </footer>
  );
}

function ArticleBody({ body }: { body: ContentBlock[] }) {
  return (
    <Stack gap="var(--space-0)" className={styles.articleBody}>
      {body.map((block, i) =>
        block.type === 'heading' ? (
          <Heading key={i} level={3} className={styles.articleHeading}>
            {block.text}
          </Heading>
        ) : (
          <Text key={i} className={styles.bodyText}>
            {block.text}
          </Text>
        ),
      )}
    </Stack>
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

      <section className={styles.navSection}>
        <div className={styles.navInner}>
          <Divider style={{ marginBottom: 'var(--space-3)', opacity: 0.08 }} />
          <Link
            href={`/culture/${domain.slug}`}
            className={styles.backLink}
          >
            {t.culture.back_to_domain}
          </Link>
        </div>
      </section>

      {domain.topics.length > 1 && (
        <section className={styles.relatedSection}>
          <div className={styles.relatedInner}>
            <Heading level={2} className={styles.relatedHeading}>
              {t.culture.related_topics}
            </Heading>
            <div className={styles.relatedGrid}>
              {domain.topics
                .filter((tp) => tp.slug !== topicSlug)
                .slice(0, 3)
                .map((tp) => (
                  <Card
                    key={tp.slug}
                    padding="none"
                    style={{
                      background: 'rgba(242, 234, 215, 0.08)',
                      border: '1px solid rgba(242, 234, 215, 0.12)',
                      cursor: 'pointer',
                    }}
                  >
                    <a
                      href={`/culture/${domain.slug}/${tp.slug}`}
                      className={styles.relatedCard}
                    >
                      <Heading level={3} className={styles.relatedTitle}>
                        {tp.title[locale]}
                      </Heading>
                      <Text className={styles.relatedIntro}>
                        {tp.intro[locale]}
                      </Text>
                    </a>
                  </Card>
                ))}
            </div>
          </div>
        </section>
      )}

      <Footer />
    </>
  );
}
