/**
 * Digo forms the speaker has ruled out (context/language-standards/README.md). Shared by the
 * build check (`npm run check:digo`) and the review screen, so a reviewer sees the same verdict
 * before accepting a contribution as the build applies to published data.
 */
export interface Rule {
  wrong: RegExp;
  right: string;
  ruling: string;
  /** Limit the rule to files whose path matches (e.g. prose only, not the dictionary). */
  only?: RegExp;
}

export const RULED_OUT: Rule[] = [
  { wrong: /\bChiingereza\b/i, right: 'Chingereza', ruling: 'round 3 (2026-10-10): the English language' },
  { wrong: /\bchiangazi\b/i, right: 'kazikazi (dry season) / ukame (drought)', ruling: 'round 3' },
  { wrong: /\bmnyevu-mnyevu\b/i, right: 'jeke-jeke (humid)', ruling: 'round 3' },
  { wrong: /\bmakumi mairi\b/i, right: 'ishirini', ruling: 'round 3' },
  { wrong: /\busiogbwa makodza\b/i, right: 'wenye makodza chila wakati', ruling: 'round 3' },
  { wrong: /\bmizize\b/i, right: 'miziye', ruling: 'round 3: possessive on mi- nouns' },
  { wrong: /\bchichaka\b/i, right: 'chitsaka / vitsaka', ruling: 'round 3: shrub' },
  { wrong: /\bimwenga\b/i, right: 'mwenga', ruling: 'round 4 (2026-10-12)' },
  // Round 4 also rules unji over wingi, but wingi is ordinary Swahili and these files hold Swahili text too,
  // so it can't be checked file-wide.
  { wrong: /kpwa ku(?:pishana|phokezana)\b/i, right: 'kpwa kuphisana', ruling: 'round 4: alternate leaves' },
  { wrong: /\b\w*lolana\b/i, right: 'lengana', ruling: 'round 4: opposite leaves' },
  // kpwera stays in the dictionary (shown as the alternative to fyombera); prose uses fyombera.
  { wrong: /\b\w*kpwera\b/i, right: 'fyombera', ruling: 'round 4: climb', only: /public\/data\/plants\// },
];

/** Ruled-out forms found in a piece of Digo text (ignores path-scoped rules). */
export function ruledOutIn(text: string): { found: string; right: string; ruling: string }[] {
  const hits: { found: string; right: string; ruling: string }[] = [];
  for (const rule of RULED_OUT) {
    if (rule.only) continue;
    const m = text.match(rule.wrong);
    if (m) hits.push({ found: m[0], right: rule.right, ruling: rule.ruling });
  }
  return hits;
}
