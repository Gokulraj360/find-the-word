import { getStorage } from "../server/db/storage.js";
import {
  SEED_ENTITIES,
  SEED_QUESTIONS,
  SEED_GROUND_TRUTH,
  groundTruthToWeights
} from "./data/seed_small_data.js";

async function main() {
  console.log("🌱 Starting small seed dataset (50 entities x 40 questions)...");
  const storage = await getStorage();

  // Insert or update entities
  console.log(`Inserting ${SEED_ENTITIES.length} entities...`);
  for (const e of SEED_ENTITIES) {
    const existing = await storage.getEntity(e.id);
    if (!existing) {
      await storage.createEntity(e);
    } else {
      await storage.updateEntity(e.id, e);
    }
  }

  // Insert or update questions
  console.log(`Inserting ${SEED_QUESTIONS.length} questions...`);
  for (const q of SEED_QUESTIONS) {
    const existing = await storage.getQuestion(q.id);
    if (!existing) {
      await storage.createQuestion(q);
    } else {
      await storage.updateQuestion(q.id, q);
    }
  }

  // Insert entity answers
  console.log("Setting soft-count entity answers with Beta priors...");
  let count = 0;
  for (const [entityIdStr, answers] of Object.entries(SEED_GROUND_TRUTH)) {
    const entityId = Number(entityIdStr);
    for (const [questionIdStr, val] of Object.entries(answers)) {
      const questionId = Number(questionIdStr);
      const w = groundTruthToWeights(val);
      await storage.setEntityAnswer(entityId, questionId, w);
      count++;
    }
  }

  console.log(`✅ Seed completed successfully! Seeded ${count} entity-answer pairs into ${storage.name}.`);
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
