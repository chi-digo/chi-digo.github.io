import type { Locale } from '@/lib/i18n/config';

export type LanguageTool = {
  slug: string;
  title: Record<Locale, string>;
  description: Record<Locale, string>;
  href: string;
  available: boolean;
};

export const languageTools: LanguageTool[] = [
  {
    slug: 'dictionary',
    title: {
      en: 'Dictionary',
      sw: 'Kamusi',
      dig: 'Kamusi',
    },
    description: {
      en: '5,200+ words with definitions in Chidigo, Swahili, and English. Search, browse by letter, and explore derived forms.',
      sw: 'Maneno zaidi ya 5,200 yenye maana kwa Kidigo, Kiswahili, na Kiingereza. Tafuta, vinjari kwa herufi, na gundua maneno yanayotokana.',
      dig: 'Maneno zaidi ya 5,200 na madzo ga Chidigo, Chiswahili, na Chiingereza. Tafuta, hakiki kwa herufi, na gundua maneno garigo ndani.',
    },
    href: '/dictionary',
    available: true,
  },
  {
    slug: 'proverbs',
    title: {
      en: 'Proverbs',
      sw: 'Methali',
      dig: 'Ndarira',
    },
    description: {
      en: '378 Digo proverbs with translations, cultural commentary, and thematic browsing. Search in Chidigo, Swahili, or English.',
      sw: 'Methali 378 za Kidigo zenye tafsiri, maoni ya kitamaduni, na kuvinjari kwa mada. Tafuta kwa Kidigo, Kiswahili, au Kiingereza.',
      dig: 'Ndarira 378 za Chidigo na tafsiri, madzo ga chisomo, na kuhakiki kwa mada. Tafuta kwa Chidigo, Chiswahili, au Chiingereza.',
    },
    href: '/proverbs',
    available: true,
  },
  {
    slug: 'quiz',
    title: {
      en: 'Jaribu — Test Yourself',
      sw: 'Jaribu — Jijaribu',
      dig: 'Jaribu — Dzijeze',
    },
    description: {
      en: 'Interactive quizzes covering history, culture, language, and geography. Daily challenges, category practice, and riddles.',
      sw: 'Maswali ya maingiliano yanayoshughulikia historia, utamaduni, lugha, na jiografia. Changamoto za kila siku, mazoezi ya kategoria, na vitendawili.',
      dig: 'Maswali ga maingiliano ganagoshughulika na historia, chimila, luga, na jiografia. Changamoto za chila siku, mazoezi ga kategoria, na vimbunga.',
    },
    href: '/language/quiz',
    available: false,
  },
];
