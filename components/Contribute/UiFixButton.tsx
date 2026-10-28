'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { TextArea, TextField } from '@chi-digo/design-system';
import { stringsReadOn, useLocale, useTranslations } from '@/lib/i18n/context';
import { takeResumeIntent, useContributionDraft } from '@/lib/contributions/client';
import { UI_DENIED, UI_KEY } from '@/lib/contributions/apply/ui';
import { track } from '@/lib/analytics/track';
import en from '@/lib/i18n/messages/en.json';
import sw from '@/lib/i18n/messages/sw.json';
import dg from '@/lib/i18n/messages/dg.json';
import { ContributionDialog } from './ContributionDialog';
import styles from './Contribute.module.css';

type Tree = Record<string, Record<string, unknown>>;
const FILES: Record<'en' | 'sw' | 'dg', Tree> = { en: en as unknown as Tree, sw: sw as unknown as Tree, dg: dg as unknown as Tree };
const value = (lang: 'en' | 'sw' | 'dg', key: string) => {
  const [s, k] = key.split('.');
  const v = FILES[lang][s]?.[k];
  return typeof v === 'string' ? v : '';
};

/**
 * "Fix a translation on this page" (spec 34 §17.12), in the footer of Swahili and Digo pages: pick a
 * string from the text this page shows, correct it, say what was wrong. It appears on the site after
 * two reviewers accept it and the next update folds it in.
 */
export function UiFixButton({ className }: { className?: string }) {
  const c = useTranslations().contribute;
  const { locale } = useLocale();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [keys, setKeys] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const draftKey = `ui_fix:${pathname}`;
  const [draft, setDraft, clear] = useContributionDraft(draftKey, { key: '', text: '', reason: '' });

  // After signing in from this form, reopen it with its draft.
  useEffect(() => {
    let live = true;
    Promise.resolve().then(() => {
      if (live && takeResumeIntent(pathname)?.form === 'ui_fix') setOpen(true);
    });
    return () => {
      live = false;
    };
  }, [pathname]);

  const lang = locale === 'en' ? null : locale;
  // The text this page showed, as the reader saw it (the English where a translation is empty).
  const items = useMemo(() => {
    if (!lang) return [];
    return keys
      .filter((k) => UI_KEY.test(k) && !UI_DENIED.includes(k.split('.')[0]))
      // Text with {name} parts is shown as written: the parts must stay when it's corrected.
      .map((k) => ({ key: k, seen: value(lang, k) || value('en', k) }))
      .filter((x) => x.seen)
      .filter((x) => !query.trim() || x.seen.toLowerCase().includes(query.trim().toLowerCase()));
  }, [keys, query, lang]);
  const shown = items.slice(0, 60);
  // The same text in several places: say which part of the site each one is in.
  const repeated = new Set(items.map((x) => x.seen).filter((t, i, all) => all.indexOf(t) !== i));
  if (!lang) return null;

  const chosen = draft.key;
  const english = chosen ? value('en', chosen) : '';
  const current = chosen ? value(lang, chosen) : '';
  const proposed = draft.text.trim();
  const reason = draft.reason.trim();
  const changed = chosen && proposed && proposed !== (current || english).trim();

  return (
    <>
      <button
        type="button"
        className={`${styles.footerButton} ${className ?? ''}`}
        onClick={() => {
          setKeys(stringsReadOn(window.location.pathname));
          track('contribute', 'ui', 'open', { path: pathname });
          setOpen(true);
        }}
      >
        {c.ui_fix_link}
      </button>
      <ContributionDialog
        open={open}
        onClose={() => setOpen(false)}
        type="translation_fix"
        title={c.ui_fix_title}
        intro={chosen ? c.ui_fix_note : c.ui_fix_intro}
        target={{ target_type: 'ui', target_id: pathname }}
        draftKey={draftKey}
        resume={{ form: 'ui_fix', target_id: pathname }}
        payload={changed && reason ? { lang, field: 'ui', key: chosen, proposed, reason } : null}
        askSource
        onSubmitted={clear}
      >
        {!chosen ? (
          <div>
            <TextField label={c.ui_fix_search} value={query} onChange={(e) => setQuery(e.target.value)} />
            <p className={styles.legend} aria-live="polite">
              {items.length > shown.length ? c.ui_fix_more.replace('{shown}', String(shown.length)).replace('{n}', String(items.length)) : ''}
            </p>
            {shown.length ? (
              <ul className={styles.uiList} aria-label={c.ui_fix_intro}>
                {shown.map((x) => (
                  <li key={x.key}>
                    <button type="button" className={styles.uiItem} onClick={() => setDraft({ key: x.key, text: x.seen, reason: '' })}>
                      {x.seen}
                      {repeated.has(x.seen) && <span className={styles.uiWhere}>{x.key.split('.')[0].replace(/_/g, ' ')}</span>}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={styles.legend}>{c.ui_fix_none}</p>
            )}
          </div>
        ) : (
          <>
            <button type="button" className={styles.textBtn} onClick={() => setDraft({ key: '', text: '', reason: '' })}>
              {c.ui_fix_back}
            </button>
            <details className={styles.source} open>
              <summary>{c.tf_source}</summary>
              <p lang="en">{english}</p>
            </details>
            {lang === 'dg' && value('sw', chosen) && (
              <details className={styles.source}>
                <summary>{c.tf_source_sw}</summary>
                <p lang="sw">{value('sw', chosen)}</p>
              </details>
            )}
            <TextArea label={c.tf_label} value={draft.text} onChange={(e) => setDraft({ text: e.target.value })} maxLength={600} rows={3} autoFocus />
            <TextField label={c.tf_reason} value={draft.reason} onChange={(e) => setDraft({ reason: e.target.value })} maxLength={300} />
          </>
        )}
      </ContributionDialog>
    </>
  );
}
