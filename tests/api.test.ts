import { describe, it, expect, beforeAll, afterAll } from "vitest";
import express from "express";
import { Server } from "http";
import { InMemoryStorage } from "../server/db/storage.js";
import { EngineMatrix } from "../server/engine/matrix.js";
import { BayesianEngine } from "../server/engine/bayes.js";
import { LearningService } from "../server/engine/learning.js";
import { createApiRouter } from "../server/api/routes.js";

describe("Cognitor REST API Endpoints", () => {
  let app: express.Express;
  let server: Server;
  let baseUrl: string;
  let adminToken: string;

  beforeAll(async () => {
    const storage = new InMemoryStorage();
    await storage.init();
    const matrix = new EngineMatrix();
    await matrix.load(storage);
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

  it("POST /api/game/start should return sessionId and question", async () => {
    const res = await fetch(`${baseUrl}/api/game/start`, { method: "POST" });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.sessionId).toBeDefined();
    expect(data.question).toBeDefined();
    expect(data.question.id).toBeDefined();
    expect(data.question.step).toBe(1);
    expect(typeof data.question.text).toBe("string");
  });

  it("POST /api/game/answer should accept valid answer and return next question or guess", async () => {
    const startRes = await fetch(`${baseUrl}/api/game/start`, { method: "POST" });
    const { sessionId } = await startRes.json();

    const ansRes = await fetch(`${baseUrl}/api/game/answer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, answer: 1.0 })
    });

    expect(ansRes.status).toBe(200);
    const ansData = await ansRes.json();
    expect(ansData.state).toBeDefined();
    if (ansData.state === "in_progress") {
      expect(ansData.question).toBeDefined();
      expect(ansData.question.step).toBe(2);
    } else {
      expect(ansData.guess).toBeDefined();
    }
  });

  it("POST /api/game/back should successfully undo the previous answer", async () => {
    const startRes = await fetch(`${baseUrl}/api/game/start`, { method: "POST" });
    const { sessionId } = await startRes.json();

    await fetch(`${baseUrl}/api/game/answer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, answer: 1.0 })
    });

    const backRes = await fetch(`${baseUrl}/api/game/back`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId })
    });

    expect(backRes.status).toBe(200);
    const backData = await backRes.json();
    expect(backData.question.step).toBe(1);
  });

  it("GET /api/stats should return dataset and gameplay stats", async () => {
    const res = await fetch(`${baseUrl}/api/stats`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.activeEntities).toBe(95);
    expect(data.activeQuestions).toBe(140);
    expect(data.totalGames).toBeGreaterThanOrEqual(1);
  });

  it("POST /api/game/start with domain 'object' should start game in object mode", async () => {
    const res = await fetch(`${baseUrl}/api/game/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ domain: "object" })
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.domain).toBe("object");
    expect(data.sessionId).toBeDefined();
    expect(data.question).toBeDefined();
  });

  it("POST /api/admin/login should validate password and issue JWT", async () => {
    const res = await fetch(`${baseUrl}/api/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: "adminpassword123" })
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.token).toBeDefined();
    adminToken = data.token;
  });

  it("GET /api/admin/submissions should require valid JWT token", async () => {
    const noAuth = await fetch(`${baseUrl}/api/admin/submissions`);
    expect(noAuth.status).toBe(401);

    const withAuth = await fetch(`${baseUrl}/api/admin/submissions`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    expect(withAuth.status).toBe(200);
    const list = await withAuth.json();
    expect(Array.isArray(list)).toBe(true);
  });

  it("POST /api/game/learn should create a submission and admin can approve it", async () => {
    const startRes = await fetch(`${baseUrl}/api/game/start`, { method: "POST" });
    const { sessionId } = await startRes.json();

    const learnRes = await fetch(`${baseUrl}/api/game/learn`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        entityName: "Gollum",
        questionText: "Is your character obsessed with the 'Precious' Ring?",
        answer: 1.0
      })
    });

    expect(learnRes.status).toBe(200);
    const learnData = await learnRes.json();
    expect(learnData.submissionId).toBeDefined();

    // Admin approves the submission
    const approveRes = await fetch(`${baseUrl}/api/admin/submissions/${learnData.submissionId}/approve`, {
      method: "POST",
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    expect(approveRes.status).toBe(200);
    const approveData = await approveRes.json();
    expect(approveData.success).toBe(true);
  });

  it("POST /api/challenge/create and GET /api/challenge/:code should manage friend challenges", async () => {
    // Create challenge
    const createRes = await fetch(`${baseUrl}/api/challenge/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        domain: "character",
        entityId: 1,
        creatorName: "Antigravity"
      })
    });
    expect(createRes.status).toBe(200);
    const challenge = await createRes.json();
    expect(challenge.code).toBeDefined();
    expect(challenge.creatorName).toBe("Antigravity");

    // Retrieve challenge (safe)
    const getRes = await fetch(`${baseUrl}/api/challenge/${challenge.code}`);
    expect(getRes.status).toBe(200);
    const safeData = await getRes.json();
    expect(safeData.creatorName).toBe("Antigravity");
    expect(safeData.domain).toBe("character");
    expect(safeData.revealedEntityName).toBeUndefined(); // Secret kept!

    // Start challenge game
    const startRes = await fetch(`${baseUrl}/api/challenge/${challenge.code}/start`, {
      method: "POST"
    });
    expect(startRes.status).toBe(200);
    const startData = await startRes.json();
    expect(startData.sessionId).toBeDefined();
    expect(startData.challengeCode).toBe(challenge.code);
  });

  it("GET /api/leaderboard and POST /api/leaderboard/submit manage records", async () => {
    // GET leaderboard
    const getRes = await fetch(`${baseUrl}/api/leaderboard?category=fastest_guess`);
    expect(getRes.status).toBe(200);
    const getData = await getRes.json();
    expect(Array.isArray(getData.entries)).toBe(true);
    expect(getData.summary).toBeDefined();
    expect(typeof getData.summary.totalSubmissions).toBe("number");

    // POST submit score
    const postRes = await fetch(`${baseUrl}/api/leaderboard/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        playerName: "TestHero",
        category: "fastest_guess",
        score: 5,
        entityName: "Albert Einstein",
        domain: "character",
        difficulty: "hard"
      })
    });
    expect(postRes.status).toBe(200);
    const postData = await postRes.json();
    expect(postData.success).toBe(true);
    expect(postData.entry).toBeDefined();
    expect(postData.entry.playerName).toBe("TestHero");
    expect(postData.entry.score).toBe(5);
  });
});
