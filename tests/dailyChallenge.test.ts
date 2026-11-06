import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { computeDailyChallenge } from "../server/services/dailyChallengeService.js";
import {
  recordDailyCompletion,
  getTodayResult,
  getDailyStreak,
  generateShareText,
  DAILY_HISTORY_KEY,
  DAILY_STREAK_KEY
} from "../client/src/dailyChallenge.js";

describe("Daily Challenge System", () => {
  const dummyEntities: any[] = [
    { id: 1, name: "Albert Einstein", category: "character", status: "active", description: "Physicist" },
    { id: 2, name: "Cricket Ball", category: "object", status: "active", description: "Leather ball" },
    { id: 3, name: "Tomato", category: "object", status: "active", description: "Red fruit" },
    { id: 4, name: "Leonardo da Vinci", category: "character", status: "active", description: "Polymath" },
    { id: 5, name: "Inactive Item", category: "object", status: "inactive", description: "Hidden" }
  ];

  let mockStorage: Record<string, string> = {};

  beforeEach(() => {
    mockStorage = {};
    (globalThis as any).window = {
      localStorage: {
        getItem: (key: string) => mockStorage[key] ?? null,
        setItem: (key: string, val: string) => {
          mockStorage[key] = val;
        },
        removeItem: (key: string) => {
          delete mockStorage[key];
        },
        clear: () => {
          mockStorage = {};
        }
      }
    };
  });

  afterEach(() => {
    delete (globalThis as any).window;
  });

  describe("Server computeDailyChallenge", () => {
    it("deterministically returns the same entity for the same date", () => {
      const c1 = computeDailyChallenge(dummyEntities, "2026-11-06");
      const c2 = computeDailyChallenge(dummyEntities, "2026-11-06");
      expect(c1.entity.id).toBe(c2.entity.id);
      expect(c1.entity.name).toBe(c2.entity.name);
      expect(c1.dayNumber).toBe(c2.dayNumber);
      expect(c1.date).toBe("2026-11-06");
    });

    it("never selects inactive entities", () => {
      // Test over 30 days
      for (let day = 1; day <= 30; day++) {
        const dStr = `2026-11-${day.toString().padStart(2, "0")}`;
        const challenge = computeDailyChallenge(dummyEntities, dStr);
        expect(challenge.entity.id).not.toBe(5);
        expect(["Albert Einstein", "Cricket Ball", "Tomato", "Leonardo da Vinci"]).toContain(challenge.entity.name);
      }
    });
  });

  describe("Client daily persistence and share text", () => {
    const sampleChallenge = {
      date: "2026-11-06",
      dayNumber: 1042,
      entity: {
        id: 3,
        name: "Tomato",
        domain: "object" as const,
        description: "Red fruit",
        imageUrl: null
      }
    };

    it("records daily completion and computes streak correctly", () => {
      expect(getTodayResult("2026-11-06")).toBeNull();

      const { result, streak } = recordDailyCompletion(sampleChallenge, true, 8);
      expect(result.won).toBe(true);
      expect(result.questionsCount).toBe(8);
      expect(streak.currentStreak).toBe(1);
      expect(streak.bestStreak).toBe(1);

      const saved = getTodayResult("2026-11-06");
      expect(saved?.targetName).toBe("Tomato");
      expect(saved?.questionsCount).toBe(8);
    });

    it("advances daily streak on consecutive days", () => {
      // Day 1
      recordDailyCompletion(sampleChallenge, true, 9);
      expect(getDailyStreak().currentStreak).toBe(1);

      // Day 2 (consecutive)
      const nextDayChallenge = {
        date: "2026-11-07",
        dayNumber: 1043,
        entity: { id: 2, name: "Cricket Ball", domain: "object" as const, description: null, imageUrl: null }
      };
      const resDay2 = recordDailyCompletion(nextDayChallenge, true, 10);
      expect(resDay2.streak.currentStreak).toBe(2);
      expect(resDay2.streak.bestStreak).toBe(2);

      // Day 4 (gap of 2 days, breaks streak back to 1)
      const day4Challenge = {
        date: "2026-11-09",
        dayNumber: 1045,
        entity: { id: 1, name: "Albert Einstein", domain: "character" as const, description: null, imageUrl: null }
      };
      const resDay4 = recordDailyCompletion(day4Challenge, false, 20);
      expect(resDay4.streak.currentStreak).toBe(1);
      expect(resDay4.streak.bestStreak).toBe(2); // Best streak preserved
    });

    it("generates clean, shareable text without spoilers", () => {
      const res = {
        date: "2026-11-06",
        dayNumber: 1042,
        targetId: 3,
        targetName: "Tomato",
        won: true,
        questionsCount: 8,
        completedAt: new Date().toISOString()
      };
      const text = generateShareText(res, 3);
      expect(text).toContain("Cognitor Daily #1042 (2026-11-06)");
      expect(text).toContain("Guessed in: 8 questions");
      expect(text).toContain("Daily Streak: 3 days");
      expect(text).toContain("Can you beat my score?");
    });
  });
});
