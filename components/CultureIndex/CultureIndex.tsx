'use client';

import { useTranslations } from '@/lib/i18n/context';
import { useLocale } from '@/lib/i18n/context';
import { domains, getDomain, type CultureDomain, type Topic } from '@/lib/culture/content';
import type { Locale } from '@/lib/i18n/config';
import styles from './CultureIndex.module.css';

function Footer() {
  const t = useTranslations();
  return (
    <footer className={styles.footer}>
      <div className={styles.footerInner}>
        <span className={styles.footerCopy}>{t.footer.copyright}</span>
      </div>
    </footer>
  );
}

function Hero({
  eyebrow,
  title,
  proverb,
  proverbGloss,
}: {
  eyebrow: string;
  title: string;
  proverb?: string;
  proverbGloss?: string;
}) {
  return (
    <section className={styles.hero}>
      <div className={styles.heroContent}>
        <p className={styles.eyebrow}>{eyebrow}</p>
        <h1 className={styles.heroTitle}>{title}</h1>
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

function CardGrid({
  cards,
}: {
  cards: { href: string; title: string; intro: string }[];
}) {
  return (
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
  );
}

export function CultureOverview() {
  const t = useTranslations();
  const { locale } = useLocale();

  const cards = domains.map((d) => ({
    href: `/culture/${d.slug}`,
    title: d.title[locale],
    intro: d.intro[locale],
  }));

  return (
    <>
      <Hero
        eyebrow={t.culture.overview_eyebrow}
        title={t.culture.overview_title}
      />
      <CardGrid cards={cards} />
      <Footer />
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
      <CardGrid cards={cards} />
      <section className={styles.section}>
        <div className={styles.sectionInner}>
          <a href="/culture" className={styles.backLink}>
            {t.culture.back_to_culture}
          </a>
        </div>
      </section>
      <Footer />
    </>
  );
}
