import type { Locale } from '@/lib/i18n/config';

export interface ThemeEntry {
  slug: string;
  title: Record<Locale, string>;
  description: Record<Locale, string>;
}

export interface FunctionEntry {
  slug: string;
  title: Record<Locale, string>;
  description: Record<Locale, string>;
}

export const PROVERB_THEMES: ThemeEntry[] = [
  {
    slug: 'wisdom',
    title: { en: 'Wisdom', sw: 'Hekima', dig: 'Hekima' },
    description: {
      en: 'Proverbs about knowledge, understanding, and discernment.',
      sw: 'Methali kuhusu maarifa, uelewa, na busara.',
      dig: 'Ndarira kuhusu kumanya, kuelewa, na busara.',
    },
  },
  {
    slug: 'foolishness',
    title: { en: 'Foolishness', sw: 'Upumbavu', dig: 'Uzuzu' },
    description: {
      en: 'Proverbs about folly, ignorance, and poor judgment.',
      sw: 'Methali kuhusu upumbavu, ujinga, na uamuzi mbaya.',
      dig: 'Ndarira kuhusu uzuzu, ujinga, na uamuzi muii.',
    },
  },
  {
    slug: 'character',
    title: { en: 'Character', sw: 'Tabia', dig: 'Tabia' },
    description: {
      en: 'Proverbs about personal qualities, integrity, and moral fibre.',
      sw: 'Methali kuhusu sifa binafsi, uaminifu, na maadili.',
      dig: 'Ndarira kuhusu sifa za mutu, uaminifu, na maadili.',
    },
  },
  {
    slug: 'hospitality',
    title: { en: 'Hospitality', sw: 'Ukarimu', dig: 'Ukarimu' },
    description: {
      en: 'Proverbs about generosity, welcoming guests, and sharing.',
      sw: 'Methali kuhusu ukarimu, kukaribisha wageni, na kushiriki.',
      dig: 'Ndarira kuhusu ukarimu, kuphokerera ajeni, na kushiriki.',
    },
  },
  {
    slug: 'food',
    title: { en: 'Food', sw: 'Chakula', dig: 'Chakurya' },
    description: {
      en: 'Proverbs about food, hunger, sustenance, and provision.',
      sw: 'Methali kuhusu chakula, njaa, riziki, na kupata.',
      dig: 'Ndarira kuhusu chakurya, ndzala, riziki, na kuphaha.',
    },
  },
  {
    slug: 'work',
    title: { en: 'Work', sw: 'Kazi', dig: 'Kazi' },
    description: {
      en: 'Proverbs about labour, diligence, and effort.',
      sw: 'Methali kuhusu kazi, bidii, na juhudi.',
      dig: 'Ndarira kuhusu kazi, bidii, na juhudi.',
    },
  },
  {
    slug: 'wealth',
    title: { en: 'Wealth', sw: 'Utajiri', dig: 'Utajiri' },
    description: {
      en: 'Proverbs about riches, poverty, and material possessions.',
      sw: 'Methali kuhusu utajiri, umaskini, na mali.',
      dig: 'Ndarira kuhusu utajiri, uchiya, na mali.',
    },
  },
  {
    slug: 'patience',
    title: { en: 'Patience', sw: 'Subira', dig: 'Uvumilivu' },
    description: {
      en: 'Proverbs about endurance, waiting, and perseverance.',
      sw: 'Methali kuhusu subira, kusubiri, na uvumilivu.',
      dig: 'Ndarira kuhusu uvumilivu, kugodza, na kustahamili.',
    },
  },
  {
    slug: 'speech',
    title: { en: 'Speech', sw: 'Usemi', dig: 'Maneno' },
    description: {
      en: 'Proverbs about words, silence, truth, and the power of the tongue.',
      sw: 'Methali kuhusu maneno, ukimya, ukweli, na nguvu ya ulimi.',
      dig: 'Ndarira kuhusu maneno, kunyamala, ukpweli, na nguvu ya lulimi.',
    },
  },
  {
    slug: 'kinship',
    title: { en: 'Kinship', sw: 'Undugu', dig: 'Undugu' },
    description: {
      en: 'Proverbs about family, clan ties, and communal bonds.',
      sw: 'Methali kuhusu familia, uhusiano wa ukoo, na umoja wa jamii.',
      dig: 'Ndarira kuhusu mbari, uhusiano wa fuko, na umoja wa jamii.',
    },
  },
  {
    slug: 'children',
    title: { en: 'Children', sw: 'Watoto', dig: 'Ana' },
    description: {
      en: 'Proverbs about raising children, youth, and the next generation.',
      sw: 'Methali kuhusu kulea watoto, vijana, na kizazi kijacho.',
      dig: 'Ndarira kuhusu kurera ana, avulana na asichana, na chizazi chijacho.',
    },
  },
  {
    slug: 'marriage',
    title: { en: 'Marriage', sw: 'Ndoa', dig: 'Ndoa' },
    description: {
      en: 'Proverbs about marriage, courtship, and spousal relations.',
      sw: 'Methali kuhusu ndoa, uchumba, na mahusiano ya wanandoa.',
      dig: 'Ndarira kuhusu ndoa, uchumba, na mahusiano ga arusi.',
    },
  },
  {
    slug: 'death',
    title: { en: 'Death', sw: 'Kifo', dig: 'Chifo' },
    description: {
      en: 'Proverbs about mortality, loss, and the afterlife.',
      sw: 'Methali kuhusu kifo, kupoteza, na maisha baada ya kifo.',
      dig: 'Ndarira kuhusu chifo, kupoteza, na maisha bada ya chifo.',
    },
  },
  {
    slug: 'spirit',
    title: { en: 'Spirit', sw: 'Roho', dig: 'Roho' },
    description: {
      en: 'Proverbs about spiritual life, faith, and the unseen.',
      sw: 'Methali kuhusu maisha ya kiroho, imani, na yasiyoonekana.',
      dig: 'Ndarira kuhusu maisha ga chiroho, imani, na gasigoonekana.',
    },
  },
  {
    slug: 'healing',
    title: { en: 'Healing', sw: 'Uponyaji', dig: 'Kuphoza' },
    description: {
      en: 'Proverbs about health, medicine, and recovery.',
      sw: 'Methali kuhusu afya, dawa, na kupona.',
      dig: 'Ndarira kuhusu afya, dawa, na kuphola.',
    },
  },
  {
    slug: 'identity',
    title: { en: 'Identity', sw: 'Utambulisho', dig: 'Utambulisho' },
    description: {
      en: 'Proverbs about who one is, self-knowledge, and belonging.',
      sw: 'Methali kuhusu mtu ni nani, kujijua, na mali ya jamii.',
      dig: 'Ndarira kuhusu mutu ni ani, kudzimanya, na mali ya jamii.',
    },
  },
  {
    slug: 'coastal',
    title: { en: 'Coastal Life', sw: 'Maisha ya Pwani', dig: 'Maisha ga Pwani' },
    description: {
      en: 'Proverbs rooted in the sea, fishing, tides, and the coastal environment.',
      sw: 'Methali zinazotokana na bahari, uvuvi, mawimbi, na mazingira ya pwani.',
      dig: 'Ndarira zinazoandza na bahari, uvuvi, maimbi, na mazingira ga pwani.',
    },
  },
  {
    slug: 'animals',
    title: { en: 'Animals', sw: 'Wanyama', dig: 'Anyama' },
    description: {
      en: 'Proverbs that use animal imagery to teach human lessons.',
      sw: 'Methali zinazotumia picha za wanyama kufundisha masomo ya binadamu.',
      dig: 'Ndarira zinazotumia picha za anyama kufundisha masomo ga anadamu.',
    },
  },
  {
    slug: 'conflict',
    title: { en: 'Conflict', sw: 'Migogoro', dig: 'Migogoro' },
    description: {
      en: 'Proverbs about disputes, rivalry, war, and resolution.',
      sw: 'Methali kuhusu migogoro, ushindani, vita, na upatanisho.',
      dig: 'Ndarira kuhusu migogoro, ushindani, viha, na upatanisho.',
    },
  },
  {
    slug: 'justice',
    title: { en: 'Justice', sw: 'Haki', dig: 'Haki' },
    description: {
      en: 'Proverbs about fairness, law, punishment, and restitution.',
      sw: 'Methali kuhusu haki, sheria, adhabu, na fidia.',
      dig: 'Ndarira kuhusu haki, sheria, adhabu, na fidia.',
    },
  },
  {
    slug: 'time',
    title: { en: 'Time', sw: 'Wakati', dig: 'Wakati' },
    description: {
      en: 'Proverbs about time, seasons, urgency, and the passage of years.',
      sw: 'Methali kuhusu wakati, misimu, haraka, na kupita kwa miaka.',
      dig: 'Ndarira kuhusu wakati, misimu, haraka, na kutsupa kwa miaka.',
    },
  },
];

export const PROVERB_FUNCTIONS: FunctionEntry[] = [
  {
    slug: 'advising',
    title: { en: 'Advising', sw: 'Kushauri', dig: 'Kushauri' },
    description: {
      en: 'Proverbs used to give advice or counsel.',
      sw: 'Methali zinazotumika kutoa ushauri.',
      dig: 'Ndarira zinazotumika kupha ushauri.',
    },
  },
  {
    slug: 'warning',
    title: { en: 'Warning', sw: 'Kuonya', dig: 'Kuonya' },
    description: {
      en: 'Proverbs used to caution against danger or foolish action.',
      sw: 'Methali zinazotumika kuonya kuhusu hatari au kitendo cha kipumbavu.',
      dig: 'Ndarira zinazotumika kuonya kuhusu hatari au chendo cha kizuzu.',
    },
  },
  {
    slug: 'rebuking',
    title: { en: 'Rebuking', sw: 'Kukemea', dig: 'Kukemea' },
    description: {
      en: 'Proverbs used to reprimand or correct someone.',
      sw: 'Methali zinazotumika kukemea au kusahihisha mtu.',
      dig: 'Ndarira zinazotumika kukemea au kusahihisha mutu.',
    },
  },
  {
    slug: 'encouraging',
    title: { en: 'Encouraging', sw: 'Kutia moyo', dig: 'Kupha moyo' },
    description: {
      en: 'Proverbs used to uplift, motivate, and give hope.',
      sw: 'Methali zinazotumika kutia moyo, kuhamasisha, na kutoa matumaini.',
      dig: 'Ndarira zinazotumika kupha moyo, kuhamasisha, na kupha matumaini.',
    },
  },
  {
    slug: 'consoling',
    title: { en: 'Consoling', sw: 'Kufariji', dig: 'Kufariji' },
    description: {
      en: 'Proverbs used to comfort the grieving or distressed.',
      sw: 'Methali zinazotumika kufariji wenye huzuni au taabu.',
      dig: 'Ndarira zinazotumika kufariji ario na huzuni au taabu.',
    },
  },
  {
    slug: 'teaching',
    title: { en: 'Teaching', sw: 'Kufundisha', dig: 'Kufundisha' },
    description: {
      en: 'Proverbs used to impart knowledge or life lessons.',
      sw: 'Methali zinazotumika kufundisha maarifa au masomo ya maisha.',
      dig: 'Ndarira zinazotumika kufundisha kumanya au masomo ga maisha.',
    },
  },
  {
    slug: 'praising',
    title: { en: 'Praising', sw: 'Kusifu', dig: 'Kusifu' },
    description: {
      en: 'Proverbs used to commend good character or achievement.',
      sw: 'Methali zinazotumika kusifu tabia njema au mafanikio.',
      dig: 'Ndarira zinazotumika kusifu tabia ndzema au mafanikio.',
    },
  },
  {
    slug: 'persuading',
    title: { en: 'Persuading', sw: 'Kushawishi', dig: 'Kushawishi' },
    description: {
      en: 'Proverbs used to convince or influence opinion.',
      sw: 'Methali zinazotumika kushawishi au kubadilisha maoni.',
      dig: 'Ndarira zinazotumika kushawishi au kubadilisha maoni.',
    },
  },
  {
    slug: 'mocking',
    title: { en: 'Mocking', sw: 'Kudhihaki', dig: 'Kubeza' },
    description: {
      en: 'Proverbs used to ridicule foolish or arrogant behaviour.',
      sw: 'Methali zinazotumika kudhihaki tabia ya kipumbavu au kiburi.',
      dig: 'Ndarira zinazotumika kubeza tabia ya kizuzu au kiburi.',
    },
  },
  {
    slug: 'explaining',
    title: { en: 'Explaining', sw: 'Kueleza', dig: 'Kueleza' },
    description: {
      en: 'Proverbs used to clarify or illustrate a point.',
      sw: 'Methali zinazotumika kueleza au kuonyesha jambo.',
      dig: 'Ndarira zinazotumika kueleza au kuonyesha dzambo.',
    },
  },
  {
    slug: 'justifying',
    title: { en: 'Justifying', sw: 'Kuhalalisha', dig: 'Kuhalalisha' },
    description: {
      en: 'Proverbs used to defend a decision or action.',
      sw: 'Methali zinazotumika kuhalalisha uamuzi au kitendo.',
      dig: 'Ndarira zinazotumika kuhalalisha uamuzi au chendo.',
    },
  },
  {
    slug: 'lamenting',
    title: { en: 'Lamenting', sw: 'Kuomboleza', dig: 'Kuomboleza' },
    description: {
      en: 'Proverbs used to express grief, regret, or sorrow.',
      sw: 'Methali zinazotumika kuonyesha huzuni, majuto, au msiba.',
      dig: 'Ndarira zinazotumika kuonyesha huzuni, majuto, au msiba.',
    },
  },
];

/** Look up a theme entry by slug. */
export function getTheme(slug: string): ThemeEntry | undefined {
  return PROVERB_THEMES.find((t) => t.slug === slug);
}

/** Look up a function entry by slug. */
export function getFunction(slug: string): FunctionEntry | undefined {
  return PROVERB_FUNCTIONS.find((f) => f.slug === slug);
}
