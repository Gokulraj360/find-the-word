import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { getStorage } from "../server/db/storage.js";

dotenv.config();

const SUBJECTIVE_QUESTIONS = [
  "Is your character funny or comedic?",
  "Is your character famous worldwide?",
  "Is your character considered physically strong or muscular?",
  "Is your character widely considered a villain or evil?",
  "Is your character known for extreme intelligence or wisdom?",
  "Is your character considered scary or intimidating?",
  "Is your character an inspiring hero or role model?",
  "Does your character have a tragic or sad backstory?",
  "Is your character considered eccentric or quirky?",
  "Is your character associated with romantic or dramatic stories?"
];

interface FillProgress {
  completedPairs: Record<string, boolean>; // key: `${entityId}:${questionId}`
}

const PROGRESS_FILE = path.resolve(process.cwd(), "data", "llm_fill_progress.json");

function loadProgress(): FillProgress {
  if (fs.existsSync(PROGRESS_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(PROGRESS_FILE, "utf8"));
    } catch {
      return { completedPairs: {} };
    }
  }
  return { completedPairs: {} };
}

function saveProgress(progress: FillProgress) {
  fs.mkdirSync(path.dirname(PROGRESS_FILE), { recursive: true });
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2), "utf8");
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Subjective heuristic evaluation (used when API keys are not supplied)
 */
function heuristicSubjectiveEval(
  entityName: string,
  desc: string,
  question: string
): number | "unknown" {
  const combined = (entityName + " " + desc).toLowerCase();
  const q = question.toLowerCase();

  if (q.includes("funny")) {
    if (combined.includes("spongebob") || combined.includes("mario") || combined.includes("shrek")) return 0.9;
    if (combined.includes("einstein") || combined.includes("voldemort") || combined.includes("beethoven")) return 0.1;
    return 0.5;
  }

  if (q.includes("famous worldwide")) {
    return 0.95; // In our seed dataset, all are globally recognized
  }

  if (q.includes("physically strong")) {
    if (combined.includes("superman") || combined.includes("goku") || combined.includes("shrek") || combined.includes("ronaldo")) return 0.95;
    if (combined.includes("einstein") || combined.includes("hawking") || combined.includes("shakespeare")) return 0.05;
    return 0.5;
  }

  if (q.includes("villain") || q.includes("evil")) {
    if (combined.includes("joker") || combined.includes("voldemort") || combined.includes("vader")) return 0.95;
    if (combined.includes("gandhi") || combined.includes("harry potter") || combined.includes("superman")) return 0.05;
    return 0.1;
  }

  if (q.includes("intelligence") || q.includes("wisdom")) {
    if (combined.includes("einstein") || combined.includes("hawking") || combined.includes("sherlock") || combined.includes("gandalf") || combined.includes("yoda") || combined.includes("curie") || combined.includes("hermione")) return 0.95;
    if (combined.includes("spongebob") || combined.includes("shrek")) return 0.2;
    return 0.6;
  }

  if (q.includes("scary") || q.includes("intimidating")) {
    if (combined.includes("voldemort") || combined.includes("vader") || combined.includes("joker") || combined.includes("ramsay")) return 0.85;
    if (combined.includes("pikachu") || combined.includes("mickey mouse") || combined.includes("spongebob")) return 0.05;
    return 0.3;
  }

  if (q.includes("inspiring") || q.includes("role model")) {
    if (combined.includes("gandhi") || combined.includes("einstein") || combined.includes("superman") || combined.includes("curie") || combined.includes("luke skywalker")) return 0.9;
    if (combined.includes("joker") || combined.includes("voldemort")) return 0.05;
    return 0.6;
  }

  if (q.includes("tragic") || q.includes("sad backstory")) {
    if (combined.includes("batman") || combined.includes("spider-man") || combined.includes("harry potter") || combined.includes("darth vader") || combined.includes("van gogh")) return 0.9;
    if (combined.includes("spongebob") || combined.includes("mario")) return 0.1;
    return 0.5;
  }

  return "unknown";
}

async function callClaudeOrGeminiBatch(
  entities: Array<{ id: number; name: string; description: string | null }>,
  questions: Array<{ id: number; text: string }>
): Promise<Record<string, number | "unknown">> {
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;

  if (anthropicKey) {
    // Calling Anthropic Claude API (claude-3-5-haiku / sonnet)
    try {
      const prompt = `You are evaluating entities for an Akinator-style guessing game.
Entities:
${entities.map((e) => `- [${e.id}] ${e.name} (${e.description || ""})`).join("\n")}

Questions:
${questions.map((q) => `- [${q.id}] ${q.text}`).join("\n")}

For every entity and question pair, output a valid JSON array of objects with format:
[
  { "entityId": number, "questionId": number, "p_yes": number between 0.0 and 1.0 or "unknown" }
]
Provide ONLY the JSON output without markdown fences.`;

      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": anthropicKey,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json"
        },
        body: JSON.stringify({
          model: "claude-3-5-haiku-20241022",
          max_tokens: 1500,
          messages: [{ role: "user", content: prompt }]
        })
      });

      if (resp.ok) {
        const body: any = await resp.json();
        const text = body.content?.[0]?.text || "[]";
        const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
        const result: Record<string, number | "unknown"> = {};
        for (const item of parsed) {
          result[`${item.entityId}:${item.questionId}`] = item.p_yes;
        }
        return result;
      }
    } catch (err: any) {
      console.warn(`[fill_llm] Claude API call error: ${err.message}. Falling back to internal heuristics.`);
    }
  }

  // Fallback to internal heuristic evaluator
  const result: Record<string, number | "unknown"> = {};
  for (const ent of entities) {
    for (const q of questions) {
      result[`${ent.id}:${q.id}`] = heuristicSubjectiveEval(ent.name, ent.description || "", q.text);
    }
  }
  return result;
}

async function main() {
  console.log("🧠 Starting LLM Subjective Question Filler Pipeline...");
  const storage = await getStorage();
  const progress = loadProgress();

  // 1. Ensure subjective questions exist in DB
  const allQuestions = await storage.getAllQuestions();
  const existingMap = new Map(allQuestions.map((q) => [q.text.toLowerCase().trim(), q.id]));

  const subjectiveQRecords: Array<{ id: number; text: string }> = [];
  for (const qText of SUBJECTIVE_QUESTIONS) {
    const key = qText.toLowerCase().trim();
    let qId = existingMap.get(key);
    if (!qId) {
      const created = await storage.createQuestion({
        text: qText,
        source: "llm",
        qualityScore: 0.85,
        timesAsked: 0,
        isActive: true
      });
      qId = created.id;
    }
    subjectiveQRecords.push({ id: qId, text: qText });
  }

  const entities = await storage.getActiveEntities();
  console.log(`Processing ${entities.length} entities x ${subjectiveQRecords.length} subjective questions...`);

  const BATCH_SIZE = 10;
  let filledCount = 0;

  for (let i = 0; i < entities.length; i += BATCH_SIZE) {
    const batch = entities.slice(i, i + BATCH_SIZE);

    // Filter out already completed pairs
    const pairsToQuery = batch.filter((e) =>
      subjectiveQRecords.some((q) => !progress.completedPairs[`${e.id}:${q.id}`])
    );

    if (pairsToQuery.length === 0) {
      continue;
    }

    console.log(`Evaluating batch ${Math.floor(i / BATCH_SIZE) + 1} / ${Math.ceil(entities.length / BATCH_SIZE)}...`);
    const results = await callClaudeOrGeminiBatch(pairsToQuery, subjectiveQRecords);

    for (const [key, pYesOrUnknown] of Object.entries(results)) {
      const [entIdStr, qIdStr] = key.split(":");
      const entityId = parseInt(entIdStr, 10);
      const questionId = parseInt(qIdStr, 10);

      // Low confidence soft counts (total weight = 3.0)
      let yesW = 0.0;
      let noW = 0.0;
      let unknownW = 0.0;

      if (typeof pYesOrUnknown === "number") {
        const p = Math.max(0.0, Math.min(1.0, pYesOrUnknown));
        yesW = p * 3.0;
        noW = (1.0 - p) * 3.0;
        unknownW = 0.5;
      } else {
        unknownW = 3.0;
      }

      await storage.setEntityAnswer(entityId, questionId, { yesW, noW, unknownW });
      progress.completedPairs[key] = true;
      filledCount++;
    }

    saveProgress(progress);
    // Rate limit: 250ms pause between batches
    await sleep(250);
  }

  console.log(`✅ LLM fill complete. Recorded ${filledCount} low-confidence subjective answer pairs.`);
  process.exit(0);
}

main().catch((err) => {
  console.error("fill:llm failed:", err);
  process.exit(1);
});
