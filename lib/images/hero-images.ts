const heroImages: Record<string, string> = {
  // Culture domains
  'kayas': '/images/hero/2-4-makuti-thatched-homes.webp',
  'religion': '/images/hero/1-2-elder-in-conversation.webp',
  'music': '/images/hero/3-3-sengenya-drummers.webp',
  'food': '/images/hero/3-4-fish-market.webp',
  'dress': '/images/hero/4-1-kanga-textile-fold.webp',
  'crafts': '/images/hero/2-3-coral-lime-architecture.webp',
  'society': '/images/hero/5-3-community-meeting.webp',
  'rites': '/images/hero/1-3-grandmother-and-grandchild.webp',
  'ecology': '/images/hero/2-2-mangrove-inlet-low-tide.webp',
  'today': '/images/hero/3-6-dhow-builders.webp',
  'connections': '/images/hero/1-4-father-and-son-coast.webp',

  // Language
  'oral-traditions': '/images/hero/1-1-parent-reading-to-child.webp',

  // History
  'history': '/images/hero/2-1-south-coast-beach-golden-hour.webp',

  // Index pages
  'culture-index': '/images/hero/4-3-coral-lime-wall-texture.webp',
  'language-index': '/images/hero/5-1-language-recording-session.webp',
  'history-index': '/images/hero/2-4-makuti-thatched-homes.webp',
};

export function getHeroImage(key: string): string | null {
  return heroImages[key] ?? null;
}

export function getHeroStyle(key: string): React.CSSProperties | undefined {
  const url = heroImages[key];
  if (!url) return undefined;
  return {
    backgroundImage: `linear-gradient(rgba(14,26,42,0.82), rgba(14,26,42,0.82)), url(${url})`,
  };
}
