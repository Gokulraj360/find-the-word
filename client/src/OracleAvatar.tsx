import React from "react";

export type OracleMood = "idle" | "thinking" | "confident" | "guessing" | "stumped" | "defeated";

interface OracleAvatarProps {
  mood: OracleMood;
  certainty?: number;
  size?: number;
}

export const OracleAvatar: React.FC<OracleAvatarProps> = ({
  mood = "idle",
  certainty = 0.05,
  size = 140
}) => {
  // Determine eye geometry and aura intensity based on mood
  const isGuessing = mood === "guessing";
  const isConfident = mood === "confident" || certainty >= 0.65;
  const isThinking = mood === "thinking";
  const isStumped = mood === "stumped";
  const isDefeated = mood === "defeated";

  // Dynamic glow color
  const glowColor = isGuessing
    ? "#f59e0b" // gold
    : isConfident
    ? "#38bdf8" // bright cyan
    : isStumped
    ? "#ec4899" // hot pink surprise
    : isDefeated
    ? "#a855f7" // violet
    : "#6366f1"; // deep indigo

  return (
    <div
      className={`oracle-wrapper oracle-mood-${mood}`}
      style={{ width: size, height: size }}
      title={`Cognitor Oracle (${mood})`}
    >
      <svg
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="oracle-svg"
      >
        <defs>
          {/* Ambient Outer Glow */}
          <radialGradient id="auraGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={glowColor} stopOpacity={isGuessing ? 0.45 : isConfident ? 0.35 : 0.2} />
            <stop offset="60%" stopColor={glowColor} stopOpacity={isGuessing ? 0.15 : 0.08} />
            <stop offset="100%" stopColor={glowColor} stopOpacity="0" />
          </radialGradient>

          {/* Hood / Cowl Gradient */}
          <linearGradient id="cowlGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e1e2d" />
            <stop offset="50%" stopColor="#13131c" />
            <stop offset="100%" stopColor="#0b0b12" />
          </linearGradient>

          {/* Accent Rim Metallic Gradient */}
          <linearGradient id="rimGrad" x1="0%" y1="0%" x2="100%" y2="50%">
            <stop offset="0%" stopColor={glowColor} />
            <stop offset="50%" stopColor="#ffffff" stopOpacity="0.8" />
            <stop offset="100%" stopColor={glowColor} />
          </linearGradient>

          {/* Mask Inner Face Gradient */}
          <linearGradient id="faceGrad" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#0a0a10" />
            <stop offset="100%" stopColor="#141420" />
          </linearGradient>

          {/* Eye Glow Filter */}
          <filter id="eyeGlowFilter" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Ambient Back Glow Aura */}
        <circle cx="100" cy="95" r="90" fill="url(#auraGlow)" className="oracle-aura" />

        {/* Floating Ethereal Particles */}
        <circle cx="45" cy="55" r="2.5" fill={glowColor} opacity="0.6" className="oracle-particle-1" />
        <circle cx="155" cy="65" r="2" fill={glowColor} opacity="0.5" className="oracle-particle-2" />
        <circle cx="160" cy="135" r="3" fill={glowColor} opacity="0.7" className="oracle-particle-3" />
        <circle cx="40" cy="130" r="2" fill={glowColor} opacity="0.5" className="oracle-particle-4" />

        {/* Outer Mystical Cowl / Hood */}
        <path
          d="M100 24C60 24 38 52 38 98C38 140 56 166 84 176L100 182L116 176C144 166 162 140 162 98C162 52 140 24 100 24Z"
          fill="url(#cowlGrad)"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="1.5"
        />

        {/* Hood Rim Accent */}
        <path
          d="M48 98C48 58 68 34 100 34C132 34 152 58 152 98C152 135 138 158 114 168L100 172L86 168C62 158 48 135 48 98Z"
          stroke="url(#rimGrad)"
          strokeWidth="1.2"
          opacity={isGuessing ? 0.9 : 0.6}
        />

        {/* Face Visor Chamber */}
        <path
          d="M62 95C62 70 76 54 100 54C124 54 138 70 138 95C138 122 124 144 100 148C76 144 62 122 62 95Z"
          fill="url(#faceGrad)"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="1"
        />

        {/* Forehead Mystical Gem / Aperture */}
        <polygon
          points="100,42 106,50 100,58 94,50"
          fill={glowColor}
          opacity={isGuessing ? 1 : 0.85}
          filter="url(#eyeGlowFilter)"
        />

        {/* Dynamic Eye Expressions */}
        {isGuessing ? (
          /* Triumphant / Revelation Eyes */
          <g filter="url(#eyeGlowFilter)">
            <ellipse cx="82" cy="94" rx="9" ry="7" fill="#ffffff" />
            <circle cx="82" cy="94" r="5" fill="#f59e0b" />
            <circle cx="84" cy="92" r="2" fill="#ffffff" />

            <ellipse cx="118" cy="94" rx="9" ry="7" fill="#ffffff" />
            <circle cx="118" cy="94" r="5" fill="#f59e0b" />
            <circle cx="120" cy="92" r="2" fill="#ffffff" />

            {/* Confident smile slit */}
            <path d="M92 122Q100 128 108 122" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
          </g>
        ) : isConfident ? (
          /* Confident Smirk / Narrowed Knowing Eyes */
          <g filter="url(#eyeGlowFilter)">
            <path d="M74 94Q83 88 92 93" stroke="#38bdf8" strokeWidth="3.5" strokeLinecap="round" />
            <circle cx="83" cy="97" r="3.5" fill="#38bdf8" />

            <path d="M108 93Q117 88 126 94" stroke="#38bdf8" strokeWidth="3.5" strokeLinecap="round" />
            <circle cx="117" cy="97" r="3.5" fill="#38bdf8" />

            {/* Subtle Knowing Smirk */}
            <path d="M93 120Q101 125 109 119" stroke="#38bdf8" strokeWidth="1.8" strokeLinecap="round" />
          </g>
        ) : isThinking ? (
          /* Deep in thought / Eyes gazing slightly upward */
          <g filter="url(#eyeGlowFilter)">
            <ellipse cx="83" cy="91" rx="7" ry="5.5" fill={glowColor} />
            <circle cx="84" cy="90" r="2.5" fill="#ffffff" />

            <ellipse cx="117" cy="91" rx="7" ry="5.5" fill={glowColor} />
            <circle cx="118" cy="90" r="2.5" fill="#ffffff" />

            {/* Neutral Mouth slit */}
            <line x1="95" y1="122" x2="105" y2="122" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round" />
          </g>
        ) : isStumped ? (
          /* Surprised / Curious Raised Eyes */
          <g filter="url(#eyeGlowFilter)">
            <circle cx="82" cy="93" r="8" fill="#ffffff" />
            <circle cx="82" cy="93" r="4.5" fill="#ec4899" />

            <circle cx="118" cy="93" r="8" fill="#ffffff" />
            <circle cx="118" cy="93" r="4.5" fill="#ec4899" />

            {/* Small surprised O mouth */}
            <ellipse cx="100" cy="122" rx="4" ry="5" stroke="#ec4899" strokeWidth="1.8" fill="none" />
          </g>
        ) : isDefeated ? (
          /* Humbled / Bowed Eyes */
          <g filter="url(#eyeGlowFilter)">
            <path d="M75 97Q83 103 91 97" stroke="#a855f7" strokeWidth="3" strokeLinecap="round" />
            <path d="M109 97Q117 103 125 97" stroke="#a855f7" strokeWidth="3" strokeLinecap="round" />
            {/* Respectful gentle smile */}
            <path d="M94 121Q100 125 106 121" stroke="#a855f7" strokeWidth="1.5" strokeLinecap="round" />
          </g>
        ) : (
          /* Standard Normal / Idle Eyes */
          <g filter="url(#eyeGlowFilter)">
            <ellipse cx="83" cy="94" rx="7.5" ry="5" fill={glowColor} className="oracle-eye-left" />
            <circle cx="84.5" cy="93" r="2" fill="#ffffff" />

            <ellipse cx="117" cy="94" rx="7.5" ry="5" fill={glowColor} className="oracle-eye-right" />
            <circle cx="118.5" cy="93" r="2" fill="#ffffff" />

            {/* Neutral Mouth */}
            <path d="M95 122Q100 124 105 122" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" strokeLinecap="round" />
          </g>
        )}

        {/* Ethereal Floating Base Tendrils */}
        <path
          d="M86 172C80 185 74 195 72 200M100 178C100 188 100 196 100 200M114 172C120 185 126 195 128 200"
          stroke={glowColor}
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.35"
        />
      </svg>
    </div>
  );
};
