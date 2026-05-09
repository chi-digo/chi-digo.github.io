'use client';

import { useLocale } from '@/lib/i18n/context';
import { TrackedLink } from '@/components/Analytics/TrackedLink';
import type { Locale } from '@/lib/i18n/config';
import styles from './CultureSection.module.css';

type CardType = 'badge' | 'stat';

interface DiscoverCard {
  key: string;
  type: CardType;
  eyebrow: Record<Locale, string>;
  title: Record<Locale, string>;
  desc: Record<Locale, string>;
  href: string;
}

const DISCOVER_CARDS: DiscoverCard[] = [
  {
    key: 'bandilo',
    type: 'badge',
    eyebrow: {
      en: 'Notable Figure',
      sw: 'Mtu Mashuhuri',
      dig: 'Mutu Mashuhuri',
    },
    title: {
      en: 'Bandilo',
      sw: 'Bandilo',
      dig: 'Bandilo',
    },
    desc: {
      en: 'He shot an arrow into the sky and told the Digo where it would land. The prophet-archer whose visions shaped a people before the colonizers arrived.',
      sw: 'Alipiga mshale angani na kuwaambia Wadigo utaangukia wapi. Nabii-mpiga mishale ambaye maono yake yaliunda taifa kabla ya wakoloni kufika.',
      dig: 'Wapiha muvwi dzulu na kuambira Adigo undaangukira kuphi. Nabii-mpiga mivwi ambaye maono gakye gaunda atu kabila ya akoloni kufika.',
    },
    href: '/history',
  },
  {
    key: 'fuko',
    type: 'badge',
    eyebrow: {
      en: 'The First Question',
      sw: 'Swali la Kwanza',
      dig: 'Swali ra Kpwandza',
    },
    title: {
      en: 'Wa atu ani?',
      sw: 'Wa atu ani?',
      dig: 'Wa atu ani?',
    },
    desc: {
      en: 'Before your name, before your town — "Whose people are you?" The matrilineal clan system that still defines every Digo relationship, from marriage to land to burial.',
      sw: 'Kabla ya jina lako, kabla ya mji wako — "Wa atu ani?" Mfumo wa ukoo wa mama ambao bado unafafanua kila uhusiano wa Kidigo, kutoka ndoa hadi ardhi hadi mazishi.',
      dig: 'Kabila ya dzina rako, kabila ya mudzi wako — "Wa atu ani?" Mfumo wa ukoo wa mayo ambao bado unafafanua chila uhusiano wa Chidigo, kula ndoa hadi mundani hadi mazishi.',
    },
    href: '/culture/society/fuko-system',
  },
  {
    key: 'dialects',
    type: 'stat',
    eyebrow: {
      en: '4 Dialects from Likoni to Tanga',
      sw: 'Lahaja 4 kutoka Likoni hadi Tanga',
      dig: 'Lahaja 4 kula Likoni hadi Tanga',
    },
    title: {
      en: 'Digo Accents',
      sw: 'Lafudhi za Kidigo',
      dig: 'Lafudhi za Chidigo',
    },
    desc: {
      en: 'Chinondo, Ungu, Ts\'imba, Tsw\'aka — same language, four accents, two countries. Can a speaker in Likoni understand one in Tanga?',
      sw: 'Chinondo, Ungu, Ts\'imba, Tsw\'aka — lugha moja, lafudhi nne, nchi mbili. Je, mzungumzaji wa Likoni anaweza kumuelewa wa Tanga?',
      dig: 'Chinondo, Ungu, Ts\'imba, Tsw\'aka — luga mwenga, lafudhi ne, tsi mbiri. Dze, munenedzi wa Likoni anaweza kumuelewa wa Tanga?',
    },
    href: '/language',
  },
  {
    key: 'towns',
    type: 'stat',
    eyebrow: {
      en: '21 Towns across Kenya & Tanzania',
      sw: 'Miji 21 nchini Kenya na Tanzania',
      dig: 'Midzi 21 tsi ya Kenya na Tanzania',
    },
    title: {
      en: 'Where the Digo Live',
      sw: 'Makazi ya Wadigo',
      dig: 'Makalo ga Adigo',
    },
    desc: {
      en: 'From Diani Beach to Vanga — Kenya\'s last town — and across the border to Moa, the ancestral homeland.',
      sw: 'Kutoka Diani Beach hadi Vanga — mji wa mwisho wa Kenya — na kuvuka mpaka hadi Moa, makazi ya mababu.',
      dig: 'Kula Diani Beach hadi Vanga — mudzi wa mwisho wa Kenya — na kuvuka mpaka hadi Moa, makalo ga akare.',
    },
    href: '/culture/today/key-towns',
  },
  {
    key: 'sengenya',
    type: 'badge',
    eyebrow: {
      en: 'Music · Dance',
      sw: 'Muziki · Ngoma',
      dig: 'Muziki · Ngoma',
    },
    title: {
      en: 'Sengenya',
      sw: 'Sengenya',
      dig: 'Sengenya',
    },
    desc: {
      en: 'The only musical tradition on the Swahili coast that belongs to a single people. Six drums, a bamboo flute at dawn.',
      sw: 'Tamaduni pekee ya muziki kwenye pwani ya Uswahili inayomilikiwa na watu mmoja. Ngoma sita, filimbi ya mianzi alfajiri.',
      dig: 'Chimila peke ya muziki pwani ya Uswahili chiricho cha atu amwenga. Ngoma sita, filimbi ya mwanzi alfajiri.',
    },
    href: '/culture/music/sengenya',
  },
  {
    key: 'kaya-kinondo',
    type: 'badge',
    eyebrow: {
      en: 'UNESCO World Heritage',
      sw: 'Urithi wa Dunia wa UNESCO',
      dig: 'Urithi wa Dunia wa UNESCO',
    },
    title: {
      en: 'Kaya Kinondo',
      sw: 'Kaya Kinondo',
      dig: 'Kaya Kinondo',
    },
    desc: {
      en: 'Thirty acres of ancient forest between the beach and eternity. Trees over 1,000 years old, 5 species found nowhere else on Earth.',
      sw: 'Ekari thelathini za msitu wa kale kati ya pwani na milele. Miti ya miaka zaidi ya 1,000, spishi 5 ambazo hazipatikani mahali pengine duniani.',
      dig: 'Ekari mirongo mihahu za tsaka ra kare kahi ya pwani na kare na kare. Mihi ya miaka zaidi ya 1,000, aina 5 ambazo tazipatikana phatu phanjine duniani.',
    },
    href: '/culture/kayas/kaya-kinondo',
  },
];

export function CultureSection() {
  const { locale } = useLocale();

  return (
    <section id="culture" className={styles.section}>
      <div className={styles.inner}>
        <p className={styles.eyebrow}>
          {locale === 'sw' ? 'Gundua' : locale === 'dig' ? 'Gundua' : 'Discover'}
        </p>
        <h2 className={styles.heading}>
          {locale === 'sw'
            ? 'Hadithi, watu, na maeneo ya Wadigo'
            : locale === 'dig'
              ? 'Hadisi, atu, na maeneo ga Adigo'
              : 'Stories, people, and places of the Digo'}
        </h2>

        <div className={styles.cardGrid}>
          {DISCOVER_CARDS.map((card) => (
            <TrackedLink
              key={card.key}
              href={card.href}
              source="discover_grid"
              className={styles.card}
            >
              <span className={card.type === 'badge' ? styles.cardBadge : styles.cardStat}>
                {card.eyebrow[locale]}
              </span>
              <span className={styles.cardTitle}>{card.title[locale]}</span>
              <span className={styles.cardDesc}>{card.desc[locale]}</span>
            </TrackedLink>
          ))}
        </div>
      </div>
    </section>
  );
}
