import type { Locale } from '@/lib/i18n/config';

export interface PlantTheme {
  slug: string;
  title: Record<Locale, string>;
  description: Record<Locale, string>;
}

// Digo titles and descriptions are drafts awaiting speaker review (spec 33 §10.2); every word is attested
// in Mgombato or the NT, or is an accepted loan (mwani, daktari, mbao). Attested forms: chakurya (proverb
// themes), mihaso (Mgombato mhaso "medicine, medicine tree"), kudzenga (dzenga "build"), matsaka
// (ruling), munda/mudzi, nyika (Mgombato).
export const PLANT_THEMES: PlantTheme[] = [
  {
    slug: 'food',
    title: { en: 'Food', sw: 'Chakula', dg: 'Chakurya' },
    description: {
      en: 'Plants grown, gathered and cooked for food: crops, fruits, vegetables, spices and famine foods.',
      sw: 'Mimea inayolimwa, kuokotwa na kupikwa kama chakula: mazao, matunda, mboga, viungo na vyakula vya wakati wa njaa.',
      dg: 'Mimea ya chakurya: mavuno, matunda na mboga, na vyakurya vya wakati wa ndzala.',
    },
  },
  {
    slug: 'medicine',
    title: { en: 'Medicine', sw: 'Dawa', dg: 'Mihaso' },
    description: {
      en: 'Plants used in traditional healing. These are recorded practices, not medical advice.',
      sw: 'Mimea inayotumika katika tiba ya jadi. Haya ni matumizi yaliyorekodiwa, si ushauri wa kitabibu.',
      dg: 'Mimea inayohumirwa kpwa mihaso. Higa ni mila za atu, si ushauri wa daktari.',
    },
  },
  {
    slug: 'building',
    title: { en: 'Building', sw: 'Ujenzi', dg: 'Kudzenga' },
    description: {
      en: 'Timber, poles, thatch and fuel: the plants that build and warm a Digo home.',
      sw: 'Mbao, nguzo, makuti na kuni: mimea inayojenga na kupasha joto nyumba ya Kidigo.',
      dg: 'Mbao, nguzo, makuti na kuni za kudzenga nyumba na kujitira.',
    },
  },
  {
    slug: 'crafts',
    title: { en: 'Crafts', sw: 'Ufundi', dg: 'Ufundi' },
    description: {
      en: 'Plants for weaving, carving, rope, dyes, tools and musical instruments.',
      sw: 'Mimea ya kusuka, kuchonga, kamba, rangi, zana na ala za muziki.',
      dg: 'Mimea ya kusuka, kamba, rangi na vyombo, na vyombo vya ngoma.',
    },
  },
  {
    slug: 'ritual',
    title: { en: 'Ritual and belief', sw: 'Mila na imani', dg: 'Mila na imani' },
    description: {
      en: 'Plants of the kaya, of spirits, rites, protection and taboo.',
      sw: 'Mimea ya kaya, ya mizimu, matambiko, kinga na miiko.',
      dg: 'Mimea ya kaya, ya mila na ya miko.',
    },
  },
  {
    slug: 'trade',
    title: { en: 'Trade', sw: 'Biashara', dg: 'Biashara' },
    description: {
      en: 'Cash crops and plants sold for income: cashew, coconut, seaweed, mangrove poles and timber.',
      sw: 'Mazao ya biashara na mimea inayouzwa: korosho, nazi, mwani, boriti na mbao.',
      dg: 'Mimea inayoguzwa: ngorosho, nazi, mwani, boriti na mbao.',
    },
  },
  {
    slug: 'mangroves-and-sea',
    title: { en: 'Mangroves and sea', sw: 'Mikoko na bahari', dg: 'Mikoko na bahari' },
    description: {
      en: 'Mangroves, beach plants, seagrass and seaweed of the Digo shore.',
      sw: 'Mikoko, mimea ya ufukweni, nyasi za baharini na mwani wa pwani ya Wadigo.',
      dg: 'Mikoko, mimea ya pwani, nyasi za baharini na mwani.',
    },
  },
  {
    slug: 'forest',
    title: { en: 'Forest', sw: 'Msitu', dg: 'Matsaka' },
    description: {
      en: 'Trees and plants of the coastal forests, the kaya groves and the Shimba Hills.',
      sw: 'Miti na mimea ya misitu ya pwani, misitu ya kaya na Milima ya Shimba.',
      dg: 'Mihi na mimea ya matsaka ga pwani, matsaka ga kaya na ga Shimba.',
    },
  },
  {
    slug: 'bush-and-grassland',
    title: { en: 'Bush and grassland', sw: 'Nyika', dg: 'Nyika' },
    description: {
      en: 'Shrubs, climbers, grasses and herbs of the coastal bush, thicket and grassland.',
      sw: 'Vichaka, mitambaa, nyasi na mitishamba ya nyika na vichaka vya pwani.',
      dg: 'Vitsaka, nyasi na mimea ya nyika ya pwani.',
    },
  },
  {
    slug: 'farm-and-home',
    title: { en: 'Farm and home', sw: 'Shamba na nyumbani', dg: 'Munda na mudzini' },
    description: {
      en: 'Plants grown in fields, gardens and around the homestead.',
      sw: 'Mimea inayolimwa mashambani, bustanini na kuzunguka nyumbani.',
      dg: 'Mimea ya munda na ya mudzini.',
    },
  },
  {
    slug: 'threatened',
    title: { en: 'Threatened', sw: 'Iliyo hatarini', dg: 'Iriyo hatarini' },
    description: {
      en: 'Plants that are threatened, near threatened or locally rare.',
      sw: 'Mimea iliyo hatarini kutoweka, inayokaribia hatari, au adimu katika eneo hili.',
      dg: 'Mimea iriyo hatarini kuangamika.',
    },
  },
];

export function getPlantTheme(slug: string): PlantTheme | undefined {
  return PLANT_THEMES.find((t) => t.slug === slug);
}
