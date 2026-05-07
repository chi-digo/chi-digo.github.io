import type { Locale } from '@/lib/i18n/config';

export type TimelineEvent = {
  date: string;
  title: Record<Locale, string>;
  description: Record<Locale, string>;
};

export const timelineEvents: TimelineEvent[] = [
  {
    date: 'c. 800–1000 CE',
    title: {
      en: 'Singwaya settlement',
      sw: 'Makazi ya Singwaya',
      dig: 'Makalo ga Singwaya',
    },
    description: {
      en: 'The Mijikenda peoples, including the Digo, inhabit a large multi-ethnic settlement called Singwaya, located north of the Tana River in present-day southern Somalia. Pottery from Kaya Singwaya dates to at least the 10th century.',
      sw: 'Watu wa Mijikenda, ikiwa ni pamoja na Wadigo, wanaishi katika makazi makubwa ya makabila mengi yanayoitwa Singwaya, kaskazini ya Mto Tana kusini mwa Somalia ya leo.',
      dig: 'Atu a Amijikenda, phamwenga na Adigo, anaishi kahi za makalo makulu ga makabila manji ganagoihwa Singwaya, kaskazini ya Muho wa Tana kusini kwa Somalia ya rero.',
    },
  },
  {
    date: 'c. 1500–1600s',
    title: {
      en: 'Southward migration from Singwaya',
      sw: 'Uhamaji wa kusini kutoka Singwaya',
      dig: 'Uhamaji wa kusi kula Singwaya',
    },
    description: {
      en: 'Driven by Oromo expansion, the Mijikenda peoples migrate south through hostile territory, carrying the knowledge of how to build new fortified settlements — the makaya — in the forested hills of the Kenya coast.',
      sw: 'Wakisukumwa na upanuzi wa Waoromo, watu wa Mijikenda wanahama kusini kupitia eneo la adui, wakibeba ujuzi wa kujenga makazi mapya yenye ngome — makaya — katika milima yenye misitu ya pwani ya Kenya.',
      dig: 'Akisukumwa ni upanuzi wa Aoromo, atu a Amijikenda anahama kusi kupitshi eneo ra adui, akitsukula marifwa ga kudzenga makalo mapya genye ngome — makaya — kpwa myango yenye misitu ya pwani ya Kenya.',
    },
  },
  {
    date: 'c. 1600–1800s',
    title: {
      en: 'Kaya settlement period',
      sw: 'Kipindi cha makazi ya makaya',
      dig: 'Chipindi cha makalo ga makaya',
    },
    description: {
      en: 'The Digo establish Kaya Kinondo and other kayas as fortified, sacred forest settlements. The kayas serve as centres of governance, spirituality, and identity under the kambi (council of elders).',
      sw: 'Wadigo wanaanzisha Kaya Kinondo na makaya mengine kama makazi ya misitu mitakatifu yenye ngome. Makaya yanatumika kama vituo vya utawala, kiroho, na utambulisho chini ya kambi (baraza la wazee).',
      dig: 'Adigo anaanzisha Kaya Kinondo na makaya ganjine dza makalo ga misitu mitakatifu yenye ngome. Makaya ganahumika dza vituo vya utawala, chiroho, na utambulisho tsini ya kambi (baraza ra azehe).',
    },
  },
  {
    date: 'c. 1700s',
    title: {
      en: 'Kongo Mosque rediscovered',
      sw: 'Msikiti wa Kongo unagunduliwa tena',
      dig: 'Msikiti wa Kongo unagundulwa tsena',
    },
    description: {
      en: 'Sheikh Mwinyi Kombo, guided by a dream, discovers and restores a 13th-century coral stone mosque at Diani — the Kongo Mosque, now one of East Africa\'s oldest standing mosques.',
      sw: 'Sheikh Mwinyi Kombo, akiongozwa na ndoto, anagundua na kurejesha msikiti wa mawe ya matumbawe wa karne ya 13 huko Diani — Msikiti wa Kongo, sasa mojawapo ya misikiti ya zamani zaidi inayosimama Afrika Mashariki.',
      dig: 'Sheikh Mwinyi Kombo, achiongozwa ni ndoso, anagundua na kurejesha msikiti wa mawe ga matumbawe wa karne ya 13 kuko Diani — Msikiti wa Kongo, sambi mojawapo ya misikiti ya zamani zaidi inayosimama Afrika ya Mashariki.',
    },
  },
  {
    date: 'c. 1850s–1900s',
    title: {
      en: 'Islamisation of the Digo',
      sw: 'Uislamu wa Wadigo',
      dig: 'Uislamu wa Adigo',
    },
    description: {
      en: 'Beginning with Abdallah Mwapodzo\'s conversion in Diani, Islam spreads among the Digo through trade contacts, marriage, and crisis. The Digo become the only majority-Muslim group among the nine Mijikenda peoples.',
      sw: 'Kuanzia uongofu wa Abdallah Mwapodzo huko Diani, Uislamu unasambaa miongoni mwa Wadigo kupitia biashara, ndoa, na misiba. Wadigo wanakuwa kundi pekee la Waislamu wengi miongoni mwa makabila tisa ya Mijikenda.',
      dig: 'Kuanzia uongofu wa Abdallah Mwapodzo kuko Diani, Uislamu unasambaa kahi za Adigo kupitshi biashara, ndoa, na misiba. Adigo anakala kundi ra pekee ra Aislamu anji kahi za makabila tisiya ga Amijikenda.',
    },
  },
  {
    date: '1895–1963',
    title: {
      en: 'Colonial period',
      sw: 'Kipindi cha ukoloni',
      dig: 'Chipindi cha ukoloni',
    },
    description: {
      en: 'British colonial rule in Kenya and German then British rule in Tanganyika. The Digo are classified as part of the "Nyika" (wilderness) peoples. Kaya governance structures are disrupted but not destroyed.',
      sw: 'Utawala wa kikoloni wa Waingereza nchini Kenya na utawala wa Wajerumani kisha Waingereza Tanganyika. Wadigo wanapangwa kama sehemu ya watu wa "Nyika". Mifumo ya utawala wa makaya inasumbuliwa lakini haiharibiwa.',
      dig: 'Utawala wa chikoloni wa Aingereza kahi za Kenya na utawala wa Ajerumani alafu Aingereza Tanganyika. Adigo anapangwa dza sehemu ya atu a "Nyika". Mifumo ya utawala wa makaya inasumbuliwa ela taiharibiwe.',
    },
  },
  {
    date: '1987–1994',
    title: {
      en: 'Mutoro\'s kaya excavations',
      sw: 'Uchimbaji wa makaya wa Mutoro',
      dig: 'Uchimbaji wa makaya wa Mutoro',
    },
    description: {
      en: 'Henry Mutoro of the University of Nairobi conducts the first systematic archaeological excavations at kaya sites, recovering pottery dating to the 10th century — material confirmation of the deep antiquity of Mijikenda settlement.',
      sw: 'Henry Mutoro wa Chuo Kikuu cha Nairobi anafanya uchimbaji wa kwanza wa kiakiolojia kwa makaya, akipata vyungu vya karne ya 10 — uthibitisho wa kimwili wa ustaarabu wa kale wa makazi ya Mijikenda.',
      dig: 'Henry Mutoro wa Chuo Chikulu cha Nairobi anahenda uchimbaji wa kpwandza wa chiakiolojia kpwa makaya, achipata vyungu vya karne ya 10 — uthibitisho wa chimwili wa ustaarabu wa kale wa makalo ga Amijikenda.',
    },
  },
  {
    date: '2008',
    title: {
      en: 'Kayas inscribed as UNESCO World Heritage',
      sw: 'Makaya yanaorodheshwa kama Urithi wa Dunia wa UNESCO',
      dig: 'Makaya ganaorodheshwa dza Urithi wa Dunia wa UNESCO',
    },
    description: {
      en: 'The Sacred Mijikenda Kaya Forests are inscribed on the UNESCO World Heritage List, recognising the kayas as cultural landscapes of outstanding universal value.',
      sw: 'Misitu Mitakatifu ya Makaya ya Mijikenda inaandikishwa katika Orodha ya Urithi wa Dunia ya UNESCO, ikitambua makaya kama mandhari ya kitamaduni yenye thamani ya kipekee duniani.',
      dig: 'Misitu Mitakatifu ya Makaya ya Amijikenda inaandikishwa kahi za Orodha ya Urithi wa Dunia ya UNESCO, ichitambua makaya dza mandhari ya chisomo yenye thamani ya chipekee duniani.',
    },
  },
];
