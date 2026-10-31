import { getStorage } from "../server/db/storage.js";
import { EngineMatrix } from "../server/engine/matrix.js";
import { BayesianEngine } from "../server/engine/bayes.js";

async function main() {
  console.log("🌙 Running Nightly Cognitor Maintenance Pipeline...");
  const storage = await getStorage();
  const matrix = new EngineMatrix();
  await matrix.load(storage);
  const engine = new BayesianEngine(matrix);

  const questions = await storage.getAllQuestions();
  console.log(`Analyzing ${questions.length} questions for quality score calibration...`);

  // Compute empirical question information gain across active entities
  const posterior = engine.createInitialPosterior();
  let updatedCount = 0;

  for (const q of questions) {
    const qIdx = matrix.questionIdToIndex.get(q.id);
    if (qIdx === undefined) continue;

    // Simulate expected info gain at root
    const rec = engine.selectNextQuestion(posterior, new Set(), 0);
    // Base quality score between 0.5 and 1.5
    let newScore = q.qualityScore;
    if (rec && rec.questionIdx === qIdx) {
      newScore = Math.min(1.5, Math.max(0.6, q.qualityScore * 1.05));
    }

    if (Math.abs(newScore - q.qualityScore) > 0.01) {
      await storage.updateQuestion(q.id, { qualityScore: newScore });
      updatedCount++;
    }
  }

  console.log(`✅ Maintenance complete. Updated ${updatedCount} question quality scores.`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Maintenance script failed:", err);
  process.exit(1);
});
