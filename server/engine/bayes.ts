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
   * Initializes a fresh prior distribution for a new game session.
   */
  public createInitialPosterior(): Float32Array {
    const posterior = new Float32Array(this.matrix.numEntities);
    posterior.set(this.matrix.priors);
    return posterior;
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
  public calculateEntropy(probs: number[]): number {
    let entropy = 0.0;
    for (let i = 0; i < probs.length; i++) {
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
    contradictionWeakening = false
  ): QuestionRecommendation | null {
    const K = Math.min(300, this.matrix.numEntities);

    // Get top K candidate indices
    const candidateIndices = Array.from({ length: this.matrix.numEntities }, (_, i) => i)
      .sort((a, b) => posterior[b] - posterior[a])
      .slice(0, K);

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

    for (let qIdx = 0; qIdx < this.matrix.numQuestions; qIdx++) {
      if (askedQuestionIndices.has(qIdx)) continue;

      const qMeta = this.matrix.questions[qIdx];
      if (!qMeta.isActive || qMeta.qualityScore < 0.3) continue;

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
      const pAnswers = [0, 0, 0, 0, 0]; // YES, PROBABLY, UNKNOWN, PROBABLY_NOT, NO

      for (let c = 0; c < candidateIndices.length; c++) {
        const entIdx = candidateIndices[c];
        const pCand = candidateProbs[c];
        const pY = this.matrix.getPYes(entIdx, qIdx);
        const conf = this.matrix.getConfidence(entIdx, qIdx);

        if (conf < 1.0) {
          pAnswers[2] += pCand; // Unknown
        } else {
          pAnswers[0] += pCand * (pY * 0.85); // Yes
          pAnswers[1] += pCand * (pY * 0.10 + (1 - pY) * 0.05); // Probably
          pAnswers[2] += pCand * 0.05; // Unknown
          pAnswers[3] += pCand * ((1 - pY) * 0.10 + pY * 0.05); // Probably not
          pAnswers[4] += pCand * ((1 - pY) * 0.85); // No
        }
      }

      // Compute Expected Posterior Entropy
      let expectedH = 0.0;
      for (let aIdx = 0; aIdx < 5; aIdx++) {
        const pA = pAnswers[aIdx];
        if (pA <= 1e-6) continue;

        const simulatedAnswer = answersToSimulate[aIdx];
        const postSimProbs: number[] = new Array(candidateIndices.length);
        let simSum = 0.0;

        for (let c = 0; c < candidateIndices.length; c++) {
          const entIdx = candidateIndices[c];
          const priorVal = candidateProbs[c];
          const pY = this.matrix.getPYes(entIdx, qIdx);
          const conf = this.matrix.getConfidence(entIdx, qIdx);
          const lik = this.calculateLikelihood(simulatedAnswer, pY, conf, contradictionWeakening);
          const updated = priorVal * lik;
          postSimProbs[c] = updated;
          simSum += updated;
        }

        if (simSum > 0) {
          const invSim = 1.0 / simSum;
          for (let c = 0; c < postSimProbs.length; c++) {
            postSimProbs[c] *= invSim;
          }
          const H_a = this.calculateEntropy(postSimProbs);
          expectedH += pA * H_a;
        }
      }

      const infoGain = Math.max(0.0, H0 - expectedH);
      let score = infoGain * qMeta.qualityScore;

      // 1. Broad splitter boost in early game (first 3 questions)
      if (stepCount < 3) {
        // Broad splitter is balanced near 50% yes across all active entities
        let meanPYes = 0;
        for (let i = 0; i < this.matrix.numEntities; i++) {
          meanPYes += this.matrix.getPYes(i, qIdx);
        }
        meanPYes /= this.matrix.numEntities;
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

      candidateQuestions.push({
        questionIdx: qIdx,
        questionId: qMeta.id,
        text: qMeta.text,
        expectedInfoGain: infoGain,
        score
      });
    }

    if (candidateQuestions.length === 0) return null;

    // Sort by score descending
    candidateQuestions.sort((a, b) => b.score - a.score);

    // Pick randomly from the top 3 (or fewer if less than 3) so games vary
    const topChoices = candidateQuestions.slice(0, Math.min(3, candidateQuestions.length));
    const chosen = topChoices[Math.floor(Math.random() * topChoices.length)];

    return chosen;
  }
}
