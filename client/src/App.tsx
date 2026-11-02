import React, { useState, useEffect, useCallback } from "react";
import { AdminPanel } from "./Admin.js";
import { sounds } from "./soundEffects.js";

interface Question {
  id: number;
  text: string;
  step: number;
}

interface CandidateGuess {
  entityId: number;
  name: string;
  description: string | null;
  imageUrl: string | null;
  probability: number;
}

interface HistoryItem {
  step: number;
  questionId: number;
  questionText: string;
  answerValue: number;
}

interface Stats {
  totalGames: number;
  wins: number;
  losses: number;
  activeEntities: number;
  activeQuestions: number;
  pendingSubmissions: number;
}

function answerLabel(val: number): string {
  if (val >= 0.95) return "Yes";
  if (val <= 0.05) return "No";
  if (val >= 0.7) return "Probably";
  if (val <= 0.3) return "Probably not";
  return "Don't know";
}

function answerBadgeClass(val: number): string {
  if (val >= 0.95) return "ans-pill-yes";
  if (val <= 0.05) return "ans-pill-no";
  if (val >= 0.7) return "ans-pill-prob";
  if (val <= 0.3) return "ans-pill-probnot";
  return "ans-pill-dk";
}

export default function App() {
  const [isAdminRoute, setIsAdminRoute] = useState(
    () => window.location.pathname === "/admin" || window.location.hash === "#admin"
  );

  const [stats, setStats] = useState<Stats | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentDomain, setCurrentDomain] = useState<"character" | "object">("character");
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [certainty, setCertainty] = useState<number>(0.05);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [guess, setGuess] = useState<CandidateGuess | null>(null);
  const [closestWrongEntity, setClosestWrongEntity] = useState<CandidateGuess | null>(null);
  const [gameState, setGameState] = useState<"idle" | "in_progress" | "guess_pending" | "won" | "lost">("idle");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [lastAction, setLastAction] = useState<(() => void) | null>(null);
  const [imageFailed, setImageFailed] = useState(false);
  const [fallbackImage, setFallbackImage] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(sounds.enabled);

  // Learn form state
  const [learnName, setLearnName] = useState("");
  const [learnQuestion, setLearnQuestion] = useState("");
  const [learnAnswer, setLearnAnswer] = useState<number>(1.0);
  const [learnSubmitted, setLearnSubmitted] = useState(false);

  // Load stats
  const fetchStats = async () => {
    try {
      const res = await fetch("/api/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch {
      // ignore
    }
  };

  // Dynamically resolve Wikipedia image for an entity if primary image fails
  const resolveEntityImage = async (name: string) => {
    try {
      const res = await fetch(`/api/entity-image?name=${encodeURIComponent(name)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.imageUrl) {
          setFallbackImage(data.imageUrl);
          setImageFailed(false);
        }
      }
    } catch {
      // fallback to monogram
    }
  };

  // Restore session from sessionStorage if page was refreshed
  const tryRestoreSession = async () => {
    const savedId = sessionStorage.getItem("cognitor_session_id");
    if (!savedId) return;

    try {
      const res = await fetch(`/api/game/state/${savedId}`);
      if (!res.ok) {
        sessionStorage.removeItem("cognitor_session_id");
        return;
      }
      const data = await res.json();
      if (data.domain) setCurrentDomain(data.domain);
      if (data.certainty !== undefined) setCertainty(data.certainty);
      if (data.history) setHistory(data.history);

      if (data.state === "in_progress" && data.question) {
        setSessionId(data.sessionId);
        setCurrentQuestion(data.question);
        setGameState("in_progress");
      } else if (data.state === "guess_pending" && data.guess) {
        setSessionId(data.sessionId);
        setGuess(data.guess);
        setGameState("guess_pending");
      }
    } catch {
      sessionStorage.removeItem("cognitor_session_id");
    }
  };

  useEffect(() => {
    fetchStats();
    tryRestoreSession();

    const handlePopState = () => {
      setIsAdminRoute(window.location.pathname === "/admin" || window.location.hash === "#admin");
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigateToAdmin = () => {
    window.history.pushState({}, "", "/admin");
    setIsAdminRoute(true);
  };

  const navigateToHome = () => {
    window.history.pushState({}, "", "/");
    setIsAdminRoute(false);
    fetchStats();
  };

  const toggleSound = () => {
    const next = sounds.toggle();
    setSoundEnabled(next);
  };

  // Start new game
  const startGame = async (domain: "character" | "object" = "character") => {
    setLoading(true);
    setErrorMsg("");
    setLastAction(null);
    setLearnSubmitted(false);
    setLearnName("");
    setLearnQuestion("");
    setClosestWrongEntity(null);
    setImageFailed(false);
    setFallbackImage(null);
    setShowHistory(false);
    setCurrentDomain(domain);
    sessionStorage.removeItem("cognitor_session_id");

    try {
      const res = await fetch("/api/game/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to start game");
      setSessionId(data.sessionId);
      sessionStorage.setItem("cognitor_session_id", data.sessionId);
      setCurrentQuestion(data.question);
      if (data.certainty !== undefined) setCertainty(data.certainty);
      if (data.history) setHistory(data.history);
      setGuess(null);
      setGameState("in_progress");
    } catch (err: any) {
      setErrorMsg(err.message);
      setLastAction(() => () => startGame(domain));
    } finally {
      setLoading(false);
    }
  };

  // Submit answer
  const submitAnswer = useCallback(
    async (answerVal: number) => {
      if (!sessionId || loading) return;
      setLoading(true);
      setErrorMsg("");
      setLastAction(null);

      // Play audio chime
      sounds.playAnswerChime(answerVal);

      try {
        const res = await fetch("/api/game/answer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId, answer: answerVal })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to process answer");

        if (data.certainty !== undefined) setCertainty(data.certainty);
        if (data.history) setHistory(data.history);

        if (data.state === "guess_pending" && data.guess) {
          setGuess(data.guess);
          setImageFailed(false);
          setFallbackImage(null);
          setGameState("guess_pending");
          sounds.playDeductionReveal();

          if (!data.guess.imageUrl) {
            resolveEntityImage(data.guess.name);
          }
        } else if (data.state === "in_progress" && data.question) {
          setCurrentQuestion(data.question);
          setGameState("in_progress");
        } else if (data.state === "lost") {
          sessionStorage.removeItem("cognitor_session_id");
          setGameState("lost");
        }
      } catch (err: any) {
        setErrorMsg(err.message);
        setLastAction(() => () => submitAnswer(answerVal));
      } finally {
        setLoading(false);
      }
    },
    [sessionId, loading]
  );

  // Back / Undo
  const handleBack = useCallback(async () => {
    if (!sessionId || loading || (currentQuestion && currentQuestion.step <= 1)) return;
    setLoading(true);
    setErrorMsg("");
    setLastAction(null);

    try {
      const res = await fetch("/api/game/back", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to undo");

      setCurrentQuestion(data.question);
      if (data.certainty !== undefined) setCertainty(data.certainty);
      if (data.history) setHistory(data.history);
      setGuess(null);
      setImageFailed(false);
      setFallbackImage(null);
      setGameState("in_progress");
    } catch (err: any) {
      setErrorMsg(err.message);
      setLastAction(() => handleBack);
    } finally {
      setLoading(false);
    }
  }, [sessionId, loading, currentQuestion]);

  // Jump to specific step by rewinding
  const jumpToStep = async (targetStep: number) => {
    if (!sessionId || loading || !currentQuestion || targetStep >= currentQuestion.step) return;
    setLoading(true);
    setErrorMsg("");
    try {
      let currentStep = currentQuestion.step;
      let lastData: any = null;
      while (currentStep > targetStep) {
        const res = await fetch("/api/game/back", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId })
        });
        lastData = await res.json();
        if (!res.ok) break;
        currentStep = lastData.question?.step ?? targetStep;
      }
      if (lastData && lastData.question) {
        setCurrentQuestion(lastData.question);
        if (lastData.certainty !== undefined) setCertainty(lastData.certainty);
        if (lastData.history) setHistory(lastData.history);
        setGuess(null);
        setGameState("in_progress");
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Confirm guess
  const confirmGuess = useCallback(
    async (correct: boolean) => {
      if (!sessionId || !guess || loading) return;
      setLoading(true);
      setErrorMsg("");
      setLastAction(null);

      try {
        const res = await fetch("/api/game/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            correct,
            entityId: guess.entityId
          })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to confirm guess");

        if (data.certainty !== undefined) setCertainty(data.certainty);
        if (data.history) setHistory(data.history);

        if (correct || data.state === "won") {
          sessionStorage.removeItem("cognitor_session_id");
          setGameState("won");
          sounds.playVictory();
          fetchStats();
        } else {
          if (data.closestWrongEntity) {
            setClosestWrongEntity(data.closestWrongEntity);
          } else {
            setClosestWrongEntity(guess);
          }

          if (data.state === "lost") {
            sessionStorage.removeItem("cognitor_session_id");
            setGameState("lost");
            fetchStats();
          } else if (data.question) {
            setCurrentQuestion(data.question);
            setGuess(null);
            setImageFailed(false);
            setFallbackImage(null);
            setGameState("in_progress");
          }
        }
      } catch (err: any) {
        setErrorMsg(err.message);
        setLastAction(() => () => confirmGuess(correct));
      } finally {
        setLoading(false);
      }
    },
    [sessionId, guess, loading]
  );

  // Keyboard shortcuts listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["INPUT", "TEXTAREA", "SELECT"].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (gameState === "in_progress") {
        if (e.key === "1" || e.key.toLowerCase() === "y") submitAnswer(1.0);
        else if (e.key === "2" || e.key.toLowerCase() === "n") submitAnswer(0.0);
        else if (e.key === "3" || e.key.toLowerCase() === "d") submitAnswer(0.5);
        else if (e.key === "4" || e.key.toLowerCase() === "p") submitAnswer(0.75);
        else if (e.key === "5") submitAnswer(0.25);
        else if (e.key === "Backspace" || e.key.toLowerCase() === "u") handleBack();
      } else if (gameState === "guess_pending") {
        if (e.key.toLowerCase() === "y" || e.key === "Enter") confirmGuess(true);
        else if (e.key.toLowerCase() === "n" || e.key === "Escape") confirmGuess(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameState, submitAnswer, handleBack, confirmGuess]);

  // Submit learning form on loss
  const handleLearnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionId || !learnName.trim() || !learnQuestion.trim() || loading) return;
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/game/learn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          entityName: learnName.trim(),
          questionText: learnQuestion.trim(),
          answer: learnAnswer
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit learning data");
      setLearnSubmitted(true);
      fetchStats();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Resolve best image URL for deduction
  const activeImageUrl = fallbackImage || guess?.imageUrl || null;
  const proxiedImageUrl = activeImageUrl
    ? `/api/image-proxy?url=${encodeURIComponent(activeImageUrl)}`
    : null;

  return (
    <div className="akinator-app">
      {/* HEADER */}
      <header className="akinator-nav">
        <div className="nav-brand-group">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              navigateToHome();
            }}
            className="brand-logo-link"
          >
            <span className="brand-logo-text">Cognitor</span>
          </a>
        </div>

        <div className="nav-controls">
          <button
            className="sound-toggle-btn"
            onClick={toggleSound}
            title={soundEnabled ? "Mute audio" : "Enable audio"}
            aria-label="Toggle sound"
          >
            {soundEnabled ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                <line x1="23" y1="9" x2="17" y2="15"></line>
                <line x1="17" y1="9" x2="23" y2="15"></line>
              </svg>
            )}
          </button>

          {gameState !== "idle" && !isAdminRoute && (
            <button
              className="nav-reset-btn"
              onClick={() => {
                setGameState("idle");
                sessionStorage.removeItem("cognitor_session_id");
              }}
            >
              New Game
            </button>
          )}
        </div>
      </header>

      {errorMsg && (
        <div className="akinator-error-banner">
          <span>{errorMsg}</span>
          {lastAction && (
            <button className="btn btn-danger btn-sm" onClick={lastAction}>
              Retry
            </button>
          )}
        </div>
      )}

      {isAdminRoute ? (
        <main className="akinator-main">
          <AdminPanel onBack={navigateToHome} />
        </main>
      ) : (
        <main className="akinator-main">
          {/* ============================================================ */}
          {/* WELCOME / IDLE ARENA */}
          {/* ============================================================ */}
          {gameState === "idle" && (
            <div className="arena-welcome-card">
              <div className="welcome-speech-bubble">
                <h1 className="bubble-hero-title">Think of a character or object</h1>
                <p className="bubble-hero-subtitle">
                  I will deduce who or what you are thinking of through a series of questions. Choose your domain to begin.
                </p>
              </div>

              <div className="domain-selection-grid">
                <button
                  className={`domain-card ${currentDomain === "character" ? "domain-selected" : ""}`}
                  onClick={() => startGame("character")}
                  disabled={loading}
                >
                  <div className="domain-card-icon">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                  </div>
                  <div className="domain-card-content">
                    <span className="domain-card-label">Living and Fictional</span>
                    <span className="domain-card-title">Characters and Figures</span>
                    <span className="domain-card-desc">
                      Real celebrities, historical leaders, anime icons, superheroes, and authors.
                    </span>
                  </div>
                </button>

                <button
                  className={`domain-card ${currentDomain === "object" ? "domain-selected" : ""}`}
                  onClick={() => startGame("object")}
                  disabled={loading}
                >
                  <div className="domain-card-icon">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                    </svg>
                  </div>
                  <div className="domain-card-content">
                    <span className="domain-card-label">Everyday World</span>
                    <span className="domain-card-title">Objects and Items</span>
                    <span className="domain-card-desc">
                      Electronics, appliances, vehicles, musical instruments, tools, and household gear.
                    </span>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* ACTIVE QUESTION ARENA (AKINATOR-STYLE) */}
          {/* ============================================================ */}
          {gameState === "in_progress" && currentQuestion && (
            <div className="arena-game-card">
              {/* Turn Indicator */}
              <div className="arena-step-header">
                <span className="q-step-badge">Question {currentQuestion.step}</span>
              </div>

              {/* Speech Bubble Stage */}
              <div className="dialogue-stage">
                <div className="question-speech-bubble">
                  <p className="bubble-question-text">{currentQuestion.text}</p>
                </div>
              </div>

              {/* 5 Akinator Answers in Classic Ergonomic Order */}
              <div className="answers-grid">
                <button
                  className="akinator-btn btn-yes"
                  onClick={() => submitAnswer(1.0)}
                  disabled={loading}
                >
                  <span className="btn-text">Yes</span>
                  <kbd className="btn-kbd">1</kbd>
                </button>

                <button
                  className="akinator-btn btn-no"
                  onClick={() => submitAnswer(0.0)}
                  disabled={loading}
                >
                  <span className="btn-text">No</span>
                  <kbd className="btn-kbd">2</kbd>
                </button>

                <button
                  className="akinator-btn btn-dontknow"
                  onClick={() => submitAnswer(0.5)}
                  disabled={loading}
                >
                  <span className="btn-text">Don't know</span>
                  <kbd className="btn-kbd">3</kbd>
                </button>

                <button
                  className="akinator-btn btn-probably"
                  onClick={() => submitAnswer(0.75)}
                  disabled={loading}
                >
                  <span className="btn-text">Probably</span>
                  <kbd className="btn-kbd">4</kbd>
                </button>

                <button
                  className="akinator-btn btn-probnot"
                  onClick={() => submitAnswer(0.25)}
                  disabled={loading}
                >
                  <span className="btn-text">Probably not</span>
                  <kbd className="btn-kbd">5</kbd>
                </button>
              </div>

              {/* Utility Sub-actions */}
              <div className="arena-sub-actions">
                <div className="sub-left">
                  <button
                    className="sub-btn"
                    onClick={handleBack}
                    disabled={loading || currentQuestion.step <= 1}
                    title="Undo previous answer (Backspace)"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 14 4 9 9 4"></polyline>
                      <path d="M20 20v-7a4 4 0 0 0-4-4H4"></path>
                    </svg>
                    <span>Previous Question</span>
                  </button>

                  {history.length > 0 && (
                    <button
                      className={`sub-btn ${showHistory ? "sub-btn-active" : ""}`}
                      onClick={() => setShowHistory(!showHistory)}
                      title="View question history"
                    >
                      <span>Question Log ({history.length})</span>
                    </button>
                  )}
                </div>

                <button
                  className="sub-btn"
                  onClick={() => startGame(currentDomain)}
                  disabled={loading}
                  title="Restart from Question 1"
                >
                  Restart
                </button>
              </div>

              {/* History Timeline Drawer */}
              {showHistory && history.length > 0 && (
                <div className="history-drawer-panel">
                  <div className="history-drawer-head">
                    <span className="history-drawer-title">Question History</span>
                    <span className="history-drawer-hint">Select a question to rewind to that turn</span>
                  </div>
                  <div className="history-rows-scroll">
                    {history.map((h) => (
                      <div key={h.step} className="history-row-item">
                        <span className="h-step-pill">Q{h.step}</span>
                        <span className="h-text">{h.questionText}</span>
                        <span className={`h-badge ${answerBadgeClass(h.answerValue)}`}>
                          {answerLabel(h.answerValue)}
                        </span>
                        <button
                          className="h-rewind-btn"
                          onClick={() => jumpToStep(h.step)}
                          disabled={loading}
                          title={`Return to question ${h.step}`}
                        >
                          Rewind
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ============================================================ */}
          {/* THE DEDUCTION CARD ("I THINK OF...") */}
          {/* ============================================================ */}
          {gameState === "guess_pending" && guess && (
            <div className="arena-deduction-card">
              <div className="deduction-header">
                <span className="deduction-eyebrow">My Deduction</span>
                <h2 className="deduction-reveal-text">I think of...</h2>
              </div>

              <div className="deduction-portrait-wrapper">
                {proxiedImageUrl && !imageFailed ? (
                  <img
                    src={proxiedImageUrl}
                    alt={guess.name}
                    className="deduction-portrait-image"
                    referrerPolicy="no-referrer"
                    onError={() => {
                      setImageFailed(true);
                      if (!fallbackImage) {
                        resolveEntityImage(guess.name);
                      }
                    }}
                  />
                ) : (
                  <div className="deduction-portrait-monogram">
                    <span>{guess.name.charAt(0).toUpperCase()}</span>
                  </div>
                )}
              </div>

              <h3 className="deduction-entity-name">{guess.name}</h3>
              {guess.description && (
                <p className="deduction-entity-desc">{guess.description}</p>
              )}

              <p className="deduction-confirm-prompt">
                Is this who or what you were thinking of?
              </p>

              <div className="deduction-button-row">
                <button
                  className="akinator-confirm-btn confirm-yes"
                  onClick={() => confirmGuess(true)}
                  disabled={loading}
                >
                  <span>Yes, that's it!</span>
                </button>
                <button
                  className="akinator-confirm-btn confirm-no"
                  onClick={() => confirmGuess(false)}
                  disabled={loading}
                >
                  <span>No</span>
                </button>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* WON SCREEN (CONFIRMED DEDUCTION) */}
          {/* ============================================================ */}
          {gameState === "won" && (
            <div className="arena-result-grid">
              <div className="arena-result-summary-card">
                <span className="result-trophy-tag">Deduction Confirmed</span>
                <h2 className="result-title">Mind Read Successfully</h2>
                <p className="result-detail">
                  I correctly deduced your thought in {currentQuestion ? currentQuestion.step : "a few"} questions.
                </p>

                {guess && (
                  <div className="result-entity-preview">
                    {proxiedImageUrl && !imageFailed ? (
                      <img
                        src={proxiedImageUrl}
                        alt={guess.name}
                        className="result-preview-image"
                      />
                    ) : (
                      <div className="result-preview-monogram">
                        <span>{guess.name.charAt(0).toUpperCase()}</span>
                      </div>
                    )}
                    <div className="result-preview-meta">
                      <span className="result-preview-name">{guess.name}</span>
                      {guess.description && (
                        <span className="result-preview-desc">{guess.description}</span>
                      )}
                    </div>
                  </div>
                )}

                <div className="result-btn-group">
                  <button
                    className="akinator-btn btn-yes"
                    onClick={() => startGame(currentDomain)}
                  >
                    Play Again
                  </button>
                  <button
                    className="akinator-btn btn-probably"
                    onClick={() => startGame(currentDomain === "object" ? "character" : "object")}
                  >
                    Switch to {currentDomain === "object" ? "Characters" : "Objects"}
                  </button>
                </div>
              </div>

              {history.length > 0 && (
                <div className="arena-result-pathway-card">
                  <div className="trail-title">Key Deduction Pathway</div>
                  <div className="trail-list">
                    {history.map((h) => (
                      <div key={h.step} className="trail-item">
                        <span className="trail-step">#{h.step}</span>
                        <span className="trail-q">{h.questionText}</span>
                        <span className={`h-badge ${answerBadgeClass(h.answerValue)}`}>
                          {answerLabel(h.answerValue)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ============================================================ */}
          {/* LOST SCREEN (STUMPED / DEFEATED) */}
          {/* ============================================================ */}
          {gameState === "lost" && (
            <div className="arena-result-card">
              <span className="result-trophy-tag">Well Played</span>
              <h2 className="result-title">You Defeated Me</h2>
              <p className="result-detail">
                I could not deduce who or what you were thinking of within the question limits. Teach Cognitor what you were thinking of to sharpen future games.
              </p>

              {learnSubmitted ? (
                <div className="learn-success-card">
                  <p className="learn-success-text">
                    Thank you. Your entry has been recorded and will expand future deductions.
                  </p>
                  <button
                    className="akinator-btn btn-yes"
                    style={{ width: "auto", margin: "1rem auto 0" }}
                    onClick={() => startGame(currentDomain)}
                  >
                    Play Again
                  </button>
                </div>
              ) : (
                <form onSubmit={handleLearnSubmit} className="learn-form-wrapper">
                  <div className="akinator-form-group">
                    <label className="akinator-form-label">
                      {currentDomain === "object" ? "What object were you thinking of?" : "Who were you thinking of?"}
                    </label>
                    <input
                      type="text"
                      className="akinator-input"
                      placeholder={currentDomain === "object" ? "e.g. Telescope, Smart Watch" : "e.g. Marie Curie, Alan Turing"}
                      value={learnName}
                      onChange={(e) => setLearnName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="akinator-form-group">
                    <label className="akinator-form-label">
                      A question distinguishing them from{" "}
                      <strong>{closestWrongEntity ? closestWrongEntity.name : "my closest deduction"}</strong>:
                    </label>
                    <input
                      type="text"
                      className="akinator-input"
                      placeholder={currentDomain === "object" ? "e.g. Is it used to observe stars?" : "e.g. Did they break the Enigma code?"}
                      value={learnQuestion}
                      onChange={(e) => setLearnQuestion(e.target.value)}
                      required
                    />
                  </div>

                  <div className="akinator-form-group">
                    <label className="akinator-form-label">
                      Correct answer for your selection:
                    </label>
                    <select
                      className="akinator-select"
                      value={learnAnswer}
                      onChange={(e) => setLearnAnswer(parseFloat(e.target.value))}
                    >
                      <option value={1.0}>Yes</option>
                      <option value={0.75}>Probably</option>
                      <option value={0.5}>Don't know</option>
                      <option value={0.25}>Probably not</option>
                      <option value={0.0}>No</option>
                    </select>
                  </div>

                  <div className="learn-btn-row">
                    <button type="submit" className="akinator-btn btn-yes" style={{ flex: 1 }} disabled={loading}>
                      {loading ? "Recording..." : "Submit Entity"}
                    </button>
                    <button type="button" className="sub-btn" onClick={() => startGame(currentDomain)}>
                      Skip
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </main>
      )}

      {/* DISCREET MINIMAL FOOTER */}
      <footer className="akinator-footer">
        <div className="footer-links">
          <span>Cognitor</span>
          <span>·</span>
          <span>20 Questions Mind Guesser</span>
          <span>·</span>
          <a
            href="/admin"
            onClick={(e) => {
              e.preventDefault();
              navigateToAdmin();
            }}
            className="footer-admin-link"
          >
            Admin
          </a>
        </div>
      </footer>
    </div>
  );
}
