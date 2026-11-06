import React, { useState, useEffect } from "react";
import { UserStats, calculateWinRate } from "./userStats.js";
import { Achievement, getAllAchievements } from "./achievements.js";

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: UserStats;
  onReset: () => void;
  initialTab?: "stats" | "achievements";
}

export function StatsModal({
  isOpen,
  onClose,
  stats,
  onReset,
  initialTab = "stats"
}: StatsModalProps) {
  const [activeTab, setActiveTab] = useState<"stats" | "achievements">(initialTab);
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const winRate = calculateWinRate(stats);
  const achievements: Achievement[] = getAllAchievements(stats);
  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  const handleResetClick = () => {
    if (!confirmReset) {
      setConfirmReset(true);
      return;
    }
    onReset();
    setConfirmReset(false);
  };

  return (
    <div className="stats-modal-backdrop" onClick={onClose}>
      <div
        className="stats-modal-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="stats-modal-title"
      >
        <div className="stats-modal-header">
          <div className="stats-modal-title-group">
            <span className="stats-modal-eyebrow">Player Journey</span>
            <h2 id="stats-modal-title" className="stats-modal-title">
              Streaks & Badges
            </h2>
          </div>
          <button
            className="stats-modal-close-btn"
            onClick={onClose}
            aria-label="Close statistics dialog"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* TAB NAVIGATION */}
        <div className="stats-tab-bar">
          <button
            className={`stats-tab-btn ${activeTab === "stats" ? "stats-tab-active" : ""}`}
            onClick={() => setActiveTab("stats")}
          >
            Overview
          </button>
          <button
            className={`stats-tab-btn ${activeTab === "achievements" ? "stats-tab-active" : ""}`}
            onClick={() => setActiveTab("achievements")}
          >
            Achievements ({unlockedCount}/{achievements.length})
          </button>
        </div>

        {/* TAB CONTENT: STATS */}
        {activeTab === "stats" && (
          <div className="stats-grid">
            <div className="stats-card">
              <span className="stats-card-label">Games Played</span>
              <span className="stats-card-value">{stats.gamesPlayed}</span>
              <span className="stats-card-hint">Total rounds completed</span>
            </div>

            <div className="stats-card">
              <span className="stats-card-label">Cognitor Accuracy</span>
              <span className="stats-card-value">{winRate}%</span>
              <span className="stats-card-hint">
                {stats.cognitorWins} solved / {stats.gamesPlayed} games
              </span>
            </div>

            <div className="stats-card">
              <span className="stats-card-label">Current Streak</span>
              <span className="stats-card-value">{stats.currentStreak}</span>
              <span className="stats-card-hint">
                Best ever: {stats.bestStreak}
              </span>
            </div>

            <div className="stats-card">
              <span className="stats-card-label">Fastest Deduction</span>
              <span className="stats-card-value">
                {stats.fastestGuess !== null ? `${stats.fastestGuess} Qs` : "-"}
              </span>
              <span className="stats-card-hint">Fewest questions to solve</span>
            </div>

            <div className="stats-card stats-card-highlight">
              <span className="stats-card-label">Times You Stumped Cognitor</span>
              <span className="stats-card-value">{stats.stumpedCount}</span>
              <span className="stats-card-hint">Rounds you outsmarted the engine</span>
            </div>

            <div className="stats-card">
              <span className="stats-card-label">Domain Solves</span>
              <div className="stats-domain-split">
                <span>Characters: {stats.charactersWon}</span>
                <span>Objects: {stats.objectsWon}</span>
              </div>
              <span className="stats-card-hint">Breakdown across categories</span>
            </div>
          </div>
        )}

        {/* TAB CONTENT: ACHIEVEMENTS */}
        {activeTab === "achievements" && (
          <div className="achievements-scroll-list">
            {achievements.map((ach) => (
              <div
                key={ach.id}
                className={`achievement-item-card ${ach.unlocked ? "achievement-unlocked" : "achievement-locked"}`}
              >
                <div className="achievement-icon-col">
                  {ach.unlocked ? (
                    <div className="achievement-badge-unlocked">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </div>
                  ) : (
                    <div className="achievement-badge-locked">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                      </svg>
                    </div>
                  )}
                </div>

                <div className="achievement-details">
                  <div className="achievement-title-row">
                    <span className="achievement-title">{ach.title}</span>
                    <span className="achievement-category-tag">{ach.category}</span>
                  </div>
                  <p className="achievement-desc">{ach.description}</p>

                  <div className="achievement-progress-row">
                    <div className="achievement-progress-track">
                      <div
                        className="achievement-progress-fill"
                        style={{
                          width: `${Math.round((ach.currentProgress / ach.maxProgress) * 100)}%`
                        }}
                      ></div>
                    </div>
                    <span className="achievement-progress-num">
                      {ach.unlocked ? "Unlocked" : `${ach.currentProgress} / ${ach.maxProgress}`}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="stats-modal-footer">
          {confirmReset ? (
            <div className="reset-confirm-group">
              <span className="reset-confirm-prompt">Reset stats & badges?</span>
              <button
                className="btn-danger-sm"
                onClick={handleResetClick}
              >
                Yes, Reset
              </button>
              <button
                className="sub-btn-sm"
                onClick={() => setConfirmReset(false)}
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              className="stats-reset-link"
              onClick={handleResetClick}
              disabled={stats.gamesPlayed === 0 && unlockedCount === 0}
            >
              Reset Data
            </button>
          )}

          <button className="stats-done-btn" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
