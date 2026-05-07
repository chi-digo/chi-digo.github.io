import type { Locale } from '@/lib/i18n/config';

function FlagUK({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 60 30"
      className={className}
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <clipPath id="uk-clip">
        <rect width="60" height="30" />
      </clipPath>
      <g clipPath="url(#uk-clip)">
        <rect width="60" height="30" fill="#012169" />
        <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6" />
        <path d="M0,0 L60,30 M60,0 L0,30" stroke="#C8102E" strokeWidth="2" />
        <path d="M30,0 V30 M0,15 H60" stroke="#fff" strokeWidth="10" />
        <path d="M30,0 V30 M0,15 H60" stroke="#C8102E" strokeWidth="6" />
      </g>
    </svg>
  );
}

function FlagKETZ({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 60 30"
      className={className}
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Kenya left half — drawn only in x:0–30 */}
      <g style={{ clipPath: 'inset(0 50% 0 0)' }}>
        <rect width="60" height="10" fill="#000" />
        <rect y="9" width="60" height="2" fill="#fff" />
        <rect y="11" width="60" height="8" fill="#BB0000" />
        <rect y="19" width="60" height="2" fill="#fff" />
        <rect y="21" width="60" height="9" fill="#006600" />
      </g>

      {/* Tanzania right half — drawn only in x:30–60 */}
      <g style={{ clipPath: 'inset(0 0 0 50%)' }}>
        <rect width="60" height="30" fill="#1EB53A" />
        <polygon points="0,30 60,0 60,30" fill="#00A3DD" />
        <polygon points="0,0 0,12 52,0" fill="#FCD116" />
        <polygon points="60,30 60,18 8,30" fill="#FCD116" />
        <polygon points="0,0 0,8 48,0" fill="#000" />
        <polygon points="60,30 60,22 12,30" fill="#000" />
      </g>

      {/* Center divider */}
      <line x1="30" y1="0" x2="30" y2="30" stroke="rgba(0,0,0,0.15)" strokeWidth="0.5" />
    </svg>
  );
}

export function LocaleFlag({ locale, className }: { locale: Locale; className?: string }) {
  if (locale === 'en') return <FlagUK className={className} />;
  return <FlagKETZ className={className} />;
}
