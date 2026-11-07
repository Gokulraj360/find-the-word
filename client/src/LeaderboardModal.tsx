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
  const [metalTier, setMetalTier] = useState<"all" | "gold" | "silver" | "bronze">("all");
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
      setMetalTier("all");
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
    setMetalTier("all");
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
      setSubmitSuccess("Record submitted to global leaderboard.");
      setPendingScore(null);
      loadData(activeCategory);
    } catch (err: any) {
      setError(err.message || "Failed to submit record.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatScore = (cat: LeaderboardCategory, score: number) => {
    if (cat === "fastest_guess") {
      return `${score} Qs`;
    }
    if (cat === "best_streak") {
      return `${score} streak`;
    }
    return `${score} Qs`;
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

  const allEntries = data?.entries || [];
  const filteredEntries = metalTier === "gold"
    ? allEntries.slice(0, 1)
    : metalTier === "silver"
    ? allEntries.slice(1, 2)
    : metalTier === "bronze"
    ? allEntries.slice(2, 3)
    : allEntries;

  return (
    <div className="stats-modal-backdrop" onClick={onClose}>
      <div
        className="stats-modal-card leaderboard-modal-card cyber-modal-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="leaderboard-modal-title"
      >
        <div className="stats-modal-header">
          <div>
            <h2 id="leaderboard-modal-title" className="stats-modal-title cyber-title">
              Global Leaderboard
            </h2>
            <p className="stats-modal-subtitle">
              Top deduction records across the Cognitor network
            </p>
          </div>
          <button
            type="button"
            className="stats-modal-close-btn"
            onClick={onClose}
            aria-label="Close leaderboard"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* METALLIC PODIUM TABS (GOLD / SILVER / BRONZE) */}
        <div className="leaderboard-metallic-tabs">
          <button
            type="button"
            className={`metal-tab-btn metal-tab-gold ${metalTier === "gold" ? "metal-active" : ""}`}
            onClick={() => setMetalTier(metalTier === "gold" ? "all" : "gold")}
          >
            <div className="metal-tab-icon gold-glow">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="6"></circle>
                <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"></path>
              </svg>
            </div>
            <span>Gold</span>
          </button>

          <button
            type="button"
            className={`metal-tab-btn metal-tab-silver ${metalTier === "silver" ? "metal-active" : ""}`}
            onClick={() => setMetalTier(metalTier === "silver" ? "all" : "silver")}
          >
            <div className="metal-tab-icon silver-glow">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="6"></circle>
                <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"></path>
              </svg>
            </div>
            <span>Silver</span>
          </button>

          <button
            type="button"
            className={`metal-tab-btn metal-tab-bronze ${metalTier === "bronze" ? "metal-active" : ""}`}
            onClick={() => setMetalTier(metalTier === "bronze" ? "all" : "bronze")}
          >
            <div className="metal-tab-icon bronze-glow">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="6"></circle>
                <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"></path>
              </svg>
            </div>
            <span>Bronze</span>
          </button>
        </div>

        {/* CATEGORY SELECTOR SUB-BAR */}
        <div className="stats-tab-bar leaderboard-tabs" style={{ marginTop: "0.75rem", marginBottom: "1rem" }}>
          <button
            type="button"
            className={`stats-tab-btn ${activeCategory === "fastest_guess" ? "stats-tab-active" : ""}`}
            onClick={() => handleTabChange("fastest_guess")}
          >
            Fastest Guesses
          </button>
          <button
            type="button"
            className={`stats-tab-btn ${activeCategory === "best_streak" ? "stats-tab-active" : ""}`}
            onClick={() => handleTabChange("best_streak")}
          >
            Best Streaks
          </button>
          <button
            type="button"
            className={`stats-tab-btn ${activeCategory === "stumped" ? "stats-tab-active" : ""}`}
            onClick={() => handleTabChange("stumped")}
          >
            Stumped Cognitor
          </button>
          <button
            type="button"
            className={`stats-tab-btn ${activeCategory === "daily" ? "stats-tab-active" : ""}`}
            onClick={() => handleTabChange("daily")}
          >
            Daily Challenge
          </button>
        </div>

        {/* Optional Pending Submission Card */}
        {pendingScore && (
          <div className="leaderboard-submit-banner">
            <div className="submit-banner-header">
              <span className="submit-banner-title">
                Submit Record ({pendingScore.category.replace("_", " ")})
              </span>
              <span className="submit-banner-pill">
                Score: {formatScore(pendingScore.category, pendingScore.score)}
                {pendingScore.entityName ? ` · ${pendingScore.entityName}` : ""}
              </span>
            </div>
            <form onSubmit={handleSubmitScore} className="submit-banner-form">
              <input
                type="text"
                className="submit-banner-input cyber-input"
                placeholder="Enter player nickname..."
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                maxLength={30}
                required
              />
              <button
                type="submit"
                className="btn-cyan-glow"
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

        {/* Body / Rankings List */}
        <div className="leaderboard-body">
          {loading ? (
            <div className="leaderboard-status-msg">Loading records...</div>
          ) : filteredEntries.length === 0 ? (
            <div className="leaderboard-status-msg">
              No entries found yet for this category.
            </div>
          ) : (
            <div className="leaderboard-cyber-list">
              {filteredEntries.map((entry, index) => {
                const rank = metalTier === "gold" ? 1 : metalTier === "silver" ? 2 : metalTier === "bronze" ? 3 : index + 1;
                const isGold = rank === 1;
                const isSilver = rank === 2;
                const isBronze = rank === 3;

                return (
                  <div
                    key={entry.id}
                    className={`leaderboard-cyber-row ${isGold ? "row-gold" : isSilver ? "row-silver" : isBronze ? "row-bronze" : ""}`}
                  >
                    <div className="cyber-rank-col">
                      {isGold ? (
                        <div className="rank-medal-badge badge-gold">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="8" r="6"></circle>
                            <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"></path>
                          </svg>
                        </div>
                      ) : isSilver ? (
                        <div className="rank-medal-badge badge-silver">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="8" r="6"></circle>
                            <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"></path>
                          </svg>
                        </div>
                      ) : isBronze ? (
                        <div className="rank-medal-badge badge-bronze">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="8" r="6"></circle>
                            <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"></path>
                          </svg>
                        </div>
                      ) : (
                        <span className="rank-plain-num">#{rank}</span>
                      )}
                    </div>

                    <div className="cyber-player-col">
                      <div className="cyber-user-avatar">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                          <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                      </div>
                      <div className="cyber-player-info">
                        <span className="cyber-player-name">{entry.playerName}</span>
                        {entry.entityName && (
                          <span className="cyber-player-item">{entry.entityName}</span>
                        )}
                      </div>
                    </div>

                    <div className="cyber-score-col">
                      <span className="cyber-score-val">
                        {formatScore(entry.category, entry.score)}
                      </span>
                      <span className="cyber-score-date">{formatDate(entry.date)}</span>
                    </div>
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
