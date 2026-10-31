import { getStorage } from "../server/db/storage.js";
import { EngineMatrix } from "../server/engine/matrix.js";
import { BayesianEngine, ANSWER_VALUES } from "../server/engine/bayes.js";
import { GameSessionManager } from "../server/engine/session.js";
import { SEED_GROUND_TRUTH } from "./data/seed_small_data.js";

interface SimGameResult {
  entityId: number;
  entityName: string;
  won: boolean;
  questionsCount: number;
  guessesCount: number;
  forcedGuess: boolean;
  finalGuessedId?: number;
}

function getBotAnswer(
  trueVal: number,
  noiseRate: number
): number {
  const isNoisy = Math.random() < noiseRate;

  if (isNoisy) {
    // Invert or perturb answer
    if (trueVal >= 0.75) return ANSWER_VALUES.NO;
    if (trueVal <= 0.25) return ANSWER_VALUES.YES;
    return Math.random() < 0.5 ? ANSWER_VALUES.YES : ANSWER_VALUES.NO;
  }

  // Realistic human responses with occasional "probably"
  if (trueVal >= 0.95) {
    return Math.random() < 0.85 ? ANSWER_VALUES.YES : ANSWER_VALUES.PROBABLY;
  } else if (trueVal <= 0.05) {
    return Math.random() < 0.85 ? ANSWER_VALUES.NO : ANSWER_VALUES.PROBABLY_NOT;
  } else if (trueVal >= 0.7) {
    const roll = Math.random();
    if (roll < 0.70) return ANSWER_VALUES.PROBABLY;
    if (roll < 0.90) return ANSWER_VALUES.YES;
    return ANSWER_VALUES.UNKNOWN;
  } else if (trueVal <= 0.3) {
    const roll = Math.random();
    if (roll < 0.70) return ANSWER_VALUES.PROBABLY_NOT;
    if (roll < 0.90) return ANSWER_VALUES.NO;
    return ANSWER_VALUES.UNKNOWN;
  } else {
    const roll = Math.random();
    if (roll < 0.75) return ANSWER_VALUES.UNKNOWN;
    return roll < 0.87 ? ANSWER_VALUES.PROBABLY : ANSWER_VALUES.PROBABLY_NOT;
  }
}

async function runSimulation(numGames = 50, noiseRate = 0.05) {
  console.log("=================================================================");
  console.log(`🤖 COGNITOR BAYESIAN ENGINE SIMULATION HARNESS`);
  console.log(`Config: ${numGames} games | Noise rate: ${(noiseRate * 100).toFixed(1)}% | Target: >= 85% win rate`);
  console.log("=================================================================\n");

  const storage = await getStorage();
  const matrix = new EngineMatrix();
  await matrix.load(storage);
  const engine = new BayesianEngine(matrix);

  const results: SimGameResult[] = [];
  const entityList = matrix.entities;

  if (entityList.length === 0) {
    throw new Error("No entities available in matrix. Run seed first!");
  }

  for (let g = 0; g < numGames; g++) {
    // Pick target entity (either round-robin across seed or random)
    const targetEntity = entityList[g % entityList.length];
    const session = new GameSessionManager(`sim-${g + 1}`, matrix, engine, targetEntity.category);
    const startRes = session.start();

    let curQ = startRes.question;
    let gameWon = false;
    let forced = false;
    let finalGuessedId: number | undefined;

    while (session.state === "in_progress" || session.state === "guess_pending") {
      if (session.state === "guess_pending") {
        const guess = session.pendingGuess!;
        finalGuessedId = guess.entityId;
        const isCorrect = guess.entityId === targetEntity.id;

        if (session.stepCount >= 25) {
          forced = true;
        }

        const confirmRes = session.confirmGuess(isCorrect);
        if (isCorrect) {
          gameWon = true;
          break;
        }

        if (confirmRes.state === "lost") {
          break;
        }
        if (confirmRes.question) {
          curQ = confirmRes.question;
        }
        continue;
      }

      // We are in_progress, answer the question
      const qId = curQ.id;
      const entIdx = matrix.entityIdToIndex.get(targetEntity.id)!;
      const qIdx = matrix.questionIdToIndex.get(qId)!;
      const trueAnswersForTarget = SEED_GROUND_TRUTH[targetEntity.id] || {};

      let trueVal = 0.5;
      if (trueAnswersForTarget[qId] !== undefined) {
        trueVal = trueAnswersForTarget[qId];
      } else if (entIdx !== undefined && qIdx !== undefined) {
        trueVal = matrix.getPYes(entIdx, qIdx);
      }

      const botAnswer = getBotAnswer(trueVal, noiseRate);
      const answerRes = session.answer(botAnswer);

      if (answerRes.state === "guess_pending") {
        // Next loop iteration will handle guess_pending
        continue;
      } else if (answerRes.state === "lost") {
        break;
      } else if (answerRes.question) {
        curQ = answerRes.question;
      }
    }

    results.push({
      entityId: targetEntity.id,
      entityName: targetEntity.name,
      won: gameWon && session.stepCount <= 25,
      questionsCount: session.stepCount,
      guessesCount: session.guessesCount,
      forcedGuess: forced,
      finalGuessedId
    });
  }

  // Calculate metrics
  const total = results.length;
  const wins = results.filter((r) => r.won).length;
  const winRate = (wins / total) * 100;
  const winningGames = results.filter((r) => r.won);
  const avgQuestions =
    winningGames.length > 0
      ? winningGames.reduce((acc, r) => acc + r.questionsCount, 0) / winningGames.length
      : 0;
  const forcedCount = results.filter((r) => r.forcedGuess).length;
  const forcedPct = (forcedCount / total) * 100;

  // Worst entities (lost or most questions)
  const sortedWorst = [...results].sort((a, b) => {
    if (a.won !== b.won) return a.won ? 1 : -1;
    return b.questionsCount - a.questionsCount;
  });

  console.log("┌─────────────────────────────────────────────────────────────┐");
  console.log("│                    SIMULATION SUMMARY                       │");
  console.log("├───────────────────────────────┬─────────────────────────────┤");
  console.log(`│ Total Games Simulated         │ ${total.toString().padEnd(27)} │`);
  console.log(`│ Wins (<= 25 Questions)        │ ${wins.toString().padEnd(27)} │`);
  console.log(`│ Win Rate                      │ ${(winRate.toFixed(1) + "%").padEnd(27)} │`);
  console.log(`│ Target Win Rate               │ >= 85.0%                    │`);
  console.log(`│ CI Minimum Gate               │ >= 70.0%                    │`);
  console.log(`│ Average Questions to Win      │ ${avgQuestions.toFixed(1).padEnd(27)} │`);
  console.log(`│ Forced Guesses (% of games)   │ ${(forcedCount + " (" + forcedPct.toFixed(1) + "%)").padEnd(27)} │`);
  console.log("└───────────────────────────────┴─────────────────────────────┘\n");

  console.log("Top 5 Hardest / Worst Entities in this run:");
  console.log("---------------------------------------------------------------");
  console.log("ID   | Name                           | Won? | Questions | Guesses");
  console.log("---------------------------------------------------------------");
  for (const w of sortedWorst.slice(0, 5)) {
    const idStr = w.entityId.toString().padEnd(4);
    const nameStr = w.entityName.padEnd(30).slice(0, 30);
    const wonStr = (w.won ? "YES" : "NO").padEnd(4);
    const qStr = w.questionsCount.toString().padEnd(9);
    const gStr = w.guessesCount.toString();
    console.log(`${idStr} | ${nameStr} | ${wonStr} | ${qStr} | ${gStr}`);
  }
  console.log("---------------------------------------------------------------\n");

  if (winRate < 70.0) {
    console.error(`❌ FAILED: Win rate ${winRate.toFixed(1)}% is below CI gate of 70.0%!`);
    process.exit(1);
  } else if (winRate >= 85.0) {
    console.log(`🎉 SUCCESS: Win rate ${winRate.toFixed(1)}% achieved the >= 85% target!`);
  } else {
    console.log(`⚠️ PASS WITH WARNING: Win rate ${winRate.toFixed(1)}% passed CI (>=70%) but is below 85% target.`);
  }

  return { winRate, avgQuestions, forcedPct };
}

runSimulation(50, 0.05).catch((err) => {
  console.error("Simulation run error:", err);
  process.exit(1);
});
