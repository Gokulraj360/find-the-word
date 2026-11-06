import { describe, it, expect } from "vitest";
import { determineDuelWinner, PlayerScore } from "../client/src/twoPlayerUtils.js";

describe("Same-Device 2-Player Duel Logic", () => {
  it("declares lower question count as winner when both solve", () => {
    const p1: PlayerScore = {
      name: "Alice",
      questionsUsed: 7,
      guessesUsed: 1,
      hintsUsed: 0,
      won: true
    };
    const p2: PlayerScore = {
      name: "Bob",
      questionsUsed: 12,
      guessesUsed: 1,
      hintsUsed: 0,
      won: true
    };

    const res = determineDuelWinner(p1, p2);
    expect(res.winner).toBe("player1");
    expect(res.winnerName).toBe("Alice");
    expect(res.reason).toContain("7 vs 12");
  });

  it("declares player who solved as winner if other player lost", () => {
    const p1: PlayerScore = {
      name: "Alice",
      questionsUsed: 20,
      guessesUsed: 3,
      hintsUsed: 0,
      won: false
    };
    const p2: PlayerScore = {
      name: "Bob",
      questionsUsed: 15,
      guessesUsed: 1,
      hintsUsed: 0,
      won: true
    };

    const res = determineDuelWinner(p1, p2);
    expect(res.winner).toBe("player2");
    expect(res.winnerName).toBe("Bob");
  });

  it("breaks tie with fewer guesses used when question counts match", () => {
    const p1: PlayerScore = {
      name: "Alice",
      questionsUsed: 10,
      guessesUsed: 1,
      hintsUsed: 0,
      won: true
    };
    const p2: PlayerScore = {
      name: "Bob",
      questionsUsed: 10,
      guessesUsed: 2,
      hintsUsed: 0,
      won: true
    };

    const res = determineDuelWinner(p1, p2);
    expect(res.winner).toBe("player1");
    expect(res.winnerName).toBe("Alice");
    expect(res.reason).toContain("fewer guesses");
  });

  it("declares tie when both players match on all metrics", () => {
    const p1: PlayerScore = {
      name: "Alice",
      questionsUsed: 9,
      guessesUsed: 1,
      hintsUsed: 1,
      won: true
    };
    const p2: PlayerScore = {
      name: "Bob",
      questionsUsed: 9,
      guessesUsed: 1,
      hintsUsed: 1,
      won: true
    };

    const res = determineDuelWinner(p1, p2);
    expect(res.winner).toBe("tie");
    expect(res.winnerName).toBeNull();
  });
});
