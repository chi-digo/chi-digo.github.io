import type { Metadata } from 'next';
import { readFileSync } from 'fs';
import { join } from 'path';
import { PlantsClient } from './PlantsClient';
import { buildMetadata } from '@/lib/seo/metadata';
import type { Locale } from '@/lib/i18n/config';
import { PLANT_THEMES, getPlantTheme } from '@/lib/plants/themes';
import { DIGO_ALPHABET } from '@/lib/constants';
import { JsonLd } from '@/components/JsonLd';
import { breadcrumbJsonLd, plantCollectionJsonLd, plantJsonLd } from '@/lib/seo/jsonld';
import type { Plant, PlantStub } from '@/lib/plants/types';

const ROOT = '/culture/ecology/plants';
const DATA = join(process.cwd(), 'public/data/plants');

let stubs: PlantStub[] | null = null;
function loadStubs(): PlantStub[] {
  if (!stubs) stubs = JSON.parse(readFileSync(join(DATA, 'index.json'), 'utf-8')) as PlantStub[];
  return stubs;
}

function loadPlant(slug: string): Plant | null {
  if (!loadStubs().some((p) => p.slug === slug)) return null;
  return JSON.parse(readFileSync(join(DATA, 'p', `${slug}.json`), 'utf-8')) as Plant;
}

function pick(text: { en: string; sw: string | null; dg: string | null } | null | undefined, locale: Locale): string {
  return (text && (text[locale] || text.en)) || '';
}

function plantName(p: { digo_headword: string | null; english: string | null; scientific: string | null }): string {
  return p.digo_headword || (p.english || '').split(/[;,(]/)[0].trim() || p.scientific || 'Plant';
}

export function generateStaticParams() {
  return [
    { locale: 'en', slug: [] },
    { locale: 'en', slug: ['parts'] },
    ...loadStubs().map((p) => ({ locale: 'en', slug: [p.slug] })),
    ...PLANT_THEMES.map((t) => ({ locale: 'en', slug: ['theme', t.slug] })),
    ...DIGO_ALPHABET.map((l) => ({ locale: 'en', slug: ['letter', l.toLowerCase()] })),
  ];
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug?: string[] }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  const loc = locale as Locale;
  const count = loadStubs().length;

  if (!slug || slug.length === 0) {
    return buildMetadata({
      title: 'Coastal Plants of Digo Country',
      description: `${count} plants of the Kenya south coast with their names in Chidigo, Kiswahili and English: mangroves, kaya forest trees, palms, crops and medicinal plants, and how the Digo use them.`,
      path: ROOT,
      locale: loc,
    });
  }
  if (slug[0] === 'theme' && slug[1]) {
    const theme = getPlantTheme(slug[1]);
    return buildMetadata({
      title: `${theme?.title[loc] ?? slug[1]} — Coastal Plants of Digo Country`,
      description: theme?.description[loc] ?? 'Digo coastal plants by theme.',
      path: `${ROOT}/theme/${slug[1]}`,
      locale: loc,
    });
  }
  if (slug[0] === 'letter' && slug[1]) {
    const letter = decodeURIComponent(slug[1]).toUpperCase();
    return buildMetadata({
      title: `${letter} — Coastal Plants of Digo Country`,
      description: `Digo plant names starting with "${letter}", with Swahili, English and scientific names.`,
      path: `${ROOT}/letter/${slug[1]}`,
      locale: loc,
    });
  }
  if (slug[0] === 'parts') {
    return buildMetadata({
      title: 'Plant parts glossary — Coastal Plants of Digo Country',
      description: 'Digo words for the parts of plants: bark, leaves, flowers, fruit, seeds and more.',
      path: `${ROOT}/parts`,
      locale: loc,
    });
  }
  const plant = loadPlant(decodeURIComponent(slug[0]));
  if (plant) {
    const sci = plant.taxon?.accepted_name;
    const english = (plant.english || '').split(/[;,(]/)[0].trim();
    const name = plantName({ ...plant, scientific: sci ?? null });
    return buildMetadata({
      title: `${name}${english && plant.digo_headword ? ` (${english})` : ''} — Coastal Plants of Digo Country`,
      description: pick(plant.summary, loc) || `${name}${sci ? `, ${sci}` : ''}: a plant of the Kenya south coast.`,
      path: `${ROOT}/${plant.slug}`,
      locale: loc,
    });
  }
  return buildMetadata({ title: 'Coastal Plants of Digo Country', path: ROOT, locale: loc });
}

export default async function Page({ params }: { params: Promise<{ locale: string; slug?: string[] }> }) {
  const { locale, slug } = await params;
  const loc = locale as Locale;

  if (!slug || slug.length === 0) {
    return (
      <>
        <JsonLd data={plantCollectionJsonLd(loadStubs().length)} />
        <PlantsClient />
      </>
    );
  }

  const reserved = ['theme', 'letter', 'parts'];
  const plant = reserved.includes(slug[0]) ? null : loadPlant(decodeURIComponent(slug[0]));
  if (plant) {
    const tx = plant.taxon;
    const name = plantName({ ...plant, scientific: tx?.accepted_name ?? null });
    const path = `${ROOT}/${encodeURIComponent(plant.slug)}`;
    return (
      <>
        <JsonLd
          data={plantJsonLd({
            name,
            alternateNames: [...plant.digo_alt, ...[plant.english, plant.swahili].flatMap((n) => (n || '').split(/[;,]/).map((x) => x.trim()))].filter(Boolean),
            scientific: tx?.accepted_name ?? null,
            authorship: tx?.accepted_authorship,
            rank: tx?.level,
            family: tx?.family,
            description: pick(plant.summary, loc),
            sameAs: tx ? [tx.links.gbif, tx.links.powo].filter((x): x is string => !!x) : [],
            path,
            locale: loc,
          })}
        />
        <JsonLd
          data={breadcrumbJsonLd([
            { name: 'Home', href: '/' },
            { name: 'Culture', href: '/culture' },
            { name: 'Ecology', href: '/culture/ecology' },
            { name: 'Plants', href: ROOT },
            { name, href: path },
          ], loc)}
        />
        <PlantsClient />
      </>
    );
  }
  return <PlantsClient />;
}
