import { InMemoryStorage } from "../server/db/storage.js";
import { EngineMatrix } from "../server/engine/matrix.js";
import { BayesianEngine } from "../server/engine/bayes.js";
import { GameSessionManager } from "../server/engine/session.js";
import { SEED_GROUND_TRUTH } from "./data/seed_small_data.js";

async function runSampleSession(
  targetId: number,
  targetName: string,
  domain: "character" | "object",
  simulateWrongTurn?: { turn: number; wrongAns: number }
) {
  const storage = new InMemoryStorage();
  await storage.init();
  const matrix = new EngineMatrix();
  await matrix.load(storage);
  const engine = new BayesianEngine(matrix);

  console.log(`\n======================================================================`);
  console.log(`SAMPLE RUN: Thinking of "${targetName}" (Domain: ${domain}, ID: ${targetId})`);
  if (simulateWrongTurn) {
    console.log(`[Noise Test] Will give incorrect answer at Turn ${simulateWrongTurn.turn}`);
  }
  console.log(`======================================================================`);

  const session = new GameSessionManager(`sample-${targetId}`, matrix, engine, domain);
  let curQ = session.start().question;

  while (session.state === "in_progress" || session.state === "guess_pending") {
    if (session.state === "guess_pending") {
      const guess = session.pendingGuess!;
      console.log(`\n>>> GUESS PROPOSED at Turn ${session.stepCount}: "${guess.name}" (Certainty: ${(guess.probability * 100).toFixed(1)}%)`);
      const isCorrect = guess.entityId === targetId;
      console.log(`>>> Confirmation: ${isCorrect ? "CORRECT! Game Won." : "WRONG! Penalizing and continuing..."}`);
      const res = session.confirmGuess(isCorrect);
      if (isCorrect || res.state === "lost" || session.guessesCount >= 3) {
        break;
      }
      if (res.question) curQ = res.question;
      continue;
    }

    let ans = 0.5;
    let ansLabel = "Don't know (0.5)";

    if (simulateWrongTurn && curQ.step === simulateWrongTurn.turn) {
      ans = simulateWrongTurn.wrongAns;
      ansLabel = `${ans} (INTENTIONAL MISTAKE)`;
    } else {
      const groundTruth = (SEED_GROUND_TRUTH[targetId] || {})[curQ.id] ?? 0.5;
      if (groundTruth >= 0.85) { ans = 1.0; ansLabel = "Yes (1.0)"; }
      else if (groundTruth <= 0.15) { ans = 0.0; ansLabel = "No (0.0)"; }
      else if (groundTruth >= 0.65) { ans = 0.75; ansLabel = "Probably (0.75)"; }
      else if (groundTruth <= 0.35) { ans = 0.25; ansLabel = "Probably not (0.25)"; }
    }

    console.log(`\nTurn ${curQ.step}: Q: "${curQ.text}"`);
    console.log(`  User Answer -> ${ansLabel}`);

    const res = session.answer(ans);
    const top3 = engine.getTopCandidates(session.posterior, 3, domain);
    const top3Str = top3.map((c, i) => `${i + 1}) ${c.name} [${(c.probability * 100).toFixed(1)}%]`).join(" | ");
    console.log(`  Top 3 Candidates: ${top3Str}`);

    if (res.state === "guess_pending") {
      continue;
    }
    if (res.state === "lost") {
      console.log(`\nGame Ended: Lost`);
      break;
    }
    if (res.question) {
      curQ = res.question;
    }
  }
}

async function main() {
  // Run 1: Basketball (ID: 90) - Object
  await runSampleSession(90, "Basketball", "object");
  // Run 2: Harry Potter (ID: 26) - Character
  await runSampleSession(26, "Harry Potter", "character");
  // Run 3: Basketball with simulated mistake at Turn 3 (answer No instead of Yes for plastic/rubber)
  await runSampleSession(90, "Basketball (Mistake Recovery)", "object", { turn: 3, wrongAns: 0.0 });
}

main().catch(console.error);
