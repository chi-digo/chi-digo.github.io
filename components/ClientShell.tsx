'use client';

import { type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { LocaleProvider } from '@/lib/i18n/context';
import { MetadataUpdater } from '@/lib/i18n/useMetadata';
import { NavBar } from '@/components/NavBar/NavBar';
import { Breadcrumb } from '@/components/Breadcrumb/Breadcrumb';
import { Footer } from '@/components/Footer/Footer';
import { AnalyticsProvider } from '@/components/Analytics/AnalyticsProvider';
import { ConsentBanner } from '@/components/Analytics/ConsentBanner';

const Agentation = dynamic(
  () => import('agentation').then((mod) => mod.Agentation),
  { ssr: false },
);

interface ClientShellProps {
  children: ReactNode;
}

export function ClientShell({ children }: ClientShellProps) {
  return (
    <LocaleProvider>
      <AnalyticsProvider />
      <MetadataUpdater />
      <NavBar />
      <Breadcrumb />
      {children}
      <Footer />
      <ConsentBanner />
      {process.env.NODE_ENV === 'development' && <Agentation />}
    </LocaleProvider>
  );
}
