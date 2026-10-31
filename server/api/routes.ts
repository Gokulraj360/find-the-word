import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { IStorage } from "../db/types.js";
import { EngineMatrix } from "../engine/matrix.js";
import { BayesianEngine } from "../engine/bayes.js";
import { GameSessionManager } from "../engine/session.js";
import { LearningService } from "../engine/learning.js";

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
  domain: z.enum(["character", "object"]).optional()
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

      res.json({
        sessionId,
        domain: sessionManager.domain,
        state: sessionManager.state,
        question: curQ,
        guess: sessionManager.pendingGuess
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

      const sessionId = uuidv4();
      const sessionManager = new GameSessionManager(sessionId, matrix, engine, domain);
      const startResult = sessionManager.start();

      activeSessions.set(sessionId, {
        session: sessionManager,
        lastAccess: Date.now()
      });

      // Persist game session record to DB
      await storage.createGameSession(sessionId, domain);

      res.json({
        sessionId,
        domain,
        question: startResult.question
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

      res.json({
        state: outcome.state,
        question: outcome.question,
        guess: outcome.guess
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
        question: outcome.question
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
        closestWrongEntity: outcome.closestWrongEntity
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
