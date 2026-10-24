'use client';

import styles from './Contribute.module.css';

/** Word-level differences between two texts (longest common subsequence over words and spaces). */
export function wordDiff(before: string, after: string): { kind: 'same' | 'del' | 'ins'; text: string }[] {
  const a = before.split(/(\s+)/).filter(Boolean);
  const b = after.split(/(\s+)/).filter(Boolean);
  // Long paragraphs are fine: a few hundred words each way.
  const dp: number[][] = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  }
  const out: { kind: 'same' | 'del' | 'ins'; text: string }[] = [];
  const push = (kind: 'same' | 'del' | 'ins', text: string) => {
    const last = out[out.length - 1];
    if (last?.kind === kind) last.text += text;
    else out.push({ kind, text });
  };
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { push('same', a[i]); i++; j++; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) push('del', a[i++]);
    else push('ins', b[j++]);
  }
  while (i < a.length) push('del', a[i++]);
  while (j < b.length) push('ins', b[j++]);
  return out;
}

/** The current text with removed words struck through and added words marked, for reviewers. */
export function WordDiff({ before, after }: { before: string; after: string }) {
  return (
    <p className={styles.diff}>
      {wordDiff(before, after).map((part, k) =>
        part.kind === 'same' ? <span key={k}>{part.text}</span>
          : part.kind === 'del' ? <del key={k}>{part.text}</del>
          : <ins key={k}>{part.text}</ins>,
      )}
    </p>
  );
}
