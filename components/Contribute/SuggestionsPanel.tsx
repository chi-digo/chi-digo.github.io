'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth/context';
import { useTranslations } from '@/lib/i18n/context';
import { SignInSheet } from '@/components/SignInSheet/SignInSheet';
import { agree, msg, report } from '@/lib/contributions/client';
import type { TargetType } from '@/lib/contributions/schemas';
import { track } from '@/lib/analytics/track';
import styles from './Contribute.module.css';

export interface PublicSuggestion {
  id: string;
  type: string;
  region: string | null;
  confidence: string | null;
  agree_count: number;
  public_payload: Record<string, unknown>;
}

const REASONS = ['offensive', 'spam', 'personal_info', 'other'] as const;

/**
 * "Suggestions under review" for one item (product spec §6): anonymous, region only. Agree instead of
 * repeating a suggestion, say it differently, or report it.
 */
export function SuggestionsPanel({
  targetType,
  targetId,
  refreshKey,
  render,
  onDifferently,
}: {
  targetType: TargetType;
  targetId: string;
  /** Change to reload (e.g. after the reader submits). */
  refreshKey?: number;
  /** How to show one suggestion's content for this kind of item. */
  render: (s: PublicSuggestion) => React.ReactNode;
  onDifferently?: (s: PublicSuggestion) => void;
}) {
  // While the sign-in state is still loading, a signed-in reader must not be asked to sign in.
  const { user, loading: authLoading } = useAuth();
  const c = useTranslations().contribute;
  const [items, setItems] = useState<PublicSuggestion[]>([]);
  const [mine, setMine] = useState<{ agreed: string[]; reported: string[] }>({ agreed: [], reported: [] });
  const [reporting, setReporting] = useState<string | null>(null);
  const [signIn, setSignIn] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let live = true;
    fetch(`/api/contributions/public?target_type=${targetType}&target_id=${encodeURIComponent(targetId)}`)
      .then((res) => (res.ok ? res.json() : []))
      .then(async (list: PublicSuggestion[]) => {
        if (!live) return;
        setItems(list);
        if (user && list.length) {
          const m = await fetch(`/api/contributions/public/mine?ids=${list.map((i) => i.id).join(',')}`);
          if (m.ok && live) setMine(await m.json());
        }
      })
      .catch(() => {
        /* offline: show nothing */
      });
    return () => {
      live = false;
    };
  }, [targetType, targetId, user, refreshKey]);

  if (!items.length) return null;

  const needUser = () => {
    if (user) return false;
    setSignIn(true);
    return true;
  };

  const toggleAgree = async (s: PublicSuggestion) => {
    if (needUser() || busy) return;
    const on = !mine.agreed.includes(s.id);
    setBusy(s.id);
    const r = await agree(s.id, on);
    setBusy(null);
    if (r.status !== 200) {
      setError(msg(c, `error_${r.data.error}`) === `error_${r.data.error}` ? c.error_generic : msg(c, `error_${r.data.error}`));
      return;
    }
    track('contribute', 'panel', on ? 'agree' : 'unagree', { type: s.type });
    setError('');
    setItems((list) => list.map((i) => (i.id === s.id ? { ...i, agree_count: r.data.agree_count } : i)));
    setMine((m) => ({ ...m, agreed: on ? [...m.agreed, s.id] : m.agreed.filter((x) => x !== s.id) }));
  };

  const sendReport = async (s: PublicSuggestion, reason: (typeof REASONS)[number]) => {
    const r = await report(s.id, reason);
    setReporting(null);
    if (r.status !== 200) {
      setError(c.error_generic);
      return;
    }
    track('contribute', 'panel', 'report', { reason });
    setMine((m) => ({ ...m, reported: [...m.reported, s.id] }));
  };

  return (
    <section className={styles.panel} aria-labelledby={`suggestions-${targetId}`}>
      <h2 id={`suggestions-${targetId}`} className={styles.panelTitle}>{c.panel_title}</h2>
      <ul className={styles.panelList}>
        {items.map((s) => {
          const agreed = mine.agreed.includes(s.id);
          const reported = mine.reported.includes(s.id);
          return (
            <li key={s.id} className={styles.panelItem}>
              <div className={styles.panelContent}>{render(s)}</div>
              <p className={styles.panelMeta}>
                {s.region ? c.panel_by.replace('{region}', msg(c, `region_${s.region}`)) : null}
                {s.confidence && <span> · {msg(c, `confidence_${s.confidence}`)}</span>}
                {s.agree_count > 0 && <span> · {c.panel_agree_count.replace('{n}', String(s.agree_count))}</span>}
              </p>
              <div className={styles.panelActions}>
                <button type="button" className={`${styles.textBtn} ${agreed ? styles.textBtnOn : ''}`} aria-pressed={agreed} disabled={busy === s.id || authLoading} onClick={() => toggleAgree(s)}>
                  {agreed ? c.panel_agreed : c.panel_agree}
                </button>
                {onDifferently && (
                  <button type="button" className={styles.textBtn} onClick={() => onDifferently(s)}>
                    {c.panel_differently}
                  </button>
                )}
                {reported ? (
                  <span className={styles.panelMeta}>{c.panel_reported}</span>
                ) : (
                  <button
                    type="button"
                    className={styles.textBtn}
                    aria-expanded={reporting === s.id}
                    disabled={authLoading}
                    onClick={() => !needUser() && setReporting(reporting === s.id ? null : s.id)}
                  >
                    {c.panel_report}
                  </button>
                )}
              </div>
              {reporting === s.id && (
                <div className={styles.reportReasons} role="group" aria-label={c.report_title}>
                  {REASONS.map((r) => (
                    <button key={r} type="button" className={styles.chip} onClick={() => sendReport(s, r)}>
                      {msg(c, `report_${r}`)}
                    </button>
                  ))}
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {error && <p className={styles.error} role="alert">{error}</p>}
      <SignInSheet open={signIn} onClose={() => setSignIn(false)} title={c.sign_in_to_contribute} showBenefits={false} />
    </section>
  );
}
