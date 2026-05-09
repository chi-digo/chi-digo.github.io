import type { Locale } from '@/lib/i18n/config';

export type FeaturedArticle = {
  section: 'culture' | 'history' | 'language';
  domain?: string;
  slug: string;
  title: Record<Locale, string>;
  intro: Record<Locale, string>;
  href: string;
};

const FEATURED_SETS: FeaturedArticle[][] = [
  [
    {
      section: 'culture',
      domain: 'kayas',
      slug: 'what-is-a-kaya',
      title: { en: 'What is a Kaya?', sw: 'Kaya ni Nini?', dig: 'Kaya ni Chitu Gani?' },
      intro: {
        en: 'The kayas are fortified forest settlements that served as the spiritual and political centres of Mijikenda life for centuries.',
        sw: 'Makaya ni makazi ya misitu yenye ngome yaliyokuwa vituo vya kiroho na kisiasa vya maisha ya Mijikenda kwa karne nyingi.',
        dig: 'Makaya ni makalo ga misitu genye ngome garigokala vituo vya chiroho na chisiasa vya maisha ga Amijikenda kpwa karne nyinji.',
      },
      href: '/culture/kayas/what-is-a-kaya',
    },
  ],
  [
    {
      section: 'history',
      slug: 'singwaya',
      title: { en: 'The Singwaya Migration', sw: 'Uhamiaji wa Singwaya', dig: 'Uhamiaji wa Singwaya' },
      intro: {
        en: 'The story of how the Digo and the wider Mijikenda peoples journeyed from Singwaya to the Kenya coast — an origin narrative that binds nine peoples together.',
        sw: 'Hadithi ya jinsi Wadigo na watu wengine wa Mijikenda walivyosafiri kutoka Singwaya hadi pwani ya Kenya.',
        dig: 'Hadisi ya vira Adigo na atu anjine a Amijikenda arivyosafiri kula Singwaya hadi ph\'wani ya Kenya.',
      },
      href: '/history/singwaya',
    },
  ],
  [
    {
      section: 'language',
      slug: 'folk-tales-and-stories',
      title: { en: 'Folk Tales and Stories', sw: 'Hadisi za Chinyume', dig: 'Hadithi za Jadi' },
      intro: {
        en: 'In the villages of Kwale County, there is a time of day that belongs to stories — told only at night, by performers who carry entire worlds in their heads.',
        sw: 'Katika vijiji vya Kaunti ya Kwale, kuna wakati wa siku ambao ni wa hadithi — zinazosimuliwa usiku tu.',
        dig: 'Kpwa vidzi vya Kaunti ya Kwale, kuna wakati wa siku ambao ni wa hadisi — zinazosimulirwa usiku bahi.',
      },
      href: '/language/folk-tales-and-stories',
    },
  ],
  [
    {
      section: 'culture',
      domain: 'music',
      slug: 'chakacha',
      title: { en: 'Chakacha Dance', sw: 'Ngoma ya Chakacha', dig: 'Ngoma ya Chakacha' },
      intro: {
        en: 'Chakacha is the signature dance of Digo celebrations — a hip-driven performance that moves from weddings to festivals, adapting but never losing its coastal character.',
        sw: 'Chakacha ni ngoma ya kipekee ya sherehe za Wadigo — utendaji wa viuno unaotoka kwenye harusi hadi tamasha.',
        dig: 'Chakacha ni ngoma ya chipekee ya sherehe za Adigo — utendaji wa viuno unaokpwedza kula harusini hadi tamashe.',
      },
      href: '/culture/music/chakacha',
    },
  ],
];

export function getFeaturedArticle(): FeaturedArticle {
  const month = new Date().getMonth();
  const set = FEATURED_SETS[month % FEATURED_SETS.length];
  return set[0];
}
