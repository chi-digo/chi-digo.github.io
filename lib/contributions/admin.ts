/** Admin helpers: user lookup and contribution track records (spec 34 §3.1). */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { ReviewScope, Role } from './schemas';

export interface AdminUser {
  id: string;
  email: string | null;
  display_name: string | null;
  first_name: string | null;
  avatar_url: string | null;
  role: Role;
  blocked: boolean;
  scopes: ReviewScope[];
  granted_at: string | null;
  submitted: number;
  accepted: number;
  reviews: number;
  joined: string;
}

/** Emails are shown masked unless an admin asks to reveal one (the reveal is logged). */
export function maskEmail(email: string | null): string | null {
  if (!email) return null;
  const [name, domain] = email.split('@');
  return `${name.slice(0, 1)}•••@${domain}`;
}

/** Load users with role, scopes and track record. `ids` limits the set; omit for everyone. */
export async function loadUsers(db: SupabaseClient, ids?: string[], reveal?: string): Promise<AdminUser[]> {
  let profiles = db.from('profiles').select('id, display_name, first_name, avatar_url, role, blocked_at, created_at').is('deleted_at', null);
  if (ids) {
    if (!ids.length) return [];
    profiles = profiles.in('id', ids);
  }
  const { data: rows } = await profiles;
  if (!rows?.length) return [];
  const userIds = rows.map((r) => r.id);

  const [{ data: scopes }, { data: authors }, { data: reviewed }, emails, { data: langs }] = await Promise.all([
    db.from('profile_review_scopes').select('user_id, scope, granted_at').in('user_id', userIds),
    db.from('contributions').select('user_id, status').in('user_id', userIds).eq('is_test', false),
    db.from('contributions').select('reviewer_id').in('reviewer_id', userIds).eq('is_test', false),
    emailMap(db),
    db.from('profile_review_languages').select('user_id, lang').in('user_id', userIds),
  ]);

  return rows.map((r) => {
    const own = (authors ?? []).filter((c) => c.user_id === r.id);
    const mine = (scopes ?? []).filter((s) => s.user_id === r.id);
    const email = emails.get(r.id) ?? null;
    return {
      id: r.id,
      email: r.id === reveal ? email : maskEmail(email),
      display_name: r.display_name,
      first_name: r.first_name,
      avatar_url: r.avatar_url,
      role: r.role as Role,
      blocked: !!r.blocked_at,
      scopes: mine.map((s) => s.scope as ReviewScope),
      languages: (langs ?? []).filter((l) => l.user_id === r.id).map((l) => l.lang as 'sw' | 'dg'),
      granted_at: mine.map((s) => s.granted_at).sort()[0] ?? null,
      submitted: own.length,
      accepted: own.filter((c) => c.status === 'accepted').length,
      reviews: (reviewed ?? []).filter((c) => c.reviewer_id === r.id).length,
      joined: r.created_at,
    };
  });
}

/** Emails live in auth.users, which only the admin API can read. */
async function emailMap(db: SupabaseClient): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 1000 });
    if (error || !data.users.length) break;
    for (const u of data.users) if (u.email && !u.app_metadata?.test) map.set(u.id, u.email);
    if (data.users.length < 1000) break;
  }
  return map;
}

/** Find users by display name, first name or full email. Emails come back masked. */
export async function searchUsers(db: SupabaseClient, q: string): Promise<AdminUser[]> {
  const needle = q.trim().toLocaleLowerCase();
  if (needle.length < 2) return [];
  const emails = await emailMap(db);
  const byEmail = [...emails.entries()].filter(([, e]) => e.toLocaleLowerCase().includes(needle)).map(([id]) => id);
  const all = await loadUsers(db);
  return all
    .filter((u) => byEmail.includes(u.id) || [u.display_name, u.first_name].some((v) => v?.toLocaleLowerCase().includes(needle)))
    .slice(0, 20);
}
