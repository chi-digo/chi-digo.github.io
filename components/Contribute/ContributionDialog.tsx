'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { BottomSheet, Button, Checkbox, Select, TextArea, TextField, useReducedMotion } from '@chi-digo/design-system';
import { useAuth } from '@/lib/auth/context';
import { useLocale, useTranslations } from '@/lib/i18n/context';
import { TrackedLink } from '@/components/Analytics/TrackedLink';
import { SignInSheet } from '@/components/SignInSheet/SignInSheet';
import {
  agree, msg, setResumeIntent, submitContribution, useContributionDraft, useOnline,
  type ResumeIntent, type Target,
} from '@/lib/contributions/client';
import { REGIONS, type ContributionType, type Region } from '@/lib/contributions/schemas';
import { track } from '@/lib/analytics/track';
import styles from './Contribute.module.css';

const REGION_KEY = 'contrib-region';

interface Common {
  region: Region | '';
  village: string;
  confidence: 'native' | 'heard' | 'unsure';
  note: string;
  credit: boolean;
}

interface ContributionDialogProps {
  open: boolean;
  onClose: () => void;
  type: ContributionType;
  title: string;
  intro?: string;
  target?: Target;
  /** Identifies the draft (e.g. `plant_name:mnazi`), so each form keeps its own. */
  draftKey: string;
  /** What to reopen after a signed-out user signs in. */
  resume: ResumeIntent;
  /** The type-specific fields, first (the main field leads). */
  children: ReactNode;
  /** The payload from the type-specific fields; null while incomplete. */
  payload: Record<string, unknown> | null;
  /** Ask where it's said and how the contributor knows (names and content; not feedback). */
  askSource?: boolean;
  /** Called after a successful submission (clear the type-specific draft, refresh panels). */
  onSubmitted?: () => void;
}

type Done = 'public' | 'held' | 'feedback' | 'agreed';

function storedRegion(): Region | '' {
  try {
    const r = localStorage.getItem(REGION_KEY);
    return r && (REGIONS as readonly string[]).includes(r) ? (r as Region) : '';
  } catch {
    return '';
  }
}

/**
 * The shell every contribution form shares (spec 34 technical §7.2): the common fields, sign-in on
 * submit with the draft kept, the similar-name step, errors and the thank-you state. Always a bottom
 * sheet, like the app's other sheets (sign-in, favourites): it slides up on open and down on close.
 */
export function ContributionDialog(props: ContributionDialogProps) {
  // Mounted only while open, so every opening starts clean and reads the saved draft once.
  return props.open ? <OpenDialog {...props} /> : null;
}

function OpenDialog({
  onClose, type, title, intro, target, draftKey, resume, children, payload, askSource = false, onSubmitted,
}: ContributionDialogProps) {
  const { user, loading: authLoading } = useAuth();
  const t = useTranslations();
  const c = t.contribute;
  const { locale } = useLocale();
  // Slide in after the first frame and out before unmounting, as the always-mounted sheets do.
  const reducedMotion = useReducedMotion();
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, []);
  const closing = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (closing.current) clearTimeout(closing.current);
  }, []);
  const close = useCallback(() => {
    if (closing.current) return;
    setShown(false);
    closing.current = setTimeout(onClose, reducedMotion ? 0 : 300);
  }, [onClose, reducedMotion]);
  const online = useOnline();

  const [common, setCommon, clearCommon] = useContributionDraft<Common>(`${draftKey}:common`, {
    region: storedRegion(), village: '', confidence: 'native', note: '', credit: false,
  });
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState<Done | null>(null);
  const isProverb = type.startsWith('proverb_');
  const [similar, setSimilar] = useState<{ id?: string; name: string; href?: string } | null>(null);
  const [signIn, setSignIn] = useState(false);

  useEffect(() => {
    track('contribute', 'form', 'open', { type, target: target?.target_id ?? '' });
    // Once per opening.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const firstName = useMemo(() => {
    const full = (user?.user_metadata?.full_name || user?.user_metadata?.name || '') as string;
    return full.split(' ')[0] || '';
  }, [user]);

  const regionLabel = common.region ? msg(c, `region_${common.region}`) : '';
  const finish = (kind: Done) => {
    setDone(kind);
    clearCommon();
    onSubmitted?.();
  };

  const send = async (forceNew = false) => {
    if (!payload) return;
    if (!user) {
      setResumeIntent(resume);
      track('contribute', 'form', 'sign_in_prompt', { type });
      setSignIn(true);
      return;
    }
    setSending(true);
    setError('');
    const result = await submitContribution({
      type,
      payload,
      locale,
      credit_opt_in: askSource ? common.credit : false,
      ...(common.note.trim() && { note: common.note.trim() }),
      ...(askSource && common.region && { region: common.region }),
      ...(askSource && common.village.trim() && { village: common.village.trim() }),
      ...(askSource && { confidence: common.confidence }),
      ...(forceNew && { force_new: true }),
      ...target,
    });
    setSending(false);
    if (!result.ok) {
      if (result.error === 'unauthorized') {
        setResumeIntent(resume);
        setSignIn(true);
        return;
      }
      setError(msg(c, `error_${result.error}`) === `error_${result.error}` ? c.error_generic : msg(c, `error_${result.error}`));
      track('contribute', 'form', 'submit_error', { type, error: result.error.slice(0, 40) });
      return;
    }
    if ('similar' in result) {
      setSimilar(result.similar);
      return;
    }
    track('contribute', 'form', 'submit_success', { type, held: result.held });
    finish(type === 'general_feedback' || type === 'entry_flag' ? 'feedback' : result.held ? 'held' : 'public');
  };

  const agreeWithSimilar = async () => {
    if (!similar?.id) return;
    setSending(true);
    const r = await agree(similar.id, true, common.region ? { region: common.region, confidence: common.confidence } : undefined);
    setSending(false);
    if (r.status !== 200) {
      setError(msg(c, `error_${r.data.error}`) === `error_${r.data.error}` ? c.error_generic : msg(c, `error_${r.data.error}`));
      return;
    }
    track('contribute', 'form', 'agree', { type, via: 'similar' });
    finish('agreed');
  };

  const thanks: Record<Done, string> = {
    public: c.thanks_public,
    held: c.thanks_held,
    feedback: c.thanks_feedback,
    agreed: c.thanks_agreed,
  };

  let body: ReactNode;
  let actions: ReactNode;
  if (done) {
    body = (
      <div className={styles.thanks} role="status">
        <p className={styles.thanksTitle}>{c.thanks_title}</p>
        <p>{thanks[done]}</p>
        {done !== 'agreed' && (
          <TrackedLink href="/profile/contributions" source="contribute_thanks" className={styles.link} onClick={close}>
            {c.view_mine}
          </TrackedLink>
        )}
      </div>
    );
    actions = <Button variant="secondary" onClick={close}>{c.close}</Button>;
  } else if (similar?.href) {
    // A new word that may already be in the dictionary: open it, or add this one anyway.
    body = (
      <div className={styles.form}>
        <p className={styles.thanksTitle}>{isProverb ? c.pv_similar_title : c.similar_entry_title}</p>
        <p>{(isProverb ? c.pv_similar_body : c.similar_entry_body).replace('{name}', similar.name)}</p>
        {error && <p className={styles.error} role="alert">{error}</p>}
      </div>
    );
    actions = (
      <>
        <Button variant="ghost" onClick={() => send(true)} loading={sending}>{isProverb ? c.pv_similar_add : c.similar_entry_add}</Button>
        <TrackedLink href={similar.href} source="contribute_similar_entry" className={styles.link} onClick={close}>
          {isProverb ? c.pv_similar_open : c.similar_entry_open}
        </TrackedLink>
      </>
    );
  } else if (similar) {
    body = (
      <div className={styles.form}>
        <p className={styles.thanksTitle}>{c.similar_title}</p>
        <p>{c.similar_body.replace('{name}', similar.name)}</p>
        {error && <p className={styles.error} role="alert">{error}</p>}
      </div>
    );
    actions = (
      <>
        <Button variant="ghost" onClick={() => send(true)} loading={sending}>{c.similar_no}</Button>
        <Button variant="primary" onClick={agreeWithSimilar} loading={sending}>{c.similar_yes}</Button>
      </>
    );
  } else {
    body = (
      <div className={styles.form}>
        {intro && <p className={styles.intro}>{intro}</p>}
        {children}
        {askSource && (
          <>
            <Select
              label={c.region_label}
              value={common.region}
              placeholder="—"
              onChange={(v) => {
                setCommon({ region: v as Region });
                try {
                  localStorage.setItem(REGION_KEY, v);
                } catch {
                  /* not kept */
                }
              }}
              options={REGIONS.map((r) => ({ value: r, label: msg(c, `region_${r}`) }))}
            />
            <TextField label={c.village_label} value={common.village} onChange={(e) => setCommon({ village: e.target.value })} maxLength={120} />
            <fieldset className={styles.confidence}>
              <legend className={styles.legend} id={`${draftKey}-confidence`}>{c.confidence_label}</legend>
              <div
                role="radiogroup"
                aria-labelledby={`${draftKey}-confidence`}
                className={styles.confidenceRow}
                onKeyDown={(e) => {
                  // Arrow keys move the choice, as in any radio group.
                  const order = ['native', 'heard', 'unsure'] as const;
                  const i = order.indexOf(common.confidence);
                  const step = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
                  if (!step) return;
                  e.preventDefault();
                  const next = order[(i + step + order.length) % order.length];
                  setCommon({ confidence: next });
                  (e.currentTarget.querySelector(`[data-value="${next}"]`) as HTMLElement | null)?.focus();
                }}
              >
                {(['native', 'heard', 'unsure'] as const).map((k) => (
                  <button
                    key={k}
                    type="button"
                    role="radio"
                    data-value={k}
                    aria-checked={common.confidence === k}
                    tabIndex={common.confidence === k ? 0 : -1}
                    className={`${styles.confidenceBtn} ${common.confidence === k ? styles.confidenceOn : ''}`}
                    onClick={() => setCommon({ confidence: k })}
                  >
                    {msg(c, `confidence_${k}`)}
                  </button>
                ))}
              </div>
            </fieldset>
            <TextArea label={c.note_label} value={common.note} onChange={(e) => setCommon({ note: e.target.value })} maxLength={2000} rows={2} />
            <div>
              <Checkbox label={c.credit_label} checked={common.credit} onChange={(e) => setCommon({ credit: e.target.checked })} />
              <p className={styles.preview} aria-live="polite">
                {common.credit && firstName
                  ? c.credit_preview_named.replace('{name}', firstName).replace(' · {region}', regionLabel ? ` · ${regionLabel}` : '')
                  : c.credit_preview_anon}
              </p>
            </div>
          </>
        )}
        {error && <p className={styles.error} role="alert">{error}</p>}
      </div>
    );
    actions = (
      <>
        {!online && <p className={styles.offlineNote} role="status">{c.offline}</p>}
        <Button variant="ghost" onClick={close}>{c.cancel}</Button>
        <Button
          variant="primary"
          onClick={() => send()}
          loading={sending}
          disabled={!payload || !online || authLoading}
          aria-disabled={!payload || !online || authLoading}
        >
          {c.submit}
        </Button>
      </>
    );
  }

  return (
    <>
      <BottomSheet open={shown} onClose={close} title={title} size="content">
        <div className={styles.sheet}>
          {body}
          <div className={styles.sheetActions}>{actions}</div>
        </div>
      </BottomSheet>
      <SignInSheet
        open={signIn}
        onClose={() => {
          // Closing without signing in: don't reopen this form on a later visit.
          setResumeIntent(null);
          setSignIn(false);
        }}
        title={c.sign_in_to_contribute}
        showBenefits={false}
      />
    </>
  );
}
