import { v4 as uuidv4 } from "uuid";
import { EngineMatrix } from "../engine/matrix.js";
import { IStorage, EntityRecord, QuestionRecord } from "../db/types.js";
import { friendChallengeService } from "./friendChallengeService.js";
import { getFunFactForEntity } from "./funFactService.js";

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

export interface ReverseSession {
  sessionId: string;
  domain: "character" | "object";
  secretEntityId: number;
  secretEntityName: string;
  challengeCode?: string;
  history: ReverseQuestionAnswer[];
  wrongGuesses: string[];
  hints: ReverseHint[];
  penaltyQuestions: number;
  maxQuestions: number; // 20
  maxGuesses: number; // 3
  maxHints: number; // 3
  state: "in_progress" | "won" | "lost";
  createdAt: number;
}

export class ReverseGameService {
  private sessions: Map<string, ReverseSession> = new Map();
  private readonly TTL_MS = 60 * 60 * 1000; // 1 hour

  constructor() {
    setInterval(() => this.cleanupStale(), 5 * 60 * 1000);
  }

  private cleanupStale() {
    const now = Date.now();
    for (const [id, s] of this.sessions.entries()) {
      if (now - s.createdAt > this.TTL_MS) {
        this.sessions.delete(id);
      }
    }
  }

  public async startSession(
    storage: IStorage,
    domain: "character" | "object" = "character",
    specificEntityId?: number,
    challengeCode?: string
  ): Promise<{
    sessionId: string;
    domain: "character" | "object";
    maxQuestions: number;
    maxGuesses: number;
    maxHints: number;
    challengeCode?: string;
  }> {
    const activeEntities = await storage.getActiveEntities();
    const domainEntities = activeEntities.filter((e) => e.category === domain);

    if (domainEntities.length === 0) {
      throw new Error(`No active entities found for domain: ${domain}`);
    }

    let secret: EntityRecord | undefined;
    if (specificEntityId !== undefined) {
      secret = domainEntities.find((e) => e.id === specificEntityId);
      if (!secret) {
        throw new Error(`Specific entity ID ${specificEntityId} not found in active ${domain} list.`);
      }
    } else {
      const randomIndex = Math.floor(Math.random() * domainEntities.length);
      secret = domainEntities[randomIndex];
    }

    const sessionId = uuidv4();

    const session: ReverseSession = {
      sessionId,
      domain,
      secretEntityId: secret.id,
      secretEntityName: secret.name,
      challengeCode,
      history: [],
      wrongGuesses: [],
      hints: [],
      penaltyQuestions: 0,
      maxQuestions: 20,
      maxGuesses: 3,
      maxHints: 3,
      state: "in_progress",
      createdAt: Date.now()
    };

    this.sessions.set(sessionId, session);

    return {
      sessionId,
      domain,
      maxQuestions: session.maxQuestions,
      maxGuesses: session.maxGuesses,
      maxHints: session.maxHints,
      challengeCode
    };
  }

  public getSession(sessionId: string): ReverseSession | null {
    return this.sessions.get(sessionId) || null;
  }

  public async askQuestion(
    sessionId: string,
    questionId: number,
    matrix: EngineMatrix,
    storage: IStorage
  ): Promise<{
    answerLabel: "Yes" | "Probably" | "Don't know" | "Probably not" | "No";
    answerValue: number;
    step: number;
    questionsRemaining: number;
    state: "in_progress" | "won" | "lost";
    revealedEntity?: { id: number; name: string; description: string | null; imageUrl: string | null; funFact?: string | null };
  }> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error("Session not found or expired.");
    }
    if (session.state !== "in_progress") {
      throw new Error(`Game already ended with state: ${session.state}`);
    }

    const qRecord = await storage.getQuestion(questionId);
    if (!qRecord) {
      throw new Error("Question not found.");
    }

    const eIdx = matrix.entityIdToIndex.get(session.secretEntityId);
    const qIdx = matrix.questionIdToIndex.get(questionId);

    let pYes = 0.5;
    if (eIdx !== undefined && qIdx !== undefined) {
      pYes = matrix.getPYes(eIdx, qIdx);
    }

    let answerLabel: "Yes" | "Probably" | "Don't know" | "Probably not" | "No" = "Don't know";
    let answerValue = 0.5;

    if (pYes >= 0.85) {
      answerLabel = "Yes";
      answerValue = 1.0;
    } else if (pYes <= 0.15) {
      answerLabel = "No";
      answerValue = 0.0;
    } else if (pYes >= 0.65) {
      answerLabel = "Probably";
      answerValue = 0.75;
    } else if (pYes <= 0.35) {
      answerLabel = "Probably not";
      answerValue = 0.25;
    }

    const step = session.history.length + 1;
    session.history.push({
      step,
      questionId,
      questionText: qRecord.text,
      answerLabel,
      answerValue
    });

    const totalUsed = session.history.length + session.penaltyQuestions;
    const questionsRemaining = Math.max(0, session.maxQuestions - totalUsed);

    if (totalUsed >= session.maxQuestions) {
      session.state = "lost";
      if (session.challengeCode) {
        friendChallengeService.recordChallengeCompletion(session.challengeCode, false, totalUsed);
      }
      const secret = await storage.getEntity(session.secretEntityId);
      return {
        answerLabel,
        answerValue,
        step,
        questionsRemaining: 0,
        state: "lost",
        revealedEntity: secret
          ? {
              id: secret.id,
              name: secret.name,
              description: secret.description,
              imageUrl: secret.imageUrl,
              funFact: secret.funFact || getFunFactForEntity(secret.id, secret.name, secret.category, secret.description || undefined)
            }
          : undefined
      };
    }

    return {
      answerLabel,
      answerValue,
      step,
      questionsRemaining,
      state: session.state
    };
  }

  public async requestHint(
    sessionId: string,
    matrix: EngineMatrix,
    storage: IStorage,
    penaltySteps: number = 2
  ): Promise<{
    hint: ReverseHint;
    penaltyQuestions: number;
    questionsRemaining: number;
    hintsRemaining: number;
    state: "in_progress" | "won" | "lost";
    revealedEntity?: { id: number; name: string; description: string | null; imageUrl: string | null; funFact?: string | null };
  }> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error("Session not found or expired.");
    }
    if (session.state !== "in_progress") {
      throw new Error(`Game already ended with state: ${session.state}`);
    }

    const totalUsedBefore = session.history.length + session.penaltyQuestions;
    const questionsRemainingBefore = Math.max(0, session.maxQuestions - totalUsedBefore);

    if (questionsRemainingBefore <= penaltySteps) {
      throw new Error(
        `Not enough questions remaining to use a hint. A hint requires at least ${penaltySteps + 1} questions remaining.`
      );
    }

    if (session.hints.length >= session.maxHints) {
      throw new Error(`Maximum hints limit (${session.maxHints}) reached for this game.`);
    }

    const secret = await storage.getEntity(session.secretEntityId);
    if (!secret) {
      throw new Error("Secret entity not found in storage.");
    }

    const eIdx = matrix.entityIdToIndex.get(session.secretEntityId);
    const askedQIds = new Set(session.history.map((h) => h.questionId));
    session.hints.forEach((h) => {
      if (h.questionId) askedQIds.add(h.questionId);
    });

    const activeQuestions = await storage.getActiveQuestions();
    const domainQuestions = activeQuestions.filter(
      (q) => !q.category || q.category === "common" || q.category === session.domain
    );

    // Pick an informative unasked question where secret entity is affirmatively true (pYes >= 0.85)
    let bestQuestion: QuestionRecord | null = null;
    let bestSpecificity = -1;

    for (const q of domainQuestions) {
      if (askedQIds.has(q.id)) continue;
      const qIdx = matrix.questionIdToIndex.get(q.id);
      if (eIdx === undefined || qIdx === undefined) continue;

      const pYes = matrix.getPYes(eIdx, qIdx);
      if (pYes >= 0.85) {
        let affirmativeCount = 0;
        for (let otherEIdx = 0; otherEIdx < matrix.numEntities; otherEIdx++) {
          if (matrix.getPYes(otherEIdx, qIdx) >= 0.85) {
            affirmativeCount++;
          }
        }
        // Specific clues (fewer entities sharing them) provide better information
        const specificity = 1 / (affirmativeCount + 1);
        if (specificity > bestSpecificity) {
          bestSpecificity = specificity;
          bestQuestion = q;
        }
      }
    }

    let hint: ReverseHint;

    if (bestQuestion) {
      const statement = bestQuestion.text.replace(/^Is it /, "It is ").replace(/\?$/, "");
      hint = {
        hintType: "attribute",
        clueText: `It is definitely TRUE that: "${statement}".`,
        questionId: bestQuestion.id,
        questionText: bestQuestion.text,
        answerLabel: "Yes",
        penaltySteps
      };
      // Mark into history so the question appears as an answered clue
      session.history.push({
        step: session.history.length + 1,
        questionId: bestQuestion.id,
        questionText: `[Hint Clue] ${bestQuestion.text}`,
        answerLabel: "Yes",
        answerValue: 1.0
      });
      // Deduct 1 additional penalty question turn so total deduction is exactly penaltySteps (2 questions)
      session.penaltyQuestions += Math.max(0, penaltySteps - 1);
    } else if (secret.description && session.hints.length === 1) {
      const cleanDesc = secret.description.replace(new RegExp(secret.name, "gi"), "the secret item");
      hint = {
        hintType: "description",
        clueText: `Fact: "${cleanDesc}".`,
        penaltySteps
      };
      session.penaltyQuestions += penaltySteps;
    } else {
      const cleanName = secret.name.trim();
      const firstLetter = cleanName.charAt(0).toUpperCase();
      hint = {
        hintType: "first_letter",
        clueText: `Letter Clue: Begins with "${firstLetter}" and has ${cleanName.length} characters.`,
        penaltySteps
      };
      session.penaltyQuestions += penaltySteps;
    }

    session.hints.push(hint);

    const totalUsedAfter = session.history.length + session.penaltyQuestions;
    const questionsRemaining = Math.max(0, session.maxQuestions - totalUsedAfter);
    const hintsRemaining = Math.max(0, session.maxHints - session.hints.length);

    if (totalUsedAfter >= session.maxQuestions) {
      session.state = "lost";
      return {
        hint,
        penaltyQuestions: session.penaltyQuestions,
        questionsRemaining: 0,
        hintsRemaining,
        state: "lost",
        revealedEntity: {
          id: secret.id,
          name: secret.name,
          description: secret.description,
          imageUrl: secret.imageUrl,
          funFact: secret.funFact || getFunFactForEntity(secret.id, secret.name, secret.category, secret.description || undefined)
        }
      };
    }

    return {
      hint,
      penaltyQuestions: session.penaltyQuestions,
      questionsRemaining,
      hintsRemaining,
      state: session.state
    };
  }

  public async submitGuess(
    sessionId: string,
    guessTextOrId: string | number,
    storage: IStorage
  ): Promise<{
    correct: boolean;
    guessesRemaining: number;
    state: "in_progress" | "won" | "lost";
    revealedEntity?: { id: number; name: string; description: string | null; imageUrl: string | null; funFact?: string | null };
  }> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error("Session not found or expired.");
    }
    if (session.state !== "in_progress") {
      throw new Error(`Game already ended with state: ${session.state}`);
    }

    const secret = await storage.getEntity(session.secretEntityId);
    if (!secret) {
      throw new Error("Secret entity not found in storage.");
    }

    let isMatch = false;
    if (typeof guessTextOrId === "number") {
      isMatch = guessTextOrId === session.secretEntityId;
    } else {
      const cleanGuess = guessTextOrId.trim().toLowerCase();
      const cleanSecret = secret.name.trim().toLowerCase();
      isMatch = cleanGuess === cleanSecret;
    }

    if (isMatch) {
      session.state = "won";
      if (session.challengeCode) {
        friendChallengeService.recordChallengeCompletion(
          session.challengeCode,
          true,
          session.history.length + session.penaltyQuestions
        );
      }
      return {
        correct: true,
        guessesRemaining: session.maxGuesses - session.wrongGuesses.length,
        state: "won",
        revealedEntity: {
          id: secret.id,
          name: secret.name,
          description: secret.description,
          imageUrl: secret.imageUrl,
          funFact: secret.funFact || getFunFactForEntity(secret.id, secret.name, secret.category, secret.description || undefined)
        }
      };
    }

    // Wrong guess
    session.wrongGuesses.push(String(guessTextOrId));
    const guessesRemaining = Math.max(0, session.maxGuesses - session.wrongGuesses.length);

    if (session.wrongGuesses.length >= session.maxGuesses) {
      session.state = "lost";
      if (session.challengeCode) {
        friendChallengeService.recordChallengeCompletion(
          session.challengeCode,
          false,
          session.history.length + session.penaltyQuestions
        );
      }
      return {
        correct: false,
        guessesRemaining: 0,
        state: "lost",
        revealedEntity: {
          id: secret.id,
          name: secret.name,
          description: secret.description,
          imageUrl: secret.imageUrl,
          funFact: secret.funFact || getFunFactForEntity(secret.id, secret.name, secret.category, secret.description || undefined)
        }
      };
    }

    return {
      correct: false,
      guessesRemaining,
      state: "in_progress"
    };
  }
}

export const reverseGameService = new ReverseGameService();
