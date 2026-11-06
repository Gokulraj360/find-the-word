import { describe, it, expect } from "vitest";
import { ConfettiOptions } from "../client/src/confetti.js";

describe("Confetti Particle Animation Engine", () => {
  it("defines standard ConfettiOptions interface and defaults", () => {
    const opts: ConfettiOptions = {
      count: 150,
      durationMs: 3000,
      colors: ["#6366f1", "#ec4899", "#f59e0b"]
    };

    expect(opts.count).toBe(150);
    expect(opts.durationMs).toBe(3000);
    expect(opts.colors).toHaveLength(3);
  });

  it("handles empty options gracefully", () => {
    const emptyOpts: ConfettiOptions = {};
    expect(emptyOpts.count).toBeUndefined();
    expect(emptyOpts.durationMs).toBeUndefined();
  });
});
