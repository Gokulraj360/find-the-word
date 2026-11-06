import React, { useState, useEffect, useMemo } from "react";
import { sounds } from "./soundEffects.js";
import { triggerConfetti } from "./confetti.js";
import {
  generateChallengeCompletionShareText,
  copyToClipboard
} from "./friendChallenge.js";

export interface ReverseQuestionAnswer {
  step: number;
  questionId: number;
  questionText: string;
  answerLabel: "Yes" | "Probably" | "Don't know" | "Probably not" | "No";
  answerValue: number;
}

export interface ReverseHint {
  hintType: "attribute" | "description" | "first_letter";
  clueText: string;
  questionId?: number;
  questionText?: string;
  answerLabel?: string;
  penaltySteps: number;
}

export interface QuestionItem {
  id: number;
  text: string;
  category?: string;
}

export interface EntityItem {
  id: number;
  name: string;
  description: string | null;
}

export interface RevealedEntity {
  id: number;
  name: string;
  description: string | null;
  imageUrl: string | null;
  funFact?: string | null;
}

interface RoleReversalArenaProps {
  domain: "character" | "object";
  challengeCode?: string;
  challengeCreator?: string;
  onExit: () => void;
}

type QuestionCategoryFilter = "all" | "general" | "material" | "usage" | "sports" | "shape";

function classifyQuestionCategory(text: string): QuestionCategoryFilter {
  const lower = text.toLowerCase();
  if (
    lower.includes("cricket") ||
    lower.includes("ball") ||
    lower.includes("sport") ||
    lower.includes("bat") ||
    lower.includes("kick") ||
    lower.includes("court") ||
    lower.includes("racket") ||
    lower.includes("bounce")
  ) {
    return "sports";
  }
  if (
    lower.includes("metal") ||
    lower.includes("plastic") ||
    lower.includes("wood") ||
    lower.includes("cloth") ||
    lower.includes("glass") ||
    lower.includes("leather") ||
    lower.includes("paper") ||
    lower.includes("hard") ||
    lower.includes("soft") ||
    lower.includes("fabric")
  ) {
    return "material";
  }
  if (
    lower.includes("eat") ||
    lower.includes("wear") ||
    lower.includes("electric") ||
    lower.includes("battery") ||
    lower.includes("sound") ||
    lower.includes("school") ||
    lower.includes("office") ||
    lower.includes("kitchen") ||
    lower.includes("tool") ||
    lower.includes("write") ||
    lower.includes("read") ||
    lower.includes("drive")
  ) {
    return "usage";
  }
  if (
    lower.includes("round") ||
    lower.includes("long") ||
    lower.includes("thin") ||
    lower.includes("wheel") ||
    lower.includes("screen") ||
    lower.includes("shape") ||
    lower.includes("heavy") ||
    lower.includes("sharp") ||
    lower.includes("flat")
  ) {
    return "shape";
  }
  return "general";
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

export function RoleReversalArena({
  domain,
  challengeCode,
  challengeCreator,
  onExit
}: RoleReversalArenaProps) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [maxQuestions, setMaxQuestions] = useState<number>(20);
  const [maxGuesses, setMaxGuesses] = useState<number>(3);
  const [maxHints, setMaxHints] = useState<number>(3);
  const [penaltyQuestions, setPenaltyQuestions] = useState<number>(0);
  const [history, setHistory] = useState<ReverseQuestionAnswer[]>([]);
  const [wrongGuesses, setWrongGuesses] = useState<string[]>([]);
  const [hints, setHints] = useState<ReverseHint[]>([]);
  const [activeHintAlert, setActiveHintAlert] = useState<ReverseHint | null>(null);
  const [showHintConfirm, setShowHintConfirm] = useState<boolean>(false);
  const [requestingHint, setRequestingHint] = useState<boolean>(false);
  const [copiedChallengeResult, setCopiedChallengeResult] = useState<boolean>(false);

  const [gameState, setGameState] = useState<"loading" | "in_progress" | "won" | "lost">("loading");
  const [revealedEntity, setRevealedEntity] = useState<RevealedEntity | null>(null);

  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [entities, setEntities] = useState<EntityItem[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState<boolean>(true);

  const [questionSearch, setQuestionSearch] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<QuestionCategoryFilter>("all");
  const [askingId, setAskingId] = useState<number | null>(null);

  const [showGuessModal, setShowGuessModal] = useState<boolean>(false);
  const [guessQuery, setGuessQuery] = useState<string>("");
  const [submittingGuess, setSubmittingGuess] = useState<boolean>(false);
  const [guessFeedback, setGuessFeedback] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");

  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);

  // Initialize new reverse game session
  const startReverseGame = async () => {
    setGameState("loading");
    setErrorMsg("");
    setHistory([]);
    setWrongGuesses([]);
    setHints([]);
    setPenaltyQuestions(0);
    setActiveHintAlert(null);
    setShowHintConfirm(false);
    setRevealedEntity(null);
    setGuessFeedback("");
    setShowGuessModal(false);

    try {
      const url = challengeCode
        ? `/api/challenge/${encodeURIComponent(challengeCode)}/start`
        : "/api/reverse/start";
      const body = challengeCode ? {} : { domain };

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to start game.");

      setSessionId(data.sessionId);
      setMaxQuestions(data.maxQuestions || 20);
      setMaxGuesses(data.maxGuesses || 3);
      setMaxHints(data.maxHints || 3);
      setGameState("in_progress");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to initialize game.");
      setGameState("in_progress");
    }
  };

  // Fetch available questions and entities for auto-complete
  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      setLoadingQuestions(true);
      try {
        const [qRes, eRes] = await Promise.all([
          fetch(`/api/reverse/questions?domain=${domain}`),
          fetch(`/api/reverse/entities?domain=${domain}`)
        ]);
        if (qRes.ok && eRes.ok && isMounted) {
          const qData = await qRes.json();
          const eData = await eRes.json();
          setQuestions(qData);
          setEntities(eData);
        }
      } catch {
        // Non-blocking fallback
      } finally {
        if (isMounted) setLoadingQuestions(false);
      }
    };

    loadData();
    startReverseGame();

    return () => {
      isMounted = false;
    };
  }, [domain]);

  // Questions already asked lookup
  const askedQuestionsMap = useMemo(() => {
    const map = new Map<number, ReverseQuestionAnswer>();
    history.forEach((h) => map.set(h.questionId, h));
    return map;
  }, [history]);

  // Filtered questions based on search query and category
  const filteredQuestions = useMemo(() => {
    const qLower = questionSearch.trim().toLowerCase();
    return questions.filter((q) => {
      if (categoryFilter !== "all") {
        const cat = classifyQuestionCategory(q.text);
        if (cat !== categoryFilter) return false;
      }
      if (qLower) {
        return q.text.toLowerCase().includes(qLower);
      }
      return true;
    });
  }, [questions, questionSearch, categoryFilter]);

  // Entity candidate suggestions for guessing
  const filteredEntities = useMemo(() => {
    const lower = guessQuery.trim().toLowerCase();
    if (!lower) return [];
    return entities
      .filter((e) => e.name.toLowerCase().includes(lower))
      .slice(0, 8);
  }, [entities, guessQuery]);

  // Handle asking a question
  const handleAskQuestion = async (questionId: number) => {
    if (!sessionId || askingId !== null || gameState !== "in_progress") return;
    setAskingId(questionId);
    setErrorMsg("");

    try {
      const res = await fetch("/api/reverse/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, questionId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to ask question.");

      const qObj = questions.find((q) => q.id === questionId);
      const answerRecord: ReverseQuestionAnswer = {
        step: data.step,
        questionId,
        questionText: qObj ? qObj.text : `Question #${questionId}`,
        answerLabel: data.answerLabel,
        answerValue: data.answerValue
      };

      sounds.playAnswerChime(data.answerValue);
      setHistory((prev) => [...prev, answerRecord]);

      if (data.state === "lost") {
        setGameState("lost");
        sounds.playDefeat();
        if (data.revealedEntity) {
          setRevealedEntity(data.revealedEntity);
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to process question.");
    } finally {
      setAskingId(null);
    }
  };

  // Handle requesting a hint
  const handleRequestHint = async () => {
    if (!sessionId || requestingHint || gameState !== "in_progress" || hints.length >= maxHints) return;
    setRequestingHint(true);
    setErrorMsg("");
    setShowHintConfirm(false);

    try {
      const res = await fetch("/api/reverse/hint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to get hint.");

      setPenaltyQuestions(data.penaltyQuestions || 0);
      setHints((prev) => [...prev, data.hint]);
      setActiveHintAlert(data.hint);
      sounds.playAnswerChime(0.8);

      if (data.hint.questionId && data.hint.questionText) {
        const hintHistoryItem: ReverseQuestionAnswer = {
          step: history.length + 1,
          questionId: data.hint.questionId,
          questionText: `[Hint Clue] ${data.hint.questionText}`,
          answerLabel: "Yes",
          answerValue: 1.0
        };
        setHistory((prev) => [...prev, hintHistoryItem]);
      }

      if (data.state === "lost") {
        setGameState("lost");
        sounds.playDefeat();
        if (data.revealedEntity) {
          setRevealedEntity(data.revealedEntity);
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to request hint.");
    } finally {
      setRequestingHint(false);
    }
  };

  // Handle submitting a guess
  const handleSubmitGuess = async (guessValue: string) => {
    const cleanGuess = guessValue.trim();
    if (!sessionId || !cleanGuess || submittingGuess || gameState !== "in_progress") return;
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
        setGameState("won");
        setShowGuessModal(false);
        if (data.revealedEntity) {
          setRevealedEntity(data.revealedEntity);
        }
      } else {
        setWrongGuesses((prev) => [...prev, cleanGuess]);
        setGuessQuery("");
        if (data.state === "lost") {
          sounds.playDefeat();
          setGameState("lost");
          setShowGuessModal(false);
          if (data.revealedEntity) {
            setRevealedEntity(data.revealedEntity);
          }
        } else {
          setGuessFeedback(
            `"${cleanGuess}" is not correct. You have ${data.guessesRemaining} guess${
              data.guessesRemaining === 1 ? "" : "es"
            } left.`
          );
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to submit guess.");
    } finally {
      setSubmittingGuess(false);
    }
  };

  const totalQuestionsCharged = history.length + penaltyQuestions;
  const remainingQuestions = Math.max(0, maxQuestions - totalQuestionsCharged);
  const remainingGuesses = Math.max(0, maxGuesses - wrongGuesses.length);
  const remainingHints = Math.max(0, maxHints - hints.length);
  const latestAnswer = history.length > 0 ? history[history.length - 1] : null;

  return (
    <div className="role-reversal-container">
      {/* Top Banner and Navigation */}
      <div className="reversal-header-row">
        <div>
          <span className="reversal-eyebrow">
            {challengeCreator ? `Challenge from ${challengeCreator}` : "Role Reversal"} · {domain === "character" ? "Characters" : "Objects"}
          </span>
          <h2 className="reversal-title">
            {challengeCreator
              ? `Guess ${challengeCreator}'s Secret ${domain === "character" ? "Character" : "Object"}`
              : "You Guess, Cognitor Answers"}
          </h2>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={onExit} type="button">
          Exit to Menu
        </button>
      </div>

      {errorMsg && (
        <div className="akinator-error-banner">
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Status Counters Bar */}
      <div className="reversal-metrics-bar">
        <div className="reversal-metric-card">
          <div className="metric-label-row">
            <span className="metric-label">Questions</span>
            {penaltyQuestions > 0 && (
              <span className="hint-penalty-badge">+{penaltyQuestions} hint cost</span>
            )}
          </div>
          <span className="metric-value">
            {totalQuestionsCharged} <span className="metric-max">/ {maxQuestions}</span>
          </span>
          <div className="reversal-meter">
            <div
              className="reversal-meter-fill"
              style={{ width: `${Math.min(100, (totalQuestionsCharged / maxQuestions) * 100)}%` }}
            />
          </div>
        </div>

        <div className="reversal-metric-card">
          <span className="metric-label">Guesses Remaining</span>
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

        <div className="reversal-actions-card">
          <button
            className="reversal-hint-trigger-btn"
            onClick={() => setShowHintConfirm(true)}
            disabled={
              gameState !== "in_progress" ||
              remainingHints <= 0 ||
              remainingQuestions <= 2 ||
              requestingHint
            }
            title={
              remainingHints <= 0
                ? "Maximum 3 hints used"
                : remainingQuestions <= 2
                ? "Need at least 3 questions remaining to use a hint"
                : "Reveal a secret clue with a 2-question penalty"
            }
            type="button"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18h6"></path>
              <path d="M10 22h4"></path>
              <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"></path>
            </svg>
            <span>{requestingHint ? "Unlocking..." : `Hint (${remainingHints})`}</span>
          </button>

          <button
            className="reversal-guess-trigger-btn"
            onClick={() => {
              setGuessFeedback("");
              setGuessQuery("");
              setShowGuessModal(true);
            }}
            disabled={gameState !== "in_progress" || remainingGuesses <= 0}
            type="button"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <span>Make a Guess</span>
          </button>
        </div>
      </div>

      {/* Active Hint Banner */}
      {activeHintAlert && (
        <div className="reversal-hint-banner">
          <div className="hint-banner-header">
            <span className="hint-banner-tag">Cognitor Clue (-2 Questions Penalty)</span>
            <button
              className="hint-banner-close"
              onClick={() => setActiveHintAlert(null)}
              type="button"
            >
              Dismiss
            </button>
          </div>
          <p className="hint-banner-text">{activeHintAlert.clueText}</p>
        </div>
      )}

      {/* Wrong Guesses Display */}
      {wrongGuesses.length > 0 && gameState === "in_progress" && (
        <div className="reversal-wrong-guesses-row">
          <span className="wrong-guess-label">Incorrect Guesses:</span>
          <div className="wrong-guess-tags">
            {wrongGuesses.map((g, idx) => (
              <span key={idx} className="wrong-guess-tag">
                {g}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* COGNITOR SPEECH STAGE */}
      {/* ============================================================ */}
      <div className="reversal-cognitor-stage">
        <div className="reversal-avatar-circle">
          <span>C</span>
        </div>
        <div className="reversal-dialogue-bubble">
          {history.length === 0 ? (
            <p className="reversal-dialogue-text">
              {challengeCreator
                ? `I am secretly holding ${challengeCreator}'s chosen ${domain}! Ask me questions, request hints (-2 questions penalty), or take a guess whenever you are ready!`
                : `I have picked a secret ${domain}. Ask me any question below to deduce what it is, request a hint (-2 questions penalty), or take a guess whenever you feel confident!`}
            </p>
          ) : (
            <div className="reversal-latest-response">
              <div className="latest-q-text">
                <span className="latest-step-tag">Q{latestAnswer?.step}:</span> {latestAnswer?.questionText}
              </div>
              <div className="latest-ans-row">
                <span className="latest-ans-label">Cognitor says:</span>
                <span className={`ans-pill ${getAnswerPillClass(latestAnswer?.answerLabel || "")}`}>
                  {latestAnswer?.answerLabel}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* GAME OVER CARD (WON OR LOST) */}
      {/* ============================================================ */}
      {(gameState === "won" || gameState === "lost") && (
        <div className={`reversal-result-card ${gameState === "won" ? "result-won" : "result-lost"}`}>
          <div className="result-header">
            <h3 className="result-title">
              {gameState === "won" ? "Brilliant Deduction!" : "Cognitor Kept the Secret!"}
            </h3>
            <p className="result-subtitle">
              {gameState === "won"
                ? `You identified Cognitor's secret ${domain} in ${history.length} question${
                    history.length === 1 ? "" : "s"
                  } (${penaltyQuestions > 0 ? `+${penaltyQuestions} hint cost, ` : ""}${totalQuestionsCharged} charged) and ${
                    wrongGuesses.length + 1
                  } attempt${wrongGuesses.length === 0 ? "" : "s"}!`
                : totalQuestionsCharged >= maxQuestions
                ? "You ran out of questions before finding the answer."
                : "You used all 3 of your allowed guesses."}
            </p>
          </div>

          {revealedEntity && (
            <div className="revealed-entity-showcase">
              {revealedEntity.imageUrl ? (
                <img
                  src={revealedEntity.imageUrl}
                  alt={revealedEntity.name}
                  className="revealed-entity-img"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
              ) : (
                <div className="revealed-entity-fallback">
                  {revealedEntity.name.slice(0, 2).toUpperCase()}
                </div>
              )}
              <div className="revealed-entity-info">
                <span className="revealed-entity-eyebrow">The Secret {domain}</span>
                <h4 className="revealed-entity-name">{revealedEntity.name}</h4>
                {revealedEntity.description && (
                  <p className="revealed-entity-desc">{revealedEntity.description}</p>
                )}
                {revealedEntity.funFact && (
                  <div className="revealed-entity-funfact">
                    <span className="funfact-eyebrow">Did you know?</span>
                    <p className="funfact-text">{revealedEntity.funFact}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="result-btn-row">
            {challengeCode && challengeCreator && (
              <button
                className="btn btn-primary"
                onClick={async () => {
                  const text = generateChallengeCompletionShareText(
                    challengeCreator,
                    gameState === "won",
                    totalQuestionsCharged,
                    challengeCode
                  );
                  const ok = await copyToClipboard(text);
                  if (ok) {
                    setCopiedChallengeResult(true);
                    setTimeout(() => setCopiedChallengeResult(false), 2500);
                  }
                }}
                type="button"
              >
                {copiedChallengeResult ? "Copied Share Text!" : `Share Result with ${challengeCreator}`}
              </button>
            )}
            <button className="btn btn-secondary" onClick={startReverseGame} type="button">
              Play Again
            </button>
            <button className="btn btn-secondary" onClick={onExit} type="button">
              Back to Menu
            </button>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* QUESTIONS EXPLORER & ASKING INTERFACE */}
      {/* ============================================================ */}
      {gameState === "in_progress" && (
        <div className="reversal-questions-section">
          <div className="reversal-section-header">
            <div className="section-title-wrap">
              <h3 className="section-title">Select a Question to Ask</h3>
              <span className="section-subtitle">
                {questions.length} questions available · {remainingQuestions} question{remainingQuestions === 1 ? "" : "s"} remaining
              </span>
            </div>

            {history.length > 0 && (
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setShowHistoryModal(true)}
                type="button"
              >
                View Clues ({history.length + hints.length})
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div className="reversal-category-pills">
            {(
              [
                { id: "all", label: "All Questions" },
                { id: "general", label: "General & Alive" },
                { id: "material", label: "Material & Feel" },
                { id: "usage", label: "Usage & Daily" },
                { id: "sports", label: "Sports" },
                { id: "shape", label: "Shape & Look" }
              ] as const
            ).map((cat) => (
              <button
                key={cat.id}
                className={`cat-pill ${categoryFilter === cat.id ? "cat-pill-active" : ""}`}
                onClick={() => setCategoryFilter(cat.id)}
                type="button"
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="reversal-search-bar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              className="reversal-search-input"
              placeholder="Search questions (e.g. metal, eat, ball, alive, screen)..."
              value={questionSearch}
              onChange={(e) => setQuestionSearch(e.target.value)}
            />
            {questionSearch && (
              <button
                className="reversal-search-clear"
                onClick={() => setQuestionSearch("")}
                title="Clear search"
                type="button"
              >
                Clear
              </button>
            )}
          </div>

          {/* Questions Scrollable List */}
          {loadingQuestions ? (
            <div className="reversal-loading-state">Loading questions...</div>
          ) : (
            <div className="reversal-questions-list">
              {filteredQuestions.length === 0 ? (
                <div className="reversal-empty-state">
                  No questions match your current search and category filters.
                </div>
              ) : (
                filteredQuestions.map((q) => {
                  const answered = askedQuestionsMap.get(q.id);
                  const isAsked = Boolean(answered);
                  const isCurrentlyAsking = askingId === q.id;

                  return (
                    <div
                      key={q.id}
                      className={`reversal-q-row ${isAsked ? "reversal-q-row-asked" : ""}`}
                    >
                      <div className="reversal-q-text-wrap">
                        <span className="reversal-q-text">{q.text}</span>
                        {isAsked && answered && (
                          <span className={`ans-pill ${getAnswerPillClass(answered.answerLabel)}`}>
                            {answered.answerLabel}
                          </span>
                        )}
                      </div>

                      <button
                        className="btn btn-secondary btn-sm reversal-ask-btn"
                        onClick={() => handleAskQuestion(q.id)}
                        disabled={isAsked || isCurrentlyAsking || askingId !== null || remainingQuestions <= 0}
                        type="button"
                      >
                        {isAsked ? "Asked" : isCurrentlyAsking ? "Asking..." : "Ask"}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* HINT CONFIRMATION MODAL */}
      {/* ============================================================ */}
      {showHintConfirm && (
        <div className="reversal-modal-backdrop" onClick={() => setShowHintConfirm(false)}>
          <div className="reversal-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-row">
              <h3 className="modal-title">Use a Hint?</h3>
              <button
                className="modal-close-btn"
                onClick={() => setShowHintConfirm(false)}
                type="button"
              >
                Cancel
              </button>
            </div>

            <p className="modal-instruction">
              Requesting a secret clue from Cognitor costs <strong>2 questions</strong> from your 20-question limit.
            </p>

            <div className="hint-impact-box">
              <div className="impact-metric">
                <span className="impact-label">Current Questions Remaining</span>
                <span className="impact-val">{remainingQuestions}</span>
              </div>
              <div className="impact-divider">»</div>
              <div className="impact-metric">
                <span className="impact-label">After Hint Clue</span>
                <span className="impact-val impact-val-reduced">
                  {Math.max(0, remainingQuestions - 2)}
                </span>
              </div>
            </div>

            <div className="modal-actions-row">
              <button
                className="btn btn-secondary"
                onClick={() => setShowHintConfirm(false)}
                type="button"
              >
                Keep Thinking
              </button>
              <button
                className="btn btn-primary"
                onClick={handleRequestHint}
                disabled={requestingHint}
                type="button"
              >
                {requestingHint ? "Unlocking..." : "Unlock Clue (-2 Qs)"}
              </button>
            </div>
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
              <h3 className="modal-title">Make Your Guess</h3>
              <button
                className="modal-close-btn"
                onClick={() => setShowGuessModal(false)}
                type="button"
              >
                Close
              </button>
            </div>

            <p className="modal-instruction">
              Type the name of the secret {domain}. You have <strong>{remainingGuesses}</strong> of{" "}
              {maxGuesses} guesses remaining.
            </p>

            {guessFeedback && <div className="guess-feedback-banner">{guessFeedback}</div>}

            <div className="guess-input-container">
              <input
                type="text"
                className="guess-text-input"
                placeholder={`Type ${domain} name...`}
                value={guessQuery}
                onChange={(e) => setGuessQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && guessQuery.trim()) {
                    handleSubmitGuess(guessQuery);
                  }
                }}
                autoFocus
              />
            </div>

            {/* Quick Candidate Autocomplete Suggestions */}
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
                      {ent.description && (
                        <span className="suggestion-desc">{ent.description}</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="modal-actions-row">
              <button
                className="btn btn-secondary"
                onClick={() => setShowGuessModal(false)}
                type="button"
              >
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

      {/* ============================================================ */}
      {/* HISTORY / CLUES MODAL */}
      {/* ============================================================ */}
      {showHistoryModal && (
        <div className="reversal-modal-backdrop" onClick={() => setShowHistoryModal(false)}>
          <div className="reversal-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-row">
              <h3 className="modal-title">Clues Gathered ({history.length})</h3>
              <button
                className="modal-close-btn"
                onClick={() => setShowHistoryModal(false)}
                type="button"
              >
                Close
              </button>
            </div>

            {hints.length > 0 && (
              <div className="modal-hints-block">
                <span className="modal-hints-title">Unlocked Hints ({hints.length}):</span>
                {hints.map((h, idx) => (
                  <div key={idx} className="modal-hint-item">
                    <span className="modal-hint-tag">Hint #{idx + 1}</span>
                    <span className="modal-hint-text">{h.clueText}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="reversal-history-list">
              {history.map((h) => (
                <div key={h.step} className="reversal-history-item">
                  <div className="history-step-num">#{h.step}</div>
                  <div className="history-text-col">
                    <span className="history-question">{h.questionText}</span>
                  </div>
                  <span className={`ans-pill ${getAnswerPillClass(h.answerLabel)}`}>
                    {h.answerLabel}
                  </span>
                </div>
              ))}
            </div>

            <div className="modal-actions-row">
              <button
                className="btn btn-secondary"
                onClick={() => setShowHistoryModal(false)}
                type="button"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
