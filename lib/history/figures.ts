import type { Locale } from '@/lib/i18n/config';

export type Figure = {
  slug: string;
  name: string;
  era: Record<Locale, string>;
  role: Record<Locale, string>;
  region: string;
  summary: Record<Locale, string>;
};

export const figures: Figure[] = [
  {
    slug: 'bandilo',
    name: 'Bandilo',
    era: {
      en: 'Pre-colonial (date unknown)',
      sw: 'Kabla ya ukoloni (tarehe haijulikani)',
      dg: 'Kabla ya ukoloni (tarehe taimanyikana)',
    },
    role: {
      en: 'Diviner-leader, healer, archer',
      sw: 'Mtawala-mtabiri, mganga, mpiga mishale',
      dg: 'Mtawala-mtabiri, mganga, mpiga mishale',
    },
    region: 'Tanga, Tanzania',
    summary: {
      en: 'A leader remembered in Tanga oral tradition, whose authority came from healing, divination and counsel. Rulers of other peoples are said to have sought his advice on difficult decisions.',
      sw: 'Kiongozi anayekumbukwa katika simulizi za Tanga, ambaye mamlaka yake yalitokana na uganga, utabiri na ushauri. Inasemekana viongozi wa watu wengine walimtafuta kwa ushauri kuhusu maamuzi magumu.',
      dg: 'Chiongozi anayekumbukwa kahi za hadithi za Tanga, ambaye mamlaka gakpwe garitokana na uganga, utabiri na ushauri. Nkugombwa kukala aongozi a atu anjina amhendza kpwa ushauri wa mambo magumu.',
    },
  },
  {
    slug: 'sheikh-mwinyi-kombo',
    name: 'Sheikh Mwinyi Kombo',
    era: {
      en: 'Died 1934',
      sw: 'Alifariki 1934',
      dg: 'Wafwa 1934',
    },
    role: {
      en: 'Imam who revived the Kongo Mosque',
      sw: 'Imamu aliyefufua Msikiti wa Kongo',
      dg: 'Imamu ariyefufula Msikiti wa Kongo',
    },
    region: 'Mombasa and Diani, Kenya',
    summary: {
      en: 'A Swahili imam from Mombasa who, in 1927, persuaded the Diani elders that the ruin in the forest was a mosque, not a spirit shrine. The villagers cleared it together, and he reopened the Kongo Mosque with a maulid in 1932.',
      sw: 'Imamu wa Kiswahili kutoka Mombasa ambaye, mwaka 1927, aliwashawishi wazee wa Diani kwamba gofu lililokuwa msituni lilikuwa msikiti, si mahali pa pepo. Wanakijiji waliusafisha pamoja, naye akaufungua tena Msikiti wa Kongo kwa maulidi mwaka 1932.',
      dg: 'Imamu wa Chiswahili kula Mombasa ambaye, mwaka 1927, waashawishi azehe a Diani kukala gofu riro tsakani kala ni msikiti, si phatu pha pepho. Atu a mudzi ausafisha phamwenga, naye achiufungula tsena Msikiti wa Kongo kpwa maulidi mwaka 1932.',
    },
  },
  {
    slug: 'abdallah-mwapodzo',
    name: 'Abdallah Mwapodzo',
    era: {
      en: 'c. 1840–1923',
      sw: 'Takriban 1840–1923',
      dg: 'Kama miaka ya 1840–1923',
    },
    role: {
      en: 'Mwanatsi of Kaya Diani; built Diani’s first mosque',
      sw: 'Mwanatsi wa Kaya Diani; alijenga msikiti wa kwanza wa Diani',
      dg: 'Mwanatsi wa Kaya Diani; wadzenga msikiti wa kpwandza wa Diani',
    },
    region: 'Diani, Kenya',
    summary: {
      en: 'The 7th mwanatsi (senior elder) of Kaya Diani. He became a Muslim during the famine of 1884–85 and kept leading the kaya’s rain rituals. Around 1907 he built Diani’s first mosque, at Mwaroni.',
      sw: 'Mwanatsi (mzee mkuu) wa 7 wa Kaya Diani. Alisilimu wakati wa njaa ya 1884–85 na akaendelea kuongoza matambiko ya mvua ya kaya. Karibu mwaka 1907 alijenga msikiti wa kwanza wa Diani, huko Mwaroni.',
      dg: 'Mwanatsi (mzehe mkulu) wa 7 wa Kaya Diani. Wasilimu wakati wa ndzala ya 1884–85 na achienderera kulongoza matambiko ga mvula ga kaya. Kama mwaka 1907 wadzenga msikiti wa kpwandza wa Diani, kuko Mwaroni.',
    },
  },
  {
    slug: 'vincent-nkondokaya',
    name: 'Vincent Geoffrey Nkondokaya',
    era: {
      en: 'Born 1956',
      sw: 'Alizaliwa 1956',
      dg: 'Wavyalwa 1956',
    },
    role: {
      en: 'Historian and ethnographer',
      sw: 'Mwanahistoria na mtaalamu wa makabila',
      dg: 'Mwanahistoria na mtaalamu wa makabila',
    },
    region: 'Tanga, Tanzania',
    summary: {
      en: 'Author of Asili ya Tanga pamoja na asili ya Wadigo, Wasegeju na Wadaiso — a systematic attempt to record the origins of Tanga\'s peoples before the last generation of oral historians passes away.',
      sw: 'Mwandishi wa Asili ya Tanga pamoja na asili ya Wadigo, Wasegeju na Wadaiso — jaribio la kimfumo la kurekodi asili ya watu wa Tanga kabla ya kizazi cha mwisho cha wanahistoria wa mdomo kupita.',
      dg: 'Mwandishi wa Asili ya Tanga phamwenga na asili ya Adigo, Asegeju na Adaiso — jaribio ra chimfumo ra kurekodi asili ya atu a Tanga kabla ya chizazi cha mwisho cha anahistoria a mdomo kupita.',
    },
  },
  {
    slug: 'hassan-mwakimako',
    name: 'Prof. Hassan Mwakimako',
    era: {
      en: 'Contemporary',
      sw: 'Wa sasa',
      dg: 'Wa rero',
    },
    role: {
      en: 'Islamic studies scholar, Secretary of Digo Ngambi',
      sw: 'Mtaalamu wa masomo ya Kiislamu, Katibu wa Ngambi ya Wadigo',
      dg: 'Mtaalamu wa masomo ga Chiislamu, Katibu wa Ngambi ya Adigo',
    },
    region: 'Kilifi, Kenya',
    summary: {
      en: 'Associate Professor at Pwani University whose research on kadhi courts, colonial governance, and Muslim identity on the Kenya coast has been published by Edinburgh University Press, Brill and others. Also serves as Secretary of the Digo Ngambi (traditional leadership council).',
      sw: 'Profesa Mshiriki katika Chuo Kikuu cha Pwani ambaye utafiti wake kuhusu mahakama za makadhi, utawala wa kikoloni, na utambulisho wa Kiislamu pwani ya Kenya umechapishwa na Edinburgh University Press, Brill na wengine. Pia ni Katibu wa Ngambi ya Wadigo.',
      dg: 'Profesa Mshiriki kpwa Chuo Chikulu cha Pwani ambaye utafiti wakpwe kuhusu mahakama za makadhi, utawala wa chikoloni, na utambulisho wa Chiislamu pwani ya Kenya umechapishwa ni Edinburgh University Press, Brill na anjina. Piya ni Katibu wa Ngambi ya Adigo.',
    },
  },
];
