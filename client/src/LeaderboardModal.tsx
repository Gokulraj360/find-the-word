import React, { useState, useEffect, useCallback } from "react";
import {
  LeaderboardCategory,
  LeaderboardEntry,
  LeaderboardData,
  fetchLeaderboard,
  submitLeaderboardEntry,
  getSavedPlayerName,
  setSavedPlayerName
} from "./leaderboard.js";

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  prefillSubmit?: {
    category: LeaderboardCategory;
    score: number;
    entityName?: string;
    domain?: "character" | "object";
    difficulty?: "easy" | "hard" | "expert";
  } | null;
}

export function LeaderboardModal({ isOpen, onClose, prefillSubmit }: LeaderboardModalProps) {
  const [activeCategory, setActiveCategory] = useState<LeaderboardCategory>(
    prefillSubmit ? prefillSubmit.category : "fastest_guess"
  );
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Submission state
  const [playerName, setPlayerName] = useState<string>(getSavedPlayerName());
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [pendingScore, setPendingScore] = useState(prefillSubmit);

  const loadData = useCallback(async (cat: LeaderboardCategory) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchLeaderboard(cat, 25);
      setData(result);
    } catch (err: any) {
      setError(err.message || "Failed to load leaderboard.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      if (prefillSubmit) {
        setActiveCategory(prefillSubmit.category);
        setPendingScore(prefillSubmit);
        loadData(prefillSubmit.category);
      } else {
        loadData(activeCategory);
      }
      setPlayerName(getSavedPlayerName());
      setSubmitSuccess(null);
    }
  }, [isOpen, prefillSubmit, loadData, activeCategory]);

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

  const handleTabChange = (cat: LeaderboardCategory) => {
    setActiveCategory(cat);
    loadData(cat);
  };

  const handleSubmitScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingScore) return;

    const trimmed = playerName.trim();
    if (!trimmed) {
      setError("Please enter your player nickname.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await submitLeaderboardEntry({
        playerName: trimmed,
        category: pendingScore.category,
        score: pendingScore.score,
        entityName: pendingScore.entityName,
        domain: pendingScore.domain,
        difficulty: pendingScore.difficulty
      });
      setSavedPlayerName(trimmed);
      setSubmitSuccess(`Your score of ${pendingScore.score} has been submitted!`);
      setPendingScore(null);
      await loadData(activeCategory);
    } catch (err: any) {
      setError(err.message || "Submission failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const entries = data?.entries || [];
  const topThree = entries.slice(0, 3);
  const remaining = entries.slice(3);

  const formatScore = (cat: LeaderboardCategory, score: number) => {
    if (cat === "fastest_guess" || cat === "daily") {
      return `${score} questions`;
    }
    if (cat === "best_streak") {
      return `${score} streak`;
    }
    return `${score} questions`;
  };

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric"
      });
    } catch {
      return "";
    }
  };

  return (
    <div className="stats-modal-backdrop" onClick={onClose}>
      <div
        className="stats-modal-card leaderboard-modal-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="leaderboard-modal-title"
      >
        <div className="stats-modal-header">
          <div>
            <h2 id="leaderboard-modal-title" className="stats-modal-title">
              Cognitor Global Leaderboard
            </h2>
            <p className="stats-modal-subtitle">
              Top records and achievements across the player community
            </p>
          </div>
          <button
            type="button"
            className="stats-modal-close"
            onClick={onClose}
            aria-label="Close leaderboard"
          >
            x
          </button>
        </div>

        {/* Global Summary Stats */}
        {data?.summary && (
          <div className="leaderboard-summary-strip">
            <div className="leaderboard-summary-box">
              <span className="summary-box-label">Fastest Guess Record</span>
              <span className="summary-box-val">
                {data.summary.bestFastestGuess !== null
                  ? `${data.summary.bestFastestGuess} questions`
                  : "--"}
              </span>
            </div>
            <div className="leaderboard-summary-box">
              <span className="summary-box-label">Longest Streak</span>
              <span className="summary-box-val">
                {data.summary.highestStreak !== null
                  ? `${data.summary.highestStreak} wins`
                  : "--"}
              </span>
            </div>
            <div className="leaderboard-summary-box">
              <span className="summary-box-label">Total Submissions</span>
              <span className="summary-box-val">{data.summary.totalSubmissions}</span>
            </div>
          </div>
        )}

        {/* Optional Pending Submission Card */}
        {pendingScore && (
          <div className="leaderboard-submit-banner">
            <div className="submit-banner-header">
              <span className="submit-banner-title">
                Submit Your Recent Record ({pendingScore.category.replace("_", " ").toUpperCase()})
              </span>
              <span className="submit-banner-pill">
                Score: {formatScore(pendingScore.category, pendingScore.score)}
                {pendingScore.entityName ? ` | ${pendingScore.entityName}` : ""}
              </span>
            </div>
            <form onSubmit={handleSubmitScore} className="submit-banner-form">
              <input
                type="text"
                className="submit-banner-input"
                placeholder="Enter your nickname..."
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                maxLength={30}
                required
              />
              <button
                type="submit"
                className="game-btn game-btn-primary submit-banner-btn"
                disabled={submitting}
              >
                {submitting ? "Submitting..." : "Submit Score"}
              </button>
            </form>
          </div>
        )}

        {submitSuccess && (
          <div className="leaderboard-alert-success">{submitSuccess}</div>
        )}
        {error && <div className="leaderboard-alert-error">{error}</div>}

        {/* Category Tabs */}
        <div className="stats-tab-bar leaderboard-tabs">
          <button
            type="button"
            className={`stats-tab-btn ${activeCategory === "fastest_guess" ? "active" : ""}`}
            onClick={() => handleTabChange("fastest_guess")}
          >
            Fastest Guesses
          </button>
          <button
            type="button"
            className={`stats-tab-btn ${activeCategory === "best_streak" ? "active" : ""}`}
            onClick={() => handleTabChange("best_streak")}
          >
            Best Streaks
          </button>
          <button
            type="button"
            className={`stats-tab-btn ${activeCategory === "stumped" ? "active" : ""}`}
            onClick={() => handleTabChange("stumped")}
          >
            Stumped Cognitor
          </button>
          <button
            type="button"
            className={`stats-tab-btn ${activeCategory === "daily" ? "active" : ""}`}
            onClick={() => handleTabChange("daily")}
          >
            Daily Challenge
          </button>
        </div>

        {/* Body / Rankings */}
        <div className="leaderboard-body">
          {loading ? (
            <div className="leaderboard-status-msg">Loading records...</div>
          ) : entries.length === 0 ? (
            <div className="leaderboard-status-msg">
              No entries found yet for this category. Be the first to submit a score!
            </div>
          ) : (
            <>
              {/* Podium for top 3 */}
              {topThree.length > 0 && (
                <div className="leaderboard-podium">
                  {topThree.map((entry, index) => {
                    const rank = index + 1;
                    const rankClass =
                      rank === 1 ? "podium-gold" : rank === 2 ? "podium-silver" : "podium-bronze";
                    const medalLabel = rank === 1 ? "1st" : rank === 2 ? "2nd" : "3rd";
                    return (
                      <div key={entry.id} className={`podium-card ${rankClass}`}>
                        <div className="podium-badge">{medalLabel}</div>
                        <div className="podium-name" title={entry.playerName}>
                          {entry.playerName}
                        </div>
                        <div className="podium-score">
                          {formatScore(entry.category, entry.score)}
                        </div>
                        {entry.entityName && (
                          <div className="podium-entity" title={entry.entityName}>
                            {entry.entityName}
                          </div>
                        )}
                        <div className="podium-meta">
                          {entry.difficulty && (
                            <span className="podium-difficulty">{entry.difficulty}</span>
                          )}
                          <span className="podium-date">{formatDate(entry.date)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Ranks 4+ Table */}
              {remaining.length > 0 && (
                <div className="leaderboard-table-container">
                  <table className="leaderboard-table">
                    <thead>
                      <tr>
                        <th>Rank</th>
                        <th>Player</th>
                        <th>Score</th>
                        <th>Item</th>
                        <th>Difficulty</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {remaining.map((entry, idx) => (
                        <tr key={entry.id}>
                          <td className="rank-cell">#{idx + 4}</td>
                          <td className="player-cell">{entry.playerName}</td>
                          <td className="score-cell">
                            {formatScore(entry.category, entry.score)}
                          </td>
                          <td className="entity-cell">{entry.entityName || "--"}</td>
                          <td className="diff-cell">
                            {entry.difficulty ? (
                              <span className={`diff-tag diff-${entry.difficulty}`}>
                                {entry.difficulty}
                              </span>
                            ) : (
                              "--"
                            )}
                          </td>
                          <td className="date-cell">{formatDate(entry.date)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>

        <div className="stats-modal-footer">
          <button type="button" className="game-btn game-btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
