import { IStorage } from "../db/types.js";

export interface EntityMeta {
  id: number;
  name: string;
  description: string | null;
  imageUrl: string | null;
  popularity: number;
  category: "character" | "object";
}

export interface QuestionMeta {
  id: number;
  text: string;
  source: string;
  category: "character" | "object" | "common";
  qualityScore: number;
  timesAsked: number;
  isActive: boolean;
}

export class EngineMatrix {
  public entities: EntityMeta[] = [];
  public questions: QuestionMeta[] = [];

  // Mapping from DB ID to Matrix index
  public entityIdToIndex: Map<number, number> = new Map();
  public questionIdToIndex: Map<number, number> = new Map();

  // Domain groupings
  public characterEntityIndices: number[] = [];
  public objectEntityIndices: number[] = [];

  // Matrix dimensions: numEntities x numQuestions
  public numEntities = 0;
  public numQuestions = 0;

  // Flattened Float32Array: index = entityIdx * numQuestions + questionIdx
  public pYes: Float32Array = new Float32Array(0);
  public confidence: Float32Array = new Float32Array(0);

  // Normalized prior probability distribution: Float32Array of length numEntities
  public priors: Float32Array = new Float32Array(0);

  // Precomputed correlation matrix or helper
  private cachedCorrelations: Map<string, number> = new Map();

  constructor() {}

  /**
   * Loads or reloads all active entities, questions, and answers into memory.
   */
  public async load(storage: IStorage): Promise<void> {
    const rawEntities = await storage.getActiveEntities();
    const rawQuestions = await storage.getActiveQuestions();
    const rawAnswers = await storage.getAllEntityAnswers();

    this.entities = rawEntities.map((e) => ({
      id: e.id,
      name: e.name,
      description: e.description,
      imageUrl: e.imageUrl,
      popularity: e.popularity,
      category: (e.category as "character" | "object") || "character"
    }));

    this.questions = rawQuestions.map((q) => ({
      id: q.id,
      text: q.text,
      source: q.source,
      category: (q.category as "character" | "object" | "common") || "character",
      qualityScore: q.qualityScore,
      timesAsked: q.timesAsked,
      isActive: q.isActive
    }));

    this.numEntities = this.entities.length;
    this.numQuestions = this.questions.length;

    this.entityIdToIndex.clear();
    this.characterEntityIndices = [];
    this.objectEntityIndices = [];

    for (let i = 0; i < this.numEntities; i++) {
      this.entityIdToIndex.set(this.entities[i].id, i);
      if (this.entities[i].category === "object") {
        this.objectEntityIndices.push(i);
      } else {
        this.characterEntityIndices.push(i);
      }
    }

    this.questionIdToIndex.clear();
    for (let j = 0; j < this.numQuestions; j++) {
      this.questionIdToIndex.set(this.questions[j].id, j);
    }

    const totalCells = this.numEntities * this.numQuestions;
    this.pYes = new Float32Array(totalCells);
    this.confidence = new Float32Array(totalCells);

    // Initialize with default Beta(1, 1) prior: p_yes = (0+1)/(0+0+2) = 0.5, confidence = 0
    for (let k = 0; k < totalCells; k++) {
      this.pYes[k] = 0.5;
      this.confidence[k] = 0.0;
    }

    // Populate from soft counts
    // p_yes = (yes_w + 1) / (yes_w + no_w + 2)
    // confidence = yes_w + no_w
    for (const ans of rawAnswers) {
      const eIdx = this.entityIdToIndex.get(ans.entityId);
      const qIdx = this.questionIdToIndex.get(ans.questionId);
      if (eIdx !== undefined && qIdx !== undefined) {
        const cellIdx = eIdx * this.numQuestions + qIdx;
        const totalAnswers = ans.yesW + ans.noW;
        this.confidence[cellIdx] = totalAnswers;
        this.pYes[cellIdx] = (ans.yesW + 1.0) / (totalAnswers + 2.0);
      }
    }

    // Compute priors: P(e) proportional to log(1 + popularity)
    this.priors = new Float32Array(this.numEntities);
    let totalLogPop = 0;
    for (let i = 0; i < this.numEntities; i++) {
      const pop = Math.max(1.0, this.entities[i].popularity);
      const logPop = Math.log(1.0 + pop);
      this.priors[i] = logPop;
      totalLogPop += logPop;
    }

    if (totalLogPop > 0) {
      for (let i = 0; i < this.numEntities; i++) {
        this.priors[i] = this.priors[i] / totalLogPop;
      }
    } else {
      const uniform = 1.0 / Math.max(1, this.numEntities);
      for (let i = 0; i < this.numEntities; i++) {
        this.priors[i] = uniform;
      }
    }

    this.cachedCorrelations.clear();
    console.log(
      `[EngineMatrix] Initialized in-memory matrix: ${this.numEntities} entities (${this.characterEntityIndices.length} characters, ${this.objectEntityIndices.length} objects) x ${this.numQuestions} questions (${totalCells} cells).`
    );
  }

  /**
   * Returns a normalized prior distribution restricted to a domain.
   */
  public getDomainPrior(domain?: "character" | "object"): Float32Array {
    if (!domain) {
      const p = new Float32Array(this.numEntities);
      p.set(this.priors);
      return p;
    }

    const domainPosterior = new Float32Array(this.numEntities);
    let domainTotal = 0;
    for (let i = 0; i < this.numEntities; i++) {
      if (this.entities[i].category === domain) {
        domainPosterior[i] = this.priors[i];
        domainTotal += this.priors[i];
      } else {
        domainPosterior[i] = 0;
      }
    }

    if (domainTotal > 0) {
      const invTotal = 1.0 / domainTotal;
      for (let i = 0; i < this.numEntities; i++) {
        if (this.entities[i].category === domain) {
          domainPosterior[i] *= invTotal;
        }
      }
    }
    return domainPosterior;
  }

  public getPYes(entityIdx: number, questionIdx: number): number {
    return this.pYes[entityIdx * this.numQuestions + questionIdx];
  }

  public getConfidence(entityIdx: number, questionIdx: number): number {
    return this.confidence[entityIdx * this.numQuestions + questionIdx];
  }

  /**
   * Computes Pearson correlation between two questions across active entities
   */
  public getQuestionCorrelation(qIdx1: number, qIdx2: number): number {
    if (qIdx1 === qIdx2) return 1.0;
    const key = qIdx1 < qIdx2 ? `${qIdx1}:${qIdx2}` : `${qIdx2}:${qIdx1}`;
    if (this.cachedCorrelations.has(key)) {
      return this.cachedCorrelations.get(key)!;
    }

    let mean1 = 0;
    let mean2 = 0;
    const N = this.numEntities;
    for (let i = 0; i < N; i++) {
      mean1 += this.getPYes(i, qIdx1);
      mean2 += this.getPYes(i, qIdx2);
    }
    mean1 /= N;
    mean2 /= N;

    let cov = 0;
    let var1 = 0;
    let var2 = 0;
    for (let i = 0; i < N; i++) {
      const diff1 = this.getPYes(i, qIdx1) - mean1;
      const diff2 = this.getPYes(i, qIdx2) - mean2;
      cov += diff1 * diff2;
      var1 += diff1 * diff1;
      var2 += diff2 * diff2;
    }

    const stdDevProduct = Math.sqrt(var1 * var2);
    const corr = stdDevProduct > 1e-6 ? Math.abs(cov / stdDevProduct) : 0;
    this.cachedCorrelations.set(key, corr);
    return corr;
  }
}
