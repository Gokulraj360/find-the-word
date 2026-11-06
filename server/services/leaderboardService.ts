import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

export type LeaderboardCategory = "fastest_guess" | "best_streak" | "stumped" | "daily";

export interface LeaderboardEntry {
  id: string;
  playerName: string;
  category: LeaderboardCategory;
  score: number; // questions count for fastest_guess/daily, streak count for best_streak, questions count for stumped
  entityName?: string;
  domain?: "character" | "object";
  difficulty?: "easy" | "hard" | "expert";
  date: string;
  createdAt: number;
}

const DEFAULT_SEEDS: Omit<LeaderboardEntry, "id" | "createdAt">[] = [
  // Fastest Guesses (fewer questions = better)
  {
    playerName: "LogicMaster",
    category: "fastest_guess",
    score: 5,
    entityName: "Cricket Ball",
    domain: "object",
    difficulty: "expert",
    date: new Date(Date.now() - 3600 * 1000 * 5).toISOString()
  },
  {
    playerName: "Brainstormer",
    category: "fastest_guess",
    score: 6,
    entityName: "Albert Einstein",
    domain: "character",
    difficulty: "hard",
    date: new Date(Date.now() - 3600 * 1000 * 12).toISOString()
  },
  {
    playerName: "QuantumMind",
    category: "fastest_guess",
    score: 6,
    entityName: "Basketball",
    domain: "object",
    difficulty: "easy",
    date: new Date(Date.now() - 3600 * 1000 * 24).toISOString()
  },
  {
    playerName: "EnigmaPro",
    category: "fastest_guess",
    score: 7,
    entityName: "Lionel Messi",
    domain: "character",
    difficulty: "hard",
    date: new Date(Date.now() - 3600 * 1000 * 36).toISOString()
  },
  {
    playerName: "CipherNine",
    category: "fastest_guess",
    score: 7,
    entityName: "Tennis Ball",
    domain: "object",
    difficulty: "easy",
    date: new Date(Date.now() - 3600 * 1000 * 48).toISOString()
  },

  // Best Streaks (higher streak = better)
  {
    playerName: "AkiChampion",
    category: "best_streak",
    score: 18,
    difficulty: "hard",
    date: new Date(Date.now() - 3600 * 1000 * 6).toISOString()
  },
  {
    playerName: "ShadowSolver",
    category: "best_streak",
    score: 14,
    difficulty: "expert",
    date: new Date(Date.now() - 3600 * 1000 * 18).toISOString()
  },
  {
    playerName: "MindReaderX",
    category: "best_streak",
    score: 11,
    difficulty: "easy",
    date: new Date(Date.now() - 3600 * 1000 * 30).toISOString()
  },
  {
    playerName: "OraclePrime",
    category: "best_streak",
    score: 9,
    difficulty: "hard",
    date: new Date(Date.now() - 3600 * 1000 * 42).toISOString()
  },

  // Stumped Hall of Fame (items that outsmarted Cognitor)
  {
    playerName: "MysticThinker",
    category: "stumped",
    score: 25,
    entityName: "Volleyball",
    domain: "object",
    difficulty: "expert",
    date: new Date(Date.now() - 3600 * 1000 * 8).toISOString()
  },
  {
    playerName: "RiddleCrafter",
    category: "stumped",
    score: 25,
    entityName: "Wooden Pencil",
    domain: "object",
    difficulty: "hard",
    date: new Date(Date.now() - 3600 * 1000 * 20).toISOString()
  },
  {
    playerName: "TheGhost",
    category: "stumped",
    score: 20,
    entityName: "Guitar Pick",
    domain: "object",
    difficulty: "hard",
    date: new Date(Date.now() - 3600 * 1000 * 40).toISOString()
  }
];

export class LeaderboardService {
  private entries: LeaderboardEntry[] = [];
  private filePath: string;

  constructor(filePath?: string) {
    this.filePath = filePath || path.resolve(process.cwd(), "data", "leaderboard.json");
    this.loadFromDisk();
  }

  private loadFromDisk() {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, "utf-8");
        this.entries = JSON.parse(raw);
      } else {
        // Initialize with default seeds
        this.entries = DEFAULT_SEEDS.map((s) => ({
          ...s,
          id: uuidv4(),
          createdAt: new Date(s.date).getTime()
        }));
        this.saveToDisk();
      }
    } catch {
      this.entries = DEFAULT_SEEDS.map((s) => ({
        ...s,
        id: uuidv4(),
        createdAt: new Date(s.date).getTime()
      }));
    }
  }

  private saveToDisk() {
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.filePath, JSON.stringify(this.entries, null, 2), "utf-8");
    } catch {
      // Non-blocking fallback
    }
  }

  public getLeaderboard(
    category: LeaderboardCategory = "fastest_guess",
    limit: number = 25
  ): LeaderboardEntry[] {
    const filtered = this.entries.filter((e) => e.category === category);

    // Sorting:
    // fastest_guess / daily: lower score (questions) is better
    // best_streak / stumped: higher score is better
    if (category === "fastest_guess" || category === "daily") {
      filtered.sort((a, b) => {
        if (a.score !== b.score) return a.score - b.score;
        return a.createdAt - b.createdAt; // Earliest date wins tie
      });
    } else {
      filtered.sort((a, b) => {
        if (a.score !== b.score) return b.score - a.score;
        return a.createdAt - b.createdAt;
      });
    }

    return filtered.slice(0, Math.max(1, limit));
  }

  public submitEntry(
    data: Omit<LeaderboardEntry, "id" | "date" | "createdAt">
  ): LeaderboardEntry {
    const cleanName = data.playerName.trim().slice(0, 30) || "Anonymous";
    const now = Date.now();

    const entry: LeaderboardEntry = {
      id: uuidv4(),
      playerName: cleanName,
      category: data.category,
      score: Math.max(1, Math.round(data.score)),
      entityName: data.entityName ? data.entityName.trim().slice(0, 60) : undefined,
      domain: data.domain,
      difficulty: data.difficulty,
      date: new Date(now).toISOString(),
      createdAt: now
    };

    this.entries.push(entry);
    this.saveToDisk();
    return entry;
  }

  public getSummaryStats(): {
    totalSubmissions: number;
    bestFastestGuess: number | null;
    highestStreak: number | null;
  } {
    const fastest = this.getLeaderboard("fastest_guess", 1);
    const streaks = this.getLeaderboard("best_streak", 1);
    return {
      totalSubmissions: this.entries.length,
      bestFastestGuess: fastest.length > 0 ? fastest[0].score : null,
      highestStreak: streaks.length > 0 ? streaks[0].score : null
    };
  }
}

export const leaderboardService = new LeaderboardService();
