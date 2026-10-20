import type { Locale } from '@/lib/i18n/config';

export type Era = 'origins' | 'kaya' | 'colonial' | 'modern';

export type TimelineEvent = {
  era: Era;
  date: string;
  title: Record<Locale, string>;
  description: Record<Locale, string>;
};

export const eraLabels: Record<Era, Record<Locale, string>> = {
  origins: {
    en: 'Origins & Settlement',
    sw: 'Asili na Makazi',
    dg: 'Asili na Makalo',
  },
  kaya: {
    en: 'The Kaya Period',
    sw: 'Kipindi cha Makaya',
    dg: 'Chipindi cha Makaya',
  },
  colonial: {
    en: 'Colonial Period',
    sw: 'Kipindi cha Ukoloni',
    dg: 'Chipindi cha Ukoloni',
  },
  modern: {
    en: 'Independence & Modern Era',
    sw: 'Uhuru na Enzi ya Kisasa',
    dg: 'Uhuru na Enzi ya Chisambi',
  },
};

export const eraColors: Record<Era, string> = {
  origins: 'var(--color-mnazi-gold)',
  kaya: 'var(--color-kaya-indigo)',
  colonial: 'var(--color-ngundu-red)',
  modern: 'var(--color-mangrove-green)',
};

export const timelineEvents: TimelineEvent[] = [
  // Era 1: Origins & Settlement (pre-1500s)
  {
    era: 'origins',
    date: 'c. 100 CE+',
    title: {
      en: 'Early Bantu settlement',
      sw: 'Makazi ya awali ya Wabantu',
      dg: 'Makalo ga awali ga Abantu',
    },
    description: {
      en: 'Archaeological evidence shows continuous Bantu occupation of the Kenyan coastal escarpment, with kaya sites showing settlement hierarchies.',
      sw: 'Ushahidi wa kiakiolojia unaonyesha makazi ya kudumu ya Wabantu katika ukingo wa pwani ya Kenya, ambapo maeneo ya makaya yanaonyesha mifumo ya makazi.',
      dg: 'Ushahidi wa chiakiolojia unaonyesha makalo ga kudumu ga Abantu kahi za ukingo wa pwani ya Kenya, ambako maeneo ga makaya ganaonyesha mifumo ya makalo.',
    },
  },
  {
    era: 'origins',
    date: 'c. 1050–1150',
    title: {
      en: 'First contact with Muslims',
      sw: 'Mawasiliano ya kwanza na Waislamu',
      dg: 'Mawasiliano ga kpwandza na Aislamu',
    },
    description: {
      en: 'Arab and Persian traders establish settlements along the coast. The Digo begin centuries of interaction with the Islamic world.',
      sw: 'Wafanyabiashara wa Kiarabu na Kiajemi wanaanzisha makazi kando ya pwani. Wadigo wanaanza karne nyingi za maingiliano na ulimwengu wa Kiislamu.',
      dg: 'Afanyabiashara a Chiarabu na Chiajemi anaanzisha makalo kanda ya pwani. Adigo anaanza karne nyinji za maingiliano na ulimwengu wa Chiislamu.',
    },
  },
  {
    era: 'origins',
    date: 'c. 1300s–1500s',
    title: {
      en: 'Kongo Mosque built',
      sw: 'Msikiti wa Kongo unajengwa',
      dg: 'Msikiti wa Kongo unadzengwa',
    },
    description: {
      en: 'A coral-stone mosque with domes and barrel vaults on the Mwachema River at Diani. It has never been excavated; pottery found nearby dates from the 14th to the 16th centuries.',
      sw: 'Msikiti wa mawe ya matumbawe wenye kuba na dari za tao kando ya Mto Mwachema huko Diani. Haujawahi kuchimbuliwa; vipande vya vyungu vilivyopatikana karibu ni vya karne ya 14 hadi ya 16.',
      dg: 'Msikiti wa mawe ga matumbawe wenye makuba kando ya Muho wa Mwachema iko Diani. Taudzangbwe kuchimbulwa; vipande vya nyungu viriphahikana phephi ni vya karne ya 14 hadi ya 16.',
    },
  },
  {
    era: 'origins',
    date: 'c. 1400s–1500s',
    title: {
      en: 'Digo settle in present homeland',
      sw: 'Wadigo wanakaa katika makazi yao ya sasa',
      dg: 'Adigo anakala kahi za makalo gao ga sambi',
    },
    description: {
      en: 'The Digo establish themselves in the coastal plains and hinterland ridges between Mombasa and Tanga, the first Mijikenda group to depart Shungwaya according to oral tradition.',
      sw: 'Wadigo wanajiimarisha katika tambarare za pwani na vilima vya bara kati ya Mombasa na Tanga, kundi la kwanza la Mijikenda kuondoka Shungwaya kulingana na mapokeo ya mdomo.',
      dg: 'Adigo anadziimarisha kahi za tambarare za pwani na vilima vya bara kahi ya Mombasa na Tanga, kundi ra kpwandza ra Amijikenda kuuka Shungwaya kulengana na mapokeo ga mdomo.',
    },
  },

  // Era 2: The Kaya Period (1500s-1900s)
  {
    era: 'kaya',
    date: 'c. 1500s–1600s',
    title: {
      en: 'Kaya settlements established',
      sw: 'Makazi ya makaya yanaanzishwa',
      dg: 'Makalo ga makaya ganaanzishwa',
    },
    description: {
      en: 'Fortified hilltop villages in cleared forest glades become the political, spiritual, and defensive centres of Digo life.',
      sw: 'Vijiji vilivyoimarishwa vilimani katika maeneo ya wazi ya misitu vinakuwa vituo vya kisiasa, kiroho, na ulinzi vya maisha ya Wadigo.',
      dg: 'Vijiji virivyoimarishwa vilimani kahi za maeneo ga wazi ga misitu vinakala vituo vya chisiasa, chiroho, na ulinzi vya maisha ga Adigo.',
    },
  },
  {
    era: 'kaya',
    date: '1500–1698',
    title: {
      en: 'Portuguese domination',
      sw: 'Utawala wa Wareno',
      dg: 'Utawala wa Areno',
    },
    description: {
      en: 'The Portuguese monopolise Indian Ocean trade. Mijikenda communities retreat deeper into hinterland forests to avoid submission. Fort Jesus completed in Mombasa (1596).',
      sw: 'Wareno wanamiliki biashara ya Bahari ya Hindi. Jamii za Mijikenda zinajificha ndani zaidi ya misitu ya bara ili kuepuka utiifu. Ngome ya Jesus inakamilishwa Mombasa (1596).',
      dg: 'Areno anamiliki biashara ya Bahari ya Hindi. Jamii za Amijikenda zinadzifisha ndani zaidi ya misitu ya bara ili kuepuka utiifu. Ngome ya Jesus inakamilishwa Mombasa (1596).',
    },
  },
  {
    era: 'kaya',
    date: '1698',
    title: {
      en: 'Omani capture Fort Jesus',
      sw: 'Waomani wanateka Ngome ya Jesus',
      dg: 'Aomani anateka Ngome ya Jesus',
    },
    description: {
      en: 'Saif bin Sultan ends Portuguese rule on the northern Swahili coast. Arab-Digo trade interactions intensify under Omani suzerainty.',
      sw: 'Saif bin Sultan anamaliza utawala wa Wareno katika pwani ya kaskazini ya Kiswahili. Maingiliano ya biashara kati ya Waarabu na Wadigo yanaongezeka chini ya utawala wa Waomani.',
      dg: 'Saif bin Sultan anamaliza utawala wa Areno kahi za pwani ya kaskazini ya Chiswahili. Maingiliano ga biashara kahi ya Aarabu na Adigo ganaongezeka tsini ya utawala wa Aomani.',
    },
  },
  {
    era: 'kaya',
    date: 'c. 1800',
    title: {
      en: 'Kubo rulership founded',
      sw: 'Utawala wa Kubo unaanzishwa',
      dg: 'Utawala wa Kubo unaandzishwa',
    },
    description: {
      en: 'By Chikoneni tradition, Mbogo Mwamzungu, a rain-maker from Kwale, is accepted as leader of the southern Digo after a famine. He rules from Kaya Dzombo, and his title, Kubo, becomes hereditary.',
      sw: 'Kwa mapokeo ya Chikoneni, Mbogo Mwamzungu, mganga wa mvua kutoka Kwale, anakubaliwa kuwa kiongozi wa Wadigo wa kusini baada ya njaa. Anatawala kutoka Kaya Dzombo, na cheo chake, Kubo, kinakuwa cha kurithiwa.',
      dg: 'Kpwa hadithi za Chikoneni, Mbogo Mwamzungu, mgbwanga wa mvula kula Kwale, anakubalika kukala chiongozi wa Adigo a kusini bada ya ndzala. Anatawala kula Kaya Dzombo, na cheoche, Kubo, chinakala cha kurithiwa.',
    },
  },
  {
    era: 'kaya',
    date: '1840s–1850s',
    title: {
      en: 'First Digo convert to Islam',
      sw: 'Mdigo wa kwanza kuingia Uislamu',
      dg: 'Mdigo wa kpwandza kuingia Uislamu',
    },
    description: {
      en: 'The beginning of a transformation that will make the Digo the only majority-Muslim Mijikenda group. Driven by proximity to Swahili communities, healing practices, and trade.',
      sw: 'Mwanzo wa mabadiliko yatakayofanya Wadigo kuwa kundi pekee la Waislamu wengi miongoni mwa Mijikenda. Yakisukumwa na ukaribu na jamii za Kiswahili, matibabu, na biashara.',
      dg: 'Mwanzo wa mabadiliko gandagohenda Adigo kukala kundi ra pekee ra Aislamu anji kahi za Amijikenda. Gachisukumwa ni ukaribu na jamii za Chiswahili, matibabu, na biashara.',
    },
  },
  {
    era: 'kaya',
    date: 'c. 1865–1894',
    title: {
      en: 'Kubo Mangaru resists Mbaruk',
      sw: 'Kubo Mangaru anampinga Mbaruk',
      dg: 'Kubo Mangaru anampinga Mbaruk',
    },
    description: {
      en: 'Shaykh Mbaruk of Gasi raids the Gasi–Vanga hinterland. Kubo Mangaru Mwajita of Chikoneni is the one Digo ruler strong enough to resist; the Sultan of Zanzibar sends Baluchi soldiers to protect him.',
      sw: 'Shekhe Mbaruk wa Gasi anavamia maeneo ya bara kati ya Gasi na Vanga. Kubo Mangaru Mwajita wa Chikoneni ndiye mtawala pekee wa Kidigo mwenye nguvu za kumpinga; Sultani wa Zanzibar anatuma askari wa Kibaluchi kumlinda.',
      dg: 'Shehe Mbaruk wa Gasi anavamia maeneo ga bara kahi ya Gasi na Vanga. Kubo Mangaru Mwajita wa Chikoneni ndiye mtawala wa pekee wa Chidigo mwenye nguvu za kumpinga; Sultani wa Zanzibar anahuma asikari a Chibaluchi kumrinda.',
    },
  },
  {
    era: 'kaya',
    date: '1875–1884',
    title: {
      en: 'Peak of coastal slave trade',
      sw: 'Kilele cha biashara ya watumwa pwani',
      dg: 'Chirele cha biashara ya atumwa pwani',
    },
    description: {
      en: 'An estimated 43,000–47,000 enslaved people constitute ~44% of the coastal population. Shimoni Caves in Kwale serve as holding pens. Many Digo are enslaved; some gain freedom through conversion to Islam.',
      sw: 'Watu 43,000–47,000 waliofanywa watumwa wanaunda ~44% ya watu wa pwani. Mapango ya Shimoni huko Kwale yanatumika kama magereza. Wadigo wengi wanafanywa watumwa; baadhi wanapata uhuru kwa kuingia Uislamu.',
      dg: 'Atu 43,000–47,000 ariohendwa atumwa anaunda ~44% ya atu a pwani. Mapango ga Shimoni iko Kwale ganahumika dza magereza. Adigo anji anahendwa atumwa; anjina anapata uhuru kpwa kuingia Uislamu.',
    },
  },

  // Era 3: Colonial Period (1886-1963)
  {
    era: 'colonial',
    date: '1886',
    title: {
      en: 'Anglo-German Treaty',
      sw: 'Mkataba wa Anglo-German',
      dg: 'Mkataba wa Anglo-German',
    },
    description: {
      en: 'Britain and Germany divide East Africa, splitting the Digo homeland between two colonial powers. The ten-mile coastal strip is allocated to the Sultan of Zanzibar, making Mijikenda squatters on ancestral land.',
      sw: 'Uingereza na Ujerumani zinagawanya Afrika Mashariki, zikigawanya makazi ya Wadigo kati ya mamlaka mbili za kikoloni. Ukanda wa maili kumi wa pwani unapewa Sultani wa Zanzibar, na kufanya Mijikenda kuwa wavamizi katika ardhi ya mababu zao.',
      dg: 'Uingereza na Ujerumani zinagawanya Afrika ya Mashariki, zichigawanya makalo ga Adigo kahi ya mamlaka mbiri za chikoloni. Ukanda wa maili kumi wa pwani unapewa Sultani wa Zanzibar, na kuhenda Amijikenda kukala avamizi kahi za ardhi ya ababu zao.',
    },
  },
  {
    era: 'colonial',
    date: '1888–1889',
    title: {
      en: 'Abushiri Revolt',
      sw: 'Uasi wa Abushiri',
      dg: 'Uasi wa Abushiri',
    },
    description: {
      en: 'Coastal rebellion against German rule engulfs Tanga and surrounding Wadigo territory. Led by Abushiri ibn Salim, the uprising draws in Arab, Swahili, and African populations.',
      sw: 'Uasi wa pwani dhidi ya utawala wa Wajerumani unazagaa Tanga na maeneo ya Wadigo yanayozunguka. Ukiongozwa na Abushiri ibn Salim, uasi huo unavuta Waarabu, Waswahili, na watu wa Kiafrika.',
      dg: 'Uasi wa pwani dhidi ya utawala wa Ajerumani unazagaa Tanga na maeneo ga Adigo ganagozunguka. Uchiongozwa ni Abushiri ibn Salim, uasi uhu unavuta Aarabu, Aswahili, na atu a Chiafrika.',
    },
  },
  {
    era: 'colonial',
    date: '1891–1892',
    title: {
      en: 'The Wadigo haul down the German flag',
      sw: 'Wadigo washusha bendera ya Kijerumani',
      dg: 'Adigo anausa bendera ya Chijerumani',
    },
    description: {
      en: "Inland from Tanga, the Digo around Gombelo tear down the German flag, declare themselves independent, drive a German officer back to Amboni and burn the plantation company's barns. A punitive expedition under von Bülow burns their villages and drives off their livestock.",
      sw: 'Bara ya Tanga, Wadigo wa karibu na Gombelo wanashusha bendera ya Kijerumani, wanajitangaza huru, wanamrudisha nyuma afisa wa Kijerumani hadi Amboni na kuchoma ghala za kampuni ya mashamba. Kikosi cha adhabu chini ya von Bülow kinachoma vijiji vyao na kuchukua mifugo yao.',
      dg: 'Bara ya Tanga, Adigo a phephi na Gombelo anausa bendera ya Chijerumani, anadzitangaza kukala huru, anamzoresa afisa Mjerumani hadi Amboni na anaocha vitsaga vya kampuni ya mashamba. Asikari a Chijerumani a adhabu, achilongozwa ni von Bülow, anaocha vidzidzi vyao na anahala mifugo yao.',
    },
  },
  {
    era: 'colonial',
    date: '1895–1896',
    title: {
      en: 'The Mazrui rising',
      sw: 'Uasi wa Mazrui',
      dg: 'Uasi wa Mazrui',
    },
    description: {
      en: "Mbaruk bin Rashid leads the Mazrui against the new British protectorate. Most Digo south of Mombasa stay out; the Digo of Kaya Chinondo and around Mbaruk's stronghold at Mwele join the rising.",
      sw: 'Mbaruk bin Rashid anaongoza Wamazrui dhidi ya utawala mpya wa Waingereza. Wadigo wengi wa kusini mwa Mombasa hawajiungi; Wadigo wa Kaya Chinondo na wa karibu na ngome ya Mbaruk huko Mwele wanajiunga na uasi.',
      dg: 'Mbaruk bin Rashid analongoza Amazrui dhidi ya utawala muphya wa Aingereza. Adigo anji a kusini mwa Mombasa taadziunga; Adigo a Kaya Chinondo na a phephi na ngome ya Mbaruk iko Mwele anadziunga na uasi.',
    },
  },
  {
    era: 'colonial',
    date: '1897–1900',
    title: {
      en: 'Great Famine and smallpox',
      sw: 'Njaa kuu na ndui',
      dg: 'Ndzala kulu na ndui',
    },
    description: {
      en: 'Combined famine, drought, locusts, cattle plague, and smallpox devastate the coast. Estimated 50–90% mortality in some areas, weakening communities at the moment of colonial consolidation.',
      sw: 'Njaa, ukame, nzige, tauni ya ng\'ombe, na ndui vinahaharibu pwani. Kiwango cha vifo kinakadiriwa 50–90% katika maeneo mengine, na kudhoofisha jamii wakati wa uimarishaji wa ukoloni.',
      dg: 'Ndzala, ukame, nzige, tauni ya ng\'ombe, na ndui vinaharibu pwani. Chiwango cha vifo chinakadiriwa 50–90% kahi za maeneo ganjine, na kudhoofisha jamii wakati wa uimarishaji wa ukoloni.',
    },
  },
  {
    era: 'colonial',
    date: '1905–1907',
    title: {
      en: 'Maji Maji Rebellion',
      sw: 'Vita vya Maji Maji',
      dg: 'Vita vya Maji Maji',
    },
    description: {
      en: 'Major uprising against German forced cotton cultivation in Tanganyika. The Digo around Tanga are among the affected populations. Between 75,000–300,000 die, mostly from German scorched-earth reprisals.',
      sw: 'Uasi mkubwa dhidi ya ulimaji wa pamba wa kulazimishwa na Wajerumani huko Tanganyika. Wadigo karibu na Tanga ni miongoni mwa watu walioathirika. Kati ya 75,000–300,000 wanakufa, wengi kutokana na kisasi cha kuchoma ardhi cha Wajerumani.',
      dg: 'Uasi mukulu dhidi ya ulimaji wa pamba wa kulazimishwa ni Ajerumani iko Tanganyika. Adigo phephi na Tanga ni kahi za atuarioathirika. Kahi ya 75,000–300,000 anakufwa, anji kpwa sababu ya kisasi cha kuchoma ardhi cha Ajerumani.',
    },
  },
  {
    era: 'colonial',
    date: 'c. 1907',
    title: {
      en: "Diani's first mosque",
      sw: 'Msikiti wa kwanza wa Diani',
      dg: 'Msikiti wa kpwandza wa Diani',
    },
    description: {
      en: 'Abdallah Mwapodzo, mwanatsi (senior elder) of Kaya Diani, builds the Mwaroni Mosque, the first in Diani.',
      sw: 'Abdallah Mwapodzo, mwanatsi (mzee mkuu) wa Kaya Diani, anajenga Msikiti wa Mwaroni, wa kwanza Diani.',
      dg: 'Abdallah Mwapodzo, mwanatsi (mzehe mkpwulu) wa Kaya Diani, anadzenga Msikiti wa Mwaroni, wa kpwandza Diani.',
    },
  },
  {
    era: 'colonial',
    date: '1913–1914',
    title: {
      en: 'Giriama Uprising',
      sw: 'Uasi wa Wagiriama',
      dg: 'Uasi wa Agiriama',
    },
    description: {
      en: 'Mekatilili wa Menza leads Giriama resistance against British forced labour and taxes. Though primarily Giriama, this is the defining Mijikenda anti-colonial event.',
      sw: 'Mekatilili wa Menza anaongoza upinzani wa Wagiriama dhidi ya kazi za kulazimishwa na kodi za Waingereza. Ingawa ni wa Wagiriama hasa, huu ndio tukio kuu la kupinga ukoloni la Mijikenda.',
      dg: 'Mekatilili wa Menza anaongoza upinzani wa Agiriama dhidi ya kazi za kulazimishwa na kodi za Aingereza. Ingawa ni wa Agiriama hasa, uhu ndiyo tukio kulu ra kupinga ukoloni ra Amijikenda.',
    },
  },
  {
    era: 'colonial',
    date: '1920s',
    title: {
      en: 'Digo become majority Muslim',
      sw: 'Wadigo wanakuwa Waislamu wengi',
      dg: 'Adigo anakala Aislamu anji',
    },
    description: {
      en: 'Mosques and Quranic schools spread across Kwale.',
      sw: 'Misikiti na shule za Qurani zinasambaa Kwale kote.',
      dg: 'Misikiti na shule za Kuruani zinasambaa Kwale kose.',
    },
  },
  {
    era: 'colonial',
    date: '1924',
    title: {
      en: 'The first Digo imams',
      sw: 'Maimamu wa kwanza Wadigo',
      dg: 'Maimamu a kpwandza Adigo',
    },
    description: {
      en: 'Around Tiwi, mosques had long been led by imams from outside the community. In 1924 the village of Chigato builds a mosque for Kassim Mwachinyama, one of the first Digo imams.',
      sw: 'Huko Tiwi, misikiti iliongozwa kwa muda mrefu na maimamu kutoka nje ya jamii. Mwaka 1924 kijiji cha Chigato kinajenga msikiti kwa ajili ya Kassim Mwachinyama, mmoja wa maimamu wa kwanza Wadigo.',
      dg: 'Iko Tiwi, misikiti kala inalongozwa kpwa muda mure ni maimamu kula kondze ya jamii. Mwaka 1924 chidzidzi cha Chigato chinadzenga msikiti kpwa ajili ya Kassim Mwachinyama, mmwenga wa maimamu a kpwandza Adigo.',
    },
  },
  {
    era: 'colonial',
    date: '1927–1932',
    title: {
      en: 'Kongo Mosque revived',
      sw: 'Msikiti wa Kongo unafufuliwa',
      dg: 'Msikiti wa Kongo unafufulwa',
    },
    description: {
      en: 'Sheikh Mwinyikombo bin Makame, an imam from Mombasa, persuades the Diani elders that the ruin in the forest is a mosque. The villagers clear it together, and it reopens with a maulid in 1932.',
      sw: 'Sheikh Mwinyikombo bin Makame, imamu kutoka Mombasa, anawashawishi wazee wa Diani kwamba gofu lililo msituni ni msikiti. Wanakijiji wanausafisha pamoja, na unafunguliwa tena kwa maulidi mwaka 1932.',
      dg: 'Sheikh Mwinyikombo bin Makame, imamu kula Mombasa, anaashawishi azehe a Diani kukala gofu riro tsakani ni msikiti. Atu a mudzi anausafisha phamwenga, na unafungulwa tsena kpwa maulidi mwaka 1932.',
    },
  },
  {
    era: 'colonial',
    date: '1940s',
    title: {
      en: 'Last kayas abandoned',
      sw: 'Makaya ya mwisho yanaachwa',
      dg: 'Makaya ga mwisho ganarichwa',
    },
    description: {
      en: 'Population growth, trade opportunities, and colonial pressures lead to abandonment of kaya settlements. The forests are preserved as sacred sites and ancestral abodes.',
      sw: 'Ongezeko la watu, fursa za biashara, na shinikizo la kikoloni vinaongoza kuachwa kwa makazi ya makaya. Misitu inahifadhiwa kama maeneo matakatifu na makazi ya mababu.',
      dg: 'Ongezeko ra atu, fursa za biashara, na shinikizo ra chikoloni vinaongoza kurichwa kpwa makalo ga makaya. Misitu inahifadhiwa dza maeneo matakatifu na makalo ga ababu.',
    },
  },
  {
    era: 'colonial',
    date: '1948',
    title: {
      en: 'Digo District renamed Kwale',
      sw: 'Wilaya ya Digo inaitwa Kwale',
      dg: 'Wilaya ya Digo inaihwa Kwale',
    },
    description: {
      en: 'Administrative change reflecting evolving colonial nomenclature. The Mijikenda Union, founded in 1944, advocates for collective coastal political identity.',
      sw: 'Mabadiliko ya kiutawala yanayoonyesha mabadiliko ya majina ya kikoloni. Muungano wa Mijikenda, ulioanzishwa 1944, unatetea utambulisho wa kisiasa wa pamoja wa pwani.',
      dg: 'Mabadiliko ga chiutawala ganagoonyesha mabadiliko ga madzinya ga chikoloni. Muungano wa Amijikenda, urioanzishwa 1944, unatetea utambulisho wa chisiasa wa phamwenga wa pwani.',
    },
  },

  // Era 4: Independence & Modern Era (1963-present)
  {
    era: 'modern',
    date: '1961–1963',
    title: {
      en: 'Independence',
      sw: 'Uhuru',
      dg: 'Uhuru',
    },
    description: {
      en: 'Tanganyika independent (1961), coastal strip ceded to Kenya (Oct 1963), Kenya independent (Dec 1963). The Mwambao movement for coastal autonomy fails; the Digo are divided between two nations.',
      sw: 'Tanganyika huru (1961), ukanda wa pwani unapewa Kenya (Okt 1963), Kenya huru (Des 1963). Vuguvugu la Mwambao la uhuru wa pwani linashindwa; Wadigo wanagawanywa kati ya mataifa mawili.',
      dg: 'Tanganyika huru (1961), ukanda wa pwani unapewa Kenya (Okt 1963), Kenya huru (Des 1963). Vuguvugu ra Mwambao ra uhuru wa pwani rinashindwa; Adigo anagawanywa kahi ya mataifa mairi.',
    },
  },
  {
    era: 'modern',
    date: '1983',
    title: {
      en: 'Kongo Mosque gazetted',
      sw: 'Msikiti wa Kongo unatangazwa',
      dg: 'Msikiti wa Kongo unatangazwa',
    },
    description: {
      en: 'The Kongo Mosque at Diani is protected as a monument under Gazette Notice 440 of 1983.',
      sw: 'Msikiti wa Kongo huko Diani unalindwa kama mnara wa kumbukumbu chini ya Tangazo la Serikali Na. 440 la 1983.',
      dg: 'Msikiti wa Kongo iko Diani unarindwa dza mnara wa kumbukumbu tsini ya Tangazo ra Serikali Na. 440 ra 1983.',
    },
  },
  {
    era: 'modern',
    date: '1987–1994',
    title: {
      en: 'Mutoro\'s kaya excavations',
      sw: 'Uchimbaji wa makaya wa Mutoro',
      dg: 'Utsimbadzi wa makaya wa Mutoro',
    },
    description: {
      en: 'Henry Mutoro of the University of Nairobi conducts the first systematic archaeological excavations at kaya sites, recovering pottery dating to the 10th century — material confirmation of the deep antiquity of Mijikenda settlement.',
      sw: 'Henry Mutoro wa Chuo Kikuu cha Nairobi anafanya uchimbaji wa kwanza wa kiakiolojia kwa makaya, akipata vyungu vya karne ya 10 — uthibitisho wa kimwili wa ustaarabu wa kale wa makazi ya Mijikenda.',
      dg: 'Henry Mutoro wa Chuo Chikulu cha Nairobi anahenda utsimbadzi wa kpwandza wa chiakiolojia kpwa makaya, achipata vyungu vya karne ya 10 — uthibitisho wa chimwiri wa ustaarabu wa kale wa makalo ga Amijikenda.',
    },
  },
  {
    era: 'modern',
    date: '1997',
    title: {
      en: 'Likoni clashes',
      sw: 'Mapigano ya Likoni',
      dg: 'Mapigano ga Likoni',
    },
    description: {
      en: 'Politically motivated violence in which Digo youth, recruited at Kaya Bombo, attack Likoni. ~100 killed, ~100,000 displaced. The Akiwumi Report finds KANU officials funded the militia.',
      sw: 'Vurugu za kisiasa ambapo vijana wa Kidigo, walioandikishwa Kaya Bombo, wanashambulia Likoni. ~100 wanauawa, ~100,000 wanakimbishwa. Ripoti ya Akiwumi inapata kwamba maafisa wa KANU walifadhili wanamgambo.',
      dg: 'Vurugu za chisiasa ambako vijana va Chidigo, varioandikishwa Kaya Bombo, vanashambulia Likoni. ~100 vanaulagwa, ~100,000 vanakimbishwa. Ripoti ya Akiwumi inapata kukala maafisa a KANU arifadhili anamgambo.',
    },
  },
  {
    era: 'modern',
    date: '2008',
    title: {
      en: 'UNESCO World Heritage inscription',
      sw: 'Makaya yanaorodheshwa kama Urithi wa Dunia wa UNESCO',
      dg: 'Makaya ganaorodheshwa dza Urithi wa Dunia wa UNESCO',
    },
    description: {
      en: 'Eleven Mijikenda kaya forests, including Kaya Chinondo, inscribed as Sacred Mijikenda Kaya Forests. The following year, kaya traditions are placed on UNESCO\'s Urgent Safeguarding list.',
      sw: 'Misitu kumi na moja ya makaya ya Mijikenda, ikiwa ni pamoja na Kaya Chinondo, inaorodheshwa kama Misitu Mitakatifu ya Makaya ya Mijikenda. Mwaka unaofuata, mila za makaya zinawekwa kwenye orodha ya UNESCO ya Kulinda kwa Dharura.',
      dg: 'Misitu kumi na moja ya makaya ya Amijikenda, ichiwa ni phamwenga na Kaya Chinondo, inaorodheshwa dza Misitu Mitakatifu ya Makaya ya Amijikenda. Mwaka unaofuata, mila za makaya zinawekwa kpwa orodha ya UNESCO ya Kulinda kpwa Dharura.',
    },
  },
  {
    era: 'modern',
    date: '2014–present',
    title: {
      en: 'Kwale titanium mining',
      sw: 'Uchimbaji wa titanium Kwale',
      dg: 'Uchimbaji wa titanium Kwale',
    },
    description: {
      en: 'Base Titanium begins exporting titanium from Kwale, displacing 3,000+ residents and destroying coconut and cashew groves. Decommissioning begins c. 2025 amid environmental protests.',
      sw: 'Base Titanium inaanza kusafirisha titanium kutoka Kwale, ikiwahama wakazi 3,000+ na kuharibu mashamba ya minazi na korosho. Uondoaji unaanza c. 2025 kati ya maandamano ya mazingira.',
      dg: 'Base Titanium inaanza kusafirisha titanium kula Kwale, ichiahama akazi 3,000+ na kuharibu mashamba ga minazi na korosho. Uondoaji unaanza c. 2025 kahi ya maandamano ga mazingira.',
    },
  },
  {
    era: 'modern',
    date: '2023',
    title: {
      en: 'Digo Ngambi revived',
      sw: 'Ngambi ya Wadigo inafufuliwa',
      dg: 'Ngambi ya Adigo inafufulwa',
    },
    description: {
      en: 'Kaya elders and Digo leaders revive the Digo Ngambi, the traditional council of elders, and choose its leaders.',
      sw: 'Wazee wa kaya na viongozi wa Wadigo wanafufua Ngambi ya Wadigo, baraza la jadi la wazee, na kuchagua viongozi wake.',
      dg: 'Azehe a kaya na aongozi a Adigo anafufula Ngambi ya Adigo, baraza ra chienyeji ra azehe, na kutsambula aongoziye.',
    },
  },
];
