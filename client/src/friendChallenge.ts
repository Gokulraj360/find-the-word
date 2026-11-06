export interface ChallengeData {
  code: string;
  creatorName: string;
  domain: "character" | "object";
  createdAt: number;
  playsCount?: number;
  bestQuestions?: number | null;
}

export async function createFriendChallenge(
  domain: "character" | "object",
  entityId: number,
  creatorName: string
): Promise<ChallengeData> {
  const res = await fetch("/api/challenge/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      domain,
      entityId,
      creatorName: creatorName.trim() || "A Friend"
    })
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Failed to create challenge.");
  }
  return data;
}

export async function fetchChallengeDetails(code: string): Promise<ChallengeData> {
  const res = await fetch(`/api/challenge/${encodeURIComponent(code.trim().toUpperCase())}`);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Challenge not found.");
  }
  return data;
}

export function getChallengeCodeFromUrl(): string | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const code = params.get("challenge");
  return code ? code.trim().toUpperCase() : null;
}

export function generateChallengeShareLink(code: string): string {
  if (typeof window === "undefined") return `?challenge=${code}`;
  const origin = window.location.origin;
  return `${origin}/?challenge=${code}`;
}

export function generateChallengeShareText(
  code: string,
  creatorName: string,
  domain: "character" | "object"
): string {
  const link = generateChallengeShareLink(code);
  const domainLabel = domain === "character" ? "Character" : "Object";
  return `Cognitor Challenge from ${creatorName}!\n\nI picked a secret ${domainLabel}. Can you deduce who or what it is in under 20 questions?\n\nCode: ${code}\nPlay here: ${link}`;
}

export function generateChallengeCompletionShareText(
  creatorName: string,
  won: boolean,
  questionsCount: number,
  code: string
): string {
  const link = generateChallengeShareLink(code);
  if (won) {
    return `I just solved ${creatorName}'s Cognitor challenge in ${questionsCount} questions!\n\nCan you beat my score?\nCode: ${code}\nPlay: ${link}`;
  }
  return `I was stumped by ${creatorName}'s Cognitor challenge!\n\nCan you solve it?\nCode: ${code}\nPlay: ${link}`;
}

export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof navigator !== "undefined" && navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fallback below
    }
  }
  try {
    const el = document.createElement("textarea");
    el.value = text;
    document.body.appendChild(el);
    el.select();
    const success = document.execCommand("copy");
    document.body.removeChild(el);
    return success;
  } catch {
    return false;
  }
}
