import { Router } from "express";
import { prisma } from "@webness/db";
import Redis from "ioredis";
import { logger } from "../utils/logger.js";

export const healthRoutes = Router();

const redis = new Redis({
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379", 10),
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
});

/**
 * GET /api/health
 * System health check — returns status of all services
 */
healthRoutes.get("/", async (_req, res) => {
  const health: Record<string, string> = {
    api: "ok",
    worker: "unknown",
    brain: "unknown",
    redis: "unknown",
    db: "unknown",
    pgvector: "unknown",
  };

  // ---- Check PostgreSQL ----
  try {
    await prisma.$queryRaw`SELECT 1`;
    health.db = "ok";
  } catch (err) {
    health.db = "error";
    logger.error({ err }, "Database health check failed");
  }

  // ---- Check pgvector ----
  try {
    await prisma.$queryRaw`SELECT extversion FROM pg_extension WHERE extname = 'vector'`;
    health.pgvector = "ok";
  } catch {
    health.pgvector = "not_installed";
  }

  // ---- Check Redis ----
  try {
    await redis.ping();
    health.redis = "ok";
  } catch (err) {
    health.redis = "error";
    logger.error({ err }, "Redis health check failed");
  }

  // ---- Check Local Brain ----
  try {
    const brainUrl = process.env.BRAIN_URL || "https://brain.webness.in";
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const brainRes = await fetch(`${brainUrl}/health`, {
      signal: controller.signal,
      headers: {
        "X-Webness-Key": process.env.BRAIN_API_KEY || "",
      },
    });
    clearTimeout(timeout);

    health.brain = brainRes.ok ? "online" : "degraded";
  } catch {
    health.brain = "offline";
  }

  // ---- Overall Status ----
  const isHealthy =
    health.db === "ok" && health.redis === "ok" && health.api === "ok";

  res.status(isHealthy ? 200 : 503).json({
    success: isHealthy,
    timestamp: new Date().toISOString(),
    ...health,
  });
});
