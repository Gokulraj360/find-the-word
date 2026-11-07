import React from "react";

export type BadgeType =
  | "novice_seeker"
  | "deduction_master"
  | "speed_demon"
  | "stump_champion"
  | "polymath"
  | "trivia_ace"
  | "duelist"
  | "unstoppable";

interface HexBadgeProps {
  type: BadgeType;
  title: string;
  unlocked: boolean;
  progressText?: string;
  onClick?: () => void;
}

const BADGE_CONFIGS: Record<
  BadgeType,
  {
    themeColor: string;
    glowColor: string;
    bgGradient: [string, string];
    icon: (color: string) => React.ReactNode;
  }
> = {
  novice_seeker: {
    themeColor: "#38bdf8",
    glowColor: "rgba(56, 189, 248, 0.5)",
    bgGradient: ["#0284c7", "#0369a1"],
    icon: (col) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={col} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
        <line x1="12" y1="17" x2="12.01" y2="17"></line>
      </svg>
    )
  },
  deduction_master: {
    themeColor: "#00f0ff",
    glowColor: "rgba(0, 240, 255, 0.6)",
    bgGradient: ["#0891b2", "#0e7490"],
    icon: (col) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={col} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a4 4 0 0 0-4 4c0 .88.29 1.7.78 2.37A6 6 0 0 0 5 14a6 6 0 0 0 6 6v2"></path>
        <path d="M12 2a4 4 0 0 1 4 4c0 .88-.29 1.7-.78 2.37A6 6 0 0 1 19 14a6 6 0 0 1-6 6v2"></path>
        <line x1="12" y1="8" x2="12" y2="16"></line>
      </svg>
    )
  },
  speed_demon: {
    themeColor: "#f97316",
    glowColor: "rgba(249, 115, 22, 0.5)",
    bgGradient: ["#ea580c", "#9a3412"],
    icon: (col) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={col} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
      </svg>
    )
  },
  stump_champion: {
    themeColor: "#eab308",
    glowColor: "rgba(234, 179, 8, 0.6)",
    bgGradient: ["#ca8a04", "#854d0e"],
    icon: (col) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={col} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path>
        <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path>
        <path d="M4 22h16"></path>
        <path d="M10 14.66V17c0 .55-.45 1-1 1H8v4h8v-4h-1c-.55 0-1-.45-1-1v-2.34"></path>
        <path d="M6 4h12v7a6 6 0 0 1-12 0V4Z"></path>
      </svg>
    )
  },
  polymath: {
    themeColor: "#a855f7",
    glowColor: "rgba(168, 85, 247, 0.5)",
    bgGradient: ["#9333ea", "#6b21a8"],
    icon: (col) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={col} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(30 12 12)"></ellipse>
        <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(-30 12 12)"></ellipse>
        <circle cx="12" cy="12" r="2" fill={col}></circle>
      </svg>
    )
  },
  trivia_ace: {
    themeColor: "#facc15",
    glowColor: "rgba(250, 204, 21, 0.5)",
    bgGradient: ["#eab308", "#a16207"],
    icon: (col) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={col} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
      </svg>
    )
  },
  duelist: {
    themeColor: "#ef4444",
    glowColor: "rgba(239, 68, 68, 0.5)",
    bgGradient: ["#dc2626", "#991b1b"],
    icon: (col) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={col} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="14.5" y1="17.5" x2="3" y2="6"></line>
        <line x1="4" y1="19" x2="8.5" y2="14.5"></line>
        <line x1="19" y1="5" x2="21" y2="3"></line>
        <line x1="9.5" y1="17.5" x2="21" y2="6"></line>
        <line x1="20" y1="19" x2="15.5" y2="14.5"></line>
        <line x1="5" y1="5" x2="3" y2="3"></line>
      </svg>
    )
  },
  unstoppable: {
    themeColor: "#eab308",
    glowColor: "rgba(234, 179, 8, 0.5)",
    bgGradient: ["#f59e0b", "#78350f"],
    icon: (col) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={col} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
        <polyline points="9 12 11 14 15 10"></polyline>
      </svg>
    )
  }
};

export function HexBadge({ type, title, unlocked, progressText, onClick }: HexBadgeProps) {
  const config = BADGE_CONFIGS[type];
  const strokeColor = unlocked ? config.themeColor : "rgba(255, 255, 255, 0.15)";
  const iconColor = unlocked ? "#ffffff" : "rgba(255, 255, 255, 0.25)";

  return (
    <div
      className={`hex-badge-card ${unlocked ? "hex-unlocked" : "hex-locked"}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      title={`${title}${progressText ? ` (${progressText})` : ""}`}
    >
      <div className="hex-icon-wrapper" style={{ filter: unlocked ? `drop-shadow(0 0 8px ${config.glowColor})` : "none" }}>
        <svg
          viewBox="0 0 100 115"
          className="hex-svg"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id={`hexGrad_${type}`} x1="0%" y1="0%" x2="100%" y2="100%">
              {unlocked ? (
                <>
                  <stop offset="0%" stopColor={config.bgGradient[0]} />
                  <stop offset="100%" stopColor={config.bgGradient[1]} />
                </>
              ) : (
                <>
                  <stop offset="0%" stopColor="#1e293b" />
                  <stop offset="100%" stopColor="#0f172a" />
                </>
              )}
            </linearGradient>
          </defs>

          {/* Regular hexagon path: points at (50,2), (95,28), (95,86), (50,113), (5,86), (5,28) */}
          <polygon
            points="50,4 94,29 94,85 50,110 6,85 6,29"
            fill={`url(#hexGrad_${type})`}
            stroke={strokeColor}
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
        </svg>

        <div className="hex-inner-icon">
          {unlocked ? (
            config.icon(iconColor)
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          )}
        </div>
      </div>

      <span className="hex-badge-label">{title}</span>
    </div>
  );
}
