import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";
import {
  EntityAnswerRecord,
  EntityRecord,
  GameAnswerRecord,
  GameSessionRecord,
  GuessRecord,
  IStorage,
  QuestionRecord,
  SubmissionRecord
} from "./types.js";
import {
  SEED_ENTITIES,
  SEED_GROUND_TRUTH,
  SEED_QUESTIONS,
  groundTruthToWeights
} from "../../scripts/data/seed_small_data.js";

export class InMemoryStorage implements IStorage {
  name = "InMemoryStorage";
  private entities: Map<number, EntityRecord> = new Map();
  private questions: Map<number, QuestionRecord> = new Map();
  // key: "entityId:questionId"
  private entityAnswers: Map<string, EntityAnswerRecord> = new Map();
  private gameSessions: Map<string, GameSessionRecord> = new Map();
  private gameAnswers: GameAnswerRecord[] = [];
  private guesses: GuessRecord[] = [];
  private submissions: Map<number, SubmissionRecord> = new Map();

  private entityIdCounter = 1;
  private questionIdCounter = 1;
  private submissionIdCounter = 1;
  private gameAnswerIdCounter = 1;
  private guessIdCounter = 1;

  private persistenceFilePath: string | null = null;

  constructor(persistenceFilePath?: string) {
    if (persistenceFilePath) {
      this.persistenceFilePath = persistenceFilePath;
    }
  }

  async init(): Promise<void> {
    if (this.persistenceFilePath && fs.existsSync(this.persistenceFilePath)) {
      try {
        const raw = fs.readFileSync(this.persistenceFilePath, "utf8");
        const data = JSON.parse(raw);
        this.loadFromDump(data);
        return;
      } catch (err) {
        console.warn("[InMemoryStorage] Failed to load snapshot, using seed data:", err);
      }
    }
    this.seedDefaults();
  }

  private seedDefaults(): void {
    // Populate with 50 entities & 40 questions
    for (const e of SEED_ENTITIES) {
      this.entities.set(e.id, {
        ...e,
        createdAt: new Date()
      });
      if (e.id >= this.entityIdCounter) {
        this.entityIdCounter = e.id + 1;
      }
    }

    for (const q of SEED_QUESTIONS) {
      this.questions.set(q.id, {
        ...q
      });
      if (q.id >= this.questionIdCounter) {
        this.questionIdCounter = q.id + 1;
      }
    }

    for (const [entityIdStr, answers] of Object.entries(SEED_GROUND_TRUTH)) {
      const entityId = Number(entityIdStr);
      for (const [questionIdStr, val] of Object.entries(answers)) {
        const questionId = Number(questionIdStr);
        const w = groundTruthToWeights(val);
        const key = `${entityId}:${questionId}`;
        this.entityAnswers.set(key, {
          entityId,
          questionId,
          ...w
        });
      }
    }
  }

  private saveTimeout: NodeJS.Timeout | null = null;

  private saveSnapshot(): void {
    if (!this.persistenceFilePath) return;
    if (process.env.VERCEL) return; // Read-only filesystem on Vercel

    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }

    // Debounced asynchronous file write to prevent event-loop blocking
    this.saveTimeout = setTimeout(() => {
      try {
        const dir = path.dirname(this.persistenceFilePath!);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        const data = {
          entities: Array.from(this.entities.values()),
          questions: Array.from(this.questions.values()),
          entityAnswers: Array.from(this.entityAnswers.values()),
          submissions: Array.from(this.submissions.values()),
          entityIdCounter: this.entityIdCounter,
          questionIdCounter: this.questionIdCounter,
          submissionIdCounter: this.submissionIdCounter
        };
        fs.promises
          .writeFile(this.persistenceFilePath!, JSON.stringify(data, null, 2), "utf8")
          .catch((err) => {
            console.warn("[InMemoryStorage] Failed to save snapshot asynchronously:", err.message);
          });
      } catch (err: any) {
        console.warn("[InMemoryStorage] Snapshot schedule error:", err.message);
      }
    }, 150);
  }

  private loadFromDump(data: any): void {
    this.entities.clear();
    this.questions.clear();
    this.entityAnswers.clear();
    this.submissions.clear();

    for (const e of data.entities || []) {
      this.entities.set(e.id, { ...e, createdAt: new Date(e.createdAt) });
    }
    for (const q of data.questions || []) {
      this.questions.set(q.id, { ...q });
    }
    for (const ea of data.entityAnswers || []) {
      this.entityAnswers.set(`${ea.entityId}:${ea.questionId}`, { ...ea });
    }
    for (const s of data.submissions || []) {
      this.submissions.set(s.id, { ...s, createdAt: new Date(s.createdAt) });
    }
    this.entityIdCounter = data.entityIdCounter || this.entities.size + 1;
    this.questionIdCounter = data.questionIdCounter || this.questions.size + 1;
    this.submissionIdCounter = data.submissionIdCounter || this.submissions.size + 1;
  }

  async getActiveEntities(): Promise<EntityRecord[]> {
    return Array.from(this.entities.values()).filter((e) => e.status === "active");
  }

  async getAllEntities(): Promise<EntityRecord[]> {
    return Array.from(this.entities.values());
  }

  async getEntity(id: number): Promise<EntityRecord | null> {
    return this.entities.get(id) || null;
  }

  async createEntity(data: Omit<EntityRecord, "id" | "createdAt">): Promise<EntityRecord> {
    const id = this.entityIdCounter++;
    const entity: EntityRecord = {
      ...data,
      id,
      createdAt: new Date()
    };
    this.entities.set(id, entity);
    this.saveSnapshot();
    return entity;
  }

  async updateEntity(id: number, data: Partial<EntityRecord>): Promise<EntityRecord> {
    const existing = this.entities.get(id);
    if (!existing) throw new Error(`Entity ${id} not found`);
    const updated = { ...existing, ...data };
    this.entities.set(id, updated);
    this.saveSnapshot();
    return updated;
  }

  async getActiveQuestions(): Promise<QuestionRecord[]> {
    return Array.from(this.questions.values()).filter((q) => q.isActive);
  }

  async getAllQuestions(): Promise<QuestionRecord[]> {
    return Array.from(this.questions.values());
  }

  async getQuestion(id: number): Promise<QuestionRecord | null> {
    return this.questions.get(id) || null;
  }

  async createQuestion(data: Omit<QuestionRecord, "id">): Promise<QuestionRecord> {
    const id = this.questionIdCounter++;
    const question: QuestionRecord = {
      ...data,
      id
    };
    this.questions.set(id, question);
    this.saveSnapshot();
    return question;
  }

  async updateQuestion(id: number, data: Partial<QuestionRecord>): Promise<QuestionRecord> {
    const existing = this.questions.get(id);
    if (!existing) throw new Error(`Question ${id} not found`);
    const updated = { ...existing, ...data };
    this.questions.set(id, updated);
    this.saveSnapshot();
    return updated;
  }

  async getAllEntityAnswers(): Promise<EntityAnswerRecord[]> {
    return Array.from(this.entityAnswers.values());
  }

  async getEntityAnswersForEntity(entityId: number): Promise<EntityAnswerRecord[]> {
    const results: EntityAnswerRecord[] = [];
    for (const ea of this.entityAnswers.values()) {
      if (ea.entityId === entityId) {
        results.push(ea);
      }
    }
    return results;
  }

  async upsertEntityAnswer(
    entityId: number,
    questionId: number,
    delta: { yesW?: number; noW?: number; unknownW?: number }
  ): Promise<void> {
    const key = `${entityId}:${questionId}`;
    const existing = this.entityAnswers.get(key) || {
      entityId,
      questionId,
      yesW: 0,
      noW: 0,
      unknownW: 0
    };
    existing.yesW += delta.yesW || 0;
    existing.noW += delta.noW || 0;
    existing.unknownW += delta.unknownW || 0;
    this.entityAnswers.set(key, existing);
    this.saveSnapshot();
  }

  async setEntityAnswer(
    entityId: number,
    questionId: number,
    values: { yesW: number; noW: number; unknownW: number }
  ): Promise<void> {
    const key = `${entityId}:${questionId}`;
    this.entityAnswers.set(key, {
      entityId,
      questionId,
      yesW: values.yesW,
      noW: values.noW,
      unknownW: values.unknownW
    });
    this.saveSnapshot();
  }

  async createGameSession(id: string): Promise<GameSessionRecord> {
    const session: GameSessionRecord = {
      id,
      startedAt: new Date(),
      endedAt: null,
      result: "abandoned",
      finalEntityId: null,
      questionsCount: 0
    };
    this.gameSessions.set(id, session);
    return session;
  }

  async updateGameSession(id: string, data: Partial<GameSessionRecord>): Promise<GameSessionRecord> {
    const existing = this.gameSessions.get(id);
    if (!existing) throw new Error(`Game session ${id} not found`);
    const updated = { ...existing, ...data };
    this.gameSessions.set(id, updated);
    return updated;
  }

  async getGameSession(id: string): Promise<GameSessionRecord | null> {
    return this.gameSessions.get(id) || null;
  }

  async getGameAnswers(sessionId: string): Promise<GameAnswerRecord[]> {
    return this.gameAnswers
      .filter((a) => a.sessionId === sessionId)
      .sort((a, b) => a.step - b.step);
  }

  async recordGameAnswer(
    sessionId: string,
    questionId: number,
    answerValue: number,
    step: number
  ): Promise<void> {
    this.gameAnswers.push({
      id: this.gameAnswerIdCounter++,
      sessionId,
      questionId,
      answerValue,
      step,
      createdAt: new Date()
    });
    const s = this.gameSessions.get(sessionId);
    if (s) {
      s.questionsCount = Math.max(s.questionsCount, step);
    }
  }

  async recordGuess(
    sessionId: string,
    entityId: number,
    step: number,
    accepted: boolean
  ): Promise<void> {
    this.guesses.push({
      id: this.guessIdCounter++,
      sessionId,
      entityId,
      step,
      accepted,
      createdAt: new Date()
    });
  }

  async createSubmission(
    data: Omit<SubmissionRecord, "id" | "createdAt">
  ): Promise<SubmissionRecord> {
    const id = this.submissionIdCounter++;
    const sub: SubmissionRecord = {
      ...data,
      id,
      createdAt: new Date()
    };
    this.submissions.set(id, sub);
    this.saveSnapshot();
    return sub;
  }

  async getSubmissions(status?: "pending" | "approved" | "rejected"): Promise<SubmissionRecord[]> {
    const list = Array.from(this.submissions.values());
    if (status) {
      return list.filter((s) => s.status === status);
    }
    return list;
  }

  async getSubmission(id: number): Promise<SubmissionRecord | null> {
    return this.submissions.get(id) || null;
  }

  async updateSubmission(id: number, status: "approved" | "rejected"): Promise<SubmissionRecord> {
    const sub = this.submissions.get(id);
    if (!sub) throw new Error(`Submission ${id} not found`);
    sub.status = status;
    this.submissions.set(id, sub);
    this.saveSnapshot();
    return sub;
  }

  async getStats() {
    let wins = 0;
    let losses = 0;
    for (const g of this.gameSessions.values()) {
      if (g.result === "win") wins++;
      if (g.result === "lose") losses++;
    }
    let pendingSubmissions = 0;
    for (const s of this.submissions.values()) {
      if (s.status === "pending") pendingSubmissions++;
    }
    return {
      totalGames: this.gameSessions.size,
      wins,
      losses,
      activeEntities: (await this.getActiveEntities()).length,
      activeQuestions: (await this.getActiveQuestions()).length,
      pendingSubmissions
    };
  }
}

export class PrismaStorage implements IStorage {
  name = "PrismaStorage";
  private prisma: PrismaClient;

  constructor(prisma?: PrismaClient) {
    this.prisma = prisma || new PrismaClient();
  }

  async init(): Promise<void> {
    await this.prisma.$connect();
  }

  async getActiveEntities(): Promise<EntityRecord[]> {
    const items = await this.prisma.entity.findMany({
      where: { status: "active" }
    });
    return items.map((i) => ({
      id: i.id,
      name: i.name,
      description: i.description,
      imageUrl: i.imageUrl,
      popularity: i.popularity,
      status: i.status as "active" | "pending",
      createdAt: i.createdAt
    }));
  }

  async getAllEntities(): Promise<EntityRecord[]> {
    const items = await this.prisma.entity.findMany();
    return items.map((i) => ({
      id: i.id,
      name: i.name,
      description: i.description,
      imageUrl: i.imageUrl,
      popularity: i.popularity,
      status: i.status as "active" | "pending",
      createdAt: i.createdAt
    }));
  }

  async getEntity(id: number): Promise<EntityRecord | null> {
    const item = await this.prisma.entity.findUnique({ where: { id } });
    if (!item) return null;
    return {
      id: item.id,
      name: item.name,
      description: item.description,
      imageUrl: item.imageUrl,
      popularity: item.popularity,
      status: item.status as "active" | "pending",
      createdAt: item.createdAt
    };
  }

  async createEntity(data: Omit<EntityRecord, "id" | "createdAt">): Promise<EntityRecord> {
    const created = await this.prisma.entity.create({
      data: {
        name: data.name,
        description: data.description,
        imageUrl: data.imageUrl,
        popularity: data.popularity,
        status: data.status
      }
    });
    return {
      ...created,
      status: created.status as "active" | "pending"
    };
  }

  async updateEntity(id: number, data: Partial<EntityRecord>): Promise<EntityRecord> {
    const updated = await this.prisma.entity.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        imageUrl: data.imageUrl,
        popularity: data.popularity,
        status: data.status
      }
    });
    return {
      ...updated,
      status: updated.status as "active" | "pending"
    };
  }

  async getActiveQuestions(): Promise<QuestionRecord[]> {
    const items = await this.prisma.question.findMany({
      where: { isActive: true }
    });
    return items.map((q) => ({
      id: q.id,
      text: q.text,
      source: q.source as "wikidata" | "llm" | "user",
      qualityScore: q.qualityScore,
      timesAsked: q.timesAsked,
      isActive: q.isActive
    }));
  }

  async getAllQuestions(): Promise<QuestionRecord[]> {
    const items = await this.prisma.question.findMany();
    return items.map((q) => ({
      id: q.id,
      text: q.text,
      source: q.source as "wikidata" | "llm" | "user",
      qualityScore: q.qualityScore,
      timesAsked: q.timesAsked,
      isActive: q.isActive
    }));
  }

  async getQuestion(id: number): Promise<QuestionRecord | null> {
    const item = await this.prisma.question.findUnique({ where: { id } });
    if (!item) return null;
    return {
      id: item.id,
      text: item.text,
      source: item.source as "wikidata" | "llm" | "user",
      qualityScore: item.qualityScore,
      timesAsked: item.timesAsked,
      isActive: item.isActive
    };
  }

  async createQuestion(data: Omit<QuestionRecord, "id">): Promise<QuestionRecord> {
    const created = await this.prisma.question.create({
      data: {
        text: data.text,
        source: data.source,
        qualityScore: data.qualityScore,
        timesAsked: data.timesAsked,
        isActive: data.isActive
      }
    });
    return {
      id: created.id,
      text: created.text,
      source: created.source as "wikidata" | "llm" | "user",
      qualityScore: created.qualityScore,
      timesAsked: created.timesAsked,
      isActive: created.isActive
    };
  }

  async updateQuestion(id: number, data: Partial<QuestionRecord>): Promise<QuestionRecord> {
    const updated = await this.prisma.question.update({
      where: { id },
      data: {
        text: data.text,
        source: data.source,
        qualityScore: data.qualityScore,
        timesAsked: data.timesAsked,
        isActive: data.isActive
      }
    });
    return {
      id: updated.id,
      text: updated.text,
      source: updated.source as "wikidata" | "llm" | "user",
      qualityScore: updated.qualityScore,
      timesAsked: updated.timesAsked,
      isActive: updated.isActive
    };
  }

  async getAllEntityAnswers(): Promise<EntityAnswerRecord[]> {
    const items = await this.prisma.entityAnswer.findMany();
    return items.map((i) => ({
      entityId: i.entityId,
      questionId: i.questionId,
      yesW: i.yesW,
      noW: i.noW,
      unknownW: i.unknownW
    }));
  }

  async getEntityAnswersForEntity(entityId: number): Promise<EntityAnswerRecord[]> {
    const items = await this.prisma.entityAnswer.findMany({
      where: { entityId }
    });
    return items.map((i) => ({
      entityId: i.entityId,
      questionId: i.questionId,
      yesW: i.yesW,
      noW: i.noW,
      unknownW: i.unknownW
    }));
  }

  async upsertEntityAnswer(
    entityId: number,
    questionId: number,
    delta: { yesW?: number; noW?: number; unknownW?: number }
  ): Promise<void> {
    await this.prisma.entityAnswer.upsert({
      where: {
        entityId_questionId: {
          entityId,
          questionId
        }
      },
      update: {
        yesW: { increment: delta.yesW || 0 },
        noW: { increment: delta.noW || 0 },
        unknownW: { increment: delta.unknownW || 0 }
      },
      create: {
        entityId,
        questionId,
        yesW: delta.yesW || 0,
        noW: delta.noW || 0,
        unknownW: delta.unknownW || 0
      }
    });
  }

  async setEntityAnswer(
    entityId: number,
    questionId: number,
    values: { yesW: number; noW: number; unknownW: number }
  ): Promise<void> {
    await this.prisma.entityAnswer.upsert({
      where: {
        entityId_questionId: {
          entityId,
          questionId
        }
      },
      update: {
        yesW: values.yesW,
        noW: values.noW,
        unknownW: values.unknownW
      },
      create: {
        entityId,
        questionId,
        yesW: values.yesW,
        noW: values.noW,
        unknownW: values.unknownW
      }
    });
  }

  async createGameSession(id: string): Promise<GameSessionRecord> {
    const item = await this.prisma.gameSession.create({
      data: { id }
    });
    return {
      id: item.id,
      startedAt: item.startedAt,
      endedAt: item.endedAt,
      result: item.result as "win" | "lose" | "abandoned",
      finalEntityId: item.finalEntityId,
      questionsCount: item.questionsCount
    };
  }

  async updateGameSession(id: string, data: Partial<GameSessionRecord>): Promise<GameSessionRecord> {
    const updated = await this.prisma.gameSession.update({
      where: { id },
      data: {
        endedAt: data.endedAt,
        result: data.result,
        finalEntityId: data.finalEntityId,
        questionsCount: data.questionsCount
      }
    });
    return {
      id: updated.id,
      startedAt: updated.startedAt,
      endedAt: updated.endedAt,
      result: updated.result as "win" | "lose" | "abandoned",
      finalEntityId: updated.finalEntityId,
      questionsCount: updated.questionsCount
    };
  }

  async getGameSession(id: string): Promise<GameSessionRecord | null> {
    const item = await this.prisma.gameSession.findUnique({ where: { id } });
    if (!item) return null;
    return {
      id: item.id,
      startedAt: item.startedAt,
      endedAt: item.endedAt,
      result: item.result as "win" | "lose" | "abandoned",
      finalEntityId: item.finalEntityId,
      questionsCount: item.questionsCount
    };
  }

  async getGameAnswers(sessionId: string): Promise<GameAnswerRecord[]> {
    const items = await this.prisma.gameAnswer.findMany({
      where: { sessionId },
      orderBy: { step: "asc" }
    });
    return items.map((i) => ({
      id: i.id,
      sessionId: i.sessionId,
      questionId: i.questionId,
      answerValue: i.answerValue,
      step: i.step,
      createdAt: i.createdAt
    }));
  }

  async recordGameAnswer(
    sessionId: string,
    questionId: number,
    answerValue: number,
    step: number
  ): Promise<void> {
    await this.prisma.gameAnswer.create({
      data: {
        sessionId,
        questionId,
        answerValue,
        step
      }
    });
    await this.prisma.gameSession.update({
      where: { id: sessionId },
      data: { questionsCount: step }
    });
  }

  async recordGuess(
    sessionId: string,
    entityId: number,
    step: number,
    accepted: boolean
  ): Promise<void> {
    await this.prisma.guess.create({
      data: {
        sessionId,
        entityId,
        step,
        accepted
      }
    });
  }

  async createSubmission(
    data: Omit<SubmissionRecord, "id" | "createdAt">
  ): Promise<SubmissionRecord> {
    const item = await this.prisma.submission.create({
      data: {
        sessionId: data.sessionId,
        entityName: data.entityName,
        questionText: data.questionText,
        answer: data.answer,
        closestWrongEntityId: data.closestWrongEntityId,
        status: data.status
      }
    });
    return {
      id: item.id,
      sessionId: item.sessionId,
      entityName: item.entityName,
      questionText: item.questionText,
      answer: item.answer,
      closestWrongEntityId: item.closestWrongEntityId,
      status: item.status as "pending" | "approved" | "rejected",
      createdAt: item.createdAt
    };
  }

  async getSubmissions(status?: "pending" | "approved" | "rejected"): Promise<SubmissionRecord[]> {
    const items = await this.prisma.submission.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: "desc" }
    });
    return items.map((i) => ({
      id: i.id,
      sessionId: i.sessionId,
      entityName: i.entityName,
      questionText: i.questionText,
      answer: i.answer,
      closestWrongEntityId: i.closestWrongEntityId,
      status: i.status as "pending" | "approved" | "rejected",
      createdAt: i.createdAt
    }));
  }

  async getSubmission(id: number): Promise<SubmissionRecord | null> {
    const item = await this.prisma.submission.findUnique({ where: { id } });
    if (!item) return null;
    return {
      id: item.id,
      sessionId: item.sessionId,
      entityName: item.entityName,
      questionText: item.questionText,
      answer: item.answer,
      closestWrongEntityId: item.closestWrongEntityId,
      status: item.status as "pending" | "approved" | "rejected",
      createdAt: item.createdAt
    };
  }

  async updateSubmission(id: number, status: "approved" | "rejected"): Promise<SubmissionRecord> {
    const updated = await this.prisma.submission.update({
      where: { id },
      data: { status }
    });
    return {
      id: updated.id,
      sessionId: updated.sessionId,
      entityName: updated.entityName,
      questionText: updated.questionText,
      answer: updated.answer,
      closestWrongEntityId: updated.closestWrongEntityId,
      status: updated.status as "pending" | "approved" | "rejected",
      createdAt: updated.createdAt
    };
  }

  async getStats() {
    const totalGames = await this.prisma.gameSession.count();
    const wins = await this.prisma.gameSession.count({ where: { result: "win" } });
    const losses = await this.prisma.gameSession.count({ where: { result: "lose" } });
    const activeEntities = await this.prisma.entity.count({ where: { status: "active" } });
    const activeQuestions = await this.prisma.question.count({ where: { isActive: true } });
    const pendingSubmissions = await this.prisma.submission.count({ where: { status: "pending" } });
    return {
      totalGames,
      wins,
      losses,
      activeEntities,
      activeQuestions,
      pendingSubmissions
    };
  }
}

let storageSingleton: IStorage | null = null;

export async function getStorage(): Promise<IStorage> {
  if (storageSingleton) return storageSingleton;

  const persistenceFile = path.resolve(process.cwd(), "data", "local_db.json");
  const dbUrl = process.env.DATABASE_URL?.trim();

  // If no DB URL or localhost on cloud deployment or forced in-memory
  if (
    !dbUrl ||
    dbUrl === "" ||
    (process.env.NODE_ENV === "production" && dbUrl.includes("localhost")) ||
    process.env.STORAGE_DRIVER === "memory"
  ) {
    console.log("[Storage] Using high-performance InMemoryStorage with pre-seeded data.");
    const storage = new InMemoryStorage(persistenceFile);
    await storage.init();
    storageSingleton = storage;
    return storage;
  }

  try {
    const prismaStorage = new PrismaStorage();
    // Test connection with a fast query and timeout
    const testPromise = prismaStorage.init();
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Database connection timeout")), 2500)
    );
    await Promise.race([testPromise, timeoutPromise]);
    console.log("[Storage] Successfully connected to PostgreSQL via Prisma.");
    storageSingleton = prismaStorage;
    return prismaStorage;
  } catch (err: any) {
    console.warn(
      `[Storage] PostgreSQL unreachable (${err.message}). Using high-performance InMemoryStorage with pre-seeded data.`
    );
    const storage = new InMemoryStorage(persistenceFile);
    await storage.init();
    storageSingleton = storage;
    return storage;
  }
}
