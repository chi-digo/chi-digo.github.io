'use client';

import { useEffect, useState, useCallback } from 'react';
import { useHydrated } from '@/hooks/useHydrated';
import { useStoredDismissal } from '@/hooks/useStoredDismissal';

const DISMISS_KEY = 'chidigo-install-dismissed';
const DISMISS_DAYS = 3;

export function useInstallPrompt() {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [installedEvent, setInstalledEvent] = useState(false);
  const [dismissedNow, setDismissedNow] = useState(false);
  const hydrated = useHydrated();
  const standalone = hydrated && window.matchMedia('(display-mode: standalone)').matches;
  const isInstalled = standalone || installedEvent;
  const isDismissed = useStoredDismissal(DISMISS_KEY, DISMISS_DAYS) || dismissedNow;

  useEffect(() => {
    if (typeof window === 'undefined' || window.matchMedia('(display-mode: standalone)').matches) return;

    const handlePrompt = (e: Event) => {
      e.preventDefault();
      setPromptEvent(e as BeforeInstallPromptEvent);
    };
    const handleInstalled = () => setInstalledEvent(true);

    window.addEventListener('beforeinstallprompt', handlePrompt);
    window.addEventListener('appinstalled', handleInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handlePrompt);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  const install = useCallback(async (): Promise<'accepted' | 'dismissed' | null> => {
    if (!promptEvent) return null;
    promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;
    setPromptEvent(null);
    return outcome;
  }, [promptEvent]);

  const dismiss = useCallback(() => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setDismissedNow(true);
  }, []);

  return {
    canInstall: !!promptEvent && !isInstalled,
    showCard: !!promptEvent && !isInstalled && !isDismissed,
    isInstalled,
    install,
    dismiss,
  };
}
