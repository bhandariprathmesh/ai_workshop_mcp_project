import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { askFarmerQuestion } from "./client.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT || 5000);

// Enable CORS for frontend dev server
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "OPTIONS"],
  })
);

app.use(express.json());

// Health check endpoint
app.get("/api/health", async (_req, res) => {
  let dbStatus = "unknown";
  try {
    const pool = new pg.Pool({
      host: process.env.PGHOST || "localhost",
      port: Number(process.env.PGPORT || 5432),
      database: process.env.PGDATABASE || "sanjivani_sugar_factory",
      user: process.env.PGUSER || "postgres",
      password: process.env.PGPASSWORD || "",
    });
    const check = await pool.query("SELECT 1 AS ok");
    await pool.end();
    dbStatus = check.rows?.[0]?.ok === 1 ? "connected" : "ready";
  } catch (err: any) {
    dbStatus = `disconnected (${err.message || "error"})`;
  }

  res.json({
    status: "ok",
    service: "Sugarcane Farmer AI Assistant API",
    database: dbStatus,
    database_name: process.env.PGDATABASE || "sanjivani_sugar_factory",
    model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
    timestamp: new Date().toISOString(),
  });
});

// Chat endpoint
app.post("/api/chat", async (req, res) => {
  try {
    const { question } = req.body || {};

    if (
      !question ||
      typeof question !== "string" ||
      question.trim().length === 0
    ) {
      return res.status(400).json({
        error: "Invalid request: 'question' must be a non-empty string.",
      });
    }

    const answer = await askFarmerQuestion(question.trim());
    return res.json({ answer });
  } catch (error: any) {
    console.error("[API Error]:", error?.message || error);
    return res.status(500).json({
      error:
        error?.message?.includes("Missing credentials") ||
        error?.message?.includes("API key")
          ? "AI configuration error. Please verify server API keys."
          : error?.message ||
            "An unexpected error occurred while processing your request.",
    });
  }
});

// Serve frontend static build if available
const frontendDist = path.join(__dirname, "frontend", "dist");
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.use((_req, res) => {
    res.sendFile(path.join(frontendDist, "index.html"));
  });
}

app.listen(PORT, () => {
  console.log(`\n🌾 Sugarcane Farmer AI Backend listening at http://localhost:${PORT}`);
  console.log(`   - Health check: http://localhost:${PORT}/api/health`);
  console.log(`   - Chat endpoint: POST http://localhost:${PORT}/api/chat\n`);
});
