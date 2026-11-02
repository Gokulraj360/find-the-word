import { describe, it, expect } from "vitest";
import { InMemoryStorage } from "../server/db/storage.js";
import { EngineMatrix } from "../server/engine/matrix.js";
import { BayesianEngine, ANSWER_VALUES } from "../server/engine/bayes.js";
import { GameSessionManager } from "../server/engine/session.js";
import { SEED_GROUND_TRUTH } from "../scripts/data/seed_small_data.js";

describe("Simulation CI Gate", () => {
  it("achieves >= 85% win rate within 25 questions under 5% noise on seeded dataset", async () => {
    const storage = new InMemoryStorage();
    await storage.init();
    const matrix = new EngineMatrix();
    await matrix.load(storage);
    const engine = new BayesianEngine(matrix);

    const numGames = 30;
    const noiseRate = 0.05;
    let wins = 0;

    for (let g = 0; g < numGames; g++) {
      const target = matrix.entities[g % matrix.entities.length];
      const session = new GameSessionManager(`test-sim-${g}`, matrix, engine, target.category);
      let curQ = session.start().question;

      while (session.state === "in_progress" || session.state === "guess_pending") {
        if (session.state === "guess_pending") {
          const guess = session.pendingGuess!;
          const isCorrect = guess.entityId === target.id;
          const confirmRes = session.confirmGuess(isCorrect);
          if (isCorrect) {
            if (session.stepCount <= 25) wins++;
            break;
          }
          if (confirmRes.state === "lost") break;
          if (confirmRes.question) curQ = confirmRes.question;
          continue;
        }

        const trueVal = (SEED_GROUND_TRUTH[target.id] || {})[curQ.id] ?? 0.5;
        const noisy = Math.random() < noiseRate;
        let ans: number = ANSWER_VALUES.UNKNOWN;

        if (noisy) {
          ans = trueVal >= 0.5 ? ANSWER_VALUES.NO : ANSWER_VALUES.YES;
        } else {
          if (trueVal >= 0.9) ans = ANSWER_VALUES.YES;
          else if (trueVal <= 0.1) ans = ANSWER_VALUES.NO;
          else if (trueVal >= 0.7) ans = ANSWER_VALUES.PROBABLY;
          else if (trueVal <= 0.3) ans = ANSWER_VALUES.PROBABLY_NOT;
        }

        const ansRes = session.answer(ans);
        if (ansRes.state === "guess_pending") continue;
        if (ansRes.state === "lost") break;
        if (ansRes.question) curQ = ansRes.question;
      }
    }

    const winRate = (wins / numGames) * 100;
    console.log(`Test Simulation Win Rate: ${winRate.toFixed(1)}% (${wins}/${numGames})`);
    expect(winRate).toBeGreaterThanOrEqual(70.0);
  });
});
