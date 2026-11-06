import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs";
import path from "path";
import { LeaderboardService } from "../server/services/leaderboardService.js";

describe("Leaderboard Service", () => {
  const tempFilePath = path.resolve(process.cwd(), "data", "test_leaderboard.json");
  let service: LeaderboardService;

  beforeEach(() => {
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
    service = new LeaderboardService(tempFilePath);
  });

  afterEach(() => {
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
  });

  it("initializes with default seed entries when file does not exist", () => {
    const fastest = service.getLeaderboard("fastest_guess", 10);
    expect(fastest.length).toBeGreaterThan(0);
    expect(fastest[0].playerName).toBeDefined();
    expect(fastest[0].score).toBeDefined();

    const streaks = service.getLeaderboard("best_streak", 10);
    expect(streaks.length).toBeGreaterThan(0);

    const stumped = service.getLeaderboard("stumped", 10);
    expect(stumped.length).toBeGreaterThan(0);
  });

  it("sorts fastest_guess in ascending order (fewer questions rank higher)", () => {
    service.submitEntry({
      playerName: "SpeedDemon",
      category: "fastest_guess",
      score: 3,
      entityName: "Laptop",
      domain: "object",
      difficulty: "expert"
    });

    const entries = service.getLeaderboard("fastest_guess", 10);
    expect(entries[0].playerName).toBe("SpeedDemon");
    expect(entries[0].score).toBe(3);

    for (let i = 0; i < entries.length - 1; i++) {
      expect(entries[i].score).toBeLessThanOrEqual(entries[i + 1].score);
    }
  });

  it("sorts best_streak in descending order (higher streaks rank higher)", () => {
    service.submitEntry({
      playerName: "StreakMaster",
      category: "best_streak",
      score: 50,
      difficulty: "expert"
    });

    const entries = service.getLeaderboard("best_streak", 10);
    expect(entries[0].playerName).toBe("StreakMaster");
    expect(entries[0].score).toBe(50);

    for (let i = 0; i < entries.length - 1; i++) {
      expect(entries[i].score).toBeGreaterThanOrEqual(entries[i + 1].score);
    }
  });

  it("sorts stumped category in descending order (higher questions rank higher)", () => {
    service.submitEntry({
      playerName: "PuzzleKing",
      category: "stumped",
      score: 30,
      entityName: "Exotic Mineral",
      domain: "object"
    });

    const entries = service.getLeaderboard("stumped", 10);
    expect(entries[0].playerName).toBe("PuzzleKing");
    expect(entries[0].score).toBe(30);
  });

  it("persists entries across new service instances", () => {
    service.submitEntry({
      playerName: "PersistentPlayer",
      category: "fastest_guess",
      score: 4,
      entityName: "Smartphone",
      domain: "object"
    });

    const reloaded = new LeaderboardService(tempFilePath);
    const entries = reloaded.getLeaderboard("fastest_guess", 10);
    const found = entries.find((e) => e.playerName === "PersistentPlayer");
    expect(found).toBeDefined();
    expect(found?.score).toBe(4);
  });

  it("provides correct summary statistics", () => {
    const summary = service.getSummaryStats();
    expect(summary.totalSubmissions).toBeGreaterThan(0);
    expect(typeof summary.bestFastestGuess).toBe("number");
    expect(typeof summary.highestStreak).toBe("number");
  });
});
