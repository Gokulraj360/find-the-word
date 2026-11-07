import React, { useState } from "react";

interface CyberAvatarProps {
  size?: number;
  imageUrl?: string | null;
  name?: string;
  className?: string;
  ringGlow?: boolean;
}

export function CyberAvatar({
  size = 110,
  imageUrl,
  name = "Cognitor",
  className = "",
  ringGlow = true
}: CyberAvatarProps) {
  const [imgError, setImgError] = useState(false);

  return (
    <div
      className={`cyber-avatar-container ${ringGlow ? "has-glow" : ""} ${className}`}
      style={{
        width: size,
        height: size,
        minWidth: size,
        minHeight: size
      }}
      title={name}
    >
      {imageUrl && !imgError ? (
        <img
          src={imageUrl}
          alt={name}
          className="cyber-avatar-img"
          referrerPolicy="no-referrer"
          onError={() => setImgError(true)}
        />
      ) : (
        <svg
          viewBox="0 0 120 120"
          className="cyber-avatar-svg"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <radialGradient id="cyberHeadBg" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#0a0f1d" />
            </radialGradient>
            <linearGradient id="cyberArmorGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#334155" />
              <stop offset="50%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>
            <linearGradient id="cyberFaceGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#64748b" />
              <stop offset="60%" stopColor="#475569" />
              <stop offset="100%" stopColor="#334155" />
            </linearGradient>
            <linearGradient id="cyanNeon" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00f0ff" />
              <stop offset="100%" stopColor="#38bdf8" />
            </linearGradient>
            <filter id="cyanGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background circle */}
          <circle cx="60" cy="60" r="58" fill="url(#cyberHeadBg)" />

          {/* Shoulders & Chest Armor */}
          <path
            d="M20 108 C26 90, 40 84, 60 84 C80 84, 94 90, 100 108 L105 120 L15 120 Z"
            fill="url(#cyberArmorGrad)"
            stroke="#1e293b"
            strokeWidth="1.5"
          />

          {/* Collar glowing circuit lines */}
          <path
            d="M44 88 L52 98 L68 98 L76 88"
            stroke="url(#cyanNeon)"
            strokeWidth="2"
            strokeLinecap="round"
            filter="url(#cyanGlow)"
          />
          <circle cx="60" cy="98" r="2.5" fill="#00f0ff" filter="url(#cyanGlow)" />

          {/* Neck */}
          <path
            d="M50 72 L70 72 L68 84 L52 84 Z"
            fill="#1e293b"
            stroke="#0f172a"
            strokeWidth="1"
          />
          <line x1="60" y1="72" x2="60" y2="84" stroke="#00f0ff" strokeWidth="1" opacity="0.6" />

          {/* Head base shape */}
          <path
            d="M38 42 C38 26, 82 26, 82 42 C82 56, 74 72, 60 74 C46 72, 38 56, 38 42 Z"
            fill="url(#cyberFaceGrad)"
            stroke="#1e293b"
            strokeWidth="1.5"
          />

          {/* Cranial / Forehead cyber plate */}
          <path
            d="M44 32 C48 26, 72 26, 76 32 C74 38, 46 38, 44 32 Z"
            fill="#1e293b"
            stroke="#0f172a"
            strokeWidth="1"
          />
          <line x1="60" y1="26" x2="60" y2="34" stroke="#00f0ff" strokeWidth="1.5" opacity="0.8" />

          {/* Cheeks / Jaw angular plates */}
          <path d="M42 48 L46 62 L54 68 L50 52 Z" fill="#334155" opacity="0.8" />
          <path d="M78 48 L74 62 L66 68 L70 52 Z" fill="#334155" opacity="0.8" />

          {/* Nose bridge */}
          <polygon points="59,44 61,44 62,56 58,56" fill="#334155" />

          {/* Glowing Cyan Eyes */}
          <polygon
            points="46,45 54,46 52,49 46,47"
            fill="#00f0ff"
            filter="url(#cyanGlow)"
          />
          <polygon
            points="74,45 66,46 68,49 74,47"
            fill="#00f0ff"
            filter="url(#cyanGlow)"
          />

          {/* Eye glow line accents */}
          <path
            d="M42 46 L45 46"
            stroke="#00f0ff"
            strokeWidth="1"
            opacity="0.8"
          />
          <path
            d="M78 46 L75 46"
            stroke="#00f0ff"
            strokeWidth="1"
            opacity="0.8"
          />

          {/* Mouth line */}
          <line x1="55" y1="64" x2="65" y2="64" stroke="#1e293b" strokeWidth="1.5" strokeLinecap="round" />

          {/* Cybernetic Ear / Headset Units with Cyan Glow */}
          {/* Left Earpiece */}
          <rect
            x="34"
            y="42"
            width="5"
            height="16"
            rx="2.5"
            fill="#1e293b"
            stroke="#0f172a"
            strokeWidth="1"
          />
          <circle cx="36.5" cy="50" r="1.5" fill="#00f0ff" filter="url(#cyanGlow)" />

          {/* Right Earpiece */}
          <rect
            x="81"
            y="42"
            width="5"
            height="16"
            rx="2.5"
            fill="#1e293b"
            stroke="#0f172a"
            strokeWidth="1"
          />
          <circle cx="83.5" cy="50" r="1.5" fill="#00f0ff" filter="url(#cyanGlow)" />
        </svg>
      )}
    </div>
  );
}
