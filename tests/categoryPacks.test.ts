import { describe, it, expect, beforeAll, afterAll } from "vitest";
import express from "express";
import path from "path";
import { Server } from "http";
import { InMemoryStorage } from "../server/db/storage.js";
import { EngineMatrix } from "../server/engine/matrix.js";
import { BayesianEngine } from "../server/engine/bayes.js";
import { GameSessionManager } from "../server/engine/session.js";
import { LearningService } from "../server/engine/learning.js";
import { createApiRouter } from "../server/api/routes.js";
import {
  getAvailableCategoryPacks,
  getCategoryPackIndices,
  CategoryPackId
} from "../server/services/categoryPackService.js";

describe("Thematic Category Packs System", () => {
  let storage: InMemoryStorage;
  let matrix: EngineMatrix;
  let engine: BayesianEngine;

  beforeAll(async () => {
    const dbPath = path.resolve(process.cwd(), "data", "local_db.json");
    storage = new InMemoryStorage(dbPath);
    await storage.init();
    matrix = new EngineMatrix();
    await matrix.load(storage);
    engine = new BayesianEngine(matrix);
  });

  it("retrieves available category packs with valid counts and sample items", () => {
    const packs = getAvailableCategoryPacks(matrix);
    expect(packs.length).toBeGreaterThanOrEqual(5);

    const packIds = packs.map((p) => p.id);
    expect(packIds).toContain("all");
    expect(packIds).toContain("sports");
    expect(packIds).toContain("electronics");
    expect(packIds).toContain("food");
    expect(packIds).toContain("animals");

    for (const p of packs) {
      expect(p.itemCount).toBeGreaterThan(0);
      expect(p.title.length).toBeGreaterThan(2);
      expect(p.sampleItems.length).toBeGreaterThan(0);
    }
  });

  it("restricts indices correctly for the sports pack", () => {
    const sportsIndices = getCategoryPackIndices("sports", matrix);
    expect(sportsIndices.length).toBeGreaterThanOrEqual(10);

    const names = sportsIndices.map((i) => matrix.entities[i].name);
    expect(names).toContain("Cristiano Ronaldo");
    expect(names).toContain("Cricket Ball");
    expect(names).toContain("Basketball");
    expect(names).not.toContain("Albert Einstein");
  });

  it("restricts indices correctly for the electronics pack", () => {
    const elecIndices = getCategoryPackIndices("electronics", matrix);
    expect(elecIndices.length).toBeGreaterThanOrEqual(15);

    const names = elecIndices.map((i) => matrix.entities[i].name);
    expect(names).toContain("Smartphone");
    expect(names).toContain("Laptop Computer");
    expect(names).toContain("Steve Jobs");
    expect(names).not.toContain("Tomato");
  });

  it("restricts indices correctly for the food pack", () => {
    const foodIndices = getCategoryPackIndices("food", matrix);
    expect(foodIndices.length).toBeGreaterThanOrEqual(8);

    const names = foodIndices.map((i) => matrix.entities[i].name);
    expect(names).toContain("Apple");
    expect(names).toContain("Tomato");
    expect(names).toContain("Kitchen Knife");
    expect(names).not.toContain("Serena Williams");
  });

  it("initializes a Bayesian session with category pack prior masking", () => {
    const session = new GameSessionManager(
      "test-session-sports",
      matrix,
      engine,
      "object",
      "easy",
      "sports"
    );
    expect(session.categoryPack).toBe("sports");

    const sportsIndices = new Set(getCategoryPackIndices("sports", matrix, "object"));

    // Check posterior probabilities: non-sports items must be 0
    let totalProbability = 0;
    for (let i = 0; i < matrix.numEntities; i++) {
      if (!sportsIndices.has(i)) {
        expect(session.posterior[i]).toBe(0);
      } else {
        totalProbability += session.posterior[i];
      }
    }
    expect(totalProbability).toBeCloseTo(1.0, 3);

    // Candidates must only come from the sports pack
    const candidates = engine.getTopCandidates(session.posterior, 5, "object", "sports");
    for (const c of candidates) {
      expect(sportsIndices.has(c.entityIdx)).toBe(true);
    }
  });

  describe("API Integration", () => {
    let app: express.Express;
    let server: Server;
    let baseUrl: string;

    beforeAll(async () => {
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

    it("GET /api/packs returns list of packs", async () => {
      const res = await fetch(`${baseUrl}/api/packs`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(Array.isArray(data.packs)).toBe(true);
      expect(data.packs.length).toBeGreaterThanOrEqual(5);
    });

    it("POST /api/game/start with categoryPack sets session pack", async () => {
      const res = await fetch(`${baseUrl}/api/game/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domain: "object",
          categoryPack: "food",
          difficulty: "easy"
        })
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.sessionId).toBeDefined();
      expect(data.categoryPack).toBe("food");
    });
  });
});
