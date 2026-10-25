/** Timeline eras: labels and colours. The events themselves live in content/articles/timeline.json. */
import type { Locale } from '@/lib/i18n/config';

export type Era = 'origins' | 'kaya' | 'colonial' | 'modern';

export const eraLabels: Record<Era, Record<Locale, string>> = {
  origins: {
    en: 'Origins & Settlement',
    sw: 'Asili na Makazi',
    dg: 'Asili na Makalo',
  },
  kaya: {
    en: 'The Kaya Period',
    sw: 'Kipindi cha Makaya',
    dg: 'Chipindi cha Makaya',
  },
  colonial: {
    en: 'Colonial Period',
    sw: 'Kipindi cha Ukoloni',
    dg: 'Chipindi cha Ukoloni',
  },
  modern: {
    en: 'Independence & Modern Era',
    sw: 'Uhuru na Enzi ya Kisasa',
    dg: 'Uhuru na Enzi ya Chisambi',
  },
};

export const eraColors: Record<Era, string> = {
  origins: 'var(--color-mnazi-gold)',
  kaya: 'var(--color-kaya-indigo)',
  colonial: 'var(--color-ngundu-red)',
  modern: 'var(--color-mangrove-green)',
};
