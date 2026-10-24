'use client';

import { useCallback, useEffect, useState } from 'react';
import { Badge, Button, Checkbox, Skeleton, TextField } from '@chi-digo/design-system';
import { AuthGuard } from '@/components/AuthGuard';
import { useLocale, useTranslations } from '@/lib/i18n/context';
import { msg, useContributorStatus } from '@/lib/contributions/client';
import { REVIEW_SCOPES, type ReviewScope } from '@/lib/contributions/schemas';
import { track } from '@/lib/analytics/track';
import styles from '../admin.module.css';

interface AdminUser {
  id: string;
  email: string | null;
  display_name: string | null;
  first_name: string | null;
  role: 'member' | 'reviewer' | 'admin';
  blocked: boolean;
  scopes: ReviewScope[];
  languages: ('sw' | 'dg')[];
  granted_at: string | null;
  submitted: number;
  accepted: number;
  reviews: number;
}

interface Application {
  id: string;
  scopes: ReviewScope[];
  message: string | null;
  created_at: string;
  user: AdminUser | null;
}

async function post(path: string, body: unknown) {
  const res = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  return res.ok;
}

/** Rows remount when the person's saved state changes, so their checkboxes always start from it. */
function rowKey(u: AdminUser) {
  return `${u.id}:${u.role}:${u.blocked}:${[...u.scopes].sort().join(',')}:${[...u.languages].sort().join(',')}`;
}

function nameOf(u: AdminUser) {
  return u.display_name || u.first_name || u.email || '—';
}

/** One person: track record, review scopes, and the actions that apply to their role. */
function UserRow({ user, onChange }: { user: AdminUser; onChange: (message: string) => void }) {
  const t = useTranslations();
  const a = t.admin;
  const c = t.contribute;
  const { locale } = useLocale();
  const [scopes, setScopes] = useState<ReviewScope[]>(user.scopes);
  const [languages, setLanguages] = useState<('sw' | 'dg')[]>(user.languages);
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState(user.email);

  const run = async (fn: () => Promise<boolean>, event: string) => {
    setBusy(true);
    const ok = await fn();
    setBusy(false);
    if (ok) track('contribute', 'admin', event, {});
    onChange(ok ? a.saved : a.error);
  };

  const toggle = (s: ReviewScope, on: boolean) => {
    if (s === 'all') return setScopes(on ? ['all'] : []);
    setScopes((prev) => (on ? [...prev.filter((x) => x !== 'all'), s] : prev.filter((x) => x !== s)));
  };

  const reveal = async () => {
    const res = await fetch(`/api/admin/reviewers?reveal=${user.id}`);
    const data = res.ok ? await res.json() : null;
    if (data?.revealed?.email) setEmail(data.revealed.email);
  };

  const record = a.record
    .replace('{submitted}', String(user.submitted))
    .replace('{accepted}', String(user.accepted))
    .replace('{reviews}', String(user.reviews));

  return (
    <li className={styles.row}>
      <div className={styles.rowHead}>
        <strong>{nameOf(user)}</strong>
        <Badge size="sm" variant={user.role === 'admin' ? 'editorial' : user.role === 'reviewer' ? 'success' : 'default'}>
          {msg(a, `role_${user.role}`)}
        </Badge>
        {user.blocked && <Badge size="sm" variant="error">{a.blocked}</Badge>}
      </div>
      <p className={styles.muted}>
        {email ?? '—'}{' '}
        {email?.includes('•') && (
          <button type="button" className={styles.textBtn} onClick={reveal}>{a.reveal}</button>
        )}
      </p>
      <p className={styles.muted}>
        {record}
        {user.granted_at && ` · ${a.since.replace('{date}', new Date(user.granted_at).toLocaleDateString(locale === 'en' ? 'en-GB' : 'sw-KE'))}`}
      </p>

      {user.role !== 'admin' && !user.blocked && (
        <fieldset className={styles.scopes}>
          <legend className={styles.legend}>{a.scopes_label}</legend>
          {REVIEW_SCOPES.map((s) => (
            <Checkbox key={s} label={msg(c, `scope_${s}`)} checked={scopes.includes(s)} onChange={(e) => toggle(s, e.target.checked)} />
          ))}
        </fieldset>
      )}
      {user.role !== 'admin' && !user.blocked && (
        <fieldset className={styles.scopes}>
          <legend className={styles.legend}>{a.languages_label}</legend>
          {(['sw', 'dg'] as const).map((l) => (
            <Checkbox
              key={l}
              label={msg(c, `lang_${l}`)}
              checked={languages.includes(l)}
              onChange={(e) => setLanguages((prev) => (e.target.checked ? [...prev, l] : prev.filter((x) => x !== l)))}
            />
          ))}
        </fieldset>
      )}

      <div className={styles.actions}>
        {user.role !== 'admin' && !user.blocked && (
          <Button
            size="sm"
            disabled={!scopes.length}
            loading={busy}
            onClick={() => run(() => post('/api/admin/reviewers', { action: 'grant', user_id: user.id, scopes, languages }), user.role === 'reviewer' ? 'update_scopes' : 'grant')}
          >
            {user.role === 'reviewer' ? a.save_scopes : a.make_reviewer}
          </Button>
        )}
        {user.role === 'reviewer' && !user.blocked && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => window.confirm(a.remove_confirm.replace('{name}', nameOf(user))) && run(() => post('/api/admin/reviewers', { action: 'remove', user_id: user.id }), 'remove')}
          >
            {a.remove}
          </Button>
        )}
        {user.role !== 'admin' && (
          <Button
            size="sm"
            variant={user.blocked ? 'secondary' : 'ghost'}
            onClick={() =>
              (user.blocked || window.confirm(a.block_confirm.replace('{name}', nameOf(user)))) &&
              run(() => post(`/api/admin/users/${user.id}/block`, { blocked: !user.blocked }), user.blocked ? 'unblock' : 'block')
            }
          >
            {user.blocked ? a.unblock : a.block}
          </Button>
        )}
      </div>
    </li>
  );
}

function ApplicationRow({ app, onChange }: { app: Application; onChange: (message: string) => void }) {
  const t = useTranslations();
  const a = t.admin;
  const c = t.contribute;
  const [scopes, setScopes] = useState<ReviewScope[]>(app.scopes);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const toggle = (s: ReviewScope, on: boolean) => {
    if (s === 'all') return setScopes(on ? ['all'] : []);
    setScopes((prev) => (on ? [...prev.filter((x) => x !== 'all'), s] : prev.filter((x) => x !== s)));
  };
  const decide = async (decision: 'approve' | 'decline') => {
    if (busy) return;
    setBusy(true);
    const ok = await post('/api/admin/applications', { id: app.id, decision, scopes, note: note.trim() || undefined });
    setBusy(false);
    if (ok) track('contribute', 'admin', `application_${decision}`, {});
    onChange(ok ? a.saved : a.error);
  };
  return (
    <li className={styles.row}>
      <div className={styles.rowHead}>
        <strong>{app.user ? nameOf(app.user) : '—'}</strong>
      </div>
      {app.user && (
        <p className={styles.muted}>
          {a.record.replace('{submitted}', String(app.user.submitted)).replace('{accepted}', String(app.user.accepted)).replace('{reviews}', String(app.user.reviews))}
        </p>
      )}
      {app.message && <p className={styles.quote}>“{app.message}”</p>}
      <fieldset className={styles.scopes}>
        <legend className={styles.legend}>{a.scopes_label}</legend>
        {REVIEW_SCOPES.map((s) => (
          <Checkbox key={s} label={msg(c, `scope_${s}`)} checked={scopes.includes(s)} onChange={(e) => toggle(s, e.target.checked)} />
        ))}
      </fieldset>
      <TextField label={a.decline_note} value={note} onChange={(e) => setNote(e.target.value)} maxLength={2000} />
      <div className={styles.actions}>
        <Button size="sm" onClick={() => decide('approve')} disabled={!scopes.length} loading={busy}>{a.approve}</Button>
        <Button size="sm" variant="ghost" onClick={() => decide('decline')} disabled={busy}>{a.decline}</Button>
      </div>
    </li>
  );
}

function ReviewersAdmin() {
  const a = useTranslations().admin;
  const [lists, setLists] = useState<{ admins: AdminUser[]; reviewers: AdminUser[]; blocked: AdminUser[] } | null>(null);
  const [apps, setApps] = useState<Application[]>([]);
  const [q, setQ] = useState('');
  const [results, setResults] = useState<AdminUser[] | null>(null);
  const [message, setMessage] = useState<{ text: string; n: number }>({ text: '', n: 0 });
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let live = true;
    Promise.all([
      fetch('/api/admin/reviewers').then((r) => (r.ok ? r.json() : null)),
      fetch('/api/admin/applications').then((r) => (r.ok ? r.json() : [])),
    ]).then(([l, ap]) => {
      if (!live) return;
      setLists(l);
      setApps(ap ?? []);
    });
    return () => {
      live = false;
    };
  }, [version]);

  const search = useCallback(async () => {
    if (q.trim().length < 2) return;
    const res = await fetch(`/api/admin/reviewers?q=${encodeURIComponent(q.trim())}`);
    setResults(res.ok ? (await res.json()).results : []);
    track('contribute', 'admin', 'search', {});
  }, [q]);

  const changed = (m: string) => {
    // A counter makes a repeated "Saved." a new announcement for screen readers.
    setMessage((prev) => ({ text: m, n: prev.n + 1 }));
    setVersion((v) => v + 1);
    if (results) search();
  };

  if (!lists) return <Skeleton height="200px" />;

  const section = (title: string, users: AdminUser[]) => (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>{title}</h2>
      {users.length ? (
        <ul className={styles.list}>{users.map((u) => <UserRow key={rowKey(u)} user={u} onChange={changed} />)}</ul>
      ) : (
        <p className={styles.muted}>{a.none}</p>
      )}
    </section>
  );

  return (
    <>
      <header>
        <h1 className={styles.title}>{a.title}</h1>
        <p className={styles.muted}>{a.intro}</p>
      </header>
      {message.text && <p key={message.n} className={styles.message} role="status">{message.text}</p>}

      <section className={styles.section}>
        <form
          className={styles.search}
          onSubmit={(e) => {
            e.preventDefault();
            search();
          }}
        >
          <TextField label={a.search_label} value={q} onChange={(e) => setQ(e.target.value)} />
          <Button type="submit" variant="secondary" disabled={q.trim().length < 2}>{a.search_button}</Button>
        </form>
        {results && (results.length ? (
          <ul className={styles.list}>{results.map((u) => <UserRow key={`s:${rowKey(u)}`} user={u} onChange={changed} />)}</ul>
        ) : (
          <p className={styles.muted}>{a.search_empty}</p>
        ))}
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{a.applications}</h2>
        {apps.length ? (
          <ul className={styles.list}>{apps.map((ap) => <ApplicationRow key={ap.id} app={ap} onChange={changed} />)}</ul>
        ) : (
          <p className={styles.muted}>{a.no_applications}</p>
        )}
      </section>

      {section(a.reviewers, lists.reviewers)}
      {section(a.admins, lists.admins)}
      {lists.blocked.length > 0 && section(a.blocked, lists.blocked)}
    </>
  );
}

export default function AdminReviewersPage() {
  const a = useTranslations().admin;
  const { status } = useContributorStatus();
  return (
    <AuthGuard>
      <main className={styles.page}>
        <div className={styles.content}>
          {status && (status.role === 'admin' && !status.blocked ? <ReviewersAdmin /> : <p>{a.forbidden}</p>)}
        </div>
      </main>
    </AuthGuard>
  );
}
