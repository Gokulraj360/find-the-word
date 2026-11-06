import React, { useState, useEffect, useCallback } from "react";
import {
  QuizQuestionClient,
  QuizOption,
  QuizAnswerResponse,
  startQuiz,
  submitQuizAnswer
} from "./quiz.js";
import { sounds } from "./soundEffects.js";
import { triggerConfetti } from "./confetti.js";

interface QuickQuizArenaProps {
  initialDomain?: "all" | "character" | "object";
  onClose: () => void;
}

export function QuickQuizArena({ initialDomain = "all", onClose }: QuickQuizArenaProps) {
  const [domain, setDomain] = useState<"all" | "character" | "object">(initialDomain);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestionClient | null>(null);
  const [questionIndex, setQuestionIndex] = useState<number>(0);
  const [totalQuestions, setTotalQuestions] = useState<number>(5);
  const [score, setScore] = useState<number>(0);

  // Per-round state
  const [selectedOptionId, setSelectedOptionId] = useState<number | null>(null);
  const [answerResult, setAnswerResult] = useState<QuizAnswerResponse | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [loadingQuiz, setLoadingQuiz] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [isFinished, setIsFinished] = useState<boolean>(false);

  // Initialize or restart quiz
  const initQuiz = useCallback(
    async (chosenDomain: "all" | "character" | "object") => {
      setLoadingQuiz(true);
      setErrorMsg("");
      setSelectedOptionId(null);
      setAnswerResult(null);
      setIsFinished(false);
      setQuestionIndex(0);
      setScore(0);

      try {
        const startData = await startQuiz(chosenDomain, 5);
        setSessionId(startData.sessionId);
        setCurrentQuestion(startData.question);
        setTotalQuestions(startData.totalQuestions);
      } catch (err: any) {
        setErrorMsg(err.message || "Failed to initialize quiz.");
      } finally {
        setLoadingQuiz(false);
      }
    },
    []
  );

  useEffect(() => {
    initQuiz(domain);
  }, [domain, initQuiz]);

  const handleSelectOption = async (option: QuizOption) => {
    if (!sessionId || submitting || selectedOptionId !== null || isFinished) return;

    setSelectedOptionId(option.entityId);
    setSubmitting(true);
    setErrorMsg("");

    try {
      const result = await submitQuizAnswer(sessionId, questionIndex, option.entityId);
      setAnswerResult(result);
      setScore(result.currentScore);

      if (result.correct) {
        sounds.playAnswerChime(1.0);
      } else {
        sounds.playDefeat();
      }

      if (result.isFinished) {
        setIsFinished(true);
        if (result.currentScore >= Math.ceil(result.totalQuestions * 0.8)) {
          sounds.playVictory();
          sounds.playConfettiPop();
          triggerConfetti();
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to submit answer.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleNextQuestion = () => {
    if (!answerResult || !answerResult.nextQuestion) return;
    setCurrentQuestion(answerResult.nextQuestion);
    setQuestionIndex((prev) => prev + 1);
    setSelectedOptionId(null);
    setAnswerResult(null);
  };

  const getQuestionTypeLabel = (type: string) => {
    switch (type) {
      case "visual_id":
        return "Visual Identification";
      case "trait_match":
        return "Trait & Logic Match";
      case "fun_fact":
        return "Fun Fact Trivia";
      default:
        return "Quick Quiz";
    }
  };

  const getRankAssessment = (finalScore: number, total: number) => {
    const ratio = finalScore / Math.max(1, total);
    if (ratio === 1.0) {
      return {
        title: "Cognitor Grandmaster",
        desc: "Flawless deduction! You recognize items with near-instant photographic precision."
      };
    }
    if (ratio >= 0.8) {
      return {
        title: "Sharp Detective",
        desc: "Impressive analytical eye! You mastered nearly every round with high accuracy."
      };
    }
    if (ratio >= 0.6) {
      return {
        title: "Keen Thinker",
        desc: "Solid performance! You have a good instinct for discerning distinctive features."
      };
    }
    return {
      title: "Knowledge Apprentice",
      desc: "Good effort! Play a few more rounds to sharpen your deduction instincts."
    };
  };

  const getProxiedImage = (url: string | null) => {
    if (!url) return null;
    return `/api/image-proxy?url=${encodeURIComponent(url)}`;
  };

  return (
    <div className="quiz-arena-overlay">
      <div className="quiz-arena-card">
        {/* Arena Header */}
        <div className="quiz-arena-header">
          <div className="quiz-header-meta">
            <span className="quiz-brand-tag">Cognitor Trivia</span>
            <h2 className="quiz-arena-title">Quick Quiz Mode</h2>
          </div>

          <div className="quiz-header-controls">
            {!isFinished && (
              <div className="quiz-score-badge">
                Score: {score} / {totalQuestions}
              </div>
            )}
            <button
              type="button"
              className="stats-modal-close"
              onClick={onClose}
              aria-label="Exit quiz"
            >
              x
            </button>
          </div>
        </div>

        {/* Domain Toggle Tabs */}
        <div className="quiz-domain-tabs">
          <button
            type="button"
            className={`quiz-domain-btn ${domain === "all" ? "active" : ""}`}
            onClick={() => setDomain("all")}
            disabled={submitting}
          >
            All Items
          </button>
          <button
            type="button"
            className={`quiz-domain-btn ${domain === "character" ? "active" : ""}`}
            onClick={() => setDomain("character")}
            disabled={submitting}
          >
            Characters
          </button>
          <button
            type="button"
            className={`quiz-domain-btn ${domain === "object" ? "active" : ""}`}
            onClick={() => setDomain("object")}
            disabled={submitting}
          >
            Objects
          </button>
        </div>

        {errorMsg && <div className="leaderboard-alert-error">{errorMsg}</div>}

        {/* Loading state */}
        {loadingQuiz ? (
          <div className="quiz-loading-state">
            <div className="loading-spinner"></div>
            <p>Constructing quiz questions from matrix...</p>
          </div>
        ) : isFinished ? (
          /* ============================================================ */
          /* FINISHED SCORECARD */
          /* ============================================================ */
          <div className="quiz-scorecard">
            <span className="scorecard-tag">Quiz Complete</span>
            <h3 className="scorecard-title">
              {getRankAssessment(score, totalQuestions).title}
            </h3>
            <div className="scorecard-num">
              {score} / {totalQuestions} Correct
            </div>
            <p className="scorecard-desc">
              {getRankAssessment(score, totalQuestions).desc}
            </p>

            <div className="scorecard-actions">
              <button
                type="button"
                className="game-btn game-btn-primary"
                onClick={() => initQuiz(domain)}
              >
                Play Again
              </button>
              <button
                type="button"
                className="game-btn game-btn-secondary"
                onClick={onClose}
              >
                Return to Cognitor
              </button>
            </div>
          </div>
        ) : (
          currentQuestion && (
            /* ============================================================ */
            /* ACTIVE QUESTION VIEW */
            /* ============================================================ */
            <div className="quiz-question-container">
              {/* Progress & Type */}
              <div className="quiz-round-bar">
                <span className="quiz-round-count">
                  Round {questionIndex + 1} of {totalQuestions}
                </span>
                <span className="quiz-type-badge">
                  {getQuestionTypeLabel(currentQuestion.questionType)}
                </span>
              </div>

              {/* Prompt */}
              <div className="quiz-prompt-card">
                <h3 className="quiz-prompt-text">{currentQuestion.prompt}</h3>
                {currentQuestion.subPrompt && (
                  <p className="quiz-subprompt-text">{currentQuestion.subPrompt}</p>
                )}
              </div>

              {/* 4 Options Grid */}
              <div className="quiz-options-grid">
                {currentQuestion.options.map((opt) => {
                  const isSelected = selectedOptionId === opt.entityId;
                  const hasAnswered = answerResult !== null;
                  const isCorrect = answerResult?.correctEntityId === opt.entityId;

                  let cardStateClass = "";
                  if (hasAnswered) {
                    if (isCorrect) {
                      cardStateClass = "option-correct";
                    } else if (isSelected) {
                      cardStateClass = "option-incorrect";
                    } else {
                      cardStateClass = "option-dimmed";
                    }
                  }

                  return (
                    <button
                      key={opt.entityId}
                      type="button"
                      className={`quiz-option-card ${cardStateClass}`}
                      onClick={() => handleSelectOption(opt)}
                      disabled={hasAnswered || submitting}
                    >
                      <div className="quiz-option-img-wrap">
                        {opt.imageUrl ? (
                          <img
                            src={getProxiedImage(opt.imageUrl) || opt.imageUrl}
                            alt={opt.name}
                            className="quiz-option-img"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = "none";
                            }}
                          />
                        ) : (
                          <div className="quiz-option-fallback">
                            {opt.name.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                      </div>

                      <div className="quiz-option-info">
                        <span className="quiz-option-name">{opt.name}</span>
                        <span className="quiz-option-category">{opt.category}</span>
                      </div>

                      {hasAnswered && isCorrect && (
                        <span className="quiz-status-pill pill-correct">Correct</span>
                      )}
                      {hasAnswered && isSelected && !isCorrect && (
                        <span className="quiz-status-pill pill-incorrect">Your Pick</span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Post-Answer Explanation & Advance */}
              {answerResult && (
                <div
                  className={`quiz-explanation-banner ${
                    answerResult.correct ? "banner-correct" : "banner-incorrect"
                  }`}
                >
                  <p className="quiz-explanation-text">{answerResult.explanation}</p>
                  <button
                    type="button"
                    className="game-btn game-btn-primary quiz-advance-btn"
                    onClick={handleNextQuestion}
                  >
                    {answerResult.isFinished ? "View Final Score" : "Next Round"}
                  </button>
                </div>
              )}
            </div>
          )
        )}
      </div>
    </div>
  );
}
