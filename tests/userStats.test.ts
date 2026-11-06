import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  getUserStats,
  saveUserStats,
  recordGameCompletion,
  resetUserStats,
  calculateWinRate,
  DEFAULT_USER_STATS,
  USER_STATS_STORAGE_KEY
} from "../client/src/userStats.js";

describe("User Stats & Streaks Manager", () => {
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

  it("returns default stats when storage is empty", () => {
    const stats = getUserStats();
    expect(stats.gamesPlayed).toBe(0);
    expect(stats.cognitorWins).toBe(0);
    expect(stats.stumpedCount).toBe(0);
    expect(stats.currentStreak).toBe(0);
    expect(stats.bestStreak).toBe(0);
    expect(stats.fastestGuess).toBeNull();
  });

  it("safely handles corrupted storage", () => {
    mockStorage[USER_STATS_STORAGE_KEY] = "not-json-string{";
    const stats = getUserStats();
    expect(stats).toEqual(DEFAULT_USER_STATS);
  });

  it("records a won game (Cognitor deduction confirmed)", () => {
    const res1 = recordGameCompletion("won", 10, "object");
    expect(res1.stats.gamesPlayed).toBe(1);
    expect(res1.stats.cognitorWins).toBe(1);
    expect(res1.stats.stumpedCount).toBe(0);
    expect(res1.stats.currentStreak).toBe(1);
    expect(res1.stats.bestStreak).toBe(1);
    expect(res1.stats.fastestGuess).toBe(10);
    expect(res1.stats.objectsWon).toBe(1);
    expect(res1.isNewBest).toBe(true);
    expect(res1.streakIncremented).toBe(true);

    // Another win with fewer questions (new fastest guess)
    const res2 = recordGameCompletion("won", 8, "character");
    expect(res2.stats.gamesPlayed).toBe(2);
    expect(res2.stats.cognitorWins).toBe(2);
    expect(res2.stats.currentStreak).toBe(2);
    expect(res2.stats.bestStreak).toBe(2);
    expect(res2.stats.fastestGuess).toBe(8);
    expect(res2.stats.charactersWon).toBe(1);
    expect(res2.isNewBest).toBe(true);

    // A win with more questions (not new fastest guess)
    const res3 = recordGameCompletion("won", 12, "object");
    expect(res3.stats.gamesPlayed).toBe(3);
    expect(res3.stats.fastestGuess).toBe(8);
    expect(res3.isNewBest).toBe(false);
  });

  it("resets current streak and increments stumpedCount on lost game", () => {
    // Win two first to build a streak of 2
    recordGameCompletion("won", 9, "object");
    recordGameCompletion("won", 9, "object");

    const statsBeforeLoss = getUserStats();
    expect(statsBeforeLoss.currentStreak).toBe(2);
    expect(statsBeforeLoss.bestStreak).toBe(2);

    // Player outsmarts Cognitor (lost)
    const lostRes = recordGameCompletion("lost", 20, "object");
    expect(lostRes.stats.gamesPlayed).toBe(3);
    expect(lostRes.stats.cognitorWins).toBe(2);
    expect(lostRes.stats.stumpedCount).toBe(1);
    expect(lostRes.stats.currentStreak).toBe(0);
    expect(lostRes.stats.bestStreak).toBe(2); // Best streak preserved
    expect(lostRes.isNewBest).toBe(false);
  });

  it("correctly calculates win rate percentage", () => {
    expect(calculateWinRate(DEFAULT_USER_STATS)).toBe(0);

    const stats = {
      ...DEFAULT_USER_STATS,
      gamesPlayed: 10,
      cognitorWins: 8
    };
    expect(calculateWinRate(stats)).toBe(80);
  });

  it("allows resetting stats back to clean initial state", () => {
    recordGameCompletion("won", 9, "character");
    recordGameCompletion("lost", 20, "character");

    expect(getUserStats().gamesPlayed).toBe(2);

    const reset = resetUserStats();
    expect(reset.gamesPlayed).toBe(0);
    expect(getUserStats().gamesPlayed).toBe(0);
  });
});
