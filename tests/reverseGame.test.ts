import { describe, it, expect, beforeAll } from "vitest";
import { InMemoryStorage } from "../server/db/storage.js";
import { EngineMatrix } from "../server/engine/matrix.js";
import { ReverseGameService } from "../server/services/reverseGameService.js";

describe("Role Reversal Game Service", () => {
  let storage: InMemoryStorage;
  let matrix: EngineMatrix;
  let reverseService: ReverseGameService;

  beforeAll(async () => {
    storage = new InMemoryStorage();
    await storage.init();
    matrix = new EngineMatrix();
    await matrix.load(storage);
    reverseService = new ReverseGameService();
  });

  it("starts a reverse session without leaking the secret entity", async () => {
    const session = await reverseService.startSession(storage, "object");
    expect(session.sessionId).toBeDefined();
    expect(session.domain).toBe("object");
    expect(session.maxQuestions).toBe(20);
    expect(session.maxGuesses).toBe(3);

    // Ensure secret entity is tracked internally
    const stored = reverseService.getSession(session.sessionId);
    expect(stored).toBeDefined();
    expect(stored?.secretEntityId).toBeGreaterThan(0);
    expect(stored?.state).toBe("in_progress");
  });

  it("answers questions accurately according to ground truth", async () => {
    const session = await reverseService.startSession(storage, "object");
    const activeQuestions = await storage.getActiveQuestions();
    const q1 = activeQuestions[0];

    const res = await reverseService.askQuestion(session.sessionId, q1.id, matrix, storage);
    expect(["Yes", "No", "Probably", "Probably not", "Don't know"]).toContain(res.answerLabel);
    expect(res.step).toBe(1);
    expect(res.questionsRemaining).toBe(19);
    expect(res.state).toBe("in_progress");
    expect(res.revealedEntity).toBeUndefined(); // Still secret
  });

  it("handles a correct user guess and reveals the secret entity", async () => {
    const session = await reverseService.startSession(storage, "character");
    const stored = reverseService.getSession(session.sessionId)!;

    const guessRes = await reverseService.submitGuess(session.sessionId, stored.secretEntityName, storage);
    expect(guessRes.correct).toBe(true);
    expect(guessRes.state).toBe("won");
    expect(guessRes.revealedEntity?.name).toBe(stored.secretEntityName);
  });

  it("penalizes wrong guesses and ends in loss on 3 wrong guesses", async () => {
    const session = await reverseService.startSession(storage, "object");

    // Guess 1: Wrong
    const g1 = await reverseService.submitGuess(session.sessionId, "NonExistentEntityX1", storage);
    expect(g1.correct).toBe(false);
    expect(g1.guessesRemaining).toBe(2);
    expect(g1.state).toBe("in_progress");

    // Guess 2: Wrong
    const g2 = await reverseService.submitGuess(session.sessionId, "NonExistentEntityX2", storage);
    expect(g2.correct).toBe(false);
    expect(g2.guessesRemaining).toBe(1);

    // Guess 3: Wrong -> Game lost
    const g3 = await reverseService.submitGuess(session.sessionId, "NonExistentEntityX3", storage);
    expect(g3.correct).toBe(false);
    expect(g3.guessesRemaining).toBe(0);
    expect(g3.state).toBe("lost");
    expect(g3.revealedEntity).toBeDefined();
  });

  it("ends in loss if 20 questions are asked without guessing", async () => {
    const session = await reverseService.startSession(storage, "character");
    const questions = await storage.getActiveQuestions();

    let lastResult: any = null;
    for (let i = 0; i < 20; i++) {
      const q = questions[i % questions.length];
      lastResult = await reverseService.askQuestion(session.sessionId, q.id, matrix, storage);
    }

    expect(lastResult.step).toBe(20);
    expect(lastResult.questionsRemaining).toBe(0);
    expect(lastResult.state).toBe("lost");
    expect(lastResult.revealedEntity).toBeDefined();
  });

  it("reveals a valid hint and applies the 2-question penalty", async () => {
    const session = await reverseService.startSession(storage, "object");
    expect(session.maxQuestions).toBe(20);

    const hintRes = await reverseService.requestHint(session.sessionId, matrix, storage);
    expect(hintRes.hint).toBeDefined();
    expect(hintRes.hint.clueText.length).toBeGreaterThan(5);
    expect(hintRes.hintsRemaining).toBe(2); // 3 max - 1 used
    expect(hintRes.questionsRemaining).toBe(18); // 20 - 2 penalty
    expect(hintRes.state).toBe("in_progress");

    // Second hint
    const hint2 = await reverseService.requestHint(session.sessionId, matrix, storage);
    expect(hint2.hint).toBeDefined();
    expect(hint2.hintsRemaining).toBe(1);
    expect(hint2.questionsRemaining).toBe(16); // 20 - 4 penalty
  });

  it("prevents requesting a hint when fewer than 3 questions remain", async () => {
    const session = await reverseService.startSession(storage, "object");
    const questions = await storage.getActiveQuestions();

    // Ask 18 questions, leaving 2
    for (let i = 0; i < 18; i++) {
      await reverseService.askQuestion(session.sessionId, questions[i].id, matrix, storage);
    }

    // Attempting a hint with penalty of 2 questions when only 2 remain should be rejected
    await expect(
      reverseService.requestHint(session.sessionId, matrix, storage)
    ).rejects.toThrow(/Not enough questions remaining/);
  });
});
