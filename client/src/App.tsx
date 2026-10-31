import React, { useState, useEffect, useCallback } from "react";
import { AdminPanel } from "./Admin.js";

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

interface Stats {
  totalGames: number;
  wins: number;
  losses: number;
  activeEntities: number;
  activeQuestions: number;
  pendingSubmissions: number;
}

export default function App() {
  const [isAdminRoute, setIsAdminRoute] = useState(
    () => window.location.pathname === "/admin" || window.location.hash === "#admin"
  );

  const [stats, setStats] = useState<Stats | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentDomain, setCurrentDomain] = useState<"character" | "object">("character");
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [guess, setGuess] = useState<CandidateGuess | null>(null);
  const [closestWrongEntity, setClosestWrongEntity] = useState<CandidateGuess | null>(null);
  const [gameState, setGameState] = useState<"idle" | "in_progress" | "guess_pending" | "won" | "lost">("idle");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [lastAction, setLastAction] = useState<(() => void) | null>(null);
  const [imageFailed, setImageFailed] = useState(false);

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

      try {
        const res = await fetch("/api/game/answer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId, answer: answerVal })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to process answer");

        if (data.state === "guess_pending" && data.guess) {
          setGuess(data.guess);
          setImageFailed(false);
          setGameState("guess_pending");
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
      setGuess(null);
      setImageFailed(false);
      setGameState("in_progress");
    } catch (err: any) {
      setErrorMsg(err.message);
      setLastAction(() => handleBack);
    } finally {
      setLoading(false);
    }
  }, [sessionId, loading, currentQuestion]);

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

        if (correct || data.state === "won") {
          sessionStorage.removeItem("cognitor_session_id");
          setGameState("won");
          fetchStats();
        } else {
          // Rejected guess
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
        else if (e.key === "2" || e.key.toLowerCase() === "p") submitAnswer(0.75);
        else if (e.key === "3" || e.key.toLowerCase() === "d") submitAnswer(0.5);
        else if (e.key === "4") submitAnswer(0.25);
        else if (e.key === "5" || e.key.toLowerCase() === "n") submitAnswer(0.0);
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

  return (
    <div className="container">
      <header className="app-header">
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            navigateToHome();
          }}
          className="brand-link"
        >
          Cognitor
        </a>

        {gameState !== "idle" && !isAdminRoute && (
          <button
            className="header-action"
            onClick={() => {
              setGameState("idle");
              sessionStorage.removeItem("cognitor_session_id");
            }}
          >
            New Game
          </button>
        )}
      </header>

      {errorMsg && (
        <div style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)", color: "#fca5a5", padding: "0.75rem 1rem", borderRadius: 8, marginBottom: "1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>{errorMsg}</span>
          {lastAction && (
            <button className="btn btn-danger" style={{ padding: "0.25rem 0.6rem", fontSize: "0.8rem" }} onClick={lastAction}>
              Retry
            </button>
          )}
        </div>
      )}

      {isAdminRoute ? (
        <AdminPanel onBack={navigateToHome} />
      ) : (
        <>
          {/* IDLE / START SCREEN */}
          {gameState === "idle" && (
            <div className="card">
              <h1 className="card-title">Cognitor</h1>
              <p className="card-subtitle">
                Think of a person or an everyday object. Answer questions, and the engine will deduce who or what you are thinking of.
              </p>

              <div className="category-picker-grid">
                <button
                  className="category-card"
                  onClick={() => startGame("character")}
                  disabled={loading}
                >
                  <span className="category-card-badge">Living & Fictional</span>
                  <span className="category-card-name">Characters & Figures</span>
                  <span className="category-card-desc">
                    Real people, celebrities, historical figures, and fictional characters.
                  </span>
                </button>

                <button
                  className="category-card"
                  onClick={() => startGame("object")}
                  disabled={loading}
                >
                  <span className="category-card-badge">Everyday Items</span>
                  <span className="category-card-name">Objects & Items</span>
                  <span className="category-card-desc">
                    Tools, appliances, electronic gadgets, vehicles, and household items.
                  </span>
                </button>
              </div>

              {stats && (
                <div className="stats-strip">
                  <span>{stats.activeEntities} active entries</span>
                  <span>{stats.activeQuestions} traits</span>
                  <span>{stats.wins} deductions</span>
                </div>
              )}
            </div>
          )}

          {/* ACTIVE QUESTION SCREEN */}
          {gameState === "in_progress" && currentQuestion && (
            <div className="card">
              <div className="question-header-row">
                <div className="step-indicator">
                  <span>Question {currentQuestion.step}</span>
                  <div className="progress-track">
                    <div
                      className="progress-fill"
                      style={{ width: `${Math.min(100, (currentQuestion.step / 25) * 100)}%` }}
                    />
                  </div>
                </div>

                <span className="domain-pill">
                  {currentDomain === "object" ? "Objects" : "Characters"}
                </span>
              </div>

              <div className="question-prompt">{currentQuestion.text}</div>

              <div className="answer-list">
                <button className="answer-btn" onClick={() => submitAnswer(1.0)} disabled={loading}>
                  <span>Yes</span>
                  <kbd className="kbd-badge">1</kbd>
                </button>
                <button className="answer-btn" onClick={() => submitAnswer(0.75)} disabled={loading}>
                  <span>Probably</span>
                  <kbd className="kbd-badge">2</kbd>
                </button>
                <button className="answer-btn" onClick={() => submitAnswer(0.5)} disabled={loading}>
                  <span>Don't know</span>
                  <kbd className="kbd-badge">3</kbd>
                </button>
                <button className="answer-btn" onClick={() => submitAnswer(0.25)} disabled={loading}>
                  <span>Probably not</span>
                  <kbd className="kbd-badge">4</kbd>
                </button>
                <button className="answer-btn" onClick={() => submitAnswer(0.0)} disabled={loading}>
                  <span>No</span>
                  <kbd className="kbd-badge">5</kbd>
                </button>
              </div>

              <div className="action-row">
                <button
                  className="btn btn-ghost"
                  onClick={handleBack}
                  disabled={loading || currentQuestion.step <= 1}
                  title="Undo last answer (Backspace)"
                >
                  Undo
                </button>
                <button
                  className="btn btn-ghost"
                  onClick={() => startGame(currentDomain)}
                  disabled={loading}
                  title="Restart game"
                >
                  Restart
                </button>
              </div>
            </div>
          )}

          {/* GUESS CARD */}
          {gameState === "guess_pending" && guess && (
            <div className="card guess-container">
              <span className="guess-label">Deduction</span>

              <div className="guess-media">
                {guess.imageUrl && !imageFailed ? (
                  <img
                    src={guess.imageUrl}
                    alt={guess.name}
                    className="guess-image"
                    referrerPolicy="no-referrer"
                    onError={() => setImageFailed(true)}
                  />
                ) : (
                  <div className="guess-image-fallback">
                    <span className="guess-fallback-initial">
                      {guess.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>

              <h2 className="guess-title">{guess.name}</h2>
              {guess.description && <p className="guess-summary">{guess.description}</p>}

              <p className="guess-question">
                Is this what you were thinking of?
              </p>

              <div className="guess-button-group">
                <button
                  className="btn btn-primary"
                  onClick={() => confirmGuess(true)}
                  disabled={loading}
                >
                  Yes, that's it
                </button>
                <button
                  className="btn btn-danger"
                  onClick={() => confirmGuess(false)}
                  disabled={loading}
                >
                  No, keep guessing
                </button>
              </div>
            </div>
          )}

          {/* WON SCREEN */}
          {gameState === "won" && (
            <div className="card result-container">
              <span className="result-badge">Confirmed</span>
              <h2 className="result-heading">Thought Deduced</h2>
              <p className="result-desc">
                Successfully deduced your thought in {currentQuestion ? currentQuestion.step : "a few"} questions.
              </p>
              <div className="result-actions">
                <button
                  className="btn btn-primary"
                  onClick={() => startGame(currentDomain)}
                >
                  Play Again
                </button>
                <button
                  className="btn"
                  onClick={() => startGame(currentDomain === "object" ? "character" : "object")}
                >
                  Switch Category
                </button>
              </div>
            </div>
          )}

          {/* LOST & LEARN FORM SCREEN */}
          {gameState === "lost" && (
            <div className="card result-container">
              <span className="result-badge">Game Finished</span>
              <h2 className="result-heading">You Won</h2>
              <p className="result-desc">
                The engine was unable to deduce your thought within question limits. Add it below to expand the knowledge base.
              </p>

              {learnSubmitted ? (
                <div style={{ padding: "1.5rem 0" }}>
                  <p style={{ color: "var(--success)", fontSize: "0.95rem", marginBottom: "1.5rem" }}>
                    Thank you. Your submission has been sent for moderation.
                  </p>
                  <button className="btn btn-primary" onClick={() => startGame(currentDomain)}>
                    Play Again
                  </button>
                </div>
              ) : (
                <form onSubmit={handleLearnSubmit}>
                  <div className="form-group">
                    <label className="form-label">
                      {currentDomain === "object" ? "What object were you thinking of?" : "Who were you thinking of?"}
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder={currentDomain === "object" ? "e.g. Acoustic Guitar, Microwave" : "e.g. Alan Turing, Marie Curie"}
                      value={learnName}
                      onChange={(e) => setLearnName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      A question distinguishing them from{" "}
                      <strong>{closestWrongEntity ? closestWrongEntity.name : "the closest guess"}</strong>:
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder={currentDomain === "object" ? "e.g. Does it produce musical notes?" : "e.g. Did they discover radioactivity?"}
                      value={learnQuestion}
                      onChange={(e) => setLearnQuestion(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Correct answer for your selection:
                    </label>
                    <select
                      className="form-select"
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

                  <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem" }}>
                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
                      {loading ? "Submitting..." : "Submit Entry"}
                    </button>
                    <button type="button" className="btn" onClick={() => startGame(currentDomain)}>
                      Skip
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </>
      )}

      <footer className="app-footer">
        <span>Cognitor</span>
        <span>·</span>
        <a
          href="/admin"
          onClick={(e) => {
            e.preventDefault();
            navigateToAdmin();
          }}
          className="admin-footer-link"
        >
          Admin
        </a>
      </footer>
    </div>
  );
}
