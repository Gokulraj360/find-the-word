import React from "react";

export interface PathwayStep {
  step: number;
  questionText: string;
  answerLabel?: string;
  answerValue: number;
}

interface DeductionPathwayGraphProps {
  history: PathwayStep[];
  targetName: string;
}

function getLabel(step?: PathwayStep): string {
  if (!step) return "";
  if (step.answerLabel) return step.answerLabel;
  if (step.answerValue >= 0.9) return "Yes";
  if (step.answerValue <= 0.1) return "No";
  if (step.answerValue >= 0.7) return "Probably";
  if (step.answerValue <= 0.3) return "Probably Not";
  return "Unknown";
}

export function DeductionPathwayGraph({ history, targetName }: DeductionPathwayGraphProps) {
  // Take up to 4 significant milestone clues to form the visual pipeline
  const displaySteps = history.slice(0, 4);

  return (
    <div className="deduction-pathway-container">
      <div className="deduction-pathway-title-row">
        <span className="deduction-pathway-title">Deduction Pathway</span>
      </div>

      <div className="deduction-pathway-track">
        <svg
          className="deduction-pathway-svg"
          viewBox="0 0 520 70"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="cyanLineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00f0ff" />
              <stop offset="100%" stopColor="#38bdf8" />
            </linearGradient>
            <filter id="nodeGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Main spine line */}
          <line
            x1="40"
            y1="35"
            x2="340"
            y2="35"
            stroke="url(#cyanLineGrad)"
            strokeWidth="3"
            filter="url(#nodeGlow)"
          />

          {/* Branching fork lines to the final decision nodes */}
          <path
            d="M 340 35 C 380 35, 400 18, 440 18 L 480 18"
            stroke="#00f0ff"
            strokeWidth="2.5"
            fill="none"
            filter="url(#nodeGlow)"
          />
          <path
            d="M 340 35 C 380 35, 400 52, 440 52 L 480 52"
            stroke="#00f0ff"
            strokeWidth="2.5"
            fill="none"
            filter="url(#nodeGlow)"
          />

          {/* Node 1 */}
          <circle cx="60" cy="35" r="7" fill="#00f0ff" filter="url(#nodeGlow)" />
          <circle cx="60" cy="35" r="3" fill="#ffffff" />

          {/* Node 2 */}
          <circle cx="180" cy="35" r="7" fill="#00f0ff" filter="url(#nodeGlow)" />
          <circle cx="180" cy="35" r="3" fill="#ffffff" />

          {/* Node 3 */}
          <circle cx="300" cy="35" r="7" fill="#00f0ff" filter="url(#nodeGlow)" />
          <circle cx="300" cy="35" r="3" fill="#ffffff" />

          {/* Fork node */}
          <circle cx="340" cy="35" r="5" fill="#38bdf8" />

          {/* Top Branch Node (Target Match) */}
          <circle cx="480" cy="18" r="8" fill="#00f0ff" filter="url(#nodeGlow)" />
          <circle cx="480" cy="18" r="3.5" fill="#ffffff" />

          {/* Bottom Branch Node */}
          <circle cx="480" cy="52" r="6" fill="#00f0ff" opacity="0.8" filter="url(#nodeGlow)" />
        </svg>

        {/* Labels under the nodes */}
        <div className="deduction-pathway-labels">
          <span className="pathway-node-label" style={{ left: "10%" }}>
            {displaySteps[0] ? `Clue 1: ${getLabel(displaySteps[0])}` : "Past 1"}
          </span>
          <span className="pathway-node-label" style={{ left: "34%" }}>
            {displaySteps[1] ? `Clue 2: ${getLabel(displaySteps[1])}` : "Past Clue 2"}
          </span>
          <span className="pathway-node-label" style={{ left: "57%" }}>
            {displaySteps[2] ? `Clue 3: ${getLabel(displaySteps[2])}` : "Clues 3"}
          </span>
          <span className="pathway-node-label final-target" style={{ right: "2%" }}>
            {targetName}
          </span>
        </div>
      </div>
    </div>
  );
}
