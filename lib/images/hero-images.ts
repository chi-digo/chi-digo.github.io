const heroImages: Record<string, string> = {
  // ===== Culture: Kayas =====
  'kayas/governance': '/images/hero/kayas-governance.webp',
  'kayas/kaya-kinondo': '/images/hero/kayas-kaya-kinondo.webp',
  'kayas/threats': '/images/hero/kayas-threats.webp',
  'kayas/what-is-a-kaya': '/images/hero/kayas-what-is-a-kaya.webp',

  // ===== Culture: Religion =====
  'religion/coexistence': '/images/hero/religion-coexistence.webp',
  'religion/digonized-islam': '/images/hero/religion-digonized-islam.webp',
  'religion/islamization': '/images/hero/religion-islamization.webp',
  'religion/spirit-world': '/images/hero/religion-spirit-world.webp',

  // ===== Culture: Music =====
  'music/ceremonial-contexts': '/images/hero/music-ceremonial-contexts.webp',
  'music/chakacha': '/images/hero/music-chakacha.webp',
  'music/instruments': '/images/hero/music-instruments.webp',
  'music/sengenya': '/images/hero/music-sengenya.webp',

  // ===== Culture: Food =====
  'food/breads-and-street-food': '/images/hero/food-breads-and-street-food.webp',
  'food/coconut-cooking': '/images/hero/food-coconut-cooking.webp',
  'food/fish': '/images/hero/food-fish.webp',
  'food/staples': '/images/hero/food-staples.webp',

  // ===== Culture: Dress =====
  'dress/color-and-meaning': '/images/hero/dress-color-and-meaning.webp',
  'dress/contemporary-revival': '/images/hero/dress-contemporary-revival.webp',
  'dress/hando': '/images/hero/dress-hando.webp',
  'dress/kanga': '/images/hero/dress-kanga.webp',

  // ===== Culture: Crafts =====
  'crafts/pottery': '/images/hero/crafts-pottery.webp',
  'crafts/settlement-patterns': '/images/hero/crafts-settlement-patterns.webp',
  'crafts/swahili-influences': '/images/hero/crafts-swahili-influences.webp',
  'crafts/traditional-construction': '/images/hero/crafts-traditional-construction.webp',

  // ===== Culture: Society =====
  'society/fuko-system': '/images/hero/society-fuko-system.webp',
  'society/islamic-law-tensions': '/images/hero/society-islamic-law-tensions.webp',
  'society/matrilineal-inheritance': '/images/hero/society-matrilineal-inheritance.webp',
  'society/mjomba': '/images/hero/society-mjomba.webp',

  // ===== Culture: Rites =====
  'rites/birth-and-naming': '/images/hero/rites-birth-and-naming.webp',
  'rites/circumcision': '/images/hero/rites-circumcision.webp',
  'rites/death': '/images/hero/rites-death.webp',
  'rites/marriage': '/images/hero/rites-marriage.webp',
  'rites/puberty': '/images/hero/rites-puberty.webp',

  // ===== Culture: Ecology =====
  'ecology/kaya-forests': '/images/hero/ecology-kaya-forests.webp',
  'ecology/rivers-and-climate': '/images/hero/ecology-rivers-and-climate.webp',
  'ecology/shimba-hills': '/images/hero/ecology-shimba-hills.webp',
  'ecology/topography': '/images/hero/ecology-topography.webp',

  // ===== Culture: Today =====
  'today/demographics': '/images/hero/today-demographics.webp',
  'today/key-towns': '/images/hero/today-key-towns.webp',
  'today/livelihoods': '/images/hero/today-livelihoods.webp',
  'today/post-mining': '/images/hero/today-post-mining.webp',

  // ===== Culture: Connections =====
  'connections/kinship-differences': '/images/hero/connections-kinship-differences.webp',
  'connections/lunga-lunga': '/images/hero/connections-lunga-lunga.webp',
  'connections/migration': '/images/hero/connections-migration.webp',
  'connections/transborder': '/images/hero/connections-transborder.webp',

  // ===== Language =====
  'lang/folk-tales-and-stories': '/images/hero/lang-folk-tales-and-stories.webp',
  'lang/oral-history': '/images/hero/lang-oral-history.webp',
  'lang/oral-poetry-and-song': '/images/hero/lang-oral-poetry-and-song.webp',
  'lang/proverbs': '/images/hero/lang-proverbs.webp',
  'lang/riddles': '/images/hero/lang-riddles.webp',
  'lang/written-literature': '/images/hero/lang-written-literature.webp',

  // ===== History =====
  'hist/kaya-archaeology': '/images/hero/hist-kaya-archaeology.webp',
  'hist/scholarly-debates': '/images/hero/hist-scholarly-debates.webp',
  'hist/singwaya': '/images/hero/hist-singwaya.webp',

  // ===== Domain-level fallbacks (used by index pages) =====
  'kayas': '/images/hero/kayas-what-is-a-kaya.webp',
  'religion': '/images/hero/religion-coexistence.webp',
  'music': '/images/hero/music-ceremonial-contexts.webp',
  'food': '/images/hero/food-fish.webp',
  'dress': '/images/hero/dress-kanga.webp',
  'crafts': '/images/hero/crafts-swahili-influences.webp',
  'society': '/images/hero/society-fuko-system.webp',
  'rites': '/images/hero/rites-marriage.webp',
  'ecology': '/images/hero/ecology-kaya-forests.webp',
  'today': '/images/hero/today-livelihoods.webp',
  'connections': '/images/hero/connections-transborder.webp',

  // ===== Index pages =====
  'culture-index': '/images/hero/crafts-traditional-construction.webp',
  'language-index': '/images/hero/lang-oral-history.webp',
  'history-index': '/images/hero/hist-singwaya.webp',
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
