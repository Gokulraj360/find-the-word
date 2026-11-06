import React, { useState, useEffect, useMemo } from "react";
import { sounds } from "./soundEffects.js";
import { triggerConfetti } from "./confetti.js";
import {
  PlayerScore,
  DuelResult,
  determineDuelWinner
} from "./twoPlayerUtils.js";

interface TwoPlayerArenaProps {
  onExit: () => void;
}

type DuelStyle = "round_duel" | "turn_race";

interface QuestionItem {
  id: number;
  text: string;
  category?: string;
}

interface EntityItem {
  id: number;
  name: string;
  description: string | null;
}

interface TurnAnswerRecord {
  step: number;
  questionId: number;
  questionText: string;
  answerLabel: "Yes" | "Probably" | "Don't know" | "Probably not" | "No";
  answerValue: number;
  askedBy: string;
}

function getAnswerPillClass(label: string): string {
  switch (label) {
    case "Yes":
      return "ans-pill-yes";
    case "No":
      return "ans-pill-no";
    case "Probably":
      return "ans-pill-prob";
    case "Probably not":
      return "ans-pill-probnot";
    default:
      return "ans-pill-dk";
  }
}

export function TwoPlayerArena({ onExit }: TwoPlayerArenaProps) {
  // Setup state
  const [stage, setStage] = useState<"setup" | "playing" | "round_transition" | "match_over">("setup");
  const [player1Name, setPlayer1Name] = useState<string>("Player 1");
  const [player2Name, setPlayer2Name] = useState<string>("Player 2");
  const [domain, setDomain] = useState<"character" | "object">("object");
  const [duelStyle, setDuelStyle] = useState<DuelStyle>("round_duel");

  // Game session state
  const [activePlayer, setActivePlayer] = useState<1 | 2>(1);
  const [currentRound, setCurrentRound] = useState<1 | 2>(1);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [maxQuestions, setMaxQuestions] = useState<number>(20);
  const [maxGuesses, setMaxGuesses] = useState<number>(3);
  const [history, setHistory] = useState<TurnAnswerRecord[]>([]);
  const [wrongGuesses, setWrongGuesses] = useState<string[]>([]);
  const [penaltyQuestions, setPenaltyQuestions] = useState<number>(0);
  const [hintsCount, setHintsCount] = useState<number>(0);
  const [askingId, setAskingId] = useState<number | null>(null);

  // Scores tracked
  const [p1Score, setP1Score] = useState<PlayerScore | null>(null);
  const [p2Score, setP2Score] = useState<PlayerScore | null>(null);
  const [matchResult, setMatchResult] = useState<DuelResult | null>(null);

  // Questions and Guessing
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [entities, setEntities] = useState<EntityItem[]>([]);
  const [questionSearch, setQuestionSearch] = useState<string>("");
  const [showGuessModal, setShowGuessModal] = useState<boolean>(false);
  const [guessQuery, setGuessQuery] = useState<string>("");
  const [submittingGuess, setSubmittingGuess] = useState<boolean>(false);
  const [guessFeedback, setGuessFeedback] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");

  // Load questions and entities for the chosen domain
  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const [qRes, eRes] = await Promise.all([
          fetch(`/api/reverse/questions?domain=${domain}`),
          fetch(`/api/reverse/entities?domain=${domain}`)
        ]);
        if (qRes.ok && eRes.ok && isMounted) {
          setQuestions(await qRes.json());
          setEntities(await eRes.json());
        }
      } catch {
        // Non-blocking
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [domain]);

  const startNewSession = async (playerNumber: 1 | 2) => {
    setErrorMsg("");
    setHistory([]);
    setWrongGuesses([]);
    setPenaltyQuestions(0);
    setHintsCount(0);
    setGuessFeedback("");
    setShowGuessModal(false);
    setActivePlayer(playerNumber);

    try {
      const res = await fetch("/api/reverse/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to start match.");

      setSessionId(data.sessionId);
      setMaxQuestions(data.maxQuestions || 20);
      setMaxGuesses(data.maxGuesses || 3);
      setStage("playing");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to start session.");
    }
  };

  const handleStartDuel = () => {
    setP1Score(null);
    setP2Score(null);
    setMatchResult(null);
    setCurrentRound(1);
    startNewSession(1);
  };

  const handleAskQuestion = async (questionId: number) => {
    if (!sessionId || askingId !== null || stage !== "playing") return;
    setAskingId(questionId);
    setErrorMsg("");

    const currentPlayerName = activePlayer === 1 ? player1Name : player2Name;

    try {
      const res = await fetch("/api/reverse/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, questionId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to ask question.");

      const qObj = questions.find((q) => q.id === questionId);
      const answerRecord: TurnAnswerRecord = {
        step: data.step,
        questionId,
        questionText: qObj ? qObj.text : `Question #${questionId}`,
        answerLabel: data.answerLabel,
        answerValue: data.answerValue,
        askedBy: currentPlayerName
      };

      sounds.playAnswerChime(data.answerValue);
      const newHistory = [...history, answerRecord];
      setHistory(newHistory);

      // In Round Duel mode:
      if (duelStyle === "round_duel") {
        if (data.state === "lost") {
          // Player lost round
          handleRoundEnd(false, newHistory.length + penaltyQuestions, data.revealedEntity);
        }
      } else {
        // In Alternating Turn Race mode:
        if (data.state === "lost") {
          // Both ran out of turns
          sounds.playDefeat();
          setMatchResult({
            winner: "tie",
            winnerName: null,
            reason: "20 questions reached without either player deducing the secret item!"
          });
          setStage("match_over");
        } else {
          // Toggle turn
          setActivePlayer((prev) => (prev === 1 ? 2 : 1));
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to ask question.");
    } finally {
      setAskingId(null);
    }
  };

  const handleSubmitGuess = async (guessValue: string) => {
    const cleanGuess = guessValue.trim();
    if (!sessionId || !cleanGuess || submittingGuess || stage !== "playing") return;
    setSubmittingGuess(true);
    setGuessFeedback("");
    setErrorMsg("");

    try {
      const res = await fetch("/api/reverse/guess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, guess: cleanGuess })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit guess.");

      if (data.correct) {
        sounds.playVictory();
        sounds.playConfettiPop();
        triggerConfetti();
        setShowGuessModal(false);

        if (duelStyle === "round_duel") {
          handleRoundEnd(true, history.length + penaltyQuestions, data.revealedEntity);
        } else {
          // Alternating race: current active player wins!
          const winnerName = activePlayer === 1 ? player1Name : player2Name;
          setMatchResult({
            winner: activePlayer === 1 ? "player1" : "player2",
            winnerName,
            reason: `${winnerName} correctly guessed "${data.revealedEntity?.name}" in ${history.length} total questions!`
          });
          setP1Score({
            name: player1Name,
            questionsUsed: history.length,
            guessesUsed: activePlayer === 1 ? wrongGuesses.length + 1 : wrongGuesses.length,
            hintsUsed: hintsCount,
            won: activePlayer === 1,
            entityName: data.revealedEntity?.name,
            imageUrl: data.revealedEntity?.imageUrl
          });
          setP2Score({
            name: player2Name,
            questionsUsed: history.length,
            guessesUsed: activePlayer === 2 ? wrongGuesses.length + 1 : wrongGuesses.length,
            hintsUsed: hintsCount,
            won: activePlayer === 2,
            entityName: data.revealedEntity?.name,
            imageUrl: data.revealedEntity?.imageUrl
          });
          setStage("match_over");
        }
      } else {
        const nextWrong = [...wrongGuesses, cleanGuess];
        setWrongGuesses(nextWrong);
        setGuessQuery("");

        if (duelStyle === "round_duel") {
          if (data.state === "lost") {
            sounds.playDefeat();
            setShowGuessModal(false);
            handleRoundEnd(false, history.length + penaltyQuestions, data.revealedEntity);
          } else {
            setGuessFeedback(
              `"${cleanGuess}" is not correct. ${data.guessesRemaining} guess${
                data.guessesRemaining === 1 ? "" : "es"
              } left.`
            );
          }
        } else {
          // Alternating race: turn passes on wrong guess
          setShowGuessModal(false);
          setActivePlayer((prev) => (prev === 1 ? 2 : 1));
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to submit guess.");
    } finally {
      setSubmittingGuess(false);
    }
  };

  const handleRoundEnd = (
    won: boolean,
    totalQuestions: number,
    revealedEntity?: { name: string; imageUrl: string | null }
  ) => {
    const score: PlayerScore = {
      name: currentRound === 1 ? player1Name : player2Name,
      questionsUsed: totalQuestions,
      guessesUsed: wrongGuesses.length + (won ? 1 : 0),
      hintsUsed: hintsCount,
      won,
      entityName: revealedEntity?.name,
      imageUrl: revealedEntity?.imageUrl
    };

    if (currentRound === 1) {
      setP1Score(score);
      setCurrentRound(2);
      setStage("round_transition");
    } else {
      setP2Score(score);
      if (p1Score) {
        const duel = determineDuelWinner(p1Score, score);
        setMatchResult(duel);
      }
      setStage("match_over");
    }
  };

  // Filtered questions
  const filteredQuestions = useMemo(() => {
    const q = questionSearch.trim().toLowerCase();
    if (!q) return questions;
    return questions.filter((item) => item.text.toLowerCase().includes(q));
  }, [questions, questionSearch]);

  // Entity suggestions for guess modal
  const filteredEntities = useMemo(() => {
    const q = guessQuery.trim().toLowerCase();
    if (!q) return [];
    return entities.filter((e) => e.name.toLowerCase().includes(q)).slice(0, 8);
  }, [entities, guessQuery]);

  const activePlayerName = activePlayer === 1 ? player1Name : player2Name;
  const remainingQuestions = Math.max(0, maxQuestions - (history.length + penaltyQuestions));
  const remainingGuesses = Math.max(0, maxGuesses - wrongGuesses.length);

  return (
    <div className="two-player-container">
      {/* ============================================================ */}
      {/* 1. SETUP STAGE */}
      {/* ============================================================ */}
      {stage === "setup" && (
        <div className="arena-welcome-card two-player-setup-card">
          <div className="welcome-speech-bubble">
            <span className="reversal-eyebrow">Same-Device Multiplayer</span>
            <h1 className="bubble-hero-title">2-Player Deduction Duel</h1>
            <p className="bubble-hero-subtitle">
              Pass and play on this device! Choose your mode and compete to see who can deduce the secret target with fewer questions.
            </p>
          </div>

          <div className="two-player-names-grid">
            <div className="player-input-card player1-card">
              <span className="player-card-tag">Player 1</span>
              <input
                type="text"
                className="player-name-input"
                value={player1Name}
                onChange={(e) => setPlayer1Name(e.target.value.slice(0, 25))}
                placeholder="Player 1 Name"
              />
            </div>

            <div className="two-player-vs-badge">VS</div>

            <div className="player-input-card player2-card">
              <span className="player-card-tag">Player 2</span>
              <input
                type="text"
                className="player-name-input"
                value={player2Name}
                onChange={(e) => setPlayer2Name(e.target.value.slice(0, 25))}
                placeholder="Player 2 Name"
              />
            </div>
          </div>

          {/* Mode Selector */}
          <div className="two-player-mode-selector">
            <span className="difficulty-group-label">Match Format</span>
            <div className="difficulty-btn-row">
              <button
                className={`difficulty-btn ${duelStyle === "round_duel" ? "difficulty-btn-selected" : ""}`}
                onClick={() => setDuelStyle("round_duel")}
                type="button"
              >
                <span className="diff-title">Round-by-Round Duel</span>
                <span className="diff-desc">Each player plays a secret target. Lower question count wins!</span>
              </button>

              <button
                className={`difficulty-btn ${duelStyle === "turn_race" ? "difficulty-btn-selected" : ""}`}
                onClick={() => setDuelStyle("turn_race")}
                type="button"
              >
                <span className="diff-title">Alternating Turn Race</span>
                <span className="diff-desc">Both players alternate asking questions on the same target!</span>
              </button>
            </div>
          </div>

          {/* Domain Picker */}
          <div className="two-player-domain-row">
            <span className="difficulty-group-label">Domain</span>
            <div className="challenge-domain-toggle">
              <button
                className={`challenge-domain-btn ${domain === "object" ? "domain-btn-active" : ""}`}
                onClick={() => setDomain("object")}
                type="button"
              >
                Objects Mode
              </button>
              <button
                className={`challenge-domain-btn ${domain === "character" ? "domain-btn-active" : ""}`}
                onClick={() => setDomain("character")}
                type="button"
              >
                Characters Mode
              </button>
            </div>
          </div>

          <div className="setup-actions-row">
            <button className="btn btn-secondary" onClick={onExit} type="button">
              Back to Menu
            </button>
            <button className="btn btn-primary btn-lg" onClick={handleStartDuel} type="button">
              Start 2-Player Duel
            </button>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 2. PLAYING STAGE */}
      {/* ============================================================ */}
      {stage === "playing" && (
        <div className="role-reversal-container">
          <div className="two-player-turn-banner">
            <div className="turn-indicator-col">
              <span className="turn-indicator-eyebrow">
                {duelStyle === "round_duel" ? `Round ${currentRound} of 2` : "Alternating Race"}
              </span>
              <h2 className="turn-player-title">
                Current Turn: <span className="turn-name-highlight">{activePlayerName}</span>
              </h2>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={onExit} type="button">
              Quit Match
            </button>
          </div>

          {errorMsg && <div className="akinator-error-banner"><span>{errorMsg}</span></div>}

          {/* Metrics bar */}
          <div className="reversal-metrics-bar">
            <div className="reversal-metric-card">
              <span className="metric-label">Questions Asked</span>
              <span className="metric-value">
                {history.length} <span className="metric-max">/ {maxQuestions}</span>
              </span>
              <div className="reversal-meter">
                <div
                  className="reversal-meter-fill"
                  style={{ width: `${Math.min(100, (history.length / maxQuestions) * 100)}%` }}
                />
              </div>
            </div>

            <div className="reversal-metric-card">
              <span className="metric-label">Guesses Left</span>
              <span className={`metric-value ${remainingGuesses <= 1 ? "metric-warning" : ""}`}>
                {remainingGuesses} <span className="metric-max">/ {maxGuesses}</span>
              </span>
              <div className="guesses-pip-row">
                {Array.from({ length: maxGuesses }).map((_, idx) => (
                  <span
                    key={idx}
                    className={`guess-pip ${idx < remainingGuesses ? "guess-pip-active" : "guess-pip-spent"}`}
                  />
                ))}
              </div>
            </div>

            <div className="reversal-action-card">
              <button
                className="reversal-guess-trigger-btn"
                onClick={() => {
                  setGuessFeedback("");
                  setGuessQuery("");
                  setShowGuessModal(true);
                }}
                disabled={remainingGuesses <= 0}
                type="button"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <span>Make a Guess</span>
              </button>
            </div>
          </div>

          {/* Clue bubble stage */}
          <div className="reversal-cognitor-stage">
            <div className="reversal-avatar-circle"><span>C</span></div>
            <div className="reversal-dialogue-bubble">
              {history.length === 0 ? (
                <p className="reversal-dialogue-text">
                  I have selected a secret {domain}. <strong>{activePlayerName}</strong>, ask a question or make a guess!
                </p>
              ) : (
                <div className="reversal-latest-response">
                  <div className="latest-q-text">
                    <span className="latest-step-tag">Q{history[history.length - 1].step} ({history[history.length - 1].askedBy}):</span>{" "}
                    {history[history.length - 1].questionText}
                  </div>
                  <div className="latest-ans-row">
                    <span className="latest-ans-label">Cognitor says:</span>
                    <span className={`ans-pill ${getAnswerPillClass(history[history.length - 1].answerLabel)}`}>
                      {history[history.length - 1].answerLabel}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Questions list */}
          <div className="reversal-questions-section">
            <div className="reversal-section-header">
              <div className="section-title-wrap">
                <h3 className="section-title">{activePlayerName}, select a question to ask</h3>
                <span className="section-subtitle">{remainingQuestions} question{remainingQuestions === 1 ? "" : "s"} remaining</span>
              </div>
            </div>

            <div className="reversal-search-bar">
              <input
                type="text"
                className="reversal-search-input"
                placeholder="Search questions..."
                value={questionSearch}
                onChange={(e) => setQuestionSearch(e.target.value)}
              />
            </div>

            <div className="reversal-questions-list">
              {filteredQuestions.map((q) => (
                <div key={q.id} className="reversal-q-row">
                  <span className="reversal-q-text">{q.text}</span>
                  <button
                    className="btn btn-secondary btn-sm reversal-ask-btn"
                    onClick={() => handleAskQuestion(q.id)}
                    disabled={askingId !== null || remainingQuestions <= 0}
                    type="button"
                  >
                    {askingId === q.id ? "Asking..." : "Ask"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 3. ROUND TRANSITION STAGE */}
      {/* ============================================================ */}
      {stage === "round_transition" && (
        <div className="arena-welcome-card two-player-transition-card">
          <div className="transition-badge">Round 1 Complete</div>
          <h2 className="transition-title">{player1Name} Finished!</h2>
          <p className="transition-desc">
            {p1Score?.won
              ? `${player1Name} deduced their secret target in ${p1Score.questionsUsed} questions!`
              : `${player1Name} was stumped by Cognitor!`}
          </p>

          <div className="transition-target-banner">
            <span className="target-banner-label">Target for {player2Name} to beat:</span>
            <span className="target-banner-val">
              {p1Score?.won ? `Fewer than ${p1Score.questionsUsed} questions` : "Solve the target to win!"}
            </span>
          </div>

          <div className="transition-pass-prompt">
            <span className="pass-prompt-text">Pass the device to {player2Name}!</span>
          </div>

          <button
            className="btn btn-primary btn-lg"
            onClick={() => startNewSession(2)}
            type="button"
          >
            I am {player2Name} - Start Round 2
          </button>
        </div>
      )}

      {/* ============================================================ */}
      {/* 4. MATCH OVER / SCOREBOARD STAGE */}
      {/* ============================================================ */}
      {stage === "match_over" && (
        <div className="arena-welcome-card two-player-match-over-card">
          <div className="match-over-trophy">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path>
              <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path>
              <path d="M4 22h16"></path>
              <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path>
              <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path>
              <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path>
            </svg>
          </div>

          <h2 className="match-winner-title">
            {matchResult?.winner === "tie"
              ? "It's a Tie!"
              : `${matchResult?.winnerName} Wins the Duel!`}
          </h2>
          <p className="match-winner-reason">{matchResult?.reason}</p>

          <div className="scoreboard-grid">
            <div className={`score-card ${matchResult?.winner === "player1" ? "score-card-winner" : ""}`}>
              <span className="score-card-player">{player1Name}</span>
              <span className="score-card-stat">
                {p1Score?.won ? `${p1Score.questionsUsed} questions` : "Stumped"}
              </span>
              {p1Score?.entityName && (
                <span className="score-card-target">Target: {p1Score.entityName}</span>
              )}
            </div>

            <div className={`score-card ${matchResult?.winner === "player2" ? "score-card-winner" : ""}`}>
              <span className="score-card-player">{player2Name}</span>
              <span className="score-card-stat">
                {p2Score?.won ? `${p2Score.questionsUsed} questions` : "Stumped"}
              </span>
              {p2Score?.entityName && (
                <span className="score-card-target">Target: {p2Score.entityName}</span>
              )}
            </div>
          </div>

          <div className="match-over-actions">
            <button className="btn btn-primary" onClick={handleStartDuel} type="button">
              Play Rematch
            </button>
            <button className="btn btn-secondary" onClick={onExit} type="button">
              Back to Menu
            </button>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* GUESS MODAL */}
      {/* ============================================================ */}
      {showGuessModal && (
        <div className="reversal-modal-backdrop" onClick={() => setShowGuessModal(false)}>
          <div className="reversal-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-row">
              <h3 className="modal-title">{activePlayerName}'s Guess</h3>
              <button className="modal-close-btn" onClick={() => setShowGuessModal(false)} type="button">
                Close
              </button>
            </div>

            <p className="modal-instruction">
              Enter your guess for the secret {domain}. ({remainingGuesses} guesses remaining).
            </p>

            {guessFeedback && <div className="guess-feedback-banner">{guessFeedback}</div>}

            <input
              type="text"
              className="guess-text-input"
              placeholder={`Type ${domain} name...`}
              value={guessQuery}
              onChange={(e) => setGuessQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && guessQuery.trim()) handleSubmitGuess(guessQuery);
              }}
              autoFocus
            />

            {filteredEntities.length > 0 && (
              <div className="guess-suggestions-container">
                <span className="suggestions-label">Suggestions:</span>
                <div className="suggestions-list">
                  {filteredEntities.map((ent) => (
                    <button
                      key={ent.id}
                      className="suggestion-item-btn"
                      onClick={() => {
                        setGuessQuery(ent.name);
                        handleSubmitGuess(ent.name);
                      }}
                      type="button"
                    >
                      <span className="suggestion-name">{ent.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="modal-actions-row">
              <button className="btn btn-secondary" onClick={() => setShowGuessModal(false)} type="button">
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={() => handleSubmitGuess(guessQuery)}
                disabled={!guessQuery.trim() || submittingGuess}
                type="button"
              >
                {submittingGuess ? "Checking..." : "Submit Guess"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
