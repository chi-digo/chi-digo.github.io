'use client';

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useTranslations } from '@/lib/i18n/context';
import { msg } from '@/lib/contributions/client';
import type { Provenance } from '@/lib/contributions/apply/types';
import styles from './Contribute.module.css';

interface Credit {
  id: string;
  credited: boolean;
  first_name: string | null;
  avatar_url: string | null;
  region: string | null;
  recorded_for_name: string | null;
  recorder_first_name: string | null;
}

const CreditsContext = createContext<Map<string, Credit>>(new Map());

/** Every contribution id in a record's provenance. */
export function provenanceIds(provenance: Provenance | undefined): string[] {
  // A headword change is an admin's decision, not a contribution: nobody to credit (spec 34 §18.2).
  return [...new Set(Object.entries(provenance ?? {}).filter(([path]) => path !== 'headword').flatMap(([, list]) => list).map((e) => e.c))];
}

/**
 * Loads the credit lines for every contribution on the page in one request (spec 34 §10). Names are
 * resolved here, at render time, so they never live in the data files.
 */
export function CreditsProvider({ ids, children }: { ids: string[]; children: ReactNode }) {
  const [credits, setCredits] = useState<Map<string, Credit>>(new Map());
  const key = [...ids].sort().join(',');
  useEffect(() => {
    if (!key) return;
    let live = true;
    fetch(`/api/credits?ids=${key}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((list: Credit[]) => live && setCredits(new Map(list.map((c) => [c.id, c]))))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [key]);
  return <CreditsContext.Provider value={credits}>{children}</CreditsContext.Provider>;
}

/** "Suggested by Mwanaisha, Tanga" (with picture), or "Suggested by a Digo speaker". */
/** Credit lines for contributions; `translation` words them as translation credits (spec 34 §17, decision 6). */
export function CreditLine({ ids, translation = false, headword = false }: { ids: string[]; translation?: boolean; headword?: boolean }) {
  const c = useTranslations().contribute;
  const credits = useContext(CreditsContext);
  const lines = useMemo(() => {
    const seen = new Set<string>();
    return ids
      .map((id) => credits.get(id))
      .filter((x): x is Credit => !!x)
      .map((cr) => {
        const region = cr.region ? msg(c, `region_${cr.region}`) : '';
        // A form that became the headword reads "Headword form suggested by …" (spec 34 §18.2).
        const by = headword ? c.headword_credit_by : translation ? c.tf_credit_by : c.credit_by;
        const byRegion = headword ? c.headword_credit_by_region : translation ? c.tf_credit_by_region : c.credit_by_region;
        let text: string;
        if (!cr.credited || !cr.first_name) text = headword ? c.headword_credit_anon : translation ? c.tf_credit_anon : c.credit_anon;
        else if (cr.recorded_for_name && cr.recorder_first_name) {
          text = by.replace('{name}', c.credit_recorded.replace('{speaker}', cr.recorded_for_name).replace('{name}', cr.recorder_first_name));
        } else text = region ? byRegion.replace('{name}', cr.first_name).replace('{region}', region) : by.replace('{name}', cr.first_name);
        return { key: cr.id, text, avatar: cr.credited ? cr.avatar_url : null };
      })
      .filter((l) => (seen.has(l.text) ? false : (seen.add(l.text), true)));
  }, [ids, credits, c, translation, headword]);

  if (!lines.length) return null;
  return (
    <p className={styles.credit}>
      {lines.map((l) => (
        <span key={l.key} className={styles.creditItem}>
          {l.avatar && <img src={l.avatar} alt="" className={styles.creditAvatar} referrerPolicy="no-referrer" loading="lazy" />}
          {l.text}
        </span>
      ))}
    </p>
  );
}
