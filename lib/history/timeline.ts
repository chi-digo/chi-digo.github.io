import type { Locale } from '@/lib/i18n/config';

export type TimelineEvent = {
  date: string;
  title: Record<Locale, string>;
  description: Record<Locale, string>;
};

export const timelineEvents: TimelineEvent[] = [
  // Era 1: Origins & Settlement (pre-1500s)
  {
    date: 'c. 100 CE+',
    title: {
      en: 'Early Bantu settlement',
      sw: 'Makazi ya awali ya Wabantu',
      dig: 'Makalo ga awali ga Abantu',
    },
    description: {
      en: 'Archaeological evidence shows continuous Bantu occupation of the Kenyan coastal escarpment, with kaya sites showing settlement hierarchies.',
      sw: 'Ushahidi wa kiakiolojia unaonyesha makazi ya kudumu ya Wabantu katika ukingo wa pwani ya Kenya, ambapo maeneo ya makaya yanaonyesha mifumo ya makazi.',
      dig: 'Ushahidi wa chiakiolojia unaonyesha makalo ga kudumu ga Abantu kahi za ukingo wa pwani ya Kenya, ambako maeneo ga makaya ganaonyesha mifumo ya makalo.',
    },
  },
  {
    date: 'c. 1050–1150',
    title: {
      en: 'First contact with Muslims',
      sw: 'Mawasiliano ya kwanza na Waislamu',
      dig: 'Mawasiliano ga kpwandza na Aislamu',
    },
    description: {
      en: 'Arab and Persian traders establish settlements along the coast. The Digo begin centuries of interaction with the Islamic world.',
      sw: 'Wafanyabiashara wa Kiarabu na Kiajemi wanaanzisha makazi kando ya pwani. Wadigo wanaanza karne nyingi za maingiliano na ulimwengu wa Kiislamu.',
      dig: 'Afanyabiashara a Chiarabu na Chiajemi anaanzisha makalo kanda ya pwani. Adigo anaanza karne nyinji za maingiliano na ulimwengu wa Chiislamu.',
    },
  },
  {
    date: 'c. 1200s–1300s',
    title: {
      en: 'Kongo Mosque built',
      sw: 'Msikiti wa Kongo unajengwa',
      dig: 'Msikiti wa Kongo unadzengwa',
    },
    description: {
      en: 'One of the oldest mosques in East Africa, built with coral stone in Diani by Arab merchants. Rediscovered c. 1700s by Sheikh Mwinyi Kombo, guided by a dream.',
      sw: 'Mojawapo ya misikiti ya zamani zaidi Afrika Mashariki, uliojengwa kwa mawe ya matumbawe huko Diani na wafanyabiashara wa Kiarabu. Uligunduliwa tena c. 1700s na Sheikh Mwinyi Kombo, akiongozwa na ndoto.',
      dig: 'Mojawapo ya misikiti ya zamani zaidi Afrika ya Mashariki, uriodzengwa kpwa mawe ga matumbawe kuko Diani ni afanyabiashara a Chiarabu. Uligundulwa tsena c. 1700s ni Sheikh Mwinyi Kombo, achiongozwa ni ndoso.',
    },
  },
  {
    date: 'c. 1400s–1500s',
    title: {
      en: 'Digo settle in present homeland',
      sw: 'Wadigo wanakaa katika makazi yao ya sasa',
      dig: 'Adigo anakala kahi za makalo gao ga sambi',
    },
    description: {
      en: 'The Digo establish themselves in the coastal plains and hinterland ridges between Mombasa and Tanga, the first Mijikenda group to depart Shungwaya according to oral tradition.',
      sw: 'Wadigo wanajiimarisha katika tambarare za pwani na vilima vya bara kati ya Mombasa na Tanga, kundi la kwanza la Mijikenda kuondoka Shungwaya kulingana na mapokeo ya mdomo.',
      dig: 'Adigo anadziimarisha kahi za tambarare za pwani na vilima vya bara kahi ya Mombasa na Tanga, kundi ra kpwandza ra Amijikenda kuuka Shungwaya kulengana na mapokeo ga mdomo.',
    },
  },

  // Era 2: The Kaya Period (1500s-1900s)
  {
    date: 'c. 1500s–1600s',
    title: {
      en: 'Kaya settlements established',
      sw: 'Makazi ya makaya yanaanzishwa',
      dig: 'Makalo ga makaya ganaanzishwa',
    },
    description: {
      en: 'Fortified hilltop villages in cleared forest glades become the political, spiritual, and defensive centres of Digo life.',
      sw: 'Vijiji vilivyoimarishwa vilimani katika maeneo ya wazi ya misitu vinakuwa vituo vya kisiasa, kiroho, na ulinzi vya maisha ya Wadigo.',
      dig: 'Vijiji virivyoimarishwa vilimani kahi za maeneo ga wazi ga misitu vinakala vituo vya chisiasa, chiroho, na ulinzi vya maisha ga Adigo.',
    },
  },
  {
    date: '1500–1698',
    title: {
      en: 'Portuguese domination',
      sw: 'Utawala wa Wareno',
      dig: 'Utawala wa Areno',
    },
    description: {
      en: 'The Portuguese monopolise Indian Ocean trade. Mijikenda communities retreat deeper into hinterland forests to avoid submission. Fort Jesus completed in Mombasa (1596).',
      sw: 'Wareno wanamiliki biashara ya Bahari ya Hindi. Jamii za Mijikenda zinajificha ndani zaidi ya misitu ya bara ili kuepuka utiifu. Ngome ya Jesus inakamilishwa Mombasa (1596).',
      dig: 'Areno anamiliki biashara ya Bahari ya Hindi. Jamii za Amijikenda zinadzifisha ndani zaidi ya misitu ya bara ili kuepuka utiifu. Ngome ya Jesus inakamilishwa Mombasa (1596).',
    },
  },
  {
    date: '1698',
    title: {
      en: 'Omani capture Fort Jesus',
      sw: 'Waomani wanateka Ngome ya Jesus',
      dig: 'Aomani anateka Ngome ya Jesus',
    },
    description: {
      en: 'Saif bin Sultan ends Portuguese rule on the northern Swahili coast. Arab-Digo trade interactions intensify under Omani suzerainty.',
      sw: 'Saif bin Sultan anamaliza utawala wa Wareno katika pwani ya kaskazini ya Kiswahili. Maingiliano ya biashara kati ya Waarabu na Wadigo yanaongezeka chini ya utawala wa Waomani.',
      dig: 'Saif bin Sultan anamaliza utawala wa Areno kahi za pwani ya kaskazini ya Chiswahili. Maingiliano ga biashara kahi ya Aarabu na Adigo ganaongezeka tsini ya utawala wa Aomani.',
    },
  },
  {
    date: '1840s–1850s',
    title: {
      en: 'First Digo convert to Islam',
      sw: 'Mdigo wa kwanza kuingia Uislamu',
      dig: 'Mdigo wa kpwandza kuingia Uislamu',
    },
    description: {
      en: 'The beginning of a transformation that will make the Digo the only majority-Muslim Mijikenda group. Driven by proximity to Swahili communities, healing practices, and trade.',
      sw: 'Mwanzo wa mabadiliko yatakayofanya Wadigo kuwa kundi pekee la Waislamu wengi miongoni mwa Mijikenda. Yakisukumwa na ukaribu na jamii za Kiswahili, matibabu, na biashara.',
      dig: 'Mwanzo wa mabadiliko gandagohenda Adigo kukala kundi ra pekee ra Aislamu anji kahi za Amijikenda. Gachisukumwa ni ukaribu na jamii za Chiswahili, matibabu, na biashara.',
    },
  },
  {
    date: '1875–1884',
    title: {
      en: 'Peak of coastal slave trade',
      sw: 'Kilele cha biashara ya watumwa pwani',
      dig: 'Chirele cha biashara ya atumwa pwani',
    },
    description: {
      en: 'An estimated 43,000–47,000 enslaved people constitute ~44% of the coastal population. Shimoni Caves in Kwale serve as holding pens. Many Digo are enslaved; some gain freedom through conversion to Islam.',
      sw: 'Watu 43,000–47,000 waliofanywa watumwa wanaunda ~44% ya watu wa pwani. Mapango ya Shimoni huko Kwale yanatumika kama magereza. Wadigo wengi wanafanywa watumwa; baadhi wanapata uhuru kwa kuingia Uislamu.',
      dig: 'Atu 43,000–47,000 ariohendwa atumwa anaunda ~44% ya atu a pwani. Mapango ga Shimoni kuko Kwale ganahumika dza magereza. Adigo anji anahendwa atumwa; anjine anapata uhuru kpwa kuingia Uislamu.',
    },
  },

  // Era 3: Colonial Period (1886-1963)
  {
    date: '1886',
    title: {
      en: 'Anglo-German Treaty',
      sw: 'Mkataba wa Anglo-German',
      dig: 'Mkataba wa Anglo-German',
    },
    description: {
      en: 'Britain and Germany divide East Africa, splitting the Digo homeland between two colonial powers. The ten-mile coastal strip is allocated to the Sultan of Zanzibar, making Mijikenda squatters on ancestral land.',
      sw: 'Uingereza na Ujerumani zinagawanya Afrika Mashariki, zikigawanya makazi ya Wadigo kati ya mamlaka mbili za kikoloni. Ukanda wa maili kumi wa pwani unapewa Sultani wa Zanzibar, na kufanya Mijikenda kuwa wavamizi katika ardhi ya mababu zao.',
      dig: 'Uingereza na Ujerumani zinagawanya Afrika ya Mashariki, zichigawanya makalo ga Adigo kahi ya mamlaka mbiri za chikoloni. Ukanda wa maili kumi wa pwani unapewa Sultani wa Zanzibar, na kuhenda Amijikenda kukala avamizi kahi za ardhi ya ababu zao.',
    },
  },
  {
    date: '1888–1889',
    title: {
      en: 'Abushiri Revolt',
      sw: 'Uasi wa Abushiri',
      dig: 'Uasi wa Abushiri',
    },
    description: {
      en: 'Coastal rebellion against German rule engulfs Tanga and surrounding Wadigo territory. Led by Abushiri ibn Salim, the uprising draws in Arab, Swahili, and African populations.',
      sw: 'Uasi wa pwani dhidi ya utawala wa Wajerumani unazagaa Tanga na maeneo ya Wadigo yanayozunguka. Ukiongozwa na Abushiri ibn Salim, uasi huo unavuta Waarabu, Waswahili, na watu wa Kiafrika.',
      dig: 'Uasi wa pwani dhidi ya utawala wa Ajerumani unazagaa Tanga na maeneo ga Adigo ganagozunguka. Uchiongozwa ni Abushiri ibn Salim, uasi uhu unavuta Aarabu, Aswahili, na atu a Chiafrika.',
    },
  },
  {
    date: '1897–1900',
    title: {
      en: 'Great Famine and smallpox',
      sw: 'Njaa kuu na ndui',
      dig: 'Ndzala kulu na ndui',
    },
    description: {
      en: 'Combined famine, drought, locusts, cattle plague, and smallpox devastate the coast. Estimated 50–90% mortality in some areas, weakening communities at the moment of colonial consolidation.',
      sw: 'Njaa, ukame, nzige, tauni ya ng\'ombe, na ndui vinahaharibu pwani. Kiwango cha vifo kinakadiriwa 50–90% katika maeneo mengine, na kudhoofisha jamii wakati wa uimarishaji wa ukoloni.',
      dig: 'Ndzala, ukame, nzige, tauni ya ng\'ombe, na ndui vinaharibu pwani. Chiwango cha vifo chinakadiriwa 50–90% kahi za maeneo ganjine, na kudhoofisha jamii wakati wa uimarishaji wa ukoloni.',
    },
  },
  {
    date: '1905–1907',
    title: {
      en: 'Maji Maji Rebellion',
      sw: 'Vita vya Maji Maji',
      dig: 'Vita vya Maji Maji',
    },
    description: {
      en: 'Major uprising against German forced cotton cultivation in Tanganyika. The Digo around Tanga are among the affected populations. Between 75,000–300,000 die, mostly from German scorched-earth reprisals.',
      sw: 'Uasi mkubwa dhidi ya ulimaji wa pamba wa kulazimishwa na Wajerumani huko Tanganyika. Wadigo karibu na Tanga ni miongoni mwa watu walioathirika. Kati ya 75,000–300,000 wanakufa, wengi kutokana na kisasi cha kuchoma ardhi cha Wajerumani.',
      dig: 'Uasi mukulu dhidi ya ulimaji wa pamba wa kulazimishwa ni Ajerumani kuko Tanganyika. Adigo phephi na Tanga ni kahi za atuarioathirika. Kahi ya 75,000–300,000 anakufwa, anji kpwa sababu ya kisasi cha kuchoma ardhi cha Ajerumani.',
    },
  },
  {
    date: '1913–1914',
    title: {
      en: 'Giriama Uprising',
      sw: 'Uasi wa Wagiriama',
      dig: 'Uasi wa Agiriama',
    },
    description: {
      en: 'Mekatilili wa Menza leads Giriama resistance against British forced labour and taxes. Though primarily Giriama, this is the defining Mijikenda anti-colonial event.',
      sw: 'Mekatilili wa Menza anaongoza upinzani wa Wagiriama dhidi ya kazi za kulazimishwa na kodi za Waingereza. Ingawa ni wa Wagiriama hasa, huu ndio tukio kuu la kupinga ukoloni la Mijikenda.',
      dig: 'Mekatilili wa Menza anaongoza upinzani wa Agiriama dhidi ya kazi za kulazimishwa na kodi za Aingereza. Ingawa ni wa Agiriama hasa, uhu ndiyo tukio kulu ra kupinga ukoloni ra Amijikenda.',
    },
  },
  {
    date: '1920s',
    title: {
      en: 'Digo become majority Muslim',
      sw: 'Wadigo wanakuwa Waislamu wengi',
      dig: 'Adigo anakala Aislamu anji',
    },
    description: {
      en: 'Mosques and Quranic schools spread across Kwale. The Digo are the first Mijikenda group to build their own mosques, in villages like Kibiga Kirau and Hormuz.',
      sw: 'Misikiti na shule za Qurani zinasambaa Kwale kote. Wadigo ni kundi la kwanza la Mijikenda kujenga misikiti yao wenyewe, katika vijiji kama Kibiga Kirau na Hormuz.',
      dig: 'Misikiti na shule za Qurani zinasambaa Kwale kose. Adigo ni kundi ra kpwandza ra Amijikenda kudzenga misikiti yao enye, kahi za vijiji dza Kibiga Kirau na Hormuz.',
    },
  },
  {
    date: '1940s',
    title: {
      en: 'Last kayas abandoned',
      sw: 'Makaya ya mwisho yanaachwa',
      dig: 'Makaya ga mwisho ganarichwa',
    },
    description: {
      en: 'Population growth, trade opportunities, and colonial pressures lead to abandonment of kaya settlements. The forests are preserved as sacred sites and ancestral abodes.',
      sw: 'Ongezeko la watu, fursa za biashara, na shinikizo la kikoloni vinaongoza kuachwa kwa makazi ya makaya. Misitu inahifadhiwa kama maeneo matakatifu na makazi ya mababu.',
      dig: 'Ongezeko ra atu, fursa za biashara, na shinikizo ra chikoloni vinaongoza kurichwa kpwa makalo ga makaya. Misitu inahifadhiwa dza maeneo matakatifu na makalo ga ababu.',
    },
  },
  {
    date: '1948',
    title: {
      en: 'Digo District renamed Kwale',
      sw: 'Wilaya ya Digo inaitwa Kwale',
      dig: 'Wilaya ya Digo inaihwa Kwale',
    },
    description: {
      en: 'Administrative change reflecting evolving colonial nomenclature. The Mijikenda Union, founded in 1944, advocates for collective coastal political identity.',
      sw: 'Mabadiliko ya kiutawala yanayoonyesha mabadiliko ya majina ya kikoloni. Muungano wa Mijikenda, ulioanzishwa 1944, unatetea utambulisho wa kisiasa wa pamoja wa pwani.',
      dig: 'Mabadiliko ga chiutawala ganagoonyesha mabadiliko ga madzinya ga chikoloni. Muungano wa Amijikenda, urioanzishwa 1944, unatetea utambulisho wa chisiasa wa phamwenga wa pwani.',
    },
  },

  // Era 4: Independence & Modern Era (1963-present)
  {
    date: '1961–1963',
    title: {
      en: 'Independence',
      sw: 'Uhuru',
      dig: 'Uhuru',
    },
    description: {
      en: 'Tanganyika independent (1961), coastal strip ceded to Kenya (Oct 1963), Kenya independent (Dec 1963). The Mwambao movement for coastal autonomy fails; the Digo are divided between two nations.',
      sw: 'Tanganyika huru (1961), ukanda wa pwani unapewa Kenya (Okt 1963), Kenya huru (Des 1963). Vuguvugu la Mwambao la uhuru wa pwani linashindwa; Wadigo wanagawanywa kati ya mataifa mawili.',
      dig: 'Tanganyika huru (1961), ukanda wa pwani unapewa Kenya (Okt 1963), Kenya huru (Des 1963). Vuguvugu ra Mwambao ra uhuru wa pwani rinashindwa; Adigo anagawanywa kahi ya mataifa mairi.',
    },
  },
  {
    date: '1983',
    title: {
      en: 'Kongo Mosque gazetted',
      sw: 'Msikiti wa Kongo unatangazwa',
      dig: 'Msikiti wa Kongo unatangazwa',
    },
    description: {
      en: 'The 13th-century mosque in Diani is declared a national monument by the National Museums of Kenya.',
      sw: 'Msikiti wa karne ya 13 huko Diani unatangazwa kuwa mnara wa kitaifa na Makumbusho ya Kitaifa ya Kenya.',
      dig: 'Msikiti wa karne ya 13 kuko Diani unatangazwa kukala mnara wa chitaifa ni Makumbusho ga Chitaifa ga Kenya.',
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
    date: '1997',
    title: {
      en: 'Likoni clashes',
      sw: 'Mapigano ya Likoni',
      dig: 'Mapigano ga Likoni',
    },
    description: {
      en: 'Politically motivated violence in which Digo youth, recruited at Kaya Bombo, attack Likoni. ~100 killed, ~100,000 displaced. The Akiwumi Report finds KANU officials funded the militia.',
      sw: 'Vurugu za kisiasa ambapo vijana wa Kidigo, walioandikishwa Kaya Bombo, wanashambulia Likoni. ~100 wanauawa, ~100,000 wanakimbishwa. Ripoti ya Akiwumi inapata kwamba maafisa wa KANU walifadhili wanamgambo.',
      dig: 'Vurugu za chisiasa ambako vijana va Chidigo, varioandikishwa Kaya Bombo, vanashambulia Likoni. ~100 vanaulagwa, ~100,000 vanakimbishwa. Ripoti ya Akiwumi inapata kukala maafisa a KANU arifadhili anamgambo.',
    },
  },
  {
    date: '2008',
    title: {
      en: 'UNESCO World Heritage inscription',
      sw: 'Makaya yanaorodheshwa kama Urithi wa Dunia wa UNESCO',
      dig: 'Makaya ganaorodheshwa dza Urithi wa Dunia wa UNESCO',
    },
    description: {
      en: 'Eleven Mijikenda kaya forests, including Kaya Kinondo, inscribed as Sacred Mijikenda Kaya Forests. The following year, kaya traditions are placed on UNESCO\'s Urgent Safeguarding list.',
      sw: 'Misitu kumi na moja ya makaya ya Mijikenda, ikiwa ni pamoja na Kaya Kinondo, inaorodheshwa kama Misitu Mitakatifu ya Makaya ya Mijikenda. Mwaka unaofuata, mila za makaya zinawekwa kwenye orodha ya UNESCO ya Kulinda kwa Dharura.',
      dig: 'Misitu kumi na moja ya makaya ya Amijikenda, ichiwa ni phamwenga na Kaya Kinondo, inaorodheshwa dza Misitu Mitakatifu ya Makaya ya Amijikenda. Mwaka unaofuata, mila za makaya zinawekwa kpwa orodha ya UNESCO ya Kulinda kpwa Dharura.',
    },
  },
  {
    date: '2014–present',
    title: {
      en: 'Kwale titanium mining',
      sw: 'Uchimbaji wa titanium Kwale',
      dig: 'Uchimbaji wa titanium Kwale',
    },
    description: {
      en: 'Base Titanium begins exporting titanium from Kwale, displacing 3,000+ residents and destroying coconut and cashew groves. Decommissioning begins c. 2025 amid environmental protests.',
      sw: 'Base Titanium inaanza kusafirisha titanium kutoka Kwale, ikiwahama wakazi 3,000+ na kuharibu mashamba ya minazi na korosho. Uondoaji unaanza c. 2025 kati ya maandamano ya mazingira.',
      dig: 'Base Titanium inaanza kusafirisha titanium kula Kwale, ichiahama akazi 3,000+ na kuharibu mashamba ga minazi na korosho. Uondoaji unaanza c. 2025 kahi ya maandamano ga mazingira.',
    },
  },
];
