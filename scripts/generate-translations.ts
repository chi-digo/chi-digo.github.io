import Anthropic from "@anthropic-ai/sdk";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const DATA_PATH = join(__dirname, "../public/data/proverbs/index.json");
const BATCH_SIZE = 15;
const MODEL = "claude-sonnet-4-20250514";

interface Proverb {
  id: string;
  slug: string;
  source_number: number;
  digo: string;
  literal_en: string;
  idiomatic_en: string;
  idiomatic_sw: string;
  swahili: string;
  swahili_relationship: "cognate" | "parallel" | "translation";
  commentary_en: string;
  commentary_sw: string;
  commentary_dg: string;
  field_sources: Record<string, string>;
  [key: string]: unknown;
}

interface BatchResult {
  id: string;
  idiomatic_en?: string;
  swahili?: string;
  swahili_relationship?: "cognate" | "parallel" | "translation";
  idiomatic_sw?: string;
  commentary_sw?: string;
}

const client = new Anthropic();

function buildPrompt(batch: Proverb[]): string {
  const entries = batch.map((p) => {
    const parts = [`ID: ${p.id}`, `Digo: ${p.digo}`];
    if (p.literal_en) parts.push(`Literal English: ${p.literal_en}`);
    if (p.idiomatic_en) parts.push(`Idiomatic English: ${p.idiomatic_en}`);
    if (p.swahili) parts.push(`Swahili: ${p.swahili}`);
    if (p.commentary_en) parts.push(`Commentary: ${p.commentary_en}`);

    const needed: string[] = [];
    if (!p.idiomatic_en && p.literal_en)
      needed.push("idiomatic_en: a natural English idiomatic meaning (1 sentence)");
    if (!p.swahili)
      needed.push(
        'swahili: Swahili translation. If this is a known Swahili proverb or cognate, use the standard form. Otherwise translate faithfully.',
      );
    if (!p.swahili)
      needed.push(
        'swahili_relationship: "cognate" if it maps to a known Swahili proverb with shared Bantu origin, "parallel" if a similar Swahili proverb exists with different wording, or "translation" if you are translating fresh',
      );
    if (!p.idiomatic_sw)
      needed.push("idiomatic_sw: Swahili idiomatic meaning (1 sentence, natural Swahili)");
    if (p.commentary_en && !p.commentary_sw)
      needed.push("commentary_sw: translate the English commentary into natural Swahili");

    if (needed.length === 0) return null;

    parts.push(`GENERATE: ${needed.join("; ")}`);
    return parts.join("\n");
  });

  const filtered = entries.filter(Boolean);
  if (filtered.length === 0) return "";

  return filtered.join("\n---\n");
}

const SYSTEM_PROMPT = `You are a Bantu languages expert specialising in Digo (Chidigo) and Swahili.
You are generating translations for a Digo proverbs collection on a language preservation site.

Rules:
- For idiomatic_en: write a natural one-sentence English meaning that captures the wisdom. Not a literal restatement.
- For swahili: use the standard Swahili proverb form if one exists (many Digo proverbs are shared Bantu proverbs). Otherwise translate faithfully from the Digo.
- For swahili_relationship: "cognate" = maps to a recognized Swahili proverb with shared Bantu root, "parallel" = a similar proverb exists in Swahili with different wording, "translation" = no known Swahili equivalent, you translated fresh.
- For idiomatic_sw: write a natural one-sentence Swahili explanation of the proverb's meaning.
- For commentary_sw: translate the English commentary into natural Swahili. Keep the same depth and tone.
- Be concise. No preamble or meta-commentary.

Respond ONLY with a JSON array of objects. Each object must have "id" plus only the fields you were asked to generate. Example:
[
  {"id":"p-042","idiomatic_en":"...","swahili":"...","swahili_relationship":"cognate","idiomatic_sw":"...","commentary_sw":"..."},
  {"id":"p-043","idiomatic_en":"..."}
]`;

async function processBatch(
  batch: Proverb[],
  batchNum: number,
  totalBatches: number,
): Promise<BatchResult[]> {
  const prompt = buildPrompt(batch);
  if (!prompt) return [];

  const ids = batch.map((p) => p.id).join(", ");
  console.log(`  Batch ${batchNum}/${totalBatches} [${ids}]`);

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: prompt }],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";

  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    console.error(`  Failed to parse batch ${batchNum} response`);
    return [];
  }

  try {
    return JSON.parse(jsonMatch[0]) as BatchResult[];
  } catch (e) {
    console.error(`  JSON parse error in batch ${batchNum}:`, e);
    return [];
  }
}

async function main() {
  console.log("Loading proverbs...");
  const proverbs: Proverb[] = JSON.parse(readFileSync(DATA_PATH, "utf-8"));
  console.log(`Loaded ${proverbs.length} proverbs`);

  // Initialize new fields if missing
  for (const p of proverbs) {
    if (!p.idiomatic_sw) p.idiomatic_sw = "";
    if (!p.commentary_sw) p.commentary_sw = "";
    if (!p.commentary_dg) p.commentary_dg = "";
    if (!p.field_sources) p.field_sources = {};
  }

  // Filter to proverbs that need work
  const needsWork = proverbs.filter((p) => {
    const needsIdiomaticEn = !p.idiomatic_en && p.literal_en;
    const needsSwahili = !p.swahili;
    const needsIdiomaticSw = !p.idiomatic_sw;
    const needsCommentarySw = p.commentary_en && !p.commentary_sw;
    return needsIdiomaticEn || needsSwahili || needsIdiomaticSw || needsCommentarySw;
  });

  console.log(`${needsWork.length} proverbs need translation work`);

  const batches: Proverb[][] = [];
  for (let i = 0; i < needsWork.length; i += BATCH_SIZE) {
    batches.push(needsWork.slice(i, i + BATCH_SIZE));
  }

  console.log(`Processing ${batches.length} batches of ${BATCH_SIZE}...\n`);

  let generated = 0;
  const byId = new Map(proverbs.map((p) => [p.id, p]));

  for (let i = 0; i < batches.length; i++) {
    const results = await processBatch(batches[i], i + 1, batches.length);

    for (const r of results) {
      const p = byId.get(r.id);
      if (!p) continue;

      if (r.idiomatic_en && !p.idiomatic_en) {
        p.idiomatic_en = r.idiomatic_en;
        p.field_sources.idiomatic_en = "ai-draft";
        generated++;
      }
      if (r.swahili && !p.swahili) {
        p.swahili = r.swahili;
        p.swahili_relationship = r.swahili_relationship || "translation";
        p.field_sources.swahili = "ai-draft";
        generated++;
      }
      if (r.idiomatic_sw && !p.idiomatic_sw) {
        p.idiomatic_sw = r.idiomatic_sw;
        p.field_sources.idiomatic_sw = "ai-draft";
        generated++;
      }
      if (r.commentary_sw && !p.commentary_sw) {
        p.commentary_sw = r.commentary_sw;
        p.field_sources.commentary_sw = "ai-draft";
        generated++;
      }
    }

    // Save progress after each batch
    if ((i + 1) % 5 === 0 || i === batches.length - 1) {
      writeFileSync(DATA_PATH, JSON.stringify(proverbs, null, 2), "utf-8");
      console.log(`  Saved progress (${generated} fields generated so far)\n`);
    }

    // Small delay between batches to avoid rate limits
    if (i < batches.length - 1) {
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  // Mark existing original content in field_sources
  for (const p of proverbs) {
    if (p.literal_en && !p.field_sources.literal_en) {
      p.field_sources.literal_en = "original";
    }
    if (p.commentary_en && !p.field_sources.commentary_en) {
      p.field_sources.commentary_en = p.commentary_en ? "original" : "ai-draft";
    }
    if (p.idiomatic_en && !p.field_sources.idiomatic_en) {
      p.field_sources.idiomatic_en = "original";
    }
    if (p.swahili && !p.field_sources.swahili) {
      p.field_sources.swahili = "original";
    }
  }

  writeFileSync(DATA_PATH, JSON.stringify(proverbs, null, 2), "utf-8");

  // Stats
  const stats = {
    total: proverbs.length,
    idiomatic_en: proverbs.filter((p) => p.idiomatic_en).length,
    swahili: proverbs.filter((p) => p.swahili).length,
    idiomatic_sw: proverbs.filter((p) => p.idiomatic_sw).length,
    commentary_sw: proverbs.filter((p) => p.commentary_sw).length,
    commentary_en: proverbs.filter((p) => p.commentary_en).length,
  };

  console.log("\n=== Final Stats ===");
  console.log(`Total proverbs: ${stats.total}`);
  console.log(`idiomatic_en: ${stats.idiomatic_en}/${stats.total}`);
  console.log(`swahili: ${stats.swahili}/${stats.total}`);
  console.log(`idiomatic_sw: ${stats.idiomatic_sw}/${stats.total}`);
  console.log(`commentary_sw: ${stats.commentary_sw}/${stats.total} (of ${stats.commentary_en} with English commentary)`);
  console.log(`\nTotal fields generated this run: ${generated}`);
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
