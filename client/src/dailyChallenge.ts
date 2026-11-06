export interface DailyChallengeEntity {
  id: number;
  name: string;
  domain: "character" | "object";
  description: string | null;
  imageUrl: string | null;
  funFact?: string | null;
}

export interface DailyChallengeData {
  date: string; // YYYY-MM-DD
  dayNumber: number;
  entity: DailyChallengeEntity;
}

export interface DailyResult {
  date: string;
  dayNumber: number;
  targetId: number;
  targetName: string;
  won: boolean;
  questionsCount: number;
  completedAt: string;
}

export interface DailyStreakState {
  currentStreak: number;
  bestStreak: number;
  lastPlayedDate: string | null;
}

export const DAILY_HISTORY_KEY = "cognitor_daily_history";
export const DAILY_STREAK_KEY = "cognitor_daily_streak";

export function getDailyStreak(): DailyStreakState {
  if (typeof window === "undefined" || !window.localStorage) {
    return { currentStreak: 0, bestStreak: 0, lastPlayedDate: null };
  }
  try {
    const raw = window.localStorage.getItem(DAILY_STREAK_KEY);
    if (!raw) return { currentStreak: 0, bestStreak: 0, lastPlayedDate: null };
    return JSON.parse(raw);
  } catch {
    return { currentStreak: 0, bestStreak: 0, lastPlayedDate: null };
  }
}

export function saveDailyStreak(streak: DailyStreakState): void {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    window.localStorage.setItem(DAILY_STREAK_KEY, JSON.stringify(streak));
  } catch {
    // fallback
  }
}

export function getDailyHistory(): Record<string, DailyResult> {
  if (typeof window === "undefined" || !window.localStorage) return {};
  try {
    const raw = window.localStorage.getItem(DAILY_HISTORY_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function getTodayResult(dateStr: string): DailyResult | null {
  const history = getDailyHistory();
  return history[dateStr] || null;
}

export function recordDailyCompletion(
  challenge: DailyChallengeData,
  won: boolean,
  questionsCount: number
): { result: DailyResult; streak: DailyStreakState } {
  const history = getDailyHistory();
  const currentStreak = getDailyStreak();

  const result: DailyResult = {
    date: challenge.date,
    dayNumber: challenge.dayNumber,
    targetId: challenge.entity.id,
    targetName: challenge.entity.name,
    won,
    questionsCount,
    completedAt: new Date().toISOString()
  };

  history[challenge.date] = result;
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      window.localStorage.setItem(DAILY_HISTORY_KEY, JSON.stringify(history));
    } catch {
      // fallback
    }
  }

  // Calculate day streak
  let newStreak = 1;
  if (currentStreak.lastPlayedDate) {
    const lastDate = new Date(`${currentStreak.lastPlayedDate}T00:00:00Z`).getTime();
    const thisDate = new Date(`${challenge.date}T00:00:00Z`).getTime();
    const diffDays = Math.round((thisDate - lastDate) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      newStreak = currentStreak.currentStreak + 1;
    } else if (diffDays === 0) {
      newStreak = currentStreak.currentStreak;
    } else {
      newStreak = 1;
    }
  }

  const updatedStreak: DailyStreakState = {
    currentStreak: newStreak,
    bestStreak: Math.max(currentStreak.bestStreak, newStreak),
    lastPlayedDate: challenge.date
  };

  saveDailyStreak(updatedStreak);

  return { result, streak: updatedStreak };
}

export function generateShareText(result: DailyResult, streakCount: number): string {
  const header = `Cognitor Daily #${result.dayNumber} (${result.date})`;
  const streakText = streakCount > 0 ? `Daily Streak: ${streakCount} day${streakCount === 1 ? "" : "s"}` : "";

  if (result.won) {
    return `${header}
Target: ${result.targetName}
Guessed in: ${result.questionsCount} questions
${streakText}
Can you beat my score?`;
  } else {
    return `${header}
I beat Cognitor on today's target: ${result.targetName}!
Cognitor could not deduce it in ${result.questionsCount} questions.
${streakText}
Can you do better?`;
  }
}

export async function copyShareText(text: string): Promise<boolean> {
  if (typeof navigator !== "undefined" && navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // fallback
    }
  }

  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const success = document.execCommand("copy");
    document.body.removeChild(textarea);
    return success;
  } catch {
    return false;
  }
}
