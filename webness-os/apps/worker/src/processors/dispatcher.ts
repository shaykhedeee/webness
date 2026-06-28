import type { Job } from "bullmq";
import { prisma } from "@webness/db";
import { sendToBrain, getBrainCircuitStats } from "../utils/circuit-breaker.js";
import { executeCloudTool } from "../utils/ai-cloud-runner.js";
import { logger } from "../utils/logger.js";
import IORedis from "ioredis";

const Redis = (IORedis as any).default || IORedis;

interface TaskJobData {
  taskId: string;
}

// SSE broadcast via Redis pub/sub (API server subscribes)
let isPublisherOffline = false;

const publisher = new Redis(
  process.env.REDIS_URL || "redis://localhost:6379",
  {
    enableOfflineQueue: false, // Fail fast if disconnected
    retryStrategy(times: number) {
      if (times > 2) {
        isPublisherOffline = true;
        return null; // Stop reconnecting and operate quietly
      }
      return 100;
    },
  }
);

publisher.on("connect", () => {
  isPublisherOffline = false;
  logger.info("Worker Redis Publisher connected successfully");
});

publisher.on("error", (err: any) => {
  if (err.code === "ECONNREFUSED" || err.message?.includes("ECONNREFUSED")) {
    if (!isPublisherOffline) {
      isPublisherOffline = true;
      logger.warn("⚠️ Worker Redis Publisher connection refused. Operating in Quiet Offline/Local-only mode.");
    }
  } else {
    logger.error({ err }, "Worker Redis Publisher error");
  }
});

const SSE_CHANNEL = "webness:sse";

function broadcastEvent(taskId: string, event: string, data: Record<string, unknown>) {
  if (!isPublisherOffline) {
    publisher
      .publish(SSE_CHANNEL, JSON.stringify({ taskId, event, data }))
      .catch(() => {}); // Catch silently
  }
}


/**
 * Main dispatcher: processes a tool execution job
 *
 * Flow:
 * 1. Load task from DB
 * 2. Mark as PROCESSING
 * 3. Send to Brain via circuit breaker
 * 4. Create task steps as brain reports progress
 * 5. Store results + mark COMPLETED / FAILED
 * 6. Broadcast SSE events
 */
export async function processToolExecution(job: Job<TaskJobData>): Promise<void> {
  const { taskId } = job.data;

  // ─── 1. Load Task ──────────────────────────────────────
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { tool: true, org: true },
  });

  if (!task) {
    logger.error({ taskId }, "Task not found");
    throw new Error(`Task ${taskId} not found`);
  }

  if (task.status !== "QUEUED") {
    logger.warn({ taskId, status: task.status }, "Task not in QUEUED state, skipping");
    return;
  }

  // ─── 2. Mark Processing ────────────────────────────────
  await prisma.task.update({
    where: { id: taskId },
    data: { status: "PROCESSING", startedAt: new Date() },
  });

  broadcastEvent(taskId, "task:started", {
    taskId,
    tool: task.tool.slug,
    status: "PROCESSING",
  });

  try {
    // ─── 3. Check Cloud Fallback and Circuit Breaker ───────
    const isCloudMode = process.env.CLOUD_FALLBACK === "true";
    const circuitStats = getBrainCircuitStats();

    if (isCloudMode || circuitStats.state === "open") {
      logger.info({ taskId, tool: task.tool.slug }, "⛅ Routing task execution directly to Cloud API Fallback Runner...");
      
      await job.updateProgress(20);
      
      const cloudResult = await executeCloudTool(
        taskId,
        task.tool.slug,
        task.inputData as Record<string, any>,
        task.orgId
      );
      
      const currentTask = await prisma.task.findUnique({
        where: { id: taskId },
        select: { status: true },
      });
      
      if (currentTask?.status === "WAITING_INPUT") {
        await job.updateProgress(50);
        return;
      }
      
      await prisma.task.update({
        where: { id: taskId },
        data: {
          status: "COMPLETED",
          outputData: cloudResult as any,
          completedAt: new Date(),
        },
      });

      broadcastEvent(taskId, "task:completed", {
        taskId,
        status: "COMPLETED",
        outputData: cloudResult,
      });

      await job.updateProgress(100);
      return;
    }

    // ─── 4. Create "Thinking" Step ─────────────────────────
    const thinkingStep = await prisma.taskStep.create({
      data: {
        taskId,
        action: "THINKING",
        description: `Routing to ${task.tool.name}...`,
        status: "SUCCESS",
      },
    });

    broadcastEvent(taskId, "step:created", {
      taskId,
      stepId: thinkingStep.id,
      action: "THINKING",
      description: thinkingStep.description,
    });

    // ─── 5. Send to Brain ──────────────────────────────────
    const brainStep = await prisma.taskStep.create({
      data: {
        taskId,
        action: "TOOL_CALL",
        description: `Executing ${task.tool.name} on Local Brain...`,
        status: "RUNNING",
      },
    });

    broadcastEvent(taskId, "step:created", {
      taskId,
      stepId: brainStep.id,
      action: "TOOL_CALL",
      description: brainStep.description,
    });

    // Update job progress for BullMQ dashboard
    await job.updateProgress(30);

    const brainResult = await sendToBrain(
      task.tool.slug,
      task.inputData as Record<string, unknown>,
      taskId
    );

    const currentTask = await prisma.task.findUnique({
      where: { id: taskId },
      select: { status: true },
    });
    
    if (currentTask?.status === "WAITING_INPUT") {
      await job.updateProgress(50);
      return;
    }

    await job.updateProgress(80);

    // ─── 6. Process Result ─────────────────────────────────
    await prisma.taskStep.update({
      where: { id: brainStep.id },
      data: { status: "SUCCESS", outputData: brainResult.data },
    });

    broadcastEvent(taskId, "step:updated", {
      taskId,
      stepId: brainStep.id,
      status: "SUCCESS",
    });

    // Create result step
    const resultStep = await prisma.taskStep.create({
      data: {
        taskId,
        action: "RESULT",
        description: "Task completed successfully",
        status: "SUCCESS",
        outputData: brainResult.data,
      },
    });

    broadcastEvent(taskId, "step:created", {
      taskId,
      stepId: resultStep.id,
      action: "RESULT",
      description: resultStep.description,
    });

    // ─── 7. Mark Task Complete ─────────────────────────────
    await prisma.task.update({
      where: { id: taskId },
      data: {
        status: "COMPLETED",
        outputData: brainResult.data,
        completedAt: new Date(),
      },
    });

    await job.updateProgress(100);

    broadcastEvent(taskId, "task:completed", {
      taskId,
      status: "COMPLETED",
      outputData: brainResult.data,
    });

    logger.info(
      { taskId, tool: task.tool.slug, org: task.org.slug },
      "Task completed successfully"
    );
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";

    // ─── Handle Failure ────────────────────────────────────
    await prisma.task.update({
      where: { id: taskId },
      data: {
        status: "FAILED",
        error: errorMessage,
        completedAt: new Date(),
      },
    });

    await prisma.taskStep.create({
      data: {
        taskId,
        action: "ERROR",
        description: `Task failed: ${errorMessage}`,
        status: "FAILED",
        outputData: { error: errorMessage },
      },
    });

    broadcastEvent(taskId, "task:failed", {
      taskId,
      status: "FAILED",
      error: errorMessage,
    });

    logger.error(
      { taskId, tool: task.tool.slug, err: errorMessage },
      "Task failed"
    );

    // Re-throw so BullMQ handles retries
    throw err;
  }
}
