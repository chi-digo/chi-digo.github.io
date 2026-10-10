import type { Messages } from '@/lib/i18n/config';

/** Reference sections linked from a culture domain page, shown after its article cards (spec 33 §3). */
export interface DomainReference {
  href: string;
  title: (t: Messages) => string;
  intro: (t: Messages) => string;
  label: (t: Messages) => string;
  /** Item count shown on the card. */
  count: number;
  countLabel: (t: Messages, count: number) => string;
}

export const DOMAIN_REFERENCES: Record<string, DomainReference[]> = {
  ecology: [
    {
      href: '/culture/ecology/plants',
      title: (t) => t.plants.title,
      intro: (t) => t.plants.card_intro,
      label: (t) => t.plants.reference_label,
      count: 459,
      countLabel: (t, n) => t.plants.count.replace('{count}', String(n)),
    },
  ],
};
