'use client';

import { useRef, useMemo } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from '@/lib/i18n/context';
import type { Locale } from '@/lib/i18n/config';
import type { FigureArticle as Article, FigureFile } from '@/lib/articles/types';
import { useArticleFix } from '@/components/Contribute/ArticleFix';
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

export function FigureArticle({ figure, articles, raw, scene }: { figure: Figure; articles: Record<Locale, Article>; raw: FigureFile; scene?: string }) {
  const t = useTranslations();
  const { locale } = useLocale();
  const a = articles[locale];
  // The subtitle and body carry their ids and live fixes (spec 34 §17.11); sources and meta don't change here.
  const fix = useArticleFix(`figures/${figure.slug}`, raw);
  const subtitle = fix.merged.subtitle?.[locale] ?? a.subtitle;
  const bottomRef = useRef<HTMLDivElement>(null);
  const readParams = useMemo(() => ({ figure: figure.slug, content_language: locale }), [figure.slug, locale]);
  useTrackReadComplete(bottomRef, 'history', 'figure', readParams);

  return (
    <>
      <section
        className={`${styles.hero} ${scene ? own.sceneHero : ''}`}
        style={
          scene
            ? { backgroundImage: `linear-gradient(to bottom, rgba(14,26,42,0.05) 0%, rgba(14,26,42,0.15) 45%, rgba(14,26,42,0.88) 100%), url(${scene})` }
            : getHeroStyle('history-index')
        }
      >
        <div className={styles.heroContent}>
          <p className={styles.eyebrow}><Link href="/history/figures" className={own.eyebrowLink}>{t.history.figures_heading}</Link></p>
          <h1 className={styles.heroTitle}>{figure.name}</h1>
          <p className={own.role}>{figure.role[locale]} · {figure.era[locale]} · {figure.region}</p>
        </div>
        {scene && <span className={own.sceneCredit}>{t.history.figure_scene_credit}</span>}
      </section>
      <article className={styles.article}>
        <div className={styles.articleInner}>
          {fix.toggle}
          {subtitle && <p className={own.subtitle}>{subtitle}{fix.pencil({ field: 'subtitle', label: t.contribute.tf_subtitle })}</p>}
          <ArticleBody
            blocks={fix.merged.blocks}
            locale={locale}
            pencil={(b) => fix.pencil({ field: 'block', block: b.id, label: t.contribute[`tf_block_${b.type}`] })}
          />
          {a.sources.length > 0 && (
            <section className={own.sources}>
              <h2 className={own.sourcesHeading}>{t.history.figure_sources}</h2>
              <ol>{a.sources.map((s, i) => <Source key={i} text={s} />)}</ol>
            </section>
          )}
          {fix.toggle}
          {fix.credits}
          {fix.form}
          <p className={own.back}><Link href="/history">{t.history.back_to_history}</Link></p>
          <div ref={bottomRef} />
        </div>
      </article>
    </>
  );
}
