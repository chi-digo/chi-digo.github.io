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

export type HistoryDomain = {
  slug: string;
  title: Record<Locale, string>;
  intro: Record<Locale, string>;
  proverb: string;
  proverbGloss: string;
  topics: Topic[];
};

export const historyDomain: HistoryDomain = {
  "slug": "history",
  "title": {
    "en": "The History of the Digo",
    "sw": "Historia ya Adigo",
    "dig": "Historia ya Adigo"
  },
  "intro": {
    "en": "The Digo trace their origins to Singwaya, a large multi-ethnic settlement located somewhere north of the Tana River in present-day southern Somalia. Oral traditions shared across the Mijikenda,…",
    "sw": "Adigo wanafuatilia asili yao hadi Singwaya, makao makubwa ya makabila mengi yaliyokuwa kaskazini ya Mto Tana katika sehemu ya kusini ya Somalia ya leo. Mapokeo ya mdomo yanayoshirikiwa na Mijikenda,…",
    "dig": "Adigo anafuatiliya asili yao hadi Singwaya, makalo makulu ga makabila manji garigokala kaskazini ya Muho wa Tana kpwa sehemu ya kusini ya Somalia ya rero. Mapokeo ga mdomo ganago shirikiwa ni…"
  },
  "proverb": "Mutu asiye na asili ni kama muhi usio na midzi",
  "proverbGloss": "A person without origins is like a tree without roots",
  "topics": [
    {
      "slug": "kaya-archaeology",
      "title": {
        "en": "Kaya Archaeology",
        "sw": "Akiolojia ya Makaya",
        "dig": "Akiolojia ya Makaya"
      },
      "intro": {
        "en": "For most of the twentieth century, the question of Mijikenda origins was argued through oral traditions, colonial archives, and linguistic reconstruction. Material evidence — the physical remains of…",
        "sw": "Kwa sehemu kubwa ya karne ya ishirini, swali la asili ya Mijikenda lilijadiliwa kupitia mapokeo ya mdomo, kumbukumbu za kikoloni, na ujenzi wa kilugha. Hilo lilibadilika mwishoni mwa miaka ya 1980…",
        "dig": "Kpwa sehemu kulu ya karne ya mirongo miri, swali ra asili ya Amijikenda ririjadiliwa kupishira mapokeo ga mdomo, kumbukumbu za chikoloni, na ujenzi wa chilugha. Dzambo riro ribadilika mwisho wa miaka…"
      },
      "body": {
        "en": [
          {
            "type": "heading",
            "text": "Digging Into the Charter"
          },
          {
            "type": "paragraph",
            "text": "For most of the twentieth century, the question of Mijikenda origins was argued through oral traditions, colonial archives, and linguistic reconstruction. Material evidence — the physical remains of past lives — was largely absent from the conversation. That changed in the late 1980s when Henry Mutoro, a Kenyan archaeologist working at the University of Nairobi, undertook the first systematic excavations at kaya sites. His work, conducted in 1987 and expanded in 1994, introduced pottery sherds, iron tools, settlement patterns, and radiocarbon dates into a debate that had been conducted almost entirely through words. What the ground revealed both confirmed and complicated the stories the elders had been telling for generations."
          },
          {
            "type": "heading",
            "text": "Mutoro's Excavations"
          },
          {
            "type": "paragraph",
            "text": "Mutoro excavated eight makaya — the plural of kaya — selecting sites across the Mijikenda range from Kilifi County in the north to Kwale County in the south. His methodology combined standard archaeological techniques — stratigraphic excavation, artefact classification, radiocarbon dating — with careful attention to the oral traditions associated with each site. He was not merely digging for objects. He was testing a narrative, bringing the tools of material science to bear on a story that had been transmitted orally for generations."
          },
          {
            "type": "paragraph",
            "text": "The most significant results came from Kaya Singwaya — a site whose very name invokes the origin narrative. Here, Mutoro's excavations \"yielded pottery going back to at least the tenth century,\" with ceramics \"characteristic of early coastal littoral settlements of the later first millennium AD.\" The pottery was not crude or expedient. It showed established manufacturing traditions, consistent firing techniques, and decorative styles that connected it to a broader regional ceramic tradition along the East African coast. These were not the remains of recent refugees. They were the material traces of a settled, organised community that had been in place for centuries."
          },
          {
            "type": "heading",
            "text": "What the Pottery Tells Us"
          },
          {
            "type": "paragraph",
            "text": "Ceramic analysis is one of the most powerful tools in East African archaeology because pottery styles change over time in patterned, traceable ways. The sherds Mutoro recovered from kaya sites showed several important features. First, they were consistent with the pottery traditions of early coastal littoral settlements — the communities that lived along or near the East African shoreline during the later first millennium AD. This places kaya inhabitants within the same material culture sphere as the earliest Swahili settlements, not as isolated forest dwellers disconnected from coastal life."
          },
          {
            "type": "paragraph",
            "text": "Second, the pottery showed continuity over time. The deepest stratigraphic layers — the oldest deposits — contained ceramics that were ancestral to the styles found in later layers. This suggests that the kaya sites were not founded once and then abandoned, only to be reoccupied later by different people. They were continuously inhabited, their material culture evolving in place over centuries. This pattern of long-term occupation is more consistent with Walsh's in-situ development thesis than with the orthodox migration narrative, which implies a relatively sudden arrival."
          },
          {
            "type": "paragraph",
            "text": "Third, some of the decorative techniques observed on kaya pottery — incision patterns, rim forms, surface treatments — had parallels with pottery from other parts of the East African coast, suggesting that kaya communities were part of broader regional networks of trade and cultural exchange. They were not isolated. They were connected."
          },
          {
            "type": "heading",
            "text": "Iron Tools and Economic Life"
          },
          {
            "type": "paragraph",
            "text": "Beyond pottery, Mutoro's excavations recovered iron tools and ironworking debris — slag, tuyere fragments, and partially reduced ore — from several kaya sites. Ironworking is significant because it indicates a level of technological sophistication and economic organisation that goes well beyond subsistence farming. Smelting iron requires specialised knowledge of ore selection, furnace construction, charcoal production, temperature control, and smithing techniques. The presence of ironworking evidence at multiple kaya sites suggests that the Mijikenda were not merely consumers of iron obtained through trade but active producers with their own metallurgical traditions."
          },
          {
            "type": "paragraph",
            "text": "The iron tools themselves — blades, hoes, arrowheads, and other implements — reveal the practical concerns of daily life in the kayas. Agriculture was central, as evidenced by the prevalence of hoe blades. Hunting supplemented the diet. Woodworking tools suggest active modification of the forest environment despite the taboos on tree-cutting within the inner forest zone. The material culture of the kayas was not that of a people in flight or in hiding. It was that of a community settled, productive, and engaged with its environment over the long term."
          },
          {
            "type": "heading",
            "text": "Settlement Patterns"
          },
          {
            "type": "paragraph",
            "text": "The physical layout of kaya sites, visible both in the archaeological record and in the living kayas that have been continuously maintained, follows a pattern that is remarkably consistent across all Mijikenda groups. A dense forest buffer surrounds the settlement, penetrated by two pathways leading through fortified gates. The central clearing contains the ceremonial and governance structures — the *moroni* meeting dome, the sacred trees, the area where the *fingo* protective talismans are maintained."
          },
          {
            "type": "paragraph",
            "text": "Archaeological survey of kaya sites has revealed that this layout is not merely traditional but functional. The forest buffer provided natural fortification, making the kayas defensible against attack. The twin-gate system controlled access and allowed the monitoring of all entrances and exits. The placement of the settlement on hilltops or ridges provided natural elevation and visibility. The kayas were, in military terms, excellent defensive positions — and the consistency of their design across dozens of sites suggests a shared body of knowledge about settlement planning that was transmitted across the Mijikenda world."
          },
          {
            "type": "paragraph",
            "text": "This architectural consistency poses an interesting question for the migration debate. If the Mijikenda arrived from Singwaya at different times and settled in different locations, how did they all arrive at the same settlement design? One possibility is that the design was part of the cultural package they brought from Singwaya. Another is that it evolved locally and spread through inter-kaya contact. A third possibility — consistent with Walsh's in-situ thesis — is that it developed over centuries of shared local experience, refined through trial and the practical demands of living in a contested landscape."
          },
          {
            "type": "heading",
            "text": "Dating Evidence and Its Implications"
          },
          {
            "type": "paragraph",
            "text": "The dating evidence from Mutoro's excavations has been among the most debated aspects of his work. The tenth-century pottery from Kaya Singwaya, and the suggestion from some archaeologists that kayas may have been established as early as the ninth century, have profound implications for every theory of Mijikenda origins."
          },
          {
            "type": "paragraph",
            "text": "If the kayas were established in the ninth or tenth century, they potentially predate the Swahili stone towns — the urban coastal settlements of Mombasa, Malindi, Lamu, and Kilwa that have traditionally been treated as the earliest complex societies of the East African coast. This would overturn a persistent colonial-era assumption: that the coastal towns were centres of civilisation while the hinterland peoples were \"Nyika\" — bush-dwellers, peripheral, backward. Mutoro's dates suggest that the forest settlements of the hinterland were contemporaneous with or even earlier than the stone-and-coral towns of the coast. The Mijikenda were not latecomers. They were, possibly, pioneers."
          },
          {
            "type": "paragraph",
            "text": "For the migration debate specifically, ninth-century kaya establishment is difficult to reconcile with a migration triggered by Oromo invasions dated to the twelfth through seventeenth centuries. If the kayas are that old, either the migration happened far earlier than the oral tradition claims, or the kayas were established by a population already resident in the area — a population that may or may not have had any connection to a northern homeland called Singwaya."
          },
          {
            "type": "heading",
            "text": "Connections to Coastal Archaeology"
          },
          {
            "type": "paragraph",
            "text": "Mutoro's work did not exist in isolation. It sits within a broader tradition of East African coastal archaeology that has been gradually assembling a picture of the region's history from material remains. Excavations at Swahili sites — Manda, Shanga, Unguja Ukuu, Kilwa — have established a timeline for the development of coastal urban life, from the earliest fishing and farming settlements of the first millennium AD through the stone-built trading towns of the eleventh century onward."
          },
          {
            "type": "paragraph",
            "text": "The kaya pottery's affinities with early coastal littoral ceramics suggest that the kaya communities and the proto-Swahili communities were part of the same cultural world during the first millennium AD. They shared ceramic traditions, which implies shared knowledge, trade, or common ancestry — or some combination of all three. The conventional separation of \"coastal\" and \"hinterland\" peoples may be a later development, an artefact of the stone towns' visibility and the forest settlements' invisibility rather than a reflection of genuine cultural distance."
          },
          {
            "type": "paragraph",
            "text": "This has implications for understanding the Digo specifically. The Digo occupied a transitional zone between coast and hinterland, maintaining trade relationships with both Swahili coastal communities and interior groups. Their material culture, as revealed by archaeology, reflects this intermediate position. They were neither purely coastal nor purely inland. They were, and are, a people of the interface — the point where the Indian Ocean trade world meets the East African interior."
          },
          {
            "type": "heading",
            "text": "What Archaeology Confirms"
          },
          {
            "type": "paragraph",
            "text": "Mutoro's excavations confirmed several elements of oral tradition. The kayas were indeed ancient settlements, not recent constructions. They were fortified, defensible positions — consistent with traditions of conflict and displacement. They contained evidence of organised community life, governance structures, and economic activity. The general picture of the kayas as seats of civilisation, not mere hiding places, is supported by the material record."
          },
          {
            "type": "paragraph",
            "text": "The archaeological evidence also confirms the ecological management described in oral tradition. The kaya forests, preserved by centuries of taboo against tree-cutting, contain some of the last remnants of the ancient East African coastal forest. Mutoro's work documented the relationship between the archaeological deposits and the surrounding forest — showing that the forest's preservation was not accidental but integral to the kaya system. The ancestors lived in the forest. You do not cut down the home of the ancestors. This principle, attested in oral tradition, is confirmed by the material reality of forests that have been standing, protected, for a thousand years."
          },
          {
            "type": "heading",
            "text": "What Archaeology Challenges"
          },
          {
            "type": "paragraph",
            "text": "But the excavations also challenged elements of the traditional narrative. The dating evidence is the most obvious point of tension. If the kayas are ninth-century foundations, the sixteenth-century migration from Singwaya cannot have established them. Either the migration happened much earlier, or the kayas were founded by a pre-existing population that was later incorporated into the Mijikenda system, or the migration narrative is not literally historical but a charter that organises social relations without describing a single historical event."
          },
          {
            "type": "paragraph",
            "text": "The continuity of the ceramic record also complicates the migration story. A sudden influx of new people — refugees from Singwaya — might be expected to produce a visible break in the pottery sequence: new styles appearing abruptly, replacing or overlaying older ones. Mutoro did not report such a break. The pottery shows gradual evolution, not sudden replacement. This is more consistent with a population evolving in place than with a population arriving from elsewhere."
          },
          {
            "type": "heading",
            "text": "The Ongoing Dig"
          },
          {
            "type": "paragraph",
            "text": "Mutoro's excavations were pioneering but not comprehensive. Eight sites, however carefully excavated, cannot settle questions about a civilisation that encompassed more than sixty kayas across hundreds of kilometres of coastline. Much remains to be dug, analysed, and dated. Future excavations at other kaya sites — particularly the principal Digo kayas of Kwale and Kinondo — may refine or revise the picture that Mutoro established. Advances in dating technology, including more precise radiocarbon techniques and optically stimulated luminescence dating, could narrow the chronological ranges that remain frustratingly broad."
          },
          {
            "type": "paragraph",
            "text": "What is already clear, however, is that the kayas are not peripheral curiosities. They are central sites in the history of the East African coast — places where some of the region's earliest settled communities built lives, governed themselves, traded with their neighbours, smelted iron, made pottery, raised children, buried their dead, and maintained forests that still stand today. The archaeology of the kayas is not a footnote to the history of the Swahili coast. It is an essential chapter — one that is still being written."
          }
        ],
        "sw": [
          {
            "type": "heading",
            "text": "Kuchimba ndani ya Hati"
          },
          {
            "type": "paragraph",
            "text": "Kwa sehemu kubwa ya karne ya ishirini, swali la asili ya Mijikenda lilijadiliwa kupitia mapokeo ya mdomo, kumbukumbu za kikoloni, na ujenzi wa kilugha. Hilo lilibadilika mwishoni mwa miaka ya 1980 wakati Henry Mutoro, mwanaakiolojia wa Kenya akifanya kazi katika Chuo Kikuu cha Nairobi, alipoanza uchimbaji wa kwanza wa kimfumo katika maeneo ya makaya."
          },
          {
            "type": "heading",
            "text": "Uchimbaji wa Mutoro"
          },
          {
            "type": "paragraph",
            "text": "Mutoro alichimba makaya manane, akichagua maeneo kutoka Kilifi hadi Kwale. Matokeo muhimu zaidi yalitoka Kaya Singwaya, ambapo uchimbaji \"ulizalisha ufinyanzi wa angalau karne ya kumi,\" na keramiki \"zinazofanana na makazi ya mapema ya pwani ya bahari ya milenia ya kwanza baadaye.\" Ufinyanzi ulionyesha mila za utengenezaji zilizoimarishwa na mitindo ya mapambo inayoiunganisha na mila pana ya keramiki ya pwani ya Afrika Mashariki."
          },
          {
            "type": "paragraph",
            "text": "Zana za Chuma na Maisha ya Kiuchumi"
          },
          {
            "type": "heading",
            "text": "Zaidi ya ufinyanzi, uchimbaji wa Mutoro ulipata zana za chuma na mabaki ya kazi ya chuma — takataka, vipande vya tuyere, na madini yaliyosagwa kwa sehemu. Uwepo wa ushahidi wa kazi ya chuma katika maeneo mengi ya makaya unaonyesha kwamba Mijikenda walikuwa watengenezaji hai wenye mila zao za kimetali."
          },
          {
            "type": "paragraph",
            "text": "Mpangilio wa Makazi"
          },
          {
            "type": "paragraph",
            "text": "Mpangilio wa kimwili wa maeneo ya makaya unafuata muundo ambao ni thabiti kwa ajabu kote kwa makundi yote ya Mijikenda: msitu wa kinga, njia mbili, malango yaliyoimarishwa, na kiwanja cha kati chenye miundo ya sherehe na utawala."
          },
          {
            "type": "paragraph",
            "text": "Ushahidi wa Tarehe"
          },
          {
            "type": "heading",
            "text": "Ushahidi wa tarehe kutoka uchimbaji wa Mutoro umekuwa miongoni mwa mambo yaliyojadiliwa zaidi. Ufinyanzi wa karne ya kumi na pendekezo kwamba makaya yanaweza kuanzishwa mapema karne ya tisa — ikiweza kutangulia miji ya mawe ya Kiswahili — inabadilisha mtazamo wa historia ya pwani ya Afrika Mashariki."
          },
          {
            "type": "paragraph",
            "text": "Kile Akiolojia Inathibitisha na Kupinga"
          },
          {
            "type": "paragraph",
            "text": "Uchimbaji ulithibitisha vipengele kadhaa vya mapokeo ya mdomo: makaya yalikuwa makazi ya kale, yaliyoimarishwa, yenye ushahidi wa maisha ya jamii yaliyopangwa. Lakini ushahidi wa tarehe unapinga masimulizi ya kawaida ya uhamiaji, na mwendelezo wa rekodi ya keramiki unapendekeza idadi ya watu inayobadilika mahali badala ya kuwasili ghafla."
          },
          {
            "type": "heading",
            "text": "Mpangilio wa Makazi"
          },
          {
            "type": "paragraph",
            "text": "Mpangilio wa kimwili wa maeneo ya makaya, unaoonekana katika rekodi ya kiakiolojia na katika makaya hai yanayodumishwa mfululizo, unafuata muundo ambao ni thabiti kwa ajabu kote kwa makundi yote ya Mijikenda. Msitu mnene wa kinga unazunguka makazi, ukipitishwa na njia mbili zinazoongoza kupitia malango yaliyoimarishwa. Kiwanja cha kati kina miundo ya sherehe na utawala — kuba la mkutano la *moroni*, miti mitakatifu, na eneo ambapo hirizi za kinga za *fingo* zinahifadhiwa."
          },
          {
            "type": "paragraph",
            "text": "Utafiti wa kiakiolojia wa maeneo ya makaya umefunua kwamba mpangilio huu si wa kimila tu bali ni wa kazi. Msitu wa kinga ulitoa ngome ya asili, ukifanya makaya kuwa ya kulindwa dhidi ya mashambulizi. Mfumo wa malango mawili ulidhibiti ufikiaji na kuruhusu ufuatiliaji wa milango yote ya kuingia na kutoka. Uwekaji wa makazi juu ya vilima ulitoa mwinuko na uwezo wa kuona wa asili. Makaya yalikuwa, kwa maneno ya kijeshi, nafasi bora za ulinzi — na uthabiti wa muundo wao katika maeneo mengi unapendekeza mwili wa pamoja wa maarifa kuhusu upangaji wa makazi uliosambazwa kote ulimwenguni mwa Mijikenda."
          },
          {
            "type": "paragraph",
            "text": "Uthabiti huu wa kiujenzi unauliza swali la kuvutia kuhusu mjadala wa uhamiaji. Ikiwa Mijikenda walifika kutoka Singwaya kwa nyakati tofauti na kukaa katika maeneo tofauti, walipataje wote muundo ule ule wa makazi? Uwezekano mmoja ni kwamba muundo huo ulikuwa sehemu ya mfuko wa kitamaduni walioubeba kutoka Singwaya. Mwingine ni kwamba ulibadilika ndani na kuenezwa kupitia mawasiliano ya makaya. Uwezekano wa tatu — unaofanana na nadharia ya Walsh ya mahali pale pale — ni kwamba ulikua kwa karne nyingi za uzoefu wa pamoja wa ndani."
          },
          {
            "type": "heading",
            "text": "Ushahidi wa Tarehe na Athari Zake"
          },
          {
            "type": "paragraph",
            "text": "Ushahidi wa tarehe kutoka uchimbaji wa Mutoro umekuwa miongoni mwa mambo yaliyojadiliwa zaidi ya kazi yake. Ufinyanzi wa karne ya kumi kutoka Kaya Singwaya, na pendekezo la wanaakiolojia wengine kwamba makaya yanaweza kuanzishwa mapema karne ya tisa, vina athari kubwa kwa kila nadharia ya asili ya Mijikenda."
          },
          {
            "type": "paragraph",
            "text": "Ikiwa makaya yalianzishwa katika karne ya tisa au kumi, yanawezekana kutangulia miji ya mawe ya Kiswahili — makazi ya miji ya pwani ya Mombasa, Malindi, Lamu, na Kilwa ambayo kijadi yamechukuliwa kama jamii za kwanza ngumu za pwani ya Afrika Mashariki. Hii ingebadilisha dhana ya kudumu ya enzi ya kikoloni: kwamba miji ya pwani ilikuwa vituo vya ustaarabu huku watu wa bara wakiwa \"Nyika\" — wakazi wa nyikani, wa pembeni, wasio na maendeleo. Tarehe za Mutoro zinapendekeza kwamba makazi ya misitu ya bara yalikuwa ya wakati mmoja na au hata ya mapema zaidi kuliko miji ya mawe ya pwani. Mijikenda hawakuwa waliochelewa. Walikuwa, labda, waanzilishi."
          },
          {
            "type": "paragraph",
            "text": "Kwa mjadala wa uhamiaji hasa, kuanzishwa kwa makaya katika karne ya tisa ni vigumu kupatanisha na uhamiaji uliosababishwa na uvamizi wa Waoromo unaotarishwa karne ya kumi na mbili hadi kumi na saba. Ikiwa makaya ni ya zamani hivyo, ama uhamiaji ulitokea mapema zaidi kuliko mapokeo ya mdomo yanavyodai, au makaya yalianzishwa na idadi ya watu iliyokuwa tayari katika eneo hilo."
          },
          {
            "type": "heading",
            "text": "Uhusiano na Akiolojia ya Pwani"
          },
          {
            "type": "paragraph",
            "text": "Kazi ya Mutoro haikuwepo peke yake. Inakaa ndani ya mapokeo mapana ya akiolojia ya pwani ya Afrika Mashariki ambayo polepole yamekuwa yakikusanya picha ya historia ya eneo hilo kutoka mabaki ya kimwili. Uchimbaji katika maeneo ya Kiswahili — Manda, Shanga, Unguja Ukuu, Kilwa — umeanzisha ratiba ya maendeleo ya maisha ya miji ya pwani, kutoka makazi ya mapema ya uvuvi na kilimo ya milenia ya kwanza AD hadi miji ya biashara ya mawe ya karne ya kumi na moja kuendelea."
          },
          {
            "type": "paragraph",
            "text": "Uhusiano wa ufinyanzi wa makaya na keramiki za mapema za pwani unapendekeza kwamba jamii za makaya na jamii za proto-Kiswahili zilikuwa sehemu ya ulimwengu ule ule wa kitamaduni wakati wa milenia ya kwanza AD. Walishiriki mila za keramiki, ambayo inamaanisha maarifa ya pamoja, biashara, au nasaba ya pamoja. Mgawanyo wa kawaida wa watu wa \"pwani\" na \"bara\" unaweza kuwa maendeleo ya baadaye — artifact ya uwezo wa kuonekana wa miji ya mawe badala ya kuonyesha umbali wa kweli wa kitamaduni."
          },
          {
            "type": "paragraph",
            "text": "Hii ina athari kwa kuelewa Wadigo hasa. Wadigo walikaa katika eneo la mpito kati ya pwani na bara, wakidumisha uhusiano wa biashara na jamii za pwani za Kiswahili na makundi ya ndani. Utamaduni wao wa kimwili, kama unavyofunuliwa na akiolojia, unaonyesha nafasi hii ya kati. Hawakuwa wa pwani tu wala wa bara tu. Walikuwa, na ni, watu wa makutano — hatua ambapo ulimwengu wa biashara ya Bahari ya Hindi unakutana na bara la Afrika Mashariki."
          },
          {
            "type": "heading",
            "text": "Kile Akiolojia Inathibitisha"
          },
          {
            "type": "paragraph",
            "text": "Uchimbaji wa Mutoro ulithibitisha vipengele kadhaa vya mapokeo ya mdomo. Makaya yalikuwa kweli makazi ya zamani, si ujenzi wa hivi karibuni. Yalikuwa nafasi zilizoimarishwa, zinazolindwa — yanayolingana na mapokeo ya migogoro na uhamisho. Yalikuwa na ushahidi wa maisha ya jamii yaliyopangwa, miundo ya utawala, na shughuli za kiuchumi. Picha ya jumla ya makaya kama viti vya ustaarabu, si sehemu za kujificha tu, inasaidiwa na rekodi ya kimwili."
          },
          {
            "type": "paragraph",
            "text": "Ushahidi wa kiakiolojia pia unathibitisha usimamizi wa kiikolojia ulioelezwa katika mapokeo ya mdomo. Misitu ya makaya, iliyohifadhiwa na karne za mwiko dhidi ya kukata miti, ina baadhi ya mabaki ya mwisho ya msitu wa kale wa pwani ya Afrika Mashariki. Kazi ya Mutoro ilirekodia uhusiano kati ya amana za kiakiolojia na msitu unaozunguka — ikionyesha kwamba uhifadhi wa msitu haukuwa wa bahati nasibu bali muhimu kwa mfumo wa kaya. Mababu waliishi msituni. Huwezi kukata nyumba ya mababu. Kanuni hii, iliyothibitishwa katika mapokeo ya mdomo, inathibitishwa na ukweli wa kimwili wa misitu ambayo imesimama, ikilindwa, kwa miaka elfu moja."
          },
          {
            "type": "heading",
            "text": "Kile Akiolojia Inapinga"
          },
          {
            "type": "paragraph",
            "text": "Lakini uchimbaji pia ulipinga vipengele vya masimulizi ya jadi. Ushahidi wa tarehe ndio hatua ya wazi zaidi ya mvutano. Ikiwa makaya ni misingi ya karne ya tisa, uhamiaji wa karne ya kumi na sita kutoka Singwaya hauwezi kuyaanzisha. Ama uhamiaji ulitokea mapema zaidi, au makaya yalianzishwa na idadi ya watu iliyokuwepo tayari ambayo baadaye ilijumuishwa katika mfumo wa Mijikenda, au masimulizi ya uhamiaji si ya kihistoria kihalisi bali ni hati inayopanga mahusiano ya kijamii bila kuelezea tukio moja la kihistoria."
          },
          {
            "type": "paragraph",
            "text": "Mwendelezo wa rekodi ya keramiki pia unagumu hadithi ya uhamiaji. Kufika kwa ghafla kwa watu wapya — wakimbizi kutoka Singwaya — kungetarajiwa kutoa mapumziko yanayoonekana katika mfuatano wa ufinyanzi: mitindo mipya ikionekana ghafla, ikibadilisha au kufunika ya zamani. Mutoro hakuripoti mapumziko kama hayo. Ufinyanzi unaonyesha mageuzi ya taratibu, si ubadilishaji wa ghafla. Hii inapatana zaidi na idadi ya watu inayobadilika mahali kuliko na idadi ya watu inayofika kutoka mahali pengine."
          },
          {
            "type": "heading",
            "text": "Uchimbaji Unaoendelea"
          },
          {
            "type": "paragraph",
            "text": "Uchimbaji wa Mutoro ulikuwa wa upainia lakini si wa kina kamili. Maeneo manane, hata yaliyochimbwa kwa uangalifu, hayawezi kusuluhisha maswali kuhusu ustaarabu uliojumuisha makaya zaidi ya sitini katika mamia ya kilomita za pwani. Mengi yanabaki kuchimbwa, kuchambuliwa, na kutarishwa. Uchimbaji wa siku zijazo katika maeneo mengine ya makaya — hasa makaya makuu ya Wadigo ya Kwale na Kinondo — yanaweza kusafisha au kurekebisha picha ambayo Mutoro alianzisha. Maendeleo ya teknolojia ya tarehe yanaweza kupunguza vipindi vya kronolojia ambavyo vinasalia kuwa vipana kwa njia ya kukatisha tamaa."
          },
          {
            "type": "paragraph",
            "text": "Kinachoeleweka tayari, hata hivyo, ni kwamba makaya si mambo ya pembeni yasiyofaa. Ni maeneo ya kati katika historia ya pwani ya Afrika Mashariki — mahali ambapo baadhi ya jamii za mapema zaidi zilizokaa katika eneo hilo zilijenga maisha, kujitawala, kufanya biashara na majirani zao, kuyeyusha chuma, kutengeneza ufinyanzi, kulea watoto, kuzika wafu wao, na kudumisha misitu ambayo bado inasimama leo. Akiolojia ya makaya si nukta ya chini katika historia ya pwani ya Kiswahili. Ni sura muhimu — moja ambayo bado inaandikwa."
          }
        ],
        "dig": [
          {
            "type": "heading",
            "text": "Kuchimba ndani ya Hati"
          },
          {
            "type": "paragraph",
            "text": "Kpwa sehemu kulu ya karne ya mirongo miri, swali ra asili ya Amijikenda ririjadiliwa kupishira mapokeo ga mdomo, kumbukumbu za chikoloni, na ujenzi wa chilugha. Dzambo riro ribadilika mwisho wa miaka ya 1980 wakati Henry Mutoro, mwanaakiolojia wa Kenya akihenda kazi kpwa Chuo Chikulu cha Nairobi, aripokpwandza uchimbaji wa kpwandza wa chimfumo kpwa maeneo ga makaya."
          },
          {
            "type": "heading",
            "text": "Uchimbaji wa Mutoro"
          },
          {
            "type": "paragraph",
            "text": "Mutoro arichimba makaya manane, akichagula maeneo kula Kilifi hadi Kwale. Matokeo muhimu zaidi garitoka Kaya Singwaya, ambapho uchimbaji \"urizalisha ufinyanzi wa angalau karne ya kumi,\" na keramiki \"zinazofanana na makazi ga mapema ga ph'wani ya bahari ya milenia ya kpwandza badaye.\" Ufinyanzi urionyesha chimila za utengenezaji zirizoimarishwa na mitindo ya mapambo inayoiunganisha na chimila phana ya keramiki ya ph'wani ya Afrika Mashariki."
          },
          {
            "type": "paragraph",
            "text": "Zana za Chuma na Maisha ga Chiuchumi"
          },
          {
            "type": "heading",
            "text": "Zaidi ya ufinyanzi, uchimbaji wa Mutoro uripata zana za chuma na mabaki ga kazi ya chuma — takataka, vipande vya tuyere, na madini garigosagwa kpwa sehemu. Upho wa ushahidi wa kazi ya chuma kpwa maeneo manji ga makaya unaonyesha kukala Amijikenda akala atengenezaji a uhai enye chimila zao za chimetali."
          },
          {
            "type": "paragraph",
            "text": "Mpangilio wa Makazi"
          },
          {
            "type": "paragraph",
            "text": "Mpangilio wa chimwili wa maeneo ga makaya unafuata muundo ambao ni thabiti kpwa ajabu kosi kpwa makundi gosi ga Amijikenda: msitu wa kinga, njira mbiri, malango garigoimarishwa, na kiwanja cha kahi chenye miundo ya sherehe na utawala."
          },
          {
            "type": "paragraph",
            "text": "Ushahidi wa Tarehe"
          },
          {
            "type": "heading",
            "text": "Ushahidi wa tarehe kula uchimbaji wa Mutoro umekala kahi ya mambo garigojadiliwa zaidi. Ufinyanzi wa karne ya kumi na pendekezo kukala makaya ganaweza kuanzishwa mapema karne ya tisa — ikiweza kutangulia midzi ya mawe ya Chiswahili — inabadilisha mtazamo wa historia ya ph'wani ya Afrika Mashariki."
          },
          {
            "type": "paragraph",
            "text": "Gago Akiolojia Inathibitisha na Kupinga"
          },
          {
            "type": "paragraph",
            "text": "Uchimbaji urithibitisha vipengele kadhaa vya mapokeo ga mdomo: makaya gakala makazi ga kare, garigoimarishwa, genye ushahidi wa maisha ga jamii garigopangwa. Ela ushahidi wa tarehe unapinga masimulizi ga kawaida ga uhamisho, na mwendelezo wa rekodi ya keramiki unapendekeza idadi ya atu inayobadilika phatu badala ya kuwasili gafla."
          },
          {
            "type": "heading",
            "text": "Mpangilio wa Makazi"
          },
          {
            "type": "paragraph",
            "text": "Mpangilio wa chimwili wa maeneo ga makaya, unaoonekana kpwa rekodi ya chiakiolojia na kpwa makaya ga uhai ganago dumishwa mfululizo, unafuata muundo ambao ni thabiti kpwa ajabu kosi kpwa makundi gosi ga Amijikenda. Msitu mnene wa kinga unadzikiriya makazi, ukipishishwa ni njira mbiri zinazoongoza kupitshi malango garigoimarishwa. Kiwanja cha kahi china miundo ya sherehe na utawala — kuba ra mkutano ra *moroni*, miri mitakatifu, na eneo ambapho hirizi za kinga za *fingo* zinahifadhiwa."
          },
          {
            "type": "paragraph",
            "text": "Utafiti wa chiakiolojia wa maeneo ga makaya umefunula kukala mpangilio uwo si wa chimila tu ela ni wa kazi. Msitu wa kinga uritoa ngome ya asili, ukihenda makaya gakale ga kulindwa dhidi ya mashambulizi. Mfumo wa malango mairi uridhibiti ufikiaji na kuruhusu ufuatiliaji wa milango yosi ya kuinjira na kutoka. Uwekaji wa makazi dzulu ya virima uritoa mwinuko na uwezo wa kuona wa asili. Makaya gakala, kpwa maneno ga chiashi, nafasi bora za ulinzi — na uthabiti wa muundo gao kpwa maeneo manji unapendekeza mwiri wa phamwenga wa marifwa kuhusu upangaji wa makazi urioenezwa kosi kpwa ulimwengu wa Amijikenda."
          },
          {
            "type": "paragraph",
            "text": "Uthabiti uwo wa chiujenzi unauliza swali ra kuvutia kuhusu mjadala wa uhamisho. Ikala Amijikenda arifika kula Singwaya kpwa nyakati tofauti na kukala kpwa maeneo tofauti, aripata vihi osi muundo uwo uwo wa makazi? Uwezekano mmwenga ni kukala muundo uwo ukala sehemu ya mfuko wa chimila arioutsukula kula Singwaya. Mwinjine ni kukala uribadilika phatu na kuenezwa kupitshi mawasiliano ga makaya. Uwezekano wa hahu — unaofanana na nadharia ya Walsh ya phatu phapho — ni kukala urikula kpwa karne nyinji za uzoefu wa phamwenga wa phatu phapho."
          },
          {
            "type": "heading",
            "text": "Ushahidi wa Tarehe na Athari Zakpwe"
          },
          {
            "type": "paragraph",
            "text": "Ushahidi wa tarehe kula uchimbaji wa Mutoro umekala kahi ya mambo garigojadiliwa zaidi ga kazi yakpwe. Ufinyanzi wa karne ya kumi kula Kaya Singwaya, na pendekezo ra anaakiolojia anjine kukala makaya ganaweza kuanzishwa mapema karne ya tisa, gana athari kubwa kpwa chila nadharia ya asili ya Amijikenda."
          },
          {
            "type": "paragraph",
            "text": "Ikala makaya garianzishwa kpwa karne ya tisa au kumi, ganawezekana kutangulia midzi ya mawe ya Chiswahili — makazi ga midzi ya ph'wani ya Mombasa, Malindi, Lamu, na Kilwa ambayo kijadi gamechukuliwa dza jamii za kpwandza ngumu za ph'wani ya Afrika Mashariki. Hiri ringebadilisha dhana ya kudumu ya enzi ya chikoloni: kukala midzi ya ph'wani yakala vituo vya ustaarabu huku atu a bara akala \"Nyika\" — akazi wa nyikani, a pembeni, asio na maendeleo. Tarehe za Mutoro zinapendekeza kukala makazi ga misitu ga bara gakala ga wakati mmwenga na au hata ga mapema zaidi kuliko midzi ya mawe ya ph'wani. Amijikenda taakala ariochelewa. Akala, labda, aanzilishi."
          },
          {
            "type": "paragraph",
            "text": "Kpwa mjadala wa uhamisho hasa, kuanzishwa kpwa makaya kpwa karne ya tisa ni vigumu kupatanisha na uhamisho uriosababishwa ni uvamizi wa Aoromo unaotarishwa karne ya kumi na mbiri hadi kumi na saba. Ikala makaya ni ga kare hivyo, ama uhamisho uritokea mapema zaidi kuliko mapokeo ga mdomo ganavyodai, au makaya garianzishwa ni idadi ya atu iriyokala tayari kpwa eneo riro."
          },
          {
            "type": "heading",
            "text": "Uhusiano na Akiolojia ya Ph'wani"
          },
          {
            "type": "paragraph",
            "text": "Kazi ya Mutoro taikala peke yakpwe. Inakala ndani ya chimila phana ya akiolojia ya ph'wani ya Afrika Mashariki ambayo pore-pore imekala ikikusanya picha ya historia ya eneo riro kula mabaki ga chimwili. Uchimbaji kpwa maeneo ga Chiswahili — Manda, Shanga, Unguja Ukuu, Kilwa — umeanzisha ratiba ya maendeleo ga maisha ga midzi ya ph'wani, kula makazi ga mapema ga uvuvi na ukulima ga milenia ya kpwandza AD hadi midzi ya chibiashara ya mawe ya karne ya kumi na mwenga kuenderera."
          },
          {
            "type": "paragraph",
            "text": "Uhusiano wa ufinyanzi wa makaya na keramiki za mapema za ph'wani unapendekeza kukala jamii za makaya na jamii za proto-Chiswahili zakala sehemu ya ulimwengu uwo uwo wa chimila wakati wa milenia ya kpwandza AD. Ashiriki chimila za keramiki, ambayo inamaanisha marifwa ga phamwenga, chibiashara, au nasaba ya phamwenga. Mgawanyo wa kawaida wa atu a \"ph'wani\" na \"bara\" unaweza kukala maendeleo ga badaye — chitu cha uwezo wa kuonekana wa midzi ya mawe badala ya kuonyesha umbali wa kpweli wa chimila."
          },
          {
            "type": "paragraph",
            "text": "Hiri rina athari kpwa kuelewa Adigo hasa. Adigo akala kpwa eneo ra mphito kahi ya ph'wani na bara, akidumisha uhusiano wa chibiashara na jamii za ph'wani za Chiswahili na makundi ga ndani. Utamaduni wao wa chimwili, dza unavyofunuliwa ni akiolojia, unaonyesha nafasi iyo ya kahi. Taakala a ph'wani tu wala a bara tu. Akala, na ni, atu a makutano — hatua ambapho ulimwengu wa chibiashara wa Bahari ya Hindi unakutana na bara ra Afrika Mashariki."
          },
          {
            "type": "heading",
            "text": "Gago Akiolojia Inathibitisha"
          },
          {
            "type": "paragraph",
            "text": "Uchimbaji wa Mutoro urithibitisha vipengele kadhaa vya mapokeo ga mdomo. Makaya gakala kpweli makazi ga kare, si ujenzi wa phivi phivi. Gakala nafasi zirizoimarishwa, zinazolindwa — ganago lingana na mapokeo ga migogoro na uhamisho. Gakala na ushahidi wa maisha ga jamii garigopangwa, miundo ya utawala, na shughuli za chiuchumi. Picha ya jumla ya makaya dza viti vya ustaarabu, si sehemu za kudzificha tu, inasaidiwa ni rekodi ya chimwili."
          },
          {
            "type": "paragraph",
            "text": "Ushahidi wa chiakiolojia piya unathibitisha usimamizi wa kiikolojia urioelezwa kpwa mapokeo ga mdomo. Misitu ya makaya, iriyohifadhiwa ni karne za mwiko dhidi ya kukata miri, ina bazi ya mabaki ga mwisho ga msitu wa kare wa ph'wani ya Afrika Mashariki. Kazi ya Mutoro irirekodia uhusiano kahi ya amana za chiakiolojia na msitu unaodzikiriya — ikionyesha kukala uhifadhi wa msitu taukala wa bahati nasibu ela muhimu kpwa mfumo wa kaya. Akare aishi msituni. Taukata nyumba ya akare. Kanuni iyo, iriyothibitishwa kpwa mapokeo ga mdomo, inathibitishwa ni ukpweli wa chimwili wa misitu ambayo imesimama, ikilindwa, kpwa miaka elfu mwenga."
          },
          {
            "type": "heading",
            "text": "Gago Akiolojia Inapinga"
          },
          {
            "type": "paragraph",
            "text": "Ela uchimbaji piya uripinga vipengele vya masimulizi ga chimila. Ushahidi wa tarehe ndio hatua ya wazi zaidi ya mvutano. Ikala makaya ni misingi ya karne ya tisa, uhamisho wa karne ya kumi na sita kula Singwaya tauweza kugaanzisha. Ama uhamisho uritokea mapema zaidi, au makaya garianzishwa ni idadi ya atu iriyokala tayari ambayo badaye irijumuishwa kpwa mfumo wa Amijikenda, au masimulizi ga uhamisho si ga chihistoria kihalisi ela ni hati inayopanga mahusiano ga chijamii bila kuelezea dzambo mwenga ra chihistoria."
          },
          {
            "type": "paragraph",
            "text": "Mwendelezo wa rekodi ya keramiki piya unagumisha hadithi ya uhamisho. Kufika kpwa gafla kpwa atu apya — akimbizi kula Singwaya — kungetarajiwa kutoa mapumziko ganago onekana kpwa mfuatano wa ufinyanzi: mitindo mipya ikionekana gafla, ikibadilisha au kufunika ya kare. Mutoro taariripoti mapumziko dza gago. Ufinyanzi unaonyesha mageuzi ga taratibu, si ubadilishaji wa gafla. Hiri rinapatana zaidi na idadi ya atu inayobadilika phatu kuliko na idadi ya atu inayofika kula phatu phanjina."
          },
          {
            "type": "heading",
            "text": "Uchimbaji Unaoenderera"
          },
          {
            "type": "paragraph",
            "text": "Uchimbaji wa Mutoro ukala wa upainia ela si wa kina kamili. Maeneo manane, hata garigochimbwa kpwa uangalifu, tagaweza kusuluhisha maswali kuhusu ustaarabu uriojumuisha makaya zaidi ya sitini kpwa mamia ya kilomita za ph'wani. Manji ganasala kuchimbwa, kuchambuliwa, na kutarishwa. Uchimbaji wa siku zijazo kpwa maeneo ganjina ga makaya — hasa makaya makulu ga Adigo ga Kwale na Kinondo — ganaweza kusafisha au kurekebisha picha ambayo Mutoro arianzisha. Maendeleo ga teknolojia ya tarehe ganaweza kupunguza vipindi vya kronolojia ambavyo vinasala kukala viphana kpwa njira ya kukatisha tamaa."
          },
          {
            "type": "paragraph",
            "text": "Chirichoelewa tayari, hata hivyo, ni kukala makaya si mambo ga pembeni gasigofaa. Ni maeneo ga kahi kpwa historia ya ph'wani ya Afrika Mashariki — phatu ambapho bazi ya jamii za mapema zaidi zirizokala kpwa eneo riro zaridzenga maisha, kudzitawala, kuhenda chibiashara na ajirani ao, kuyeyusha chuma, kutengeneza ufinyanzi, kurera ana, kuzika afu ao, na kudumisha misitu ambayo bado inasimama rero. Akiolojia ya makaya si nukta ya chini kpwa historia ya ph'wani ya Chiswahili. Ni sura muhimu — mwenga ambayo bado inaandikwa."
          }
        ]
      }
    },
    {
      "slug": "scholarly-debates",
      "title": {
        "en": "Scholarly Debates on Digo Origins",
        "sw": "Mijadala ya Kitaaluma kuhusu Asili ya Adigo",
        "dig": "Mijadala ya Chitaaluma kuhusu Asili ya Adigo"
      },
      "intro": {
        "en": "Few topics in East African historiography have generated as much sustained disagreement as the question of Mijikenda origins. Did the nine Mijikenda peoples — Giriama, Duruma, Digo, Chonyi, Kambe,…",
        "sw": "Mada chache katika historia ya Afrika Mashariki zimezalisha kutokubaliana kwa kudumu kama swali la asili ya Mijikenda. Je, makundi tisa ya Mijikenda yalihama kutoka makao ya pamoja ya Singwaya? Au…",
        "dig": "Mada chache kpwa historia ya Afrika Mashariki zimezalisha kutokubaliana kpwa kudumu dza swali ra asili ya Amijikenda. Dze, makundi tisa ga Amijikenda garihamia kula makalo ga phamwenga ga Singwaya? Au…"
      },
      "body": {
        "en": [
          {
            "type": "heading",
            "text": "A Question That Will Not Settle"
          },
          {
            "type": "paragraph",
            "text": "Few topics in East African historiography have generated as much sustained disagreement as the question of Mijikenda origins. Did the nine Mijikenda peoples — Giriama, Duruma, Digo, Chonyi, Kambe, Rabai, Ribe, Jibana, and Kauma — migrate south from a shared homeland called Singwaya in present-day southern Somalia? Or did they evolve largely in place, in the coastal hinterland of Kenya, and adopt the Singwaya narrative later as a tool of collective identity? The debate has drawn on oral traditions, linguistic reconstruction, archaeological excavation, and colonial archival research, and after more than fifty years of scholarship, it remains unresolved. What follows is not a verdict but a map of the arguments — a guide to who has said what, on what evidence, and why it matters."
          },
          {
            "type": "heading",
            "text": "Thomas T. Spear and the Orthodox Position"
          },
          {
            "type": "paragraph",
            "text": "The most influential statement of the orthodox view — that the Singwaya migration is substantially historical — came from Thomas T. Spear in his 1978 monograph *The Kaya Complex*, published by the Kenya Literature Bureau. Spear synthesised oral traditions collected across the Mijikenda, Pokomo, Swahili, Taita, and Segeju peoples, arguing that while some earlier interpretations of the Singwaya tradition could not be sustained, the tradition itself is \"nevertheless valid for the Mijikenda, Pokomo, Swahili, Taita, and Segeju, where such evidence supports its basic veracity.\" For Spear, the convergence of multiple independent traditions pointing to the same ancestral location constituted strong evidence. If five or six unrelated peoples all say they came from the same place, the simplest explanation is that they did."
          },
          {
            "type": "paragraph",
            "text": "Spear's work remains the standard reference, but it has not gone unchallenged. Subsequent scholars have questioned both his methodology — particularly his handling of linguistic evidence — and his conclusions. The debate he framed, however, continues to define the field."
          },
          {
            "type": "heading",
            "text": "Rodger F. Morton and the Late-Adoption Thesis"
          },
          {
            "type": "paragraph",
            "text": "The earliest major challenge to the orthodox view came from Rodger F. Morton, who published \"The Shungwaya myth of Miji Kenda origins\" in the *International Journal of African Historical Studies* in 1972. Morton's argument was provocative: Shungwaya, he claimed, \"is actually an appended myth.\" His research into colonial-era records suggested that \"coastal traditions recorded prior to 1897 indicate that the Shungwaya tradition entered Miji Kenda oral literature only after this date.\""
          },
          {
            "type": "paragraph",
            "text": "If Morton is correct, the implications are significant. A tradition that purports to describe events of the twelfth to seventeenth centuries may in fact be barely a century old, emerging around 1897 in connection with rising ethnic consciousness and, in the Digo case, Islamisation. Morton did not argue that nothing happened — that the Mijikenda peoples sprang into existence fully formed on the Kenya coast. He argued that the Singwaya narrative specifically, with its detailed departure order and named ancestral homeland, was a later overlay, adopted as the Mijikenda groups began to forge a collective political identity in the face of colonial pressure."
          },
          {
            "type": "heading",
            "text": "Thomas Hinnebusch and the Linguistic Critique"
          },
          {
            "type": "paragraph",
            "text": "Thomas Hinnebusch brought the tools of historical linguistics to bear on the Singwaya question in 1976. His intervention was primarily methodological: he critiqued Spear's use of linguistic data, observing that Spear \"could not confirm Shungwaya as a linguistic homeland because he misunderstood the data.\" Hinnebusch argued that the patterns of linguistic divergence among Sabaki Bantu languages did not neatly support a single-origin migration from one location."
          },
          {
            "type": "paragraph",
            "text": "Yet Hinnebusch's position was more nuanced than a simple rejection. In his later collaboration with Derek Nurse, he would actually support the idea of a northern Proto-Sabaki homeland — though not necessarily Singwaya as described in oral tradition. The distinction is important: the linguistic evidence might support a northward origin for the language family without confirming the specific narrative of a named city, an Oromo invasion, and an ordered departure."
          },
          {
            "type": "heading",
            "text": "Derek Nurse and Thomas Hinnebusch: The Linguistic History"
          },
          {
            "type": "paragraph",
            "text": "The most sophisticated linguistic treatment of the question appeared in 1993, when Derek Nurse and Thomas Hinnebusch published *Swahili and Sabaki: A Linguistic History* with the University of California Press. Their reconstruction proposed that Proto-Northeast-Coastal Bantu ancestors appeared between the Wami and Rufiji rivers — far to the south of Singwaya — around the first millennium AD. Proto-Sabaki speakers then \"migrated northwards across the Juba River to a location associated with the legendary Shungwaya,\" where they diversified into Swahili, Mijikenda, Pokomo, Elwana, and Comorian communities. They dated Proto-Northeast Coast to around 1 AD, with Proto-Sabaki emerging roughly five hundred years later."
          },
          {
            "type": "paragraph",
            "text": "This reconstruction partially vindicates the migration narrative while fundamentally complicating it. The direction of travel is right — Proto-Sabaki speakers did apparently move to a northern location and then disperse southward. But the timeline is far deeper than oral tradition suggests, and the process of diversification was linguistic and gradual rather than a sudden flight from a single city. The Singwaya of the oral traditions may correspond to a real phase of Proto-Sabaki concentration in the north, but it was not a single settlement in the way the tradition describes."
          },
          {
            "type": "heading",
            "text": "Martin Walsh and the In-Situ Thesis"
          },
          {
            "type": "paragraph",
            "text": "Perhaps the most radical reappraisal of Mijikenda origins has come from Martin Walsh, who concluded \"that this evidence is insufficient to support the tradition of a northern homeland, and proposing the alternative thesis that the Mijikenda developed in much the same area that they are to be found today.\" In Walsh's reading, the Mijikenda did not come from Singwaya. They evolved in the coastal hinterland of Kenya, developing their distinctive cultures, languages, and kaya-based social organisation in roughly the same territory they occupy now. They may have adopted the Singwaya narrative later, borrowing it from neighbouring peoples or constructing it collectively as a means of forging shared identity."
          },
          {
            "type": "paragraph",
            "text": "Walsh's work on the Segeju peoples strengthened this argument by demonstrating unexpected linguistic connections. In \"The Segeju Complex?\" he showed that the Mijikenda lexicon is \"replete with loanwords from a Central Kenya Bantu language once spoken by the Segeju/Daiso.\" These borrowings are not trivial — they cover livestock production, long-distance trading, military and political organisation, and the age-set system, including the foundational word *rika* (\"age-set\") itself. If the core vocabulary of Mijikenda political and economic life was borrowed from the Segeju, then the Segeju \"left a legacy of political organization and ritual practice that contributed significantly to the precolonial making of the Mijikenda.\" The Mijikenda identity, in other words, may be a composite — assembled from multiple sources, not descended from a single origin."
          },
          {
            "type": "heading",
            "text": "Henry Mutoro and the Archaeological Evidence"
          },
          {
            "type": "paragraph",
            "text": "While the debate over Singwaya had been conducted through oral traditions, colonial archives, and linguistic reconstruction, Henry Mutoro introduced a new category of evidence: archaeology. In excavations conducted in 1987 and 1994 at eight makaya, Mutoro unearthed material remains that complicated every existing position. At Kaya Singwaya, his excavations \"yielded pottery going back to at least the tenth century,\" with ceramics \"characteristic of early coastal littoral settlements of the later first millennium AD.\""
          },
          {
            "type": "paragraph",
            "text": "The dating evidence is significant. If kaya sites were occupied as early as the ninth or tenth century, they potentially predate the Swahili coastal settlements — the stone towns of Mombasa, Malindi, and Lamu — that are conventionally treated as the earliest urban centres of the East African coast. This would mean the Mijikenda were not latecomers who settled in the hinterland after the coast was already developed, but early inhabitants whose forest settlements preceded or paralleled the coastal towns. It challenges both the orthodox migration narrative (which implies a relatively late arrival) and the colonial-era assumption that the Mijikenda were \"bush people\" marginal to the sophisticated coastal civilisation."
          },
          {
            "type": "heading",
            "text": "Dating Controversies"
          },
          {
            "type": "paragraph",
            "text": "The question of when the kayas were established remains one of the most contested issues in the field. The range of proposed dates is striking: some scholars place kaya establishment in the sixteenth century, consistent with a late-period migration from Singwaya, while Mutoro's archaeological evidence pushes the date back to at least the ninth or tenth century. This gap of six to seven centuries is not a minor discrepancy. If the kayas are sixteenth-century foundations, the orthodox migration narrative is plausible. If they are ninth-century foundations, the narrative of a sudden southward flight from Oromo invasion becomes difficult to sustain — unless the migration happened far earlier than tradition suggests, or the kayas were established by earlier inhabitants and later absorbed into the Mijikenda system."
          },
          {
            "type": "heading",
            "text": "Oral Tradition as Adaptive Knowledge"
          },
          {
            "type": "paragraph",
            "text": "One of the most important insights to emerge from the scholarly debate is the recognition that oral traditions are not static records. They are adaptive, living systems of knowledge that respond to changing circumstances. Thomas Spear himself acknowledged this in his work, even as he argued for the historical core of the Singwaya tradition. Morton demonstrated it by showing how the tradition may have entered Mijikenda oral literature at a specific historical moment. Walsh took the argument furthest by suggesting that the tradition may be an entirely adopted narrative — a story borrowed to serve contemporary needs."
          },
          {
            "type": "paragraph",
            "text": "None of this diminishes the value of oral tradition. It means that oral traditions must be read with the same critical sophistication applied to any historical source. A colonial document is not taken at face value; it is interrogated for its biases, its context, its purposes. Oral traditions deserve the same respect — and the same scrutiny. They carry genuine historical information, but that information is embedded in layers of interpretation, adaptation, and cultural purpose that must be carefully separated."
          },
          {
            "type": "heading",
            "text": "The Tension Between Fact and Charter"
          },
          {
            "type": "paragraph",
            "text": "At the heart of the scholarly debate lies a fundamental tension between two ways of understanding the Singwaya narrative. Is it a historical account — a description of things that actually happened — or is it a charter — a narrative designed to explain and legitimise the present social order? The answer, almost certainly, is that it is both. Historical events — migrations, conflicts, the establishment of settlements — have been woven into a narrative structure that serves ongoing social and political purposes. The departure order from Singwaya establishes a hierarchy among the Mijikenda groups. The claim of Digo priority establishes their distinctive status. The incorporation of Islamic motifs reflects the reality of nineteenth-century conversion."
          },
          {
            "type": "paragraph",
            "text": "Scholars will continue to disagree about where the balance lies — how much is recoverable history, how much is retrospective construction. But the debate itself is productive. Each new contribution — whether from archaeology, linguistics, or careful re-reading of oral traditions — adds another layer of understanding to a question that touches on some of the deepest issues in African historiography: how peoples form, how identities are constructed, how the past is used to make sense of the present, and how traditions that seem ancient may be surprisingly young, while others that seem simple may be astonishingly old."
          }
        ],
        "sw": [
          {
            "type": "heading",
            "text": "Swali Lisilokaa"
          },
          {
            "type": "paragraph",
            "text": "Mada chache katika historia ya Afrika Mashariki zimezalisha kutokubaliana kwa kudumu kama swali la asili ya Mijikenda. Je, makundi tisa ya Mijikenda yalihama kutoka makao ya pamoja ya Singwaya? Au yalikua mahali pale pale, katika bara ya pwani ya Kenya? Mjadala umejumuisha mapokeo ya mdomo, ujenzi wa kilugha, uchimbaji wa kiakiolojia, na utafiti wa kumbukumbu za kikoloni."
          },
          {
            "type": "heading",
            "text": "Spear na Msimamo wa Kawaida"
          },
          {
            "type": "paragraph",
            "text": "Thomas T. Spear, katika kitabu chake cha 1978 *The Kaya Complex*, alitoa utetezi wa kina zaidi wa mtazamo wa kawaida. Alisema mapokeo ya Singwaya ni \"nevertheless valid\" kwa Mijikenda, Pokomo, Waswahili, Taita, na Segeju, ambapo ushahidi unaunga mkono ukweli wake wa msingi."
          },
          {
            "type": "paragraph",
            "text": "Morton na Nadharia ya Kupitishwa Baadaye"
          },
          {
            "type": "heading",
            "text": "Rodger F. Morton alipinga msimamo huu mwaka 1972, akidai kwamba Shungwaya \"ni hadithi iliyoongezwa.\" Utafiti wake ulipendekeza mapokeo ya Singwaya yaliingia katika fasihi ya mdomo ya Mijikenda baada ya 1897 tu, yakihusiana na kuongezeka kwa fahamu ya kikabila."
          },
          {
            "type": "paragraph",
            "text": "Ushahidi wa Kilugha"
          },
          {
            "type": "paragraph",
            "text": "Derek Nurse na Thomas Hinnebusch katika *Swahili and Sabaki* (1993) walipendekeza mababu wa Proto-Sabaki walihama kaskazini kupita Mto Juba, ambapo walitofautiana na kuwa Waswahili, Mijikenda, Pokomo, na jamii nyingine. Ujenzi huu unaunga mkono kwa sehemu hadithi ya uhamisho huku ukigumu muda wake."
          },
          {
            "type": "heading",
            "text": "Walsh na Nadharia ya Mahali Pale Pale"
          },
          {
            "type": "paragraph",
            "text": "Martin Walsh alipendekeza kwamba \"Mijikenda walikua katika eneo lile lile wanapopatikana leo.\" Kazi yake juu ya Segeju ilionyesha maneno mengi ya kukopa kutoka lugha ya Kibantu ya Kati ya Kenya, ikimaanisha utambulisho wa Mijikenda unaweza kuwa mchanganyiko."
          },
          {
            "type": "paragraph",
            "text": "Mutoro na Ushahidi wa Kiakiolojia"
          },
          {
            "type": "heading",
            "text": "Henry Mutoro alianzisha ushahidi wa kiakiolojia kupitia uchimbaji katika makaya nane. Matokeo yake — ufinyanzi wa karne ya kumi — yanawezekana kutangulia makazi ya pwani ya Kiswahili na kubadilisha kila msimamo uliokuwepo."
          },
          {
            "type": "paragraph",
            "text": "Mapokeo ya Mdomo kama Maarifa Hai"
          },
          {
            "type": "paragraph",
            "text": "Ufahamu muhimu kutoka mjadala wa kitaaluma ni kutambua kwamba mapokeo ya mdomo si kumbukumbu thabiti. Ni mifumo hai ya maarifa inayojibu hali zinazobadilika. Mvutano kati ya ukweli wa kihistoria na hati ya kijamii unabaki katika kiini cha mjadala."
          },
          {
            "type": "heading",
            "text": "Martin Walsh na Nadharia ya Mahali Pale Pale"
          },
          {
            "type": "paragraph",
            "text": "Labda tathmini kali zaidi ya asili ya Mijikenda imetoka kwa Martin Walsh, ambaye alihitimisha \"that this evidence is insufficient to support the tradition of a northern homeland, and proposing the alternative thesis that the Mijikenda developed in much the same area that they are to be found today.\" Kwa mtazamo wa Walsh, Mijikenda hawakuja kutoka Singwaya. Walikua katika bara ya pwani ya Kenya, wakiendeleza tamaduni zao tofauti, lugha, na shirika la kijamii la makaya katika eneo lile lile wanalokaa sasa. Wanaweza kuwa walipitisha masimulizi ya Singwaya baadaye, wakiikopa kutoka watu wa jirani au kuijenga kwa pamoja kama njia ya kuunda utambulisho wa pamoja."
          },
          {
            "type": "paragraph",
            "text": "Kazi ya Walsh kuhusu watu wa Segeju iliimarisha hoja hii kwa kuonyesha uhusiano wa kilugha usiotarajiwa. Katika \"The Segeju Complex?\" alionyesha kwamba kamusi ya Kimijikenda \"replete with loanwords from a Central Kenya Bantu language once spoken by the Segeju/Daiso.\" Maneno haya yaliyokopwa si madogo — yanashughulikia ufugaji wa mifugo, biashara ya masafa marefu, shirika la kijeshi na kisiasa, na mfumo wa rika, ikiwa ni pamoja na neno la msingi *rika* lenyewe. Ikiwa msamiati wa msingi wa maisha ya kisiasa na kiuchumi ya Kimijikenda ulikopwa kutoka kwa Segeju, basi utambulisho wa Kimijikenda unaweza kuwa mchanganyiko — uliokusanywa kutoka vyanzo vingi, si kutoka asili moja."
          },
          {
            "type": "heading",
            "text": "Henry Mutoro na Ushahidi wa Kiakiolojia"
          },
          {
            "type": "paragraph",
            "text": "Wakati mjadala kuhusu Singwaya ulikuwa umefanywa kupitia mapokeo ya mdomo, kumbukumbu za kikoloni, na ujenzi wa kilugha, Henry Mutoro alianzisha aina mpya ya ushahidi: akiolojia. Katika uchimbaji uliofanywa mwaka 1987 na 1994 katika makaya manane, Mutoro alichimba mabaki ya kimwili ambayo yalitatiza kila msimamo uliokuwepo. Katika Kaya Singwaya, uchimbaji wake \"ulizalisha ufinyanzi wa angalau karne ya kumi,\" na keramiki \"zinazofanana na makazi ya mapema ya pwani ya bahari ya milenia ya kwanza baadaye.\""
          },
          {
            "type": "paragraph",
            "text": "Ushahidi wa tarehe ni muhimu. Ikiwa maeneo ya makaya yalikaliwa mapema karne ya tisa au kumi, yanawezekana kutangulia makazi ya pwani ya Kiswahili — miji ya mawe ya Mombasa, Malindi, na Lamu — ambayo kawaida inachukuliwa kuwa vituo vya kwanza vya miji ya pwani ya Afrika Mashariki. Hii inamaanisha Mijikenda hawakuwa waliochelewa bali wakazi wa mapema ambao makazi yao ya misitu yalitangulia au yaliendelea sambamba na miji ya pwani. Inapinga masimulizi ya kawaida ya uhamiaji na dhana ya enzi ya kikoloni kwamba Mijikenda walikuwa \"watu wa nyikani\" wasio na umuhimu kwa ustaarabu wa kisasa wa pwani."
          },
          {
            "type": "heading",
            "text": "Utata wa Tarehe"
          },
          {
            "type": "paragraph",
            "text": "Swali la lini makaya yalianzishwa linabaki kuwa moja ya masuala yanayopingwa zaidi katika uwanja huu. Upana wa tarehe zinazopendekezwa ni wa kushangaza: wasomi wengine wanaweka kuanzishwa kwa makaya katika karne ya kumi na sita, kulingana na uhamiaji wa kipindi cha mwisho kutoka Singwaya, wakati ushahidi wa kiakiolojia wa Mutoro unasukuma tarehe nyuma hadi angalau karne ya tisa au kumi. Pengo hili la karne sita au saba si tofauti ndogo. Ikiwa makaya ni misingi ya karne ya kumi na sita, masimulizi ya kawaida ya uhamiaji yanawezekana. Ikiwa ni misingi ya karne ya tisa, masimulizi ya kuruka ghafla kusini kutokana na uvamizi wa Waoromo yanakuwa vigumu kudumisha."
          },
          {
            "type": "heading",
            "text": "Mapokeo ya Mdomo kama Maarifa Yanayobadilika"
          },
          {
            "type": "paragraph",
            "text": "Moja ya ufahamu muhimu zaidi kutoka mjadala wa kitaaluma ni kutambua kwamba mapokeo ya mdomo si kumbukumbu thabiti. Ni mifumo hai ya maarifa inayojibu hali zinazobadilika. Thomas Spear mwenyewe alitambua hili katika kazi yake, hata alipokuwa akitetea kiini cha kihistoria cha mapokeo ya Singwaya. Morton alionyesha kwa kuonyesha jinsi mapokeo hayo yanaweza kuingia katika fasihi ya mdomo ya Kimijikenda kwa wakati maalum wa kihistoria. Walsh alipeleka hoja mbali zaidi kwa kupendekeza kwamba mapokeo hayo yanaweza kuwa masimulizi yaliyopitishwa kabisa — hadithi iliyokopwa kutumikia mahitaji ya kisasa."
          },
          {
            "type": "paragraph",
            "text": "Hakuna kitu kati ya haya kinachopunguza thamani ya mapokeo ya mdomo. Inamaanisha kwamba mapokeo ya mdomo lazima yasomwe kwa usahihi ule ule wa kina unaotumika kwa chanzo chochote cha kihistoria. Hati ya kikoloni haichukuliwi kwa thamani ya uso; inachunguzwa kwa upendeleo wake, muktadha wake, na madhumuni yake. Mapokeo ya mdomo yanastahili heshima ile ile — na uchunguzi ule ule. Yanabeba habari za kweli za kihistoria, lakini habari hiyo imefungwa katika tabaka za tafsiri, mabadiliko, na madhumuni ya kitamaduni ambayo lazima yatenganishwe kwa uangalifu."
          },
          {
            "type": "heading",
            "text": "Mvutano Kati ya Ukweli na Hati"
          },
          {
            "type": "paragraph",
            "text": "Katika moyo wa mjadala wa kitaaluma kuna mvutano wa msingi kati ya njia mbili za kuelewa masimulizi ya Singwaya. Je, ni akaunti ya kihistoria — maelezo ya mambo yaliyotokea kweli — au ni hati — masimulizi yaliyoundwa kuelezea na kuhalalisha mpangilio wa sasa wa kijamii? Jibu, karibu hakika, ni kwamba ni vyote viwili. Matukio ya kihistoria — uhamisho, migogoro, uanzishwaji wa makazi — yamefumwa katika muundo wa masimulizi unaotumikia madhumuni ya kijamii na kisiasa yanayoendelea. Mpangilio wa kuondoka kutoka Singwaya unaanzisha daraja miongoni mwa makundi ya Kimijikenda. Madai ya kipaumbele cha Wadigo yanaanzisha hadhi yao tofauti. Kuingizwa kwa motifs za Kiislamu kunaonyesha ukweli wa ubadilishaji wa karne ya kumi na tisa."
          },
          {
            "type": "paragraph",
            "text": "Wasomi wataendelea kutokubaliana kuhusu usawa upo wapi — kiasi gani ni historia inayoweza kupatikana tena, kiasi gani ni ujenzi wa baadaye. Lakini mjadala wenyewe ni wenye tija. Kila mchango mpya — iwe kutoka akiolojia, lugha, au kusomwa upya kwa uangalifu kwa mapokeo ya mdomo — unaongeza tabaka nyingine ya uelewa kwa swali linalogusa masuala ya kina zaidi katika historia ya Afrika: jinsi watu wanavyoundwa, jinsi utambulisho unavyojengwa, jinsi zamani zinavyotumiwa kuelewa sasa, na jinsi mapokeo yanayoonekana ya zamani yanaweza kuwa ya vijana kwa kushangaza, wakati mengine yanayoonekana rahisi yanaweza kuwa ya zamani kwa kushangaza."
          }
        ],
        "dig": [
          {
            "type": "heading",
            "text": "Swali Risiro Kala"
          },
          {
            "type": "paragraph",
            "text": "Mada chache kpwa historia ya Afrika Mashariki zimezalisha kutokubaliana kpwa kudumu dza swali ra asili ya Amijikenda. Dze, makundi tisa ga Amijikenda garihamia kula makalo ga phamwenga ga Singwaya? Au garikula phatu phapho, kpwa bara ya ph'wani ya Kenya? Mjadala umejumuisha mapokeo ga mdomo, ujenzi wa chilugha, uchimbaji wa chiakiolojia, na utafiti wa kumbukumbu za chikoloni."
          },
          {
            "type": "heading",
            "text": "Spear na Msimamo wa Kawaida"
          },
          {
            "type": "paragraph",
            "text": "Thomas T. Spear, kpwa chitabu chakpwe cha 1978 *The Kaya Complex*, aritoa utetezi wa china zaidi wa mtazamo wa kawaida. Arisema mapokeo ga Singwaya ni ga kpweli kpwa Amijikenda, Apokomo, Aswahili, Ataita, na Asegeju, ambapho ushahidi unaunga mkono ukpweli wakpwe wa msingi."
          },
          {
            "type": "paragraph",
            "text": "Morton na Nadharia ya Kupishishwa Badaye"
          },
          {
            "type": "heading",
            "text": "Rodger F. Morton aripinga msimamo uwo mwaka 1972, akidai kukala Shungwaya \"ni hadithi iriyoongezwa.\" Utafiti wakpwe uripendekeza mapokeo ga Singwaya gariinjira kpwa fasihi ya mdomo ya Amijikenda bada ya 1897 tu, gakihusiana na kuongezeka kpwa fahamu ya chikabila."
          },
          {
            "type": "paragraph",
            "text": "Ushahidi wa Chilugha"
          },
          {
            "type": "paragraph",
            "text": "Derek Nurse na Thomas Hinnebusch kpwa *Swahili and Sabaki* (1993) aripendekeza akare a Proto-Sabaki arihamia kaskazini kupishira Muho wa Juba, ambapho aritofautiana na kukala Aswahili, Amijikenda, Apokomo, na jamii zinjine. Ujenzi uwo unaunga mkono kpwa sehemu hadithi ya uhamisho na wakati uwo uwo unagumisha muda wakpwe."
          },
          {
            "type": "heading",
            "text": "Walsh na Nadharia ya Phatu Phapho"
          },
          {
            "type": "paragraph",
            "text": "Martin Walsh aripendekeza kukala \"Amijikenda arikula kpwa eneo rire rire anaphphopatikana rero.\" Kazi yakpwe dzulu ya Asegeju irionyesha maneno manji ga kukopa kula lugha ya Chibantu ya Kahi ya Kenya, ikimaanisha utambulisho wa Amijikenda unaweza kukala mchanganyiko."
          },
          {
            "type": "paragraph",
            "text": "Mutoro na Ushahidi wa Chiakiolojia"
          },
          {
            "type": "heading",
            "text": "Henry Mutoro arianzisha ushahidi wa chiakiolojia kupishira uchimbaji kpwa makaya manane. Matokeo gakpwe — ufinyanzi wa karne ya kumi — ganawezekana kutangulia makazi ga ph'wani ya Chiswahili na kubadilisha chila msimamo uriokpwale upo."
          },
          {
            "type": "paragraph",
            "text": "Mapokeo ga Mdomo dza Maarifa ga Uhai"
          },
          {
            "type": "paragraph",
            "text": "Ufahamu muhimu kula mjadala wa chitaaluma ni kutambua kukala mapokeo ga mdomo si kumbukumbu thabiti. Ni mifumo ya uhai ya maarifa inayodzibu hali zinazobadilika. Mvutano kahi ya ukpweli wa chihistoria na hati ya chijamii unasala kpwa chiini cha mjadala."
          },
          {
            "type": "heading",
            "text": "Martin Walsh na Nadharia ya Phatu Phapho"
          },
          {
            "type": "paragraph",
            "text": "Labda tathmini kali zaidi ya asili ya Amijikenda imetoka kpwa Martin Walsh, ariyehitimisha \"that this evidence is insufficient to support the tradition of a northern homeland, and proposing the alternative thesis that the Mijikenda developed in much the same area that they are to be found today.\" Kpwa mtazamo wa Walsh, Amijikenda taatoka Singwaya. Arikula kpwa bara ya ph'wani ya Kenya, akiendereza chimila zao tofauti, lugha, na shirika ra chijamii ra makaya kpwa eneo rire rire anaphokala rero. Anaweza kukala aripishisha masimulizi ga Singwaya badaye, akiikopa kula atu a phephi au kuijenga kpwa phamwenga dza njira ya kuunda utambulisho wa phamwenga."
          },
          {
            "type": "paragraph",
            "text": "Kazi ya Walsh kuhusu atu a Segeju irimarisha hoja iyo kpwa kuonyesha uhusiano wa chilugha usiokuwa unatarajiwa. Kpwa \"The Segeju Complex?\" arionyesha kukala kamusi ya Chimijikenda ni \"replete with loanwords from a Central Kenya Bantu language once spoken by the Segeju/Daiso.\" Maneno gago garigokopwa si madogo — ganashughulikia ufugaji wa mifugo, chibiashara ya masafa mare, shirika ra chiashi na chisiasa, na mfumo wa rika, kujumuisha neno ra msingi *rika* renye. Ikala msamiati wa msingi wa maisha ga chisiasa na chiuchumi ga Chimijikenda urikopwa kula kpwa Asegeju, phapho utambulisho wa Chimijikenda unaweza kukala mchanganyiko — uriokusanywa kula vyanzo vinji, si kula asili mwenga."
          },
          {
            "type": "heading",
            "text": "Henry Mutoro na Ushahidi wa Chiakiolojia"
          },
          {
            "type": "paragraph",
            "text": "Wakati mjadala kuhusu Singwaya ukala umehendwa kupitshi mapokeo ga mdomo, kumbukumbu za chikoloni, na ujenzi wa chilugha, Henry Mutoro arianzisha aina mpya ya ushahidi: chiakiolojia. Kpwa uchimbaji uriohendwa mwaka 1987 na 1994 kpwa makaya manane, Mutoro arichimba mabaki ga chimwili ambago garitatiza chila msimamo uriokuwepo. Kpwa Kaya Singwaya, uchimbaji wakpwe \"urizalisha ufinyanzi wa angalau karne ya kumi,\" na keramiki \"zinazofanana na makazi ga mapema ga ph'wani ya bahari ya milenia ya kpwandza badaye.\""
          },
          {
            "type": "paragraph",
            "text": "Ushahidi wa tarehe ni muhimu. Ikala maeneo ga makaya garikaliwa mapema karne ya tisa au kumi, ganawezekana kutangulia makazi ga ph'wani ya Chiswahili — midzi ya mawe ya Mombasa, Malindi, na Lamu — ambayo kawaida inachukuliwa dza vituo vya kpwandza vya midzi ya ph'wani ya Afrika Mashariki. Hiri rinamaanisha Amijikenda taakala ariochelewa ela akazi a mapema ambao makazi gao ga misitu garitangulia au garienderera sambamba na midzi ya ph'wani. Inapinga masimulizi ga kawaida ga uhamisho na dhana ya enzi ya chikoloni kukala Amijikenda akala \"atu a nyikani\" asio na umuhimu kpwa ustaarabu wa kisasa wa ph'wani."
          },
          {
            "type": "heading",
            "text": "Utata wa Tarehe"
          },
          {
            "type": "paragraph",
            "text": "Swali ra rini makaya garianzishwa rinasala kukala mwenga wa mambo ganago pingwa zaidi kpwa uwanja uwo. Uphana wa tarehe zinazopendekezwa ni wa kushangaza: asomi anjine anaweka kuanzishwa kpwa makaya kpwa karne ya kumi na sita, kulingana na uhamisho wa kipindi cha mwisho kula Singwaya, wakati ushahidi wa chiakiolojia wa Mutoro unasukuma tarehe nyuma hadi angalau karne ya tisa au kumi. Pengo riro ra karne sita au saba si tofauti ndogo. Ikala makaya ni misingi ya karne ya kumi na sita, masimulizi ga kawaida ga uhamisho ganawezekana. Ikala ni misingi ya karne ya tisa, masimulizi ga kuruka gafla kusini kutokana na uvamizi wa Aoromo ganakala vigumu kudumisha."
          },
          {
            "type": "heading",
            "text": "Mapokeo ga Mdomo Dza Marifwa Ganagobadilika"
          },
          {
            "type": "paragraph",
            "text": "Mwenga wa ufahamu muhimu zaidi kula mjadala wa chitaaluma ni kutambua kukala mapokeo ga mdomo si kumbukumbu thabiti. Ni mifumo ya uhai ya marifwa inayodzibu hali zinazobadilika. Thomas Spear mwenye aritambua hiri kpwa kazi yakpwe, hata ariphokuwa akitetea chiini cha chihistoria cha mapokeo ga Singwaya. Morton arionyesha kpwa kuonyesha jinsi mapokeo gago ganaweza kuinjira kpwa fasihi ya mdomo ya Chimijikenda kpwa wakati maalum wa chihistoria. Walsh aripeleka hoja mbali zaidi kpwa kupendekeza kukala mapokeo gago ganaweza kukala masimulizi garigopishishwa kabisa — hadithi iriyokopwa kutumikia mahitaji ga kisasa."
          },
          {
            "type": "paragraph",
            "text": "Takuna chitu kahi ya higa chinachopunguza thamani ya mapokeo ga mdomo. Inamaanisha kukala mapokeo ga mdomo lazima gasomwe kpwa usahihi uwo uwo wa china unaohumika kpwa chanzo chochosi cha chihistoria. Hati ya chikoloni taichukuliwa kpwa thamani ya uso; inachunguzwa kpwa upendeleo wakpwe, muktadha wakpwe, na madhumuni gakpwe. Mapokeo ga mdomo ganastahili ishima iyo iyo — na uchunguzi uwo uwo. Ganatsukula habari za kpweli za chihistoria, ela habari iyo imefungwa kpwa tabaka za tafsiri, mabadiliko, na madhumuni ga chimila ambago lazima gatenganishwe kpwa uangalifu."
          },
          {
            "type": "heading",
            "text": "Mvutano Kahi ya Ukpweli na Hati"
          },
          {
            "type": "paragraph",
            "text": "Kpwa moyo wa mjadala wa chitaaluma kuna mvutano wa msingi kahi ya njira mbiri za kuelewa masimulizi ga Singwaya. Dze, ni akaunti ya chihistoria — maelezo ga mambo garigohenderera kpweli — au ni hati — masimulizi garigoundwa kuelezea na kuhalalisha mpangilio wa rero wa chijamii? Dzibu, phephi na hakika, ni kukala ni gosi mairi. Matukio ga chihistoria — uhamisho, migogoro, uanzishwaji wa makazi — gamefumwa kpwa muundo wa masimulizi unaohumikia madhumuni ga chijamii na chisiasa ganago enderera. Mpangilio wa kuuka kula Singwaya unaanzisha daraja kahi ya makundi ga Chimijikenda. Madai ga uphephi ga Adigo ganaanzisha hadhi yao tofauti. Kuingizwa kpwa motifs za Chiislamu kunaonyesha ukpweli wa kubadilika kpwa karne ya kumi na tisiya."
          },
          {
            "type": "paragraph",
            "text": "Asomi andaenderera kutokubaliana kuhusu usawa upo aphi — kiasi gani ni historia inayoweza kupatikana luphya, kiasi gani ni ujenzi wa badaye. Ela mjadala wenye ni wenye tija. Chila mchango mpya — ikale kula chiakiolojia, chilugha, au kusomwa luphya kpwa uangalifu kpwa mapokeo ga mdomo — unaongeza tabaka yanjina ya uelewa kpwa swali rinago gusa mambo ga china zaidi kpwa historia ya Afrika: jinsi atu anavyoundwa, jinsi utambulisho unavyojengwa, jinsi kare zinavyohumika kuelewa rero, na jinsi mapokeo ganago onekana ga kare ganaweza kukala ga avyanache kpwa kushangaza, wakati ganjina ganago onekana rahisi ganaweza kukala ga kare kpwa kushangaza."
          }
        ]
      }
    },
    {
      "slug": "singwaya",
      "title": {
        "en": "The Singwaya Migration",
        "sw": "Safari ya Singwaya",
        "dig": "Safari ya Singwaya"
      },
      "intro": {
        "en": "Somewhere north of the Tana River, in the arid lowlands of what is now southern Somalia, there once existed a settlement called Singwaya. The name appears across the oral traditions of more than half…",
        "sw": "Mahali fulani kaskazini ya Mto Tana, katika nyanda za chini za sehemu ya kusini ya Somalia ya leo, kuliwahi kuwepo makao yaliyoitwa Singwaya. Jina hili linaonekana katika mapokeo ya mdomo ya zaidi ya…",
        "dig": "Phatu fulani kaskazini ya Muho wa Tana, kpwa nyanda za phahi za sehemu ya kusini ya Somalia ya rero, kurikala na makalo garigohiwa Singwaya. Dzina riri rinaonekana kpwa mapokeo ga mdomo ga zaidi ya…"
      },
      "body": {
        "en": [
          {
            "type": "heading",
            "text": "A City Before the Scattering"
          },
          {
            "type": "paragraph",
            "text": "Somewhere north of the Tana River, in the arid lowlands of what is now southern Somalia, there once existed a settlement called Singwaya. The name appears across the oral traditions of more than half a dozen Bantu-speaking peoples of the East African coast — the Mijikenda, the Pokomo, the Swahili, the Taita, the Segeju, and others — each claiming it as an ancestral homeland, a place where their forebears lived together before forces beyond their control sent them south. Singwaya was, by these accounts, a multi-ethnic centre of considerable size, sustained by trade networks and inhabited by speakers of related Sabaki Bantu languages. It was not a single tribe's capital but a shared space, a city of many peoples — and when it fell, its scattering seeded communities across hundreds of kilometres of coastline."
          },
          {
            "type": "heading",
            "text": "The Oromo Invasions"
          },
          {
            "type": "paragraph",
            "text": "The event that shattered Singwaya, according to the shared tradition, was invasion by Cushitic-speaking Oromo peoples — referred to in older accounts as \"Galla.\" The invasions are dated broadly to between the twelfth and seventeenth centuries, a range that reflects both the imprecision of oral chronology and the likelihood that the displacement happened not as a single catastrophic event but as a sustained pressure over generations. One vivid version of the story attributes the trigger to a specific incident: a Mijikenda youth killed an Oromo tribesman, and when the Mijikenda community refused to pay blood compensation, war followed. Whether or not this incident is historical, it functions narratively as a moral explanation — the departure from Singwaya was not random but consequential, the result of a breach in the social contract between neighbouring peoples."
          },
          {
            "type": "heading",
            "text": "The Digo Claim: First to Leave"
          },
          {
            "type": "paragraph",
            "text": "Within the broader Mijikenda tradition of departure from Singwaya, each group has its own account of when and how it left. The Digo claim is distinctive and politically significant: they assert that they were the first to leave. The departure order is typically given as Digo first, then Ribe, Giriama, Chonyi, and Jibana. Digo traditions describe their ancestors as \"the first people to face off against the Oromo invasion,\" fleeing south to the Shimba Hills where they established Kaya Kwale, the founding kaya of the Digo people."
          },
          {
            "type": "paragraph",
            "text": "This claim of priority is not merely a point of historical pride. In the logic of Mijikenda social organisation, the order of departure from Singwaya establishes a hierarchy of seniority. To have left first is to have acted first, to have faced the enemy first, to have founded a new civilisation first. The Digo's assertion of primacy underwrites their claim to a distinctive political and ritual status among the nine Mijikenda peoples — a status that is reinforced by their geographical separation (south of Mombasa, while all other groups settled to its north), their unique matrilineal kinship system, and their near-universal adherence to Islam."
          },
          {
            "type": "heading",
            "text": "A Charter, Not Merely a Record"
          },
          {
            "type": "paragraph",
            "text": "Anthropologists and historians draw a useful distinction between a \"history\" in the Western academic sense — a recoverable sequence of events — and a \"charter myth,\" which is a narrative that explains and legitimises the present social order. The Singwaya tradition functions as both, and its power lies precisely in its dual nature. It is a historical claim — something happened, somewhere, that sent these peoples south. It is also a charter — its details are arranged not to satisfy a modern historian's demand for precision but to establish who is senior, who has rights, and how the present order of things came to be."
          },
          {
            "type": "paragraph",
            "text": "To call the Singwaya narrative a \"charter myth\" is not to dismiss it as fiction. Oral traditions are not transcripts of events. They are living documents, constantly retold, constantly adapted, carrying within them layers of meaning accumulated over centuries. The Singwaya tradition has survived because it continues to do cultural work — it binds the nine Mijikenda groups together as kin while simultaneously allowing each group to assert its own particular status through the details of its own departure story."
          },
          {
            "type": "heading",
            "text": "The Islamic Entanglement"
          },
          {
            "type": "paragraph",
            "text": "What makes the Digo version of the Singwaya narrative especially complex is its deep entanglement with Islamic identity. As the Digo converted to Islam from the early nineteenth century onward — through contact with Muslim traders, through the teachings of Muslim healers, through the desire for access to trade networks controlled by Muslim communities — their origin story began to absorb Islamic elements. Scholars have documented how Digo accounts of the Singwaya migration \"frequently incorporate motifs of ethnic primacy, portraying Digo forebears as bearers of superior Islamic-influenced lineages or earlier access to coastal resources.\""
          },
          {
            "type": "paragraph",
            "text": "This process of Islamisation of the origin narrative is captured in the title of a significant academic paper: \"'Singwaya was a mere small station': Islamization and ethnic primacy in Digo oral traditions of origin and migration.\" The title quotes a Digo informant who diminished the importance of Singwaya itself — the shared, pre-Islamic homeland — in favour of a narrative that emphasised the Digo's earlier and deeper connections to Islam and the coast. In this retelling, Singwaya is not the great ancestral city but a \"mere small station\" on a longer journey that had its true origins in a more prestigious, Islamically inflected past."
          },
          {
            "type": "heading",
            "text": "The Scholarly Landscape"
          },
          {
            "type": "paragraph",
            "text": "The question of whether Singwaya was a real place, and whether a migration actually occurred, has been debated by scholars for over a century. Thomas T. Spear, in his 1978 work *The Kaya Complex*, offered the most detailed defence of the orthodox view: that while some earlier interpretations were unsustainable, the Singwaya tradition is \"nevertheless valid for the Mijikenda, Pokomo, Swahili, Taita, and Segeju, where such evidence supports its basic veracity.\" Spear treated the tradition as substantially historical — a genuine migration from a genuine place."
          },
          {
            "type": "paragraph",
            "text": "Rodger F. Morton challenged this position in 1972, arguing in the *International Journal of African Historical Studies* that Shungwaya \"is actually an appended myth.\" Morton's research suggested that \"coastal traditions recorded prior to 1897 indicate that the Shungwaya tradition entered Miji Kenda oral literature only after this date\" — meaning the tradition might be barely a century old, emerging around 1897 in connection with rising ethnic consciousness. If Morton is correct, the Singwaya narrative is not an ancient memory but a relatively recent construction, adopted by the Mijikenda as they began to forge a collective identity in the late colonial period."
          },
          {
            "type": "heading",
            "text": "Linguistic Evidence and Its Limits"
          },
          {
            "type": "paragraph",
            "text": "Derek Nurse and Thomas Hinnebusch brought linguistic analysis to bear on the question in their 1993 work *Swahili and Sabaki: A Linguistic History*. They proposed that Proto-Northeast-Coastal Bantu ancestors appeared between the Wami and Rufiji rivers around the first millennium AD, and that Proto-Sabaki speakers subsequently \"migrated northwards across the Juba River to a location associated with the legendary Shungwaya,\" where they diversified into Swahili, Mijikenda, Pokomo, Elwana, and Comorian communities. This linguistic reconstruction partially supports the migration narrative — it places ancestral Sabaki speakers in a northern location before a southward dispersal — while complicating the timeline significantly. Hinnebusch himself had earlier critiqued Spear's use of linguistic data, noting that Spear \"could not confirm Shungwaya as a linguistic homeland because he misunderstood the data.\""
          },
          {
            "type": "heading",
            "text": "The Alternative Thesis"
          },
          {
            "type": "paragraph",
            "text": "Martin Walsh offered perhaps the most radical reappraisal, \"concluding that this evidence is insufficient to support the tradition of a northern homeland, and proposing the alternative thesis that the Mijikenda developed in much the same area that they are to be found today.\" In Walsh's reading, the Mijikenda did not migrate from Singwaya at all. They evolved in situ, in the coastal hinterland of Kenya, and adopted the Singwaya narrative later as a means of forging shared ethnic identity — a charter borrowed rather than inherited."
          },
          {
            "type": "paragraph",
            "text": "Walsh's work on the Segeju added another layer of complexity. He demonstrated that the Mijikenda lexicon contains substantial loanwords from a Central Kenya Bantu language once spoken by the Segeju or Daiso. These borrowings cover livestock production, long-distance trading, military and political organisation, and the age-set system — including the word *rika* itself. This suggests the Segeju \"left a legacy of political organization and ritual practice that contributed significantly to the precolonial making of the Mijikenda.\" The Mijikenda social order, in other words, may owe as much to the Segeju as it does to Singwaya."
          },
          {
            "type": "heading",
            "text": "What Archaeology Says"
          },
          {
            "type": "paragraph",
            "text": "Henry Mutoro's archaeological excavations at kaya sites in 1987 and 1994 introduced material evidence into a debate that had been conducted almost entirely through oral traditions and linguistic analysis. At Kaya Singwaya — a site whose very name invokes the origin narrative — Mutoro's excavations \"yielded pottery going back to at least the tenth century,\" with ceramics \"characteristic of early coastal littoral settlements of the later first millennium AD.\" Some archaeologists have suggested that kayas may have been established as early as the ninth century, potentially predating the Swahili coastal settlements that are often treated as the region's oldest urban centres. If the kayas are that old, the simple migration narrative — a sudden flight from Singwaya, a fresh start in the hills — becomes harder to sustain. These were not refugee camps. They were established, long-occupied settlements with their own material culture."
          },
          {
            "type": "heading",
            "text": "A Living Tradition"
          },
          {
            "type": "paragraph",
            "text": "The Singwaya narrative is not a fossil. It continues to evolve, continues to be told, continues to do cultural work in Digo and Mijikenda communities. Each retelling adjusts the emphasis — sometimes stressing the unity of the nine peoples, sometimes stressing the Digo's priority, sometimes incorporating Islamic prestige, sometimes pushing back against it. The scholars will continue to debate whether Singwaya was a real city, a regional designation, or a retrospective invention. But for the Digo, the narrative is not primarily a historical hypothesis to be tested. It is a living charter — a story that explains who they are, where they came from, why they have the rights and responsibilities they have, and how they relate to their eight sibling peoples along the coast."
          },
          {
            "type": "paragraph",
            "text": "What remains constant across all versions of the tradition, scholarly and popular alike, is the image of departure — a people leaving a place that can no longer hold them, walking south through hostile territory, carrying with them the knowledge of how to build a new home in a new forest on a new hill. That image is the heart of the Singwaya narrative, and no amount of academic debate about dates and locations can diminish its power."
          }
        ],
        "sw": [
          {
            "type": "heading",
            "text": "Mji Kabla ya Kutawanyika"
          },
          {
            "type": "paragraph",
            "text": "Mahali fulani kaskazini ya Mto Tana, katika nyanda za chini za sehemu ya kusini ya Somalia ya leo, kuliwahi kuwepo makao yaliyoitwa Singwaya. Jina hili linaonekana katika mapokeo ya mdomo ya zaidi ya makabila sita ya Kibantu ya pwani ya Afrika Mashariki — Mijikenda, Pokomo, Waswahili, Taita, Segeju, na wengine — kila moja likidai kuwa nyumba ya mababu. Singwaya ilikuwa, kwa masimulizi haya, kituo cha makabila mengi chenye ukubwa wa kutosha, kilichodumishwa na mitandao ya biashara."
          },
          {
            "type": "heading",
            "text": "Uvamizi wa Waoromo"
          },
          {
            "type": "paragraph",
            "text": "Tukio lililovunja Singwaya, kulingana na mapokeo yanayoshirikiwa, lilikuwa uvamizi wa watu wa Kioromo. Uvamizi huo unahusishwa kwa upana na kati ya karne ya kumi na mbili na kumi na saba. Toleo moja la hadithi linaelezea kwamba kijana wa Kimijikenda alimuua mtu wa Kioromo, na jamii ya Kimijikenda ilipokataa kulipa fidia ya damu, vita vilifuata."
          },
          {
            "type": "heading",
            "text": "Madai ya Adigo: Wa Kwanza Kuondoka"
          },
          {
            "type": "paragraph",
            "text": "Adigo wanadai kuwa wa kwanza kuondoka Singwaya, wakielekea kusini hadi Milima ya Shimba ambapo walianzisha Kaya Kwale. Madai haya ya kipaumbele si tu jambo la kiburi la kihistoria. Katika mantiki ya shirika la kijamii la Kimijikenda, mpangilio wa kuondoka unaanzisha uongozi wa ukuu."
          },
          {
            "type": "paragraph",
            "text": "Hati ya Makubaliano, Si Rekodi Tu"
          },
          {
            "type": "heading",
            "text": "Mapokeo ya Singwaya yanafanya kazi kama historia na kama hati ya kijamii. Kuiita \"hati ya hadithi\" si kuipuuza kama uwongo. Mapokeo ya mdomo ni hati hai, zinazoendelea kusimuliwa na kubadilishwa, zikibeba ndani yake tabaka za maana zilizokusanywa kwa karne nyingi."
          },
          {
            "type": "paragraph",
            "text": "Kuchanganyika na Uislamu"
          },
          {
            "type": "paragraph",
            "text": "Kipengele cha pekee cha toleo la Adigo ni kuchanganyika kwake na utambulisho wa Kiislamu. Adigo walipoanza kuingia Uislamu, hadithi yao ya asili ilianza kuingiza vipengele vya Kiislamu. Karatasi muhimu ya kielimu inakamata mchakato huu kwa kichwa chake: \"'Singwaya was a mere small station.'\""
          },
          {
            "type": "heading",
            "text": "Mtazamo wa Kitaaluma"
          },
          {
            "type": "paragraph",
            "text": "Swali la iwapo Singwaya ilikuwa mahali halisi limejadiliwa na wasomi kwa zaidi ya karne moja. Spear alitetea mtazamo wa kawaida, Morton alipinga, na Walsh alipendekeza kwamba Mijikenda walikua katika eneo lile lile wanapokaa leo na kupitisha masimulizi ya Singwaya baadaye. Uchimbaji wa Mutoro ulileta ushahidi wa kimwili kwenye mjadala, ukipata ufinyanzi wa karne ya kumi kwenye maeneo ya makaya."
          },
          {
            "type": "paragraph",
            "text": "Mapokeo Hai"
          },
          {
            "type": "heading",
            "text": "Masimulizi ya Singwaya si visukuku. Yanaendelea kubadilika, yanaendelea kusimuliwa, yanaendelea kufanya kazi ya kitamaduni katika jamii za Adigo na Amijikenda. Kwa Adigo, masimulizi hayo si hasa dhana ya kihistoria ya kupimwa. Ni hati hai — hadithi inayoelezea wao ni nani na walikotoka."
          },
          {
            "type": "paragraph",
            "text": "Swali la iwapo Singwaya ilikuwa mahali halisi, na iwapo uhamisho ulitokea kweli, limejadiliwa na wasomi kwa zaidi ya karne moja. Thomas T. Spear, katika kazi yake ya 1978 *The Kaya Complex*, alitoa utetezi wa kina zaidi wa mtazamo wa kawaida: kwamba ingawa baadhi ya tafsiri za mapema hazikuweza kudumishwa, mapokeo ya Singwaya ni \"nevertheless valid for the Mijikenda, Pokomo, Swahili, Taita, and Segeju, where such evidence supports its basic veracity.\" Spear aliichukulia mapokeo kama ya kihistoria kwa kiasi kikubwa — uhamisho wa kweli kutoka mahali halisi."
          },
          {
            "type": "paragraph",
            "text": "Rodger F. Morton alipinga msimamo huu mwaka 1972, akisema katika *International Journal of African Historical Studies* kwamba Shungwaya \"is actually an appended myth.\" Utafiti wa Morton ulipendekeza kwamba \"coastal traditions recorded prior to 1897 indicate that the Shungwaya tradition entered Miji Kenda oral literature only after this date\" — ikimaanisha mapokeo yanaweza kuwa na umri wa karne moja tu, yakiibuka karibu 1897 yakihusiana na kuongezeka kwa fahamu ya kikabila. Ikiwa Morton yuko sahihi, masimulizi ya Singwaya si kumbukumbu ya zamani bali ujenzi wa hivi karibuni, uliopitishwa na Wamijikenda walipokuwa wakiunda utambulisho wa pamoja katika kipindi cha mwisho cha ukoloni."
          },
          {
            "type": "heading",
            "text": "Ushahidi wa Kilugha na Mipaka Yake"
          },
          {
            "type": "paragraph",
            "text": "Derek Nurse na Thomas Hinnebusch walileta uchambuzi wa kilugha kwenye swali hili katika kazi yao ya 1993 *Swahili and Sabaki: A Linguistic History*. Walipendekeza kwamba mababu wa Proto-Northeast-Coastal Bantu walionekana kati ya mito ya Wami na Rufiji karibu milenia ya kwanza AD, na kwamba wazungumzaji wa Proto-Sabaki baadaye \"migrated northwards across the Juba River to a location associated with the legendary Shungwaya,\" ambapo walitofautiana na kuwa jamii za Kiswahili, Kimijikenda, Kipokomo, Kielwana, na Kicomorian. Ujenzi huu wa kilugha unaunga mkono kwa sehemu masimulizi ya uhamisho — unaweka wazungumzaji wa Kisabaki wa zamani katika eneo la kaskazini kabla ya kutawanyika kusini — huku ukitatiza ratiba kwa kiasi kikubwa. Hinnebusch mwenyewe alikuwa amekosoa mapema matumizi ya Spear ya data za kilugha, akibainisha kwamba Spear \"could not confirm Shungwaya as a linguistic homeland because he misunderstood the data.\""
          },
          {
            "type": "heading",
            "text": "Nadharia Mbadala"
          },
          {
            "type": "paragraph",
            "text": "Martin Walsh alitoa labda tathmini kali zaidi, \"concluding that this evidence is insufficient to support the tradition of a northern homeland, and proposing the alternative thesis that the Mijikenda developed in much the same area that they are to be found today.\" Kwa mtazamo wa Walsh, Mijikenda hawakuhama kutoka Singwaya hata kidogo. Walikua mahali pale pale, katika bara ya pwani ya Kenya, na kupitisha masimulizi ya Singwaya baadaye kama njia ya kuunda utambulisho wa pamoja wa kikabila — hati iliyokopwa badala ya kurithiwa."
          },
          {
            "type": "paragraph",
            "text": "Kazi ya Walsh kuhusu Segeju iliongeza tabaka nyingine ya ugumu. Alionyesha kwamba kamusi ya Kimijikenda ina maneno mengi yaliyokopwa kutoka lugha ya Kibantu ya Kati ya Kenya iliyozungumzwa na Segeju au Daiso. Maneno haya yaliyokopwa yanashughulikia ufugaji wa mifugo, biashara ya masafa marefu, shirika la kijeshi na kisiasa, na mfumo wa rika — ikiwa ni pamoja na neno *rika* lenyewe. Hii inapendekeza Segeju \"left a legacy of political organization and ritual practice that contributed significantly to the precolonial making of the Mijikenda.\" Mpangilio wa kijamii wa Kimijikenda, kwa maneno mengine, unaweza kuwa na deni kubwa kwa Segeju kama inavyokuwa na Singwaya."
          },
          {
            "type": "heading",
            "text": "Akiolojia Inasema Nini"
          },
          {
            "type": "paragraph",
            "text": "Uchimbaji wa kiakiolojia wa Henry Mutoro katika maeneo ya makaya mwaka 1987 na 1994 ulianzisha ushahidi wa kimwili katika mjadala uliokuwa ukifanywa karibu kabisa kupitia mapokeo ya mdomo na uchambuzi wa kilugha. Katika Kaya Singwaya — eneo ambalo jina lake lenyewe linaiita masimulizi ya asili — uchimbaji wa Mutoro \"ulizalisha ufinyanzi wa angalau karne ya kumi,\" na keramiki \"zinazofanana na makazi ya mapema ya pwani ya bahari ya milenia ya kwanza baadaye.\" Wanaakiolojia wengine wamependekeza kwamba makaya yanaweza kuanzishwa mapema karne ya tisa, yakiwezekana kutangulia makazi ya pwani ya Kiswahili. Ikiwa makaya ni ya zamani hivyo, masimulizi rahisi ya uhamisho — kuruka kwa ghafla kutoka Singwaya, mwanzo mpya katika milima — yanakuwa magumu kudumisha. Haya hayakuwa kambi za wakimbizi. Yalikuwa makazi yaliyoanzishwa, yaliyokaliwa kwa muda mrefu yenye utamaduni wao wa kimwili."
          },
          {
            "type": "heading",
            "text": "Mapokeo Hai"
          },
          {
            "type": "paragraph",
            "text": "Masimulizi ya Singwaya si visukuku. Yanaendelea kubadilika, yanaendelea kusimuliwa, yanaendelea kufanya kazi ya kitamaduni katika jamii za Wadigo na Wamijikenda. Kila kusimulia upya kunabadilisha msisitizo — wakati mwingine kukisisitiza umoja wa watu tisa, wakati mwingine kukisisitiza kipaumbele cha Wadigo, wakati mwingine kuingiza heshima ya Kiislamu, wakati mwingine kupinga dhidi yake. Wasomi wataendelea kujadili iwapo Singwaya ilikuwa mji halisi, jina la eneo, au uvumbuzi wa nyuma. Lakini kwa Wadigo, masimulizi hayo si hasa dhana ya kihistoria ya kupimwa. Ni hati hai — hadithi inayoelezea wao ni nani, walikotoka, kwa nini wana haki na wajibu walizo nazo, na jinsi wanavyohusiana na watu wao nane wa ndugu kando ya pwani."
          },
          {
            "type": "paragraph",
            "text": "Kinachobaki thabiti katika matoleo yote ya mapokeo, ya kitaaluma na ya kawaida, ni picha ya kuondoka — watu wanaoondoka mahali ambapo hawezi tena kuwashikilia, wakitembea kusini kupitia eneo la adui, wakibeba nawo maarifa ya jinsi ya kujenga nyumba mpya katika msitu mpya juu ya kilima kipya. Picha hiyo ndiyo moyo wa masimulizi ya Singwaya, na hakuna kiasi cha mjadala wa kitaaluma kuhusu tarehe na maeneo kinachoweza kupunguza nguvu yake."
          }
        ],
        "dig": [
          {
            "type": "heading",
            "text": "Mudzi Kabila ya Kutawanyika"
          },
          {
            "type": "paragraph",
            "text": "Phatu fulani kaskazini ya Muho wa Tana, kpwa nyanda za phahi za sehemu ya kusini ya Somalia ya rero, kurikala na makalo garigohiwa Singwaya. Dzina riri rinaonekana kpwa mapokeo ga mdomo ga zaidi ya makabila sita ga Chibantu ga ph'wani ya Afrika Mashariki — Amijikenda, Apokomo, Aswahili, Ataita, Asegeju, na anjine — chila mwenga akidai kukala nyumba ya akare. Singwaya yakala, kpwa masimulizi gaga, chituwo cha makabila manji chenye ukubwa wa kutosha, chirichoudumishwa ni mitandao ya biashara."
          },
          {
            "type": "heading",
            "text": "Uvamizi wa Aoromo"
          },
          {
            "type": "paragraph",
            "text": "Dzambo ririrovunja Singwaya, kulingana na mapokeo ganago shirikiwa, ririkala uvamizi wa atu a Chioromo. Uvamizi uwo unahusishwa kpwa upana na kahi ya karne ya kumi na mbiri na kumi na saba. Toleo mwenga ra hadithi rinaelezea kukala kijana wa Chimijikenda arimuolaga mutu wa Chioromo, na jamii ya Chimijikenda iripokatala kulipa fidia ya damu, viha vyafuata."
          },
          {
            "type": "heading",
            "text": "Madai ga Adigo: A Kpwandza Kuuka"
          },
          {
            "type": "paragraph",
            "text": "Adigo anadai kukala a kpwandza kuuka Singwaya, akielekea kusini hadi Myango ya Shimba ambapho aanzisha Kaya Kwale. Madai gaga ga uphephi si tu dzambo ra kiburi ra chihistoria. Kpwa mantiki ya shirika ra chijamii ra Chimijikenda, mpangilio wa kuuka unaanzisha uongozi wa ukubwa."
          },
          {
            "type": "paragraph",
            "text": "Hati ya Makubaliano, Si Rekodi Tu"
          },
          {
            "type": "heading",
            "text": "Mapokeo ga Singwaya ganafanya kazi dza historia na dza hati ya chijamii. Kuiha \"hati ya hadithi\" si kuipuuza dza uwongo. Mapokeo ga mdomo ni hati za uhai, zinazoendelea kusimuliwa na kubadilishwa, zikitsukula ndani yakpwe tabaka za maana zirizokusanywa kpwa karne nyinji."
          },
          {
            "type": "paragraph",
            "text": "Kuchanganyika na Uislamu"
          },
          {
            "type": "paragraph",
            "text": "Chipengele cha phephi cha toleo ra Adigo ni kuchanganyika kwakpwe na utambulisho wa Chiislamu. Adigo aripokpwandza kuinjira Uislamu, hadithi yao ya asili yakpwandza kuinjiza vipengele vya Chiislamu. Karatasi muhimu ya chielimu inakamata mchakato uwo kpwa kitswa chakpwe: \"'Singwaya was a mere small station.'\""
          },
          {
            "type": "heading",
            "text": "Mtazamo wa Chitaaluma"
          },
          {
            "type": "paragraph",
            "text": "Swali ra iwapo Singwaya yakala phatu pha kpweli rimejadiliwa ni asomi kpwa zaidi ya karne mwenga. Spear aritetea mtazamo wa kawaida, Morton aripinga, na Walsh aripendekeza kukala Amijikenda akula kpwa eneo rire rire anaphokala rero na kupishisha masimulizi ga Singwaya badaye. Uchimbaji wa Mutoro urarehe ushahidi wa chimwili kpwa mjadala, ukipata ufinyanzi wa karne ya kumi kpwa maeneo ga makaya."
          },
          {
            "type": "paragraph",
            "text": "Mapokeo ga Uhai"
          },
          {
            "type": "heading",
            "text": "Masimulizi ga Singwaya si visukuku. Ganaendelea kubadilika, ganaendelea kusimuliwa, ganaendelea kuhenda kazi ya chimila kpwa jamii za Adigo na Amijikenda. Kpwa Adigo, masimulizi gago si hasa dhana ya chihistoria ya kupimwa. Ni hati ya uhai — hadithi inayoelezea ao ni ani na arikokula."
          },
          {
            "type": "paragraph",
            "text": "Swali ra iwapo Singwaya yakala phatu pha kpweli, na iwapo uhamisho uritokea kpweli, rimejadiliwa ni asomi kpwa zaidi ya karne mwenga. Thomas T. Spear, kpwa kazi yakpwe ya 1978 *The Kaya Complex*, aritoa utetezi wa china zaidi wa mtazamo wa kawaida: kukala ingawa bazi ya tafsiri za mapema taziwezekuwa kudumishwa, mapokeo ga Singwaya ni \"nevertheless valid for the Mijikenda, Pokomo, Swahili, Taita, and Segeju, where such evidence supports its basic veracity.\" Spear ariichukulia mapokeo dza ga chihistoria kpwa kiasi kikulu — uhamisho wa kpweli kula phatu pha kpweli."
          },
          {
            "type": "paragraph",
            "text": "Rodger F. Morton aripinga msimamo uwo mwaka 1972, akiamba kpwa *International Journal of African Historical Studies* kukala Shungwaya \"is actually an appended myth.\" Utafiti wa Morton uripendekeza kukala \"coastal traditions recorded prior to 1897 indicate that the Shungwaya tradition entered Miji Kenda oral literature only after this date\" — ikimaanisha mapokeo ganaweza kukala na umri wa karne mwenga tu, gakiibuka phephi na 1897 gakihusiana na kuongezeka kpwa fahamu ya chikabila. Ikala Morton a sawa, masimulizi ga Singwaya si kumbukumbu ya kare ela ujenzi wa phivi phivi, uriopishishwa ni Amijikenda ariphokuwa anaiunda utambulisho wa phamwenga kpwa kipindi cha mwisho cha ukoloni."
          },
          {
            "type": "heading",
            "text": "Ushahidi wa Chilugha na Miphaka Yakpwe"
          },
          {
            "type": "paragraph",
            "text": "Derek Nurse na Thomas Hinnebusch areha uchambuzi wa chilugha kpwa swali riri kpwa kazi yao ya 1993 *Swahili and Sabaki: A Linguistic History*. Aripendekeza kukala akare a Proto-Northeast-Coastal Bantu arionekana kahi ya miho ya Wami na Rufiji phephi na milenia ya kpwandza AD, na kukala azungumzaji a Proto-Sabaki badaye \"migrated northwards across the Juba River to a location associated with the legendary Shungwaya,\" ambapho aritofautiana na kukala jamii za Chiswahili, Chimijikenda, Chipokomo, Chielwana, na Chicomorian. Ujenzi uwo wa chilugha unaunga mkono kpwa sehemu masimulizi ga uhamisho — unaweka azungumzaji a Chisabaki a kare kpwa eneo ra kaskazini kabila ya kutawanyika kusini — huku ukitatiza ratiba kpwa kiasi kikulu. Hinnebusch mwenye arikala amekosoa mapema mahumizi ga Spear ga data za chilugha, akibainisha kukala Spear \"could not confirm Shungwaya as a linguistic homeland because he misunderstood the data.\""
          },
          {
            "type": "heading",
            "text": "Nadharia Mbadala"
          },
          {
            "type": "paragraph",
            "text": "Martin Walsh aritoa labda tathmini kali zaidi, \"concluding that this evidence is insufficient to support the tradition of a northern homeland, and proposing the alternative thesis that the Mijikenda developed in much the same area that they are to be found today.\" Kpwa mtazamo wa Walsh, Amijikenda taarihamia kula Singwaya hata chidogo. Arikula phatu phapho, kpwa bara ya ph'wani ya Kenya, na kupishisha masimulizi ga Singwaya badaye dza njira ya kuunda utambulisho wa phamwenga wa chikabila — hati iriyokopwa badala ya kurithiwa."
          },
          {
            "type": "paragraph",
            "text": "Kazi ya Walsh kuhusu Asegeju iriongeza tabaka yanjina ya ugumu. Arionyesha kukala kamusi ya Chimijikenda ina maneno manji garigokopwa kula lugha ya Chibantu ya Kahi ya Kenya iriyozungumzwa ni Asegeju au Adaiso. Maneno gago garigokopwa ganashughulikia ufugaji wa mifugo, chibiashara ya masafa mare, shirika ra chiashi na chisiasa, na mfumo wa rika — kujumuisha neno *rika* renye. Hiri rinapendekeza Asegeju \"left a legacy of political organization and ritual practice that contributed significantly to the precolonial making of the Mijikenda.\" Mpangilio wa chijamii wa Chimijikenda, kpwa maneno ganjina, unaweza kukala na deni kulu kpwa Asegeju dza unavyokuwa na Singwaya."
          },
          {
            "type": "heading",
            "text": "Chiakiolojia Chinaamba Nini"
          },
          {
            "type": "paragraph",
            "text": "Uchimbaji wa chiakiolojia wa Henry Mutoro kpwa maeneo ga makaya mwaka 1987 na 1994 urianzisha ushahidi wa chimwili kpwa mjadala uriokuwa ukihendwa phephi kabisa kupitshi mapokeo ga mdomo na uchambuzi wa chilugha. Kpwa Kaya Singwaya — eneo ambaro dzina rakpwe renye rinaiha masimulizi ga asili — uchimbaji wa Mutoro \"urizalisha ufinyanzi wa angalau karne ya kumi,\" na keramiki \"zinazofanana na makazi ga mapema ga ph'wani ya bahari ya milenia ya kpwandza badaye.\" Anaakiolojia anjine amependekeza kukala makaya ganaweza kuanzishwa mapema karne ya tisa, gakiwezekana kutangulia makazi ga ph'wani ya Chiswahili. Ikala makaya ni ga kare hivyo, masimulizi rahisi ga uhamisho — kuruka kpwa gafla kula Singwaya, mwandzo mpya kpwa myango — ganakala magumu kudumisha. Gaga tagakala makambi ga akimbizi. Gakala makazi garigoimarishwa, garigokaliwa kpwa muda mure genye utamaduni gao wa chimwili."
          },
          {
            "type": "heading",
            "text": "Mapokeo ga Uhai"
          },
          {
            "type": "paragraph",
            "text": "Masimulizi ga Singwaya si visukuku. Ganaendelea kubadilika, ganaendelea kusimuliwa, ganaendelea kuhenda kazi ya chimila kpwa jamii za Adigo na Amijikenda. Chila kusimulia luphya kunabadilisha msisitizo — wakati mwinjine kukisisitiza umoja wa atu tisa, wakati mwinjine kukisisitiza uphephi wa Adigo, wakati mwinjine kuingiza ishima ya Chiislamu, wakati mwinjine kupinga dhidi yakpwe. Asomi andaenderera kujadili iwapo Singwaya yakala mudzi wa kpweli, dzina ra eneo, au uvumbuzi wa nyuma. Ela kpwa Adigo, masimulizi gago si hasa dhana ya chihistoria ya kupimwa. Ni hati ya uhai — hadithi inayoelezea ao ni ani, arikokula, kpwa nini ana haki na uwajibikaji garigonago, na jinsi anavyohusiana na atu ao anane a ndugu kando ya ph'wani."
          },
          {
            "type": "paragraph",
            "text": "Chirichotsala thabiti kpwa matoleo gosi ga mapokeo, ga chitaaluma na ga kawaida, ni picha ya kuuka — atu anaouka phatu ambapo phaweza tena kuashikilia, akitembea kusini kupitshi eneo ra adui, akitsukula nao marifwa ga jinsi ya kudzenga nyumba mpya kpwa msitu mpya dzulu ya chirima chipya. Picha iyo ndiyo moyo wa masimulizi ga Singwaya, na takuna kiasi cha mjadala wa chitaaluma kuhusu tarehe na maeneo kinachoweza kupunguza nguvu yakpwe."
          }
        ]
      }
    }
  ]
};

export function getHistoryTopic(topicSlug: string) {
  const topic = historyDomain.topics.find((t) => t.slug === topicSlug);
  if (!topic) return null;
  return { domain: historyDomain, topic };
}
