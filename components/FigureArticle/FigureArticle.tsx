'use client';

import { useRef, useMemo } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from '@/lib/i18n/context';
import type { Locale } from '@/lib/i18n/config';
import type { FigureArticle as Article } from '@/lib/history/figure-articles';
import type { Figure } from '@/lib/history/figures';
import { ArticleBody, renderInlineMarkdown } from '@/components/HistoryArticle/HistoryArticle';
import { useTrackReadComplete } from '@/hooks/useTrackReadComplete';
import { getHeroStyle } from '@/lib/images/hero-images';
import styles from '@/components/HistoryArticle/HistoryArticle.module.css';
import own from './FigureArticle.module.css';

const URL = /(https?:\/\/[^\s)]+)/g;

function Source({ text }: { text: string }) {
  return (
    <li>
      {text.split(URL).map((part, i) =>
        URL.test(part) ? (
          <a key={i} href={part} target="_blank" rel="noopener noreferrer">{part}</a>
        ) : (
          <span key={i}>{renderInlineMarkdown(part)}</span>
        ),
      )}
    </li>
  );
}

export function FigureArticle({ figure, articles }: { figure: Figure; articles: Record<Locale, Article> }) {
  const t = useTranslations();
  const { locale } = useLocale();
  const a = articles[locale];
  const bottomRef = useRef<HTMLDivElement>(null);
  const readParams = useMemo(() => ({ figure: figure.slug, content_language: locale }), [figure.slug, locale]);
  useTrackReadComplete(bottomRef, 'history', 'figure', readParams);

  return (
    <>
      <section className={styles.hero} style={getHeroStyle('history-index')}>
        <div className={styles.heroContent}>
          <p className={styles.eyebrow}>{t.history.figures_heading}</p>
          <h1 className={styles.heroTitle}>{figure.name}</h1>
          <p className={own.role}>{figure.role[locale]} · {figure.era[locale]} · {figure.region}</p>
        </div>
      </section>
      <article className={styles.article}>
        <div className={styles.articleInner}>
          {a.subtitle && <p className={own.subtitle}>{a.subtitle}</p>}
          <ArticleBody body={a.body} />
          {a.sources.length > 0 && (
            <section className={own.sources}>
              <h2 className={own.sourcesHeading}>{t.history.figure_sources}</h2>
              <ol>{a.sources.map((s, i) => <Source key={i} text={s} />)}</ol>
            </section>
          )}
          <p className={own.back}><Link href="/history">{t.history.back_to_history}</Link></p>
          <div ref={bottomRef} />
        </div>
      </article>
    </>
  );
}
