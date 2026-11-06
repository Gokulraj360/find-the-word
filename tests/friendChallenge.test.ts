import { describe, it, expect, beforeAll } from "vitest";
import { InMemoryStorage } from "../server/db/storage.js";
import { FriendChallengeService } from "../server/services/friendChallengeService.js";
import { ReverseGameService } from "../server/services/reverseGameService.js";
import { EngineMatrix } from "../server/engine/matrix.js";

describe("Friend Challenge System", () => {
  let storage: InMemoryStorage;
  let matrix: EngineMatrix;
  let challengeService: FriendChallengeService;
  let reverseService: ReverseGameService;

  beforeAll(async () => {
    storage = new InMemoryStorage();
    await storage.init();
    matrix = new EngineMatrix();
    await matrix.load(storage);
    challengeService = new FriendChallengeService();
    reverseService = new ReverseGameService();
  });

  it("creates a shareable challenge without leaking secret entity to guesser", async () => {
    const activeEntities = await storage.getActiveEntities();
    const object = activeEntities.find((e) => e.category === "object")!;

    const challenge = await challengeService.createChallenge(
      storage,
      "object",
      object.id,
      "Gokul"
    );

    expect(challenge.code).toMatch(/^COG-[A-Z0-9]{4}$/);
    expect(challenge.creatorName).toBe("Gokul");
    expect(challenge.secretEntityId).toBe(object.id);
    expect(challenge.secretEntityName).toBe(object.name);

    // Guesser retrieval should NOT leak secretEntityName
    const safe = challengeService.getChallenge(challenge.code, false);
    expect(safe).toBeDefined();
    expect(safe?.creatorName).toBe("Gokul");
    expect(safe?.domain).toBe("object");
    expect(safe?.revealedEntityName).toBeUndefined();
  });

  it("initializes a reverse session seeded with the friend's secret entity", async () => {
    const activeEntities = await storage.getActiveEntities();
    const targetEntity = activeEntities.find((e) => e.category === "character")!;

    const challenge = await challengeService.createChallenge(
      storage,
      "character",
      targetEntity.id,
      "Rohit"
    );

    const raw = challengeService.getRawChallenge(challenge.code)!;
    expect(raw.secretEntityName).toBe(targetEntity.name);

    const session = await reverseService.startSession(
      storage,
      raw.domain,
      raw.secretEntityId,
      raw.code
    );

    expect(session.challengeCode).toBe(challenge.code);
    const storedSession = reverseService.getSession(session.sessionId)!;
    expect(storedSession.secretEntityName).toBe(targetEntity.name);
  });

  it("updates challenge plays and best score upon completion", async () => {
    const activeEntities = await storage.getActiveEntities();
    const targetEntity = activeEntities[0];

    const challenge = await challengeService.createChallenge(
      storage,
      targetEntity.category || "character",
      targetEntity.id,
      "Virat"
    );

    // Friend B plays and wins in 8 questions
    const res1 = challengeService.recordChallengeCompletion(challenge.code, true, 8);
    expect(res1?.playsCount).toBe(1);
    expect(res1?.bestQuestions).toBe(8);

    // Friend C plays and wins in 5 questions (new best score)
    const res2 = challengeService.recordChallengeCompletion(challenge.code, true, 5);
    expect(res2?.playsCount).toBe(2);
    expect(res2?.bestQuestions).toBe(5);

    // Friend D plays and loses
    const res3 = challengeService.recordChallengeCompletion(challenge.code, false, 20);
    expect(res3?.playsCount).toBe(3);
    expect(res3?.bestQuestions).toBe(5); // Best remains 5
  });
});
