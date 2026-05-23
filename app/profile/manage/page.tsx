'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import { useTranslations } from '@/lib/i18n/context';
import { AuthGuard } from '@/components/AuthGuard';
import { Button, Card, Dialog } from '@chi-digo/design-system';
import { track } from '@/lib/analytics/track';
import styles from './manage.module.css';

const CHALLENGE_WORDS = [
  'kutsanganya', 'mwanamuche', 'kuchanganya', 'madzumba', 'kutsambuwa',
  'kuambira', 'mahadziro', 'kuphirikana', 'kudungamana', 'kufundzisha',
  'mwanafundzi', 'kuhandikira', 'kugutsukirwa', 'kushukurira', 'kukorokora',
  'mwenyemuji', 'kuambirira', 'kuboresha', 'kuphirikira', 'kuhangaika',
];

function ManageContent() {
  const t = useTranslations();
  const router = useRouter();
  const { signOut } = useAuth();

  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [challengeInput, setChallengeInput] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const challengeWord = useMemo(
    () => CHALLENGE_WORDS[Math.floor(Math.random() * CHALLENGE_WORDS.length)],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [deleteOpen],
  );

  const handleExport = useCallback(async () => {
    setExportError('');
    setExporting(true);
    track('orientation', 'profile', 'export_data_click', {});
    try {
      const res = await fetch('/api/export');
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'chidigo-data-export.json';
      a.click();
      URL.revokeObjectURL(url);
      track('orientation', 'profile', 'export_data_success', {});
    } catch {
      setExportError(t.profile.export_error);
      track('orientation', 'profile', 'export_data_error', {});
    }
    setExporting(false);
  }, [t]);

  const openDeleteDialog = useCallback(() => {
    track('orientation', 'profile', 'delete_dialog_open', {});
    setChallengeInput('');
    setDeleteError('');
    setDeleteOpen(true);
  }, []);

  const closeDeleteDialog = useCallback(() => {
    track('orientation', 'profile', 'delete_cancelled', {});
    setDeleteOpen(false);
  }, []);

  const handleDelete = useCallback(async () => {
    track('orientation', 'profile', 'delete_confirmed', {});
    setDeleting(true);
    setDeleteError('');
    try {
      const res = await fetch('/api/account', { method: 'DELETE' });
      if (!res.ok) throw new Error();
      await signOut();
      router.replace('/');
    } catch {
      setDeleteError(t.profile.delete_error);
      track('orientation', 'profile', 'delete_error', {});
      setDeleting(false);
    }
  }, [signOut, router, t]);

  const promptText = (t.profile.delete_type_prompt || 'Type {word} below to confirm').replace(
    '{word}',
    challengeWord,
  );

  return (
    <main className={styles.page}>
      <div className={styles.content}>
        <h1 className={styles.heading}>{t.profile.manage_title}</h1>

        <div className={styles.cardGrid}>
        <Card padding="lg" elevated>
          <svg className={styles.cardIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--fg-muted)' }}>
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          <h2 className={styles.cardTitle}>{t.profile.export_title}</h2>
          <p className={styles.cardDescription}>{t.profile.export_description}</p>
          <Button variant="secondary" size="md" onClick={handleExport} loading={exporting} className={styles.exportBtn}>
            {t.profile.export_button}
          </Button>
          {exportError && <p className={styles.inlineError}>{exportError}</p>}
        </Card>

        <Card padding="lg" elevated>
          <svg className={styles.cardIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--fg-danger, #c4280a)' }}>
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            <line x1="10" y1="11" x2="10" y2="17" />
            <line x1="14" y1="11" x2="14" y2="17" />
          </svg>
          <h2 className={styles.cardTitle}>{t.profile.delete_title}</h2>
          <p className={styles.cardDescription}>{t.profile.delete_description}</p>
          <p className={styles.warningText}>{t.profile.delete_warning}</p>
          <Button variant="danger" size="md" onClick={openDeleteDialog}>
            {t.profile.delete_button}
          </Button>
        </Card>
        </div>

        <Dialog
          open={deleteOpen}
          onClose={closeDeleteDialog}
          title={t.profile.delete_dialog_title}
          description={t.profile.delete_dialog_description}
          actions={
            <>
              <Button variant="ghost" onClick={closeDeleteDialog}>
                {t.profile.delete_cancel}
              </Button>
              <Button
                variant="danger"
                onClick={handleDelete}
                disabled={challengeInput !== challengeWord}
                loading={deleting}
              >
                {t.profile.delete_confirm_button}
              </Button>
            </>
          }
        >
          <div className={styles.challengeBlock}>
            <span className={styles.challengeWord}>{challengeWord}</span>
          </div>
          <p className={styles.challengePrompt}>{promptText}</p>
          <input
            type="text"
            className={styles.challengeInput}
            value={challengeInput}
            onChange={(e) => setChallengeInput(e.target.value)}
            autoComplete="off"
            spellCheck={false}
          />
          {deleteError && <p className={styles.dialogError}>{deleteError}</p>}
        </Dialog>
      </div>
    </main>
  );
}

export default function ManageProfilePage() {
  return (
    <AuthGuard>
      <ManageContent />
    </AuthGuard>
  );
}
