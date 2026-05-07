'use client';

import { useTranslations } from '@/lib/i18n/context';
import styles from './MissionPage.module.css';

function interpolate(
  template: string,
  marker: string,
  replacement: string,
  wrapper: (text: string) => React.ReactNode,
): React.ReactNode[] {
  const placeholder = `{${marker}}`;
  const index = template.indexOf(placeholder);
  if (index === -1) return [template];
  return [
    template.slice(0, index),
    wrapper(replacement),
    template.slice(index + placeholder.length),
  ];
}

export function MissionPage() {
  const t = useTranslations();

  return (
    <>
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <p className={styles.eyebrow}>{t.mission.eyebrow}</p>
          <h1 className={styles.heroTitle}>{t.mission.title}</h1>
          <p className={styles.missionStatement}>
            {interpolate(
              t.mission.statement,
              'highlight',
              t.mission.statement_highlight,
              (text) => (
                <span key="highlight" className={styles.missionHighlight}>{text}</span>
              ),
            )}
          </p>
        </div>
      </section>

      <section className={`${styles.section} ${styles.whatWeBuild}`}>
        <div className={styles.sectionInner}>
          <div className={styles.pillarGrid}>
            <div className={styles.pillarCard}>
              <div className={styles.pillarTitle}>{t.mission.tools_heading}</div>
              <p className={styles.bodyText}>{t.mission.tools_body}</p>
            </div>
            <div className={styles.pillarCard}>
              <div className={styles.pillarTitle}>{t.mission.content_heading}</div>
              <p className={styles.bodyText}>{t.mission.content_body}</p>
            </div>
            <div className={styles.pillarCard}>
              <div className={styles.pillarTitle}>{t.mission.platforms_heading}</div>
              <p className={styles.bodyText}>{t.mission.platforms_body}</p>
            </div>
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.principles}`}>
        <div className={styles.sectionInner}>
          <h2 className={styles.sectionHeading}>{t.mission.principles_heading}</h2>
          <ol className={styles.principleList}>
            <li className={styles.principleItem}>{t.mission.principle_1}</li>
            <li className={styles.principleItem}>{t.mission.principle_2}</li>
            <li className={styles.principleItem}>{t.mission.principle_3}</li>
            <li className={styles.principleItem}>{t.mission.principle_4}</li>
            <li className={styles.principleItem}>{t.mission.principle_5}</li>
            <li className={styles.principleItem}>{t.mission.principle_6}</li>
            <li className={styles.principleItem}>{t.mission.principle_7}</li>
          </ol>
        </div>
      </section>

      <section className={`${styles.section} ${styles.commitments}`}>
        <div className={styles.sectionInner}>
          <h2 className={styles.sectionHeading}>{t.mission.commitments_heading}</h2>
          <ul className={styles.commitmentList}>
            <li className={styles.commitmentItem}>{t.mission.commitment_1}</li>
            <li className={styles.commitmentItem}>{t.mission.commitment_2}</li>
            <li className={styles.commitmentItem}>{t.mission.commitment_3}</li>
            <li className={styles.commitmentItem}>{t.mission.commitment_4}</li>
          </ul>
        </div>
      </section>
    </>
  );
}
