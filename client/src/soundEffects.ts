// Pure Web Audio API synthesized sound effects (zero external files, zero latency)
class SoundManager {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  constructor() {
    // Read saved preference
    const saved = localStorage.getItem("cognitor_sound_enabled");
    this.enabled = saved !== "false";
  }

  private initCtx() {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
  }

  public toggle(): boolean {
    this.enabled = !this.enabled;
    localStorage.setItem("cognitor_sound_enabled", String(this.enabled));
    if (this.enabled) {
      this.playAnswerChime(1.0);
    }
    return this.enabled;
  }

  public playAnswerChime(val: number) {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);

      // Pitch depends slightly on answer value
      const freq = val >= 0.9 ? 523.25 : val >= 0.7 ? 440 : val >= 0.4 ? 349.23 : val >= 0.2 ? 293.66 : 261.63; // C5, A4, F4, D4, C4
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.25, this.ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.2);
    } catch {
      // Audio autoplay policy fallback
    }
  }

  public playDeductionReveal() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      // Celestial chord: C4, E4, G4, B4
      const freqs = [261.63, 329.63, 392.0, 493.88];
      freqs.forEach((f, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.type = "triangle";
        osc.frequency.setValueAtTime(f, this.ctx.currentTime + idx * 0.04);
        gain.gain.setValueAtTime(0.05, this.ctx.currentTime + idx * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.6 + idx * 0.05);

        osc.start(this.ctx.currentTime + idx * 0.04);
        osc.stop(this.ctx.currentTime + 0.8);
      });
    } catch {
      // ignore
    }
  }

  public playVictory() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      // Triumphant fanfare
      const notes = [
        { f: 523.25, t: 0 },
        { f: 659.25, t: 0.1 },
        { f: 783.99, t: 0.2 },
        { f: 1046.5, t: 0.35 }
      ];

      notes.forEach((n) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.type = "sine";
        osc.frequency.setValueAtTime(n.f, this.ctx.currentTime + n.t);
        gain.gain.setValueAtTime(0.07, this.ctx.currentTime + n.t);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + n.t + 0.35);

        osc.start(this.ctx.currentTime + n.t);
        osc.stop(this.ctx.currentTime + n.t + 0.4);
      });
    } catch {
      // ignore
    }
  }

  public playDefeat() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      // Descending somber chime
      const notes = [
        { f: 349.23, t: 0 },
        { f: 311.13, t: 0.15 },
        { f: 261.63, t: 0.3 }
      ];

      notes.forEach((n) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.type = "sine";
        osc.frequency.setValueAtTime(n.f, this.ctx.currentTime + n.t);
        gain.gain.setValueAtTime(0.06, this.ctx.currentTime + n.t);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + n.t + 0.3);

        osc.start(this.ctx.currentTime + n.t);
        osc.stop(this.ctx.currentTime + n.t + 0.35);
      });
    } catch {
      // ignore
    }
  }

  public playAchievement() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      // Ascending arpeggio chime (G4, C5, E5, G5)
      const notes = [392.0, 523.25, 659.25, 783.99];
      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.type = "sine";
        const start = this.ctx.currentTime + idx * 0.08;
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.06, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.28);

        osc.start(start);
        osc.stop(start + 0.32);
      });
    } catch {
      // ignore
    }
  }

  public playConfettiPop() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      // Party popper dual burst with rapid pitch decay
      const pops = [
        { f1: 880, f2: 1320, t: 0 },
        { f1: 1174, f2: 1760, t: 0.05 }
      ];

      pops.forEach((p) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.type = "triangle";
        const start = this.ctx.currentTime + p.t;
        osc.frequency.setValueAtTime(p.f1, start);
        osc.frequency.exponentialRampToValueAtTime(p.f2, start + 0.04);
        osc.frequency.exponentialRampToValueAtTime(220, start + 0.16);

        gain.gain.setValueAtTime(0.07, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.16);

        osc.start(start);
        osc.stop(start + 0.18);
      });
    } catch {
      // ignore
    }
  }

  public playFanfare() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      // Majestic 5-note brass fanfare (C5, G4, C5, E5, G5)
      const notes = [
        { f: 523.25, d: 0.12, t: 0 },
        { f: 392.0, d: 0.1, t: 0.13 },
        { f: 523.25, d: 0.12, t: 0.24 },
        { f: 659.25, d: 0.14, t: 0.37 },
        { f: 783.99, d: 0.45, t: 0.52 }
      ];

      notes.forEach((n) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.type = "sawtooth";
        const start = this.ctx.currentTime + n.t;
        osc.frequency.setValueAtTime(n.f, start);

        gain.gain.setValueAtTime(0.05, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + n.d);

        osc.start(start);
        osc.stop(start + n.d + 0.05);
      });
    } catch {
      // ignore
    }
  }
}

export const sounds = new SoundManager();
