import { EntityRecord } from "../db/types.js";
import { getFunFactForEntity } from "./funFactService.js";

export interface DailyChallengeInfo {
  date: string;
  dayNumber: number;
  entity: {
    id: number;
    name: string;
    domain: "character" | "object";
    description: string | null;
    imageUrl: string | null;
    funFact?: string | null;
  };
}

export function computeDailyChallenge(entities: EntityRecord[], dateStr?: string): DailyChallengeInfo {
  const date = dateStr || new Date().toISOString().slice(0, 10);
  const epoch = new Date("2024-01-01T00:00:00Z").getTime();
  const current = new Date(`${date}T00:00:00Z`).getTime();
  const dayNumber = Math.max(1, Math.floor((current - epoch) / (1000 * 60 * 60 * 24)));

  const active = entities
    .filter((e) => e.status === "active")
    .sort((a, b) => a.id - b.id);

  if (active.length === 0) {
    throw new Error("No active entities available for daily challenge.");
  }

  let hash = 0;
  for (let i = 0; i < date.length; i++) {
    hash = (hash * 31 + date.charCodeAt(i)) >>> 0;
  }

  const selectedIndex = hash % active.length;
  const selected = active[selectedIndex];

  return {
    date,
    dayNumber,
    entity: {
      id: selected.id,
      name: selected.name,
      domain: selected.category === "object" ? "object" : "character",
      description: selected.description || null,
      imageUrl: selected.imageUrl || null,
      funFact: selected.funFact || getFunFactForEntity(selected.id, selected.name, selected.category, selected.description || undefined)
    }
  };
}
