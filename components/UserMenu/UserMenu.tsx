'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth/context';
import { useTranslations } from '@/lib/i18n/context';
import { track } from '@/lib/analytics/track';
import { TrackedLink } from '@/components/Analytics/TrackedLink';
import styles from './UserMenu.module.css';

function UserAvatar({ src, name }: { src?: string | null; name?: string | null }) {
  const initial = (name || 'U').charAt(0).toUpperCase();

  if (src) {
    return (
      <img
        src={src}
        alt=""
        className={styles.avatar}
        referrerPolicy="no-referrer"
      />
    );
  }

  return (
    <span className={styles.avatarFallback} aria-hidden="true">
      {initial}
    </span>
  );
}

export function UserMenu() {
  const { user, signOut } = useAuth();
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    buttonRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(e: PointerEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') close();
    }

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, close]);

  if (!user) return null;

  const displayName = user.user_metadata?.full_name || user.user_metadata?.display_name || user.email;
  const avatarUrl = user.user_metadata?.avatar_url;

  const handleSignOut = async () => {
    track('orientation', 'auth', 'sign_out', {});
    await signOut();
    close();
  };

  return (
    <div className={styles.container} ref={menuRef}>
      <button
        ref={buttonRef}
        type="button"
        className={styles.trigger}
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={displayName || t.profile.title}
      >
        <UserAvatar src={avatarUrl} name={displayName} />
      </button>

      {open && (
        <div className={styles.dropdown} role="menu">
          <div className={styles.header}>
            <span className={styles.name}>{displayName}</span>
            {user.email && displayName !== user.email && (
              <span className={styles.email}>{user.email}</span>
            )}
          </div>
          <div className={styles.divider} />
          <TrackedLink
            href="/profile"
            source="user_menu"
            className={styles.menuItem}
            role="menuitem"
            onClick={close}
          >
            {t.profile.title}
          </TrackedLink>
          <button
            type="button"
            className={styles.menuItem}
            role="menuitem"
            onClick={handleSignOut}
          >
            {t.auth.sign_out}
          </button>
        </div>
      )}
    </div>
  );
}
