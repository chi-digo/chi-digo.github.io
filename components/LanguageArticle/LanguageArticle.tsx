'use client';

import { useRef, useMemo, useState, useEffect, useCallback } from 'react';
import { useTranslations, useLocale } from '@/lib/i18n/context';
import { getLanguageTopic, type ContentBlock } from '@/lib/language/content';
import { track } from '@/lib/analytics/track';
import { useTrackReadComplete } from '@/hooks/useTrackReadComplete';
import { getHeroStyle } from '@/lib/images/hero-images';
import styles from './LanguageArticle.module.css';

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

/** Extract headings from body blocks for the TOC */
function extractHeadings(body: ContentBlock[]): { text: string; index: number }[] {
  return body
    .map((block, index) => (block.type === 'heading' ? { text: block.text, index } : null))
    .filter(Boolean) as { text: string; index: number }[];
}

/** Slugify a heading to use as an id */
function headingId(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function ArticleBody({ body }: { body: ContentBlock[] }) {
  return (
    <div className={styles.articleBody}>
      {body.map((block, i) =>
        block.type === 'heading' ? (
          <h3
            key={i}
            id={headingId(block.text)}
            className={styles.articleHeading}
          >
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

function ReadingProgress({ articleRef }: { articleRef: React.RefObject<HTMLElement | null> }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const update = () => {
      const el = articleRef.current;
      if (!el) return;
      const { top, height } = el.getBoundingClientRect();
      const windowH = window.innerHeight;
      const scrolled = Math.max(0, windowH - top);
      const pct = Math.min(100, (scrolled / height) * 100);
      setProgress(pct);
    };

    window.addEventListener('scroll', update, { passive: true });
    update();
    return () => window.removeEventListener('scroll', update);
  }, [articleRef]);

  return (
    <div className={styles.progressBar} aria-hidden="true">
      <div className={styles.progressFill} style={{ width: `${progress}%` }} />
    </div>
  );
}

function Sidebar({
  headings,
  activeId,
}: {
  headings: { text: string; index: number }[];
  activeId: string;
}) {
  const scrollTo = useCallback((text: string) => {
    const id = headingId(text);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }, []);

  if (headings.length === 0) return null;

  return (
    <aside className={styles.sidebar} aria-label="Table of contents">
      <nav className={styles.tocBlock}>
        <p className={styles.tocLabel}>Contents</p>
        <ul className={styles.tocList} role="list">
          {headings.map((h) => {
            const id = headingId(h.text);
            return (
              <li key={id}>
                <button
                  className={`${styles.tocItem} ${activeId === id ? styles.tocItemActive : ''}`}
                  onClick={() => scrollTo(h.text)}
                  aria-current={activeId === id ? 'true' : undefined}
                >
                  {h.text}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}

export function LanguageTopicArticle({ topicSlug }: { topicSlug: string }) {
  const t = useTranslations();
  const { locale } = useLocale();

  const result = getLanguageTopic(topicSlug);
  if (!result) return <p>Article not found.</p>;

  const { domain, topic } = result;
  const body = topic.body[locale];

  const articleRef = useRef<HTMLElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const readParams = useMemo(() => ({
    topic: topicSlug,
    content_language: locale,
  }), [topicSlug, locale]);
  useTrackReadComplete(bottomRef, 'language', 'article', readParams);

  const headings = useMemo(() => extractHeadings(body), [body]);

  const [activeId, setActiveId] = useState(() =>
    headings.length > 0 ? headingId(headings[0].text) : ''
  );

  useEffect(() => {
    if (headings.length === 0) return;

    const ids = headings.map((h) => headingId(h.text));
    const observers: IntersectionObserver[] = [];

    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveId(id);
        },
        { rootMargin: '-20% 0px -70% 0px' }
      );
      obs.observe(el);
      observers.push(obs);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, [headings]);

  return (
    <>
      {/* Hero */}
      <section
        className={styles.hero}
        style={getHeroStyle(`lang/${topicSlug}`)}
        aria-label={`Hero: ${topic.title[locale]}`}
      >
        <div className={styles.heroOverlay} />
        <div className={styles.heroContent}>
          <div className={styles.heroLeft}>
            <p className={styles.eyebrow}>{domain.title[locale]}</p>
            <h1 className={styles.heroTitle}>{topic.title[locale]}</h1>
          </div>
          <div className={styles.heroRight}>
            <div className={styles.proverbBlock}>
              <p className={styles.proverb} lang="dig">
                <em>{domain.proverb}</em>
              </p>
              <p className={styles.gloss}>{domain.proverbGloss}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Reading progress */}
      <ReadingProgress articleRef={articleRef} />

      {/* Article */}
      <article className={styles.article} ref={articleRef}>
        <div className={styles.articleInner}>
          <ArticleBody body={body} />
          <Sidebar headings={headings} activeId={activeId} />
          <div ref={bottomRef} />
        </div>
      </article>

      {/* Related topics */}
      {domain.topics.length > 1 && (
        <section className={styles.relatedSection} aria-label="Related topics">
          <div className={styles.relatedInner}>
            <div className={styles.relatedHeader}>
              <p className={styles.relatedHeading}>
                {t.language.related_topics}
              </p>
              <hr className={styles.relatedRule} />
            </div>
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
                    <p className={styles.relatedEyebrow}>Language</p>
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
