import { EngineMatrix } from "./matrix.js";

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
   * Computes the confidence-dependent exponent w = f(confidence)
   */
  public getConfidenceWeight(confidence: number, contradictionWeakening = false): number {
    // Monotonic scaling saturating around 1.8 for well-established questions
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
    // If user answered Unknown (0.5), no likelihood change for anyone
    if (Math.abs(answer - ANSWER_VALUES.UNKNOWN) < 1e-4) {
      return 1.0;
    }

    // Low confidence threshold (< 1.0 total answers) means unknown data; don't punish or reward
    if (confidence < 1.0) {
      return 1.0;
    }

    const dist = Math.abs(answer - pYes);
    // Clamp floor 0.03 guarantees a wrong/noisy answer never completely zeroes out the true entity
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

    // If answer is Unknown, posterior remains unchanged
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

    // Normalize
    if (sum > 0) {
      const invSum = 1.0 / sum;
      for (let i = 0; i < N; i++) {
        next[i] *= invSum;
      }
    } else {
      // Numerical safety: fall back to prior
      next.set(this.matrix.priors);
    }

    return next;
  }

  /**
   * Penalizes a rejected guess by setting its probability to 0.01 * P and renormalizing.
   */
  public penalizeRejectedGuess(posterior: Float32Array, entityIdx: number): Float32Array {
    const N = this.matrix.numEntities;
    const next = new Float32Array(N);
    next.set(posterior);

    if (entityIdx >= 0 && entityIdx < N) {
      next[entityIdx] *= 0.01;
    }

    let sum = 0.0;
    for (let i = 0; i < N; i++) {
      sum += next[i];
    }
    if (sum > 0) {
      const invSum = 1.0 / sum;
      for (let i = 0; i < N; i++) {
        next[i] *= invSum;
      }
    }
    return next;
  }

  /**
   * Returns top candidates sorted by probability descending.
   */
  public getTopCandidates(posterior: Float32Array, limit = 10): CandidateScore[] {
    const indices = new Int32Array(this.matrix.numEntities);
    for (let i = 0; i < indices.length; i++) {
      indices[i] = i;
    }

    // Sort top candidates
    const sorted = Array.from(indices)
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
        probability: posterior[idx]
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
   * Selects the next best question using Expected Information Gain.
   */
  public selectNextQuestion(
    posterior: Float32Array,
    askedQuestionIndices: Set<number>,
    stepCount: number,
    contradictionWeakening = false,
    domain?: "character" | "object"
  ): QuestionRecommendation | null {
    if (!domain) {
      let charMass = 0;
      let objMass = 0;
      for (const idx of this.matrix.characterEntityIndices) charMass += posterior[idx] || 0;
      for (const idx of this.matrix.objectEntityIndices) objMass += posterior[idx] || 0;
      domain = objMass > charMass ? "object" : "character";
    }

    const K = Math.min(200, this.matrix.numEntities);
    const N = this.matrix.numEntities;

    // Get top K candidate indices (strictly positive probability candidates in active domain)
    const activeIndices: number[] = [];
    for (let i = 0; i < N; i++) {
      if (posterior[i] > 1e-9) {
        activeIndices.push(i);
      }
    }
    activeIndices.sort((a, b) => posterior[b] - posterior[a]);
    const candidateIndices = activeIndices.slice(0, K);

    let topKSum = 0;
    for (const idx of candidateIndices) {
      topKSum += posterior[idx];
    }
    if (topKSum <= 0) return null;

    // Normalized candidate probabilities over top K
    const candidateProbs = candidateIndices.map((idx) => posterior[idx] / topKSum);
    const H0 = this.calculateEntropy(candidateProbs);

    // Check if late game top 2 hold > 70% of total mass
    const top2Candidates = candidateIndices.slice(0, 2);
    const top2Mass = (posterior[top2Candidates[0]] || 0) + (posterior[top2Candidates[1]] || 0);
    const isLateGameSeparation = top2Mass >= 0.70 && candidateIndices.length >= 2;

    const candidateQuestions: QuestionRecommendation[] = [];

    const answersToSimulate = [
      ANSWER_VALUES.YES,
      ANSWER_VALUES.PROBABLY,
      ANSWER_VALUES.UNKNOWN,
      ANSWER_VALUES.PROBABLY_NOT,
      ANSWER_VALUES.NO
    ];

    const candidateCount = candidateIndices.length;
    const candPYes = new Float32Array(candidateCount);
    const candW = new Float32Array(candidateCount);
    const postSimProbs = new Float32Array(candidateCount);

    for (let qIdx = 0; qIdx < this.matrix.numQuestions; qIdx++) {
      if (askedQuestionIndices.has(qIdx)) continue;

      const qMeta = this.matrix.questions[qIdx];
      if (!qMeta.isActive || qMeta.qualityScore < 0.3) continue;

      // Domain filter: only ask questions matching active domain or common questions
      if (domain && qMeta.category !== domain && qMeta.category !== "common") {
        continue;
      }

      // Skip if highly correlated (> 0.95) with an already-asked question
      let correlated = false;
      for (const askedQ of askedQuestionIndices) {
        if (this.matrix.getQuestionCorrelation(qIdx, askedQ) > 0.95) {
          correlated = true;
          break;
        }
      }
      if (correlated) continue;

      // Predict answer probabilities P(A = a) across top K
      let pYesSum = 0;
      let pProbablySum = 0;
      let pUnknownSum = 0;
      let pProbNotSum = 0;
      let pNoSum = 0;

      for (let c = 0; c < candidateCount; c++) {
        const entIdx = candidateIndices[c];
        const pCand = candidateProbs[c];
        const pY = this.matrix.getPYes(entIdx, qIdx);
        const conf = this.matrix.getConfidence(entIdx, qIdx);
        candPYes[c] = pY;
        candW[c] = conf < 1.0 ? 0.0 : this.getConfidenceWeight(conf, contradictionWeakening);

        if (conf < 1.0) {
          pUnknownSum += pCand;
        } else {
          pYesSum += pCand * (pY * 0.85);
          pProbablySum += pCand * (pY * 0.10);
          pUnknownSum += pCand * 0.05;
          pProbNotSum += pCand * ((1 - pY) * 0.10);
          pNoSum += pCand * ((1 - pY) * 0.85);
        }
      }

      const pSum = pYesSum + pProbablySum + pUnknownSum + pProbNotSum + pNoSum;
      if (pSum <= 0) continue;
      const invPSum = 1.0 / pSum;
      const pAnswers0 = pYesSum * invPSum;
      const pAnswers1 = pProbablySum * invPSum;
      const pAnswers2 = pUnknownSum * invPSum;
      const pAnswers3 = pProbNotSum * invPSum;
      const pAnswers4 = pNoSum * invPSum;

      // Compute Expected Posterior Entropy
      let expectedH = 0.0;
      for (let aIdx = 0; aIdx < 5; aIdx++) {
        const pA = aIdx === 0 ? pAnswers0 : aIdx === 1 ? pAnswers1 : aIdx === 2 ? pAnswers2 : aIdx === 3 ? pAnswers3 : pAnswers4;
        if (pA <= 0.002) continue;

        // For Unknown (aIdx === 2), posterior is unchanged so H is exactly H0
        if (aIdx === 2) {
          expectedH += pA * H0;
          continue;
        }

        const simulatedAnswer = answersToSimulate[aIdx];
        let simSum = 0.0;

        for (let c = 0; c < candidateCount; c++) {
          const priorVal = candidateProbs[c];
          const w = candW[c];
          let lik = 1.0;
          if (w > 0.0) {
            const dist = Math.abs(simulatedAnswer - candPYes[c]);
            const base = Math.max(0.03, Math.min(1.0, 1.0 - dist));
            lik = Math.pow(base, w);
          }
          const updated = priorVal * lik;
          postSimProbs[c] = updated;
          simSum += updated;
        }

        if (simSum > 0) {
          const invSim = 1.0 / simSum;
          let hA = 0.0;
          for (let c = 0; c < candidateCount; c++) {
            const p = postSimProbs[c] * invSim;
            if (p > 1e-9) hA -= p * Math.log(p);
          }
          expectedH += pA * hA;
        }
      }

      const infoGain = Math.max(0.0, H0 - expectedH);
      let score = Math.max(infoGain, 0.0001) * qMeta.qualityScore;

      // 1. Broad splitter boost in early game (first 3 questions)
      if (stepCount < 3) {
        let meanPYes = 0;
        for (let c = 0; c < candidateCount; c++) {
          meanPYes += this.matrix.getPYes(candidateIndices[c], qIdx);
        }
        meanPYes /= candidateCount;
        const splitBalance = 1.0 - 2.0 * Math.abs(meanPYes - 0.5); // 1.0 if 50/50, 0 if 100/0
        score *= 1.0 + 1.2 * Math.max(0, splitBalance);
      }

      // 2. Late game separation: if top-2 hold > 70% of probability mass
      if (isLateGameSeparation) {
        const c1 = top2Candidates[0];
        const c2 = top2Candidates[1];
        const diff = Math.abs(this.matrix.getPYes(c1, qIdx) - this.matrix.getPYes(c2, qIdx));
        if (diff >= 0.3) {
          // Strong differentiator for the top 2
          score += diff * 2.5;
        }
      }

      if (score > 1e-6) {
        candidateQuestions.push({
          questionIdx: qIdx,
          questionId: qMeta.id,
          text: qMeta.text,
          expectedInfoGain: infoGain,
          score
        });
      }
    }

    if (candidateQuestions.length === 0) {
      for (let qIdx = 0; qIdx < this.matrix.numQuestions; qIdx++) {
        if (askedQuestionIndices.has(qIdx)) continue;
        const qMeta = this.matrix.questions[qIdx];
        if (!qMeta.isActive) continue;
        if (domain && qMeta.category !== domain && qMeta.category !== "common") continue;
        return {
          questionIdx: qIdx,
          questionId: qMeta.id,
          text: qMeta.text,
          expectedInfoGain: 0,
          score: 0.1
        };
      }
      return null;
    }

    // Sort by score descending
    candidateQuestions.sort((a, b) => b.score - a.score);

    // Pick randomly from top candidates within 15% of the best score
    // This guarantees variety while strictly preventing picking inferior splitters
    const bestScore = candidateQuestions[0].score;
    const scoreThreshold = bestScore * 0.85;
    const topChoices = candidateQuestions.filter((q) => q.score >= scoreThreshold).slice(0, 3);
    const chosen = topChoices[Math.floor(Math.random() * topChoices.length)];

    return chosen;
  }
}
