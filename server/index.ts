import express from "express";
import cors from "cors";
import path from "path";
import dotenv from "dotenv";
import { getStorage } from "./db/storage.js";
import { EngineMatrix } from "./engine/matrix.js";
import { BayesianEngine } from "./engine/bayes.js";
import { LearningService } from "./engine/learning.js";
import { createApiRouter } from "./api/routes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(cors());
app.use(express.json());

async function bootstrap() {
  console.log("⚡ Bootstrapping Cognitor Bayesian Guessing Engine...");

  const storage = await getStorage();
  const matrix = new EngineMatrix();
  await matrix.load(storage);
  const engine = new BayesianEngine(matrix);
  const learning = new LearningService(storage, matrix);

  // Health check endpoint for Render / cloud deployment
  app.get("/healthz", (_req, res) => {
    res.status(200).json({ status: "healthy", timestamp: new Date().toISOString() });
  });

  // Mount API
  const apiRouter = createApiRouter(storage, matrix, engine, learning);
  app.use("/api", apiRouter);

  // Serve frontend static assets in production
  const clientDist = path.resolve(process.cwd(), "client", "dist");
  app.use(express.static(clientDist));

  // SPA fallback
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api") || req.path === "/healthz") return next();
    res.sendFile(path.join(clientDist, "index.html"), (err) => {
      if (err) {
        res.status(200).send(`
          <!DOCTYPE html>
          <html>
            <head><title>Cognitor API</title></head>
            <body style="font-family:sans-serif;padding:2rem;">
              <h2>Cognitor API Server Active</h2>
              <p>Run Vite in development mode (<code>npm run dev:client</code>) or build the client (<code>npm run build:client</code>) to view the UI.</p>
            </body>
          </html>
        `);
      }
    });
  });

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Cognitor server listening on http://0.0.0.0:${PORT}`);
  });

  return { app, server, matrix, storage, engine, learning };
}

if (process.env.NODE_ENV !== "test") {
  bootstrap().catch((err) => {
    console.error("Fatal startup error:", err);
    process.exit(1);
  });
}

export { bootstrap };
