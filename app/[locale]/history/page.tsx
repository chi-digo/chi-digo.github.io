import { HistoryIndex } from '@/components/HistoryIndex/HistoryIndex';
import { buildMetadata } from '@/lib/seo/metadata';
import { JsonLd } from '@/components/JsonLd';
import { faqJsonLd } from '@/lib/seo/jsonld';

export const metadata = buildMetadata({
  title: 'Digo History — Origins, Migration & Heritage',
  description:
    'Explore the history of the Digo people — the Singwaya migration, kaya sacred forest settlements, archaeological evidence, and scholarly debates on Mijikenda origins.',
  path: '/history',
});

const historyFaq = faqJsonLd([
  {
    question: 'What is the Singwaya migration?',
    answer:
      'Singwaya is the semi-mythic origin settlement from which the nine Mijikenda peoples, including the Digo, migrated southward to the Kenya-Tanzania coast. Oral traditions place Singwaya somewhere north of the Tana River in present-day southern Somalia. The migration narrative is central to Mijikenda identity, though scholars debate whether it represents a single historical event or a gradual centuries-long movement.',
  },
  {
    question: 'What does kaya archaeology reveal about Digo history?',
    answer:
      'Archaeological excavations at kaya sites, particularly by Henry Mutoro in the late 1980s and 1990s, recovered pottery dating to at least the tenth century, iron tools, and settlement patterns showing continuous occupation over centuries. The material evidence suggests kaya communities were settled, technologically sophisticated, and connected to broader coastal trade networks — complicating simple migration narratives.',
  },
  {
    question: 'What are the main scholarly debates about Mijikenda origins?',
    answer:
      'The key debate is between the orthodox migration thesis (a single southward migration from Singwaya in the 16th-17th century) and Martin Walsh\'s in-situ development thesis, which argues the Mijikenda evolved gradually from local coastal populations over centuries. Archaeological evidence, linguistic data, and oral traditions are used by both sides, with the truth likely involving elements of both perspectives.',
  },
]);

export default function Page() {
  return (
    <>
      <JsonLd data={historyFaq} />
      <HistoryIndex />
    </>
  );
}
