import React, { useEffect, useState } from "react";
import { DailyChallengeData, DailyResult, DailyStreakState } from "./dailyChallenge.js";

interface GameModesModalProps {
  isOpen: boolean;
  onClose: () => void;
  dailyData: DailyChallengeData | null;
  dailyResult: DailyResult | null;
  dailyStreak: DailyStreakState;
  onPlayDaily: () => void;
  onStartTwoPlayer: () => void;
  onStartQuiz: (domain: "all" | "character" | "object") => void;
  onStartReversal: (domain: "character" | "object") => void;
  onCreateChallenge: () => void;
  onPlayChallengeCode: (code: string) => void;
}

export function GameModesModal({
  isOpen,
  onClose,
  dailyData,
  dailyResult,
  dailyStreak,
  onPlayDaily,
  onStartTwoPlayer,
  onStartQuiz,
  onStartReversal,
  onCreateChallenge,
  onPlayChallengeCode
}: GameModesModalProps) {
  const [friendCodeInput, setFriendCodeInput] = useState("");

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

  const handleJoinFriend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!friendCodeInput.trim()) return;
    onPlayChallengeCode(friendCodeInput.trim());
    onClose();
  };

  return (
    <div className="stats-modal-backdrop" onClick={onClose}>
      <div
        className="stats-modal-card modes-modal-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modes-modal-title"
      >
        <div className="stats-modal-header">
          <div className="stats-modal-title-group">
            <span className="stats-modal-eyebrow">Special Challenges</span>
            <h2 id="modes-modal-title" className="stats-modal-title">
              More Game Modes
            </h2>
          </div>
          <button
            className="stats-modal-close-btn"
            onClick={onClose}
            aria-label="Close game modes dialog"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="modes-modal-grid">
          {/* DAILY CHALLENGE */}
          {dailyData && (
            <div className="mode-card-item">
              <div className="mode-card-header">
                <span className="mode-badge mode-badge-daily">Daily Puzzle</span>
                {dailyStreak.currentStreak > 0 && (
                  <span className="mode-pill-streak">{dailyStreak.currentStreak} Day Streak</span>
                )}
              </div>
              <h3 className="mode-card-title">Daily Challenge #{dailyData.dayNumber}</h3>
              <p className="mode-card-desc">
                {dailyResult
                  ? "You have completed today's challenge. Come back tomorrow for a new mystery."
                  : `Think of today's target: "${dailyData.entity.name}". Can Cognitor guess it within 20 questions?`}
              </p>
              <div className="mode-card-actions">
                {!dailyResult ? (
                  <button
                    className="btn btn-primary mode-action-btn"
                    onClick={() => {
                      onPlayDaily();
                      onClose();
                    }}
                  >
                    Play Daily Challenge
                  </button>
                ) : (
                  <span className="mode-status-completed">Completed for today</span>
                )}
              </div>
            </div>
          )}

          {/* ROLE REVERSAL */}
          <div className="mode-card-item">
            <div className="mode-card-header">
              <span className="mode-badge mode-badge-reversal">Role Reversal</span>
              <span className="mode-meta-tag">20 Questions · 3 Guesses</span>
            </div>
            <h3 className="mode-card-title">You Guess, Cognitor Answers</h3>
            <p className="mode-card-desc">
              Flip the script. Cognitor thinks of a secret entity and answers your questions with ground-truth probabilities.
            </p>
            <div className="mode-card-actions">
              <button
                className="btn btn-secondary mode-action-btn"
                onClick={() => {
                  onStartReversal("character");
                  onClose();
                }}
              >
                Play Characters
              </button>
              <button
                className="btn btn-secondary mode-action-btn"
                onClick={() => {
                  onStartReversal("object");
                  onClose();
                }}
              >
                Play Objects
              </button>
            </div>
          </div>

          {/* 2-PLAYER DUEL */}
          <div className="mode-card-item">
            <div className="mode-card-header">
              <span className="mode-badge mode-badge-duel">Local Multiplayer</span>
              <span className="mode-meta-tag">Same Device</span>
            </div>
            <h3 className="mode-card-title">2-Player Duel</h3>
            <p className="mode-card-desc">
              Challenge a friend locally on the same screen. Compete round-by-round or in a rapid alternating turn race.
            </p>
            <div className="mode-card-actions">
              <button
                className="btn btn-secondary mode-action-btn"
                onClick={() => {
                  onStartTwoPlayer();
                  onClose();
                }}
              >
                Launch 2-Player Match
              </button>
            </div>
          </div>

          {/* QUICK QUIZ TRIVIA */}
          <div className="mode-card-item">
            <div className="mode-card-header">
              <span className="mode-badge mode-badge-quiz">Speed Trivia</span>
              <span className="mode-meta-tag">5 Rounds</span>
            </div>
            <h3 className="mode-card-title">Quick Quiz Arena</h3>
            <p className="mode-card-desc">
              Test your knowledge against the clock. Identify entities from pictures, trait clues, and fun facts.
            </p>
            <div className="mode-card-actions">
              <button
                className="btn btn-secondary mode-action-btn"
                onClick={() => {
                  onStartQuiz("all");
                  onClose();
                }}
              >
                Play All Items
              </button>
              <button
                className="btn btn-secondary mode-action-btn"
                onClick={() => {
                  onStartQuiz("character");
                  onClose();
                }}
              >
                Characters Only
              </button>
            </div>
          </div>

          {/* FRIEND CHALLENGE */}
          <div className="mode-card-item mode-card-full">
            <div className="mode-card-header">
              <span className="mode-badge mode-badge-friend">Social Challenge</span>
              <span className="mode-meta-tag">Code Share</span>
            </div>
            <h3 className="mode-card-title">Challenge a Friend</h3>
            <p className="mode-card-desc">
              Pick any secret entity and generate a unique challenge code to test your friends, or enter their code below.
            </p>
            <div className="friend-actions-split">
              <button
                className="btn btn-primary"
                onClick={() => {
                  onCreateChallenge();
                  onClose();
                }}
              >
                Create a Challenge Code
              </button>
              <form onSubmit={handleJoinFriend} className="friend-join-form">
                <input
                  type="text"
                  placeholder="Enter COG-XXXX"
                  className="friend-code-input"
                  value={friendCodeInput}
                  onChange={(e) => setFriendCodeInput(e.target.value)}
                  maxLength={10}
                />
                <button type="submit" className="btn btn-secondary" disabled={!friendCodeInput.trim()}>
                  Join
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
