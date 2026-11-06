export interface ConfettiOptions {
  count?: number;
  durationMs?: number;
  colors?: string[];
  spread?: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  shape: "rect" | "circle" | "strip";
  rotation: number;
  rotationSpeed: number;
  tilt: number;
  tiltSpeed: number;
  opacity: number;
}

const DEFAULT_COLORS = [
  "#6366f1", // indigo
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#f59e0b", // amber
  "#10b981", // emerald
  "#38bdf8", // sky
  "#eab308"  // gold
];

let activeCanvas: HTMLCanvasElement | null = null;
let animationFrameId: number | null = null;

export function triggerConfetti(options: ConfettiOptions = {}): void {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return;
  }

  const count = Math.min(Math.max(options.count ?? 120, 20), 300);
  const durationMs = options.durationMs ?? 3500;
  const colors = options.colors && options.colors.length > 0 ? options.colors : DEFAULT_COLORS;

  let canvas = document.getElementById("cognitor-confetti-canvas") as HTMLCanvasElement | null;
  if (!canvas) {
    canvas = document.createElement("canvas");
    canvas.id = "cognitor-confetti-canvas";
    canvas.style.position = "fixed";
    canvas.style.top = "0";
    canvas.style.left = "0";
    canvas.style.width = "100vw";
    canvas.style.height = "100vh";
    canvas.style.pointerEvents = "none";
    canvas.style.zIndex = "99999";
    document.body.appendChild(canvas);
  }

  activeCanvas = canvas;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const width = (canvas.width = window.innerWidth);
  const height = (canvas.height = window.innerHeight);

  const shapes: Array<"rect" | "circle" | "strip"> = ["rect", "circle", "strip"];
  const particles: Particle[] = [];

  for (let i = 0; i < count; i++) {
    const originX = width * (0.2 + Math.random() * 0.6);
    const originY = height * 0.35 + (Math.random() * 80 - 40);
    const angle = (Math.random() * Math.PI) - (Math.PI / 2) + (Math.random() > 0.5 ? 0.3 : -0.3);
    const speed = 7 + Math.random() * 14;

    particles.push({
      x: originX,
      y: originY,
      vx: Math.cos(angle) * speed * (Math.random() > 0.5 ? 1 : -1),
      vy: -Math.abs(Math.sin(angle) * speed) - 4,
      size: 6 + Math.random() * 7,
      color: colors[Math.floor(Math.random() * colors.length)],
      shape: shapes[Math.floor(Math.random() * shapes.length)],
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 8,
      tilt: Math.random() * 10,
      tiltSpeed: 0.1 + Math.random() * 0.2,
      opacity: 1.0
    });
  }

  const startTime = Date.now();

  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }

  function frame() {
    if (!ctx || !canvas) return;
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / durationMs, 1.0);

    ctx.clearRect(0, 0, width, height);

    let activeCount = 0;

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.28; // gravity
      p.vx *= 0.985; // drag
      p.rotation += p.rotationSpeed;
      p.tilt += p.tiltSpeed;

      if (progress > 0.6) {
        p.opacity = Math.max(0, 1.0 - (progress - 0.6) / 0.4);
      }

      if (p.opacity > 0 && p.y < height + 40) {
        activeCount++;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;

        const tiltW = p.size * Math.cos(p.tilt);

        if (p.shape === "rect") {
          ctx.fillRect(-tiltW / 2, -p.size / 2, tiltW, p.size);
        } else if (p.shape === "circle") {
          ctx.beginPath();
          ctx.arc(0, 0, Math.abs(tiltW) / 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Ribbon strip
          ctx.fillRect(-tiltW / 2, -p.size, Math.max(tiltW * 0.4, 2), p.size * 2);
        }

        ctx.restore();
      }
    }

    if (progress < 1.0 && activeCount > 0) {
      animationFrameId = requestAnimationFrame(frame);
    } else {
      ctx.clearRect(0, 0, width, height);
      if (canvas && canvas.parentNode) {
        canvas.parentNode.removeChild(canvas);
      }
      activeCanvas = null;
      animationFrameId = null;
    }
  }

  animationFrameId = requestAnimationFrame(frame);
}

export function stopConfetti(): void {
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
  if (activeCanvas && activeCanvas.parentNode) {
    activeCanvas.parentNode.removeChild(activeCanvas);
    activeCanvas = null;
  }
}
