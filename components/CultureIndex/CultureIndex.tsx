'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useTranslations } from '@/lib/i18n/context';
import { useLocale } from '@/lib/i18n/context';
import { domains, getDomain, type CultureDomain, type Topic } from '@/lib/culture/content';
import { fukoCards } from '@/lib/culture/fuko';
import type { Locale } from '@/lib/i18n/config';
import styles from './CultureIndex.module.css';

const DigoMap = dynamic(
  () => import('@/components/DigoMap/DigoMap').then((m) => m.DigoMap),
  { ssr: false, loading: () => <div style={{ height: 500, borderRadius: 8, background: 'rgba(0,0,0,0.04)' }} /> },
);

type Settlement = {
  id: string;
  name: string;
  country: string;
  coordinates: { lat: number; lng: number };
  digoSignificance?: string;
  type?: string;
};


function Hero({
  eyebrow,
  title,
  intro,
  proverb,
  proverbGloss,
}: {
  eyebrow: string;
  title: string;
  intro?: string;
  proverb?: string;
  proverbGloss?: string;
}) {
  return (
    <section className={styles.hero}>
      <div className={styles.heroContent}>
        <p className={styles.eyebrow}>{eyebrow}</p>
        <h1 className={styles.heroTitle}>{title}</h1>
        {intro && <p className={styles.heroIntro}>{intro}</p>}
        {proverb && (
          <p className={styles.proverb} lang="dig">
            <em>{proverb}</em>
          </p>
        )}
        {proverbGloss && <p className={styles.gloss}>{proverbGloss}</p>}
      </div>
    </section>
  );
}

export function CultureOverview() {
  const t = useTranslations();
  const { locale } = useLocale();
  const [settlements, setSettlements] = useState<Settlement[]>([]);

  useEffect(() => {
    fetch('/data/digo-settlements.json')
      .then((r) => r.json())
      .then((data) => {
        const items: Settlement[] = [
          ...(data.settlements || []).map((s: Record<string, unknown>) => ({
            id: s.id as string,
            name: s.name as string,
            country: s.country as string,
            coordinates: s.coordinates as { lat: number; lng: number },
            digoSignificance: s.digoSignificance as string | undefined,
            type: s.type as string | undefined,
          })),
          ...(data.landmarks || []).map((l: Record<string, unknown>) => ({
            id: l.id as string,
            name: l.name as string,
            country: l.country as string,
            coordinates: l.coordinates as { lat: number; lng: number },
            digoSignificance: l.significance as string | undefined,
            type: l.type as string | undefined,
          })),
        ];
        setSettlements(items);
      })
      .catch(() => {});
  }, []);

  const cultureCards = domains.filter((d) => d.slug !== 'oral-traditions');

  return (
    <>
      <Hero
        eyebrow={t.culture.overview_eyebrow}
        title={t.culture.overview_title}
        intro={t.culture.overview_intro}
        proverb={t.culture.overview_proverb}
        proverbGloss={t.culture.overview_proverb_gloss}
      />

      {/* Interactive map */}
      <section className={`${styles.section} ${styles.sectionCream}`}>
        <div className={styles.sectionInner}>
          <h2 className={styles.sectionHeading}>{t.culture.map_heading}</h2>
          <DigoMap settlements={settlements} />
        </div>
      </section>

      {/* Fuko system cards */}
      <section className={`${styles.section} ${styles.sectionSand}`}>
        <div className={styles.sectionInner}>
          <h2 className={styles.sectionHeading}>{t.culture.fuko_heading}</h2>
          <div className={styles.fukoGrid}>
            {fukoCards.map((card) => (
              <div key={card.slug} className={styles.fukoCard}>
                <h3 className={styles.fukoTitle}>{card.title[locale]}</h3>
                <span className={styles.fukoSubtitle}>
                  {card.subtitle[locale]}
                </span>
                <p className={styles.fukoDesc}>
                  {card.description[locale]}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Deep dive topic cards */}
      <section className={`${styles.section} ${styles.sectionDark}`}>
        <div className={styles.sectionInner}>
          <h2
            className={`${styles.sectionHeading} ${styles.sectionHeadingLight}`}
          >
            {t.culture.topics_heading}
          </h2>
          <div className={styles.cardGrid}>
            {cultureCards.map((d) => (
              <a
                key={d.slug}
                href={`/culture/${d.slug}`}
                className={styles.topicCard}
              >
                <h3 className={styles.topicTitle}>{d.title[locale]}</h3>
                <p className={styles.topicIntro}>{d.intro[locale]}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

    </>
  );
}

export function DomainIndex({ domainSlug }: { domainSlug: string }) {
  const t = useTranslations();
  const { locale } = useLocale();

  const domain = getDomain(domainSlug);
  if (!domain) return <p>Domain not found.</p>;

  const cards = domain.topics.map((topic) => ({
    href: `/culture/${domain.slug}/${topic.slug}`,
    title: topic.title[locale],
    intro: topic.intro[locale],
  }));

  return (
    <>
      <Hero
        eyebrow={domain.title[locale]}
        title={domain.title[locale]}
        proverb={domain.proverb}
        proverbGloss={domain.proverbGloss}
      />
      <section className={styles.section}>
        <div className={styles.sectionInner}>
          <p className={styles.bodyText}>{domain.intro[locale]}</p>
        </div>
      </section>
      <section className={styles.section}>
        <div className={styles.sectionInner}>
          <div className={styles.cardGrid}>
            {cards.map((card) => (
              <a key={card.href} href={card.href} className={styles.card}>
                <h3 className={styles.cardTitle}>{card.title}</h3>
                <p className={styles.cardIntro}>{card.intro}</p>
              </a>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
