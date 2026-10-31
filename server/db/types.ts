export interface EntityRecord {
  id: number;
  name: string;
  description: string | null;
  imageUrl: string | null;
  popularity: number;
  status: "active" | "pending";
  createdAt: Date;
}

export interface QuestionRecord {
  id: number;
  text: string;
  source: "wikidata" | "llm" | "user";
  qualityScore: number;
  timesAsked: number;
  isActive: boolean;
}

export interface EntityAnswerRecord {
  entityId: number;
  questionId: number;
  yesW: number;
  noW: number;
  unknownW: number;
}

export interface GameSessionRecord {
  id: string;
  startedAt: Date;
  endedAt: Date | null;
  result: "win" | "lose" | "abandoned";
  finalEntityId: number | null;
  questionsCount: number;
}

export interface GameAnswerRecord {
  id: number;
  sessionId: string;
  questionId: number;
  answerValue: number;
  step: number;
  createdAt: Date;
}

export interface GuessRecord {
  id: number;
  sessionId: string;
  entityId: number;
  step: number;
  accepted: boolean;
  createdAt: Date;
}

export interface SubmissionRecord {
  id: number;
  sessionId: string | null;
  entityName: string;
  questionText: string;
  answer: number;
  closestWrongEntityId: number | null;
  status: "pending" | "approved" | "rejected";
  createdAt: Date;
}

export interface IStorage {
  name: string;
  init(): Promise<void>;
  getActiveEntities(): Promise<EntityRecord[]>;
  getAllEntities(): Promise<EntityRecord[]>;
  getEntity(id: number): Promise<EntityRecord | null>;
  createEntity(data: Omit<EntityRecord, "id" | "createdAt">): Promise<EntityRecord>;
  updateEntity(id: number, data: Partial<EntityRecord>): Promise<EntityRecord>;

  getActiveQuestions(): Promise<QuestionRecord[]>;
  getAllQuestions(): Promise<QuestionRecord[]>;
  getQuestion(id: number): Promise<QuestionRecord | null>;
  createQuestion(data: Omit<QuestionRecord, "id">): Promise<QuestionRecord>;
  updateQuestion(id: number, data: Partial<QuestionRecord>): Promise<QuestionRecord>;

  getAllEntityAnswers(): Promise<EntityAnswerRecord[]>;
  getEntityAnswersForEntity(entityId: number): Promise<EntityAnswerRecord[]>;
  upsertEntityAnswer(entityId: number, questionId: number, delta: { yesW?: number; noW?: number; unknownW?: number }): Promise<void>;
  setEntityAnswer(entityId: number, questionId: number, values: { yesW: number; noW: number; unknownW: number }): Promise<void>;

  createGameSession(id: string): Promise<GameSessionRecord>;
  updateGameSession(id: string, data: Partial<GameSessionRecord>): Promise<GameSessionRecord>;
  getGameSession(id: string): Promise<GameSessionRecord | null>;
  getGameAnswers(sessionId: string): Promise<GameAnswerRecord[]>;
  recordGameAnswer(sessionId: string, questionId: number, answerValue: number, step: number): Promise<void>;
  recordGuess(sessionId: string, entityId: number, step: number, accepted: boolean): Promise<void>;

  createSubmission(data: Omit<SubmissionRecord, "id" | "createdAt">): Promise<SubmissionRecord>;
  getSubmissions(status?: "pending" | "approved" | "rejected"): Promise<SubmissionRecord[]>;
  getSubmission(id: number): Promise<SubmissionRecord | null>;
  updateSubmission(id: number, status: "approved" | "rejected"): Promise<SubmissionRecord>;

  getStats(): Promise<{
    totalGames: number;
    wins: number;
    losses: number;
    activeEntities: number;
    activeQuestions: number;
    pendingSubmissions: number;
  }>;
}
