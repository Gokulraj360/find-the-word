export interface UserStats {
  gamesPlayed: number;
  cognitorWins: number;
  stumpedCount: number;
  fastestGuess: number | null;
  currentStreak: number;
  bestStreak: number;
  charactersWon: number;
  objectsWon: number;
  lastPlayedAt: string | null;
}

export const DEFAULT_USER_STATS: UserStats = {
  gamesPlayed: 0,
  cognitorWins: 0,
  stumpedCount: 0,
  fastestGuess: null,
  currentStreak: 0,
  bestStreak: 0,
  charactersWon: 0,
  objectsWon: 0,
  lastPlayedAt: null
};

export const USER_STATS_STORAGE_KEY = "cognitor_player_stats";

export function getUserStats(): UserStats {
  if (typeof window === "undefined" || !window.localStorage) {
    return { ...DEFAULT_USER_STATS };
  }
  try {
    const raw = window.localStorage.getItem(USER_STATS_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_USER_STATS };
    const parsed = JSON.parse(raw);
    return {
      gamesPlayed: typeof parsed.gamesPlayed === "number" ? parsed.gamesPlayed : 0,
      cognitorWins: typeof parsed.cognitorWins === "number" ? parsed.cognitorWins : 0,
      stumpedCount: typeof parsed.stumpedCount === "number" ? parsed.stumpedCount : 0,
      fastestGuess: typeof parsed.fastestGuess === "number" ? parsed.fastestGuess : null,
      currentStreak: typeof parsed.currentStreak === "number" ? parsed.currentStreak : 0,
      bestStreak: typeof parsed.bestStreak === "number" ? parsed.bestStreak : 0,
      charactersWon: typeof parsed.charactersWon === "number" ? parsed.charactersWon : 0,
      objectsWon: typeof parsed.objectsWon === "number" ? parsed.objectsWon : 0,
      lastPlayedAt: typeof parsed.lastPlayedAt === "string" ? parsed.lastPlayedAt : null
    };
  } catch {
    return { ...DEFAULT_USER_STATS };
  }
}

export function saveUserStats(stats: UserStats): void {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    window.localStorage.setItem(USER_STATS_STORAGE_KEY, JSON.stringify(stats));
  } catch {
    // Fallback for quota restrictions or private browsing
  }
}

export interface RecordResultOutcome {
  stats: UserStats;
  isNewBest: boolean;
  streakIncremented: boolean;
}

export function recordGameCompletion(
  outcome: "won" | "lost",
  questionsCount: number,
  domain: "character" | "object"
): RecordResultOutcome {
  const current = getUserStats();
  let isNewBest = false;
  let streakIncremented = false;

  if (outcome === "won") {
    const newWins = current.cognitorWins + 1;
    const newStreak = current.currentStreak + 1;
    streakIncremented = true;
    const newBestStreak = Math.max(current.bestStreak, newStreak);

    if (questionsCount > 0) {
      if (current.fastestGuess === null || questionsCount < current.fastestGuess) {
        isNewBest = true;
      }
    }

    const fastest = isNewBest
      ? questionsCount
      : current.fastestGuess ?? (questionsCount > 0 ? questionsCount : null);

    const updated: UserStats = {
      ...current,
      gamesPlayed: current.gamesPlayed + 1,
      cognitorWins: newWins,
      currentStreak: newStreak,
      bestStreak: newBestStreak,
      fastestGuess: fastest,
      charactersWon: domain === "character" ? current.charactersWon + 1 : current.charactersWon,
      objectsWon: domain === "object" ? current.objectsWon + 1 : current.objectsWon,
      lastPlayedAt: new Date().toISOString()
    };
    saveUserStats(updated);
    return { stats: updated, isNewBest, streakIncremented };
  } else {
    const updated: UserStats = {
      ...current,
      gamesPlayed: current.gamesPlayed + 1,
      stumpedCount: current.stumpedCount + 1,
      currentStreak: 0,
      lastPlayedAt: new Date().toISOString()
    };
    saveUserStats(updated);
    return { stats: updated, isNewBest: false, streakIncremented: false };
  }
}

export function resetUserStats(): UserStats {
  const reset = { ...DEFAULT_USER_STATS };
  saveUserStats(reset);
  return reset;
}

export function calculateWinRate(stats: UserStats): number {
  if (stats.gamesPlayed === 0) return 0;
  return Math.round((stats.cognitorWins / stats.gamesPlayed) * 100);
}
