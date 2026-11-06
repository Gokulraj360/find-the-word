export type LeaderboardCategory = "fastest_guess" | "best_streak" | "stumped" | "daily";

export interface LeaderboardEntry {
  id: string;
  playerName: string;
  category: LeaderboardCategory;
  score: number;
  entityName?: string;
  domain?: "character" | "object";
  difficulty?: "easy" | "hard" | "expert";
  date: string;
  createdAt: number;
}

export interface LeaderboardSummary {
  totalSubmissions: number;
  bestFastestGuess: number | null;
  highestStreak: number | null;
}

export interface LeaderboardData {
  category: LeaderboardCategory;
  entries: LeaderboardEntry[];
  summary: LeaderboardSummary;
}

const PLAYER_NAME_KEY = "cognitor_player_name";

export function getSavedPlayerName(): string {
  if (typeof window === "undefined" || !window.localStorage) return "Anonymous";
  try {
    return window.localStorage.getItem(PLAYER_NAME_KEY) || "Anonymous";
  } catch {
    return "Anonymous";
  }
}

export function setSavedPlayerName(name: string): void {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    const trimmed = name.trim().slice(0, 30);
    if (trimmed) {
      window.localStorage.setItem(PLAYER_NAME_KEY, trimmed);
    }
  } catch {
    // Non-blocking fallback
  }
}

export async function fetchLeaderboard(
  category: LeaderboardCategory = "fastest_guess",
  limit: number = 25
): Promise<LeaderboardData> {
  const res = await fetch(`/api/leaderboard?category=${encodeURIComponent(category)}&limit=${limit}`);
  if (!res.ok) {
    throw new Error(`Failed to load leaderboard (${res.status})`);
  }
  return res.json();
}

export async function submitLeaderboardEntry(payload: {
  playerName: string;
  category: LeaderboardCategory;
  score: number;
  entityName?: string;
  domain?: "character" | "object";
  difficulty?: "easy" | "hard" | "expert";
}): Promise<LeaderboardEntry> {
  setSavedPlayerName(payload.playerName);

  const res = await fetch("/api/leaderboard/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to submit leaderboard entry (${res.status})`);
  }

  const data = await res.json();
  return data.entry;
}
