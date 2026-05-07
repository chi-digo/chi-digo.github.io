'use client';

import Link from 'next/link';
import { trackNavClick } from '@/lib/analytics/track';

interface TrackedLinkProps extends React.ComponentProps<typeof Link> {
  source: string;
  children: React.ReactNode;
}

export function TrackedLink({ source, href, children, onClick, ...rest }: TrackedLinkProps) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    trackNavClick(source, typeof href === 'string' ? href : href.pathname || '');
    if (onClick) onClick(e);
  };

  return (
    <Link href={href} onClick={handleClick} {...rest}>
      {children}
    </Link>
  );
}
