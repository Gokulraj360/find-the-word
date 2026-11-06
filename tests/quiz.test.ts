import { describe, it, expect, beforeAll, afterAll } from "vitest";
import express from "express";
import { Server } from "http";
import { InMemoryStorage } from "../server/db/storage.js";
import { EngineMatrix } from "../server/engine/matrix.js";
import { BayesianEngine } from "../server/engine/bayes.js";
import { LearningService } from "../server/engine/learning.js";
import { createApiRouter } from "../server/api/routes.js";
import { QuizService } from "../server/services/quizService.js";

describe("Quick Quiz Mode System", () => {
  let storage: InMemoryStorage;
  let matrix: EngineMatrix;
  let quizService: QuizService;

  beforeAll(async () => {
    storage = new InMemoryStorage();
    await storage.init();
    matrix = new EngineMatrix();
    await matrix.load(storage);
    quizService = new QuizService();
  });

  it("generates a valid 5-question quiz session with 4 unique options per question", async () => {
    const quiz = await quizService.startQuiz(matrix, storage, "all", 5);
    expect(quiz.sessionId).toBeDefined();
    expect(quiz.totalQuestions).toBe(5);
    expect(quiz.question).toBeDefined();
    expect(quiz.question.options.length).toBe(4);

    // Ensure all 4 option IDs are distinct
    const ids = quiz.question.options.map((o) => o.entityId);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(4);

    // Ensure prompt is valid
    expect(quiz.question.prompt.length).toBeGreaterThan(5);
  });

  it("enforces domain filtering for character and object modes", async () => {
    const charQuiz = await quizService.startQuiz(matrix, storage, "character", 3);
    for (const opt of charQuiz.question.options) {
      expect(opt.category).toBe("character");
    }

    const objQuiz = await quizService.startQuiz(matrix, storage, "object", 3);
    for (const opt of objQuiz.question.options) {
      expect(opt.category).toBe("object");
    }
  });

  it("correctly validates answers and advances through questions to completion", async () => {
    const quiz = await quizService.startQuiz(matrix, storage, "all", 3);
    const rawSession = quizService.getSession(quiz.sessionId);
    expect(rawSession).not.toBeNull();
    if (!rawSession) return;

    // First question: answer correctly
    const q0 = rawSession.questions[0];
    const ans0 = quizService.answerQuestion(quiz.sessionId, 0, q0.targetEntityId);
    expect(ans0.correct).toBe(true);
    expect(ans0.currentScore).toBe(1);
    expect(ans0.isFinished).toBe(false);
    expect(ans0.nextQuestion).toBeDefined();

    // Second question: intentionally answer incorrectly using a distractor
    const q1 = rawSession.questions[1];
    const wrongOpt = q1.options.find((o) => o.entityId !== q1.targetEntityId);
    expect(wrongOpt).toBeDefined();
    if (!wrongOpt) return;

    const ans1 = quizService.answerQuestion(quiz.sessionId, 1, wrongOpt.entityId);
    expect(ans1.correct).toBe(false);
    expect(ans1.currentScore).toBe(1);
    expect(ans1.isFinished).toBe(false);

    // Third question: answer correctly to finish
    const q2 = rawSession.questions[2];
    const ans2 = quizService.answerQuestion(quiz.sessionId, 2, q2.targetEntityId);
    expect(ans2.correct).toBe(true);
    expect(ans2.currentScore).toBe(2);
    expect(ans2.isFinished).toBe(true);
    expect(ans2.nextQuestion).toBeNull();
  });

  describe("API Endpoints", () => {
    let app: express.Express;
    let server: Server;
    let baseUrl: string;

    beforeAll(async () => {
      const engine = new BayesianEngine(matrix);
      const learning = new LearningService(storage, matrix);

      app = express();
      app.use(express.json());
      app.use("/api", createApiRouter(storage, matrix, engine, learning));

      await new Promise<void>((resolve) => {
        server = app.listen(0, () => {
          const address = server.address() as any;
          baseUrl = `http://localhost:${address.port}`;
          resolve();
        });
      });
    });

    afterAll(async () => {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    });

    it("POST /api/quiz/start and POST /api/quiz/answer manage quiz loop", async () => {
      const startRes = await fetch(`${baseUrl}/api/quiz/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: "object", length: 4 })
      });

      expect(startRes.status).toBe(200);
      const startData = await startRes.json();
      expect(startData.sessionId).toBeDefined();
      expect(startData.totalQuestions).toBe(4);
      expect(startData.question.options.length).toBe(4);

      // State check
      const stateRes = await fetch(`${baseUrl}/api/quiz/state/${startData.sessionId}`);
      expect(stateRes.status).toBe(200);
      const stateData = await stateRes.json();
      expect(stateData.score).toBe(0);
      expect(stateData.currentQuestionIndex).toBe(0);

      // Answer question 0
      const selectedId = startData.question.options[0].entityId;
      const ansRes = await fetch(`${baseUrl}/api/quiz/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: startData.sessionId,
          questionIndex: 0,
          selectedEntityId: selectedId
        })
      });

      expect(ansRes.status).toBe(200);
      const ansData = await ansRes.json();
      expect(typeof ansData.correct).toBe("boolean");
      expect(ansData.explanation).toBeDefined();
    });
  });
});
