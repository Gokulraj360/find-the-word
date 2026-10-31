import { describe, it, expect, beforeEach } from "vitest";
import { EngineMatrix } from "../server/engine/matrix.js";
import { BayesianEngine, ANSWER_VALUES } from "../server/engine/bayes.js";
import { GameSessionManager } from "../server/engine/session.js";
import { InMemoryStorage } from "../server/db/storage.js";

describe("Cognitor Bayesian Engine", () => {
  let storage: InMemoryStorage;
  let matrix: EngineMatrix;
  let engine: BayesianEngine;

  beforeEach(async () => {
    storage = new InMemoryStorage();
    await storage.init();
    matrix = new EngineMatrix();
    await matrix.load(storage);
    engine = new BayesianEngine(matrix);
  });

  describe("In-Memory Matrix & Prior Initialization", () => {
    it("should load active entities, questions, and non-empty Float32Arrays", () => {
      expect(matrix.numEntities).toBe(50);
      expect(matrix.numQuestions).toBe(40);
      expect(matrix.pYes.length).toBe(50 * 40);
      expect(matrix.confidence.length).toBe(50 * 40);
      expect(matrix.priors.length).toBe(50);
    });

    it("should normalize priors such that sum equals 1.0", () => {
      let sum = 0;
      for (let i = 0; i < matrix.numEntities; i++) {
        sum += matrix.priors[i];
      }
      expect(sum).toBeCloseTo(1.0, 5);
    });

    it("should assign higher prior to more popular entities", () => {
      // Einstein (popularity 45000) vs Neil Armstrong (28000)
      const einsteinIdx = matrix.entityIdToIndex.get(1)!;
      const armstrongIdx = matrix.entityIdToIndex.get(21)!;
      expect(matrix.priors[einsteinIdx]).toBeGreaterThan(matrix.priors[armstrongIdx]);
    });
  });

  describe("Soft Counts & Beta Prior", () => {
    it("computes p_yes = (yes_w + 1) / (yes_w + no_w + 2) and confidence = yes_w + no_w", () => {
      // Fictional question (Q1) for Harry Potter (E26) has yes_w=12, no_w=0
      const hpIdx = matrix.entityIdToIndex.get(26)!;
      const q1Idx = matrix.questionIdToIndex.get(1)!;
      const pYes = matrix.getPYes(hpIdx, q1Idx);
      const conf = matrix.getConfidence(hpIdx, q1Idx);

      expect(conf).toBe(12.0);
      // (12 + 1) / (12 + 2) = 13 / 14 ≈ 0.92857
      expect(pYes).toBeCloseTo(13 / 14, 4);
    });
  });

  describe("Bayesian Likelihood & Clamping Floor", () => {
    it("returns 1.0 likelihood when user answers Unknown (0.5)", () => {
      const lik = engine.calculateLikelihood(0.5, 0.9, 10.0);
      expect(lik).toBe(1.0);
    });

    it("returns 1.0 likelihood when confidence is low (< 1.0)", () => {
      const lik = engine.calculateLikelihood(1.0, 0.1, 0.5);
      expect(lik).toBe(1.0);
    });

    it("ensures floor clamp of 0.03 prevents complete elimination on a wrong answer", () => {
      // True pYes is 1.0, user answers 0.0 (wrong answer)
      const lik = engine.calculateLikelihood(0.0, 1.0, 15.0);
      expect(lik).toBeGreaterThan(0.0);
      // base is 0.03, raised to power w > 0, so > 0
      expect(lik).toBeGreaterThan(0.0001);
    });

    it("updates posterior cleanly and increases probability for matching answers", () => {
      const initial = engine.createInitialPosterior();
      const qFictional = matrix.questionIdToIndex.get(1)!;

      // Answer Yes (1.0) to "Is your character fictional?"
      const updated = engine.updatePosterior(initial, qFictional, ANSWER_VALUES.YES);

      const einsteinIdx = matrix.entityIdToIndex.get(1)!; // Real
      const harryPotterIdx = matrix.entityIdToIndex.get(26)!; // Fictional

      expect(updated[harryPotterIdx]).toBeGreaterThan(initial[harryPotterIdx]);
      expect(updated[einsteinIdx]).toBeLessThan(initial[einsteinIdx]);
    });
  });

  describe("Question Selection & Information Gain", () => {
    it("selects a question with positive expected information gain", () => {
      const posterior = engine.createInitialPosterior();
      const asked = new Set<number>();
      const rec = engine.selectNextQuestion(posterior, asked, 0);

      expect(rec).not.toBeNull();
      expect(rec!.expectedInfoGain).toBeGreaterThan(0);
      expect(rec!.questionId).toBeDefined();
    });

    it("favors broad splitters in the early game (step < 3)", () => {
      const posterior = engine.createInitialPosterior();
      const asked = new Set<number>();
      const rec = engine.selectNextQuestion(posterior, asked, 0);

      expect(rec).not.toBeNull();
      // Broad splitters have positive information gain and split the population well
      expect(rec!.expectedInfoGain).toBeGreaterThan(0.05);
      expect(rec!.score).toBeGreaterThan(0.1);
    });
  });

  describe("Session Management, Undo, and Guessing", () => {
    it("supports start, answering, and back/undo with exact posterior reconstruction", () => {
      const session = new GameSessionManager("test-session-1", matrix, engine);
      const startResult = session.start();
      expect(startResult.question.step).toBe(1);

      const q1Id = startResult.question.id;
      const initialPosterior = new Float32Array(session.posterior);

      // Answer question 1
      session.answer(ANSWER_VALUES.YES);
      expect(session.stepCount).toBe(1);
      expect(session.posterior).not.toEqual(initialPosterior);

      // Perform Undo
      const undoResult = session.undo();
      expect(session.stepCount).toBe(0);
      expect(undoResult.question.step).toBe(1);

      // Reconstructed posterior should exactly match initial posterior
      for (let i = 0; i < matrix.numEntities; i++) {
        expect(session.posterior[i]).toBeCloseTo(initialPosterior[i], 5);
      }
    });

    it("penalizes a rejected guess and continues asking", () => {
      const session = new GameSessionManager("test-session-2", matrix, engine);
      session.start();

      // Force high probability on Harry Potter (id 26)
      const hpIdx = matrix.entityIdToIndex.get(26)!;
      session.posterior[hpIdx] = 0.90;
      // Renormalize so total sum is 1.0
      let sum = 0;
      for (let i = 0; i < matrix.numEntities; i++) sum += session.posterior[i];
      for (let i = 0; i < matrix.numEntities; i++) session.posterior[i] /= sum;

      const topBefore = engine.getTopCandidates(session.posterior, 1);
      expect(topBefore[0].entityId).toBe(26);
      const probBefore = topBefore[0].probability;

      // Set pending guess and reject
      session.pendingGuess = topBefore[0];
      session.state = "guess_pending";

      const res = session.confirmGuess(false);
      expect(res.state).toBe("in_progress");
      // Should drop significantly after 0.01x penalty
      expect(session.posterior[hpIdx]).toBeLessThan(probBefore * 0.05);
      expect(session.guessesCount).toBe(1);
    });

    it("triggers contradiction handling if posterior is flat after 15 questions", () => {
      const session = new GameSessionManager("test-session-3", matrix, engine);
      session.start();

      // Simulate 15 answers that create low max P (< 0.05)
      session.posterior.fill(1.0 / matrix.numEntities); // 0.02 each
      for (let i = 0; i < 15; i++) {
        session.history.push({
          questionId: i + 1,
          questionIdx: i,
          answerValue: 0.5
        });
      }

      session.answer(0.5);
      expect(session.contradictionWeakening).toBe(true);
    });
  });
});
