import { readFileSync, writeFileSync } from "fs";

const raw = readFileSync("/tmp/proverbs_raw.txt", "utf-8");
const lines = raw.split("\n");

interface RawProverb {
  source_number: number;
  digo: string;
  english: string;
  commentary: string;
}

// For each numbered entry line, detect where the English column starts
// by finding the first run of 4+ spaces after at least 15 chars of text.
// Then use that column position for continuation lines until the next numbered entry.
function findEnglishStart(line: string): number | null {
  // Find the first run of 4+ spaces after position 15
  for (let i = 15; i < line.length - 4; i++) {
    if (
      line[i] === " " &&
      line[i + 1] === " " &&
      line[i + 2] === " " &&
      line[i + 2] === " "
    ) {
      // Find where the spaces end
      let j = i;
      while (j < line.length && line[j] === " ") j++;
      if (j < line.length) return j;
    }
  }
  return null;
}

// For a numbered line, also find the comment column start
function findCommentStart(
  line: string,
  englishStart: number,
): number | null {
  // Look for a second run of 4+ spaces after the english column starts
  let inText = false;
  for (let i = englishStart; i < line.length; i++) {
    if (line[i] !== " ") inText = true;
    if (inText && line[i] === " ") {
      let count = 0;
      let j = i;
      while (j < line.length && line[j] === " ") {
        count++;
        j++;
      }
      if (count >= 3 && j < line.length) {
        return j;
      }
      if (count < 3) i = j - 1;
    }
  }
  return null;
}

const proverbs: RawProverb[] = [];
let current: RawProverb | null = null;
let currentEnCol = 47; // Default, updated per numbered entry
let currentCmCol = 98; // Default

for (const line of lines) {
  if (
    line.trim() === "" ||
    line.startsWith("Ndarira") ||
    line.includes("English Gloss") ||
    line.includes("Digo Saying")
  )
    continue;

  const numMatch = line.match(/^(\d+)\.\s*/);
  if (numMatch) {
    if (current) proverbs.push(current);
    const num = parseInt(numMatch[1], 10);

    // Detect column positions for this entry
    const enStart = findEnglishStart(line);
    if (enStart !== null) {
      currentEnCol = enStart;
      const cmStart = findCommentStart(line, enStart);
      if (cmStart !== null) {
        currentCmCol = cmStart;
      }
    }

    // Extract columns using detected positions
    const padded = line.padEnd(currentCmCol + 200);
    const digo = padded.slice(0, currentEnCol).trim().replace(/^\d+\.\s*/, "");

    let english: string;
    let commentary: string;

    if (enStart !== null) {
      const cmStart = findCommentStart(line, enStart);
      if (cmStart !== null) {
        english = padded.slice(enStart, cmStart).trim();
        commentary = padded.slice(cmStart).trim();
      } else {
        english = padded.slice(enStart).trim();
        commentary = "";
      }
    } else {
      english = "";
      commentary = "";
    }

    current = {
      source_number: num,
      digo,
      english,
      commentary,
    };
  } else if (current) {
    // Continuation line: use the column positions from the last numbered entry
    const padded = line.padEnd(currentCmCol + 200);
    const digoText = padded.slice(0, currentEnCol).trim();
    const englishText = padded.slice(currentEnCol, currentCmCol).trim();
    const commentText = padded.slice(currentCmCol).trim();

    if (digoText) current.digo += " " + digoText;
    if (englishText) current.english += " " + englishText;
    if (commentText) current.commentary += " " + commentText;
  }
}
if (current) proverbs.push(current);

// Clean up whitespace
for (const p of proverbs) {
  p.digo = p.digo.replace(/\s+/g, " ").trim();
  p.english = p.english.replace(/\s+/g, " ").trim();
  p.commentary = p.commentary.replace(/\s+/g, " ").trim();
}

writeFileSync(
  "/tmp/proverbs_parsed.json",
  JSON.stringify(proverbs, null, 2),
  "utf-8",
);
console.log(`Parsed ${proverbs.length} proverbs`);

// Validation
const emptyEn = proverbs.filter((p) => !p.english);
console.log(`Empty English: ${emptyEn.length}`);

// Check for entries where English starts with lowercase (sign of column bleed)
const lcEn = proverbs.filter(
  (p) => p.english && p.english.length > 5 && /^[a-z]/.test(p.english),
);
console.log(`English starts lowercase (likely column bleed): ${lcEn.length}`);

// Check for Digo containing obvious English
const digoBleed = proverbs.filter((p) => {
  const dg = p.digo.toLowerCase();
  return (
    p.digo.length > 60 &&
    (dg.includes(" the ") ||
      dg.includes(" does not ") ||
      dg.includes(" person ") ||
      dg.includes(" who "))
  );
});
console.log(`Digo contains English markers: ${digoBleed.length}`);

// Spot check
for (const num of [1, 11, 18, 24, 25, 26, 39, 50, 102, 197, 208, 309, 349, 376]) {
  const p = proverbs.find((x) => x.source_number === num);
  if (!p) continue;
  console.log(`\n#${p.source_number}`);
  console.log(`  DG: ${p.digo}`);
  console.log(`  EN: ${p.english}`);
  console.log(`  CM: ${p.commentary.slice(0, 80) || "(none)"}`);
}
