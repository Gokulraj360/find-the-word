import { UserStats } from "./userStats.js";

export interface Achievement {
  id: string;
  title: string;
  description: string;
  category: "speed" | "streak" | "stumped" | "mastery";
  currentProgress: number;
  maxProgress: number;
  unlocked: boolean;
  unlockedAt: string | null;
}

export interface GameContext {
  outcome: "won" | "lost";
  questionsUsed: number;
  domain: "character" | "object";
  difficulty?: "easy" | "hard" | "expert";
}

export interface AchievementDefinition {
  id: string;
  title: string;
  description: string;
  category: "speed" | "streak" | "stumped" | "mastery";
  maxProgress: number;
  getProgress: (stats: UserStats, lastGame?: GameContext) => number;
  isUnlocked: (stats: UserStats, lastGame?: GameContext) => boolean;
}

export const ACHIEVEMENTS_REGISTRY: AchievementDefinition[] = [
  {
    id: "first_win",
    title: "First Mind Read",
    description: "Successfully complete your first deduction",
    category: "mastery",
    maxProgress: 1,
    getProgress: (stats) => Math.min(1, stats.cognitorWins),
    isUnlocked: (stats) => stats.cognitorWins >= 1
  },
  {
    id: "speed_under_8",
    title: "Lightning Deduction",
    description: "Guessed in under 8 questions",
    category: "speed",
    maxProgress: 1,
    getProgress: (stats) => (stats.fastestGuess !== null && stats.fastestGuess < 8 ? 1 : 0),
    isUnlocked: (stats) => stats.fastestGuess !== null && stats.fastestGuess < 8
  },
  {
    id: "stumped_3",
    title: "The Elusive Mind",
    description: "Stumped Cognitor 3 times",
    category: "stumped",
    maxProgress: 3,
    getProgress: (stats) => Math.min(3, stats.stumpedCount),
    isUnlocked: (stats) => stats.stumpedCount >= 3
  },
  {
    id: "streak_5",
    title: "Sharp Intuition",
    description: "Achieve a streak of 5 consecutive deductions",
    category: "streak",
    maxProgress: 5,
    getProgress: (stats) => Math.min(5, Math.max(stats.currentStreak, stats.bestStreak)),
    isUnlocked: (stats) => stats.bestStreak >= 5
  },
  {
    id: "streak_10",
    title: "Unstoppable Flow",
    description: "Achieve a streak of 10 consecutive deductions",
    category: "streak",
    maxProgress: 10,
    getProgress: (stats) => Math.min(10, Math.max(stats.currentStreak, stats.bestStreak)),
    isUnlocked: (stats) => stats.bestStreak >= 10
  },
  {
    id: "games_10",
    title: "Seasoned Player",
    description: "Complete 10 total games",
    category: "mastery",
    maxProgress: 10,
    getProgress: (stats) => Math.min(10, stats.gamesPlayed),
    isUnlocked: (stats) => stats.gamesPlayed >= 10
  },
  {
    id: "dual_scholar",
    title: "Dual Mastery",
    description: "Solve at least 1 Character and 1 Object round",
    category: "mastery",
    maxProgress: 2,
    getProgress: (stats) => (stats.charactersWon > 0 ? 1 : 0) + (stats.objectsWon > 0 ? 1 : 0),
    isUnlocked: (stats) => stats.charactersWon > 0 && stats.objectsWon > 0
  },
  {
    id: "expert_win",
    title: "Master Deductive Mind",
    description: "Solve a game on Expert mode within 15 questions",
    category: "mastery",
    maxProgress: 1,
    getProgress: (_stats, lastGame) => (lastGame?.outcome === "won" && lastGame?.difficulty === "expert" ? 1 : 0),
    isUnlocked: (_stats, lastGame) => Boolean(lastGame?.outcome === "won" && lastGame?.difficulty === "expert")
  }
];

export const ACHIEVEMENTS_STORAGE_KEY = "cognitor_achievements";

export function getStoredUnlockMap(): Record<string, string> {
  if (typeof window === "undefined" || !window.localStorage) return {};
  try {
    const raw = window.localStorage.getItem(ACHIEVEMENTS_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function saveUnlockMap(map: Record<string, string>): void {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    window.localStorage.setItem(ACHIEVEMENTS_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // fallback
  }
}

export function getAllAchievements(stats: UserStats): Achievement[] {
  const unlockMap = getStoredUnlockMap();
  return ACHIEVEMENTS_REGISTRY.map((def) => {
    const isUnlocked = Boolean(unlockMap[def.id]) || def.isUnlocked(stats);
    const unlockedAt = unlockMap[def.id] || (isUnlocked ? new Date().toISOString() : null);
    const currentProgress = isUnlocked ? def.maxProgress : def.getProgress(stats);

    return {
      id: def.id,
      title: def.title,
      description: def.description,
      category: def.category,
      currentProgress,
      maxProgress: def.maxProgress,
      unlocked: isUnlocked,
      unlockedAt
    };
  });
}

export interface CheckAchievementsResult {
  achievements: Achievement[];
  newlyUnlocked: Achievement[];
}

export function checkAndUnlockAchievements(
  stats: UserStats,
  gameContext?: GameContext
): CheckAchievementsResult {
  const unlockMap = getStoredUnlockMap();
  const newlyUnlocked: Achievement[] = [];
  const updatedMap = { ...unlockMap };
  let mapModified = false;

  const achievements = ACHIEVEMENTS_REGISTRY.map((def) => {
    const wasAlreadyUnlocked = Boolean(unlockMap[def.id]);
    const nowUnlocked = wasAlreadyUnlocked || def.isUnlocked(stats, gameContext);

    let unlockTimestamp = unlockMap[def.id] || null;

    if (nowUnlocked && !wasAlreadyUnlocked) {
      unlockTimestamp = new Date().toISOString();
      updatedMap[def.id] = unlockTimestamp;
      mapModified = true;
    }

    const currentProgress = nowUnlocked ? def.maxProgress : def.getProgress(stats, gameContext);

    const achievement: Achievement = {
      id: def.id,
      title: def.title,
      description: def.description,
      category: def.category,
      currentProgress,
      maxProgress: def.maxProgress,
      unlocked: nowUnlocked,
      unlockedAt: unlockTimestamp
    };

    if (nowUnlocked && !wasAlreadyUnlocked) {
      newlyUnlocked.push(achievement);
    }

    return achievement;
  });

  if (mapModified) {
    saveUnlockMap(updatedMap);
  }

  return { achievements, newlyUnlocked };
}

export function resetAchievements(): void {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    window.localStorage.removeItem(ACHIEVEMENTS_STORAGE_KEY);
  } catch {
    // fallback
  }
}
