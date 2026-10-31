import { EngineMatrix } from "./matrix.js";
import { BayesianEngine, CandidateScore } from "./bayes.js";

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

export class GameSessionManager {
  public sessionId: string;
  public matrix: EngineMatrix;
  public engine: BayesianEngine;

  public posterior: Float32Array;
  public history: AnswerHistoryEntry[] = [];
  public askedQuestionIndices: Set<number> = new Set();
  public guesses: GuessRecordEntry[] = [];

  public state: GameState = "in_progress";
  public currentQuestionIdx: number | null = null;
  public pendingGuess: CandidateScore | null = null;

  public contradictionWeakening = false;
  public maxGuesses = 3;
  public hardQuestionLimit = 30;

  constructor(sessionId: string, matrix: EngineMatrix, engine: BayesianEngine) {
    this.sessionId = sessionId;
    this.matrix = matrix;
    this.engine = engine;
    this.posterior = this.engine.createInitialPosterior();
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
      this.contradictionWeakening
    );
    if (!nextQ) {
      throw new Error("No active questions available in engine matrix.");
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
   * Evaluates guess triggers based on rules:
   * 1. Top P >= 0.80 AND gap to #2 >= 0.25 AND questions >= 8
   * 2. Forced guess at question 25
   * 3. No useful questions left
   */
  public shouldGuess(topCandidates: CandidateScore[], hasMoreQuestions: boolean): boolean {
    if (this.guesses.length >= this.maxGuesses) return false;
    if (this.stepCount >= this.hardQuestionLimit) return true;
    if (!hasMoreQuestions) return true;

    if (this.stepCount >= 25) {
      // Forced guess at question 25
      return true;
    }

    if (this.stepCount >= 8 && topCandidates.length > 0) {
      const top1 = topCandidates[0].probability;
      const top2 = topCandidates.length > 1 ? topCandidates[1].probability : 0;
      if (top1 >= 0.80 && top1 - top2 >= 0.25) {
        return true;
      }
    }

    return false;
  }

  /**
   * Handles user's answer to the current question.
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

    // Update Bayesian posterior
    this.posterior = this.engine.updatePosterior(
      this.posterior,
      qIdx,
      answerValue,
      this.contradictionWeakening
    );

    // Check contradiction condition: if after 15 questions max P < 0.05
    if (this.stepCount >= 15 && !this.contradictionWeakening) {
      const top = this.engine.getTopCandidates(this.posterior, 1);
      if (top.length > 0 && top[0].probability < 0.05) {
        this.contradictionWeakening = true;
      }
    }

    const topCandidates = this.engine.getTopCandidates(this.posterior, 5);

    // Check next question availability
    const nextQ = this.engine.selectNextQuestion(
      this.posterior,
      this.askedQuestionIndices,
      this.stepCount,
      this.contradictionWeakening
    );

    const mustGuess = this.shouldGuess(topCandidates, nextQ !== null);

    if (mustGuess && topCandidates.length > 0) {
      // Propose guess
      this.state = "guess_pending";
      this.pendingGuess = topCandidates[0];
      this.currentQuestionIdx = null;
      return {
        guess: topCandidates[0],
        state: "guess_pending"
      };
    }

    if (!nextQ || this.stepCount >= this.hardQuestionLimit) {
      // Forced guess or loss
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
   */
  public confirmGuess(accepted: boolean): {
    state: GameState;
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
      return { state: "won" };
    }

    // Rejected guess:
    // Penalize entity by setting its P to 0.01 * P and renormalize
    this.posterior = this.engine.penalizeRejectedGuess(this.posterior, guessedEntity.entityIdx);
    this.pendingGuess = null;

    // Check if limits reached
    if (this.guesses.length >= this.maxGuesses || this.stepCount >= this.hardQuestionLimit) {
      this.state = "lost";
      return {
        state: "lost",
        closestWrongEntity: guessedEntity
      };
    }

    // Continue asking
    this.state = "in_progress";
    const nextQ = this.engine.selectNextQuestion(
      this.posterior,
      this.askedQuestionIndices,
      this.stepCount,
      this.contradictionWeakening
    );

    if (!nextQ) {
      this.state = "lost";
      return {
        state: "lost",
        closestWrongEntity: guessedEntity
      };
    }

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
   * Reconstructs state from initial prior + remaining answers after undo.
   */
  public undo(): { question: { id: number; text: string; step: number } } {
    if (this.history.length === 0) {
      throw new Error("Cannot undo: at step 1.");
    }

    // Remove the last answered question
    this.history.pop();

    // Recompute posterior from scratch
    this.posterior = this.engine.createInitialPosterior();
    this.askedQuestionIndices.clear();
    this.contradictionWeakening = false;

    for (let step = 0; step < this.history.length; step++) {
      const entry = this.history[step];
      this.askedQuestionIndices.add(entry.questionIdx);

      this.posterior = this.engine.updatePosterior(
        this.posterior,
        entry.questionIdx,
        entry.answerValue,
        this.contradictionWeakening
      );

      if (step + 1 >= 15 && !this.contradictionWeakening) {
        const top = this.engine.getTopCandidates(this.posterior, 1);
        if (top.length > 0 && top[0].probability < 0.05) {
          this.contradictionWeakening = true;
        }
      }
    }

    // Reset pending guesses if undoing back into questioning
    this.state = "in_progress";
    this.pendingGuess = null;

    const nextQ = this.engine.selectNextQuestion(
      this.posterior,
      this.askedQuestionIndices,
      this.stepCount,
      this.contradictionWeakening
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
