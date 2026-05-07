import type { Locale } from '@/lib/i18n/config';

export type Dialect = {
  slug: string;
  name: string;
  region: Record<Locale, string>;
  description: Record<Locale, string>;
  area: string;
  speakers: Record<Locale, string>;
  color: string;
};

export const dialects: Dialect[] = [
  {
    slug: 'chinondo',
    name: 'Chinondo',
    region: {
      en: 'Northern Digo',
      sw: 'Digo wa Kaskazini',
      dig: 'Adigo a Kaskazi',
    },
    description: {
      en: 'The prestige dialect and basis for the written standard. All published Digo materials — the Mgombato Dictionary, the Digo Bible, and BTL literacy materials — are based on Chinondo.',
      sw: 'Lahaja ya heshima na msingi wa kiwango cha maandishi. Machapisho yote ya Kidigo — Kamusi ya Mgombato, Biblia ya Kidigo, na nyenzo za BTL — yanategemea Chinondo.',
      dig: 'Lahaja ya heshima na msingi wa chiandiko cha kawaida. Machapisho gosi ga Chidigo — Kamusi ya Mgombato, Biblia ya Chidigo, na vyombo vya BTL — vinategemea Chinondo.',
    },
    area: 'Likoni – Msambweni',
    speakers: {
      en: 'Majority of Kenyan Digo speakers',
      sw: 'Wengi wa wazungumzaji wa Kidigo Kenya',
      dig: 'Anji a azungumzadzi a Chidigo Kenya',
    },
    color: '#2D3778',
  },
  {
    slug: 'ungu',
    name: 'Ungu',
    region: {
      en: 'Southern Digo',
      sw: 'Digo wa Kusini',
      dig: 'Adigo a Kusi',
    },
    description: {
      en: 'Spoken south of Msambweni across the Kenya-Tanzania border into Tanga and Muheza districts. Greater Swahili influence from contact with Tanga Swahili dialects.',
      sw: 'Inazungumzwa kusini mwa Msambweni kupitia mpaka wa Kenya-Tanzania hadi wilaya za Tanga na Muheza. Ushawishi mkubwa wa Kiswahili kutokana na mawasiliano na lahaja za Kiswahili cha Tanga.',
      dig: 'Inazungumzwa kusi kwa Msambweni kupishira miphaka ya Kenya-Tanzania hadi wilaya za Tanga na Muheza. Ushawishi mkulu wa Chiswahili kula mawasiliano na lahaja za Chiswahili cha Tanga.',
    },
    area: 'Msambweni – Tanga',
    speakers: {
      en: '~166,000 Tanzania-side Digo',
      sw: 'Wadigo ~166,000 upande wa Tanzania',
      dig: 'Adigo ~166,000 uphande wa Tanzania',
    },
    color: '#8B6914',
  },
  {
    slug: 'tsimba',
    name: "Ts'imba",
    region: {
      en: 'Shimba Hills Digo',
      sw: 'Digo wa Shimba Hills',
      dig: 'Adigo a Shimba Hills',
    },
    description: {
      en: 'Spoken in the Shimba Hills, an inland forested highland. Relative geographic isolation has preserved older Digo vocabulary and developed distinctive features including the documented click sound.',
      sw: 'Inazungumzwa katika Shimba Hills, nyanda za juu za msitu wa bara. Kutengwa kijiografia kumehifadhi msamiati wa Kidigo wa zamani na kuendeleza sifa za kipekee ikiwa ni pamoja na sauti ya kubonyeza iliyoandikwa.',
      dig: 'Inazungumzwa kpwa Shimba Hills, nyanda za dzulu za msitu wa bara. Kutengwa kwa jiografia kumehifadhi maneno ga Chidigo ga zamani na kuendeleza sifa za chiphekee.',
    },
    area: 'Vuga – Ng\'onzini',
    speakers: {
      en: 'Shimba Hills communities',
      sw: 'Jamii za Shimba Hills',
      dig: 'Jamii za Shimba Hills',
    },
    color: '#2E7D32',
  },
  {
    slug: 'tswaka',
    name: "Tsw'aka",
    region: {
      en: 'Shimoni Peninsula Digo',
      sw: 'Digo wa Rasi ya Shimoni',
      dig: 'Adigo a Rasi ya Shimoni',
    },
    description: {
      en: 'The most linguistically distinctive Digo variety, spoken around Shimoni Peninsula near the Tanzania border. Heavy Vumba Swahili influence creates a transitional variety between Digo and Swahili.',
      sw: 'Aina ya Kidigo yenye tofauti kubwa zaidi ya lugha, inayozungumzwa karibu na Rasi ya Shimoni karibu na mpaka wa Tanzania. Ushawishi mkubwa wa Kiswahili cha Vumba unatengeneza aina ya mpito.',
      dig: 'Aina ya Chidigo yenye tofauti kulu zaidi ya luga, inayozungumzwa kanda-kanda ya Rasi ya Shimoni phephi na miphaka ya Tanzania. Ushawishi mkulu wa Chiswahili cha Vumba unatengeneza aina ya mphito.',
    },
    area: 'Shimoni Peninsula',
    speakers: {
      en: 'Smallest dialect community',
      sw: 'Jamii ndogo zaidi ya lahaja',
      dig: 'Jamii ndogo zaidi ya lahaja',
    },
    color: '#C62828',
  },
];
