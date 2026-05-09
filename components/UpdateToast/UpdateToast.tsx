'use client';

import { Toast } from '@chi-digo/design-system';
import { useTranslations } from '@/lib/i18n/context';

interface UpdateToastProps {
  onRefresh: () => void;
  onDismiss: () => void;
}

export function UpdateToast({ onRefresh, onDismiss }: UpdateToastProps) {
  const t = useTranslations();
  return (
    <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 9999 }}>
      <Toast
        message={t.install.update_toast}
        variant="info"
        duration={10000}
        onDismiss={onDismiss}
        action={{ label: '↻', onClick: onRefresh }}
      />
    </div>
  );
}
