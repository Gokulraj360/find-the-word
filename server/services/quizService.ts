import { v4 as uuidv4 } from "uuid";
import { EngineMatrix } from "../engine/matrix.js";
import { IStorage, EntityRecord } from "../db/types.js";
import { CURATED_FUN_FACTS } from "./funFactService.js";

export type QuizQuestionType = "visual_id" | "trait_match" | "fun_fact";

export interface QuizOption {
  entityId: number;
  name: string;
  imageUrl: string | null;
  category: "character" | "object";
}

export interface QuizQuestion {
  id: string;
  questionType: QuizQuestionType;
  prompt: string;
  subPrompt?: string;
  targetEntityId: number;
  targetEntityName: string;
  targetImageUrl?: string | null;
  options: QuizOption[];
  explanation: string;
}

export interface QuizSession {
  sessionId: string;
  domain: "all" | "character" | "object";
  totalQuestions: number;
  currentQuestionIndex: number;
  score: number;
  questions: QuizQuestion[];
  userAnswers: {
    questionIndex: number;
    selectedEntityId: number;
    correct: boolean;
  }[];
  isFinished: boolean;
  createdAt: number;
}

export class QuizService {
  private sessions: Map<string, QuizSession> = new Map();
  private readonly TTL_MS = 60 * 60 * 1000; // 1 hour

  constructor() {
    setInterval(() => this.cleanupStaleSessions(), 15 * 60 * 1000);
  }

  private cleanupStaleSessions() {
    const now = Date.now();
    for (const [id, session] of this.sessions.entries()) {
      if (now - session.createdAt > this.TTL_MS) {
        this.sessions.delete(id);
      }
    }
  }

  public async startQuiz(
    matrix: EngineMatrix,
    storage: IStorage,
    domain: "all" | "character" | "object" = "all",
    quizLength: number = 5
  ): Promise<{
    sessionId: string;
    totalQuestions: number;
    question: Omit<QuizQuestion, "targetEntityId" | "targetEntityName" | "explanation">;
  }> {
    const activeEntities = await storage.getActiveEntities();
    let candidates = activeEntities.filter((e) => e.status === "active");

    if (domain === "character") {
      candidates = candidates.filter((e) => e.category !== "object");
    } else if (domain === "object") {
      candidates = candidates.filter((e) => e.category === "object");
    }

    if (candidates.length < 4) {
      throw new Error("Insufficient active entities to generate a quiz.");
    }

    const numQuestions = Math.min(Math.max(3, quizLength), 10);
    const questions: QuizQuestion[] = [];

    // Shuffle candidate pool
    const shuffledPool = [...candidates].sort(() => 0.5 - Math.random());

    for (let i = 0; i < numQuestions; i++) {
      const targetEntity = shuffledPool[i % shuffledPool.length];
      const q = this.buildQuestion(targetEntity, candidates, matrix);
      questions.push(q);
    }

    const sessionId = uuidv4();
    const session: QuizSession = {
      sessionId,
      domain,
      totalQuestions: questions.length,
      currentQuestionIndex: 0,
      score: 0,
      questions,
      userAnswers: [],
      isFinished: false,
      createdAt: Date.now()
    };

    this.sessions.set(sessionId, session);

    return {
      sessionId,
      totalQuestions: session.totalQuestions,
      question: this.sanitizeQuestion(questions[0])
    };
  }

  private buildQuestion(
    target: EntityRecord,
    pool: EntityRecord[],
    matrix: EngineMatrix
  ): QuizQuestion {
    // Pick question type
    const types: QuizQuestionType[] = ["visual_id", "trait_match"];
    if (CURATED_FUN_FACTS[target.id]) {
      types.push("fun_fact");
    }
    const selectedType = types[Math.floor(Math.random() * types.length)];

    // Select 3 unique distractors from the pool
    const distractorCandidates = pool.filter((e) => e.id !== target.id);
    const shuffledDistractors = [...distractorCandidates].sort(() => 0.5 - Math.random());
    const chosenDistractors = shuffledDistractors.slice(0, 3);

    // Combine and shuffle options
    const allOptionsRaw = [target, ...chosenDistractors];
    const shuffledOptions = [...allOptionsRaw].sort(() => 0.5 - Math.random());

    const options: QuizOption[] = shuffledOptions.map((e) => ({
      entityId: e.id,
      name: e.name,
      imageUrl: e.imageUrl || null,
      category: e.category === "object" ? "object" : "character"
    }));

    let prompt = `Which of these is a ${target.name}?`;
    let subPrompt: string | undefined = undefined;
    let explanation = `${target.name}: ${target.description || "A notable item in Cognitor's knowledge base."}`;

    if (selectedType === "fun_fact" && CURATED_FUN_FACTS[target.id]) {
      const fact = CURATED_FUN_FACTS[target.id];
      // Mask target name in fact if it appears verbatim
      const maskedFact = fact.replace(new RegExp(target.name, "gi"), "This entity");
      prompt = "Which figure or item matches this fascinating fact?";
      subPrompt = `"${maskedFact}"`;
      explanation = `Correct! ${target.name}: ${fact}`;
    } else if (selectedType === "trait_match") {
      // Find a high-confidence distinguishing question for target
      const targetIdx = matrix.entityIdToIndex.get(target.id);
      let traitQuestionText: string | null = null;

      if (targetIdx !== undefined) {
        const potentialQs: { text: string; p: number }[] = [];
        for (let qIdx = 0; qIdx < matrix.numQuestions; qIdx++) {
          const p = matrix.getPYes(targetIdx, qIdx);
          const conf = matrix.getConfidence(targetIdx, qIdx);
          if (p >= 0.88 && conf >= 2.0) {
            const qMeta = matrix.questions[qIdx];
            if (qMeta.isActive && !qMeta.text.toLowerCase().includes(target.name.toLowerCase())) {
              potentialQs.push({ text: qMeta.text, p });
            }
          }
        }
        if (potentialQs.length > 0) {
          const chosen = potentialQs[Math.floor(Math.random() * potentialQs.length)];
          traitQuestionText = chosen.text;
        }
      }

      if (traitQuestionText) {
        prompt = "Which of the following answers YES to this question?";
        subPrompt = `"${traitQuestionText}"`;
        explanation = `Yes! ${target.name} matches: "${traitQuestionText}".`;
      } else {
        // Fallback to visual id
        prompt = `Which of these is ${target.name}?`;
        if (target.description) {
          subPrompt = target.description;
        }
      }
    } else {
      // Visual ID
      prompt = `Which of these is ${target.name}?`;
      if (target.description) {
        subPrompt = target.description;
      }
    }

    return {
      id: uuidv4(),
      questionType: selectedType,
      prompt,
      subPrompt,
      targetEntityId: target.id,
      targetEntityName: target.name,
      targetImageUrl: target.imageUrl || null,
      options,
      explanation
    };
  }

  public answerQuestion(
    sessionId: string,
    questionIndex: number,
    selectedEntityId: number
  ): {
    correct: boolean;
    correctEntityId: number;
    explanation: string;
    currentScore: number;
    totalQuestions: number;
    isFinished: boolean;
    nextQuestion: Omit<QuizQuestion, "targetEntityId" | "targetEntityName" | "explanation"> | null;
  } {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error("Quiz session not found or expired.");
    }

    if (session.isFinished) {
      throw new Error("This quiz has already ended.");
    }

    if (questionIndex !== session.currentQuestionIndex) {
      throw new Error(`Invalid question index. Expected: ${session.currentQuestionIndex}`);
    }

    const currentQ = session.questions[questionIndex];
    const isCorrect = currentQ.targetEntityId === selectedEntityId;

    if (isCorrect) {
      session.score += 1;
    }

    session.userAnswers.push({
      questionIndex,
      selectedEntityId,
      correct: isCorrect
    });

    session.currentQuestionIndex += 1;
    const isFinished = session.currentQuestionIndex >= session.totalQuestions;
    session.isFinished = isFinished;

    const nextQ = !isFinished ? this.sanitizeQuestion(session.questions[session.currentQuestionIndex]) : null;

    return {
      correct: isCorrect,
      correctEntityId: currentQ.targetEntityId,
      explanation: currentQ.explanation,
      currentScore: session.score,
      totalQuestions: session.totalQuestions,
      isFinished,
      nextQuestion: nextQ
    };
  }

  public getSession(sessionId: string): QuizSession | null {
    return this.sessions.get(sessionId) || null;
  }

  private sanitizeQuestion(
    q: QuizQuestion
  ): Omit<QuizQuestion, "targetEntityId" | "targetEntityName" | "explanation"> {
    return {
      id: q.id,
      questionType: q.questionType,
      prompt: q.prompt,
      subPrompt: q.subPrompt,
      targetImageUrl: q.targetImageUrl,
      options: q.options
    };
  }
}

export const quizService = new QuizService();
