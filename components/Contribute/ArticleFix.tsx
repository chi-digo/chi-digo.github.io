'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useLocale, useTranslations } from '@/lib/i18n/context';
import { takeResumeIntent } from '@/lib/contributions/client';
import { applyAllToArticle, articlePath, articleSource, articleText, type ArticleData } from '@/lib/contributions/apply/articles';
import { articleOverlay, refreshArticleOverlay } from '@/lib/articles/overlay';
import { track } from '@/lib/analytics/track';
import type { TranslationField } from '@/lib/contributions/schemas';
import { TranslationFixForm, TranslationCredits, type FixOption } from './TranslationFixForm';
import styles from './Contribute.module.css';

type Target = { field: TranslationField; block?: string; label: string };

/**
 * "Something wrong in this translation? Fix it" on a Swahili or Digo article (spec 34 §17.11): the
 * article with its live fixes merged, the switch that shows a pencil on every fixable block, the fix
 * sheet, and the translation credits for the article's foot. English pages get none of it.
 */
export function useArticleFix<T extends ArticleData>(articleId: string, raw: T) {
  const { locale } = useLocale();
  const c = useTranslations().contribute;
  const [merged, setMerged] = useState<T>(raw);
  const [on, setOn] = useState(false);
  const [open, setOpen] = useState<Target | null>(null);
  const fixable = locale !== 'en';

  // Accepted fixes not yet folded into the files, merged after the page has rendered the published text.
  useEffect(() => {
    let live = true;
    articleOverlay().then((changes) => {
      if (live) setMerged(applyAllToArticle(raw, articleId, changes));
    });
    return () => {
      live = false;
    };
  }, [raw, articleId]);

  // After signing in from a fix sheet, reopen it on the same block with its draft.
  useEffect(() => {
    const intent = takeResumeIntent(articleId);
    if (intent?.form !== 'translation_fix' || !intent.extra?.key) return;
    const [field, block] = intent.extra.key.split(':');
    Promise.resolve().then(() => {
      setOn(true);
      setOpen({ field: field as TranslationField, block: block || undefined, label: '' });
    });
  }, [articleId]);

  const option = (t: Target): FixOption | null => {
    if (!fixable) return null;
    const path = articlePath(articleId, t.field, locale, t.block);
    const current = path ? articleText(merged, path) : null;
    if (!path || !current) return null;
    return {
      key: `${t.field}:${t.block ?? ''}`, label: t.label, field: t.field, block: t.block, lang: locale, current,
      source: articleSource(merged, path), swahili: locale === 'dg' ? articleSource(merged, path, 'sw') : null,
    };
  };

  /** A pencil for one block, shown only while fixing. */
  const pencil = (t: Target): ReactNode => {
    if (!on || !option(t)) return null;
    return (
      <button
        type="button"
        className={styles.pencil}
        aria-label={`${c.tf_pencil}: ${t.label}`}
        title={c.tf_pencil}
        onClick={() => {
          track('contribute', 'articles', 'open_fix', { article: articleId, field: t.field });
          setOpen(t);
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
        </svg>
      </button>
    );
  };

  const toggle: ReactNode = fixable ? (
    <p className={styles.fixToggle}>
      <button
        type="button"
        className={styles.textBtn}
        aria-pressed={on}
        onClick={() => {
          track('contribute', 'articles', on ? 'fix_mode_off' : 'fix_mode_on', { article: articleId });
          setOn((x) => !x);
        }}
      >
        {on ? c.tf_mode_off : c.tf_mode_on}
      </button>
    </p>
  ) : null;

  const chosen = open ? option(open) : null;
  const form: ReactNode = chosen ? (
    <TranslationFixForm
      open
      onClose={() => setOpen(null)}
      target={{ target_type: 'article', target_id: articleId }}
      options={[chosen]}
      onSubmitted={() => refreshArticleOverlay()}
    />
  ) : null;

  const credits: ReactNode = <TranslationCredits provenance={[merged.provenance]} />;

  return { merged, fixing: on, pencil, toggle, form, credits };
}
