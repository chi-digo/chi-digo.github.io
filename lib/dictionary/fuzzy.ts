import type { FuzzyRules } from "./types";
import { loadFuzzyRules } from "./loader";

let cachedRules: FuzzyRules | null = null;

async function getRules(): Promise<FuzzyRules> {
  if (cachedRules) return cachedRules;
  cachedRules = await loadFuzzyRules();
  return cachedRules;
}

export async function digoize(query: string): Promise<string> {
  const rules = await getRules();
  let result = query.toLowerCase();

  for (const norm of rules.digraph_normalizations) {
    result = result.replaceAll(norm.from, norm.to);
  }

  for (const rule of rules.rules) {
    if (!rule.swahili && rule.position === "word_initial_before_vowel") {
      if (/^[aeiou]/.test(result)) {
        result = rule.digo + result;
      }
      continue;
    }

    if (rule.position === "before_vowel") {
      const re = new RegExp(rule.swahili + "(?=[aeiou])", "g");
      result = result.replace(re, rule.digo);
    } else {
      result = result.replaceAll(rule.swahili, rule.digo);
    }
  }

  return result;
}
