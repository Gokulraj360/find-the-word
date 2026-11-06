import { describe, it, expect } from "vitest";
import { getCognitorDialogue, CognitorMood } from "../server/services/personalityService.js";

describe("Cognitor Personality Dialogue Service", () => {
  it("returns opening mood for early questions (step <= 2)", () => {
    const d1 = getCognitorDialogue({
      step: 1,
      certainty: 0.1,
      state: "in_progress",
      seedKey: "test-session"
    });
    expect(d1.mood).toBe("opening");
    expect(d1.moodLabel).toBe("Attuning");
    expect(typeof d1.line).toBe("string");
    expect(d1.line.length).toBeGreaterThan(5);

    const d2 = getCognitorDialogue({
      step: 2,
      certainty: 0.2,
      state: "in_progress",
      seedKey: "test-session"
    });
    expect(d2.mood).toBe("opening");
  });

  it("returns guessing mood when state is guess_pending", () => {
    const d = getCognitorDialogue({
      step: 14,
      certainty: 0.88,
      state: "guess_pending",
      seedKey: "test-session"
    });
    expect(d.mood).toBe("guessing");
    expect(d.moodLabel).toBe("Certain");
    expect(typeof d.line).toBe("string");
  });

  it("returns confident mood when certainty >= 0.55", () => {
    const d = getCognitorDialogue({
      step: 7,
      certainty: 0.62,
      state: "in_progress",
      seedKey: "test-session"
    });
    expect(d.mood).toBe("confident");
    expect(d.moodLabel).toBe("Closing In");
  });

  it("returns challenged mood when step >= 9 and certainty < 0.35", () => {
    const d = getCognitorDialogue({
      step: 11,
      certainty: 0.22,
      state: "in_progress",
      seedKey: "test-session"
    });
    expect(d.mood).toBe("challenged");
    expect(d.moodLabel).toBe("Intrigued");
  });

  it("returns final_stretch mood when step is near the question limit", () => {
    const d = getCognitorDialogue({
      step: 22,
      certainty: 0.45,
      state: "in_progress",
      maxQuestions: 25,
      seedKey: "test-session"
    });
    expect(d.mood).toBe("final_stretch");
    expect(d.moodLabel).toBe("Final Countdown");
  });

  it("returns recalibrating mood after a rejected guess on odd steps", () => {
    const d = getCognitorDialogue({
      step: 15,
      certainty: 0.3,
      state: "in_progress",
      rejectedGuessesCount: 1,
      seedKey: "test-session"
    });
    expect(d.mood).toBe("recalibrating");
    expect(d.moodLabel).toBe("Recalibrating");
  });

  it("returns probing mood during standard early-to-mid game exploration", () => {
    const d = getCognitorDialogue({
      step: 5,
      certainty: 0.38,
      state: "in_progress",
      seedKey: "test-session"
    });
    expect(d.mood).toBe("probing");
    expect(d.moodLabel).toBe("Analyzing");
  });

  it("produces deterministic lines for identical parameters and seedKey", () => {
    const d1 = getCognitorDialogue({
      step: 6,
      certainty: 0.4,
      state: "in_progress",
      seedKey: "fixed-seed-alpha"
    });
    const d2 = getCognitorDialogue({
      step: 6,
      certainty: 0.4,
      state: "in_progress",
      seedKey: "fixed-seed-alpha"
    });
    expect(d1.line).toBe(d2.line);
    expect(d1.mood).toBe(d2.mood);
  });
});
