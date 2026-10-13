'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { TextArea } from '@chi-digo/design-system';
import { useTranslations } from '@/lib/i18n/context';
import { takeResumeIntent, useContributionDraft } from '@/lib/contributions/client';
import { ContributionDialog } from './ContributionDialog';
import styles from './Contribute.module.css';

/** "Feedback" in the footer: private feedback about the current page (product spec §5). */
export function FeedbackButton({ className }: { className?: string }) {
  const c = useTranslations().contribute;
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [draft, setDraft, clear] = useContributionDraft(`feedback:${pathname}`, { text: '' });

  // After signing in from the feedback form, reopen it with the draft.
  useEffect(() => {
    let live = true;
    Promise.resolve().then(() => {
      if (live && takeResumeIntent(pathname)?.form === 'feedback') setOpen(true);
    });
    return () => {
      live = false;
    };
  }, [pathname]);

  return (
    <>
      <button type="button" className={`${styles.footerButton} ${className ?? ''}`} onClick={() => setOpen(true)}>
        {c.feedback_link}
      </button>
      <ContributionDialog
        open={open}
        onClose={() => setOpen(false)}
        type="general_feedback"
        title={c.feedback_title}
        intro={c.feedback_intro}
        target={{ target_type: 'page', target_id: pathname }}
        draftKey={`feedback:${pathname}`}
        resume={{ form: 'feedback', target_id: pathname }}
        payload={draft.text.trim() ? { text: draft.text.trim() } : null}
        onSubmitted={clear}
      >
        <TextArea
          label={c.feedback_label}
          helperText={c.feedback_page.replace('{page}', pathname)}
          value={draft.text}
          onChange={(e) => setDraft({ text: e.target.value })}
          maxLength={2000}
          rows={5}
          autoFocus
        />
      </ContributionDialog>
    </>
  );
}
