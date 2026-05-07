import { CultureOverview } from '@/components/CultureIndex/CultureIndex';
import { buildMetadata } from '@/lib/seo/metadata';
import { JsonLd } from '@/components/JsonLd';
import { faqJsonLd } from '@/lib/seo/jsonld';

export const metadata = buildMetadata({
  title: 'Digo Culture — A Living Heritage',
  description:
    'Explore 56 articles across 13 domains of Digo culture — sacred kayas, religion, music, food, dress, crafts, society, rites of passage, ecology, and contemporary life.',
  path: '/culture',
});

const cultureFaq = faqJsonLd([
  {
    question: 'What are the main cultural domains of the Digo people?',
    answer:
      'Digo culture spans 13 documented domains: sacred kayas (fortified forest settlements), religion (Islam-indigenous coexistence), music (sengenya drum ensembles, chakacha dance), food (coconut-based cuisine), dress (hando cloth traditions), crafts (pottery, architecture), society (fuko matrilineal clan system), rites of passage (birth, circumcision, puberty, marriage, death), ecology (kaya forests, Shimba Hills), contemporary life, and cross-border connections between Kenya and Tanzania.',
  },
  {
    question: 'What is a kaya in Digo culture?',
    answer:
      'A kaya is a sacred fortified forest settlement of the Mijikenda peoples, including the Digo. Kayas served as defensive settlements, spiritual sanctuaries, and centres of governance for centuries. Several kayas, including Kaya Kinondo in Kwale County, are UNESCO World Heritage Sites. They remain active centres of elder governance and spiritual practice.',
  },
  {
    question: 'What is the fuko clan system of the Digo?',
    answer:
      'The fuko is the Digo matrilineal clan system, governing inheritance, land rights, and social organization. In Digo custom, clan membership passes through the mother, and the mjomba (maternal uncle) plays a central role in family decisions, inheritance, and dispute resolution. This matrilineal system coexists with Islamic patrilineal inheritance law, creating a distinctive dual system.',
  },
  {
    question: 'What is sengenya music?',
    answer:
      'Sengenya is the signature Digo drum-and-dance ensemble featuring a battery of six drums of different sizes and pitches, accompanied by a bamboo flute (chivoti). It is performed at ceremonies, celebrations, and community gatherings, and is one of the most distinctive musical traditions of the Kenya-Tanzania coast.',
  },
]);

export default function Page() {
  return (
    <>
      <JsonLd data={cultureFaq} />
      <CultureOverview />
    </>
  );
}
