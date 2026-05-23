'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import { useTranslations } from '@/lib/i18n/context';
import { AuthGuard } from '@/components/AuthGuard';
import { FavouritesList } from '@/components/FavouritesList/FavouritesList';
import { QuizHistory } from '@/components/QuizHistory/QuizHistory';
import { Button, Dialog } from '@chi-digo/design-system';
import { track } from '@/lib/analytics/track';
import styles from './profile.module.css';

function ProfileContent() {
  const { user, signOut } = useAuth();
  const t = useTranslations();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('favourites');
  const [editingName, setEditingName] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const name = user?.user_metadata?.full_name || user?.user_metadata?.display_name || user?.email || '';
  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
    : '';

  const handleEditName = useCallback(() => {
    setDisplayName(name);
    setEditingName(true);
  }, [name]);

  const handleSaveName = useCallback(async () => {
    setSaving(true);
    try {
      await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ display_name: displayName }),
      });
      setEditingName(false);
    } catch {}
    setSaving(false);
  }, [displayName]);

  const handleExport = useCallback(async () => {
    track('orientation', 'profile', 'export_data', {});
    window.location.href = '/api/export';
  }, []);

  const handleDelete = useCallback(async () => {
    setDeleting(true);
    track('orientation', 'profile', 'delete_account', {});
    try {
      const res = await fetch('/api/account', { method: 'DELETE' });
      if (res.ok) {
        await signOut();
        router.replace('/');
      }
    } catch {}
    setDeleting(false);
  }, [signOut, router]);

  const tabs = [
    { id: 'favourites', label: t.profile.favourites },
    { id: 'quiz', label: t.profile.quiz_history },
  ];

  return (
    <main className={styles.page}>
      <div className={styles.content}>
      <div className={styles.header}>
        <h1 className={styles.title}>{t.profile.title}</h1>
        <div className={styles.userInfo}>
          {editingName ? (
            <div className={styles.editNameRow}>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className={styles.nameInput}
                autoFocus
              />
              <Button size="sm" onClick={handleSaveName} disabled={saving}>
                {saving ? '...' : 'Save'}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setEditingName(false)}>
                Cancel
              </Button>
            </div>
          ) : (
            <div className={styles.nameRow}>
              <span className={styles.name}>{name}</span>
              <button type="button" className={styles.editBtn} onClick={handleEditName}>
                {t.profile.edit_name}
              </button>
            </div>
          )}
          {memberSince && (
            <p className={styles.memberSince}>
              {(t.profile.member_since || 'Member since {date}').replace('{date}', memberSince)}
            </p>
          )}
        </div>
      </div>

      <div className={styles.tabs} role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className={styles.tabContent}>
        {activeTab === 'favourites' && <FavouritesList />}
        {activeTab === 'quiz' && <QuizHistory />}
      </div>

      <div className={styles.actions}>
        <Button variant="ghost" onClick={handleExport}>
          {t.profile.export_data}
        </Button>
        <Button variant="ghost" onClick={() => setDeleteOpen(true)} style={{ color: 'var(--color-error, #d32f2f)' }}>
          {t.profile.delete_account}
        </Button>
      </div>

      {deleteOpen && (
        <Dialog
          open={deleteOpen}
          onClose={() => setDeleteOpen(false)}
          title={t.profile.delete_account}
        >
          <p style={{ margin: '0 0 var(--space-4)', fontSize: '0.9rem' }}>
            {t.profile.delete_confirm}
          </p>
          <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
            <Button variant="ghost" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              disabled={deleting}
              style={{ background: 'var(--color-error, #d32f2f)', borderColor: 'var(--color-error, #d32f2f)', color: 'white' }}
            >
              {deleting ? '...' : t.profile.delete_confirm_button}
            </Button>
          </div>
        </Dialog>
      )}
      </div>
    </main>
  );
}

export default function ProfilePage() {
  return (
    <AuthGuard>
      <ProfileContent />
    </AuthGuard>
  );
}
