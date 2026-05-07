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
      en: '17th–18th century',
      sw: 'Karne ya 17–18',
      dig: 'Karne ya 17–18',
    },
    role: {
      en: 'Diviner-leader, healer, archer',
      sw: 'Mtawala-mtabiri, mganga, mpiga mishale',
      dig: 'Mtawala-mtabiri, mganga, mpiga mishale',
    },
    region: 'Tanga, Tanzania',
    summary: {
      en: 'A pre-colonial leader whose authority derived from healing, prophecy, and counsel. Neighbouring leaders — Wasambaa, Wasegeju, and others — sought his divination for disputes requiring difficult decisions.',
      sw: 'Kiongozi wa kabla ya ukoloni ambaye mamlaka yake yalitokana na uganga, utabiri, na ushauri. Viongozi wa makabila jirani — Wasambaa, Wasegeju, na wengine — walimtafuta kwa utabiri wa matatizo magumu.',
      dig: 'Chiongozi wa kabla ya ukoloni ambaye mamlaka gakpwe garitokana na uganga, utabiri, na ushauri. Aongozi a makabila ga jirani — Asambaa, Asegeju, na anjine — amtafuta kpwa utabiri wa matatizo magumu.',
    },
  },
  {
    slug: 'sheikh-mwinyi-kombo',
    name: 'Sheikh Mwinyi Kombo',
    era: {
      en: 'Early 1700s',
      sw: 'Mwanzo wa miaka ya 1700',
      dig: 'Mwanzo wa miaka ya 1700',
    },
    role: {
      en: 'Muslim scholar, restorer of Kongo Mosque',
      sw: 'Mwanazuoni wa Kiislamu, mrejeshaji wa Msikiti wa Kongo',
      dig: 'Mwanazuoni wa Chiislamu, mrejeshaji wa Msikiti wa Kongo',
    },
    region: 'Diani, Kenya',
    summary: {
      en: 'Guided by a dream, he discovered a 13th-century coral stone mosque buried beneath centuries of forest growth at Diani. His restoration of the Kongo Mosque established one of East Africa\'s most significant Islamic heritage sites.',
      sw: 'Aliongozwa na ndoto, akagundua msikiti wa mawe ya matumbawe wa karne ya 13 uliozikwa chini ya misitu ya karne nyingi huko Diani. Urejesho wake wa Msikiti wa Kongo ulianzisha mojawapo ya maeneo muhimu zaidi ya urithi wa Kiislamu Afrika Mashariki.',
      dig: 'Waongozwa ni ndoso, achigundua msikiti wa mawe ga matumbawe wa karne ya 13 uriozikwa tsini ya misitu ya karne nyinji kuko Diani. Urejesho wakpwe wa Msikiti wa Kongo waanzisha mojawapo ya maeneo muhimu zaidi ya urithi wa Chiislamu Afrika ya Mashariki.',
    },
  },
  {
    slug: 'abdallah-mwapodzo',
    name: 'Abdallah Mwapodzo',
    era: {
      en: 'c. 1850s–1923',
      sw: 'Takriban 1850–1923',
      dig: 'Kama miaka ya 1850–1923',
    },
    role: {
      en: 'Mwanatsi (senior elder), first Muslim Digo of Diani',
      sw: 'Mwanatsi (mzee mkuu), Mdigo wa kwanza Muislamu Diani',
      dig: 'Mwanatsi (mzehe mkulu), Mdigo wa kpwandza Muislamu Diani',
    },
    region: 'Diani, Kenya',
    summary: {
      en: 'The senior elder of Diani who became the first practising Muslim convert among the Digo — a pivotal figure in the Islamisation that would make the Digo the only majority-Muslim group among the nine Mijikenda peoples.',
      sw: 'Mzee mkuu wa Diani ambaye alikuwa mwongofu wa kwanza wa Kiislamu miongoni mwa Wadigo — mtu muhimu katika Uislamu ambao ungewafanya Wadigo kuwa kundi pekee la Waislamu wengi miongoni mwa makabila tisa ya Mijikenda.',
      dig: 'Mzehe mkulu wa Diani ariyekala mwongofu wa kpwandza wa Chiislamu kahi za Adigo — mutu muhimu kahi za Uislamu ambao ungeahenda Adigo kukala kundi ra pekee ra Aislamu anji kahi za makabila tisiya ga Amijikenda.',
    },
  },
  {
    slug: 'vincent-nkondokaya',
    name: 'Vincent Geoffrey Nkondokaya',
    era: {
      en: 'Born 1956',
      sw: 'Alizaliwa 1956',
      dig: 'Wavyalwa 1956',
    },
    role: {
      en: 'Historian and ethnographer',
      sw: 'Mwanahistoria na mtaalamu wa makabila',
      dig: 'Mwanahistoria na mtaalamu wa makabila',
    },
    region: 'Tanga, Tanzania',
    summary: {
      en: 'Author of Asili ya Tanga pamoja na asili ya Wadigo, Wasegeju na Wadaiso — a systematic attempt to record the origins of Tanga\'s peoples before the last generation of oral historians passes away.',
      sw: 'Mwandishi wa Asili ya Tanga pamoja na asili ya Wadigo, Wasegeju na Wadaiso — jaribio la kimfumo la kurekodi asili ya watu wa Tanga kabla ya kizazi cha mwisho cha wanahistoria wa mdomo kupita.',
      dig: 'Mwandishi wa Asili ya Tanga phamwenga na asili ya Adigo, Asegeju na Adaiso — jaribio ra chimfumo ra kurekodi asili ya atu a Tanga kabla ya chizazi cha mwisho cha anahistoria a mdomo kupita.',
    },
  },
  {
    slug: 'hassan-mwakimako',
    name: 'Prof. Hassan Mwakimako',
    era: {
      en: 'Contemporary',
      sw: 'Wa sasa',
      dig: 'Wa rero',
    },
    role: {
      en: 'Islamic studies scholar, Secretary of Digo Ngambi',
      sw: 'Mtaalamu wa masomo ya Kiislamu, Katibu wa Ngambi ya Wadigo',
      dig: 'Mtaalamu wa masomo ga Chiislamu, Katibu wa Ngambi ya Adigo',
    },
    region: 'Kilifi, Kenya',
    summary: {
      en: 'Associate Professor at Pwani University whose research on kadhi courts, colonial governance, and Muslim identity on the Kenya coast has been published by Cambridge, Edinburgh, and Brill. Also serves as Secretary of the Digo Ngambi (traditional leadership council).',
      sw: 'Profesa Mshiriki katika Chuo Kikuu cha Pwani ambaye utafiti wake kuhusu mahakama za makadhi, utawala wa kikoloni, na utambulisho wa Kiislamu pwani ya Kenya umechapishwa na Cambridge, Edinburgh, na Brill. Pia ni Katibu wa Ngambi ya Wadigo.',
      dig: 'Profesa Mshiriki kpwa Chuo Chikulu cha Pwani ambaye utafiti wakpwe kuhusu mahakama za makadhi, utawala wa chikoloni, na utambulisho wa Chiislamu pwani ya Kenya umechapishwa ni Cambridge, Edinburgh, na Brill. Piya ni Katibu wa Ngambi ya Adigo.',
    },
  },
  {
    slug: 'mohamed-mwamzandi',
    name: 'Dr. Mohamed Mwamzandi',
    era: {
      en: 'Contemporary',
      sw: 'Wa sasa',
      dig: 'Wa rero',
    },
    role: {
      en: 'Linguist, Swahili/Bantu computational linguistics',
      sw: 'Mwanaisimu, isimu ya kompyuta ya Kiswahili/Kibantu',
      dig: 'Mwanaisimu, isimu ya kompyuta ya Chiswahili/Chibantu',
    },
    region: 'Chapel Hill, USA',
    summary: {
      en: 'Teaching Associate Professor at UNC Chapel Hill who builds computational tools for Bantu language preservation. His work on Swahili NLP and sentiment analysis creates infrastructure that benefits smaller Bantu languages like Chidigo.',
      sw: 'Profesa Mshiriki wa Kufundisha katika UNC Chapel Hill anayejenga zana za kompyuta kwa uhifadhi wa lugha za Kibantu. Kazi yake kuhusu NLP ya Kiswahili na uchambuzi wa hisia inaunda miundombinu inayofaidisha lugha ndogo za Kibantu kama Kidigo.',
      dig: 'Profesa Mshiriki wa Kufundisha kpwa UNC Chapel Hill anayedzenga vyombo vya kompyuta kpwa uhifadhi wa luga za Chibantu. Kazi yakpwe kuhusu NLP ya Chiswahili na uchambuzi wa hisia inadzenga miundombinu inayofaidisha luga ndogo za Chibantu dza Chidigo.',
    },
  },
];
