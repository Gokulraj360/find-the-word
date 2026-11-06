import { EngineMatrix } from "./matrix.js";
import { BayesianEngine, CandidateScore } from "./bayes.js";
import { CategoryPackId } from "../services/categoryPackService.js";

export interface AnswerHistoryEntry {
  questionId: number;
  questionIdx: number;
  answerValue: number;
}

export interface GuessRecordEntry {
  entityId: number;
  entityIdx: number;
  step: number;
  accepted: boolean;
}

export type GameState = "in_progress" | "guess_pending" | "won" | "lost";
export type Difficulty = "easy" | "hard" | "expert";

export class GameSessionManager {
  public sessionId: string;
  public domain: "character" | "object";
  public difficulty: Difficulty;
  public categoryPack: CategoryPackId;
  public matrix: EngineMatrix;
  public engine: BayesianEngine;

  public penalties: Float32Array;
  public posterior: Float32Array;
  public history: AnswerHistoryEntry[] = [];
  public askedQuestionIndices: Set<number> = new Set();
  public guesses: GuessRecordEntry[] = [];

  public state: GameState = "in_progress";
  public currentQuestionIdx: number | null = null;
  public pendingGuess: CandidateScore | null = null;

  public contradictionWeakening = false;
  public maxGuesses = 3;
  public hardQuestionLimit = 25;

  constructor(
    sessionId: string,
    matrix: EngineMatrix,
    engine: BayesianEngine,
    domain: "character" | "object" = "character",
    difficulty: Difficulty = "easy",
    categoryPack: CategoryPackId = "all"
  ) {
    this.sessionId = sessionId;
    this.domain = domain;
    this.difficulty = difficulty;
    this.categoryPack = categoryPack;
    this.matrix = matrix;
    this.engine = engine;
    this.penalties = new Float32Array(this.matrix.numEntities);

    if (this.difficulty === "expert") {
      this.hardQuestionLimit = 15;
    } else if (this.difficulty === "hard") {
      this.hardQuestionLimit = 20;
    } else {
      this.hardQuestionLimit = 25;
    }

    this.posterior = this.engine.computeProbabilities(
      this.penalties,
      this.domain,
      this.difficulty,
      this.categoryPack
    );
  }

  public get currentCertainty(): number {
    const top = this.engine.getTopCandidates(this.posterior, 2, this.domain, this.categoryPack);
    if (top.length === 0) return 0;
    const p1 = top[0].probability;
    const p2 = top.length > 1 ? top[1].probability : 0;
    const score = p1 * 0.7 + Math.max(0, p1 - p2) * 0.3;
    return Math.min(1.0, Math.max(0.02, score));
  }

  public getAnswerSummary() {
    return this.history.map((h, i) => ({
      step: i + 1,
      questionId: h.questionId,
      questionText: this.matrix.questions[h.questionIdx]?.text || `Question ${i + 1}`,
      answerValue: h.answerValue
    }));
  }

  public get stepCount(): number {
    return this.history.length;
  }

  public get guessesCount(): number {
    return this.guesses.length;
  }

  /**
   * Initializes the first question.
   */
  public start(): { question: { id: number; text: string; step: number } } {
    const nextQ = this.engine.selectNextQuestion(
      this.posterior,
      this.askedQuestionIndices,
      this.stepCount,
      this.contradictionWeakening,
      this.domain
    );
    if (!nextQ) {
      throw new Error(`No active questions available in engine matrix for domain: ${this.domain}.`);
    }
    this.currentQuestionIdx = nextQ.questionIdx;
    return {
      question: {
        id: nextQ.questionId,
        text: nextQ.text,
        step: 1
      }
    };
  }

  /**
   * Evaluates guess triggers:
   * 1. Top item probability >= 70% and at least 8 questions asked.
   * 2. Reached 20 questions.
   * 3. No more available questions.
   */
  public shouldGuess(topCandidates: CandidateScore[], hasMoreQuestions: boolean): boolean {
    if (this.guesses.length >= this.maxGuesses) return false;
    if (!hasMoreQuestions) return true;
    if (this.stepCount >= this.hardQuestionLimit) return true;

    if (topCandidates.length > 0) {
      const top1 = topCandidates[0].probability;
      if (top1 >= 0.70 && this.stepCount >= 8) {
        return true;
      }
    }

    return false;
  }

  /**
   * Handles user's answer to the current question:
   * Accumulates penalty, updates softmax probabilities, checks guess condition,
   * and never shows "can't find answer" when candidates remain.
   */
  public answer(answerValue: number): {
    guess?: CandidateScore;
    question?: { id: number; text: string; step: number };
    state: GameState;
  } {
    if (this.state === "won" || this.state === "lost") {
      return { state: this.state };
    }

    if (this.currentQuestionIdx === null) {
      throw new Error("No pending question to answer.");
    }

    const qIdx = this.currentQuestionIdx;
    const qId = this.matrix.questions[qIdx].id;

    // Record to history
    this.history.push({
      questionId: qId,
      questionIdx: qIdx,
      answerValue
    });
    this.askedQuestionIndices.add(qIdx);

    // Update penalties & compute new probabilities via softmax over (-penalty * k)
    this.engine.updatePenalties(this.penalties, qIdx, answerValue, this.domain);
    this.posterior = this.engine.computeProbabilities(
      this.penalties,
      this.domain,
      this.difficulty,
      this.categoryPack
    );

    // Check contradiction condition: if after 15 questions max P < 0.05
    if (this.stepCount >= 15 && !this.contradictionWeakening) {
      const top = this.engine.getTopCandidates(this.posterior, 1, this.domain, this.categoryPack);
      if (top.length > 0 && top[0].probability < 0.05) {
        this.contradictionWeakening = true;
      }
    }

    const topCandidates = this.engine.getTopCandidates(this.posterior, 5, this.domain, this.categoryPack);

    // Select next question
    const nextQ = this.engine.selectNextQuestion(
      this.posterior,
      this.askedQuestionIndices,
      this.stepCount,
      this.contradictionWeakening,
      this.domain
    );

    const mustGuess = this.shouldGuess(topCandidates, nextQ !== null);

    if (mustGuess && topCandidates.length > 0) {
      this.state = "guess_pending";
      this.pendingGuess = topCandidates[0];
      this.currentQuestionIdx = null;
      return {
        guess: topCandidates[0],
        state: "guess_pending"
      };
    }

    if (!nextQ || this.stepCount >= this.hardQuestionLimit) {
      // Reached question limit or ran out of questions: ALWAYS make the best guess
      if (topCandidates.length > 0 && this.guesses.length < this.maxGuesses) {
        this.state = "guess_pending";
        this.pendingGuess = topCandidates[0];
        this.currentQuestionIdx = null;
        return {
          guess: topCandidates[0],
          state: "guess_pending"
        };
      } else {
        this.state = "lost";
        return { state: "lost" };
      }
    }

    this.currentQuestionIdx = nextQ.questionIdx;
    return {
      question: {
        id: nextQ.questionId,
        text: nextQ.text,
        step: this.stepCount + 1
      },
      state: "in_progress"
    };
  }

  /**
   * Handles user's confirmation of a guess ("Yes" or "No").
   * If wrong: applies heavy penalty (+4.0), keeps asking, and guesses again (up to 3 guesses).
   */
  public confirmGuess(accepted: boolean): {
    state: GameState;
    guess?: CandidateScore;
    question?: { id: number; text: string; step: number };
    closestWrongEntity?: CandidateScore;
  } {
    if (!this.pendingGuess) {
      throw new Error("No pending guess to confirm.");
    }

    const guessedEntity = this.pendingGuess;
    this.guesses.push({
      entityId: guessedEntity.entityId,
      entityIdx: guessedEntity.entityIdx,
      step: this.stepCount,
      accepted
    });

    if (accepted) {
      this.state = "won";
      this.pendingGuess = null;
      return { state: "won", guess: guessedEntity };
    }

    // Rejected guess:
    // Apply heavy penalty to that item, recompute probabilities, and keep guessing
    this.engine.penalizeRejectedGuess(this.penalties, guessedEntity.entityIdx);
    this.posterior = this.engine.computeProbabilities(
      this.penalties,
      this.domain,
      this.difficulty,
      this.categoryPack
    );
    this.pendingGuess = null;

    // Check if max 3 guesses reached
    if (this.guesses.length >= this.maxGuesses) {
      this.state = "lost";
      return {
        state: "lost",
        closestWrongEntity: guessedEntity
      };
    }

    const topCandidates = this.engine.getTopCandidates(this.posterior, 5, this.domain, this.categoryPack);
    const nextQ = this.engine.selectNextQuestion(
      this.posterior,
      this.askedQuestionIndices,
      this.stepCount,
      this.contradictionWeakening,
      this.domain
    );

    // If reached question limit (>= 20) or out of questions, guess next top candidate immediately
    if (this.stepCount >= this.hardQuestionLimit || !nextQ) {
      if (topCandidates.length > 0 && this.guesses.length < this.maxGuesses) {
        this.state = "guess_pending";
        this.pendingGuess = topCandidates[0];
        this.currentQuestionIdx = null;
        return {
          state: "guess_pending"
        };
      } else {
        this.state = "lost";
        return {
          state: "lost",
          closestWrongEntity: guessedEntity
        };
      }
    }

    // Keep asking
    this.state = "in_progress";
    this.currentQuestionIdx = nextQ.questionIdx;
    return {
      state: "in_progress",
      question: {
        id: nextQ.questionId,
        text: nextQ.text,
        step: this.stepCount + 1
      }
    };
  }

  /**
   * Reconstructs state from penalty accumulation after undo.
   */
  public undo(): { question: { id: number; text: string; step: number } } {
    if (this.history.length === 0) {
      throw new Error("Cannot undo: at step 1.");
    }

    // Remove the last answered question
    this.history.pop();

    // Reset penalties and asked set
    this.penalties.fill(0.0);
    this.askedQuestionIndices.clear();
    this.contradictionWeakening = false;

    // Replay remaining history
    for (let step = 0; step < this.history.length; step++) {
      const entry = this.history[step];
      this.askedQuestionIndices.add(entry.questionIdx);
      this.engine.updatePenalties(this.penalties, entry.questionIdx, entry.answerValue, this.domain);
    }

    // Re-apply penalties for rejected guesses that occurred up to the current step
    for (const g of this.guesses) {
      if (!g.accepted && g.step <= this.stepCount) {
        this.engine.penalizeRejectedGuess(this.penalties, g.entityIdx);
      }
    }

    // Recompute probabilities
    this.posterior = this.engine.computeProbabilities(
      this.penalties,
      this.domain,
      this.difficulty,
      this.categoryPack
    );

    this.state = "in_progress";
    this.pendingGuess = null;

    const nextQ = this.engine.selectNextQuestion(
      this.posterior,
      this.askedQuestionIndices,
      this.stepCount,
      this.contradictionWeakening,
      this.domain
    );

    if (!nextQ) {
      throw new Error("No active questions available after undo.");
    }

    this.currentQuestionIdx = nextQ.questionIdx;
    return {
      question: {
        id: nextQ.questionId,
        text: nextQ.text,
        step: this.stepCount + 1
      }
    };
  }
}
