import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { IStorage } from "../db/types.js";
import { EngineMatrix } from "../engine/matrix.js";
import { BayesianEngine } from "../engine/bayes.js";
import { GameSessionManager } from "../engine/session.js";
import { LearningService } from "../engine/learning.js";
import { handleImageProxy, resolveWikipediaImage } from "../services/imageService.js";
import { computeDailyChallenge } from "../services/dailyChallengeService.js";
import { reverseGameService } from "../services/reverseGameService.js";
import { friendChallengeService } from "../services/friendChallengeService.js";
import { leaderboardService, LeaderboardCategory } from "../services/leaderboardService.js";
import { getFunFactForEntity } from "../services/funFactService.js";
import { quizService } from "../services/quizService.js";
import { getAvailableCategoryPacks, CategoryPackId } from "../services/categoryPackService.js";
import { getCognitorDialogue } from "../services/personalityService.js";

const JWT_SECRET = process.env.JWT_SECRET || "cognitor-secret-jwt-key";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "adminpassword123";

// Simple in-memory session cache with TTL
interface CachedSession {
  session: GameSessionManager;
  lastAccess: number;
}
const activeSessions: Map<string, CachedSession> = new Map();
const SESSION_TTL_MS = 60 * 60 * 1000; // 1 hour

// Periodically clean up stale sessions
setInterval(() => {
  const now = Date.now();
  for (const [id, entry] of activeSessions.entries()) {
    if (now - entry.lastAccess > SESSION_TTL_MS) {
      activeSessions.delete(id);
    }
  }
}, 5 * 60 * 1000);

// Simple IP Rate Limiter
const ipRequestCounts: Map<string, { count: number; resetTime: number }> = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 120; // 120 req/min

export function rateLimiter(req: Request, res: Response, next: NextFunction) {
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  const now = Date.now();
  const entry = ipRequestCounts.get(ip);

  if (!entry || now > entry.resetTime) {
    ipRequestCounts.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return next();
  }

  entry.count++;
  if (entry.count > MAX_REQUESTS_PER_WINDOW) {
    return res.status(429).json({ error: "Too many requests. Please try again shortly." });
  }

  next();
}

// Admin JWT Authentication Middleware
export function authenticateAdmin(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: Missing or invalid token." });
  }

  const token = authHeader.split(" ")[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    (req as any).admin = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Unauthorized: Invalid or expired token." });
  }
}

// Zod validation schemas
const StartSchema = z.object({
  domain: z.enum(["character", "object"]).optional(),
  difficulty: z.enum(["easy", "hard", "expert"]).optional(),
  categoryPack: z.enum(["all", "sports", "electronics", "food", "animals"]).optional()
});

const AnswerSchema = z.object({
  sessionId: z.string().uuid(),
  answer: z.number().refine((val) => [1.0, 0.75, 0.5, 0.25, 0.0].includes(val), {
    message: "Answer must be one of: 1.0 (Yes), 0.75 (Probably), 0.5 (Unknown), 0.25 (Probably not), 0.0 (No)"
  })
});

const ConfirmSchema = z.object({
  sessionId: z.string().uuid(),
  correct: z.boolean(),
  entityId: z.number().int().positive()
});

const LearnSchema = z.object({
  sessionId: z.string().uuid(),
  entityName: z.string().min(1).max(120),
  questionText: z.string().min(3).max(250),
  answer: z.number().refine((val) => [1.0, 0.75, 0.5, 0.25, 0.0].includes(val))
});

const AdminLoginSchema = z.object({
  password: z.string()
});

const ReverseStartSchema = z.object({
  domain: z.enum(["character", "object"]).optional()
});

const ReverseAskSchema = z.object({
  sessionId: z.string().uuid(),
  questionId: z.number().int().positive()
});

const ReverseGuessSchema = z.object({
  sessionId: z.string().uuid(),
  guess: z.union([z.string().min(1), z.number().int().positive()])
});

const ReverseHintSchema = z.object({
  sessionId: z.string().uuid()
});

const CreateChallengeSchema = z.object({
  domain: z.enum(["character", "object"]),
  entityId: z.number().int().positive(),
  creatorName: z.string().min(1).max(30).optional()
});

const SubmitLeaderboardSchema = z.object({
  playerName: z.string().min(1).max(30),
  category: z.enum(["fastest_guess", "best_streak", "stumped", "daily"]),
  score: z.number().int().positive(),
  entityName: z.string().max(60).optional(),
  domain: z.enum(["character", "object"]).optional(),
  difficulty: z.enum(["easy", "hard", "expert"]).optional()
});

const QuizStartSchema = z.object({
  domain: z.enum(["all", "character", "object"]).optional(),
  length: z.number().int().min(3).max(10).optional()
});

const QuizAnswerSchema = z.object({
  sessionId: z.string().uuid(),
  questionIndex: z.number().int().min(0),
  selectedEntityId: z.number().int().positive()
});

export function createApiRouter(
  storage: IStorage,
  matrix: EngineMatrix,
  engine: BayesianEngine,
  learning: LearningService
): Router {
  const router = Router();

  // Helper to fetch or auto-rehydrate active session
  async function getSession(sessionId: string): Promise<GameSessionManager> {
    const cached = activeSessions.get(sessionId);
    if (cached) {
      cached.lastAccess = Date.now();
      return cached.session;
    }

    // Auto-rehydrate from storage / database (resilient to serverless and restarts)
    const sessionRecord = await storage.getGameSession(sessionId);
    if (!sessionRecord) {
      throw new Error(`Session ${sessionId} not found. Please start a new game.`);
    }

    const domain = (sessionRecord.domain as "character" | "object") || "character";
    const answers = await storage.getGameAnswers(sessionId);
    const sessionManager = new GameSessionManager(sessionId, matrix, engine, domain);
    sessionManager.start();

    for (const ans of answers) {
      sessionManager.answer(ans.answerValue);
    }

    activeSessions.set(sessionId, {
      session: sessionManager,
      lastAccess: Date.now()
    });

    return sessionManager;
  }

  // ---------------------------------------------------------------------------
  // PUBLIC IMAGE & MEDIA PROXY ROUTES
  // ---------------------------------------------------------------------------

  /**
   * GET /api/image-proxy?url=...
   * Proxies upstream images to prevent 403 hotlink blocks and CORS errors.
   */
  router.get("/image-proxy", handleImageProxy);

  /**
   * GET /api/entity-image?name=...
   * Resolves entity thumbnail and description from Wikipedia dynamically.
   */
  router.get("/entity-image", async (req: Request, res: Response) => {
    const name = req.query.name as string;
    if (!name) {
      return res.status(400).json({ error: "Query parameter 'name' is required." });
    }
    const info = await resolveWikipediaImage(name);
    res.json(info);
  });

  // ---------------------------------------------------------------------------
  // PUBLIC GAME ROUTES
  // ---------------------------------------------------------------------------

  /**
   * GET /api/game/state/:sessionId
   * Restores an active game session on browser refresh
   */
  router.get("/game/state/:sessionId", rateLimiter, async (req: Request, res: Response) => {
    try {
      const sessionId = req.params.sessionId;
      const sessionManager = await getSession(sessionId);
      const curQ =
        sessionManager.currentQuestionIdx !== null
          ? {
              id: matrix.questions[sessionManager.currentQuestionIdx].id,
              text: matrix.questions[sessionManager.currentQuestionIdx].text,
              step: sessionManager.stepCount + 1
            }
          : null;

      const dialogue = getCognitorDialogue({
        step: sessionManager.stepCount + 1,
        certainty: sessionManager.currentCertainty,
        state: sessionManager.state,
        maxQuestions: sessionManager.hardQuestionLimit,
        rejectedGuessesCount: sessionManager.guesses.filter((g) => !g.accepted).length,
        seedKey: sessionId
      });

      res.json({
        sessionId,
        domain: sessionManager.domain,
        difficulty: sessionManager.difficulty,
        categoryPack: sessionManager.categoryPack,
        maxQuestions: sessionManager.hardQuestionLimit,
        state: sessionManager.state,
        question: curQ,
        guess: sessionManager.pendingGuess,
        certainty: sessionManager.currentCertainty,
        dialogue,
        history: sessionManager.getAnswerSummary()
      });
    } catch (err: any) {
      res.status(404).json({ error: err.message });
    }
  });

  /**
   * POST /api/game/start
   * Starts a new game session and returns the first question.
   */
  router.post("/game/start", rateLimiter, async (req: Request, res: Response) => {
    try {
      const parsed = StartSchema.safeParse(req.body);
      const domain = parsed.success && parsed.data?.domain ? parsed.data.domain : "character";
      const difficulty = parsed.success && parsed.data?.difficulty ? parsed.data.difficulty : "easy";
      const categoryPack = parsed.success && parsed.data?.categoryPack ? parsed.data.categoryPack : "all";

      const sessionId = uuidv4();
      const sessionManager = new GameSessionManager(
        sessionId,
        matrix,
        engine,
        domain,
        difficulty,
        categoryPack
      );
      const startResult = sessionManager.start();

      activeSessions.set(sessionId, {
        session: sessionManager,
        lastAccess: Date.now()
      });

      // Persist game session record to DB
      await storage.createGameSession(sessionId, domain);

      const dialogue = getCognitorDialogue({
        step: 1,
        certainty: sessionManager.currentCertainty,
        state: "in_progress",
        maxQuestions: sessionManager.hardQuestionLimit,
        seedKey: sessionId
      });

      res.json({
        sessionId,
        domain,
        difficulty,
        categoryPack: sessionManager.categoryPack,
        maxQuestions: sessionManager.hardQuestionLimit,
        question: startResult.question,
        certainty: sessionManager.currentCertainty,
        dialogue,
        history: sessionManager.getAnswerSummary()
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  /**
   * POST /api/game/answer
   * Submits an answer to the current question and returns the next question or a guess.
   */
  router.post("/game/answer", rateLimiter, async (req: Request, res: Response) => {
    try {
      const parsed = AnswerSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.issues[0].message });
      }

      const { sessionId, answer } = parsed.data;
      const sessionManager = await getSession(sessionId);

      // Record answer to DB
      if (sessionManager.currentQuestionIdx !== null) {
        const qId = matrix.questions[sessionManager.currentQuestionIdx].id;
        await storage.recordGameAnswer(sessionId, qId, answer, sessionManager.stepCount + 1);
      }

      const outcome = sessionManager.answer(answer);

      const dialogue = getCognitorDialogue({
        step: sessionManager.stepCount + 1,
        certainty: sessionManager.currentCertainty,
        state: outcome.state,
        maxQuestions: sessionManager.hardQuestionLimit,
        rejectedGuessesCount: sessionManager.guesses.filter((g) => !g.accepted).length,
        seedKey: sessionId
      });

      res.json({
        state: outcome.state,
        question: outcome.question,
        guess: outcome.guess,
        certainty: sessionManager.currentCertainty,
        dialogue,
        history: sessionManager.getAnswerSummary()
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  /**
   * POST /api/game/back
   * Undoes the last answered question and recomputes posterior.
   */
  router.post("/game/back", rateLimiter, async (req: Request, res: Response) => {
    try {
      const sessionId = req.body.sessionId;
      if (!sessionId) {
        return res.status(400).json({ error: "sessionId is required." });
      }

      const sessionManager = await getSession(sessionId);
      const outcome = sessionManager.undo();

      res.json({
        state: sessionManager.state,
        question: outcome.question,
        certainty: sessionManager.currentCertainty,
        history: sessionManager.getAnswerSummary()
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  /**
   * POST /api/game/confirm
   * Confirms or rejects a proposed guess.
   */
  router.post("/game/confirm", rateLimiter, async (req: Request, res: Response) => {
    try {
      const parsed = ConfirmSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.issues[0].message });
      }

      const { sessionId, correct, entityId } = parsed.data;
      const sessionManager = await getSession(sessionId);

      // Record guess to DB
      await storage.recordGuess(sessionId, entityId, sessionManager.stepCount, correct);

      const outcome = sessionManager.confirmGuess(correct);

      if (correct) {
        // Confirmed WIN -> Trigger Learning Loop
        await learning.handleWin(sessionId, entityId, sessionManager.history);
      }

      res.json({
        state: outcome.state,
        question: outcome.question,
        guess: outcome.guess,
        closestWrongEntity: outcome.closestWrongEntity,
        certainty: sessionManager.currentCertainty,
        history: sessionManager.getAnswerSummary()
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  /**
   * POST /api/game/learn
   * Submitted when the engine loses and the user teaches it the character.
   */
  router.post("/game/learn", rateLimiter, async (req: Request, res: Response) => {
    try {
      const parsed = LearnSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.issues[0].message });
      }

      const { sessionId, entityName, questionText, answer } = parsed.data;
      const sessionManager = await getSession(sessionId);

      const closestWrongId = sessionManager.guesses.length > 0
        ? sessionManager.guesses[sessionManager.guesses.length - 1].entityId
        : undefined;

      const subResult = await learning.handleLossWithSubmission(
        sessionId,
        entityName,
        questionText,
        answer,
        sessionManager.history,
        closestWrongId,
        sessionManager.domain
      );

      res.json({
        success: true,
        submissionId: subResult.submissionId,
        message: "Thank you! Your character and question have been submitted to moderation."
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  /**
   * GET /api/stats
   * Global gameplay & dataset statistics.
   */
  router.get("/stats", rateLimiter, async (_req: Request, res: Response) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  /**
   * GET /api/daily
   * Returns deterministic daily challenge secret entity and metadata for the day.
   */
  router.get("/daily", rateLimiter, async (req: Request, res: Response) => {
    try {
      const activeEntities = await storage.getActiveEntities();
      const date = typeof req.query.date === "string" ? req.query.date : undefined;
      const daily = computeDailyChallenge(activeEntities, date);
      res.json(daily);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ---------------------------------------------------------------------------
  // ROLE REVERSAL ROUTES ("YOU GUESS, COGNITOR ANSWERS")
  // ---------------------------------------------------------------------------

  /**
   * POST /api/reverse/start
   */
  router.post("/reverse/start", rateLimiter, async (req: Request, res: Response) => {
    try {
      const parsed = ReverseStartSchema.safeParse(req.body);
      const domain = parsed.success && parsed.data.domain ? parsed.data.domain : "character";
      const result = await reverseGameService.startSession(storage, domain);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  /**
   * POST /api/reverse/ask
   */
  router.post("/reverse/ask", rateLimiter, async (req: Request, res: Response) => {
    try {
      const parsed = ReverseAskSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.issues[0].message });
      }
      const { sessionId, questionId } = parsed.data;
      const result = await reverseGameService.askQuestion(sessionId, questionId, matrix, storage);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  /**
   * POST /api/reverse/guess
   */
  router.post("/reverse/guess", rateLimiter, async (req: Request, res: Response) => {
    try {
      const parsed = ReverseGuessSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.issues[0].message });
      }
      const { sessionId, guess } = parsed.data;
      const result = await reverseGameService.submitGuess(sessionId, guess, storage);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  /**
   * POST /api/reverse/hint
   */
  router.post("/reverse/hint", rateLimiter, async (req: Request, res: Response) => {
    try {
      const parsed = ReverseHintSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.issues[0].message });
      }
      const { sessionId } = parsed.data;
      const result = await reverseGameService.requestHint(sessionId, matrix, storage);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  /**
   * GET /api/reverse/state/:sessionId
   */
  router.get("/reverse/state/:sessionId", rateLimiter, async (req: Request, res: Response) => {
    try {
      const session = reverseGameService.getSession(req.params.sessionId);
      if (!session) {
        return res.status(404).json({ error: "Session not found." });
      }
      const secret = session.state !== "in_progress"
        ? await storage.getEntity(session.secretEntityId)
        : null;

      res.json({
        sessionId: session.sessionId,
        domain: session.domain,
        state: session.state,
        history: session.history,
        wrongGuesses: session.wrongGuesses,
        hints: session.hints,
        penaltyQuestions: session.penaltyQuestions,
        maxQuestions: session.maxQuestions,
        maxGuesses: session.maxGuesses,
        maxHints: session.maxHints,
        questionsRemaining: Math.max(
          0,
          session.maxQuestions - (session.history.length + session.penaltyQuestions)
        ),
        revealedEntity: secret
          ? {
              id: secret.id,
              name: secret.name,
              description: secret.description,
              imageUrl: secret.imageUrl,
              funFact: secret.funFact || getFunFactForEntity(secret.id, secret.name, secret.category, secret.description || undefined)
            }
          : undefined
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  /**
   * GET /api/reverse/questions
   */
  router.get("/reverse/questions", rateLimiter, async (req: Request, res: Response) => {
    try {
      const domain = req.query.domain as "character" | "object" | undefined;
      const allQ = await storage.getActiveQuestions();
      const filtered = domain
        ? allQ.filter((q) => !q.category || q.category === "common" || q.category === domain)
        : allQ;
      res.json(filtered.map((q) => ({ id: q.id, text: q.text, category: q.category })));
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  /**
   * GET /api/reverse/entities
   */
  router.get("/reverse/entities", rateLimiter, async (req: Request, res: Response) => {
    try {
      const domain = req.query.domain as "character" | "object" | undefined;
      const allE = await storage.getActiveEntities();
      const filtered = domain ? allE.filter((e) => e.category === domain) : allE;
      res.json(filtered.map((e) => ({ id: e.id, name: e.name, description: e.description })));
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ---------------------------------------------------------------------------
  // CHALLENGE A FRIEND ROUTES
  // ---------------------------------------------------------------------------

  /**
   * POST /api/challenge/create
   * Friend A picks a secret item and generates a shareable challenge code/link.
   */
  router.post("/challenge/create", rateLimiter, async (req: Request, res: Response) => {
    try {
      const parsed = CreateChallengeSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.issues[0].message });
      }
      const { domain, entityId, creatorName } = parsed.data;
      const challenge = await friendChallengeService.createChallenge(
        storage,
        domain,
        entityId,
        creatorName
      );
      res.json({
        code: challenge.code,
        creatorName: challenge.creatorName,
        domain: challenge.domain,
        createdAt: challenge.createdAt
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  /**
   * GET /api/challenge/:code
   * Friend B inspects challenge details without revealing the secret item.
   */
  router.get("/challenge/:code", rateLimiter, (req: Request, res: Response) => {
    try {
      const safe = friendChallengeService.getChallenge(req.params.code, false);
      if (!safe) {
        return res.status(404).json({ error: "Challenge not found or expired." });
      }
      res.json(safe);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  /**
   * POST /api/challenge/:code/start
   * Starts a reverse deduction game initialized with Friend A's secret entity.
   */
  router.post("/challenge/:code/start", rateLimiter, async (req: Request, res: Response) => {
    try {
      const challenge = friendChallengeService.getRawChallenge(req.params.code);
      if (!challenge) {
        return res.status(404).json({ error: "Challenge not found or expired." });
      }

      const session = await reverseGameService.startSession(
        storage,
        challenge.domain,
        challenge.secretEntityId,
        challenge.code
      );

      res.json({
        sessionId: session.sessionId,
        domain: session.domain,
        maxQuestions: session.maxQuestions,
        maxGuesses: session.maxGuesses,
        maxHints: session.maxHints,
        challengeCode: challenge.code,
        creatorName: challenge.creatorName
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // ---------------------------------------------------------------------------
  // LEADERBOARD ROUTES
  // ---------------------------------------------------------------------------

  /**
   * GET /api/leaderboard
   */
  router.get("/leaderboard", rateLimiter, (req: Request, res: Response) => {
    try {
      const category = (req.query.category as LeaderboardCategory) || "fastest_guess";
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 25;
      const entries = leaderboardService.getLeaderboard(category, limit);
      const summary = leaderboardService.getSummaryStats();
      res.json({ entries, summary });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  /**
   * POST /api/leaderboard/submit
   */
  router.post("/leaderboard/submit", rateLimiter, (req: Request, res: Response) => {
    try {
      const parsed = SubmitLeaderboardSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.issues[0].message });
      }
      const entry = leaderboardService.submitEntry(parsed.data);
      res.json({ success: true, entry });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  /**
   * GET /api/entity/:id/fun-fact
   * Returns curated or synthesized fun fact for an entity.
   */
  router.get("/entity/:id/fun-fact", rateLimiter, async (req: Request, res: Response) => {
    try {
      const entityId = parseInt(req.params.id, 10);
      if (isNaN(entityId)) {
        return res.status(400).json({ error: "Invalid entity ID." });
      }
      const entity = await storage.getEntity(entityId);
      if (!entity) {
        return res.status(404).json({ error: "Entity not found." });
      }
      const funFact = entity.funFact || getFunFactForEntity(entity.id, entity.name, entity.category, entity.description || undefined);
      res.json({
        entityId: entity.id,
        name: entity.name,
        funFact
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ---------------------------------------------------------------------------
  // QUICK QUIZ MODE ROUTES
  // ---------------------------------------------------------------------------

  /**
   * POST /api/quiz/start
   */
  router.post("/quiz/start", rateLimiter, async (req: Request, res: Response) => {
    try {
      const parsed = QuizStartSchema.safeParse(req.body);
      const domain = parsed.success && parsed.data.domain ? parsed.data.domain : "all";
      const length = parsed.success && parsed.data.length ? parsed.data.length : 5;
      const result = await quizService.startQuiz(matrix, storage, domain, length);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  /**
   * POST /api/quiz/answer
   */
  router.post("/quiz/answer", rateLimiter, (req: Request, res: Response) => {
    try {
      const parsed = QuizAnswerSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.issues[0].message });
      }
      const { sessionId, questionIndex, selectedEntityId } = parsed.data;
      const result = quizService.answerQuestion(sessionId, questionIndex, selectedEntityId);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  /**
   * GET /api/quiz/state/:sessionId
   */
  router.get("/quiz/state/:sessionId", rateLimiter, (req: Request, res: Response) => {
    try {
      const session = quizService.getSession(req.params.sessionId);
      if (!session) {
        return res.status(404).json({ error: "Quiz session not found." });
      }
      res.json({
        sessionId: session.sessionId,
        domain: session.domain,
        totalQuestions: session.totalQuestions,
        currentQuestionIndex: session.currentQuestionIndex,
        score: session.score,
        isFinished: session.isFinished
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  /**
   * GET /api/packs
   * Returns metadata and item counts for available thematic category packs.
   */
  router.get("/packs", rateLimiter, (_req: Request, res: Response) => {
    try {
      const packs = getAvailableCategoryPacks(matrix);
      res.json({ packs });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ---------------------------------------------------------------------------
  // ADMIN ROUTES (JWT PROTECTED)
  // ---------------------------------------------------------------------------

  /**
   * POST /api/admin/login
   */
  router.post("/admin/login", rateLimiter, (req: Request, res: Response) => {
    const parsed = AdminLoginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Password required." });
    }

    if (parsed.data.password !== ADMIN_PASSWORD) {
      return res.status(401).json({ error: "Invalid admin password." });
    }

    const token = jwt.sign({ role: "admin" }, JWT_SECRET, { expiresIn: "24h" });
    res.json({ token });
  });

  /**
   * GET /api/admin/submissions
   */
  router.get("/admin/submissions", authenticateAdmin, async (req: Request, res: Response) => {
    try {
      const status = req.query.status as any;
      const list = await storage.getSubmissions(status);
      res.json(list);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  /**
   * POST /api/admin/submissions/:id/approve
   */
  router.post("/admin/submissions/:id/approve", authenticateAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      await learning.approveSubmission(id);
      res.json({ success: true, message: `Submission ${id} approved and matrix reloaded.` });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  /**
   * POST /api/admin/submissions/:id/reject
   */
  router.post("/admin/submissions/:id/reject", authenticateAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      await learning.rejectSubmission(id);
      res.json({ success: true, message: `Submission ${id} rejected.` });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  /**
   * GET /api/admin/entities
   */
  router.get("/admin/entities", authenticateAdmin, async (_req: Request, res: Response) => {
    try {
      const list = await storage.getAllEntities();
      res.json(list);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  /**
   * POST /api/admin/entities
   */
  router.post("/admin/entities", authenticateAdmin, async (req: Request, res: Response) => {
    try {
      const entity = await storage.createEntity(req.body);
      await matrix.load(storage);
      res.json(entity);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  /**
   * PUT /api/admin/entities/:id
   */
  router.put("/admin/entities/:id", authenticateAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const updated = await storage.updateEntity(id, req.body);
      await matrix.load(storage);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  /**
   * GET /api/admin/questions
   */
  router.get("/admin/questions", authenticateAdmin, async (_req: Request, res: Response) => {
    try {
      const list = await storage.getAllQuestions();
      res.json(list);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  /**
   * POST /api/admin/questions
   */
  router.post("/admin/questions", authenticateAdmin, async (req: Request, res: Response) => {
    try {
      const q = await storage.createQuestion(req.body);
      await matrix.load(storage);
      res.json(q);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  /**
   * PUT /api/admin/questions/:id
   */
  router.put("/admin/questions/:id", authenticateAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const updated = await storage.updateQuestion(id, req.body);
      await matrix.load(storage);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  /**
   * POST /api/admin/reload
   */
  router.post("/admin/reload", authenticateAdmin, async (_req: Request, res: Response) => {
    try {
      await matrix.load(storage);
      res.json({
        success: true,
        message: "Matrix reloaded successfully.",
        entitiesCount: matrix.numEntities,
        questionsCount: matrix.numQuestions
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}
