import { IStorage } from "../db/types.js";
import { EngineMatrix } from "./matrix.js";
import { AnswerHistoryEntry } from "./session.js";
import { resolveWikipediaImage } from "../services/imageService.js";

export class LearningService {
  private storage: IStorage;
  private matrix: EngineMatrix;

  constructor(storage: IStorage, matrix: EngineMatrix) {
    this.storage = storage;
    this.matrix = matrix;
  }

  /**
   * Calculates session reliability score between 0.2 and 1.0
   * Games with many "Don't know" answers are downweighted.
   */
  public calculateReliability(history: AnswerHistoryEntry[]): number {
    if (history.length === 0) return 0.5;

    let unknownCount = 0;
    for (const h of history) {
      if (Math.abs(h.answerValue - 0.5) < 1e-4) {
        unknownCount++;
      }
    }

    const unknownRatio = unknownCount / history.length;
    let reliability = 1.0;
    if (unknownRatio > 0.4) {
      reliability = 0.5;
    } else if (unknownRatio > 0.2) {
      reliability = 0.75;
    }
    return reliability;
  }

  /**
   * Applies learning loop updates upon a confirmed WIN.
   */
  public async handleWin(
    sessionId: string,
    entityId: number,
    history: AnswerHistoryEntry[]
  ): Promise<void> {
    const reliability = this.calculateReliability(history);
    const entityIdx = this.matrix.entityIdToIndex.get(entityId);

    for (const h of history) {
      let deltaYes = 0;
      let deltaNo = 0;
      let deltaUnk = 0;

      if (h.answerValue >= 0.95) {
        deltaYes = 1.0;
      } else if (h.answerValue <= 0.05) {
        deltaNo = 1.0;
      } else if (h.answerValue >= 0.7) {
        deltaYes = 0.7;
        deltaNo = 0.3;
      } else if (h.answerValue <= 0.3) {
        deltaYes = 0.3;
        deltaNo = 0.7;
      } else {
        deltaUnk = 1.0;
      }

      deltaYes *= reliability;
      deltaNo *= reliability;
      deltaUnk *= reliability;

      // Noise control: Never let a single game change a well-established pair (confidence > 20)
      // by more than a small amount (<= 0.5)
      const qIdx = this.matrix.questionIdToIndex.get(h.questionId);
      if (entityIdx !== undefined && qIdx !== undefined) {
        const conf = this.matrix.getConfidence(entityIdx, qIdx);
        if (conf > 20.0) {
          deltaYes = Math.min(deltaYes, 0.5);
          deltaNo = Math.min(deltaNo, 0.5);
        }
      }

      await this.storage.upsertEntityAnswer(entityId, h.questionId, {
        yesW: deltaYes,
        noW: deltaNo,
        unknownW: deltaUnk
      });
    }

    // Increment popularity by 1
    const ent = await this.storage.getEntity(entityId);
    if (ent) {
      await this.storage.updateEntity(entityId, {
        popularity: ent.popularity + 1.0
      });
    }

    // Update game session
    await this.storage.updateGameSession(sessionId, {
      result: "win",
      endedAt: new Date(),
      finalEntityId: entityId,
      questionsCount: history.length
    });

    // Hot-update matrix cell values for this entity without full reload
    if (entityIdx !== undefined) {
      for (const h of history) {
        const qIdx = this.matrix.questionIdToIndex.get(h.questionId);
        if (qIdx !== undefined) {
          const cell = entityIdx * this.matrix.numQuestions + qIdx;
          const oldYesW = this.matrix.pYes[cell] * (this.matrix.confidence[cell] + 2.0) - 1.0;
          const oldNoW = (1.0 - this.matrix.pYes[cell]) * (this.matrix.confidence[cell] + 2.0) - 1.0;
          const newYesW = Math.max(0, oldYesW + 1.0 * reliability);
          const newNoW = Math.max(0, oldNoW + (h.answerValue === 0 ? 1.0 : 0) * reliability);
          const newConf = newYesW + newNoW;
          this.matrix.confidence[cell] = newConf;
          this.matrix.pYes[cell] = (newYesW + 1.0) / (newConf + 2.0);
        }
      }
    }
  }

  /**
   * Applies learning loop updates upon a LOSS with user submission.
   */
  public async handleLossWithSubmission(
    sessionId: string,
    entityName: string,
    questionText: string,
    answer: number,
    history: AnswerHistoryEntry[],
    closestWrongEntityId?: number,
    domain: "character" | "object" = "character"
  ): Promise<{ submissionId: number; entityId: number }> {
    // 1. Resolve image & description from Wikipedia
    const wikiInfo = await resolveWikipediaImage(entityName.trim());
    const description = wikiInfo.description || `Submitted by user in game session ${sessionId.slice(0, 8)}`;
    const imageUrl = wikiInfo.imageUrl || null;

    const pendingEntity = await this.storage.createEntity({
      name: entityName.trim(),
      description,
      imageUrl,
      popularity: 5.0,
      category: domain,
      status: "pending"
    });

    // 2. Pre-fill initial soft answers from this session's history with low weight
    for (const h of history) {
      let yw = 0;
      let nw = 0;
      if (h.answerValue >= 0.75) yw = 1.0;
      else if (h.answerValue <= 0.25) nw = 1.0;
      else yw = 0.5;

      await this.storage.setEntityAnswer(pendingEntity.id, h.questionId, {
        yesW: yw,
        noW: nw,
        unknownW: 1.0
      });
    }

    // 3. Create submission record in moderation queue
    const submission = await this.storage.createSubmission({
      sessionId,
      entityName: entityName.trim(),
      category: domain,
      questionText: questionText.trim(),
      answer,
      closestWrongEntityId: closestWrongEntityId || null,
      status: "pending"
    });

    // 4. Update game session to lost
    await this.storage.updateGameSession(sessionId, {
      result: "lose",
      endedAt: new Date(),
      questionsCount: history.length
    });

    return {
      submissionId: submission.id,
      entityId: pendingEntity.id
    };
  }

  /**
   * Admin approves a submission from the moderation queue:
   * - Marks submission as approved
   * - Activates the entity
   * - Creates or activates the submitted distinguishing question
   * - Seeds the distinguishing answer (yes_w = 10 or no_w = 10)
   * - Auto-seeds unknown for top 50 entities
   * - Reloads the in-memory engine matrix!
   */
  public async approveSubmission(submissionId: number): Promise<void> {
    const sub = await this.storage.getSubmission(submissionId);
    if (!sub) throw new Error(`Submission ${submissionId} not found`);

    await this.storage.updateSubmission(submissionId, "approved");

    // Activate entity with this name if pending
    const allEntities = await this.storage.getAllEntities();
    const matchedEntity = allEntities.find(
      (e) => e.name.toLowerCase() === sub.entityName.toLowerCase()
    );

    let activeEntityId: number;
    if (matchedEntity) {
      if (matchedEntity.status === "pending") {
        await this.storage.updateEntity(matchedEntity.id, {
          status: "active",
          category: sub.category || matchedEntity.category || "character"
        });
      }
      activeEntityId = matchedEntity.id;
    } else {
      const created = await this.storage.createEntity({
        name: sub.entityName,
        description: `Approved community ${sub.category === "object" ? "object" : "character"}`,
        imageUrl: null,
        popularity: 10.0,
        category: sub.category || "character",
        status: "active"
      });
      activeEntityId = created.id;
    }

    // Check question
    let questionId: number;
    const allQuestions = await this.storage.getAllQuestions();
    const existingQ = allQuestions.find(
      (q) => q.text.toLowerCase().trim() === sub.questionText.toLowerCase().trim()
    );

    if (existingQ) {
      if (!existingQ.isActive) {
        await this.storage.updateQuestion(existingQ.id, { isActive: true });
      }
      questionId = existingQ.id;
    } else {
      const createdQ = await this.storage.createQuestion({
        text: sub.questionText.trim(),
        source: "user",
        category: sub.category || "character",
        qualityScore: 1.0,
        timesAsked: 0,
        isActive: true
      });
      questionId = createdQ.id;

      // Auto-seed unknown for top 50 popular entities (no fake data)
      const topEntities = [...allEntities]
        .filter((e) => e.status === "active")
        .sort((a, b) => b.popularity - a.popularity)
        .slice(0, 50);

      for (const te of topEntities) {
        await this.storage.setEntityAnswer(te.id, questionId, {
          yesW: 0.0,
          noW: 0.0,
          unknownW: 1.0
        });
      }
    }

    // Store strong answer for distinguishing question
    const isYes = sub.answer >= 0.75;
    await this.storage.setEntityAnswer(activeEntityId, questionId, {
      yesW: isYes ? 10.0 : 0.0,
      noW: isYes ? 0.0 : 10.0,
      unknownW: 0.0
    });

    // If there was a closest wrong entity, store the opposing answer!
    if (sub.closestWrongEntityId) {
      await this.storage.setEntityAnswer(sub.closestWrongEntityId, questionId, {
        yesW: isYes ? 0.0 : 10.0,
        noW: isYes ? 10.0 : 0.0,
        unknownW: 0.0
      });
    }

    // Reload in-memory matrix so the new knowledge is live on hot path immediately!
    await this.matrix.load(this.storage);
    console.log(`[LearningService] Approved submission ${submissionId} and reloaded matrix.`);
  }

  /**
   * Admin rejects a submission.
   */
  public async rejectSubmission(submissionId: number): Promise<void> {
    await this.storage.updateSubmission(submissionId, "rejected");
  }
}
