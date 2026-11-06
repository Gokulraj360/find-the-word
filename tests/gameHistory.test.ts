import { describe, it, expect, beforeEach } from "vitest";
import {
  getGameHistory,
  saveGameHistoryEntry,
  clearGameHistory,
  formatRelativeTime,
  MAX_HISTORY_ENTRIES,
  GameHistoryEntry
} from "../client/src/gameHistory.js";

// Mock localStorage for node environment
const mockStorage: Record<string, string> = {};

beforeEach(() => {
  for (const key of Object.keys(mockStorage)) {
    delete mockStorage[key];
  }

  // Define window.localStorage mock
  (global as any).window = {
    localStorage: {
      getItem: (key: string) => mockStorage[key] || null,
      setItem: (key: string, val: string) => {
        mockStorage[key] = val;
      },
      removeItem: (key: string) => {
        delete mockStorage[key];
      }
    }
  };
});

describe("Game History Service", () => {
  it("starts with an empty game history list", () => {
    const list = getGameHistory();
    expect(list).toEqual([]);
  });

  it("saves a new game entry and retrieves it newest-first", () => {
    saveGameHistoryEntry({
      domain: "object",
      difficulty: "easy",
      pack: "all",
      entityName: "Cricket Ball",
      result: "won",
      stumpedCognitor: false,
      questionsCount: 8,
      questions: [
        { step: 1, text: "Is it alive?", answerValue: 0.0, answerLabel: "No" },
        { step: 2, text: "Is it spherical?", answerValue: 1.0, answerLabel: "Yes" }
      ]
    });

    const list = getGameHistory();
    expect(list).toHaveLength(1);
    expect(list[0].entityName).toBe("Cricket Ball");
    expect(list[0].questionsCount).toBe(8);
    expect(list[0].questions).toHaveLength(2);
    expect(list[0].id).toBeDefined();
    expect(list[0].timestamp).toBeGreaterThan(0);
  });

  it("strictly caps saved game history to MAX_HISTORY_ENTRIES (10)", () => {
    for (let i = 1; i <= 15; i++) {
      saveGameHistoryEntry({
        domain: "character",
        difficulty: "hard",
        pack: "all",
        entityName: `Entity ${i}`,
        result: i % 2 === 0 ? "won" : "lost",
        stumpedCognitor: i % 2 !== 0,
        questionsCount: 10 + i,
        questions: []
      });
    }

    const list = getGameHistory();
    expect(list).toHaveLength(MAX_HISTORY_ENTRIES);
    // Newest is Entity 15
    expect(list[0].entityName).toBe("Entity 15");
    // 10th item is Entity 6 (Entities 1-5 dropped off FIFO)
    expect(list[MAX_HISTORY_ENTRIES - 1].entityName).toBe("Entity 6");
  });

  it("clears all game history entries completely", () => {
    saveGameHistoryEntry({
      domain: "object",
      difficulty: "easy",
      pack: "sports",
      entityName: "Basketball",
      result: "won",
      stumpedCognitor: false,
      questionsCount: 7,
      questions: []
    });

    expect(getGameHistory()).toHaveLength(1);
    clearGameHistory();
    expect(getGameHistory()).toHaveLength(0);
  });

  it("formats relative timestamps accurately", () => {
    const baseNow = 1700000000000;

    expect(formatRelativeTime(baseNow - 20 * 1000, baseNow)).toBe("Just now");
    expect(formatRelativeTime(baseNow - 5 * 60 * 1000, baseNow)).toBe("5m ago");
    expect(formatRelativeTime(baseNow - 3 * 3600 * 1000, baseNow)).toBe("3h ago");
    expect(formatRelativeTime(baseNow - 24 * 3600 * 1000, baseNow)).toBe("Yesterday");
    expect(formatRelativeTime(baseNow - 4 * 86400 * 1000, baseNow)).toBe("4d ago");
  });
});
