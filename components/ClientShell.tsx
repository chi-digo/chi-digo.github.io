'use client';

import { type ReactNode } from 'react';
import { LocaleProvider } from '@/lib/i18n/context';
import { MetadataUpdater } from '@/lib/i18n/useMetadata';
import { NavBar } from '@/components/NavBar/NavBar';

interface ClientShellProps {
  children: ReactNode;
}

export function ClientShell({ children }: ClientShellProps) {
  return (
    <LocaleProvider>
      <MetadataUpdater />
      <NavBar />
      {children}
    </LocaleProvider>
  );
}
