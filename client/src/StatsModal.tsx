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

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: UserStats;
  onReset: () => void;
  initialTab?: "stats" | "achievements" | "history";
}

export function StatsModal({
  isOpen,
  onClose,
  stats,
  onReset,
  initialTab = "stats"
}: StatsModalProps) {
  const [activeTab, setActiveTab] = useState<"stats" | "achievements" | "history">(initialTab);
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
            <span className="stats-modal-eyebrow">Player Profile</span>
            <h2 id="stats-modal-title" className="stats-modal-title">
              Stats & History
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

        {/* TAB 2: ACHIEVEMENTS */}
        {activeTab === "achievements" && (
          <div className="achievements-list">
            {achievements.map((ach) => (
              <div
                key={ach.id}
                className={`achievement-card ${ach.unlocked ? "ach-unlocked" : "ach-locked"}`}
              >
                <div className="ach-icon-wrapper">
                  {ach.unlocked ? (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                  )}
                </div>

                <div className="ach-body">
                  <div className="ach-title-row">
                    <span className="ach-title">{ach.title}</span>
                    {ach.unlocked && (
                      <span className="ach-unlocked-tag">Unlocked</span>
                    )}
                  </div>
                  <p className="ach-desc">{ach.description}</p>

                  <div className="ach-progress-container">
                    <div className="ach-progress-track">
                      <div
                        className="ach-progress-bar"
                        style={{
                          width: `${Math.min(100, Math.round((ach.currentProgress / ach.maxProgress) * 100))}%`
                        }}
                      />
                    </div>
                    <span className="ach-progress-text">
                      {ach.currentProgress} / {ach.maxProgress}
                    </span>
                  </div>
                </div>
              </div>
            ))}
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
                <p className="history-empty-title">No Games Recorded Yet</p>
                <p className="history-empty-sub">
                  Play a game of 20 Questions to record your deductions, questions asked, and win records.
                </p>
              </div>
            ) : (
              <div className="history-items-list">
                {history.map((entry) => {
                  const isExpanded = expandedId === entry.id;
                  const isCognitorWin = entry.result === "won";

                  return (
                    <div
                      key={entry.id}
                      className={`history-card-item ${isCognitorWin ? "history-item-win" : "history-item-stumped"}`}
                    >
                      <div className="history-item-main" onClick={() => toggleExpand(entry.id)}>
                        <div className="history-item-left">
                          <span
                            className={`history-result-pill ${
                              isCognitorWin ? "result-pill-win" : "result-pill-stumped"
                            }`}
                          >
                            {isCognitorWin ? "Cognitor Won" : "Stumped"}
                          </span>
                          <div className="history-item-titles">
                            <h4 className="history-entity-name">{entry.entityName}</h4>
                            <div className="history-meta-row">
                              <span className="history-meta-tag">
                                {entry.domain === "character" ? "Character" : "Object"}
                              </span>
                              <span className="history-meta-date" title={formatGameDate(entry.timestamp)}>
                                {formatRelativeTime(entry.timestamp)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="history-item-right">
                          <span className="history-q-count">
                            {entry.questionsCount} Qs
                          </span>
                          <button
                            className="history-expand-btn"
                            aria-label={isExpanded ? "Collapse questions" : "Expand questions"}
                          >
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
                          </button>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="history-expanded-tray">
                          <div className="history-tray-header">
                            <span>Question Breakdown ({entry.questions.length} questions)</span>
                          </div>
                          {entry.questions && entry.questions.length > 0 ? (
                            <div className="history-tray-rows">
                              {entry.questions.map((q) => (
                                <div key={q.step} className="history-tray-row">
                                  <span className="h-step-pill">Q{q.step}</span>
                                  <span className="history-tray-q-text">{q.text}</span>
                                  <span className={`h-badge ${getAnswerBadgeClass(q.answerValue)}`}>
                                    {q.answerLabel}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="history-tray-empty">No detailed question log stored for this game.</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* FOOTER */}
        <div className="stats-modal-footer">
          {activeTab === "stats" && (
            <button
              className={`stats-reset-btn ${confirmReset ? "stats-reset-btn-confirm" : ""}`}
              onClick={handleResetClick}
              title="Reset all streak counters and games played"
            >
              {confirmReset ? "Confirm Reset All Stats?" : "Reset Stats"}
            </button>
          )}
          <button className="btn btn-secondary stats-done-btn" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
