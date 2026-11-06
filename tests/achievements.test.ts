import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  checkAndUnlockAchievements,
  getAllAchievements,
  resetAchievements,
  ACHIEVEMENTS_STORAGE_KEY
} from "../client/src/achievements.js";
import { DEFAULT_USER_STATS, UserStats } from "../client/src/userStats.js";

describe("Achievements Engine", () => {
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

  it("evaluates all achievements as locked initially with 0 progress", () => {
    const list = getAllAchievements(DEFAULT_USER_STATS);
    expect(list.length).toBeGreaterThanOrEqual(7);
    for (const ach of list) {
      expect(ach.unlocked).toBe(false);
      expect(ach.unlockedAt).toBeNull();
      expect(ach.currentProgress).toBe(0);
    }
  });

  it("unlocks first_win and lightning deduction when winning under 8 questions", () => {
    const stats: UserStats = {
      ...DEFAULT_USER_STATS,
      gamesPlayed: 1,
      cognitorWins: 1,
      fastestGuess: 7,
      currentStreak: 1,
      bestStreak: 1,
      charactersWon: 1
    };

    const res = checkAndUnlockAchievements(stats, {
      outcome: "won",
      questionsUsed: 7,
      domain: "character"
    });

    const unlockedIds = res.newlyUnlocked.map((a) => a.id);
    expect(unlockedIds).toContain("first_win");
    expect(unlockedIds).toContain("speed_under_8");
    expect(unlockedIds).not.toContain("stumped_3");

    // Second check without changes should have empty newlyUnlocked
    const res2 = checkAndUnlockAchievements(stats);
    expect(res2.newlyUnlocked).toHaveLength(0);
  });

  it("unlocks stumped_3 when player outsmarts Cognitor 3 times", () => {
    const stats: UserStats = {
      ...DEFAULT_USER_STATS,
      gamesPlayed: 3,
      stumpedCount: 3
    };

    const res = checkAndUnlockAchievements(stats);
    const stumpedBadge = res.achievements.find((a) => a.id === "stumped_3");
    expect(stumpedBadge?.unlocked).toBe(true);
    expect(stumpedBadge?.currentProgress).toBe(3);
    expect(stumpedBadge?.maxProgress).toBe(3);
  });

  it("tracks progress correctly for incomplete achievements", () => {
    const stats: UserStats = {
      ...DEFAULT_USER_STATS,
      gamesPlayed: 4,
      stumpedCount: 2
    };

    const list = getAllAchievements(stats);
    const stumped = list.find((a) => a.id === "stumped_3");
    expect(stumped?.unlocked).toBe(false);
    expect(stumped?.currentProgress).toBe(2);
    expect(stumped?.maxProgress).toBe(3);

    const games = list.find((a) => a.id === "games_10");
    expect(games?.currentProgress).toBe(4);
    expect(games?.maxProgress).toBe(10);
  });

  it("unlocks dual_scholar when both domains have at least one solve", () => {
    const statsOnlyChar: UserStats = {
      ...DEFAULT_USER_STATS,
      charactersWon: 2,
      objectsWon: 0
    };
    expect(getAllAchievements(statsOnlyChar).find((a) => a.id === "dual_scholar")?.unlocked).toBe(false);

    const statsBoth: UserStats = {
      ...DEFAULT_USER_STATS,
      charactersWon: 1,
      objectsWon: 1
    };
    expect(getAllAchievements(statsBoth).find((a) => a.id === "dual_scholar")?.unlocked).toBe(true);
  });

  it("clears achievements on resetAchievements()", () => {
    const stats: UserStats = {
      ...DEFAULT_USER_STATS,
      cognitorWins: 1
    };
    checkAndUnlockAchievements(stats);
    expect(mockStorage[ACHIEVEMENTS_STORAGE_KEY]).toBeDefined();

    resetAchievements();
    expect(mockStorage[ACHIEVEMENTS_STORAGE_KEY]).toBeUndefined();
  });
});
