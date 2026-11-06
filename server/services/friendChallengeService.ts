import fs from "fs";
import path from "path";
import { IStorage, EntityRecord } from "../db/types.js";

export interface FriendChallenge {
  code: string;
  creatorName: string;
  domain: "character" | "object";
  secretEntityId: number;
  secretEntityName: string;
  createdAt: number;
  playsCount: number;
  bestQuestions: number | null;
}

export interface SafeFriendChallenge {
  code: string;
  creatorName: string;
  domain: "character" | "object";
  createdAt: number;
  playsCount: number;
  bestQuestions: number | null;
  revealedEntityName?: string;
}

export class FriendChallengeService {
  private challenges: Map<string, FriendChallenge> = new Map();
  private filePath: string;

  constructor(filePath?: string) {
    this.filePath = filePath || path.resolve(process.cwd(), "data", "challenges.json");
    this.loadFromDisk();
  }

  private loadFromDisk() {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, "utf-8");
        const list: FriendChallenge[] = JSON.parse(raw);
        for (const c of list) {
          this.challenges.set(c.code.toUpperCase(), c);
        }
      }
    } catch {
      // Non-blocking fallback
    }
  }

  private saveToDisk() {
    try {
      const list = Array.from(this.challenges.values());
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.filePath, JSON.stringify(list, null, 2), "utf-8");
    } catch {
      // Non-blocking fallback
    }
  }

  private generateCode(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "COG-";
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  public async createChallenge(
    storage: IStorage,
    domain: "character" | "object",
    entityId: number,
    creatorName: string = "A Friend"
  ): Promise<FriendChallenge> {
    const entity = await storage.getEntity(entityId);
    if (!entity || entity.status !== "active") {
      throw new Error(`Target entity with ID ${entityId} not found or inactive.`);
    }

    let code = this.generateCode();
    while (this.challenges.has(code)) {
      code = this.generateCode();
    }

    const cleanCreator = creatorName.trim().slice(0, 30) || "A Friend";

    const challenge: FriendChallenge = {
      code,
      creatorName: cleanCreator,
      domain,
      secretEntityId: entity.id,
      secretEntityName: entity.name,
      createdAt: Date.now(),
      playsCount: 0,
      bestQuestions: null
    };

    this.challenges.set(code.toUpperCase(), challenge);
    this.saveToDisk();

    return challenge;
  }

  public getChallenge(code: string, revealSecret: boolean = false): SafeFriendChallenge | null {
    const c = this.challenges.get(code.trim().toUpperCase());
    if (!c) return null;

    return {
      code: c.code,
      creatorName: c.creatorName,
      domain: c.domain,
      createdAt: c.createdAt,
      playsCount: c.playsCount,
      bestQuestions: c.bestQuestions,
      revealedEntityName: revealSecret ? c.secretEntityName : undefined
    };
  }

  public getRawChallenge(code: string): FriendChallenge | null {
    return this.challenges.get(code.trim().toUpperCase()) || null;
  }

  public recordChallengeCompletion(
    code: string,
    won: boolean,
    questionsCount: number
  ): { playsCount: number; bestQuestions: number | null } | null {
    const c = this.challenges.get(code.trim().toUpperCase());
    if (!c) return null;

    c.playsCount += 1;
    if (won) {
      if (c.bestQuestions === null || questionsCount < c.bestQuestions) {
        c.bestQuestions = questionsCount;
      }
    }

    this.saveToDisk();
    return {
      playsCount: c.playsCount,
      bestQuestions: c.bestQuestions
    };
  }
}

export const friendChallengeService = new FriendChallengeService();
