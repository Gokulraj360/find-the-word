import React, { useState, useEffect } from "react";
import { UserStats, calculateWinRate } from "./userStats.js";
import { Achievement, getAllAchievements } from "./achievements.js";
import {
  GameHistoryEntry,
  getGameHistory,
  clearGameHistory,
  formatRelativeTime,
  formatGameDate,
  MAX_HISTORY_ENTRIES
} from "./gameHistory.js";
import { HexBadge, BadgeType } from "./HexBadge.js";

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: UserStats;
  onReset: () => void;
  initialTab?: "stats" | "achievements" | "history";
}

const HEX_BADGES_LIST: { id: string; type: BadgeType; label: string }[] = [
  { id: "first_win", type: "novice_seeker", label: "Novice Seeker" },
  { id: "streak_5", type: "deduction_master", label: "Deduction Master" },
  { id: "speed_under_8", type: "speed_demon", label: "Speed Demon" },
  { id: "stumped_3", type: "stump_champion", label: "Stump Champion" },
  { id: "dual_scholar", type: "polymath", label: "Polymath" },
  { id: "games_10", type: "trivia_ace", label: "Trivia Ace" },
  { id: "expert_win", type: "duelist", label: "Duelist" },
  { id: "streak_10", type: "unstoppable", label: "Unstoppable" }
];

export function StatsModal({
  isOpen,
  onClose,
  stats,
  onReset,
  initialTab = "stats"
}: StatsModalProps) {
  const [activeTab, setActiveTab] = useState<"stats" | "achievements" | "history">(initialTab);
  const [selectedBadgeId, setSelectedBadgeId] = useState<string>("first_win");
  const [confirmReset, setConfirmReset] = useState(false);
  const [history, setHistory] = useState<GameHistoryEntry[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [confirmClearHistory, setConfirmClearHistory] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setHistory(getGameHistory());
      setConfirmReset(false);
      setConfirmClearHistory(false);
      setExpandedId(null);
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

  const handleClearHistory = () => {
    if (!confirmClearHistory) {
      setConfirmClearHistory(true);
      return;
    }
    clearGameHistory();
    setHistory([]);
    setConfirmClearHistory(false);
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const getAnswerBadgeClass = (val: number) => {
    if (val >= 0.9) return "h-badge-yes";
    if (val <= 0.1) return "h-badge-no";
    if (val >= 0.7) return "h-badge-probably";
    if (val <= 0.3) return "h-badge-probnot";
    return "h-badge-dontknow";
  };

  const selectedAch = achievements.find((a) => a.id === selectedBadgeId) || achievements[0];

  return (
    <div className="stats-modal-backdrop" onClick={onClose}>
      <div
        className="stats-modal-card cyber-modal-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="stats-modal-title"
      >
        <div className="stats-modal-header">
          <div className="stats-modal-title-group">
            <span className="stats-modal-eyebrow">Cognitor Dossier</span>
            <h2 id="stats-modal-title" className="stats-modal-title cyber-title">
              Player Stats
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
            Badges ({unlockedCount}/{achievements.length})
          </button>
          <button
            className={`stats-tab-btn ${activeTab === "history" ? "stats-tab-active" : ""}`}
            onClick={() => setActiveTab("history")}
          >
            Match History ({history.length})
          </button>
        </div>

        {/* TAB 1: OVERVIEW STATS */}
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
              <span className="stats-card-label">Times Stumped</span>
              <span className="stats-card-value">{stats.stumpedCount}</span>
              <span className="stats-card-hint">You beat Cognitor</span>
            </div>

            <div className="stats-card">
              <span className="stats-card-label">Domain Solved</span>
              <div className="stats-domain-split">
                <span>Characters: {stats.charactersWon}</span>
                <span>Objects: {stats.objectsWon}</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ACHIEVEMENTS / 4x2 HEXAGONAL BADGES GRID */}
        {activeTab === "achievements" && (
          <div className="hex-achievements-container">
            <div className="hex-badges-grid">
              {HEX_BADGES_LIST.map((item) => {
                const ach = achievements.find((a) => a.id === item.id);
                const isUnlocked = Boolean(ach?.unlocked);
                const progressText = ach ? `${ach.currentProgress}/${ach.maxProgress}` : "";

                return (
                  <HexBadge
                    key={item.id}
                    type={item.type}
                    title={item.label}
                    unlocked={isUnlocked}
                    progressText={progressText}
                    onClick={() => setSelectedBadgeId(item.id)}
                  />
                );
              })}
            </div>

            {selectedAch && (
              <div className="hex-selected-detail-card">
                <div className="selected-detail-header">
                  <span className="selected-detail-title">{selectedAch.title}</span>
                  {selectedAch.unlocked ? (
                    <span className="selected-detail-tag tag-unlocked">Unlocked</span>
                  ) : (
                    <span className="selected-detail-tag tag-locked">Locked</span>
                  )}
                </div>
                <p className="selected-detail-desc">{selectedAch.description}</p>
                <div className="ach-progress-container">
                  <div className="ach-progress-track">
                    <div
                      className="ach-progress-bar"
                      style={{
                        width: `${Math.min(100, Math.round((selectedAch.currentProgress / selectedAch.maxProgress) * 100))}%`
                      }}
                    />
                  </div>
                  <span className="ach-progress-text">
                    {selectedAch.currentProgress} / {selectedAch.maxProgress}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: MATCH HISTORY */}
        {activeTab === "history" && (
          <div className="history-tab-container">
            <div className="history-tab-topbar">
              <span className="history-tab-summary">
                {history.length} / {MAX_HISTORY_ENTRIES} Recent Matches
              </span>
              {history.length > 0 && (
                <button
                  className={`stats-reset-btn ${confirmClearHistory ? "stats-reset-btn-confirm" : ""}`}
                  onClick={handleClearHistory}
                >
                  {confirmClearHistory ? "Confirm Clear?" : "Clear History"}
                </button>
              )}
            </div>

            {history.length === 0 ? (
              <div className="history-empty-state">
                <div className="history-empty-icon">
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                </div>
                <p className="history-empty-title">No matches recorded yet</p>
                <p className="history-empty-hint">
                  Complete a deduction session to build your personal dossier.
                </p>
              </div>
            ) : (
              <div className="history-list">
                {history.map((entry) => {
                  const isExpanded = expandedId === entry.id;
                  const isWon = entry.result === "won";
                  const questionList = entry.questions || [];
                  return (
                    <div
                      key={entry.id}
                      className={`history-item-card ${isWon ? "history-won" : "history-lost"} ${isExpanded ? "history-expanded" : ""}`}
                    >
                      <div
                        className="history-summary-row"
                        onClick={() => toggleExpand(entry.id)}
                        role="button"
                        tabIndex={0}
                        aria-expanded={isExpanded}
                      >
                        <div className="history-outcome-pill">
                          <span className={`outcome-dot ${isWon ? "dot-won" : "dot-lost"}`} />
                          <span className="outcome-text">
                            {isWon ? "Cognitor Won" : "You Stumped Cognitor"}
                          </span>
                        </div>

                        <div className="history-entity-info">
                          <span className="history-entity-name" title={entry.entityName}>
                            {entry.entityName}
                          </span>
                          <span className="history-meta-sub">
                            {entry.domain === "object" ? "Object" : "Character"} · {entry.difficulty} mode
                          </span>
                        </div>

                        <div className="history-step-count">
                          <span className="step-num">{entry.questionsCount}</span>
                          <span className="step-label">Qs</span>
                        </div>

                        <div className="history-time-col">
                          <span className="history-rel-time">{formatRelativeTime(entry.timestamp)}</span>
                          <span className="history-abs-time">{formatGameDate(entry.timestamp)}</span>
                        </div>

                        <div className="history-chevron">
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            style={{
                              transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                              transition: "transform 0.15s ease"
                            }}
                          >
                            <polyline points="6 9 12 15 18 9"></polyline>
                          </svg>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="history-expanded-content">
                          <div className="history-pathway-header">
                            <span>Question Pathway ({questionList.length} Steps)</span>
                          </div>
                          <div className="history-pathway-list">
                            {questionList.map((p) => (
                              <div key={p.step} className="history-pathway-item">
                                <span className="pathway-step-idx">#{p.step}</span>
                                <span className="pathway-q-text">{p.text}</span>
                                <span className={`h-badge ${getAnswerBadgeClass(p.answerValue)}`}>
                                  {p.answerLabel}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <div className="stats-modal-footer">
          {activeTab === "stats" && (
            <button
              className={`stats-reset-btn ${confirmReset ? "stats-reset-btn-confirm" : ""}`}
              onClick={handleResetClick}
            >
              {confirmReset ? "Confirm Reset All Data?" : "Reset Lifetime Stats"}
            </button>
          )}
          <button className="game-btn game-btn-secondary" onClick={onClose} style={{ marginLeft: "auto" }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
