import type { Metadata } from 'next';
import { readFileSync } from 'fs';
import { join } from 'path';
import { buildMetadata } from '@/lib/seo/metadata';
import type { Locale } from '@/lib/i18n/config';
import { KangaCreator } from './KangaCreator';

export interface ProverbStub {
  id: string;
  digo: string;
  english: string;
}

let _cache: ProverbStub[] | null = null;

function getProverbStubs(): ProverbStub[] {
  if (_cache) return _cache;
  const raw = readFileSync(
    join(process.cwd(), 'public/data/proverbs/index.json'),
    'utf-8',
  );
  const full = JSON.parse(raw) as Array<{
    id: string;
    digo: string;
    literal_en: string;
    idiomatic_en: string;
  }>;
  _cache = full.map((p) => ({
    id: p.id,
    digo: p.digo,
    english: p.idiomatic_en || p.literal_en,
  }));
  return _cache;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildMetadata({
    title: 'Kanga Creator',
    description:
      'Create a digital kanga with Digo proverbs. Choose your message, style, and share.',
    path: '/language/kanga',
    locale: locale as Locale,
  });
}

export default function KangaPage() {
  const proverbs = getProverbStubs();
  return <KangaCreator proverbs={proverbs} />;
}
