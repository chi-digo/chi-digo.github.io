'use client';

import { useCallback, useEffect, useState } from 'react';
import { Badge, Button, Card, Checkbox, EmptyState, Skeleton, Tabs, TextArea } from '@chi-digo/design-system';
import { AuthGuard } from '@/components/AuthGuard';
import { useLocale, useTranslations } from '@/lib/i18n/context';
import { msg, useContributorStatus } from '@/lib/contributions/client';
import { payloadSummary, statusChip, CHIP_VARIANT } from '@/lib/contributions/display';
import { LIMITS, type Scope, type Status } from '@/lib/contributions/schemas';
import { track } from '@/lib/analytics/track';
import styles from './contributions.module.css';

interface Mine {
  id: string;
  type: string;
  target_label: string | null;
  payload: Record<string, unknown>;
  status: Status;
  live_status: string | null;
  outcome: string | null;
  review_note: string | null;
  reply: string | null;
  held: boolean;
  agree_count: number;
  created_at: string;
}

const OPEN: Status[] = ['pending', 'needs_info'];

function ApplyCard() {
  const c = useTranslations().contribute;
  const { status, refresh } = useContributorStatus();
  const [scopes, setScopes] = useState<Scope[]>([]);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  if (!status) return null;
  if (status.role === 'reviewer' || status.role === 'admin') {
    const names = status.role === 'admin' || status.scopes.includes('all')
      ? c.scope_all
      : status.scopes.map((s) => msg(c, `scope_${s}`)).join(', ');
    return <p className={styles.muted}>{c.you_are_reviewer.replace('{scopes}', names)}</p>;
  }

  const apply = async () => {
    setSending(true);
    setError('');
    const res = await fetch('/api/reviewer-applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scopes, message: message.trim() || undefined }),
    });
    setSending(false);
    if (!res.ok) {
      setError(c.error_generic);
      return;
    }
    track('contribute', 'apply', 'submit', { scopes: scopes.join(',') });
    refresh();
  };

  return (
    <Card padding="lg" elevated>
      <h2 className={styles.cardTitle}>{c.apply_title}</h2>
      {status.application?.status === 'pending' ? (
        <p className={styles.muted}>{c.apply_pending}</p>
      ) : status.can_apply_for.length ? (
        <div className={styles.applyForm}>
          {status.application?.status === 'declined' && (
            <p className={styles.muted}>
              {c.apply_declined}
              {status.application.decision_note && ` ${status.application.decision_note}`}
            </p>
          )}
          <p className={styles.muted}>
            {c.apply_body.replace('{scopes}', status.can_apply_for.map((s) => msg(c, `scope_${s}`)).join(', '))}
          </p>
          <div className={styles.scopeGrid}>
            {status.can_apply_for.map((s) => (
              <Checkbox
                key={s}
                label={msg(c, `scope_${s}`)}
                checked={scopes.includes(s)}
                onChange={(e) => setScopes((prev) => (e.target.checked ? [...prev, s] : prev.filter((x) => x !== s)))}
              />
            ))}
          </div>
          <TextArea label={c.apply_message} value={message} onChange={(e) => setMessage(e.target.value)} maxLength={2000} rows={3} />
          {error && <p className={styles.error}>{error}</p>}
          <div>
            <Button onClick={apply} loading={sending} disabled={!scopes.length}>{c.apply_button}</Button>
          </div>
        </div>
      ) : (
        <p className={styles.muted}>{c.apply_locked.replace('{n}', String(LIMITS.acceptedToApply))}</p>
      )}
    </Card>
  );
}

function Reply({ id, onDone }: { id: string; onDone: () => void }) {
  const c = useTranslations().contribute;
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const send = async () => {
    setSending(true);
    const res = await fetch(`/api/contributions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reply', reply: text.trim() }),
    });
    setSending(false);
    if (!res.ok) {
      setError(res.status === 400 ? c.error_invalid : c.error_generic);
      return;
    }
    track('contribute', 'mine', 'reply', {});
    onDone();
  };
  return (
    <div className={styles.reply}>
      <TextArea label={c.reply_label} value={text} onChange={(e) => setText(e.target.value)} maxLength={1000} rows={2} />
      {error && <p className={styles.error}>{error}</p>}
      <div>
        <Button size="sm" onClick={send} loading={sending} disabled={!text.trim()}>{c.reply_send}</Button>
      </div>
    </div>
  );
}

function ContributionList({ items, onChange }: { items: Mine[]; onChange: () => void }) {
  const c = useTranslations().contribute;
  const { locale } = useLocale();
  const dateLocale = locale === 'en' ? 'en-GB' : 'sw-KE';
  if (!items.length) return <EmptyState title={c.mine_empty} description={c.mine_empty_hint} />;

  const withdraw = async (id: string) => {
    if (!window.confirm(c.withdraw_confirm)) return;
    const res = await fetch(`/api/contributions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'withdraw' }),
    });
    if (res.ok) {
      track('contribute', 'mine', 'withdraw', {});
      onChange();
    }
  };

  return (
    <ul className={styles.list}>
      {items.map((item) => {
        const chip = statusChip(item);
        const summary = payloadSummary(item.payload);
        return (
          <li key={item.id} id={`c-${item.id}`} className={styles.item}>
            <div className={styles.itemHead}>
              <span className={styles.type}>{msg(c, `type_${item.type}`)}</span>
              <Badge variant={CHIP_VARIANT[chip]} size="sm">{msg(c, `status_${chip}`)}</Badge>
            </div>
            {item.target_label && <p className={styles.target}>{item.target_label}</p>}
            {summary && <p className={styles.summary}>{summary}</p>}
            {item.held && OPEN.includes(item.status) && <p className={styles.muted}>{c.held_note}</p>}
            {item.review_note && (
              <p className={styles.reviewNote}>
                <strong>{c.reviewer_note}:</strong> {item.review_note}
              </p>
            )}
            {item.reply && (
              <p className={styles.reviewNote}>
                <strong>{c.your_reply}:</strong> {item.reply}
              </p>
            )}
            {item.status === 'needs_info' && <Reply id={item.id} onDone={onChange} />}
            <div className={styles.itemFoot}>
              <span>{new Date(item.created_at).toLocaleDateString(dateLocale, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              {item.agree_count > 0 && <span>{c.agreements.replace('{n}', String(item.agree_count))}</span>}
              {OPEN.includes(item.status) && (
                <Button variant="ghost" size="sm" onClick={() => withdraw(item.id)}>{c.withdraw}</Button>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function ContributionsContent() {
  const c = useTranslations().contribute;
  const [items, setItems] = useState<Mine[] | null>(null);
  const [failed, setFailed] = useState(false);

  const load = useCallback(() => {
    fetch('/api/contributions?mine=1')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setItems)
      .catch(() => setFailed(true));
  }, []);

  useEffect(() => {
    load();
    track('contribute', 'mine', 'view_mine', {});
  }, [load]);

  const open = (items ?? []).filter((i) => OPEN.includes(i.status));
  const decided = (items ?? []).filter((i) => !OPEN.includes(i.status));

  return (
    <main className={styles.page}>
      <div className={styles.content}>
        <header className={styles.header}>
          <h1 className={styles.title}>{c.mine_title}</h1>
          <p className={styles.muted}>{c.mine_intro}</p>
        </header>

        {failed ? (
          <p className={styles.error}>{c.error_generic}</p>
        ) : items === null ? (
          <div className={styles.list}>
            {[0, 1, 2].map((i) => <Skeleton key={i} height="88px" />)}
          </div>
        ) : (
          <Tabs
            items={[
              { id: 'all', label: `${c.filter_all} (${items.length})`, content: <ContributionList items={items} onChange={load} /> },
              { id: 'open', label: `${c.filter_open} (${open.length})`, content: <ContributionList items={open} onChange={load} /> },
              { id: 'done', label: `${c.filter_done} (${decided.length})`, content: <ContributionList items={decided} onChange={load} /> },
            ]}
          />
        )}

        <ApplyCard />
      </div>
    </main>
  );
}

export default function ContributionsPage() {
  return (
    <AuthGuard>
      <ContributionsContent />
    </AuthGuard>
  );
}
