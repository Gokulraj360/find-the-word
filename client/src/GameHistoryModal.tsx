import React, { useState, useEffect } from "react";
import {
  GameHistoryEntry,
  getGameHistory,
  clearGameHistory,
  formatRelativeTime,
  formatGameDate,
  MAX_HISTORY_ENTRIES
} from "./gameHistory.js";

interface GameHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClear?: () => void;
}

export function GameHistoryModal({
  isOpen,
  onClose,
  onClear
}: GameHistoryModalProps) {
  const [history, setHistory] = useState<GameHistoryEntry[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setHistory(getGameHistory());
      setConfirmClear(false);
      setExpandedId(null);
    }
  }, [isOpen]);

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

  const handleClearClick = () => {
    if (!confirmClear) {
      setConfirmClear(true);
      return;
    }
    clearGameHistory();
    setHistory([]);
    setConfirmClear(false);
    if (onClear) onClear();
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
        className="stats-modal-card history-modal-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="history-modal-title"
      >
        <div className="stats-modal-header">
          <div className="stats-modal-title-wrap">
            <h2 id="history-modal-title" className="stats-modal-title">
              Game History
            </h2>
            <span className="history-count-badge">
              {history.length} / {MAX_HISTORY_ENTRIES} Recent Games
            </span>
          </div>

          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            {history.length > 0 && (
              <button
                className={`stats-reset-btn ${confirmClear ? "stats-reset-btn-confirm" : ""}`}
                onClick={handleClearClick}
                title="Clear all recorded game history"
              >
                {confirmClear ? "Confirm Clear?" : "Clear"}
              </button>
            )}
            <button
              className="stats-modal-close"
              onClick={onClose}
              aria-label="Close game history"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>

        <div className="history-modal-content">
          {history.length === 0 ? (
            <div className="history-empty-state">
              <div className="history-empty-icon">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
              </div>
              <p className="history-empty-title">No Games Recorded Yet</p>
              <p className="history-empty-sub">
                Complete a round of 20 Questions to record your deductions, questions asked, and win or loss records.
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
                          {isCognitorWin ? "Cognitor Won" : "Stumped Cognitor"}
                        </span>
                        <div className="history-item-titles">
                          <h4 className="history-entity-name">{entry.entityName}</h4>
                          <div className="history-meta-row">
                            <span className="history-meta-tag">
                              {entry.domain === "character" ? "Character" : "Object"}
                            </span>
                            <span className="history-meta-tag">{entry.difficulty}</span>
                            {entry.pack && entry.pack !== "all" && (
                              <span className="history-meta-tag history-pack-tag">
                                {entry.pack}
                              </span>
                            )}
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
      </div>
    </div>
  );
}
