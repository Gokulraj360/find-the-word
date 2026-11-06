import { describe, it, expect, beforeAll, afterAll } from "vitest";
import express from "express";
import { Server } from "http";
import { InMemoryStorage } from "../server/db/storage.js";
import { EngineMatrix } from "../server/engine/matrix.js";
import { BayesianEngine } from "../server/engine/bayes.js";
import { LearningService } from "../server/engine/learning.js";
import { createApiRouter } from "../server/api/routes.js";
import { getFunFactForEntity, CURATED_FUN_FACTS } from "../server/services/funFactService.js";

describe("Fun Fact System", () => {
  it("provides curated facts for existing characters and objects", () => {
    // Albert Einstein (ID 1)
    const einsteinFact = getFunFactForEntity(1, "Albert Einstein", "character");
    expect(einsteinFact).toContain("photoelectric effect");

    // Marie Curie (ID 11)
    const curieFact = getFunFactForEntity(11, "Marie Curie", "character");
    expect(curieFact).toContain("Nobel Prizes");

    // Smartphone (ID 51)
    const phoneFact = getFunFactForEntity(51, "Smartphone", "object");
    expect(phoneFact).toContain("Apollo 11");

    // Cricket Ball (ID 96)
    const cricketFact = getFunFactForEntity(96, "Cricket Ball", "object");
    expect(cricketFact).toContain("leather");

    // Apple (ID 101)
    const appleFact = getFunFactForEntity(101, "Apple", "object");
    expect(appleFact).toContain("seeds");
  });

  it("covers all 103 seeded database entities with curated facts", () => {
    for (let id = 1; id <= 103; id++) {
      expect(CURATED_FUN_FACTS[id]).toBeDefined();
      expect(CURATED_FUN_FACTS[id].length).toBeGreaterThan(15);
    }
  });

  it("provides graceful fallback synthesis for unknown or dynamic entities", () => {
    const customFact = getFunFactForEntity(
      9999,
      "Quantum Computer",
      "object",
      "Advanced computational device using qubits"
    );
    expect(customFact).toContain("Quantum Computer");
    expect(customFact).toContain("qubits");

    const fallbackCharacter = getFunFactForEntity(8888, "Mysterious Hero", "character");
    expect(fallbackCharacter).toContain("Mysterious Hero");
    expect(fallbackCharacter).toContain("notable figures");
  });

  describe("API and Matrix Integration", () => {
    let app: express.Express;
    let server: Server;
    let baseUrl: string;

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

    it("GET /api/entity/:id/fun-fact returns valid entity fun fact", async () => {
      const res = await fetch(`${baseUrl}/api/entity/1/fun-fact`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.entityId).toBe(1);
      expect(data.name).toBe("Albert Einstein");
      expect(typeof data.funFact).toBe("string");
      expect(data.funFact).toContain("photoelectric effect");
    });

    it("GET /api/entity/:id/fun-fact returns 404 for nonexistent entity", async () => {
      const res = await fetch(`${baseUrl}/api/entity/999999/fun-fact`);
      expect(res.status).toBe(404);
    });
  });
});
