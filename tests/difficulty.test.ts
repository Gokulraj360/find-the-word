import { describe, it, expect, beforeAll } from "vitest";
import { InMemoryStorage } from "../server/db/storage.js";
import { EngineMatrix } from "../server/engine/matrix.js";
import { BayesianEngine } from "../server/engine/bayes.js";
import { GameSessionManager } from "../server/engine/session.js";

describe("Difficulty Modes (Easy, Hard, Expert)", () => {
  let storage: InMemoryStorage;
  let matrix: EngineMatrix;
  let engine: BayesianEngine;

  beforeAll(async () => {
    storage = new InMemoryStorage();
    await storage.init();
    matrix = new EngineMatrix();
    await matrix.load(storage);
    engine = new BayesianEngine(matrix);
  });

  it("configures hardQuestionLimit accurately based on difficulty", () => {
    const easySession = new GameSessionManager("s-easy", matrix, engine, "object", "easy");
    expect(easySession.hardQuestionLimit).toBe(25);
    expect(easySession.difficulty).toBe("easy");

    const hardSession = new GameSessionManager("s-hard", matrix, engine, "object", "hard");
    expect(hardSession.hardQuestionLimit).toBe(20);
    expect(hardSession.difficulty).toBe("hard");

    const expertSession = new GameSessionManager("s-expert", matrix, engine, "object", "expert");
    expect(expertSession.hardQuestionLimit).toBe(15);
    expect(expertSession.difficulty).toBe("expert");
  });

  it("triggers guess at question 15 in Expert mode", () => {
    const session = new GameSessionManager("s-exp", matrix, engine, "character", "expert");
    expect(session.hardQuestionLimit).toBe(15);

    // Fake 14 questions asked
    for (let i = 0; i < 14; i++) {
      session.history.push({ questionId: i + 1, questionIdx: i, answerValue: 0.5 });
    }
    expect(session.stepCount).toBe(14);
    expect(session.shouldGuess([], true)).toBe(false);

    // At question 15, shouldGuess must trigger
    session.history.push({ questionId: 15, questionIdx: 14, answerValue: 0.5 });
    expect(session.stepCount).toBe(15);
    expect(session.shouldGuess([], true)).toBe(true);
  });

  it("biases initial probabilities in Easy vs Hard mode", () => {
    const penalties = new Float32Array(matrix.numEntities);

    const easyProbs = engine.computeProbabilities(penalties, "character", "easy");
    const hardProbs = engine.computeProbabilities(penalties, "character", "hard");

    // Find a common entity (pop >= 40000) and rare entity (pop < 40000)
    const charIndices = matrix.characterEntityIndices;
    const commonIdx = charIndices.find((idx) => (matrix.entities[idx]?.popularity ?? 0) >= 45000);
    const rareIdx = charIndices.find((idx) => (matrix.entities[idx]?.popularity ?? 0) <= 35000);

    expect(commonIdx).toBeDefined();
    expect(rareIdx).toBeDefined();

    if (commonIdx !== undefined && rareIdx !== undefined) {
      // In easy mode, common item should have higher relative probability than in hard mode
      const easyRatio = easyProbs[commonIdx] / easyProbs[rareIdx];
      const hardRatio = hardProbs[commonIdx] / hardProbs[rareIdx];
      expect(easyRatio).toBeGreaterThan(hardRatio);
    }
  });
});
