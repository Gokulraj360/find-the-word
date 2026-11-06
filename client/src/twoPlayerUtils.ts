export interface PlayerScore {
  name: string;
  questionsUsed: number;
  guessesUsed: number;
  won: boolean;
  hintsUsed: number;
  entityName?: string;
  imageUrl?: string | null;
}

export type DuelWinner = "player1" | "player2" | "tie";

export interface DuelResult {
  winner: DuelWinner;
  winnerName: string | null;
  reason: string;
}

export function determineDuelWinner(p1: PlayerScore, p2: PlayerScore): DuelResult {
  // If only one player solved it
  if (p1.won && !p2.won) {
    return {
      winner: "player1",
      winnerName: p1.name,
      reason: `${p1.name} solved the secret while ${p2.name} was stumped!`
    };
  }
  if (!p1.won && p2.won) {
    return {
      winner: "player2",
      winnerName: p2.name,
      reason: `${p2.name} solved the secret while ${p1.name} was stumped!`
    };
  }
  if (!p1.won && !p2.won) {
    return {
      winner: "tie",
      winnerName: null,
      reason: "Both players were stumped by Cognitor!"
    };
  }

  // Both solved: lower question count wins
  if (p1.questionsUsed < p2.questionsUsed) {
    return {
      winner: "player1",
      winnerName: p1.name,
      reason: `${p1.name} deduced the secret in fewer questions (${p1.questionsUsed} vs ${p2.questionsUsed})!`
    };
  }
  if (p2.questionsUsed < p1.questionsUsed) {
    return {
      winner: "player2",
      winnerName: p2.name,
      reason: `${p2.name} deduced the secret in fewer questions (${p2.questionsUsed} vs ${p1.questionsUsed})!`
    };
  }

  // Tie-breaker 1: Fewer guesses used
  if (p1.guessesUsed < p2.guessesUsed) {
    return {
      winner: "player1",
      winnerName: p1.name,
      reason: `Both took ${p1.questionsUsed} questions, but ${p1.name} solved it with fewer guesses (${p1.guessesUsed} vs ${p2.guessesUsed})!`
    };
  }
  if (p2.guessesUsed < p1.guessesUsed) {
    return {
      winner: "player2",
      winnerName: p2.name,
      reason: `Both took ${p1.questionsUsed} questions, but ${p2.name} solved it with fewer guesses (${p2.guessesUsed} vs ${p1.guessesUsed})!`
    };
  }

  // Tie-breaker 2: Fewer hints used
  if (p1.hintsUsed < p2.hintsUsed) {
    return {
      winner: "player1",
      winnerName: p1.name,
      reason: `Both used ${p1.questionsUsed} questions, but ${p1.name} used fewer hints!`
    };
  }
  if (p2.hintsUsed < p1.hintsUsed) {
    return {
      winner: "player2",
      winnerName: p2.name,
      reason: `Both used ${p1.questionsUsed} questions, but ${p2.name} used fewer hints!`
    };
  }

  return {
    winner: "tie",
    winnerName: null,
    reason: `An absolute tie! Both deduced their secrets in ${p1.questionsUsed} questions and ${p1.guessesUsed} guess${p1.guessesUsed === 1 ? "" : "es"}!`
  };
}
