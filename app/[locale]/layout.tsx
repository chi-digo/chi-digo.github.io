import { notFound } from 'next/navigation';
import { type Locale, isLocale } from '@/lib/i18n/config';
import { ClientShell } from '@/components/ClientShell';

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params;

  if (!isLocale(locale)) notFound();

  return (
    <ClientShell initialLocale={locale as Locale}>
      {children}
    </ClientShell>
  );
}
