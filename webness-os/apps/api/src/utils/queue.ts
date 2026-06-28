import { Queue } from "bullmq";
import IORedis from "ioredis";
import { logger } from "./logger.js";
import { executeCloudTool } from "./ai-cloud-runner.js";
import { prisma } from "@webness/db";

const Redis = (IORedis as any).default || IORedis;

let isRedisOffline = false;

export const queueConnection = new Redis(
  process.env.REDIS_URL || "redis://localhost:6379",
  {
    maxRetriesPerRequest: null,
    enableOfflineQueue: false, // Fail fast if disconnected
    retryStrategy(times: number) {
      if (times > 2) {
        isRedisOffline = true;
        return null; // Stop reconnecting and trigger offline status
      }
      return 100; // retry quickly
    },
  }
);

queueConnection.on("connect", () => {
  isRedisOffline = false;
  logger.info("API Redis connected successfully");
});

queueConnection.on("error", (err: any) => {
  if (err.code === "ECONNREFUSED" || err.message?.includes("ECONNREFUSED")) {
    if (!isRedisOffline) {
      isRedisOffline = true;
      logger.warn("⚠️ Redis connection refused. Operating API in Quiet Offline/In-Memory mode.");
    }
  } else {
    logger.error({ err }, "API Redis error");
  }
});

const rawTaskQueue = new Queue("tasks", {
  connection: queueConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 500 },
  },
});

export const taskQueue = new Proxy(rawTaskQueue, {
  get(target, prop, receiver) {
    if (prop === "add") {
      return async (name: string, data: { taskId: string }, opts?: any) => {
        if (isRedisOffline) {
          logger.info({ taskId: data.taskId }, "⚡ [Redis Offline Fallback] Executing cloud tool task directly in-memory...");
          
          setTimeout(async () => {
            try {
              const task = await prisma.task.findUnique({
                where: { id: data.taskId },
                include: { tool: true },
              });

              if (!task) {
                logger.error({ taskId: data.taskId }, "[Offline Fallback] Task not found for in-memory execution");
                return;
              }

              await executeCloudTool(
                task.id,
                task.tool.slug,
                task.inputData as Record<string, any>,
                task.orgId
              );
              logger.info({ taskId: data.taskId }, "✅ [Offline Fallback] In-memory task execution complete!");
            } catch (err: any) {
              logger.error(
                { taskId: data.taskId, error: err.message },
                "❌ [Offline Fallback] In-memory task execution failed"
              );
            }
          }, 100);

          return { id: data.taskId, name, data, opts } as any;
        }

        try {
          return await Reflect.get(target, prop, receiver).call(target, name, data, opts);
        } catch (err: any) {
          logger.warn({ err: err.message }, "⚠️ Queue.add failed. Falling back to direct in-memory execution...");
          isRedisOffline = true;
          
          setTimeout(async () => {
            try {
              const task = await prisma.task.findUnique({
                where: { id: data.taskId },
                include: { tool: true },
              });
              if (task) {
                await executeCloudTool(
                  task.id,
                  task.tool.slug,
                  task.inputData as Record<string, any>,
                  task.orgId
                );
              }
            } catch (fallbackErr: any) {
              logger.error({ taskId: data.taskId, error: fallbackErr.message }, "❌ [Fallback Catch] Direct execution failed");
            }
          }, 100);

          return { id: data.taskId, name, data, opts } as any;
        }
      };
    }
    return Reflect.get(target, prop, receiver);
  },
});

