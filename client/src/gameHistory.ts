export interface GameHistoryQuestion {
  step: number;
  text: string;
  answerValue: number;
  answerLabel: string;
}

export interface GameHistoryEntry {
  id: string;
  timestamp: number;
  domain: "character" | "object";
  difficulty: string;
  pack: string;
  entityName: string;
  entityDescription?: string | null;
  imageUrl?: string | null;
  result: "won" | "lost";
  stumpedCognitor: boolean;
  questionsCount: number;
  questions: GameHistoryQuestion[];
}

const STORAGE_KEY = "cognitor_game_history";
export const MAX_HISTORY_ENTRIES = 10;

/**
 * Retrieve saved game history entries from localStorage.
 */
export function getGameHistory(): GameHistoryEntry[] {
  if (typeof window === "undefined" || !window.localStorage) {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.slice(0, MAX_HISTORY_ENTRIES);
  } catch {
    return [];
  }
}

/**
 * Save a newly completed game into history.
 * Keeps the latest 10 entries (newest first).
 */
export function saveGameHistoryEntry(
  entry: Omit<GameHistoryEntry, "id" | "timestamp">
): GameHistoryEntry[] {
  const current = getGameHistory();
  const newEntry: GameHistoryEntry = {
    ...entry,
    id: `game-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: Date.now()
  };

  const updated = [newEntry, ...current].slice(0, MAX_HISTORY_ENTRIES);

  if (typeof window !== "undefined" && window.localStorage) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // localStorage quota or access error
    }
  }

  return updated;
}

/**
 * Purge all saved game history entries.
 */
export function clearGameHistory(): void {
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }
}

/**
 * Formats a timestamp into a human-readable relative duration.
 */
export function formatRelativeTime(timestamp: number, now: number = Date.now()): string {
  const diffSec = Math.floor((now - timestamp) / 1000);
  if (diffSec < 60) return "Just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  const date = new Date(timestamp);
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/**
 * Formats a timestamp into full date & time string.
 */
export function formatGameDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}
