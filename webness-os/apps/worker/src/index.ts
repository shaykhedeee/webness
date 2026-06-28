import { Worker, Job } from "bullmq";
import IORedis from "ioredis";
import { prisma } from "@webness/db";
import { logger } from "./utils/logger.js";
import { processToolExecution } from "./processors/dispatcher.js";
import { startTunnelMonitor, stopTunnelMonitor } from "./monitors/tunnel-monitor.js";
import { startHealthScheduler, stopHealthScheduler } from "./monitors/health-scheduler.js";

// ─── Redis Connection ───────────────────────────────────
const Redis = (IORedis as any).default || IORedis;

let isWorkerRedisOffline = false;

const connection = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: null, // Required by BullMQ
  enableOfflineQueue: false,
  retryStrategy(times: number) {
    if (times > 2) {
      isWorkerRedisOffline = true;
      return null; // Stop reconnecting and run quietly
    }
    return 100;
  },
});

connection.on("connect", () => {
  isWorkerRedisOffline = false;
  logger.info("Worker Redis connected successfully");
});

connection.on("error", (err: any) => {
  if (err.code === "ECONNREFUSED" || err.message?.includes("ECONNREFUSED")) {
    if (!isWorkerRedisOffline) {
      isWorkerRedisOffline = true;
      logger.warn("⚠️ Worker Redis connection refused. Operating worker in Quiet Offline/Idle mode.");
    }
  } else {
    logger.error({ err }, "Worker Redis error");
  }
});


// ─── Task Worker ─────────────────────────────────────────
const worker = new Worker(
  "tasks",
  async (job: Job) => {
    logger.info(
      { jobId: job.id, taskId: job.data.taskId, attempt: job.attemptsMade + 1 },
      "Processing job"
    );

    return processToolExecution(job);
  },
  {
    connection,
    concurrency: 3, // Process 3 tasks at a time (tune for Oracle Cloud 4 OCPUs)
    limiter: {
      max: 10,
      duration: 60000, // Max 10 jobs per minute (rate limit the Brain)
    },
    removeOnComplete: { count: 1000 }, // Keep last 1000 completed
    removeOnFail: { count: 500 },      // Keep last 500 failed
  }
);

// ─── Worker Events ───────────────────────────────────────
worker.on("completed", (job) => {
  logger.info({ jobId: job.id, taskId: job.data.taskId }, "Job completed");
});

worker.on("failed", (job, err) => {
  logger.error(
    { jobId: job?.id, taskId: job?.data?.taskId, err: err.message },
    "Job failed"
  );
});

worker.on("stalled", (jobId) => {
  logger.warn({ jobId }, "Job stalled");
});

worker.on("error", (err) => {
  logger.error({ err }, "Worker error");
});

// ─── Graceful Shutdown ───────────────────────────────────
async function shutdown(signal: string) {
  logger.info({ signal }, "Shutting down worker...");

  stopTunnelMonitor();
  stopHealthScheduler();

  await worker.close();
  await connection.quit();
  await prisma.$disconnect();

  logger.info("Worker shutdown complete");
  process.exit(0);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

// ─── Start ───────────────────────────────────────────────
logger.info(
  { concurrency: 3, queue: "tasks" },
  "🔧 Webness Worker started"
);

// Start tunnel monitor (checks brain connectivity every 30s)
  startTunnelMonitor();
  // Start health scores telemetry updates (runs every 60s)
  startHealthScheduler();
