import { EngineMatrix } from "./matrix.js";
import { CategoryPackId, getCategoryPackIndices } from "../services/categoryPackService.js";

export const ANSWER_VALUES = {
  YES: 1.0,
  PROBABLY: 0.75,
  UNKNOWN: 0.5,
  PROBABLY_NOT: 0.25,
  NO: 0.0
} as const;

export type AnswerValue = (typeof ANSWER_VALUES)[keyof typeof ANSWER_VALUES];

export interface CandidateScore {
  entityIdx: number;
  entityId: number;
  name: string;
  description: string | null;
  imageUrl: string | null;
  probability: number;
  funFact?: string | null;
}

export interface QuestionRecommendation {
  questionIdx: number;
  questionId: number;
  text: string;
  expectedInfoGain: number;
  score: number;
}

export class BayesianEngine {
  private matrix: EngineMatrix;
  public k = 1.5;

  constructor(matrix: EngineMatrix) {
    this.matrix = matrix;
  }

  /**
   * Initializes a fresh prior distribution for a new game session, optionally restricted to a domain.
   */
  public createInitialPosterior(domain: "character" | "object" = "character"): Float32Array {
    return this.matrix.getDomainPrior(domain);
  }

  /**
   * Converts accumulated penalties into probabilities using softmax over (-penalty * k).
   * Restricts probabilities strictly to the active domain candidates.
   * Adjusts baseline logit priors based on difficulty (easy = common boost, hard = rare boost, expert = neutral).
   */
  public computeProbabilities(
    penalties: Float32Array,
    domain?: "character" | "object",
    difficulty: "easy" | "hard" | "expert" = "easy",
    categoryPack: CategoryPackId = "all"
  ): Float32Array {
    const probs = new Float32Array(this.matrix.numEntities);
    const domainIndices = getCategoryPackIndices(categoryPack, this.matrix, domain);

    let maxLogit = -Infinity;
    for (const idx of domainIndices) {
      let priorBias = 0.0;
      const pop = this.matrix.entities[idx]?.popularity ?? 40000;
      if (difficulty === "easy") {
        priorBias = pop >= 40000 ? 0.6 : -0.6;
      } else if (difficulty === "hard") {
        priorBias = pop < 40000 ? 0.8 : -0.4;
      }
      const logit = -penalties[idx] * this.k + priorBias;
      if (logit > maxLogit) maxLogit = logit;
    }

    let sum = 0.0;
    for (const idx of domainIndices) {
      let priorBias = 0.0;
      const pop = this.matrix.entities[idx]?.popularity ?? 40000;
      if (difficulty === "easy") {
        priorBias = pop >= 40000 ? 0.6 : -0.6;
      } else if (difficulty === "hard") {
        priorBias = pop < 40000 ? 0.8 : -0.4;
      }
      const w = Math.exp(-penalties[idx] * this.k + priorBias - maxLogit);
      probs[idx] = w;
      sum += w;
    }

    if (sum > 0) {
      const invSum = 1.0 / sum;
      for (const idx of domainIndices) {
        probs[idx] *= invSum;
      }
    } else {
      const uniform = 1.0 / Math.max(1, domainIndices.length);
      for (const idx of domainIndices) {
        probs[idx] = uniform;
      }
    }

    return probs;
  }

  /**
   * Updates penalties for each candidate in the domain based on distance from user answer:
   * penalty += |userAnswer - itemValue|
   * Skips Unknown (0.5) answers with zero penalty.
   */
  public updatePenalties(
    penalties: Float32Array,
    questionIdx: number,
    answerValue: number,
    domain?: "character" | "object"
  ): void {
    // Unknown (0.5) is skipped: no penalty, no reward
    if (Math.abs(answerValue - ANSWER_VALUES.UNKNOWN) < 1e-4) {
      return;
    }

    const domainIndices = domain
      ? (domain === "object" ? this.matrix.objectEntityIndices : this.matrix.characterEntityIndices)
      : Array.from({ length: this.matrix.numEntities }, (_, i) => i);

    for (const idx of domainIndices) {
      const itemValue = this.matrix.getPYes(idx, questionIdx);
      penalties[idx] += Math.abs(answerValue - itemValue);
    }
  }

  /**
   * Applies a heavy penalty (+4.0) to a rejected guess candidate so it drops
   * down the ranking without ever being permanently removed.
   */
  public penalizeRejectedGuess(penalties: Float32Array, entityIdx: number): void {
    if (entityIdx >= 0 && entityIdx < penalties.length) {
      penalties[entityIdx] += 4.0;
    }
  }

  /**
   * Computes the confidence-dependent exponent w = f(confidence)
   */
  public getConfidenceWeight(confidence: number, contradictionWeakening = false): number {
    let w = Math.min(1.8, 0.6 + 0.35 * Math.log10(1.0 + Math.max(0, confidence)));
    if (contradictionWeakening) {
      w *= 0.5;
    }
    return w;
  }

  /**
   * Calculates the likelihood of an answer given an entity's known p_yes and confidence.
   */
  public calculateLikelihood(
    answer: number,
    pYes: number,
    confidence: number,
    contradictionWeakening = false
  ): number {
    if (Math.abs(answer - ANSWER_VALUES.UNKNOWN) < 1e-4) {
      return 1.0;
    }
    if (confidence < 1.0) {
      return 1.0;
    }

    const dist = Math.abs(answer - pYes);
    const base = Math.max(0.03, Math.min(1.0, 1.0 - dist));
    const w = this.getConfidenceWeight(confidence, contradictionWeakening);
    return Math.pow(base, w);
  }

  /**
   * Updates posterior probabilities in-place given an answer to a question.
   */
  public updatePosterior(
    currentPosterior: Float32Array,
    questionIdx: number,
    answer: number,
    contradictionWeakening = false
  ): Float32Array {
    const N = this.matrix.numEntities;
    const next = new Float32Array(N);

    if (Math.abs(answer - ANSWER_VALUES.UNKNOWN) < 1e-4) {
      next.set(currentPosterior);
      return next;
    }

    let sum = 0.0;
    for (let i = 0; i < N; i++) {
      const pPrior = currentPosterior[i];
      if (pPrior <= 0) {
        next[i] = 0;
        continue;
      }

      const pYes = this.matrix.getPYes(i, questionIdx);
      const conf = this.matrix.getConfidence(i, questionIdx);
      const likelihood = this.calculateLikelihood(answer, pYes, conf, contradictionWeakening);

      const pPosterior = pPrior * likelihood;
      next[i] = pPosterior;
      sum += pPosterior;
    }

    if (sum > 0) {
      const invSum = 1.0 / sum;
      for (let i = 0; i < N; i++) {
        next[i] *= invSum;
      }
    } else {
      next.set(this.matrix.priors);
    }

    return next;
  }

  /**
   * Returns top candidates sorted by probability descending.
   */
  public getTopCandidates(
    posterior: Float32Array,
    limit = 10,
    domain?: "character" | "object",
    categoryPack: CategoryPackId = "all"
  ): CandidateScore[] {
    const candidateIndices = getCategoryPackIndices(categoryPack, this.matrix, domain);

    const sorted = [...candidateIndices]
      .sort((a, b) => posterior[b] - posterior[a])
      .slice(0, limit);

    return sorted.map((idx) => {
      const entity = this.matrix.entities[idx];
      return {
        entityIdx: idx,
        entityId: entity.id,
        name: entity.name,
        description: entity.description,
        imageUrl: entity.imageUrl,
        probability: posterior[idx],
        funFact: entity.funFact || null
      };
    });
  }

  /**
   * Shannon entropy: - sum(p * ln(p))
   */
  public calculateEntropy(probs: ArrayLike<number>): number {
    let entropy = 0.0;
    const len = probs.length;
    for (let i = 0; i < len; i++) {
      const p = probs[i];
      if (p > 1e-9) {
        entropy -= p * Math.log(p);
      }
    }
    return entropy;
  }

  /**
   * Selects the next best question by finding the unasked question that splits the
   * top 20 candidates closest to 50/50 (weighted by their probabilities).
   * - Never asks the same question twice.
   * - Skips questions where all top candidates have the same answer (spread <= 0.05).
   * - Adds a small random tie-breaker so games don't feel identical.
   */
  public selectNextQuestion(
    probabilities: Float32Array,
    askedQuestionIndices: Set<number>,
    stepCount: number,
    contradictionWeakening = false,
    domain?: "character" | "object"
  ): QuestionRecommendation | null {
    if (!domain) {
      let charMass = 0;
      let objMass = 0;
      for (const idx of this.matrix.characterEntityIndices) charMass += probabilities[idx] || 0;
      for (const idx of this.matrix.objectEntityIndices) objMass += probabilities[idx] || 0;
      domain = objMass > charMass ? "object" : "character";
    }

    const domainIndices = domain === "object" ? this.matrix.objectEntityIndices : this.matrix.characterEntityIndices;

    // Pick top 20 candidates by probability
    const sortedCandidates = [...domainIndices].sort((a, b) => probabilities[b] - probabilities[a]);
    const top20 = sortedCandidates.slice(0, 20);

    let topProbSum = 0;
    for (const idx of top20) {
      topProbSum += probabilities[idx];
    }
    const weights = top20.map((idx) => (topProbSum > 0 ? probabilities[idx] / topProbSum : 1 / top20.length));

    let bestQIdx: number | null = null;
    let bestScore = -Infinity;
    let bestQMeta: any = null;

    for (let qIdx = 0; qIdx < this.matrix.numQuestions; qIdx++) {
      // Never ask the same question twice
      if (askedQuestionIndices.has(qIdx)) continue;

      const qMeta = this.matrix.questions[qIdx];
      if (!qMeta.isActive) continue;

      // Filter questions by active domain
      if (domain && qMeta.category !== domain && qMeta.category !== "common") {
        continue;
      }

      let minVal = Infinity;
      let maxVal = -Infinity;
      let weightedYes = 0;

      for (let c = 0; c < top20.length; c++) {
        const val = this.matrix.getPYes(top20[c], qIdx);
        if (val < minVal) minVal = val;
        if (val > maxVal) maxVal = val;
        weightedYes += weights[c] * val;
      }

      // Skip questions where all top candidates have virtually the same answer (spread <= 0.05)
      if (maxVal - minVal <= 0.05) {
        continue;
      }

      // Split score: 1.0 - 2.0 * |weightedYes - 0.5| is maximized at 50/50 (1.0)
      const splitBalance = 1.0 - 2.0 * Math.abs(weightedYes - 0.5);

      // Small random tie-breaker so games don't feel identical (0.0 to 0.04)
      const randomTieBreaker = Math.random() * 0.04;

      const score = splitBalance * (qMeta.qualityScore || 1.0) + randomTieBreaker;

      if (score > bestScore) {
        bestScore = score;
        bestQIdx = qIdx;
        bestQMeta = qMeta;
      }
    }

    if (bestQIdx === null) {
      // Fallback: pick any unasked question for the domain
      for (let qIdx = 0; qIdx < this.matrix.numQuestions; qIdx++) {
        if (askedQuestionIndices.has(qIdx)) continue;
        const qMeta = this.matrix.questions[qIdx];
        if (!qMeta.isActive) continue;
        if (domain && qMeta.category !== domain && qMeta.category !== "common") continue;
        return {
          questionIdx: qIdx,
          questionId: qMeta.id,
          text: qMeta.text,
          expectedInfoGain: 0.1,
          score: 0.1
        };
      }
      return null;
    }

    return {
      questionIdx: bestQIdx,
      questionId: bestQMeta.id,
      text: bestQMeta.text,
      expectedInfoGain: bestScore,
      score: bestScore
    };
  }
}
