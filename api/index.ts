import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { getStorage } from "../server/db/storage.js";
import { EngineMatrix } from "../server/engine/matrix.js";
import { BayesianEngine } from "../server/engine/bayes.js";
import { LearningService } from "../server/engine/learning.js";
import { createApiRouter } from "../server/api/routes.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

let isInitialized = false;
let matrix: EngineMatrix;
let storage: any;
let engine: BayesianEngine;
let learning: LearningService;

async function initialize() {
  if (isInitialized) return;
  storage = await getStorage();
  matrix = new EngineMatrix();
  await matrix.load(storage);
  engine = new BayesianEngine(matrix);
  learning = new LearningService(storage, matrix);
  app.use("/api", createApiRouter(storage, matrix, engine, learning));
  isInitialized = true;
}

export default async function handler(req: any, res: any) {
  await initialize();
  return app(req, res);
}
