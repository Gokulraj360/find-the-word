import React, { useState, useEffect } from "react";
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
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [guess, setGuess] = useState<CandidateGuess | null>(null);
  const [closestWrongEntity, setClosestWrongEntity] = useState<CandidateGuess | null>(null);
  const [gameState, setGameState] = useState<"idle" | "in_progress" | "guess_pending" | "won" | "lost">("idle");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

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
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    fetchStats();
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
  const startGame = async () => {
    setLoading(true);
    setErrorMsg("");
    setLearnSubmitted(false);
    setLearnName("");
    setLearnQuestion("");
    setClosestWrongEntity(null);
    try {
      const res = await fetch("/api/game/start", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to start game");
      setSessionId(data.sessionId);
      setCurrentQuestion(data.question);
      setGuess(null);
      setGameState("in_progress");
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Submit answer
  const submitAnswer = async (answerVal: number) => {
    if (!sessionId || loading) return;
    setLoading(true);
    setErrorMsg("");
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
        setGameState("guess_pending");
      } else if (data.state === "in_progress" && data.question) {
        setCurrentQuestion(data.question);
        setGameState("in_progress");
      } else if (data.state === "lost") {
        setGameState("lost");
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Back / Undo
  const handleBack = async () => {
    if (!sessionId || loading || (currentQuestion && currentQuestion.step <= 1)) return;
    setLoading(true);
    setErrorMsg("");
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
      setGameState("in_progress");
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Confirm guess
  const confirmGuess = async (correct: boolean) => {
    if (!sessionId || !guess || loading) return;
    setLoading(true);
    setErrorMsg("");
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
          setGameState("lost");
          fetchStats();
        } else if (data.question) {
          setCurrentQuestion(data.question);
          setGuess(null);
          setGameState("in_progress");
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

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
      <header>
        <div style={{ display: "flex", alignItems: "baseline" }}>
          <a href="/" onClick={(e) => { e.preventDefault(); navigateToHome(); }} className="logo-title">
            Cognitor
          </a>
          <span className="logo-sub">Bayesian Mind Guesser</span>
        </div>
        <nav>
          {isAdminRoute ? (
            <button className="btn" onClick={navigateToHome} style={{ padding: "0.3rem 0.75rem", fontSize: "0.85rem" }}>
              Play Game
            </button>
          ) : (
            <button className="btn" onClick={navigateToAdmin} style={{ padding: "0.3rem 0.75rem", fontSize: "0.85rem" }}>
              Admin Panel
            </button>
          )}
        </nav>
      </header>

      {errorMsg && (
        <p style={{ background: "rgba(239,68,68,0.15)", color: "var(--danger)", padding: "0.75rem", borderRadius: 6, marginBottom: "1rem" }}>
          {errorMsg}
        </p>
      )}

      {isAdminRoute ? (
        <AdminPanel onBack={navigateToHome} />
      ) : (
        <>
          {/* IDLE / START SCREEN */}
          {gameState === "idle" && (
            <div className="card" style={{ textAlign: "center" }}>
              <h1 style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>Think of a Character</h1>
              <p style={{ color: "var(--text-muted)", marginBottom: "2rem", fontSize: "1.05rem" }}>
                Think of any famous real person or fictional character. Answer my questions, and I will deduce who you are thinking of using Bayesian probability.
              </p>

              {stats && (
                <div className="stats-grid">
                  <div className="stat-box">
                    <div className="stat-number">{stats.activeEntities}</div>
                    <div className="stat-label">Characters</div>
                  </div>
                  <div className="stat-box">
                    <div className="stat-number">{stats.activeQuestions}</div>
                    <div className="stat-label">Questions</div>
                  </div>
                  <div className="stat-box">
                    <div className="stat-number">{stats.wins}</div>
                    <div className="stat-label">Victories</div>
                  </div>
                </div>
              )}

              <button className="btn btn-primary" onClick={startGame} disabled={loading} style={{ fontSize: "1.1rem", padding: "0.85rem 2.5rem" }}>
                {loading ? "Starting..." : "Start Game"}
              </button>
            </div>
          )}

          {/* ACTIVE QUESTION SCREEN */}
          {gameState === "in_progress" && currentQuestion && (
            <div className="card">
              <div className="question-header">
                <span className="question-counter">Question #{currentQuestion.step}</span>
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Active Engine</span>
              </div>

              <div className="question-text">{currentQuestion.text}</div>

              <div className="answer-grid">
                <button className="btn" onClick={() => submitAnswer(1.0)} disabled={loading}>
                  Yes
                </button>
                <button className="btn" onClick={() => submitAnswer(0.75)} disabled={loading}>
                  Probably
                </button>
                <button className="btn" onClick={() => submitAnswer(0.5)} disabled={loading}>
                  Don't know
                </button>
                <button className="btn" onClick={() => submitAnswer(0.25)} disabled={loading}>
                  Probably not
                </button>
                <button className="btn" onClick={() => submitAnswer(0.0)} disabled={loading}>
                  No
                </button>
              </div>

              <div className="controls-row">
                <button className="btn" onClick={handleBack} disabled={loading || currentQuestion.step <= 1} title="Undo last answer">
                  ← Back
                </button>
                <button className="btn" onClick={startGame} disabled={loading} title="Restart game">
                  Restart
                </button>
              </div>
            </div>
          )}

          {/* GUESS CARD */}
          {gameState === "guess_pending" && guess && (
            <div className="card guess-card">
              <span className="question-counter" style={{ display: "block", marginBottom: "1rem" }}>
                Cognitor's Deduction
              </span>

              {guess.imageUrl && (
                <img
                  src={guess.imageUrl}
                  alt={guess.name}
                  className="guess-image"
                  onError={(e) => { (e.currentTarget as HTMLElement).style.display = "none"; }}
                />
              )}

              <h2 className="guess-name">{guess.name}</h2>
              {guess.description && <p className="guess-desc">{guess.description}</p>}

              <p style={{ marginBottom: "1.5rem", fontWeight: 500, fontSize: "1.1rem" }}>
                Are you thinking of this character?
              </p>

              <div className="guess-actions">
                <button className="btn btn-success" onClick={() => confirmGuess(true)} disabled={loading}>
                  Yes, that's it!
                </button>
                <button className="btn btn-danger" onClick={() => confirmGuess(false)} disabled={loading}>
                  No
                </button>
              </div>
            </div>
          )}

          {/* WON SCREEN */}
          {gameState === "won" && (
            <div className="card" style={{ textAlign: "center" }}>
              <h2 style={{ fontSize: "1.8rem", color: "var(--success)", marginBottom: "0.5rem" }}>
                Guessed It!
              </h2>
              <p style={{ color: "var(--text-muted)", marginBottom: "2rem" }}>
                I successfully deduced your character using Bayesian inference. Soft counts and popularity have been updated in the learning loop.
              </p>
              <button className="btn btn-primary" onClick={startGame} style={{ padding: "0.85rem 2rem" }}>
                Play Again
              </button>
            </div>
          )}

          {/* LOST & LEARN FORM SCREEN */}
          {gameState === "lost" && (
            <div className="card">
              <h2 style={{ fontSize: "1.6rem", marginBottom: "0.5rem" }}>You Defeated Me!</h2>
              <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem" }}>
                I could not guess your character within my limits. Teach me so I can guess it next time!
              </p>

              {learnSubmitted ? (
                <div style={{ textAlign: "center", padding: "1.5rem" }}>
                  <p style={{ color: "var(--success)", fontSize: "1.1rem", marginBottom: "1.5rem" }}>
                    ✓ Thank you! Your character and question have been submitted for moderation.
                  </p>
                  <button className="btn btn-primary" onClick={startGame}>
                    Play Again
                  </button>
                </div>
              ) : (
                <form onSubmit={handleLearnSubmit}>
                  <div className="form-group">
                    <label className="form-label">Who were you thinking of?</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Luke Skywalker, Alan Turing"
                      value={learnName}
                      onChange={(e) => setLearnName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      A question that tells them apart from{" "}
                      <strong>{closestWrongEntity ? closestWrongEntity.name : "my closest guess"}</strong>:
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Does your character use a green lightsaber?"
                      value={learnQuestion}
                      onChange={(e) => setLearnQuestion(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">What is the answer for your character?</label>
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
                      {loading ? "Submitting..." : "Teach Cognitor"}
                    </button>
                    <button type="button" className="btn" onClick={startGame}>
                      Skip & Play Again
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </>
      )}

      <footer>
        Cognitor Engine • Powered by Bayesian Inference & Beta Priors • In-Memory Matrix
      </footer>
    </div>
  );
}
