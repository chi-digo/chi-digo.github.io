import type { Locale } from '@/lib/i18n/config';

export type ContentBlock =
  | { type: 'heading'; text: string }
  | { type: 'paragraph'; text: string };

export type Topic = {
  slug: string;
  title: Record<Locale, string>;
  intro: Record<Locale, string>;
  body: Record<Locale, ContentBlock[]>;
};

export type LanguageDomain = {
  slug: string;
  title: Record<Locale, string>;
  intro: Record<Locale, string>;
  proverb: string;
  proverbGloss: string;
  topics: Topic[];
};

export const oralTraditionsDomain: LanguageDomain = {
  "slug": "oral-traditions",
  "title": {
    "en": "Oral Traditions",
    "sw": "Mila za Kusimulia",
    "dig": "Mila za Kuhadisi"
  },
  "intro": {
    "en": "Long before the Digo had a written alphabet, they had a literature. It lived in the mouths of elders who could recite the genealogy of a clan stretching back seven generations, in grandmothers who…",
    "sw": "Kabla ya Wadigo kuwa na alfabeti ya maandishi, walikuwa na fasihi. Fasihi hiyo iliishi midomoni mwa wazee walioweza kusimulia nasaba ya ukoo kwa vizazi saba nyuma, katika nyanyazetu walioimbisha…",
    "dig": "Kabila Adigo takaandika kpwa herufi, kala ana fasihi. Fasihi iyo yakala miromoni mwa avyere ariowezo kusimulia nasaba za mbari kpwa vizazi saba nyuma, kpwa akuku arioimbisha ana kpwa nyimbo za kare…"
  },
  "proverb": "Achili ni nyere, chila mmwenga ana zakpwe",
  "proverbGloss": "Intelligence is like hair — everyone has their own",
  "topics": [
    {
      "slug": "folk-tales-and-stories",
      "title": {
        "en": "Folk Tales and Stories",
        "sw": "Hadisi za Chinyume",
        "dig": "Hadithi za Jadi"
      },
      "intro": {
        "en": "In the villages of Kwale County and along the Tanzania coast, there is a time of day that belongs to stories. It comes after the evening meal, when the heat has broken and the palm trees are…",
        "sw": "Katika vijiji vya Kaunti ya Kwale na kando ya pwani ya Tanzania, kuna wakati wa siku ambao ni wa hadithi. Unakuja baada ya chakula cha jioni, wakati joto limepungua na mitende ni vivuli dhidi ya…",
        "dig": "Kpwa vidzi vya Kaunti ya Kwale na kanda-kanda ya ph'wani ya Tanzania, kuna wakati wa siku ambao ni wa hadisi. Unakpwedza bada ya chakurya cha dziloni, wakati dzoho rikaphunguka na minazi ni vivuli dhidi…"
      },
      "body": {
        "en": [
          {
            "type": "heading",
            "text": "Stories Told at Night"
          },
          {
            "type": "paragraph",
            "text": "In the villages of Kwale County and along the Tanzania coast, there is a time of day that belongs to stories. It comes after the evening meal, when the heat has broken and the palm trees are silhouettes against the last light. This is when the Digo tell their stories — *hadisi za chinyume*, tales of the old way — and by long-standing custom, they are told only at night. To tell a story during the day, the tradition holds, is to invite misfortune."
          },
          {
            "type": "paragraph",
            "text": "Storytelling among the Digo is not casual entertainment. It is considered a gift — Mzee Suleiman Ali Nyembwe, one of the most respected Digo storytellers documented by researchers, learned his art from his father, who learned it from his grandfather. \"Storytelling is a gift from God,\" Nyembwe has said, \"because one has to have very good memory.\" And indeed, the Digo storyteller carries not just plots but entire performances in their head: voices for each character, sound effects for axes falling and waves crashing, physical movements that enact the drama, and the precise timing needed to draw an audience from laughter to silence to the moral at the end."
          },
          {
            "type": "heading",
            "text": "The Performer's Art"
          },
          {
            "type": "paragraph",
            "text": "A Digo storytelling performance is a theatrical event. The narrator does not simply recite words. They become each character in turn, shifting voice and posture — deep and slow for the wise elder, high and rapid for the trickster, growling for the dangerous animal. When the story calls for the sound of chopping wood, the storyteller's hands become axes. When a character walks through the bush, the storyteller's feet move across the ground. Facial expressions shift from fear to cunning to surprise, and the audience — which is never passive — responds with gasps, laughter, and call-and-response that the storyteller weaves into the telling."
          },
          {
            "type": "paragraph",
            "text": "This is oral literature in its fullest sense: a performed art that exists only in the moment of its telling, shaped by the audience as much as by the narrator, and never exactly the same twice."
          },
          {
            "type": "heading",
            "text": "Characters and Themes"
          },
          {
            "type": "paragraph",
            "text": "The Digo story world reflects the coastal environment. Where inland African folk traditions often centre on the savanna — the lion, the elephant, the clever hare — Digo stories draw from the sea, the mangrove, and the palm. Monkeys chatter through the tales, sharks patrol the waters, tortoises carry their patient wisdom on their backs, and buffaloes represent brute strength that cunning can outwit. The Hare, the great trickster of East African folklore, appears here too, but alongside creatures specific to the coast."
          },
          {
            "type": "paragraph",
            "text": "The stories often turn on moral dilemmas that map directly onto Digo social life. A documented tale, \"Watu Wako na Wengine Hawasikii\" (\"Those That Never Listen\"), narrated by Suleiman Ali Nyembwe himself, tells of a man who marries three successive wives. The first two are passive, content to rely on their husband's provision. The youngest, however, shows enterprise — she goes out to collect firewood and sell it, building her own economic independence. The story's sympathies are clear: the youngest wife's industry is the virtue the story celebrates. This is not merely a fable. It is a meditation on gender, agency, and the Digo value of self-reliance — lessons that resonate with particular force in a community where women's economic independence has long been a site of both power and contestation."
          },
          {
            "type": "paragraph",
            "text": "Other stories address the consequences of greed, the foolishness of ignoring elders' advice, the rewards of generosity, and the dangers of the natural world. They are entertainment, certainly, but they are also education — the Digo equivalent of a curriculum, delivered not in a classroom but around an evening fire."
          },
          {
            "type": "heading",
            "text": "Poetry Within Story"
          },
          {
            "type": "paragraph",
            "text": "Not all oral narrative is prose. The Digo also maintain a poetic tradition within their storytelling. Mohammed Kirungu Said, a Digo poet, composed \"Idhilali na Kifo\" (\"Suffering and Death\"), a poem using the *Tathlitha* structure — four-line stanzas with a repeated refrain — to warn young people against violence. The poem form is not decorative; the *Tathlitha* structure creates a hypnotic rhythm that lodges the warning in memory more effectively than any lecture could."
          },
          {
            "type": "paragraph",
            "text": "The poetic tradition interweaves with the musical one. The songs of *sengenya* carry historical narratives. The *vugo* songs at weddings carry instruction and blessing. The *goma* movement at funerals carries the message of the living to the dead. In each case, story, song, and performance are inseparable — the meaning lives in the combination, not in any single element."
          },
          {
            "type": "heading",
            "text": "What Is Being Lost"
          },
          {
            "type": "paragraph",
            "text": "Researchers studying Digo oral traditions have documented \"a recent decline in storytelling, with Digo youth being pulled more and more into civilization.\" The word \"civilization\" in this context is not the researchers' — it is the community's own term for the world of television, mobile phones, social media, and Swahili-language entertainment that competes with the evening storytelling session."
          },
          {
            "type": "paragraph",
            "text": "The loss is not simply cultural nostalgia. Each story carries specific knowledge: how to read the tides, which plants are medicinal, how to behave toward in-laws, what the ancestors valued. When the evening storytelling session is replaced by a television set, this knowledge does not transfer to a new medium. It simply disappears. The storyteller's art — the voice modulation, the physical comedy, the audience interaction — cannot be replicated in text. It can only be preserved through recording, and through the creation of new contexts where Digo stories are told, heard, and valued."
          },
          {
            "type": "paragraph",
            "text": "Daidey Maingi at the University of Nairobi, working under Professor Peter Wasamba, is among the scholars actively researching and documenting Digo oral narratives. But academic documentation, while valuable, is not the same as living practice. The challenge is not merely to record the stories before their tellers die. It is to create a world in which Digo young people want to hear them — and, eventually, to tell them."
          }
        ],
        "sw": [
          {
            "type": "heading",
            "text": "Hadithi Zinazoambiwa Usiku"
          },
          {
            "type": "paragraph",
            "text": "Katika vijiji vya Kaunti ya Kwale na kando ya pwani ya Tanzania, kuna wakati wa siku ambao ni wa hadithi. Unakuja baada ya chakula cha jioni, wakati joto limepungua na mitende ni vivuli dhidi ya mwanga wa mwisho. Huu ndio wakati Wadigo wanaposimulia hadithi zao — *hadisi za chinyume*, hadithi za njia ya zamani — na kwa desturi ya zamani, zinasimuliwa usiku tu. Kusimulia hadithi mchana, desturi inasema, ni kualika msiba."
          },
          {
            "type": "paragraph",
            "text": "Kusimulia hadithi miongoni mwa Wadigo si burudani ya kawaida. Inachukuliwa kuwa kipaji — Mzee Suleiman Ali Nyembwe, mmoja wa wasimuliaji mashuhuri wa Wadigo waliorekodiwa na watafiti, alijifunza sanaa yake kutoka kwa baba yake, ambaye alijifunza kutoka kwa babu yake. \"Kusimulia hadithi ni kipaji kutoka kwa Mungu,\" Nyembwe amesema, \"kwa sababu mtu lazima awe na kumbukumbu nzuri sana.\" Na kwa kweli, msimuliaji wa Wadigo anabeba si tu visa lakini maonyesho mazima kichwani mwake: sauti za kila mhusika, athari za sauti kwa mashoka yanayoanguka na mawimbi yanayovuma, mienendo ya kimwili inayoigiza mchezo, na wakati sahihi unaohitajika kuwavuta wasikilizaji kutoka kicheko hadi kimya hadi funzo la mwisho."
          },
          {
            "type": "heading",
            "text": "Sanaa ya Mwigizaji"
          },
          {
            "type": "paragraph",
            "text": "Maonyesho ya kusimulia hadithi ya Wadigo ni tukio la maigizo. Msimuliaji harudia maneno tu. Anakuwa kila mhusika kwa zamu, akibadilisha sauti na mkao — kwa kina na polepole kwa mzee mwenye hekima, juu na haraka kwa mjanja, kunguruma kwa mnyama hatari. Hadithi inapohitaji sauti ya kukata kuni, mikono ya msimuliaji inakuwa mashoka. Mhusika anapotembea msituni, miguu ya msimuliaji inasogea ardhini. Sura ya uso inabadilika kutoka hofu hadi ujanja hadi mshangao, na wasikilizaji — ambao hawako kimya kamwe — wanajibu kwa mshangao, kicheko, na maswali-na-majibu ambayo msimuliaji anayafuma katika masimulizi."
          },
          {
            "type": "paragraph",
            "text": "Hii ni fasihi ya mdomo katika maana yake kamili: sanaa ya maonyesho inayoishi tu katika wakati wa kusimuliwa kwake, inayoumbwa na wasikilizaji kama vile na msimuliaji, na haiwi sawa mara mbili."
          },
          {
            "type": "heading",
            "text": "Wahusika na Maudhui"
          },
          {
            "type": "paragraph",
            "text": "Ulimwengu wa hadithi za Wadigo unaonyesha mazingira ya pwani. Ambapo mila za kienyeji za Afrika ya bara mara nyingi zinazingatia savanna — simba, tembo, sungura mjanja — hadithi za Wadigo zinatoka baharini, katika mikoko, na kwa mnazi. Nyani wanakongojea katika hadithi, papa wanapiga doria majini, kobe wanabeba hekima yao ya subira migongoni mwao, na nyati wanawakilisha nguvu ya kikatili ambayo ujanja unaweza kuishinda."
          },
          {
            "type": "paragraph",
            "text": "Hadithi mara nyingi zinahusu matatizo ya kimaadili yanayolingana moja kwa moja na maisha ya kijamii ya Wadigo. Hadithi iliyorekodiwa, \"Watu Wako na Wengine Hawasikii,\" iliyosimuliwa na Suleiman Ali Nyembwe mwenyewe, inasimulia kuhusu mtu anayeoa wake watatu mfululizo. Wa kwanza wawili ni watulivu, wanaridhika kutegemea utoaji wa mume wao. Wa mwisho, hata hivyo, anaonyesha ujasiriamali — anatoka kukusanya kuni na kuziuza, akijenga uhuru wake wa kiuchumi. Huruma za hadithi ni wazi: bidii ya mke wa mwisho ndio fadhila inayosherehekewa. Hii si hadithi tu. Ni tafakuri kuhusu jinsia, wakala, na thamani ya Wadigo ya kujitegemea."
          },
          {
            "type": "paragraph",
            "text": "Kinachopotea"
          },
          {
            "type": "heading",
            "text": "Watafiti wanaosoma mila za mdomo za Wadigo wamerekodi \"kushuka kwa hivi karibuni kwa usimulizi wa hadithi, vijana wa Wadigo wakivutwa zaidi na zaidi katika ustaarabu.\" Neno \"ustaarabu\" katika muktadha huu si la watafiti — ni neno la jamii yenyewe kwa ulimwengu wa televisheni, simu za mkononi, mitandao ya kijamii, na burudani ya Kiswahili inayoshindana na kikao cha kusimulia hadithi jioni."
          },
          {
            "type": "paragraph",
            "text": "Hasara si tu nostalgia ya kitamaduni. Kila hadithi inabeba maarifa mahususi: jinsi ya kusoma mawimbi, mimea gani ni ya dawa, jinsi ya kuishi na wakwe, mababu walivyothamini nini. Changamoto si tu kurekodi hadithi kabla wasimuliaji wao hawajafa. Ni kuunda ulimwengu ambamo vijana wa Wadigo wanataka kuzisikia — na hatimaye, kuzisimulia."
          },
          {
            "type": "paragraph",
            "text": "Utamaduni wa ushairi unaingiliana na ule wa muziki. Nyimbo za *sengenya* hubeba hadithi za kihistoria. Nyimbo za *vugo* katika harusi hubeba mafundisho na baraka. Mwendo wa *goma* katika mazishi hubeba ujumbe wa walio hai kwa wafu. Katika kila hali, hadithi, wimbo, na uigizaji haviwezi kutenganishwa — maana iko katika mchanganyiko, si katika kipengele kimoja peke yake."
          },
          {
            "type": "heading",
            "text": "Kinachopotea"
          },
          {
            "type": "paragraph",
            "text": "Watafiti wanaosoma mapokeo ya simulizi ya Kidigo wameandika \"kupungua hivi karibuni kwa usimulizi wa hadithi, huku vijana wa Kidigo wakivutwa zaidi na zaidi kwenye ustaarabu.\" Neno \"ustaarabu\" katika muktadha huu si la watafiti — ni neno la jamii yenyewe kwa ulimwengu wa televisheni, simu za mkononi, mitandao ya kijamii, na burudani za Kiswahili ambayo inashindana na vikao vya usimulizi wa hadithi vya jioni."
          },
          {
            "type": "paragraph",
            "text": "Upotevu huu si huzuni ya kitamaduni tu. Kila hadithi hubeba maarifa maalum: jinsi ya kusoma mawimbi, mimea ipi ni dawa, jinsi ya kuishi na wakwe, mambo ambayo mababu waliyathamini. Wakati vikao vya usimulizi wa hadithi vya jioni vinapobadilishwa na televisheni, maarifa haya hayahamii kwenye njia mpya. Yanapotea tu. Sanaa ya msimulizi — kubadilisha sauti, ucheshi wa kimwili, mwingiliano na hadhira — haiwezi kuigwa katika maandishi. Inaweza kuhifadhiwa tu kupitia kurekodi, na kupitia kuunda mazingira mapya ambapo hadithi za Kidigo zinasimuliwa, zinasikika, na zinathaminiwa."
          },
          {
            "type": "paragraph",
            "text": "Daidey Maingi katika Chuo Kikuu cha Nairobi, akifanya kazi chini ya Profesa Peter Wasamba, ni miongoni mwa wasomi wanaofanya utafiti na kuandika hadithi za simulizi za Kidigo. Lakini uandikaji wa kitaaluma, ingawa una thamani, si sawa na mazoea hai. Changamoto si tu kurekodi hadithi kabla wasimulizi wao hawajafariki. Ni kuunda ulimwengu ambao vijana wa Kidigo wanataka kuzisikia — na hatimaye, kuzisimulia."
          }
        ],
        "dig": [
          {
            "type": "heading",
            "text": "Hadisi Zinazoambirwa Usiku"
          },
          {
            "type": "paragraph",
            "text": "Kpwa vidzi vya Kaunti ya Kwale na kanda-kanda ya ph'wani ya Tanzania, kuna wakati wa siku ambao ni wa hadisi. Unakpwedza bada ya chakurya cha dziloni, wakati dzoho rikaphunguka na minazi ni vivuli dhidi ya mwanga wa mwisho. Uhu ndio wakati Adigo anapohadisi hadisi zao — *hadisi za chinyume*, hadisi za njira ya kare — na kpwa desturi ya kare, zinahadiswa usiku tu. Kuhadisi hadisi mutsi, desturi inaamba, ni kpwaricha msiba."
          },
          {
            "type": "paragraph",
            "text": "Kuhadisi hadisi kahi ya Adigo si burudani ya kawaida. Inachukuliwa kukala chipaji — Mzee Suleiman Ali Nyembwe, mmwenga wa ahadisi mashuhuri a Adigo ariorekodiwa ni atafiti, wadzifundza sanaa yakpwe kula kpwa ise, ambaye wadzifundza kula kpwa babaye. \"Kuhadisi hadisi ni chipaji kula kpwa Mulungu,\" Nyembwe waamba, \"kpwa sababu mutu ni lazima akale na kumbukumbu nono sana.\" Na kpwa kpweli, mhadisi wa Adigo anabeba si tu visa ela maonyesho madzima kichwani mwakpwe: sauti za chila mutu wa hadisini, athari za sauti kpwa mashoka ganago anguka na maimbi ganago vuma, mwiendo wa mwiri unagoigiza mchezo, na wakati wa sawa unaohitajika kuvuta asikizi kula kicheko hadi kunyamala hadi fundzo ra mwisho."
          },
          {
            "type": "heading",
            "text": "Sanaa ya Muhadisi"
          },
          {
            "type": "paragraph",
            "text": "Maonyesho ga kuhadisi hadisi ya Adigo ni chitu cha maigizo. Muhadisi karudia maneno tu. Anakala chila mutu wa hadisini kpwa zamu, akibadilisha sauti na mkao — kpwa kina na pore-pore kpwa mvyere mwenye ikima, dzulu na haraka kpwa mjanja, kunguruma kpwa nyama wa hatari. Hadisi inahitajipho sauti ya kukata kuni, mikono ya muhadisi inakala mashoka. Mutu wa hadisini anaphosira nyikani, magulu ga muhadisi ganasogea ardhini."
          },
          {
            "type": "paragraph",
            "text": "Hino ni fasihi ya mdomo kpwa maana yakpwe kamili: sanaa ya maonyesho inayoishi tu kpwa wakati wa kuhadiswa kwakpwe, inayoumbwa ni asikizi dza vira na muhadisi, na taipho ikale sawa kano mbiri."
          },
          {
            "type": "heading",
            "text": "Wahusika na Maudhui"
          },
          {
            "type": "paragraph",
            "text": "Ulimwengu wa hadisi za Adigo unaonyesha mazingira ga ph'wani. Ambapo mila za kienyeji za Afrika ya bara zinazingatia savanna — simba, tembo, sungura mjanja — hadisi za Adigo zinatoka baharini, kpwa mikoko, na kpwa mnazi. Makaku ganakongojea kpwa hadisi, papa ganapiga doria madzini, kpwa kobe ganabeba ikima yao ya kuvumirira migongoni mwao."
          },
          {
            "type": "paragraph",
            "text": "Hadisi mara nyinji zinahusu magongo ga kimaadili ganago lingana moja kpwa moja na maisha ga kijamii ga Adigo. Hadisi iriyorekodiwa, \"Watu Wako na Wengine Hawasikii,\" iriyohadiswa ni Suleiman Ali Nyembwe mwenyewe, inahadisi kuhusu mutu anayeola achetu ahahu mfululizo. A kpwandza airi ni atulivu. Wa mwisho, ela, anaonyesha ujasiriamali — anatoka kukusanya kuni na kuziuza, akidzenga uhuru wakpwe wa kiuchumi. Huruma za hadisi ni za wazi: bidii ya mche wa mwisho ndiyo fadhila inayosherehekewa."
          },
          {
            "type": "paragraph",
            "text": "Kinachopotea"
          },
          {
            "type": "heading",
            "text": "Atafiti anao soma mila za mdomo za Adigo amerekodiwa \"kushuka kpwa usimulizi wa hadisi, avulana na asichana a Adigo akivutwa zaidi na zaidi kpwa ustaarabu.\" Kpwa chila hadisi iriyo na marifwa mahususi: jinsi ya kusoma maimbi, mimea gani ni ya dawa, jinsi ya kuishi na akwe. Changamoto si tu kurekodi hadisi kabila ahadisi ao takabanike. Ni kuumba ulimwengu ambamo avulana na asichana a Adigo anamendza kuzisikira — na hatimaye, kuzihadisi."
          },
          {
            "type": "paragraph",
            "text": "Si hadithi zosi za simulizi ni za nadhiri. Adigo piya anariko na mapokeo ga ushairi kpwenye usimulizi wao. Mohammed Kirungu Said, mshairi wa Chidigo, waandika \"Idhilali na Kifo\" (\"Mateso na Chifo\"), shairi ririrotumira muundo wa *Tathlitha* — mishororo mine yenye kiitikio chirichorudiwa — kuonya vijana kuhusu fujo. Muundo wa shairi sio wa mapambo tu; muundo wa *Tathlitha* unaunda mdundo wa kuvutiya ambao unahifadhi onyo mo achilini kpwa njira nono zaidi kuriko somo rorosi."
          },
          {
            "type": "paragraph",
            "text": "Mapokeo ga ushairi ganaingiliana na ga muziki. Nyimbo za *sengenya* zinahala hadithi za historia. Nyimbo za *vugo* kpwenye arusi zinahala mafundzo na baraka. Mtsindziro wa *goma* kpwenye mazishi unahala ujumbe wa ario moyo kpwa ariofariki. Kpwa chila hali, hadithi, wimbo, na uonyesho taviweza kutenganishwa — maana iko kpwenye mchanganyiko, si kpwenye chitu chimwenga tu."
          },
          {
            "type": "heading",
            "text": "Garigopotea"
          },
          {
            "type": "paragraph",
            "text": "Atafiti anaosoma mapokeo ga simulizi ga Adigo gaandika \"kupunguka kpwa usimulizi wa hadithi hivi karibuni, na vijana a Chidigo anavutwa zaidi na zaidi kpwenye ustaarabu.\" Neno \"ustaarabu\" kpwa muktadha uhu si ra atafiti — ni neno ra jamii yenyewe kpwa ulimwengu wa televisheni, simu za mkononi, mitandao ya kijamii, na burudani za Chiswahili ambayo inashindana na vikao vya usimulizi wa hadithi vya usiku."
          },
          {
            "type": "paragraph",
            "text": "Kupotea kuku si huzuni ya chikale tu. Chila hadithi inahala maarifa maalumu: vira vya kusoma maimbi, mimea iphi ni dawa, vira vya kuishi na akwe, mambo ambago akare arigogathaminiya. Vikao vya usimulizi wa hadithi vya usiku vinaphotsukizwa ni televisheni, maarifa gaga tagahamiya kpwenye njira nyiphya. Ganapotea tu. Sanaa ya msimulizi — kubadilisha sauti, ucheshi wa mwiri, kuchangamana na asirikizadzi — taiweza kuigwa kpwenye maandishi. Inaweza kuhifadhiwa tu kpwa kurekodi, na kpwa kuumba mazingira maphya ambamo hadithi za Chidigo zinasimulwa, zinasikiwa, na zinathaminiwa."
          },
          {
            "type": "paragraph",
            "text": "Daidey Maingi kpwenye Chuo Chikulu cha Nairobi, anayehenda kazi tsini ya Profesa Peter Wasamba, ni kahi ya asomi ambao anahenda utafiti na kuandika hadithi za simulizi za Adigo. Ela kuandika kpwa kitaaluma, ingawa kuna thamani, si sawa na mazoea ga moyo. Changamoto si tu kurekodi hadithi kabla asimulizi aho taajafariki. Ni kuumba ulimwengu ambamo vijana a Chidigo analonda kuzisikira — na mwisho, kuzisimulira."
          }
        ]
      }
    },
    {
      "slug": "oral-history",
      "title": {
        "en": "Oral History",
        "sw": "Historia ya Mdomo",
        "dig": "Historia ya Kusimulia"
      },
      "intro": {
        "en": "Among the Digo, history is not something you read. It is something you hear — from an elder who heard it from their elder, in an unbroken chain reaching back to the founding of the first kaya in the…",
        "sw": "Miongoni mwa Wadigo, historia si kitu unachosoma. Ni kitu unachosikia — kutoka kwa mzee aliyeisikia kutoka kwa mzee wake, katika mnyororo usiovunjika unaorudi hadi kuanzishwa kwa kaya ya kwanza katika…",
        "dig": "Kahi ya Adigo, historia si chitu unachosoma. Ni chitu unachosikira — kula kpwa mvyere ariyeisikira kula kpwa mvyere wakpwe, kpwa mnyororo usiovundzika unaorudi hadi kuandzishwa kpwa kaya ya kpwandza…"
      },
      "body": {
        "en": [
          {
            "type": "heading",
            "text": "Memory as Institution"
          },
          {
            "type": "paragraph",
            "text": "Among the Digo, history is not something you read. It is something you hear — from an elder who heard it from their elder, in an unbroken chain reaching back to the founding of the first kaya in the Shimba Hills. This chain of oral transmission is not a deficient version of written history. It is a different institution entirely: one that binds the knowledge of the past to the authority of living persons, making history inseparable from the community that carries it."
          },
          {
            "type": "paragraph",
            "text": "The *kambi* — the council of elders that governs the kaya — serves as the institutional custodian of oral history. The elders do not merely remember the past. They are authorised to speak it. An uninitiated person who claims knowledge of kaya history is not simply wrong; they are overstepping a boundary of social authority. The knowledge belongs to the elders because the elders earned the right to carry it — through circumcision, through the age-set progression, through the years of service that brought them into the kambi. History, in this system, is not free information. It is entrusted knowledge."
          },
          {
            "type": "heading",
            "text": "The Singwaya Narrative"
          },
          {
            "type": "paragraph",
            "text": "The foundational oral history of the Digo — shared in varying forms across all nine Mijikenda peoples — is the narrative of the migration from Singwaya. In the Digo version, the ancestors once lived in a settlement called Singwaya, located somewhere north of the Tana River in present-day southern Somalia. When Cushitic-speaking Oromo peoples invaded, the Digo were the first to leave, fleeing south to the Shimba Hills where they established Kaya Kwale, their first fortified settlement."
          },
          {
            "type": "paragraph",
            "text": "This priority of departure is not a minor detail. The Digo claim seniority among the nine Mijikenda peoples specifically because they left first, and this claim is generally accepted by the other groups. The oral history thus functions as a charter for political status — it is not merely a description of what happened but a justification for how the present is organised."
          },
          {
            "type": "paragraph",
            "text": "What makes the Digo version distinctive is its entanglement with Islamic identity. Scholars have documented how Digo oral histories \"frequently incorporate motifs of ethnic primacy, portraying Digo forebears as bearers of superior Islamic-influenced lineages or earlier access to coastal resources.\" As Islam became central to Digo identity in the 19th and 20th centuries, the oral history adapted — not by discarding the Singwaya narrative but by layering Islamic elements onto it. An academic paper captured this dynamic in its title: \"'Singwaya was a mere small station': Islamization and ethnic primacy in Digo oral traditions of origin and migration.\""
          },
          {
            "type": "paragraph",
            "text": "This is what oral history does that written history cannot: it evolves with the community. A written account, once set down, is fixed. An oral account is re-performed with each telling, and each performance can emphasise, reinterpret, or supplement the narrative to reflect the community's current understanding of itself. This is not falsification. It is how a living tradition stays relevant."
          },
          {
            "type": "heading",
            "text": "The Kayas as Memory Sites"
          },
          {
            "type": "paragraph",
            "text": "The kaya sacred forests are not just spiritual sites and governance centres. They are memory sites — physical anchors for collective historical knowledge. Each kaya has its own history: when it was founded, by whom, what events took place within its clearings. The trees, the paths, the position of the moroni structure, the location of the fingo talismans — all carry historical meaning for the elders who know how to read them."
          },
          {
            "type": "paragraph",
            "text": "When a kaya is destroyed — as Kaya Diani has been by tourist development — the physical anchor of its history is lost. The elders may still carry the knowledge, but without the site to walk through and point to, the transmission becomes abstract, and abstraction is the enemy of oral memory. An elder explaining the layout of a kaya to a young person while standing in its clearing is performing an act of historical transmission far more effectively than one describing a kaya they can no longer visit."
          },
          {
            "type": "heading",
            "text": "What Is at Stake"
          },
          {
            "type": "paragraph",
            "text": "The urgency of oral history documentation among the Digo cannot be overstated. The elders who carry the deepest historical knowledge are aging. The age-set system that once ensured orderly transmission from one generation of elders to the next has weakened. The kayas that anchored historical memory are under threat. And the young people who should be learning this history are increasingly disconnected from the institutional contexts — the kambi, the kaya, the evening gathering — where transmission traditionally occurred."
          },
          {
            "type": "paragraph",
            "text": "Each elder who dies without passing their knowledge to a successor represents an irreversible loss. This is not the loss of one person's memories. It is the loss of a link in a chain that may have been unbroken for centuries. Once broken, the chain cannot be repaired. The knowledge that elder carried — the specific genealogies, the precise sequences of events, the nuances of interpretation — is gone."
          },
          {
            "type": "paragraph",
            "text": "The Chi-digo initiative's oral history archive aims to record and preserve these voices: 100 hours of recorded, transcribed, consented oral history by Year 3, rising to 500 hours by Year 5. But recording is only the first step. The deeper challenge is creating a world in which young Digo people see themselves as inheritors of this knowledge — not as passive consumers of archived recordings, but as the next link in a chain that must not break."
          }
        ],
        "sw": [
          {
            "type": "heading",
            "text": "Kumbukumbu Kama Taasisi"
          },
          {
            "type": "paragraph",
            "text": "Miongoni mwa Wadigo, historia si kitu unachosoma. Ni kitu unachosikia — kutoka kwa mzee aliyeisikia kutoka kwa mzee wake, katika mnyororo usiovunjika unaorudi hadi kuanzishwa kwa kaya ya kwanza katika milima ya Shimba. Mnyororo huu wa usambazaji wa mdomo si toleo duni la historia ya maandishi. Ni taasisi tofauti kabisa: inayounganisha maarifa ya zamani na mamlaka ya watu walio hai, ikifanya historia isiyotengana na jamii inayoibeba."
          },
          {
            "type": "paragraph",
            "text": "*Kambi* — baraza la wazee linalotawala kaya — linahudumu kama mlezi wa kitaasisi wa historia ya mdomo. Wazee hawakumbuki tu zamani. Wameruhusiwa kuisema. Mtu ambaye hajafanyiwa ibada ya kuingizwa anayedai maarifa ya historia ya kaya si tu makosa; anavuka mpaka wa mamlaka ya kijamii. Maarifa ni ya wazee kwa sababu wazee walipata haki ya kuyabeba — kupitia tohara, kupitia maendeleo ya rika, kupitia miaka ya huduma iliyowaleta katika kambi. Historia, katika mfumo huu, si habari ya bure. Ni maarifa yaliyokabidhiwa."
          },
          {
            "type": "heading",
            "text": "Masimulizi ya Singwaya"
          },
          {
            "type": "paragraph",
            "text": "Historia ya msingi ya mdomo ya Wadigo — inayoshirikiwa kwa mifumo tofauti kati ya watu wote tisa wa Mijikenda — ni masimulizi ya safari kutoka Singwaya. Katika toleo la Wadigo, mababu waliwahi kuishi katika makazi yaliyoitwa Singwaya, mahali fulani kaskazini ya Mto Tana. Watu wa Oromo waliposhambulia, Wadigo walikuwa wa kwanza kuondoka, wakikimbilia kusini hadi milima ya Shimba ambapo walianzisha Kaya Kwale."
          },
          {
            "type": "paragraph",
            "text": "Kipaumbele hiki cha kuondoka si undani mdogo. Wadigo wanadai useniori miongoni mwa watu tisa wa Mijikenda hasa kwa sababu waliondoka kwanza, na dai hili linakubaliwa kwa ujumla na makundi mengine. Historia ya mdomo inafanya kazi kama hati ya hadhi ya kisiasa — si maelezo tu ya kilichotokea bali uhalalishaji wa jinsi sasa inavyopangwa."
          },
          {
            "type": "paragraph",
            "text": "Kinachofanya toleo la Wadigo kuwa la kipekee ni uhusiano wake na utambulisho wa Kiislamu. Wasomi wameandika jinsi historia za mdomo za Wadigo \"mara kwa mara zinajumuisha motifu za ukuu wa kikabila, zikionyesha mababu wa Wadigo kama wabebaji wa nasaba zenye ushawishi wa Kiislamu.\" Kadri Uislamu ulivyokuwa kuu katika utambulisho wa Wadigo katika karne ya 19 na 20, historia ya mdomo ilibadilika — si kwa kutupa masimulizi ya Singwaya bali kwa kuongeza vipengele vya Kiislamu juu yake."
          },
          {
            "type": "paragraph",
            "text": "Makaya Kama Maeneo ya Kumbukumbu"
          },
          {
            "type": "heading",
            "text": "Misitu takatifu ya kaya si tu maeneo ya kiroho na vituo vya utawala. Ni maeneo ya kumbukumbu — nanga za kimwili za maarifa ya kihistoria ya pamoja. Kila kaya ina historia yake: ilianzishwa lini, na nani, matukio gani yalitokea ndani ya viwanja vyake. Miti, njia, msimamo wa moroni, mahali pa fingo — yote yanabeba maana ya kihistoria kwa wazee wanaojua jinsi ya kuyasoma."
          },
          {
            "type": "paragraph",
            "text": "Kaya inapoharibiwa — kama Kaya Diani ilivyoharibiwa na maendeleo ya utalii — nanga ya kimwili ya historia yake inapotea. Wazee wanaweza bado kubeba maarifa, lakini bila eneo la kutembea na kuonyesha, usambazaji unakuwa wa kinadharia, na nadharia ni adui ya kumbukumbu ya mdomo."
          },
          {
            "type": "paragraph",
            "text": "Kilicho Hatarini"
          },
          {
            "type": "heading",
            "text": "Dharura ya kuandika historia ya mdomo miongoni mwa Wadigo haiwezi kupuuzwa. Wazee wanaobeba maarifa ya kina ya kihistoria wanazeeka. Mfumo wa rika uliowahi kuhakikisha usambazaji wa utaratibu umezidi kudhoofika. Makaya yaliyo nanga ya kumbukumbu ya kihistoria yako hatarini. Na vijana ambao wanapaswa kujifunza historia hii wanazidi kutengana na muktadha wa kitaasisi ambapo usambazaji ulifanyika kijadi."
          },
          {
            "type": "paragraph",
            "text": "Kila mzee anayefariki bila kupitisha maarifa yake kwa mrithi anawakilisha hasara isiyoweza kurudishwa. Hii si hasara ya kumbukumbu za mtu mmoja. Ni hasara ya kiungo katika mnyororo ambao unaweza kuwa hauvunjiki kwa karne nyingi. Ukivunjika, mnyororo hauwezi kurekebishwa."
          },
          {
            "type": "paragraph",
            "text": "Kila mzee anayefariki bila kupitisha maarifa yake kwa mrithi anawakilisha hasara isiyoweza kurudishwa. Hii si upotevu wa kumbukumbu za mtu mmoja. Ni upotevu wa kiungo katika mnyororo ambao huenda haukuvunjika kwa karne nyingi. Ukishavunjika, mnyororo hauwezi kurekebishwa. Maarifa ambayo mzee huyo alikuwa nayo — nasaba maalum, mfuatano sahihi wa matukio, maana za kina za tafsiri — yamepotea."
          },
          {
            "type": "paragraph",
            "text": "Hifadhi ya historia simulizi ya mpango wa Chi-digo inalenga kurekodi na kuhifadhi sauti hizi: saa 100 za historia simulizi iliyorekodiwa, iliyoandikwa, na yenye ridhaa ifikapo Mwaka wa 3, ikipanda hadi saa 500 ifikapo Mwaka wa 5. Lakini kurekodi ni hatua ya kwanza tu. Changamoto kubwa zaidi ni kuunda ulimwengu ambao vijana wa Kidigo wanajiiona kama warithi wa maarifa haya — si kama watumiaji wa kawaida wa rekodi zilizohifadhiwa, bali kama kiungo kinachofuata katika mnyororo ambao haupaswi kuvunjika."
          }
        ],
        "dig": [
          {
            "type": "heading",
            "text": "Kumbukumbu Dza Taasisi"
          },
          {
            "type": "paragraph",
            "text": "Kahi ya Adigo, historia si chitu unachosoma. Ni chitu unachosikira — kula kpwa mvyere ariyeisikira kula kpwa mvyere wakpwe, kpwa mnyororo usiovundzika unaorudi hadi kuandzishwa kpwa kaya ya kpwandza kpwa myango ya Shimba. Mnyororo uhu wa kupisha kpwa mdomo si toleo duni ra historia ya maandishi. Ni taasisi tofauti kabisa: inayounganisha marifwa ga kare na mamlaka ga atu ario moyo, ikihenda historia isiyotengana na jamii inayoibeba."
          },
          {
            "type": "paragraph",
            "text": "*Kambi* — baraza ra avyere rinalotawala kaya — rinahudumu dza mulezi wa kitaasisi wa historia ya mdomo. Avyere takakumbuki tu kare. Ameruhusiwa kuiamba. Mutu ambaye kadza kpwa kambi anayedai marifwa ga historia ya kaya si tu makosa; anavuka mpaka wa mamlaka ya kijamii. Marifwa ni ga avyere kpwa sababu avyere alipata haki ya kugabeba — kupitshi tohara, kupitshi maendeleo ga rika, kupitshi miaka ya huduma iriyoaleta kpwa kambi."
          },
          {
            "type": "heading",
            "text": "Masimulizi ga Singwaya"
          },
          {
            "type": "paragraph",
            "text": "Historia ya msingi ya mdomo ya Adigo ni masimulizi ga safari kula Singwaya. Kpwa toleo ra Adigo, avyere a kare akala anakala kpwa makazi garigokala ganaihwa Singwaya, phatu fulani kaskazini ya Muho wa Tana. Atu a Oromo ariphoshambulia, Adigo akala a kpwandza kuundoka, akikimbilia kusini hadi myango ya Shimba ambapo aliandza Kaya Kwale."
          },
          {
            "type": "paragraph",
            "text": "Kuundoka kpwandza si undani mudide. Adigo anadai useniori kahi ya atu tisa a Mijikenda hasa kpwa sababu aundoka kpwandza, na dai rino rinakubaliwa ni makundi ganjina. Historia ya mdomo inahumika dza hati ya hadhi ya kisiasa — si maelezo tu ga garirogenderera ela uhalalishaji wa jinsi rero inavyopangwa."
          },
          {
            "type": "paragraph",
            "text": "Makaya Dza Maeneo ga Kumbukumbu"
          },
          {
            "type": "paragraph",
            "text": "Misitu mitakatifu ya kaya si tu maeneo ga chiroho na vituo vya utawala. Ni maeneo ga kumbukumbu — nanga za chimwili za marifwa ga kihistoria ga pamoja. Chila kaya ina historia yakpwe: iriandzishwa rini, ni ani, matukio gani garigokpwenderera ndani ya viwanja vyakpwe. Miri, njira, msimamo wa moroni, phatu pha fingo — gosi ganabeba maana ya kihistoria kpwa avyere amanyao jinsi ya kugasoma."
          },
          {
            "type": "heading",
            "text": "Kaya inaphoharibwa — dza Kaya Diani irivyoharibwa ni maendeleo ga utalii — nanga ya chimwili ya historia yakpwe inapotea. Avyere anaweza bado kubeba marifwa, ela bila eneo ra kutembea na kuonyesha, kupisha kunakala kpwa kinadharia. Mvyere anayeelezea muundo wa kaya kpwa mutu mdide wakati akiima kpwa kiwanja chakpwe anafanya kazi ya kupisha historia kpwa uwezo zaidi kuriko mmwenga anayeelezea kaya ambayo kaweza tena kutembelea."
          },
          {
            "type": "paragraph",
            "text": "Kilicho Hatarini"
          },
          {
            "type": "paragraph",
            "text": "Dharura ya kuandika historia ya mdomo kahi ya Adigo taiweza kupuuzwa. Avyere anao beba marifwa ga kina ga kihistoria anazeka. Mfumo wa rika uriokala unahakikisha kupisha kpwa utaratibu umedzidi kudhoofika. Makaya gariyo nanga ya kumbukumbu ga kihistoria gako hatarini. Na avulana na asichana ambao anapaswa kujifundza historia hino anadzidi kutengana na muktadha wa kitaasisi ambapo kupisha kulikala kunagenderera kijadi."
          },
          {
            "type": "heading",
            "text": "Chila mvyere anayefariki bila kupisha marifwa gakpwe kpwa mrithi anawakilisha hasara isiyoweza kurudhishwa. Hino si hasara ya kumbukumbu za mutu mmwenga. Ni hasara ya kiungo kpwa mnyororo ambao unaweza kukala taukuvundzika kpwa karne nyinji. Ukivundzika, mnyororo taweza kurekebishwa."
          },
          {
            "type": "paragraph",
            "text": "Uharaka wa kuandika historia ya simulizi ya Adigo tauweza kupunguzwa. Akare ambao anariko na maarifa ga kpweli-kpweli ga historia anakala akare. Mfumo wa rika ambao kare wahakikisha kupishira kpwa utaratibu kula kizazi chimwenga cha akare hadi chanjce ukadzidhoofika. Makaya ambago gahifadhi kumbukumbu za historia gako hatarini. Na ana achanga ambao kala anafwaha kudzifundza historia ihi anadzitenga zaidi na zaidi na mazingira ga jadi — kambi, kaya, kikao cha usiku — ambamo kupishira kpwa kawaida kurahendeka."
          },
          {
            "type": "paragraph",
            "text": "Chila mkare ambaye anafwa bila kupishira maarifa gakpwe kpwa mutu wa kumuhala nafasi yakpwe ni hasara isiyoweza kuuyizwa. Ihi siye kupoteza kumbukumbu za mutu mmwenga. Ni kupoteza kiungo kpwenye mnyororo ambao unaweza kukala tauvundzwire kpwa miaka mia nyinji. Ukishavundzika, mnyororo tauweza kurekebishwa. Maarifa ambago mkare yuya kala anago — nasaba maalumu, mfuatano sahihi wa mambo garigohendeka, maana za ndani za tafsiri — gakapotea."
          },
          {
            "type": "paragraph",
            "text": "Hifadhi ya historia simulizi ya mpango wa Chi-digo inalenga kurekodi na kuhifadhi sauti zizi: masaa 100 ga historia simulizi iriyorekodiwa, iriyoandikwa, na yenye ridhaa hadi Mwaka wa 3, ikipanda hadi masaa 500 hadi Mwaka wa 5. Ela kurekodi ni hathwa ya kpwandza tu. Changamoto kulu zaidi ni kuumba ulimwengu ambamo vijana a Chidigo anadziona kukala ni arisi a maarifa gaga — si atu ambao anasirikiza tu rekodi zilizohifadhiwa, ela ni kiungo chinacholunga kpwenye mnyororo ambao taufwaha kuvundzika."
          }
        ]
      }
    },
    {
      "slug": "oral-poetry-and-song",
      "title": {
        "en": "Oral Poetry and Song",
        "sw": "Mashairi na Nyimbo",
        "dig": "Ushairi na Nyimbo za Mdomo"
      },
      "intro": {
        "en": "In Digo culture, the line between poetry and song barely exists. Words that are spoken in one context become sung in another; melodies that carry a dancer's body also carry a story's meaning; the same…",
        "sw": "Katika utamaduni wa Wadigo, mpaka kati ya ushairi na wimbo haupo sana. Maneno yanayosemwa katika muktadha mmoja yanakuwa ya kuimbwa katika mwingine; nyimbo zinazobeba mwili wa mchezaji pia zinabeba…",
        "dig": "Kpwa mila ya Adigo, mpaka kahi ya ushairi na wimbo taupho kpwenye sana. Maneno ganago ambirwa kpwa muktadha mmwenga ganakala ga kuimbwa kpwa munjina; nyimbo zinazobeba mwiri wa mchezadzi piya zinabeba…"
      },
      "body": {
        "en": [
          {
            "type": "heading",
            "text": "Where Words Meet Music"
          },
          {
            "type": "paragraph",
            "text": "In Digo culture, the line between poetry and song barely exists. Words that are spoken in one context become sung in another; melodies that carry a dancer's body also carry a story's meaning; the same phrase that settles a dispute at a village council might appear, set to rhythm, in a wedding celebration. This is oral poetry — not the solitary, written verse of the Western tradition, but a communal art performed in the presence of an audience, inseparable from the music and movement that give it life."
          },
          {
            "type": "paragraph",
            "text": "The richest vehicle for Digo oral poetry is *sengenya*, the signature Digo ceremonial dance. Sengenya is described in detail elsewhere in this collection, but what matters here is what the songs say. The lyrics performed during sengenya are not incidental accompaniments to the dancing. They are the content — historical narratives that preserve the community's memory, wisdom teachings that instruct the young, and prayers for the ancestors that maintain the spiritual bond between the living and the dead."
          },
          {
            "type": "paragraph",
            "text": "The *goma* movement within sengenya, performed at funerals, carries a specific poetic function: the songs express \"passing food and music to those who have died\" to help them join the ancestors. This is not metaphor. The performers believe — and the community shares the belief — that the songs reach the dead. The poetry is functional: it accomplishes spiritual work. In this sense, Digo oral poetry is closer to prayer than to entertainment, though it is performed with the artistry and emotional intensity that the Western tradition associates with the highest forms of literary expression."
          },
          {
            "type": "heading",
            "text": "Wedding Poetry — The Vugo Songs"
          },
          {
            "type": "paragraph",
            "text": "Perhaps the most intimate oral poetry tradition among the Digo is the *vugo* — the songs performed during the bride's preparation for marriage. For weeks or months before the wedding, the bride undergoes a period of preparation overseen by the *somo* (bridal mentor) and *kungwi* (marriage instructor). During this time, and especially during the elaborate henna application that covers the bride's hands and feet in intricate geometric patterns, the women surrounding the bride sing vugo songs."
          },
          {
            "type": "paragraph",
            "text": "These songs are instructional, celebratory, bawdy, tender, and sometimes sharp. They teach the bride about married life — the pleasures and the difficulties, the expectations and the realities. They celebrate her beauty and her readiness for womanhood. They tease her about the wedding night. They warn her about the challenges of living with in-laws. And they bless her with prayers for fertility, happiness, and a long marriage."
          },
          {
            "type": "paragraph",
            "text": "The vugo tradition is exclusively female. Men are not present for these songs, and the content of the songs is women's knowledge, passed from elder women to younger women through performance. The songs that a bride hears during her preparation are the same songs her mother heard, and her grandmother before her — though each generation may add new verses that address contemporary realities. This is how oral poetry stays alive: not by freezing in a canonical form, but by growing new branches from old roots."
          },
          {
            "type": "heading",
            "text": "Farewell Songs"
          },
          {
            "type": "paragraph",
            "text": "When the bride leaves her family home on her wedding day, both families sing. The songs at this moment are among the most emotionally charged in the Digo repertoire — \"both families weep and sing simultaneously,\" as the ethnographic accounts record. The bride's family sings of loss and blessing; the groom's family sings of welcome and promise. The bride herself may sing a farewell to her childhood home, her mother, her siblings."
          },
          {
            "type": "paragraph",
            "text": "These farewell songs encode a social reality: in Digo society, marriage is a transfer. The bride moves from one family's care to another's. The songs acknowledge the pain of this transfer while affirming its necessity and its promise. They are not sentimental — they are realistic about the difficulty of leaving home and the uncertainty of a new household. But they are also hopeful, and the community's collective singing surrounds the bride with the assurance that she is not alone in her transition."
          },
          {
            "type": "heading",
            "text": "Initiation Poetry"
          },
          {
            "type": "paragraph",
            "text": "Both male and female initiation ceremonies — *jando* for boys, *unyago* for girls — involve songs that are themselves a form of poetry. These initiation songs address:"
          },
          {
            "type": "paragraph",
            "text": "- Marital relationships and sexual norms - Chastity and moral expectations - Social responsibilities of adulthood - The relationship between the individual and the community"
          },
          {
            "type": "paragraph",
            "text": "The songs are performed in contexts that are themselves transitional — the boy emerging from circumcision seclusion, the girl preparing for marriage — and the poetry marks the transition. The words are not incidental; they are the mechanism by which the community confers adult status on the young person. To hear these songs, to understand them, and to carry them forward is to accept the responsibilities of adulthood."
          },
          {
            "type": "heading",
            "text": "Work Songs and Calls"
          },
          {
            "type": "paragraph",
            "text": "Less documented but equally important are the songs that accompany work. Fishing calls — the shouts and rhythmic chants that coordinate the hauling of nets or the rowing of ngalawa canoes — are a form of oral poetry shaped by physical necessity. The rhythm of the song matches the rhythm of the work, and the words may carry meaning beyond the immediate task: a fishing call might include a prayer for safety, a comment on the weather, or a joke that keeps morale high during exhausting labour."
          },
          {
            "type": "paragraph",
            "text": "Agricultural songs accompany planting and harvesting. Palm wine tappers have their own repertoire, sung during the long, dangerous climb up the coconut palm. Market songs advertise goods. These work songs are the most everyday form of Digo oral poetry, and precisely because they are everyday, they are the most vulnerable to loss as traditional labour gives way to modern methods and the contexts in which they were sung disappear."
          },
          {
            "type": "heading",
            "text": "The Tathlitha Form"
          },
          {
            "type": "paragraph",
            "text": "Digo poets have adopted and adapted the *Tathlitha* form — a four-line stanza with a repeated refrain, borrowed from Arabic poetic tradition via the Swahili coast's long engagement with the Arab world. Mohammed Kirungu Said's \"Idhilali na Kifo\" (\"Suffering and Death\") uses this form to warn young people against violence. The Tathlitha's hypnotic repetition lodges the message in memory, making it an effective vehicle for moral instruction."
          },
          {
            "type": "paragraph",
            "text": "This adaptation of an Arabic form into a Digo context exemplifies a broader pattern: Digo oral poetry is not isolated. It borrows from Swahili, Arabic, and broader East African traditions, absorbing external forms and filling them with Digo content. The result is a tradition that is both distinctively Digo and part of a larger coastal literary world."
          }
        ],
        "sw": [
          {
            "type": "heading",
            "text": "Mahali Maneno Yanakutana na Muziki"
          },
          {
            "type": "paragraph",
            "text": "Katika utamaduni wa Wadigo, mpaka kati ya ushairi na wimbo haupo sana. Maneno yanayosemwa katika muktadha mmoja yanakuwa ya kuimbwa katika mwingine; nyimbo zinazobeba mwili wa mchezaji pia zinabeba maana ya hadithi; msemo ule ule unaosuluhisha mgogoro katika baraza la kijiji unaweza kuonekana, ukiwa na mdundo, katika sherehe ya harusi."
          },
          {
            "type": "paragraph",
            "text": "Chombo tajiri zaidi cha ushairi wa mdomo wa Wadigo ni *sengenya*, ngoma ya sherehe ya kipekee ya Wadigo. Nyimbo zinazoimbwa wakati wa sengenya si viambatisho tu vya kucheza. Ni maudhui — masimulizi ya kihistoria yanayohifadhi kumbukumbu ya jamii, mafundisho ya hekima yanayoelimisha vijana, na sala kwa mababu zinazodumisha uhusiano wa kiroho kati ya walio hai na wafu."
          },
          {
            "type": "paragraph",
            "text": "Mwendo wa *goma* ndani ya sengenya, unaofanywa mazishini, una kazi maalum ya kishairi: nyimbo zinaeleza \"kupeleka chakula na muziki kwa waliokufa\" kuwasaidia kujiunga na mababu. Hii si sitiari. Waigizaji wanaamini — na jamii inashiriki imani hiyo — kwamba nyimbo zinawafikia wafu. Ushairi unafanya kazi ya kiroho."
          },
          {
            "type": "heading",
            "text": "Ushairi wa Harusi — Nyimbo za Vugo"
          },
          {
            "type": "paragraph",
            "text": "Labda mila ya ushairi wa mdomo ya faragha zaidi miongoni mwa Wadigo ni *vugo* — nyimbo zinazoimbwa wakati wa maandalizi ya bibi arusi. Kwa wiki au miezi kabla ya harusi, bibi arusi anapitia kipindi cha maandalizi chini ya usimamizi wa *somo* na *kungwi*. Wakati huu, na hasa wakati wa kupaka hina inayofunika mikono na miguu ya bibi arusi kwa michoro tata, wanawake wanaomzunguka bibi arusi wanaimba nyimbo za vugo."
          },
          {
            "type": "paragraph",
            "text": "Nyimbo hizi ni za kufundisha, kusherehekea, za ujasiri, laini, na wakati mwingine kali. Zinafundisha bibi arusi kuhusu maisha ya ndoa — furaha na ugumu, matarajio na hali halisi. Zinasherehekea uzuri wake na utayari wake kwa utu uzima. Zinamchokoza kuhusu usiku wa harusi. Zinamwonya kuhusu changamoto za kuishi na wakwe. Na zinambariki kwa sala za uzazi, furaha, na ndoa ndefu."
          },
          {
            "type": "paragraph",
            "text": "Mila ya vugo ni ya wanawake peke yao. Wanaume hawapo kwa nyimbo hizi, na maudhui ya nyimbo ni maarifa ya wanawake, yanayopitishwa kutoka kwa wanawake wakubwa hadi wadogo kupitia maonyesho."
          },
          {
            "type": "heading",
            "text": "Nyimbo za Kuaga"
          },
          {
            "type": "paragraph",
            "text": "Bibi arusi anapoondoka nyumbani kwa familia yake siku ya harusi, familia zote mbili zinaimba. Nyimbo wakati huu ni miongoni mwa zenye hisia zaidi katika repertoire ya Wadigo — \"familia zote mbili zinalia na kuimba wakati mmoja.\" Familia ya bibi arusi inaimba kuhusu hasara na baraka; familia ya bwana arusi inaimba kuhusu karibu na ahadi."
          },
          {
            "type": "paragraph",
            "text": "Ushairi wa Kazi"
          },
          {
            "type": "heading",
            "text": "Ushairi wa kazi — nyimbo za uvuvi, za kilimo, za kupanda mnazi — ni aina ya kila siku zaidi ya ushairi wa mdomo wa Wadigo. Mdundo wa wimbo unalingana na mdundo wa kazi, na maneno yanaweza kubeba maana zaidi ya kazi ya papo hapo: wimbo wa uvuvi unaweza kujumuisha sala ya usalama, maoni kuhusu hali ya hewa, au utani unaodumisha morale wakati wa kazi ya kuchoka."
          },
          {
            "type": "paragraph",
            "text": "Sherehe za unyago kwa jinsia zote mbili — *jando* kwa wavulana, *unyago* kwa wasichana — zinahusisha nyimbo ambazo zenyewe ni aina ya ushairi. Nyimbo hizi za unyago zinashughulikia:"
          },
          {
            "type": "paragraph",
            "text": "- Mahusiano ya ndoa na kanuni za kingono - Usafi wa maadili na matarajio ya kimaadili - Majukumu ya kijamii ya utu uzima - Uhusiano kati ya mtu binafsi na jamii"
          },
          {
            "type": "paragraph",
            "text": "Nyimbo hizo huimbwa katika mazingira ambayo yenyewe ni ya mpito — mvulana anayetoka katika kutengwa kwa tohara, msichana anayejiandaa kwa ndoa — na ushairi huashiria mpito huo. Maneno si ya bahati mbaya; ni njia ambayo jamii inampa mtu mchanga hadhi ya utu uzima. Kusikia nyimbo hizi, kuzielewa, na kuziendeleza ni kukubali majukumu ya utu uzima."
          },
          {
            "type": "heading",
            "text": "Nyimbo za Kazi na Vilio"
          },
          {
            "type": "paragraph",
            "text": "Hazijandikwa sana lakini ni muhimu vivyo hivyo ni nyimbo zinazoambatana na kazi. Vilio vya uvuvi — kelele na nyimbo za mdundo zinazoratibu kuvuta nyavu au kupiga makasia ya mitumbwi ya ngalawa — ni aina ya ushairi wa simulizi ulioundwa na hitaji la kimwili. Mdundo wa wimbo unalingana na mdundo wa kazi, na maneno yanaweza kubeba maana zaidi ya kazi ya haraka: kilio cha uvuvi kinaweza kujumuisha dua ya usalama, maoni kuhusu hali ya hewa, au mzaha unaoweka moyo juu wakati wa kazi ngumu."
          },
          {
            "type": "paragraph",
            "text": "Nyimbo za kilimo zinaambatana na upanzi na mavuno. Wapiga tembo wana hazina yao ya nyimbo, zinazoimbwa wakati wa kupanda mti mrefu wa mnazi wenye hatari. Nyimbo za sokoni zinatangaza bidhaa. Nyimbo hizi za kazi ni aina ya kila siku zaidi ya ushairi wa simulizi wa Kidigo, na kwa sababu ni za kila siku, ndizo zilizo hatarini zaidi kupotea kadri kazi za jadi zinavyobadilishwa na njia za kisasa na mazingira ambayo zilikuwa zikiimbwa yanapotoweka."
          },
          {
            "type": "heading",
            "text": "Muundo wa Tathlitha"
          },
          {
            "type": "paragraph",
            "text": "Washairi wa Kidigo wamechukua na kubadilisha muundo wa *Tathlitha* — ubeti wa mistari minne wenye kiitikio kinachorudiwa, uliochukuliwa kutoka mapokeo ya ushairi wa Kiarabu kupitia uhusiano wa muda mrefu wa pwani ya Kiswahili na ulimwengu wa Kiarabu. \"Idhilali na Kifo\" (\"Mateso na Kifo\") ya Mohammed Kirungu Said unatumia muundo huu kuonya vijana dhidi ya vurugu. Kurudia kwa Tathlitha kunakoshawishi kunaweka ujumbe akilini, na kuifanya kuwa njia bora ya mafundisho ya kimaadili."
          },
          {
            "type": "paragraph",
            "text": "Kubadilishwa huku kwa muundo wa Kiarabu katika muktadha wa Kidigo ni mfano wa mtindo mpana: ushairi wa simulizi wa Kidigo hauko peke yake. Unakopa kutoka Kiswahili, Kiarabu, na mapokeo mapana ya Afrika Mashariki, ukifyonza miundo ya nje na kuijaza maudhui ya Kidigo. Matokeo ni mapokeo ambayo ni ya kipekee ya Kidigo na sehemu ya ulimwengu mkubwa wa fasihi ya pwani."
          }
        ],
        "dig": [
          {
            "type": "heading",
            "text": "Phatu Maneno Ganakutana na Muziki"
          },
          {
            "type": "paragraph",
            "text": "Kpwa mila ya Adigo, mpaka kahi ya ushairi na wimbo taupho kpwenye sana. Maneno ganago ambirwa kpwa muktadha mmwenga ganakala ga kuimbwa kpwa munjina; nyimbo zinazobeba mwiri wa mchezadzi piya zinabeba maana ya hadisi; msemo ure ure unao maliza lungo kpwa baraza ra mudzi unaweza kuonekana, ukikala na mdundo, kpwa sherehe ya harusi."
          },
          {
            "type": "paragraph",
            "text": "Chombo tajiri zaidi cha ushairi wa mdomo wa Adigo ni *sengenya*, ngoma ya sherehe ya kipekee ya Adigo. Nyimbo zinazoimbwa wakati wa sengenya si viambatisho tu vya kucheza. Ni maudhui — masimulizi ga kihistoria ganago hifadhi kumbukumbu ya jamii, mafundzo ga ikima ganago elimisha avulana na asichana, na sala kpwa avyere a kare zinazodumisha uhusiano wa chiroho kahi ya ario moyo na ario kufa."
          },
          {
            "type": "paragraph",
            "text": "Mwendo wa *goma* ndani ya sengenya, unaohendwa mazishini, una kazi maalum ya kishairi: nyimbo zinaelezea \"kupeleka chakurya na muziki kpwa ario kufa\" kuasaidia kpwedza kpwa avyere a kare. Hino si mfwano. Aonyeshaji anaamini — na jamii inashiriki imani hiyo — kukala nyimbo zinawafikia ario kufa."
          },
          {
            "type": "heading",
            "text": "Ushairi wa Harusi — Nyimbo za Vugo"
          },
          {
            "type": "paragraph",
            "text": "Labda mila ya ushairi wa mdomo ya faragha zaidi kahi ya Adigo ni *vugo* — nyimbo zinazoimbwa wakati wa maandalizi ga bibi arusi. Kpwa wiki au miezi kabila ya harusi, bibi arusi anapitsha kipindi cha maandalizi chini ya usimamizi wa *somo* na *kungwi*. Wakati uhu, na hasa wakati wa kupiga hina inayofunika mikono na magulu ga bibi arusi kpwa michoro changamano, achetu anaomudzikiriya bibi arusi anaimba nyimbo za vugo."
          },
          {
            "type": "paragraph",
            "text": "Nyimbo hizi ni za kufundza, kusherehekea, na wakati mwanjina kali. Zinafundza bibi arusi kuhusu maisha ga ndoa — furaha na ugumu, matarajio na hali ya kpweli. Zinasherehekea uzuri wakpwe na utayari wakpwe kpwa uchetu ukulu. Zinamchokoza kuhusu usiku wa harusi. Zinamuonya kuhusu changamoto za kuishi na akwe. Na zinambariki kpwa sala za uzazi, furaha, na ndoa ndefu."
          },
          {
            "type": "paragraph",
            "text": "Mila ya vugo ni ya achetu peke yao. Alume tapho kpwa nyimbo hizi. Maudhui ga nyimbo ni marifwa ga achetu, ganago phishwa kula kpwa achetu akulu hadi achetu adide kupitshi maonyesho."
          },
          {
            "type": "heading",
            "text": "Nyimbo za Kuaga"
          },
          {
            "type": "paragraph",
            "text": "Bibi arusi anaphoundoka kaya kpwa familia yakpwe siku ya harusi, familia zosi mbiri zinaimba. Nyimbo wakati uhu ni kahi ya zenye hisia zaidi — \"familia zosi mbiri zinasononeka na kuimba wakati mmwenga.\" Familia ya bibi arusi inaimba kuhusu hasara na baraka; familia ya bwana arusi inaimba kuhusu phephi na ahadi."
          },
          {
            "type": "paragraph",
            "text": "Ushairi wa Kazi"
          },
          {
            "type": "heading",
            "text": "Nyimbo za kazi — nyimbo za uvuvi, za ulimi, za kupanda mnazi — ni aina ya chila siku zaidi ya ushairi wa mdomo wa Adigo. Mdundo wa wimbo unalingana na mdundo wa kazi, na maneno ganaweza kubeba maana zaidi ya kazi ya pho hapo: wimbo wa uvuvi unaweza kujumuisha sala ya usalama au utani unaodumisha moyo wakati wa kazi ya kuchoshe."
          },
          {
            "type": "paragraph",
            "text": "Sherehe za jando na unyago kpwa jinsia zosi mbiri — *jando* kpwa avulana, *unyago* kpwa asichana — zinahusisha nyimbo ambazo zenyewe ni aina ya ushairi. Nyimbo zizi za jando na unyago zinagomba kuhusu:"
          },
          {
            "type": "paragraph",
            "text": "- Mahusiano ga ndoa na kanuni za chingono - Usafi wa maadili na matarajio ga kimaadili - Majukumu ga kijamii ga utu uzima - Uhusiano kahi ya mutu na jamii"
          },
          {
            "type": "paragraph",
            "text": "Nyimbo zizo zinaimbiwa kpwenye mazingira ambago genyewe ni ga mpito — mvulana anayetuluza kpwa kutengwa kpwa tohara, msichana anayedziandaa kpwa arusi — na ushairi unaonyesa mpito uwo. Maneno si ga bahati mbii; ni njira ambayo jamii inamupha kijana hadhi ya utu uzima. Kusikira nyimbo zizi, kuzimanya, na kuziendza mbere ni kukubali majukumu ga utu uzima."
          },
          {
            "type": "heading",
            "text": "Nyimbo za Kazi na Vilio"
          },
          {
            "type": "paragraph",
            "text": "Tazikaandikwa sana ela ni muhimu vivyo hivyo ni nyimbo zinazoambatana na kazi. Vilio vya uvuvi — kelele na nyimbo za mdundo zinazoratibisha kuvuta nyavu au kupiga makasia ga mitumbwi ya ngalawa — ni aina ya ushairi wa simulizi uriyoumbwa ni hitaji ra chimwiri. Mdundo wa wimbo unalingana na mdundo wa kazi, na maneno ganaweza kukala na maana zaidi ya kazi ya sambi: kilio cha uvuvi chinaweza kuhusisha dua ya usalama, maneno kuhusu hali ya hewa, au mzaha unaoweka moyo dzulu wakati wa kazi ngumu."
          },
          {
            "type": "paragraph",
            "text": "Nyimbo za ulimi zinaambatana na kupanda na kuvuna. Apiga tembo ana hazina yao ya nyimbo, zinazoimbwa wakati wa kupanda mnazi mure wenye hatari. Nyimbo za sokoni zinatangaza vidzitu. Nyimbo zizi za kazi ni aina ya chila siku zaidi ya ushairi wa simulizi wa Chidigo, na kpwa sababu ni za chila siku, ndizo zirizo hatarini zaidi kupotea wakati kazi za kare zinaphotsukizwa ni njira za kisasa na mazingira ambamo zirikala zinaimbwa ganaphotoweka."
          },
          {
            "type": "heading",
            "text": "Muundo wa Tathlitha"
          },
          {
            "type": "paragraph",
            "text": "Ashairi a Chidigo ahala na kubadilisha muundo wa *Tathlitha* — ubeti wa mishororo mine wenye kiitikio chirichorudiwa, uriohewa kula kpwa mapokeo ga ushairi wa Chiarabu kupitishira uhusiano wa muda mure wa ph'wani ya Chiswahili na ulimwengu wa Chiarabu. \"Idhilali na Kifo\" (\"Mateso na Chifo\") ya Mohammed Kirungu Said unatumira muundo uhu kuonya vijana kuhusu fujo. Kurudia kpwa Tathlitha kunakoshawishi kunaika ujumbe achilini, na kuihenda kukala njira nono ya mafundzo ga kimaadili."
          },
          {
            "type": "paragraph",
            "text": "Kubadilishwa kuku kpwa muundo wa Chiarabu kpwenye muktadha wa Chidigo ni mfano wa mtindo mpana: ushairi wa simulizi wa Chidigo taukoko peke yakpwe. Unakopa kula kpwa Chiswahili, Chiarabu, na mapokeo mapana ga Afrika ya Mashariki, ukimiza miundo ya kudze na kuiodzaza maudhui ga Chidigo. Maokeo ni mapokeo ambago ni ga chipekee ga Chidigo na sehemu ya ulimwengu mkulu wa fasihi ya ph'wani."
          }
        ]
      }
    },
    {
      "slug": "proverbs",
      "title": {
        "en": "Proverbs",
        "sw": "Ndarira",
        "dig": "Methali"
      },
      "intro": {
        "en": "If you want to understand the Digo, start with their proverbs. Called *ndarira* in Chidigo, these compressed utterances carry the community's accumulated observations about human nature, social…",
        "sw": "Ukitaka kuelewa Wadigo, anza na methali zao. Zinaitwa *ndarira* kwa Chidigo, na usemi huu mfupi unabeba hekima iliyokusanywa na jamii kuhusu tabia ya binadamu, wajibu wa kijamii, ulimwengu wa asili,…",
        "dig": "Uchimanya Adigo, andza na ndarira zao. Ndarira hizo fupi zinabeba ikima iriyokusanywa ni jamii kuhusu tabiya ya mwanadamu, wajibu wa kijamii, ulimwengu wa asili, na sanaa ya kuishi vinono. Ndarira ya…"
      },
      "body": {
        "en": [
          {
            "type": "heading",
            "text": "The Heart of Digo Wisdom"
          },
          {
            "type": "paragraph",
            "text": "If you want to understand the Digo, start with their proverbs. Called *ndarira* in Chidigo, these compressed utterances carry the community's accumulated observations about human nature, social obligation, the natural world, and the art of living well. A Digo proverb is not a quaint saying to embroider on a cushion. It is a precision instrument — deployed by an elder at a village council to settle a dispute without confrontation, invoked by a grandmother to teach a grandchild about patience, woven into a sermon at Friday prayers to anchor a moral point in ancestral authority."
          },
          {
            "type": "paragraph",
            "text": "The existing documented collection comprises over 349 proverbs, spanning seventeen thematic categories that map the full terrain of Digo moral and practical life. But elders who work with this collection estimate that hundreds more remain uncollected — proverbs that live only in the memory of aging speakers in villages across Kwale County and the Tanzania border region. Each death of an elder who carries unrecorded proverbs is a library fire."
          },
          {
            "type": "heading",
            "text": "How Proverbs Work in Daily Life"
          },
          {
            "type": "paragraph",
            "text": "Consider the proverb *\"Mvula igodzwa na utseru\"* — \"The rain is waited for with a cleared plot.\" On its surface, this is agricultural advice: clear your field before the rains come, or you will miss the planting season. But in practice, a Digo speaker deploys this proverb in situations far beyond farming. A father might say it to a son who wants to start a business but has not saved any capital. A teacher might use it with a student who dreams of university but neglects their current studies. The proverb teaches that opportunity rewards preparation — and that preparation must precede opportunity, not follow it."
          },
          {
            "type": "paragraph",
            "text": "Or take *\"Achili ni nyere, chila mmwenga ana zakpwe\"* — \"Intelligence is like hair; everyone has their own.\" This proverb is a rebuke to intellectual arrogance. It asserts that every person possesses a unique form of intelligence, and that dismissing someone else's mind is as foolish as mocking the texture of their hair. In a village dispute, an elder might deploy this proverb to remind a boastful young man that the quiet farmer he is belittling may understand the soil, the seasons, and the rhythms of the coast in ways that no amount of schooling can teach."
          },
          {
            "type": "paragraph",
            "text": "The proverb *\"Mvyere mtsape mairo, ela kumshinda marifwa\"* — \"You can outrun an old man on the road, but you cannot outrun his wisdom\" — is perhaps the most characteristically Digo. It encodes the foundational Digo value of respect for elders. Youth has speed; age has knowledge. And in a culture where the most important decisions — land disputes, marriage negotiations, kaya governance — are decided by councils of elders, the proverb is not merely philosophical. It is a description of how power actually works."
          },
          {
            "type": "heading",
            "text": "The Seventeen Themes"
          },
          {
            "type": "paragraph",
            "text": "The Digo proverb corpus maps onto seventeen broad themes, each reflecting a domain of life that the community considers important enough to encode in its collective memory:"
          },
          {
            "type": "paragraph",
            "text": "**Wisdom and intelligence.** Proverbs about the nature of knowledge, the difference between cleverness and wisdom, and the value of learning from experience. *\"Dzogolo kuika sio dawa ya kucha\"* — \"A rooster crowing does not cause the dawn\" — teaches humility: correlation is not causation, and taking credit for things you did not cause is foolishness."
          },
          {
            "type": "paragraph",
            "text": "**Foolishness and stubbornness.** The Digo have a sharp eye for self-destructive behaviour. These proverbs warn against ignoring advice, repeating mistakes, and confusing stubbornness with strength."
          },
          {
            "type": "paragraph",
            "text": "**Hospitality and visitors.** On the coast, where trade routes brought strangers from across the Indian Ocean for centuries, hospitality is not merely courtesy — it is infrastructure. Proverbs in this category encode the rules of hosting and being hosted, the obligations of the guest and the rights of the host."
          },
          {
            "type": "paragraph",
            "text": "**Hunger and food.** In a region where subsistence farming and fishing are the primary livelihoods, and where drought can turn a productive season into a hungry one, food carries moral weight. These proverbs address scarcity, sharing, greed, and the social obligations around eating."
          },
          {
            "type": "paragraph",
            "text": "**Work and effort.** *\"Bandu-bandu yamala gogo\"* — \"Persistent effort accomplishes large tasks.\" The Digo value of steady, unglamorous work over dramatic gestures is encoded across dozens of proverbs. A palm wine tapper climbs the same trees at dawn every day. A fisherman repairs his nets before he needs them. The proverbs teach that this daily discipline, not brilliance, is what sustains a life."
          },
          {
            "type": "paragraph",
            "text": "**Wealth, poverty, and inequality.** The coast has long known sharp inequalities — between landowners and tenants, between traders and farmers, between those with access to town and those bound to the hinterland. Digo proverbs about wealth are rarely celebratory. They tend toward caution: wealth is unstable, generosity is obligatory, and poverty is a condition, not a character flaw."
          },
          {
            "type": "paragraph",
            "text": "**Patience and perseverance.** Closely related to the work proverbs, these address the specific virtue of endurance — waiting for the right moment, persisting through difficulty, trusting that time will resolve what force cannot."
          },
          {
            "type": "paragraph",
            "text": "**Speech: gossip, slander, advice, and silence.** The Digo have an extraordinarily nuanced set of proverbs about language itself — when to speak and when to keep silent, the damage that gossip inflicts, the difference between advice and interference, and the power of a well-timed word."
          },
          {
            "type": "paragraph",
            "text": "**Kinship and family.** *\"Mlatso tauchimbirana wala taurichana\"* — \"Blood does not run from itself, nor does it call itself.\" Family loyalty is assumed, not argued. These proverbs encode the obligations of kinship — the duties of the maternal uncle (*mjomba*), the bonds between siblings, the respect owed to parents and elders."
          },
          {
            "type": "paragraph",
            "text": "**Children and parenting.** Proverbs about raising children, the responsibilities of parents, and the relationship between generations. In a community experiencing a \"transmission cliff\" where parents are no longer speaking Digo to their children, these proverbs carry a painful irony."
          },
          {
            "type": "paragraph",
            "text": "**Marriage and gender relations.** These proverbs address courtship, the dynamics of married life, the roles of husband and wife, and — sometimes with bawdy humour — the realities of desire and domestic conflict. The existing collection preserves these without sanitisation, recognising that expurgated proverbs are dead proverbs."
          },
          {
            "type": "paragraph",
            "text": "**Death, illness, and mourning.** The Digo live in close proximity to death — infant mortality remains high, malaria is endemic, and the fishing life is dangerous. These proverbs address grief, the acceptance of mortality, and the obligations of the living to the dead."
          },
          {
            "type": "paragraph",
            "text": "**Spirits, religion, and the unseen.** Proverbs that acknowledge the spiritual dimension of life — the ancestors who watch, the spirits who intervene, the God who is distant but omnipotent. These reflect the layered spiritual world of the Digo, where Islamic faith coexists with older beliefs about the spirit world."
          },
          {
            "type": "paragraph",
            "text": "**Coastal life: sea, palm wine, and fishing.** *\"Bahari taina msena\"* — \"The ocean has no friend.\" These proverbs are rooted in the specific geography of the Digo coast — the unpredictable sea, the rhythms of the tides, the coconut palm that provides everything from food to shelter to wine, and the fishing life that sustains the community and sometimes takes lives from it."
          },
          {
            "type": "paragraph",
            "text": "**Animals as moral types.** The hyena is greed. The baboon is foolishness. The snake is cunning and danger. The sheep is docility. These animal proverbs create a shared moral vocabulary — a shorthand that allows complex judgements to be expressed in a single image."
          },
          {
            "type": "paragraph",
            "text": "**Conflict and reconciliation.** *\"Mtsimba mbira naye aendza atsimbirwe\"* — \"One who digs a grave wants a grave dug for them\" — teaches reciprocity, for good and for ill. These proverbs address the management of conflict within the community, the value of forgiveness, and the dangers of revenge."
          },
          {
            "type": "paragraph",
            "text": "**Justice, governance, and leadership.** Proverbs about the qualities of good leadership, the obligations of those who hold power, and the community's right to judge its leaders. In a culture where the *kambi* (council of elders) governed through consensus rather than command, these proverbs describe a political philosophy as much as a moral one."
          },
          {
            "type": "heading",
            "text": "Proverbs as Living Practice"
          },
          {
            "type": "paragraph",
            "text": "What distinguishes the Digo proverb tradition from a museum collection is that proverbs remain in active use. A Digo speaker who deploys the right proverb at the right moment earns social respect — it signals cultural fluency, wisdom, and connection to the ancestral tradition. Conversely, a young person who cannot recognise common proverbs is marked as culturally disconnected, regardless of their formal education."
          },
          {
            "type": "paragraph",
            "text": "Proverbs appear in multiple contexts: in the *jina* (proverb band) of *kanga* cloth, where a woman communicates an indirect message through the textile she wears; in *khutba* (Friday sermons) at the mosque, where imams anchor Islamic teachings in Digo cultural authority; in wedding speeches, where elders bless the couple with proverbs about partnership and patience; and in the everyday conversation of people who learned them from their grandparents and will, if the transmission holds, pass them to their grandchildren."
          },
          {
            "type": "paragraph",
            "text": "The proverb *\"Mnazi mmwenga una uchi wani?\"* — \"What wine can come from a single palm tree?\" — is perhaps the best summary of the tradition itself. No single proverb contains the whole truth. It is the collection, in its full breadth and contradictions, that maps the Digo understanding of the world."
          }
        ],
        "sw": [
          {
            "type": "heading",
            "text": "Moyo wa Hekima ya Kidigo"
          },
          {
            "type": "paragraph",
            "text": "Ukitaka kuelewa Wadigo, anza na methali zao. Zinaitwa *ndarira* kwa Chidigo, na usemi huu mfupi unabeba hekima iliyokusanywa na jamii kuhusu tabia ya binadamu, wajibu wa kijamii, ulimwengu wa asili, na sanaa ya kuishi vizuri. Methali ya Kidigo si msemo mzuri wa kupamba ukuta. Ni chombo cha usahihi — kinachotumiwa na mzee katika baraza la kijiji kusuluhisha mgogoro bila makabiliano, kinachosemwa na bibi kumfundisha mjukuu kuhusu subira, kinachofumwa katika hotuba ya Ijumaa kuimarisha jambo la kimaadili katika mamlaka ya mababu."
          },
          {
            "type": "paragraph",
            "text": "Mkusanyo uliopo una zaidi ya methali 349, zinazojumuisha makundi kumi na saba ya maudhui yanayoonyesha mandhari yote ya maisha ya kimaadili na kivitendo ya Wadigo. Lakini wazee wanaofanya kazi na mkusanyo huu wanakadiriwa kuwa mamia mengine bado hayajakusanywa — methali zinazoishi tu katika kumbukumbu za wazungumzaji wanaozeeka katika vijiji vya Kaunti ya Kwale na eneo la mpaka wa Tanzania. Kila kifo cha mzee anayebeba methali ambazo hazijarekodiwa ni moto wa maktaba."
          },
          {
            "type": "heading",
            "text": "Methali Zinavyofanya Kazi Katika Maisha ya Kila Siku"
          },
          {
            "type": "paragraph",
            "text": "Fikiria methali *\"Mvula igodzwa na utseru\"* — \"Mvua inasubiriwa na shamba lililosafishwa.\" Kwa juu juu, hii ni ushauri wa kilimo: safisha shamba lako kabla ya mvua, au utakosa msimu wa kupanda. Lakini katika vitendo, mzungumzaji wa Kidigo anatumia methali hii katika hali nyingi zaidi ya kilimo. Baba anaweza kuisema kwa mwanawe anayetaka kuanza biashara lakini hajaweka akiba yoyote. Mwalimu anaweza kuitumia na mwanafunzi anayeota chuo kikuu lakini anapuuza masomo yake ya sasa. Methali inafundisha kwamba fursa inalipa maandalizi — na maandalizi lazima yatangulie fursa, si kuifuata."
          },
          {
            "type": "paragraph",
            "text": "Au chukua *\"Achili ni nyere, chila mmwenga ana zakpwe\"* — \"Akili ni kama nywele; kila mtu ana zake.\" Methali hii ni karipio kwa kiburi cha kiakili. Inathibitisha kwamba kila mtu ana aina yake ya akili, na kumdhihaki mtu mwingine ni upumbavu kama kudhihaki muundo wa nywele zake. Katika mgogoro wa kijiji, mzee anaweza kutumia methali hii kumkumbusha kijana mwenye kiburi kwamba mkulima mtulivu anayemdharau anaweza kuelewa udongo, misimu, na midundo ya pwani kwa njia ambazo elimu yoyote haiwezi kufundisha."
          },
          {
            "type": "paragraph",
            "text": "Methali *\"Mvyere mtsape mairo, ela kumshinda marifwa\"* — \"Unaweza kumpita mzee mbio njiani, lakini huwezi kushinda hekima yake\" — labda ndiyo methali ya Kidigo zaidi. Inabeba thamani ya msingi ya Wadigo ya heshima kwa wazee. Ujana una kasi; uzee una maarifa. Na katika utamaduni ambapo maamuzi muhimu zaidi — migogoro ya ardhi, mazungumzo ya mahari, utawala wa kaya — yanaamuliwa na baraza la wazee, methali si tu falsafa. Ni maelezo ya jinsi mamlaka yanavyofanya kazi kweli kweli."
          },
          {
            "type": "heading",
            "text": "Makundi Kumi na Saba"
          },
          {
            "type": "paragraph",
            "text": "Mkusanyo wa methali za Wadigo unagawanyika katika makundi kumi na saba mapana, kila moja likionyesha eneo la maisha ambalo jamii inachukulia kuwa muhimu vya kutosha kuliweka katika kumbukumbu yake ya pamoja:"
          },
          {
            "type": "paragraph",
            "text": "**Hekima na akili.** Methali kuhusu asili ya maarifa, tofauti kati ya ujanja na hekima, na thamani ya kujifunza kutokana na uzoefu. *\"Dzogolo kuika sio dawa ya kucha\"* — \"Jogoo kuwika si dawa ya kucha\" — inafundisha unyenyekevu: mwenendo wa pamoja si sababu, na kuchukua sifa kwa mambo ambayo hukuyafanya ni upumbavu."
          },
          {
            "type": "paragraph",
            "text": "**Upumbavu na ukaidi.** Wadigo wana jicho kali kwa tabia ya kujiharibu. Methali hizi zinaonya dhidi ya kupuuza ushauri, kurudia makosa, na kuchanganya ukaidi na nguvu."
          },
          {
            "type": "paragraph",
            "text": "**Ukarimu na wageni.** Pwanini, ambapo njia za biashara zilileta wageni kutoka Bahari ya Hindi kwa karne nyingi, ukarimu si adabu tu — ni miundombinu. Methali katika kundi hili zinabeba sheria za kukaribisha na kukaribishwa."
          },
          {
            "type": "paragraph",
            "text": "**Njaa na chakula.** Katika eneo ambapo kilimo cha kujikimu na uvuvi ni riziki kuu, na ambapo ukame unaweza kubadilisha msimu wenye mazao kuwa msimu wa njaa, chakula kina uzito wa kimaadili. Methali hizi zinashughulikia uhaba, kushiriki, tamaa, na wajibu wa kijamii kuhusu kula."
          },
          {
            "type": "paragraph",
            "text": "**Kazi na juhudi.** *\"Bandu-bandu yamala gogo\"* — \"Juhudi ya kuendelea inamaliza kazi kubwa.\" Thamani ya Wadigo ya kazi ya kila siku, isiyo na fahari, juu ya ishara za kushangaza imeandikwa katika methali nyingi."
          },
          {
            "type": "paragraph",
            "text": "**Utajiri, umaskini, na ukosefu wa usawa.** Methali za Wadigo kuhusu utajiri mara chache husherehekea. Zinaelekea tahadhari: utajiri si thabiti, ukarimu ni lazima, na umaskini ni hali, si kasoro ya tabia."
          },
          {
            "type": "paragraph",
            "text": "**Subira na uvumilivu.** Methali hizi zinashughulikia fadhila maalum ya kuvumilia — kusubiri wakati unaofaa, kuendelea katika ugumu, kuamini kwamba wakati utasuluhisha kile ambacho nguvu haiwezi."
          },
          {
            "type": "paragraph",
            "text": "**Usemi: uvumi, kashfa, ushauri, na kimya.** Wadigo wana seti ya methali ya kipekee kuhusu lugha yenyewe — wakati wa kusema na wakati wa kunyamaza, uharibifu ambao uvumi unasababisha, tofauti kati ya ushauri na kuingilia, na nguvu ya neno la wakati unaofaa."
          },
          {
            "type": "paragraph",
            "text": "**Undugu na familia.** *\"Mlatso tauchimbirana wala taurichana\"* — \"Damu haikimbi yenyewe, wala haijiti yenyewe.\" Uaminifu wa familia unachukuliwa, hautolewi hoja. Methali hizi zinabeba wajibu wa undugu — kazi za mjomba, vifungo kati ya ndugu, na heshima inayostahili wazazi na wazee."
          },
          {
            "type": "paragraph",
            "text": "**Watoto na malezi.** Methali kuhusu kulea watoto, wajibu wa wazazi, na uhusiano kati ya vizazi."
          },
          {
            "type": "paragraph",
            "text": "**Ndoa na mahusiano ya kijinsia.** Methali hizi zinashughulikia uchumba, midundo ya maisha ya ndoa, na — wakati mwingine kwa ucheshi wa kijasiri — hali halisi ya tamaa na migogoro ya nyumbani."
          },
          {
            "type": "paragraph",
            "text": "**Kifo, ugonjwa, na maombolezo.** Wadigo wanaishi karibu na kifo. Methali hizi zinashughulikia huzuni, kukubali kufa, na wajibu wa walio hai kwa wafu."
          },
          {
            "type": "paragraph",
            "text": "**Roho, dini, na yasiyoonekana.** Methali zinazokubali ulimwengu wa kiroho — mababu wanaotazama, roho zinazoingilia, Mungu aliye mbali lakini mwenye nguvu zote."
          },
          {
            "type": "paragraph",
            "text": "**Maisha ya pwani: bahari, mnazi, na uvuvi.** *\"Bahari taina msena\"* — \"Bahari haina rafiki.\" Methali hizi zina mizizi katika jiografia mahususi ya pwani ya Wadigo."
          },
          {
            "type": "paragraph",
            "text": "**Wanyama kama aina za kimaadili.** Fisi ni tamaa. Nyani ni upumbavu. Nyoka ni ujanja na hatari. Kondoo ni utiifu."
          },
          {
            "type": "paragraph",
            "text": "**Mgogoro na maridhiano.** *\"Mtsimba mbira naye aendza atsimbirwe\"* — \"Anayechimba kaburi anataka achimbiwe\" — inafundisha malipo, kwa wema na kwa ubaya."
          },
          {
            "type": "paragraph",
            "text": "**Haki, utawala, na uongozi.** Methali kuhusu sifa za uongozi mzuri na wajibu wa wenye mamlaka."
          },
          {
            "type": "heading",
            "text": "Methali Kama Mazoezi Hai"
          },
          {
            "type": "paragraph",
            "text": "Kinachofanya mila ya methali za Wadigo kuwa tofauti na mkusanyo wa makumbusho ni kwamba methali bado zinatumika kwa bidii. Mzungumzaji wa Kidigo anayetumia methali sahihi wakati unaofaa anapata heshima ya kijamii — inaonyesha ujuzi wa kitamaduni, hekima, na uhusiano na mila ya mababu. Kinyume chake, kijana asiyeweza kutambua methali za kawaida anaonekana kuwa ametengana na utamaduni, bila kujali elimu yake rasmi."
          },
          {
            "type": "paragraph",
            "text": "Methali zinaonekana katika muktadha mbalimbali: katika *jina* ya *kanga*, ambapo mwanamke anawasilisha ujumbe usio wa moja kwa moja kupitia nguo anayovaa; katika *khutba* msikitini, ambapo maimamu wanaunganisha mafundisho ya Kiislamu na mamlaka ya kitamaduni ya Kidigo; katika hotuba za harusi, ambapo wazee wanabariki wanandoa kwa methali kuhusu ushirikiano na subira; na katika mazungumzo ya kila siku ya watu waliojifunza kutoka kwa babu zao."
          },
          {
            "type": "paragraph",
            "text": "Methali *\"Mnazi mmwenga una uchi wani?\"* — \"Divai gani inayotoka kwa mnazi mmoja?\" — labda ndiyo muhtasari bora wa mila yenyewe. Hakuna methali moja inayobeba ukweli wote. Ni mkusanyo, katika upana wake wote na migongano yake, unaoorodhesha uelewa wa Wadigo kuhusu ulimwengu."
          }
        ],
        "dig": [
          {
            "type": "heading",
            "text": "Moyo wa Ikima ya Chidigo"
          },
          {
            "type": "paragraph",
            "text": "Uchimanya Adigo, andza na ndarira zao. Ndarira hizo fupi zinabeba ikima iriyokusanywa ni jamii kuhusu tabiya ya mwanadamu, wajibu wa kijamii, ulimwengu wa asili, na sanaa ya kuishi vinono. Ndarira ya Chidigo si msemo mzuri wa kupambisha ukuta. Ni chombo cha usahihi — chinacho humirwa ni mvyere kpwa baraza ra mudzi kumaliza lungo bila makabiliano, chinachoambirwa ni akuku kumfundisha mjukuu kuhusu kuvumirira, chinachofumwa kpwa hotuba ya Ijumaa kuimarisha jambo ra kimaadili kpwa mamlaka ga avyere a kare."
          },
          {
            "type": "paragraph",
            "text": "Mkusanyo urio kpwenye una zaidi ya ndarira 349, zinazojumuisha makundi kumi na saba ga maudhui ganago onyesha mandhari gosi ga maisha ga kimaadili na kivitendo ga Adigo. Ela avyere anaohumira mkusanyo uhu anakadirisha kukala mamia mengine bado tagakusanywa — ndarira zinazoishi tu kpwa kumbukumbu za azungumzadzi anaozeeka kpwa vidzi vya Kaunti ya Kwale na eneo ra mpaka wa Tanzania."
          },
          {
            "type": "heading",
            "text": "Ndarira Zinavyohumika Kpwa Maisha ga Chila Siku"
          },
          {
            "type": "paragraph",
            "text": "Fikiriya ndarira *\"Mvula igodzwa na utseru.\"* Kpwa dzulu dzulu, hino ni ushauri wa ulimi: safisha mundao kabila ya mvula, au undakosa mwaka wa kupanda. Ela kpwa vitendo, mutu wa Chidigo anahumira ndarira hino kpwa hali nyinji zaidi ya ulimi. Baba anaweza kuiamba kpwa mwanawe anayemendza kuandza biashara ela kayaweka akiba yoyosi. Mwalimu anaweza kuihumira na mwanafunzi anayeota chuo ela anapuuza masomo gakpwe ga rero. Ndarira inafundisha kukala nafasi inalipa maandalizi — na maandalizi ni lazima gatanguliye nafasi, si kuifuata."
          },
          {
            "type": "paragraph",
            "text": "Au hala *\"Achili ni nyere, chila mmwenga ana zakpwe.\"* Ndarira hino ni kpwambirwa mutu ariye na chimburi cha kiakili. Inathibitisha kukala chila mutu ana aina yakpwe ya achili, na kumdhihaki mutu wanjina ni upumbafu."
          },
          {
            "type": "paragraph",
            "text": "Ndarira *\"Mvyere mtsape mairo, ela kumshinda marifwa\"* — labda ndiyo ndarira ya Chidigo zaidi. Inabeba thamani ya msingi ya Adigo ya ishima kpwa avyere. Ujana una kasi; uzee una marifwa. Na kpwa mila ambapo maamuzi muhimu zaidi — malongo ga ardhi, mazungumzo ga mahari, utawala wa kaya — ganaamuliwa ni baraza ra avyere, ndarira si tu falsafa. Ni maelezo ga jinsi mamlaka ganavyohumika kpweli kpweli."
          },
          {
            "type": "heading",
            "text": "Makundi Kumi na Saba"
          },
          {
            "type": "paragraph",
            "text": "Mkusanyo wa ndarira za Adigo unagawanyika kpwa makundi kumi na saba mapana:"
          },
          {
            "type": "paragraph",
            "text": "**Ikima na achili.** *\"Dzogolo kuika sio dawa ya kucha\"* — inafundisha unyenyekevu."
          },
          {
            "type": "paragraph",
            "text": "**Upumbafu na ukaidi.** Ndarira hizi zinaonya dhidi ya kupuuza ushauri na kurudia makosa."
          },
          {
            "type": "paragraph",
            "text": "**Ukarimu na ajeni.** Kpwa ph'wani, ambapo njira za biashara zaleta ajeni kula Bahari ya Hindi kpwa karne nyinji, ukarimu si adabu tu — ni miundombinu."
          },
          {
            "type": "paragraph",
            "text": "**Ndzala na chakurya.** Kpwa eneo ambapo ulimi na uvuvi ni riziki kulu, chakurya china uzito wa kimaadili."
          },
          {
            "type": "paragraph",
            "text": "**Kazi na juhudi.** *\"Bandu-bandu yamala gogo\"* — Juhudi ya kuendelea inamaliza kazi kulu."
          },
          {
            "type": "paragraph",
            "text": "**Utajiri, umaskini, na ukosefu wa usawa.** Ndarira za Adigo kuhusu utajiri mara chache husherehekea. Zinaelekea tahadhari."
          },
          {
            "type": "paragraph",
            "text": "**Kuvumirira.** Ndarira hizi zinashughulikia fadhila maalum ya kuvumirira — kusubiri wakati unaofaa."
          },
          {
            "type": "paragraph",
            "text": "**Usemi: uvumi, kashfa, ushauri, na kunyamala.** Adigo ana seti ya ndarira ya kipekee kuhusu luga yenyewe."
          },
          {
            "type": "paragraph",
            "text": "**Undugu na mbari.** *\"Mlatso tauchimbirana wala taurichana.\"* Uaminifu wa mbari unachukuliwa, tautolewi hoja."
          },
          {
            "type": "paragraph",
            "text": "**Ana na malezi.** Ndarira kuhusu kurera ana na wajibu wa azazi."
          },
          {
            "type": "paragraph",
            "text": "**Ndoa na mahusiano.** Ndarira hizi zinashughulikia uchumba na midundo ya maisha ga ndoa."
          },
          {
            "type": "paragraph",
            "text": "**Chifo, ukongo, na maombolezo.** Adigo anaishi phephi na chifo. Ndarira hizi zinashughulikia sonono."
          },
          {
            "type": "paragraph",
            "text": "**Roho, dini, na gasigoonekana.** Ndarira zinazokubali ulimwengu wa chiroho."
          },
          {
            "type": "paragraph",
            "text": "**Maisha ga ph'wani: bahari, mnazi, na uvuvi.** *\"Bahari taina msena.\"*"
          },
          {
            "type": "paragraph",
            "text": "**Nyama dza aina za kimaadili.** Fisi ni tamaa. Nyani ni upumbafu. Nyoka ni ujanja na hatari."
          },
          {
            "type": "paragraph",
            "text": "**Lungo na maridhiano.** *\"Mtsimba mbira naye aendza atsimbirwe.\"*"
          },
          {
            "type": "paragraph",
            "text": "**Haki, utawala, na ulongozi.** Ndarira kuhusu sifa za ulongozi mzuri."
          },
          {
            "type": "heading",
            "text": "Ndarira Dza Mazoezi Garifo Moyo"
          },
          {
            "type": "paragraph",
            "text": "Chitu chinachohenda mila ya ndarira za Adigo kukala tofauti na mkusanyo wa nyumba ya makumbusho ni kukala ndarira bado zinahumika kpwa bidii. Mutu wa Chidigo anayehumira ndarira ya sawa kpwa wakati unaofaa anapata ishima ya kijamii — inaonyesha ujuzi wa chimila, ikima, na uhusiano na mila ya avyere a kare."
          },
          {
            "type": "paragraph",
            "text": "Ndarira zinaonekana kpwa muktadha mbalimbali: kpwa *jina* ya *kanga*, ambapo mchetu anawasilisha ujumbe usio wa moja kpwa moja kupitshi nguo anayovwala; kpwa *khutba* msikitini; kpwa hotuba za harusi; na kpwa mazungumzo ga chila siku ga atu ariojifundza kula kpwa akuku zao."
          },
          {
            "type": "paragraph",
            "text": "*\"Mnazi mmwenga una uchi wani?\"* — labda ndiyo muhtasari bora wa mila yenyewe. Takuna ndarira mwenga inayobeba ukpweli wosi. Ni mkusanyo, kpwa upana wakpwe wosi na migongano yakpwe, unaorodhesha uelewa wa Adigo kuhusu ulimwengu."
          }
        ]
      }
    },
    {
      "slug": "riddles",
      "title": {
        "en": "Riddles",
        "sw": "Vimbunga",
        "dig": "Vitendawili"
      },
      "intro": {
        "en": "When darkness settles over a Digo village and the evening meal is done, the children know what comes next. An elder — or an older sibling, or a visiting uncle — turns to the group and issues the…",
        "sw": "Giza linapoingia katika kijiji cha Wadigo na chakula cha jioni kimekwisha, watoto wanajua kinachofuata. Mzee — au kaka mkubwa, au mjomba aliyekuja kutembelea — anageuka kwa kundi na kutoa changamoto:…",
        "dig": "Jiza rinaphokpwedza kpwa mudzi wa Adigo na chakurya cha dziloni chimekpwisha, ana anamanya kinachokpwedza. Mvyere — au kaka mkulu, au mjomba ariyekpwedza kutembelea — anagaluka kpwa kundi na kutoa…"
      },
      "body": {
        "en": [
          {
            "type": "heading",
            "text": "The Game That Sharpens Minds"
          },
          {
            "type": "paragraph",
            "text": "When darkness settles over a Digo village and the evening meal is done, the children know what comes next. An elder — or an older sibling, or a visiting uncle — turns to the group and issues the challenge: *\"Kitendawili!\"* The children respond in chorus: *\"Tega!\"* — \"Set it!\" And the game begins."
          },
          {
            "type": "paragraph",
            "text": "Digo riddles, called *vimbunga* in Chidigo, are far more than children's entertainment. They are cognitive training disguised as play. Each riddle poses a puzzle built on metaphor, structural parallelism, and misdirection, demanding that the solver look past the obvious and find the hidden connection between two apparently unrelated things. A child who can crack a riddle quickly is demonstrating the same lateral thinking that an adult needs to navigate social complexity, read environmental signs, or solve a practical problem with limited resources."
          },
          {
            "type": "paragraph",
            "text": "Scholars studying East African oral traditions describe riddles as \"a special type of social phenomenon\" that presents \"enormous cognitive challenges to children, but is also an invaluable tool in acquiring linguistic and cognitive skills.\" The riddle teaches the child to think in metaphor — to understand that language can say one thing and mean another, that surfaces conceal depths, and that the world rewards those who look carefully. These are not trivial lessons. They are the foundations of every form of sophisticated thought, from poetry to law to diplomacy."
          },
          {
            "type": "heading",
            "text": "The Performance"
          },
          {
            "type": "paragraph",
            "text": "Riddle sessions are competitive. Children vie to answer fastest, and the elder or riddler keeps score — sometimes formally, sometimes through the social currency of laughter and approval. The format is call-and-response: the riddler poses, the group guesses, wrong answers are teased, and the correct answer earns a cheer. In contemporary coastal Kenyan schools, children who have grown up with this tradition become \"extremely quick with answering,\" their minds trained by years of evening riddle sessions to spot patterns and make unexpected connections."
          },
          {
            "type": "paragraph",
            "text": "The competitive element is important. It creates motivation to practice, to learn new riddles, and to invent original ones. A child who can stump the group with a riddle they composed themselves earns particular prestige — they have demonstrated not just the ability to solve puzzles but the ability to create them, which is a higher-order cognitive skill."
          },
          {
            "type": "heading",
            "text": "What Riddles Teach"
          },
          {
            "type": "paragraph",
            "text": "Beyond the cognitive training, riddles encode cultural knowledge. A riddle that compares the coconut palm to a person standing on one leg teaches the child to observe the palm's distinctive form. A riddle about the sea's behaviour teaches tidal patterns. A riddle about a cooking pot teaches the names and functions of kitchen implements. Through the pleasure of puzzle-solving, the child absorbs a vocabulary of the natural and domestic world — names, relationships, and properties — without the tedium of rote memorisation."
          },
          {
            "type": "paragraph",
            "text": "Riddles also teach children how language works. The metaphors in riddles stretch the child's understanding of what words can do — that a road can be described as a snake, that the sky can be a cloth, that a tree can be a person. This metaphorical fluency is the foundation of the proverb tradition that adults inherit. The child who has been solving riddles since age five is ready, by adolescence, to begin understanding the deeper metaphors of proverbs and the layered meanings of ceremonial speech."
          },
          {
            "type": "heading",
            "text": "A Tradition Under Threat"
          },
          {
            "type": "paragraph",
            "text": "Despite their importance, Digo riddles are among the least documented elements of the oral tradition. Academic researchers working on Digo oral narratives have specifically flagged riddles as under-documented, recommending future research on the genre. The collections that exist focus primarily on proverbs and folk tales; the riddle tradition has received far less scholarly attention."
          },
          {
            "type": "paragraph",
            "text": "This gap matters because riddles are among the most fragile forms of oral tradition. A proverb can survive in partial form — even if the context of its use is lost, the words persist. A folk tale can be summarised, its plot remembered even if the performance art fades. But a riddle without its answer is nothing, and an answer without its riddle is meaningless. The riddle is a complete unit: question and answer together, or nothing at all. When a riddle is forgotten, it is entirely gone."
          },
          {
            "type": "paragraph",
            "text": "The displacement of evening riddle sessions by screen entertainment means that the transmission mechanism is weakening. Children learn Swahili riddles at school — part of the national curriculum's oral literature component — but Digo riddles in the Digo language are not part of any school programme. They survive only in the homes where grandparents still gather children after dinner and issue the challenge: *\"Kitendawili!\"*"
          }
        ],
        "sw": [
          {
            "type": "heading",
            "text": "Mchezo Unaonoa Akili"
          },
          {
            "type": "paragraph",
            "text": "Giza linapoingia katika kijiji cha Wadigo na chakula cha jioni kimekwisha, watoto wanajua kinachofuata. Mzee — au kaka mkubwa, au mjomba aliyekuja kutembelea — anageuka kwa kundi na kutoa changamoto: *\"Kitendawili!\"* Watoto wanajibu kwa sauti moja: *\"Tega!\"* Na mchezo unaanza."
          },
          {
            "type": "paragraph",
            "text": "Vitendawili vya Wadigo, vinavyoitwa *vimbunga* kwa Chidigo, ni zaidi ya burudani ya watoto. Ni mafunzo ya kiakili yaliyojificha kama mchezo. Kila kitendawili kinatoa fumbo lililojengwa juu ya sitiari, ulinganifu wa muundo, na upotoshaji, likidai kwamba msuluhishi aone zaidi ya dhahiri na apate uhusiano uliofichwa kati ya vitu viwili vinavyoonekana kutohusiana. Mtoto anayeweza kuvunja kitendawili haraka anaonyesha fikra sawa za pembeni ambazo mtu mzima anahitaji kusogea katika ugumu wa kijamii, kusoma ishara za mazingira, au kutatua tatizo la kivitendo kwa rasilimali chache."
          },
          {
            "type": "paragraph",
            "text": "Wasomi wanaosoma mila za mdomo za Afrika Mashariki wanaelezea vitendawili kama \"aina maalum ya jambo la kijamii\" inayowasilisha \"changamoto kubwa za kiakili kwa watoto, lakini pia ni chombo cha thamani katika kupata ujuzi wa kilugha na kiakili.\" Kitendawili kinafundisha mtoto kufikiri kwa sitiari — kuelewa kwamba lugha inaweza kusema kitu kimoja na kumaanisha kingine, kwamba uso unificha kina, na kwamba ulimwengu unalipa wale wanaotazama kwa makini."
          },
          {
            "type": "heading",
            "text": "Maonyesho"
          },
          {
            "type": "paragraph",
            "text": "Vikao vya vitendawili ni vya ushindani. Watoto wanashindana kujibu haraka zaidi, na mzee au mtoa vitendawili anaweka alama — wakati mwingine rasmi, wakati mwingine kupitia sarafu ya kijamii ya kicheko na kibali. Muundo ni wa kuuliza-na-kujibu: mtoa vitendawili anatoa, kundi linakisia, majibu mabaya yanachokozwa, na jibu sahihi linapata shangwe. Katika shule za kisasa za pwani ya Kenya, watoto waliokulia na desturi hii wanakuwa \"waepesi sana wa kujibu,\" akili zao zikiwa zimefunzwa na miaka ya vikao vya vitendawili vya jioni kutambua mifumo na kufanya uhusiano usiotarajiwa."
          },
          {
            "type": "paragraph",
            "text": "Vitendawili Vinafundisha Nini"
          },
          {
            "type": "heading",
            "text": "Zaidi ya mafunzo ya kiakili, vitendawili vinabeba maarifa ya kitamaduni. Kitendawili kinacholinganisha mnazi na mtu anayesimama kwa mguu mmoja kinafundisha mtoto kutazama umbo la kipekee la mnazi. Kitendawili kuhusu tabia ya bahari kinafundisha mifumo ya mawimbi. Kupitia furaha ya kutatua fumbo, mtoto anachukua msamiati wa ulimwengu wa asili na wa nyumbani — majina, uhusiano, na sifa — bila uchungu wa kukariri."
          },
          {
            "type": "paragraph",
            "text": "Vitendawili pia vinafundisha watoto jinsi lugha inavyofanya kazi. Sitiari katika vitendawili zinapanua uelewa wa mtoto wa neno linaweza kufanya nini — kwamba barabara inaweza kuelezwa kama nyoka, kwamba anga inaweza kuwa nguo, kwamba mti unaweza kuwa mtu. Ujuzi huu wa kisitiari ndio msingi wa mila ya methali ambayo watu wazima wanarithi."
          },
          {
            "type": "paragraph",
            "text": "Mila Iliyo Hatarini"
          },
          {
            "type": "heading",
            "text": "Licha ya umuhimu wao, vitendawili vya Wadigo ni miongoni mwa vipengele visivyorekodiwa zaidi vya mila ya mdomo. Watafiti wa kitaaluma wanaoifanyia kazi hadithi za mdomo za Wadigo wameorodhesha vitendawili kama visivyorekodiwa vya kutosha, wakipendekeza utafiti wa baadaye kuhusu aina hiyo."
          },
          {
            "type": "paragraph",
            "text": "Pengo hili ni muhimu kwa sababu vitendawili ni miongoni mwa mifumo dhaifu zaidi ya mila ya mdomo. Methali inaweza kuishi kwa sehemu. Hadithi ya kienyeji inaweza kufupishwa. Lakini kitendawili bila jibu lake si kitu, na jibu bila kitendawili chake halina maana. Kitendawili kinaposahaulika, kimepotea kabisa."
          },
          {
            "type": "paragraph",
            "text": "Kubadilishwa kwa vikao vya vitendawili vya jioni na burudani ya skrini kunamaanisha kwamba utaratibu wa usambazaji unazidi kudhoofika. Watoto wanajifunza vitendawili vya Kiswahili shuleni — sehemu ya mtaala wa kitaifa wa fasihi ya mdomo — lakini vitendawili vya Kidigo kwa lugha ya Kidigo si sehemu ya programu yoyote ya shule. Vinaishi tu katika nyumba ambazo babu na bibi bado wanakusanya watoto baada ya chakula cha jioni na kutoa changamoto: *\"Kitendawili!\"*"
          },
          {
            "type": "paragraph",
            "text": "Kupotea kwa vikao vya vitendawili vya jioni kwa sababu ya burudani za skrini kunamaanisha kwamba njia ya kueneza maarifa inazidi kudhoofika. Watoto hujifunza vitendawili vya Kiswahili shuleni — sehemu ya somo la fasihi simulizi katika mtaala wa kitaifa — lakini vitendawili vya Kidigo katika lugha ya Kidigo haviko katika programu yoyote ya shule. Vinasalia tu katika nyumba ambapo babu na bibi bado huwakusanya watoto baada ya chakula cha jioni na kutoa changamoto: *\"Kitendawili!\"*"
          }
        ],
        "dig": [
          {
            "type": "heading",
            "text": "Mchezo Unaonola Achili"
          },
          {
            "type": "paragraph",
            "text": "Jiza rinaphokpwedza kpwa mudzi wa Adigo na chakurya cha dziloni chimekpwisha, ana anamanya kinachokpwedza. Mvyere — au kaka mkulu, au mjomba ariyekpwedza kutembelea — anagaluka kpwa kundi na kutoa changamoto: *\"Kitendawili!\"* Ana anajibu kpwa sauti mwenga: *\"Tega!\"* Na mchezo unaandza."
          },
          {
            "type": "paragraph",
            "text": "Vimbunga vya Adigo ni zaidi ya burudani ya ana. Ni mafundzo ga kiakili garigodzifitsa dza mchezo. Chila chimbunga chinatoa fumbo ririrojengwa dzulu ya mfwano, ulinganifu wa muundo, na upotoshaji, rikidai kukala msuluhishi aone zaidi ya dhahiri na apate uhusiano uriofitswa kahi ya vitu viiri vinavyoonekana kutohusiana. Mwana anayeweza kuvundza chimbunga haraka anaonyesha fikira sawa za pembeni ambazo mutu mkulu anahitaji kusogea kpwa ugumu wa kijamii, kusoma ishara za mazingira, au kumaliza tatizo ra kivitendo kpwa rasilimali chache."
          },
          {
            "type": "paragraph",
            "text": "Asomi anao soma mila za mdomo za Afrika Mashariki anaelezea vimbunga dza \"aina maalum ya jambo ra kijamii\" inayowasilisha \"changamoto kulu za kiakili kpwa ana, ela piya ni chombo cha thamani kpwa kupata ujuzi wa kilugha na kiakili.\" Chimbunga chinafundza mwana kufikiri kpwa mfwano — kuelewa kukala luga inaweza kuamba chitu chimwenga na kumanisha chinjina, kukala uso unaficha kina, na kukala ulimwengu unarilipa ariye anao tazama kpwa makini."
          },
          {
            "type": "heading",
            "text": "Maonyesho"
          },
          {
            "type": "paragraph",
            "text": "Vikao vya vimbunga ni vya ushindani. Ana anashindana kujibu haraka zaidi. Muundo ni wa kuuzwa-na-kujibu: mtoa vimbunga anatoa, kundi rinakisia, majibu mabaya ganadhihakiwa, na jibu ra sawa rinapata shangwe. Kpwa shule za kisasa za ph'wani ya Kenya, ana ariokurera na desturi hino anakala \"aepesi sana wa kujibu,\" achili zao zikale zimefundzwa ni miaka ya vikao vya vimbunga vya dziloni kutambua mifumo na kuhenda uhusiano usiotarajiwa."
          },
          {
            "type": "paragraph",
            "text": "Vimbunga Vinafundza Nini"
          },
          {
            "type": "heading",
            "text": "Zaidi ya mafundzo ga kiakili, vimbunga vinabeba marifwa ga chimila. Chimbunga chinacho linganiha mnazi na mutu anayeima kpwa mgulu mmwenga chinafundza mwana kutazama umbo ra kipekee ra mnazi. Chimbunga kuhusu tabiya ya bahari chinafundza mifumo ya maimbi. Kupitshi furaha ya kumaliza fumbo, mwana anachukua msamiati wa ulimwengu wa asili na wa nyumbani bila uchungu wa kukariri."
          },
          {
            "type": "paragraph",
            "text": "Vimbunga piya vinafundza ana jinsi luga inavyohumika. Mifwano kpwa vimbunga inapanula uelewa wa mwana wa neno rinaweza kuhenda nini. Ujuzi uhu wa kisitiari ndio msingi wa mila ya ndarira ambayo atu akulu anarihi."
          },
          {
            "type": "paragraph",
            "text": "Mila Iriyo Hatarini"
          },
          {
            "type": "heading",
            "text": "Ingawa ni muhimu, vimbunga vya Adigo ni kahi ya vipengele visivyorekodiwa zaidi vya mila ya mdomo. Atafiti wa kitaaluma anaoihendera kazi hadisi za mdomo za Adigo ameorodhesha vimbunga dza visivyorekodiwa vya kutosha."
          },
          {
            "type": "paragraph",
            "text": "Pengo rino ni muhimu kpwa sababu vimbunga ni kahi ya mifumo dhaifu zaidi ya mila ya mdomo. Ndarira inaweza kuishi kpwa sehemu. Hadisi ya chinyume inaweza kufupishwa. Ela chimbunga bila jibu rakpwe si chitu, na jibu bila chimbunga chakpwe tarina maana. Chimbunga chinaposahaulika, chimepotea kabisa."
          },
          {
            "type": "paragraph",
            "text": "Kubadilishwa kpwa vikao vya vimbunga vya dziloni na burudani ya skrini kunamanisha kukala utaratibu wa kupisha unazidi kudhoofika. Ana anajifundza vimbunga vya Chiswahili shuleni ela vimbunga vya Chidigo kpwa luga ya Chidigo si sehemu ya mpango wowosi wa shule. Vinaishi tu kpwa nyumba ambazo akuku bado anakusanya ana bada ya chakurya cha dziloni na kutoa changamoto: *\"Kitendawili!\"*"
          },
          {
            "type": "paragraph",
            "text": "Kutsukirwa kpwa vikao vya vitendawili vya usiku ni vyombo vya kuonyesa kunaamba njia ya kupishira maarifa inazidi kudhoofika. Ana anadzifundza vitendawili vya Chiswahili shuleni — sehemu ya somo ra fasihi simulizi kpwenye mtaala wa kitaifa — ela vitendawili vya Chidigo kpwa luga ya Chidigo taviko kpwenye programu yoyosi ya shule. Vinasala tu kpwenye nyumba ambazo akare bado anakusanya ana bada ya chakurya cha usiku na kuatsuphiya changamoto: *\"Kitendawili!\"*"
          }
        ]
      }
    },
    {
      "slug": "written-literature",
      "title": {
        "en": "The Oral-to-Written Transition",
        "sw": "Kupita kwa Mdomo hadi Maandishi",
        "dig": "Kubadilika kula Mdomo hadi Maandishi"
      },
      "intro": {
        "en": "There are no Digo novels. There are no Digo short story collections. There is no Digo poetry anthology. There is no Digo newspaper, no Digo magazine, no Digo blog with a regular readership. In a world…",
        "sw": "Hakuna riwaya za Kidigo. Hakuna makusanyo ya hadithi fupi za Kidigo. Hakuna mkusanyo wa mashairi ya Kidigo. Hakuna gazeti la Kidigo, hakuna jarida la Kidigo, hakuna blogu ya Kidigo yenye wasomaji wa…",
        "dig": "Takuna riwaya za Chidigo. Takuna makusanyo ga hadisi fupi za Chidigo. Takuna mkusanyo wa mashairi ga Chidigo. Takuna gazeti ra Chidigo, takuna jarida ra Chidigo, takuna blogu ya Chidigo yenye asomadzi…"
      },
      "body": {
        "en": [
          {
            "type": "heading",
            "text": "A Language Without a Library"
          },
          {
            "type": "paragraph",
            "text": "There are no Digo novels. There are no Digo short story collections. There is no Digo poetry anthology. There is no Digo newspaper, no Digo magazine, no Digo blog with a regular readership. In a world where a language's vitality is increasingly measured by its written output, Chidigo — spoken by over 300,000 people — has almost no written literature."
          },
          {
            "type": "paragraph",
            "text": "This absence is not a failure of imagination or talent. The Digo have a rich oral literary tradition — proverbs that encode centuries of wisdom, folk tales performed with theatrical brilliance, oral poetry woven into ceremony and song. What the Digo lack is not literature. They lack a written tradition. And the reasons for this absence are historical, not cultural."
          },
          {
            "type": "heading",
            "text": "How the Written Word Arrived"
          },
          {
            "type": "paragraph",
            "text": "The first substantial writing in Chidigo was not produced by the Digo. It was produced about them, by outsiders. Johann Ludwig Krapf, the German missionary who arrived on the Kenya coast in 1844, was among the first Europeans to document Mijikenda languages. Colonial administrators produced ethnographic notes. Linguists compiled word lists. The Digo were documented long before they were publishing."
          },
          {
            "type": "paragraph",
            "text": "The most significant written works in Chidigo are products of the Bible translation movement. The Bible Translation and Literacy (BTL) organisation initiated Digo translation work in 1987. The New Testament was completed in December 2007. The full Bible was dedicated on May 22, 2021. These translations represent the largest continuous texts ever produced in Chidigo — and they were produced primarily to serve a Christian constituency that comprises under two percent of the Digo population."
          },
          {
            "type": "paragraph",
            "text": "This creates a paradox that sits at the heart of Digo language preservation: the most substantial written materials in Chidigo were produced by and for a religious tradition that the vast majority of the Digo do not follow. The Bible translation project contributed enormously to Digo literacy — it standardised spelling, generated literacy primers and readers, and created demand for Chidigo reading materials. But it also means that the existing Digo written corpus carries a Christian editorial lens, in vocabulary choices, in textual register, and in cultural framing."
          },
          {
            "type": "heading",
            "text": "The Reference Works"
          },
          {
            "type": "paragraph",
            "text": "Alongside the Bible, two reference works anchor Digo literacy:"
          },
          {
            "type": "paragraph",
            "text": "*Mgombato: Digo-English-Swahili Dictionary*, compiled by Mwalonya, Nicolle, Nicolle, and Zimbu and published in 2004, is the definitive dictionary. It documents Digo vocabulary through English and Swahili equivalents — a valuable resource, but one that defines Digo in terms of other languages rather than in its own terms. The Chi-digo initiative's monolingual dictionary project aims to address this: definitions written in Digo, for Digo speakers, using Digo concepts."
          },
          {
            "type": "paragraph",
            "text": "*A Grammar of Digo* by Steve Nicolle, published in 2013 after seven years of fieldwork, is the only comprehensive grammar of the language. It includes a 1,700-item wordlist and over 100 botanical names. This is meticulous scholarly work, indispensable for anyone studying or working with Chidigo — but it is a grammar, not literature. It describes the rules of the language; it does not demonstrate what the language can do when a gifted writer takes hold of it."
          },
          {
            "type": "heading",
            "text": "The Proverb Collections"
          },
          {
            "type": "paragraph",
            "text": "Margaret Wambere Ireri's *A Collection of 100 Digo (Mijikenda) Proverbs and Wise Sayings*, published in 2016 through the African Proverbs Working Group, represents the first significant effort to bring Digo proverbs into print with translations and commentary. BTL Kenya's *Ndarira za Chidigo* is a larger collection — 349 entries with English glosses and cultural commentary, though many entries remain incomplete."
          },
          {
            "type": "paragraph",
            "text": "These collections begin to bridge the gap between oral and written tradition, but they treat proverbs as specimens to be catalogued rather than as living elements of a literary culture. The next step — and this is what the Chi-digo cultural production programme envisions — is to create contexts where proverbs appear not in dictionaries but in stories, not in scholarly annotations but in poems, not as archived specimens but as active elements of a written Digo literature that does not yet exist."
          },
          {
            "type": "heading",
            "text": "Four Dialects, One Written Standard"
          },
          {
            "type": "paragraph",
            "text": "The challenge of creating a written Digo literature is compounded by dialect variation. Four Chidigo dialects are documented:"
          },
          {
            "type": "paragraph",
            "text": "**Chinondo** — the northern dialect. **Ungu** — spoken from Msambweni to the Tanzania border. **Ts'imba** — the dialect of the Shimba Hills. **Tsw'aka** (also Chwaka) — spoken in the Shimoni area."
          },
          {
            "type": "paragraph",
            "text": "The written standard is based primarily on the Kenyan coastal variety — the best documented and most central to the speaker community. But any written Digo literature must navigate the reality that speakers in different areas may find the standard register unfamiliar in certain respects. The approach adopted by the Mgombato dictionary — documenting variant forms without privileging one as \"correct\" — provides a model: a written literature that acknowledges variation rather than suppressing it."
          },
          {
            "type": "heading",
            "text": "What Needs to Happen"
          },
          {
            "type": "paragraph",
            "text": "The gap between the Digo oral tradition and a living Digo written literature is the single most important cultural gap this initiative aims to close. The oral tradition provides the raw material: the proverbs, the stories, the poetic forms, the historical narratives, the moral vocabulary. What is needed is a generation of Digo writers who can take this material and transform it — not merely transcribe it, but reimagine it in written forms that are as compelling on the page as the oral originals are in performance."
          },
          {
            "type": "paragraph",
            "text": "This means commissioning short stories written in Digo. It means publishing novellas — the first commissioned Digo novella, targeted for Year 3 of the initiative, will be a landmark. It means creating a Digo poetry anthology. It means establishing a writing prize that tells Digo speakers: your language is worth writing in, your stories are worth telling in print, and there is an audience waiting to read what you write."
          },
          {
            "type": "paragraph",
            "text": "The transition from oral to written is not the death of the oral tradition. It is its expansion into a new medium. The evening storytelling session does not need to end for the Digo novel to begin. Both can coexist — and indeed, the best written Digo literature will draw its power from the rhythms, images, and moral intelligence of the oral tradition that preceded it by centuries."
          }
        ],
        "sw": [
          {
            "type": "heading",
            "text": "Lugha Bila Maktaba"
          },
          {
            "type": "paragraph",
            "text": "Hakuna riwaya za Kidigo. Hakuna makusanyo ya hadithi fupi za Kidigo. Hakuna mkusanyo wa mashairi ya Kidigo. Hakuna gazeti la Kidigo, hakuna jarida la Kidigo, hakuna blogu ya Kidigo yenye wasomaji wa mara kwa mara. Katika ulimwengu ambapo uhai wa lugha unazidi kupimwa kwa matokeo yake ya maandishi, Chidigo — kinachosemwa na watu zaidi ya 300,000 — hakina fasihi ya maandishi karibu yoyote."
          },
          {
            "type": "paragraph",
            "text": "Kutokuwepo huku si kushindwa kwa mawazo au talanta. Wadigo wana mila tajiri ya fasihi ya mdomo — methali zinazobeba hekima ya karne, hadithi za kienyeji zinazoigizwa kwa ustadi wa maigizo, ushairi wa mdomo uliofumwa katika sherehe na wimbo. Kinachowakosa Wadigo si fasihi. Wanakosa mila ya maandishi. Na sababu za kutokuwepo huku ni za kihistoria, si za kitamaduni."
          },
          {
            "type": "heading",
            "text": "Jinsi Neno la Maandishi Lilivyofika"
          },
          {
            "type": "paragraph",
            "text": "Maandishi ya kwanza ya maana katika Chidigo hayakuzalishwa na Wadigo. Yalizalishwa kuhusu wao, na watu wa nje. Johann Ludwig Krapf, mhubiri wa Kijerumani aliyefika pwani ya Kenya mwaka 1844, alikuwa miongoni mwa Wazungu wa kwanza kuandika lugha za Mijikenda. Watawala wa kikoloni walitoa maelezo ya kiethnografia. Wanaisimu waliunda orodha za maneno. Wadigo walirekodiwa kabla ya kuchapisha chochote."
          },
          {
            "type": "paragraph",
            "text": "Kazi muhimu zaidi za maandishi katika Chidigo ni matokeo ya harakati za kutafsiri Biblia. Shirika la BTL lilianzisha kazi ya kutafsiri kwa Kidigo mwaka 1987. Agano Jipya lilikamilishwa Desemba 2007. Biblia kamili iliwekwa wakfu Mei 22, 2021. Tafsiri hizi zinawakilisha maandishi marefu zaidi yaliyowahi kuzalishwa katika Chidigo — na yalizalishwa hasa kuhudumia jamii ya Kikristo inayojumuisha chini ya asilimia mbili ya Wadigo."
          },
          {
            "type": "paragraph",
            "text": "Hii inaunda kitendawili kinachokaa katika moyo wa uhifadhi wa lugha ya Kidigo: nyaraka za maandishi kubwa zaidi katika Chidigo zilizalishwa na na kwa mila ya kidini ambayo wengi wa Wadigo hawafuati. Mradi wa kutafsiri Biblia ulichangia sana katika kusoma na kuandika Kidigo — ulisawazisha tahajia, ulizalisha vitabu vya kusoma, na uliunda mahitaji ya nyaraka za kusoma za Chidigo. Lakini pia inamaanisha kwamba corpus ya maandishi ya Kidigo iliyopo inabeba lenzi ya uhariri wa Kikristo."
          },
          {
            "type": "heading",
            "text": "Kazi za Marejeleo"
          },
          {
            "type": "paragraph",
            "text": "*Mgombato: Digo-English-Swahili Dictionary* (2004) ni kamusi ya msingi. *A Grammar of Digo* na Steve Nicolle (2013) ni sarufi pekee kamili ya lugha. Kazi hizi ni muhimu lakini ni za kilugha, si fasihi. Zinaelezea sheria za lugha; hazionyeshi lugha inaweza kufanya nini mwandishi mzuri anaposhika."
          },
          {
            "type": "paragraph",
            "text": "Kinachohitajika Kutokea"
          },
          {
            "type": "paragraph",
            "text": "Pengo kati ya mila ya mdomo ya Wadigo na fasihi hai ya maandishi ya Kidigo ndilo pengo muhimu zaidi la kitamaduni ambalo mpango huu unakusudia kulifunga. Mila ya mdomo inatoa malighafi: methali, hadithi, mifumo ya kishairi, masimulizi ya kihistoria, msamiati wa kimaadili. Kinachohitajika ni kizazi cha waandishi wa Kidigo wanaoweza kuchukua malighafi hii na kuibadilisha — si kuinakili tu, bali kuifikiria upya katika mifumo ya maandishi ambayo inavutia kwenye ukurasa kama vile asili za mdomo zinavyovutia katika maonyesho."
          },
          {
            "type": "heading",
            "text": "Hii inamaanisha kuagiza hadithi fupi zilizoandikwa kwa Kidigo. Inamaanisha kuchapisha novela — novela ya kwanza ya Kidigo iliyoagizwa itakuwa alama muhimu. Inamaanisha kuunda mkusanyo wa mashairi ya Kidigo. Inamaanisha kuanzisha tuzo ya uandishi inayowaambia wazungumzaji wa Kidigo: lugha yako inastahili kuandikiwa, hadithi zako zinastahili kusimuliwa kwa maandishi, na kuna wasomaji wanaosubiri kusoma unachoandika."
          },
          {
            "type": "paragraph",
            "text": "Mpito kutoka mdomo hadi maandishi si kifo cha mila ya mdomo. Ni upanuzi wake katika chombo kipya. Vikao vya kusimulia hadithi jioni havihitaji kuisha ili riwaya ya Kidigo ianze. Vyote vinaweza kuishi pamoja — na kwa kweli, fasihi bora ya maandishi ya Kidigo itapata nguvu yake kutoka katika midundo, picha, na akili ya kimaadili ya mila ya mdomo iliyoitangulia kwa karne nyingi."
          },
          {
            "type": "paragraph",
            "text": "Makusanyo haya yanaanza kuziba pengo kati ya mapokeo ya simulizi na ya maandishi, lakini yanashughulikia methali kama vielelezo vya kukusanywa badala ya vipengele hai vya utamaduni wa kifasihi. Hatua inayofuata — na hii ndiyo programu ya uzalishaji wa kitamaduni ya Chi-digo inavyotazamia — ni kuunda mazingira ambapo methali zinaonekana si katika kamusi bali katika hadithi, si katika maelezo ya kitaaluma bali katika mashairi, si kama vielelezo vilivyohifadhiwa bali kama vipengele hai vya fasihi ya Kidigo iliyoandikwa ambayo bado haipo."
          },
          {
            "type": "heading",
            "text": "Lahaja Nne, Kiwango Kimoja cha Maandishi"
          },
          {
            "type": "paragraph",
            "text": "Changamoto ya kuunda fasihi ya Kidigo iliyoandikwa inazidishwa na tofauti za lahaja. Lahaja nne za Chidigo zimeandikwa:"
          },
          {
            "type": "paragraph",
            "text": "**Chinondo** — lahaja ya kaskazini. **Ungu** — inayozungumzwa kutoka Msambweni hadi mpaka wa Tanzania. **Ts'imba** — lahaja ya Milima ya Shimba. **Tsw'aka** (pia Chwaka) — inayozungumzwa katika eneo la Shimoni."
          },
          {
            "type": "paragraph",
            "text": "Kiwango cha maandishi kinategemea hasa aina ya pwani ya Kenya — iliyoandikwa zaidi na yenye umuhimu mkubwa kwa jumuiya ya wasemaji. Lakini fasihi yoyote ya Kidigo iliyoandikwa lazima ishughulikie ukweli kwamba wasemaji katika maeneo tofauti wanaweza kuona kiwango rasmi kuwa kigeni katika mambo fulani. Njia iliyochukuliwa na kamusi ya Mgombato — kuandika aina tofauti bila kupendelea moja kama \"sahihi\" — inatoa mfano: fasihi ya maandishi inayokubali tofauti badala ya kuizuia."
          },
          {
            "type": "heading",
            "text": "Kinachohitajika Kufanywa"
          },
          {
            "type": "paragraph",
            "text": "Pengo kati ya mapokeo ya simulizi ya Kidigo na fasihi hai ya Kidigo iliyoandikwa ndilo pengo muhimu zaidi la kitamaduni ambalo mpango huu unalenga kuziba. Mapokeo ya simulizi yanatoa malighafi: methali, hadithi, miundo ya kishairi, hadithi za kihistoria, msamiati wa kimaadili. Kinachohitajika ni kizazi cha waandishi wa Kidigo ambao wanaweza kuchukua malighafi hii na kuibadilisha — si kunakili tu, bali kuibuni upya katika miundo ya maandishi ambayo inavutia kwenye ukurasa kama vile asili za simulizi zinavyovutia katika uigizaji."
          },
          {
            "type": "paragraph",
            "text": "Hii inamaanisha kuagiza hadithi fupi zilizoandikwa kwa Kidigo. Inamaanisha kuchapisha novela fupi — novela ya kwanza ya Kidigo iliyoagizwa, inayolengwa kwa Mwaka wa 3 wa mpango, itakuwa alama muhimu. Inamaanisha kuunda mkusanyo wa mashairi ya Kidigo. Inamaanisha kuanzisha tuzo ya uandishi inayowaambia wasemaji wa Kidigo: lugha yenu inastahili kuandikiwa, hadithi zenu zinastahili kusimuliwa kwa maandishi, na kuna hadhira inayosubiri kusoma mnachokiandika."
          },
          {
            "type": "paragraph",
            "text": "Mpito kutoka simulizi hadi maandishi si kifo cha mapokeo ya simulizi. Ni upanuzi wake katika njia mpya. Kikao cha usimulizi wa hadithi cha jioni hakihitaji kuisha ili riwaya ya Kidigo ianze. Vyote vinaweza kuishi pamoja — na kwa kweli, fasihi bora ya Kidigo iliyoandikwa itapata nguvu yake kutoka katika midundo, picha, na akili ya kimaadili ya mapokeo ya simulizi yaliyoitangulia kwa karne nyingi."
          }
        ],
        "dig": [
          {
            "type": "heading",
            "text": "Luga Bila Maktaba"
          },
          {
            "type": "paragraph",
            "text": "Takuna riwaya za Chidigo. Takuna makusanyo ga hadisi fupi za Chidigo. Takuna mkusanyo wa mashairi ga Chidigo. Takuna gazeti ra Chidigo, takuna jarida ra Chidigo, takuna blogu ya Chidigo yenye asomadzi a mara kpwa mara. Kpwa ulimwengu ambapo umoyo wa luga unadzidi kupimwa kpwa matokeo gakpwe ga maandishi, Chidigo — chinachoambirwa ni atu zaidi ya 300,000 — tachina fasihi ya maandishi kama yoyosi."
          },
          {
            "type": "paragraph",
            "text": "Kutokukalapho kuno si kushindwa kpwa mawazo au chipaji. Adigo ana mila tajiri ya fasihi ya mdomo — ndarira zinazobeba ikima ya karne, hadisi za chinyume zinazoonyeshwa kpwa ustadi wa maigizo, ushairi wa mdomo uriofumwa kpwa sherehe na wimbo. Chitu chinachowakosa Adigo si fasihi. Anakosa mila ya maandishi. Na sababu za kutokukalapho kuno ni za kihistoria, si za chimila."
          },
          {
            "type": "heading",
            "text": "Jinsi Neno ra Maandishi Ririvyokpwedza"
          },
          {
            "type": "paragraph",
            "text": "Maandishi ga kpwandza ga maana kpwa Chidigo tagakuzalishwa ni Adigo. Gazalishwa kuhusu ao, ni atu a kure. Johann Ludwig Krapf, mhubiri wa Chijerumani ariyekpwedza ph'wani ya Kenya mwaka 1844, wakala kahi ya Azungu a kpwandza kuandika luga za Mijikenda."
          },
          {
            "type": "paragraph",
            "text": "Kazi muhimu zaidi za maandishi kpwa Chidigo ni matokeo ga harakati za kutafsiri Biblia. Shirika ra BTL riliandza kazi ya kutafsiri kpwa Chidigo mwaka 1987. Agano Dzipya rikakamilishwa Desemba 2007. Biblia kamili ikawekwa wakfu Mei 22, 2021. Tafsiri hizi zinawakilisha maandishi marefu zaidi garigokala gazalishwa kpwa Chidigo — na gazalishwa hasa kuhudumia jamii ya Chikristo inayojumuisha chini ya asilimia mbiri ya Adigo."
          },
          {
            "type": "paragraph",
            "text": "Hino inaunda chimbunga chinachokala kpwa moyo wa kuhifadhi luga ya Chidigo: nyaraka za maandishi kulu zaidi kpwa Chidigo zazalishwa ni na kpwa mila ya kidini ambayo anji a Adigo taafuata."
          },
          {
            "type": "heading",
            "text": "Kazi za Marejeleo"
          },
          {
            "type": "paragraph",
            "text": "*Mgombato* (2004) ni kamusi ya msingi. *A Grammar of Digo* ni sarufi pekee kamili ya luga. Kazi hizi ni muhimu ela ni za kilugha, si fasihi. Zinaelezea sheria za luga; tazionyeshi luga inaweza kuhenda nini muandishi mzuri anaphoshika."
          },
          {
            "type": "paragraph",
            "text": "Kinachohitajika Kukpwenderera"
          },
          {
            "type": "paragraph",
            "text": "Pengo kahi ya mila ya mdomo ya Adigo na fasihi hai ya maandishi ya Chidigo ndiro pengo muhimu zaidi ra chimila ambaro mpango uhu unakusudia kurifunga. Mila ya mdomo inatoa malighafi: ndarira, hadisi, mifumo ya kishairi, masimulizi ga historia, msamiati wa kimaadili. Kinachohitajika ni kizazi cha aandishi a Chidigo anao weza kuchukua malighafi hino na kuibadilisha — si kuinakili tu, ela kuifikiria tsipya kpwa mifumo ya maandishi ambayo inavutia kpwa ukurasa dza vira asili za mdomo zinavyovutia kpwa maonyesho."
          },
          {
            "type": "heading",
            "text": "Hino inamanisha kuagiza hadisi fupi zirizoandikwa kpwa Chidigo. Inamanisha kuchapisha novela — novela ya kpwandza ya Chidigo iriyoagizwa indakala alama muhimu. Inamanisha kuumba mkusanyo wa mashairi ga Chidigo. Inamanisha kuandza tuzo ya uandishi inayoaambira azungumzadzi a Chidigo: luga yako inastahili kuandikiwa, hadisi zako zinastahili kuhadiswa kpwa maandishi, na kuna asomadzi anaogodza kusoma unachoandika."
          },
          {
            "type": "paragraph",
            "text": "Kupisha kula mdomo hadi maandishi si chifo cha mila ya mdomo. Ni kupanuka kwakpwe kpwa chombo chiphya. Vikao vya kuhadisi hadisi dziloni tavihitaji kuisha ili riwaya ya Chidigo iandze. Vyosi vinaweza kuishi phamwenga — na kpwa kpweli, fasihi bora ya maandishi ya Chidigo indapata nguvu yakpwe kula kpwa midundo, picha, na achili ya kimaadili ya mila ya mdomo iriyoitanguliya kpwa karne nyinji."
          },
          {
            "type": "paragraph",
            "text": "Makusanyo gaga ganaandza kuziba pengo kahi ya mapokeo ga simulizi na ga maandishi, ela ganashughulika misemo kukala vielelezo vya kukusanywa badala ya vipengele vya moyo vya utamaduni wa chifasihi. Hathwa inayolunga — na ihi ndiyo programu ya uzalishaji wa chitamaduni ya Chi-digo inavyotazamiya — ni kuumba mazingira ambamo misemo inaonekana si kpwenye kamusi ela kpwenye hadithi, si kpwenye maelezo ga chitaaluma ela kpwenye mashairi, si kukala vielelezo virivyohifadhiwa ela kukala vipengele vya moyo vya fasihi ya Chidigo iriyoandikwa ambayo bado taipo."
          },
          {
            "type": "heading",
            "text": "Lahaja Nye, Kiwango Chimwenga cha Maandishi"
          },
          {
            "type": "paragraph",
            "text": "Changamoto ya kuumba fasihi ya Chidigo iriyoandikwa inazidishwa ni tofauti za lahaja. Lahaja nye za Chidigo zikaandikwa:"
          },
          {
            "type": "paragraph",
            "text": "**Chinondo** — lahaja ya kaskazini. **Ungu** — inayogombwa kula Msambweni hadi mpaka wa Tanzania. **Ts'imba** — lahaja ya Myango ya Shimba. **Tsw'aka** (piya Chwaka) — inayogombwa kpwenye eneo ra Shimoni."
          },
          {
            "type": "paragraph",
            "text": "Kiwango cha maandishi chinategemea zaidi aina ya ph'wani ya Kenya — iriyoandikwa zaidi na yenye umuhimu mkulu kpwa jamii ya agombi. Ela fasihi yoyosi ya Chidigo iriyoandikwa ni lazima ishughulikie ukpweli kukala agombi kpwenye maeneo tofauti anaweza kuona kiwango rasmi kukala chigeni kpwenye mambo fulani. Njira iriyohalwa ni kamusi ya Mgombato — kuandika aina tofauti bila kupendeleza mwenga kukala \"sahihi\" — inapha mfano: fasihi ya maandishi inayokubali tofauti badala ya kuizuwiya."
          },
          {
            "type": "heading",
            "text": "Garigolondeka Kuhendwa"
          },
          {
            "type": "paragraph",
            "text": "Pengo kahi ya mapokeo ga simulizi ga Adigo na fasihi ya moyo ya Chidigo iriyoandikwa ndiro pengo muhimu zaidi ra chitamaduni ambaro mpango uhu unalenga kuziba. Mapokeo ga simulizi ganapha malighafi: misemo, hadithi, miundo ya chishairi, hadithi za chihistoria, msamiati wa chimaadili. Garigolondeka ni chizazi cha aandishi a Chidigo ambao anaweza kuhala malighafi ihi na kuibadilisha — si kunakili tu, ela kuibuni luphya kpwenye miundo ya maandishi ambayo inavutiya kpwenye ukurasa dza asili za simulizi zinavyovutiya kpwenye uonyesho."
          },
          {
            "type": "paragraph",
            "text": "Ihi inaamba kuagiza hadithi fupi zirizoandikwa kpwa Chidigo. Inaamba kuchapisha novela fupi — novela ya kpwandza ya Chidigo iriyoagizwa, inayolengwa kpwa Mwaka wa 3 wa mpango, indakala alama muhimu. Inaamba kuumba mkusanyo wa mashairi ga Chidigo. Inaamba kuandza tuzo ya uandishi inayoambira agombi a Chidigo: luga yenu inastahili kuandikiwa, hadithi zenu zinastahili kugombwa kpwa maandishi, na kuna asirikizadzi anaosubiri kusoma mrigochochiandika."
          },
          {
            "type": "paragraph",
            "text": "Mpito kula kpwa simulizi hadi maandishi si chifo cha mapokeo ga simulizi. Ni kupanuka kpwakpwe kpwenye njira nyiphya. Kikao cha usimulizi wa hadithi cha usiku tachilondeki kuisha ili riwaya ya Chidigo iandze. Vyosi vinaweza kuishi phamwenga — na kpwa kpweli, fasihi nono zaidi ya Chidigo iriyoandikwa indahala nguvu yakpwe kula kpwa midundo, picha, na achili ya chimaadili ya mapokeo ga simulizi garigoitangulia kpwa miaka mia minji."
          }
        ]
      }
    }
  ]
};

export function getLanguageTopic(topicSlug: string): { domain: LanguageDomain; topic: Topic } | null {
  const topic = oralTraditionsDomain.topics.find((t) => t.slug === topicSlug);
  if (!topic) return null;
  return { domain: oralTraditionsDomain, topic };
}
