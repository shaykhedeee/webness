import { Router } from "express";
import type { Request, Response } from "express";
import { prisma } from "@webness/db";
import { authenticate } from "../middleware/auth.js";
import { SSE_EVENTS } from "@webness/shared";
import { logger } from "../utils/logger.js";
import IORedis from "ioredis";

export const streamRoutes = Router();

// In-memory SSE connections per task
const connections = new Map<string, Set<Response>>();
const Redis = (IORedis as any).default || IORedis;
const SSE_CHANNEL = "webness:sse";
let redisSubscriberStarted = false;

/**
 * GET /api/stream?taskId=xxx
 * SSE endpoint for real-time task progress
 */
streamRoutes.get("/", authenticate, async (req: Request, res: Response) => {
  const taskId = req.query.taskId as string;

  if (!taskId) {
    return res.status(400).json({ success: false, error: "taskId required" });
  }

  // Verify task belongs to user's org
  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      ...(req.user!.role !== "SUPER_ADMIN"
        ? { orgId: req.user!.orgId }
        : {}),
    },
  });

  if (!task) {
    return res.status(404).json({ success: false, error: "Task not found" });
  }

  // ---- SSE Setup ----
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no", // Nginx: disable buffering
  });

  // Send initial connection event
  res.write(
    `event: connected\ndata: ${JSON.stringify({ taskId, status: task.status })}\n\n`
  );

  // Register connection
  if (!connections.has(taskId)) {
    connections.set(taskId, new Set());
  }
  connections.get(taskId)!.add(res);

  logger.info({ taskId }, "SSE client connected");

  // Heartbeat every 30s to keep connection alive
  const heartbeat = setInterval(() => {
    res.write(": heartbeat\n\n");
  }, 30000);

  // Clean up on disconnect
  req.on("close", () => {
    clearInterval(heartbeat);
    connections.get(taskId)?.delete(res);
    if (connections.get(taskId)?.size === 0) {
      connections.delete(taskId);
    }
    logger.info({ taskId }, "SSE client disconnected");
  });
});

/**
 * Broadcast an SSE event to all connected clients for a task
 * Called by the Worker when job progress updates arrive
 */
export function broadcastSSE(
  taskId: string,
  event: string,
  data: Record<string, unknown>
): void {
  const clients = connections.get(taskId);
  if (!clients || clients.size === 0) return;

  const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;

  for (const client of clients) {
    try {
      client.write(message);
    } catch (err) {
      logger.error({ err, taskId, event }, "Failed to send SSE event");
      clients.delete(client);
    }
  }
}

export function startSSEPubSub(): void {
  if (redisSubscriberStarted) return;
  redisSubscriberStarted = true;

  let isSubscriberOffline = false;

  const subscriber = new Redis(
    process.env.REDIS_URL || "redis://localhost:6379",
    {
      enableOfflineQueue: false, // Fail fast if disconnected
      retryStrategy(times: number) {
        if (times > 2) {
          isSubscriberOffline = true;
          return null; // Stop reconnecting and operate quietly
        }
        return 100;
      },
    }
  );

  subscriber.on("connect", () => {
    isSubscriberOffline = false;
    logger.info("SSE Redis subscriber connected successfully");
  });

  subscriber.on("error", (err: any) => {
    if (err.code === "ECONNREFUSED" || err.message?.includes("ECONNREFUSED")) {
      if (!isSubscriberOffline) {
        isSubscriberOffline = true;
        logger.warn("⚠️ SSE Redis subscriber connection refused. Operating API in Quiet Local SSE mode.");
      }
    } else {
      logger.error({ err }, "SSE Redis subscriber error");
    }
  });

  subscriber
    .subscribe(SSE_CHANNEL)
    .then(() => logger.info({ channel: SSE_CHANNEL }, "SSE Redis subscriber ready"))
    .catch((err: any) => {
      if (!isSubscriberOffline) {
        logger.error({ err, channel: SSE_CHANNEL }, "Failed to subscribe to SSE channel");
      }
    });

  subscriber.on("message", (_channel: string, message: string) => {
    try {
      const payload = JSON.parse(message) as {
        taskId: string;
        event: string;
        data: Record<string, unknown>;
      };
      // Prevent duplicate broadcasts if already handled locally
      broadcastSSE(payload.taskId, payload.event, payload.data);
    } catch (err) {
      logger.error({ err }, "Invalid SSE Redis message");
    }
  });
}


/**
 * GET /api/stream/system
 * SSE endpoint for system-wide status (admin dashboard)
 */
streamRoutes.get("/system", authenticate, async (req: Request, res: Response) => {
  if (req.user!.role !== "SUPER_ADMIN") {
    return res.status(403).json({ success: false, error: "Admin only" });
  }

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });

  // Send system status every 10 seconds
  const sendStatus = async () => {
    try {
      const [queuedCount, activeCount] = await Promise.all([
        prisma.task.count({ where: { status: "QUEUED" } }),
        prisma.task.count({ where: { status: "PROCESSING" } }),
      ]);

      const data = {
        queueDepth: queuedCount,
        activeJobs: activeCount,
        timestamp: new Date().toISOString(),
      };

      res.write(
        `event: ${SSE_EVENTS.SYSTEM_STATUS}\ndata: ${JSON.stringify(data)}\n\n`
      );
    } catch {
      // Silently ignore errors during status broadcast
    }
  };

  await sendStatus();
  const interval = setInterval(sendStatus, 10000);

  req.on("close", () => {
    clearInterval(interval);
  });
});
