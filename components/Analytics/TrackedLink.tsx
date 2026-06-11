'use client';

import Link from 'next/link';
import { trackNavClick } from '@/lib/analytics/track';
import { useLocale } from '@/lib/i18n/context';
import { localePath } from '@/lib/i18n/locale-path';

interface TrackedLinkProps extends React.ComponentProps<typeof Link> {
  source: string;
  children: React.ReactNode;
  skipLocalePrefix?: boolean;
}

export function TrackedLink({ source, href, children, onClick, skipLocalePrefix, ...rest }: TrackedLinkProps) {
  const { locale } = useLocale();

  const resolvedHref = !skipLocalePrefix && typeof href === 'string' && href.startsWith('/')
    ? localePath(href, locale)
    : href;

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    trackNavClick(source, typeof href === 'string' ? href : href.pathname || '');
    if (onClick) onClick(e);
  };

  return (
    <Link href={resolvedHref} onClick={handleClick} {...rest}>
      {children}
    </Link>
  );
}
