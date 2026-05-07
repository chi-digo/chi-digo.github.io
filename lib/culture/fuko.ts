import type { Locale } from '@/lib/i18n/config';

export type FukoCard = {
  slug: string;
  title: Record<Locale, string>;
  subtitle: Record<Locale, string>;
  description: Record<Locale, string>;
};

export const fukoCards: FukoCard[] = [
  {
    slug: 'matrilineal-descent',
    title: {
      en: 'The Fuko',
      sw: 'Fuko',
      dig: 'Fuko',
    },
    subtitle: {
      en: 'Matrilineal Descent',
      sw: 'Ukoo wa Mama',
      dig: 'Ukoo wa Mayo',
    },
    description: {
      en: 'Clan membership passes exclusively through the mother. "Wa atu ani?" — "Whose people are you?" — is the question that defines a Digo person, and the answer references the fuko.',
      sw: 'Uanachama wa ukoo unapitia mama peke yake. "Wa atu ani?" — "Wewe ni watu wa nani?" — ndilo swali linalomtambulisha Mdigo, na jibu linarejelea fuko.',
      dig: 'Uanachama wa ukoo unapishira mayo bahi. "Wa atu ani?" — ndiro swali rinaro mtambulisha Mudigo, na jibu rinarejelea fuko.',
    },
  },
  {
    slug: 'mjomba',
    title: {
      en: 'The Mjomba',
      sw: 'Mjomba',
      dig: 'Mjomba',
    },
    subtitle: {
      en: "Maternal Uncle's Authority",
      sw: 'Mamlaka ya Mjomba',
      dig: 'Mamlaka ga Mjomba',
    },
    description: {
      en: "The most powerful kinship position in the traditional system. The mjomba is responsible for children's upbringing, pays for marriage proceedings, and his property passes to his sister's children.",
      sw: 'Nafasi yenye nguvu zaidi katika mfumo wa jadi wa ukoo. Mjomba anawajibika kwa malezi ya watoto, analipa harusi, na mali yake inapita kwa watoto wa dada yake.',
      dig: 'Nafasi yenye nguvu zaidi kpwa mfumo wa jadi wa ukoo. Mjomba anawajibika kpwa malezi ga ana, analipa harusi, na mali yakwe inapishira ana a dada yakwe.',
    },
  },
  {
    slug: 'konho',
    title: {
      en: 'Konho',
      sw: 'Konho',
      dig: 'Konho',
    },
    subtitle: {
      en: "Mother's Land",
      sw: 'Ardhi ya Mama',
      dig: 'Tsi ya Mayo',
    },
    description: {
      en: 'Women held "complete control and freedom" over konho land, which passed matrilineally to their children. This gave Digo women significant economic autonomy in the pre-colonial period.',
      sw: 'Wanawake walikuwa na "udhibiti kamili na uhuru" juu ya ardhi ya konho, iliyopitishwa kwa watoto wao kupitia mama. Hii iliwapa wanawake wa Kidigo uhuru mkubwa wa kiuchumi.',
      dig: 'Achetu kala ana "udhibiti kamili na uhuru" dzulu ya tsi ya konho, iriyopishirishwa ana ao kupishira mayo. Hiri rikaaphera achetu a Chidigo uhuru mkulu wa chiuchumi.',
    },
  },
  {
    slug: 'chifudu',
    title: {
      en: 'Chifudu',
      sw: 'Chifudu',
      dig: 'Chifudu',
    },
    subtitle: {
      en: "Women's Fertility Cult",
      sw: 'Ibada ya Uzazi ya Wanawake',
      dig: 'Ibada ya Uzazi ya Achetu',
    },
    description: {
      en: 'Each matriclan maintained its own chifudu — a women\'s society and fertility cult. Women served as "custodians of fertility-awarding powers of ancestresses," giving them significant ritual authority.',
      sw: 'Kila ukoo wa mama ulidumisha chifudu yake — chama cha wanawake na ibada ya uzazi. Wanawake walitumika kama "walezi wa nguvu za uzazi za babu zao wa kike."',
      dig: 'Chila ukoo wa mayo urikadumisha chifudu chakwe — chama cha achetu na ibada ya uzazi. Achetu arikahudumu dza "alezi a nguvu za uzazi za akuku ao a chichetu."',
    },
  },
  {
    slug: 'mwerya',
    title: {
      en: 'Mwerya',
      sw: 'Mwerya',
      dig: 'Mwerya',
    },
    subtitle: {
      en: 'Cooperative Work Groups',
      sw: 'Vikundi vya Kazi ya Ushirikiano',
      dig: 'Vikundi vya Kazi ya Ushirikiano',
    },
    description: {
      en: 'Cooperative labour groups organised along matrilineal lines, comprising women from the same matriclan. The rhythm of communal work was guided by shared songs.',
      sw: 'Vikundi vya kazi ya ushirikiano vilivyopangwa kulingana na ukoo wa mama, vinavyoundwa na wanawake wa ukoo mmoja. Mdundo wa kazi ya pamoja uliongozwa na nyimbo za pamoja.',
      dig: 'Vikundi vya kazi ya ushirikiano virivyopangwa kulingana na ukoo wa mayo, vinavyoundwa ni achetu a ukoo mmwenga. Mdundo wa kazi ya phamwenga urikaongozwa ni nyimbo za phamwenga.',
    },
  },
  {
    slug: 'fuko-exogamy',
    title: {
      en: 'Fuko Exogamy',
      sw: 'Ndoa ya Nje ya Fuko',
      dig: 'Ndoa ya Nde ya Fuko',
    },
    subtitle: {
      en: 'Marriage Rules',
      sw: 'Sheria za Ndoa',
      dig: 'Sheria za Ndoa',
    },
    description: {
      en: 'The bride and groom must come from different mafuko. During kuposa (pre-marriage investigation), families examine clan compatibility. The mjomba\'s approval of his niece\'s marriage is required.',
      sw: 'Bibi na bwana harusi lazima watoke katika mafuko tofauti. Wakati wa kuposa, familia zinachunguza upatanifu wa ukoo. Idhini ya mjomba kwa ndoa ya binti wa dada yake inahitajika.',
      dig: 'Bibi na bwana harusi ni lazima atuluke kpwa mafuko tofauti. Wakati wa kuposa, mbari zinachunguza uphatifu wa ukoo. Idhini ya mjomba kpwa ndoa ya mwana muche wa dada yakwe inahitajika.',
    },
  },
  {
    slug: 'islam-fuko-negotiation',
    title: {
      en: 'Islam and Fuko',
      sw: 'Uislamu na Fuko',
      dig: 'Uislamu na Fuko',
    },
    subtitle: {
      en: 'Two Systems Coexisting',
      sw: 'Mifumo Miwili Inayoishi Pamoja',
      dig: 'Mifumo Miiri Inayoishi Phamwenga',
    },
    description: {
      en: 'Islam brought patrilineal inheritance that conflicted with the fuko system. The result was not a clean victory for either but "a negotiated coexistence that varies from family to family, village to village."',
      sw: 'Uislamu ulileta urithi wa baba uliopingana na mfumo wa fuko. Matokeo hayakuwa ushindi safi kwa upande wowote bali "maelewano yanayotofautiana kutoka familia hadi familia, kijiji hadi kijiji."',
      dig: 'Uislamu urikareha urithi wa baba urioupingana na mfumo wa fuko. Matokeo tagakala ushindi safi kpwa uphande wowose ela "maelewano ganagotofautiana kula mbari hadi mbari, mudzi hadi mudzi."',
    },
  },
];
