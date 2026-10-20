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
      dg: 'Mtawala-mtabiri, mgbwanga, mpiga mishale',
    },
    region: 'Tanga, Tanzania',
    summary: {
      en: 'A leader remembered in Tanga oral tradition, whose authority came from healing, divination and counsel. Rulers of other peoples are said to have sought his advice on difficult decisions.',
      sw: 'Kiongozi anayekumbukwa katika simulizi za Tanga, ambaye mamlaka yake yalitokana na uganga, utabiri na ushauri. Inasemekana viongozi wa watu wengine walimtafuta kwa ushauri kuhusu maamuzi magumu.',
      dg: 'Chiongozi anayetambukirwa kahi za hadithi za Tanga, ambaye mamlaka gakpwe garitokana na uganga, utabiri na ushauri. Nkugombwa kukala aongozi a atu anjina amhendza kpwa ushauri wa mambo magumu.',
    },
  },
  {
    slug: 'kubo-mwamzungu',
    name: "Kubo Mbogo Mwamzungu",
    era: {
      en: "c. 1800",
      sw: "Karibu 1800",
      dg: "Kama mwaka 1800",
    },
    role: {
      en: "Founder of the Kubo rulership",
      sw: "Mwanzilishi wa utawala wa Kubo",
      dg: "Mwandzishi wa utawala wa Kubo",
    },
    region: "Chikoneni, Kenya",
    summary: {
      en: "A rain-maker who came south from Kwale in a famine and was accepted as leader after he “brought rain”. He founded the Kubo rulership of the southern Digo at Kaya Dzombo.",
      sw: "Mganga wa mvua aliyekuja kusini kutoka Kwale wakati wa njaa na akakubaliwa kuwa kiongozi baada ya “kuleta mvua”. Alianzisha utawala wa Kubo wa Wadigo wa kusini huko Kaya Dzombo.",
      dg: "Mgbwanga wa mvula ariyekpwedza kusini kula Kwale wakati wa ndzala, achikubalika kukala chiongozi bada ya “kureha mvula”. Waandzisha utawala wa Kubo wa Adigo a kusini iko Kaya Dzombo.",
    },
  },
  {
    slug: 'kubo-mangaru',
    name: "Kubo Mangaru Mwajita",
    era: {
      en: "Ruled c. 1865–1894",
      sw: "Alitawala takriban 1865–1894",
      dg: "Watawala kama 1865–1894",
    },
    role: {
      en: "Kubo of the southern Digo",
      sw: "Kubo wa Wadigo wa kusini",
      dg: "Kubo wa Adigo a kusini",
    },
    region: "Chikoneni, Kenya",
    summary: {
      en: "When Mbaruk of Gasi’s raids laid waste the south coast, he was the one Digo ruler strong enough to resist. He dealt with the Mazrui, the Sultan of Zanzibar and the Imperial British East Africa Company.",
      sw: "Mashambulizi ya Mbaruk wa Gasi yalipoharibu pwani ya kusini, yeye ndiye mtawala pekee wa Kidigo aliyekuwa na nguvu za kumpinga. Alishughulika na Wamazrui, Sultani wa Zanzibar na Kampuni ya Kiingereza ya Afrika Mashariki.",
      dg: "Mbaruk wa Gasi achivamia pwani ya kusini, iye ndiye ariyekala mtawala wa pekee wa Chidigo mwenye nguvu za kumpinga. Wahenda mambo na Amazrui, Sultani wa Zanzibar na Kampuni ya Aingereza ya Afrika ya Mashariki.",
    },
  },
  {
    slug: 'salim-mwabundu',
    name: "Salim Mwabundu",
    era: {
      en: "Late 1800s",
      sw: "Mwishoni mwa miaka ya 1800",
      dg: "Mwisho wa miaka ya 1800",
    },
    role: {
      en: "Leader of Kaya Shonda, Headman of Likoni",
      sw: "Kiongozi wa Kaya Shonda, Mkuu wa Likoni",
      dg: "Chiongozi wa Kaya Shonda, Dzumbe wa Likoni",
    },
    region: "Likoni, Kenya",
    summary: {
      en: "One of the first Digo Muslims around Likoni. He started as a small trader at Pungu market, led Kaya Shonda and became Headman of Likoni under British rule.",
      sw: "Mmoja wa Wadigo Waislamu wa kwanza karibu na Likoni. Alianza kama mfanyabiashara mdogo katika soko la Pungu, akaongoza Kaya Shonda na kuwa Mkuu wa Likoni chini ya utawala wa Waingereza.",
      dg: "Mmwenga wa Adigo Aislamu a kpwandza phephi na Likoni. Waandza dza mfanyabiashara mdide kpwenye soko ra Pungu, achilongoza Kaya Shonda na kukala Dzumbe wa Likoni tsini ya utawala wa Aingereza.",
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
      dg: 'Mwanatsi (mzehe mkpwulu) wa 7 wa Kaya Diani. Wasilimu wakati wa ndzala ya 1884–85 na achienderera kulongoza matambiko ga mvula ga kaya. Kama mwaka 1907 wadzenga msikiti wa kpwandza wa Diani, iko Mwaroni.',
    },
  },
  {
    slug: 'mwalimu-ali-mwaganyuma',
    name: "Mwalimu Ali Mwaganyuma",
    era: {
      en: "1880s–1890s",
      sw: "Miaka ya 1880–1890",
      dg: "Miaka ya 1880–1890",
    },
    role: {
      en: "Teacher, first Imam of Pungu",
      sw: "Mwalimu, Imamu wa kwanza wa Pungu",
      dg: "Mwalimu, Imamu wa kpwandza wa Pungu",
    },
    region: "Pungu, Kenya",
    summary: {
      en: "Sent away as a boy during the famine of 1884–85, he came home with Islamic learning. Jeered at Pungu market, he kept teaching, and became the first Imam of Pungu’s Tuliani Mosque.",
      sw: "Alipelekwa mbali akiwa mtoto wakati wa njaa ya 1884–85, akarudi na elimu ya Kiislamu. Alizomewa katika soko la Pungu lakini akaendelea kufundisha, akawa Imamu wa kwanza wa Msikiti wa Tuliani wa Pungu.",
      dg: "Wahumwa kure achere mwana wakati wa ndzala ya 1884–85, achiuya na elimu ya Chiislamu. Wazomewa kpwenye soko ra Pungu ela achienderera kufundza, achikala Imamu wa kpwandza wa Msikiti wa Tuliani wa Pungu.",
    },
  },
  {
    slug: 'dzumbe-mamfulla',
    name: "Dzumbe Mamfulla",
    era: {
      en: "c. 1890–1892",
      sw: "Karibu 1890–1892",
      dg: "Kama 1890–1892",
    },
    role: {
      en: "First chief over all the Tanzanian Digo",
      sw: "Mkuu wa kwanza wa Wadigo wote wa Tanzania",
      dg: "Dzumbe wa kpwandza wa Adigo osi a Tanzania",
    },
    region: "Gombelo, Tanzania",
    summary: {
      en: "In 1890 the Germans made him chief over the Digo villages behind Tanga, which until then had been governed by councils of elders. Soon afterwards the country around his village rose, tore down the German flag and declared itself independent.",
      sw: "Mwaka 1890 Wajerumani walimfanya mkuu wa vijiji vya Wadigo vya bara la Tanga, ambavyo hadi wakati huo viliongozwa na mabaraza ya wazee. Muda mfupi baadaye, nchi iliyozunguka kijiji chake iliinuka, ikashusha bendera ya Kijerumani na kujitangaza huru.",
      dg: "Mwaka 1890 Ajerumani amuika kukala Dzumbe wa vidzidzi vya Adigo vya bara ya Tanga, ambavyo hadi wakati hinyo kala vinalongozwa ni azehe. Bada ya muda mfupi, Adigo a phephi na chidzidziche achiusa bendera ya Chijerumani na achidzitangaza kukala huru.",
    },
  },
  {
    slug: 'muhammad-masemo',
    name: "Muhammad Masemo",
    era: {
      en: "1920s",
      sw: "Miaka ya 1920",
      dg: "Miaka ya 1920",
    },
    role: {
      en: "President of the Digo Central Council",
      sw: "Rais wa Baraza Kuu la Wadigo",
      dg: "Rais wa Baraza Kulu ra Adigo",
    },
    region: "Chikoneni, Kenya",
    summary: {
      en: "Trader and Headman of Chikoneni, he built its first mosque around 1906 and led the Digo Central Council in the 1920s. A 1923 report called him one of the most energetic Presidents in the District.",
      sw: "Mfanyabiashara na Mkuu wa Chikoneni, alijenga msikiti wa kwanza huko karibu mwaka 1906 na akaongoza Baraza Kuu la Wadigo miaka ya 1920. Ripoti ya 1923 ilimwita mmoja wa marais wenye bidii zaidi wilayani.",
      dg: "Mfanyabiashara na Dzumbe wa Chikoneni, wadzenga msikiti wa kpwandza iko kama mwaka 1906 na achilongoza Baraza Kulu ra Adigo miaka ya 1920. Ripoti ya 1923 yamuiha mmwenga wa marais enye bidii zaidi wilayani.",
    },
  },
  {
    slug: 'kassim-mwachinyama',
    name: "Kassim Mwachinyama",
    era: {
      en: "1924",
      sw: "1924",
      dg: "1924",
    },
    role: {
      en: "One of the first Digo imams",
      sw: "Mmoja wa maimamu wa kwanza Wadigo",
      dg: "Mmwenga wa maimamu a kpwandza Adigo",
    },
    region: "Chigato, Kenya",
    summary: {
      en: "Around Tiwi, mosques had long been led by imams from outside the community. In 1924 Chigato built a mosque for him to lead, and children from Vuga came to learn at his school.",
      sw: "Huko Tiwi, misikiti iliongozwa kwa muda mrefu na maimamu kutoka nje ya jamii. Mwaka 1924 Chigato ilijenga msikiti ili yeye auongoze, na watoto kutoka Vuga walikuja kusoma katika chuo chake.",
      dg: "Iko Tiwi, misikiti kala inalongozwa kpwa muda mure ni maimamu kula kondze ya jamii. Mwaka 1924 Chigato yadzenga msikiti ili iye aulongoze, na ana kula Vuga akpwedza kusoma kpwenye chuoche.",
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
    slug: 'shaaban-robert',
    name: "Shaaban Robert",
    era: {
      en: "1909–1962",
      sw: "1909–1962",
      dg: "1909–1962",
    },
    role: {
      en: "Swahili poet and writer",
      sw: "Mshairi na mwandishi wa Kiswahili",
      dg: "Mshairi na mwandishi wa Chiswahili",
    },
    region: "Machui, Tanzania",
    summary: {
      en: "The best-known Swahili writer of the twentieth century was born at Machui, south of Tanga, to a Digo mother. He called himself Swahili, but he grew up among his mother's people, and he is buried at Machui.",
      sw: "Mwandishi wa Kiswahili anayejulikana zaidi wa karne ya ishirini alizaliwa Machui, kusini mwa Tanga, na mama wa Kidigo. Alijiita Mswahili, lakini alikulia miongoni mwa watu wa mama yake, na amezikwa Machui.",
      dg: "Mwandishi wa Chiswahili ariyemanyikana zaidi wa karne ya 20 wavyalwa Machui, kusini ya Tanga, na nineye kala ni Mdigo. Wadziiha Mswahili, ela wakulira kahi ya atu a uphande wa nineye, na wazikpwa Machui.",
    },
  },
  {
    slug: 'abdalla-mnyenze',
    name: "Mzee Abdalla Ali Mnyenze",
    era: {
      en: "Died 2021",
      sw: "Alifariki 2021",
      dg: "Wafwa 2021",
    },
    role: {
      en: "Guardian of Kaya Chinondo",
      sw: "Mlinzi wa Kaya Chinondo",
      dg: "Mrindi wa Kaya Chinondo",
    },
    region: "Chinondo, Kenya",
    summary: {
      en: "An elder of Kaya Chinondo and chair of the Kwale Kaya Elders, he spoke for the sacred forests as hotels and development pressed in. Kwale mourned him as a champion of kaya conservation.",
      sw: "Mzee wa Kaya Chinondo na mwenyekiti wa Wazee wa Kaya wa Kwale, aliitetea misitu mitakatifu huku hoteli na maendeleo yakiisonga. Kwale ilimwomboleza kama shujaa wa uhifadhi wa makaya.",
      dg: "Mzehe wa Kaya Chinondo na mwenyekiti wa Azehe a Kaya a Kwale, waitetea misitu mitakatifu wakati hoteli na maendeleo gachiisonga. Kwale yamririra dza shujaa wa uhifadhi wa makaya.",
    },
  },
];
