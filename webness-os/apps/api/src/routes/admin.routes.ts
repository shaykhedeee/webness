import { Router } from "express";
import type { Request, Response } from "express";
import { prisma } from "@webness/db";
import { authenticate } from "../middleware/auth.js";
import { requireSuperAdmin } from "../middleware/rbac.js";
import { auditLog } from "../middleware/auditLog.js";
import { adjustCreditsSchema, manualPaymentSchema, paginationSchema } from "../utils/validators.js";
import { logger } from "../utils/logger.js";
import Redis from "ioredis";

export const adminRoutes = Router();

// All admin routes require authentication + SUPER_ADMIN
adminRoutes.use(authenticate, requireSuperAdmin);

// ────────────────────────────────────────────
// CLIENTS
// ────────────────────────────────────────────

/**
 * GET /api/admin/clients
 * List all client organizations with summary metrics
 */
adminRoutes.get("/clients", async (req: Request, res: Response) => {
  const { page, limit } = paginationSchema.parse(req.query);
  const search = (req.query.search as string) || "";
  const plan = req.query.plan as string | undefined;

  const where = {
    ...(search ? { name: { contains: search, mode: "insensitive" as const } } : {}),
    ...(plan ? { plan: plan as any } : {}),
  };

  const [orgs, total] = await Promise.all([
    prisma.organization.findMany({
      where,
      include: {
        _count: { select: { users: true, tasks: true } },
        creditWallet: { select: { balance: true } },
        healthScores: { select: { overallScore: true, measuredAt: true }, orderBy: { measuredAt: "desc" }, take: 1 },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.organization.count({ where }),
  ]);

  const clients = orgs.map((org: any) => ({
    id: org.id,
    name: org.name,
    slug: org.slug,
    plan: org.plan,
    domain: org.domain,
    isActive: org.isActive,
    createdAt: org.createdAt,
    userCount: org._count.users,
    taskCount: org._count.tasks,
    creditBalance: org.creditWallet?.balance ?? 0,
    healthScore: org.healthScores?.[0]?.overallScore ?? null,
    healthUpdatedAt: org.healthScores?.[0]?.measuredAt ?? null,
  }));

  return res.json({
    success: true,
    data: clients,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

/**
 * GET /api/admin/clients/:id
 * Detailed client view with all related data
 */
adminRoutes.get("/clients/:id", async (req: Request, res: Response) => {
  const org = await prisma.organization.findUnique({
    where: { id: req.params.id as string },
    include: {
      users: {
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          lastLoginAt: true,
          createdAt: true,
        },
      },
      creditWallet: true,
      tasks: {
        orderBy: { createdAt: "desc" as const },
        take: 20,
        include: {
          tool: { select: { name: true, slug: true } },
        },
      },
      healthScores: { orderBy: { measuredAt: "desc" as const }, take: 5 },
      whatsappAccounts: {
        select: {
          id: true,
          phoneNumber: true,
          displayName: true,
          isActive: true,
        },
      },
      apiKeys: {
        select: {
          id: true,
          name: true,
          lastUsedAt: true,
          expiresAt: true,
          createdAt: true,
        },
      },
    },
  });

  if (!org) {
    return res.status(404).json({ success: false, error: "Client not found" });
  }

  return res.json({ success: true, data: org });
});

/**
 * PATCH /api/admin/clients/:id
 * Update client organization (plan, active status, domain, etc.)
 */
adminRoutes.patch("/clients/:id", auditLog("update", "client"), async (req: Request, res: Response) => {
  const { plan, isActive, domain } = req.body;

  const org = await prisma.organization.update({
    where: { id: req.params.id as string },
    data: {
      ...(plan !== undefined ? { plan } : {}),
      ...(isActive !== undefined ? { isActive } : {}),
      ...(domain !== undefined ? { domain } : {}),
    },
  });

  logger.info(
    { orgId: org.id, plan, isActive, domain },
    "Client updated by admin"
  );

  return res.json({ success: true, data: org });
});

// ────────────────────────────────────────────
// CREDITS & PAYMENTS
// ────────────────────────────────────────────

/**
 * POST /api/admin/credits/adjust
 * Manually adjust credits for a client (add/deduct)
 */
adminRoutes.post("/credits/adjust", auditLog("adjust", "credits"), async (req: Request, res: Response) => {
  const { orgId, amount, reason } = adjustCreditsSchema.parse(req.body);

  const result = await prisma.$transaction(async (tx: any) => {
    const wallet = await tx.creditWallet.findUnique({
      where: { orgId },
    });

    if (!wallet) {
      throw Object.assign(new Error("Wallet not found"), { statusCode: 404 });
    }

    const newBalance = wallet.balance + amount;
    if (newBalance < 0) {
      throw Object.assign(new Error("Cannot make balance negative"), {
        statusCode: 400,
      });
    }

    const updated = await tx.creditWallet.update({
      where: { orgId },
      data: { balance: newBalance },
    });

    await tx.creditTransaction.create({
      data: {
        walletId: wallet.id,
        type: amount > 0 ? "ADMIN_GRANT" : "ADMIN_DEDUCT",
        amount,
        balance: newBalance,
        description: reason || `Admin adjustment by ${req.user!.email}`,
      },
    });

    return updated;
  });

  logger.info(
    { orgId, amount, reason, admin: req.user!.email },
    "Credits adjusted by admin"
  );

  return res.json({
    success: true,
    data: { balance: result.balance },
  });
});

/**
 * POST /api/admin/payments/manual
 * Record a manual payment (bank transfer, UPI, cash, etc.)
 */
adminRoutes.post("/payments/manual", auditLog("record", "payment"), async (req: Request, res: Response) => {
  const { orgId, amount, credits, method, reference, notes } =
    manualPaymentSchema.parse(req.body);

  const result = await prisma.$transaction(async (tx: any) => {
    const wallet = await tx.creditWallet.findUnique({
      where: { orgId },
    });

    if (!wallet) {
      throw Object.assign(new Error("Wallet not found"), { statusCode: 404 });
    }

    const newBalance = wallet.balance + credits;

    const updated = await tx.creditWallet.update({
      where: { orgId },
      data: { balance: newBalance },
    });

    await tx.creditTransaction.create({
      data: {
        walletId: wallet.id,
        type: "PURCHASE",
        amount: credits,
        balance: newBalance,
        description: `Manual payment: ₹${amount} via ${method}${reference ? ` (ref: ${reference})` : ""}${notes ? ` — ${notes}` : ""}`,
      },
    });

    return { wallet: updated, creditsAdded: credits };
  });

  logger.info(
    { orgId, amount, credits, method, reference, admin: req.user!.email },
    "Manual payment recorded"
  );

  return res.json({
    success: true,
    data: {
      balance: result.wallet.balance,
      creditsAdded: result.creditsAdded,
    },
  });
});

// ────────────────────────────────────────────
// SYSTEM HEALTH
// ────────────────────────────────────────────

/**
 * GET /api/admin/system/health
 * Comprehensive system health dashboard data
 */
adminRoutes.get("/system/health", async (_req: Request, res: Response) => {
  const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

  try {
    const [
      dbCheck,
      redisInfo,
      totalOrgs,
      activeOrgs,
      totalUsers,
      totalTasks,
      queuedTasks,
      processingTasks,
      failedTasks,
      todayTasks,
    ] = await Promise.all([
      prisma.$queryRaw`SELECT 1 as ok`.then(() => true).catch(() => false),
      redis.info("memory").catch(() => null),
      prisma.organization.count(),
      prisma.organization.count({ where: { isActive: true } }),
      prisma.user.count(),
      prisma.task.count(),
      prisma.task.count({ where: { status: "QUEUED" } }),
      prisma.task.count({ where: { status: "PROCESSING" } }),
      prisma.task.count({ where: { status: "FAILED" } }),
      prisma.task.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
    ]);

    // Parse Redis memory info
    let redisMemory = "unknown";
    if (redisInfo) {
      const match = redisInfo.match(/used_memory_human:(.+)/);
      if (match) redisMemory = match[1].trim();
    }

    // Check brain status
    let brainStatus = "offline";
    let brainModels: string[] = [];
    try {
      const brainResponse = await fetch(
        `${process.env.BRAIN_URL || "http://localhost:8000"}/health`,
        {
          headers: { "X-Webness-Key": process.env.BRAIN_API_KEY || "" },
          signal: AbortSignal.timeout(5000),
        }
      );
      if (brainResponse.ok) {
        const brainData = (await brainResponse.json()) as {
          status: string;
          loaded_models?: string[];
        };
        brainStatus = brainData.status || "online";
        brainModels = brainData.loaded_models || [];
      }
    } catch {
      brainStatus = "offline";
    }

    return res.json({
      success: true,
      data: {
        database: { connected: dbCheck },
        redis: { connected: !!redisInfo, memory: redisMemory },
        brain: { status: brainStatus, models: brainModels },
        organizations: { total: totalOrgs, active: activeOrgs },
        users: { total: totalUsers },
        tasks: {
          total: totalTasks,
          today: todayTasks,
          queued: queuedTasks,
          processing: processingTasks,
          failed: failedTasks,
        },
      },
    });
  } finally {
    await redis.quit();
  }
});

// ────────────────────────────────────────────
// REVENUE & ANALYTICS
// ────────────────────────────────────────────

/**
 * GET /api/admin/analytics/revenue
 * Revenue and credit usage analytics
 */
adminRoutes.get("/analytics/revenue", async (req: Request, res: Response) => {
  const days = parseInt(req.query.days as string) || 30;
  const since = new Date();
  since.setDate(since.getDate() - days);

  const [
    totalCreditsIssued,
    totalCreditsUsed,
    recentTransactions,
    topTools,
    planDistribution,
  ] = await Promise.all([
    // Total credits issued (purchases + admin grants)
    prisma.creditTransaction.aggregate({
      where: {
        type: { in: ["PURCHASE", "ADMIN_GRANT", "WELCOME_BONUS"] },
        createdAt: { gte: since },
      },
      _sum: { amount: true },
    }),
    // Total credits consumed
    prisma.creditTransaction.aggregate({
      where: {
        type: "USAGE",
        createdAt: { gte: since },
      },
      _sum: { amount: true },
    }),
    // Recent large transactions
    prisma.creditTransaction.findMany({
      where: { createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        wallet: {
          include: { org: { select: { name: true, slug: true } } },
        },
      },
    }),
    // Most used tools
    prisma.task.groupBy({
      by: ["toolId"],
      where: { createdAt: { gte: since } },
      _count: true,
      orderBy: { _count: { toolId: "desc" } },
      take: 10,
    }),
    // Plan distribution
    prisma.organization.groupBy({
      by: ["plan"],
      _count: true,
    }),
  ]);

  // Resolve tool names
  const toolIds = topTools.map((t: any) => t.toolId);
  const tools = await prisma.tool.findMany({
    where: { id: { in: toolIds } },
    select: { id: true, name: true, slug: true },
  });
  const toolMap = new Map(tools.map((t: any) => [t.id, t]));

  return res.json({
    success: true,
    data: {
      period: { days, since: since.toISOString() },
      credits: {
        issued: totalCreditsIssued._sum.amount ?? 0,
        consumed: Math.abs(totalCreditsUsed._sum.amount ?? 0),
      },
      topTools: topTools.map((t: any) => ({
        tool: toolMap.get(t.toolId) ?? { name: "Unknown" },
        usage: t._count,
      })),
      planDistribution: planDistribution.map((p: any) => ({
        plan: p.plan,
        count: p._count,
      })),
      recentTransactions: recentTransactions.slice(0, 20),
    },
  });
});

// ────────────────────────────────────────────
// TASK QUEUE MANAGEMENT
// ────────────────────────────────────────────

/**
 * GET /api/admin/tasks
 * View all tasks with filtering
 */
adminRoutes.get("/tasks", async (req: Request, res: Response) => {
  const { page, limit } = paginationSchema.parse(req.query);
  const status = req.query.status as string | undefined;
  const orgId = req.query.orgId as string | undefined;

  const where = {
    ...(status ? { status: status as any } : {}),
    ...(orgId ? { orgId } : {}),
  };

  const [tasks, total] = await Promise.all([
    prisma.task.findMany({
      where,
      include: {
        tool: { select: { name: true, slug: true } },
        org: { select: { name: true, slug: true } },
        user: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.task.count({ where }),
  ]);

  return res.json({
    success: true,
    data: tasks,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

/**
 * POST /api/admin/tasks/:id/retry
 * Retry a failed task
 */
adminRoutes.post("/tasks/:id/retry", auditLog("retry", "task"), async (req: Request, res: Response) => {
  const task = await prisma.task.findUnique({
    where: { id: req.params.id as string },
  });

  if (!task) {
    return res.status(404).json({ success: false, error: "Task not found" });
  }

  if (task.status !== "FAILED") {
    return res.status(400).json({
      success: false,
      error: "Only failed tasks can be retried",
    });
  }

  // Reset task status
  await prisma.task.update({
    where: { id: task.id },
    data: { status: "QUEUED", error: null },
  });

  // Re-queue via BullMQ
  const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");
  try {
    const { Queue } = await import("bullmq");
    const taskQueue = new Queue("tasks", { connection: redis });
    await taskQueue.add(
      "execute-tool",
      { taskId: task.id },
      {
        jobId: `retry-${task.id}`,
        attempts: 2,
        backoff: { type: "exponential", delay: 3000 },
      }
    );
    await taskQueue.close();
  } finally {
    await redis.quit();
  }

  logger.info(
    { taskId: task.id, admin: req.user!.email },
    "Task retried by admin"
  );

  return res.json({ success: true, data: { taskId: task.id, status: "QUEUED" } });
});

/**
 * POST /api/admin/tasks/:id/cancel
 * Cancel a queued/processing task
 */
adminRoutes.post("/tasks/:id/cancel", auditLog("cancel", "task"), async (req: Request, res: Response) => {
  const task = await prisma.task.findUnique({
    where: { id: req.params.id as string },
  });

  if (!task) {
    return res.status(404).json({ success: false, error: "Task not found" });
  }

  if (!["QUEUED", "PROCESSING"].includes(task.status)) {
    return res.status(400).json({
      success: false,
      error: "Only queued or processing tasks can be cancelled",
    });
  }

  await prisma.task.update({
    where: { id: task.id },
    data: { status: "FAILED", error: "Cancelled by admin" },
  });

  logger.info(
    { taskId: task.id, admin: req.user!.email },
    "Task cancelled by admin"
  );

  return res.json({ success: true, data: { taskId: task.id, status: "CANCELLED" } });
});

// ────────────────────────────────────────────
// AI BRAIN MANAGEMENT
// ────────────────────────────────────────────

/**
 * GET /api/admin/brain/status
 * Check brain connection and loaded models
 */
adminRoutes.get("/brain/status", async (_req: Request, res: Response) => {
  try {
    const brainUrl = process.env.BRAIN_URL || "http://localhost:8000";
    const response = await fetch(`${brainUrl}/health`, {
      headers: { "X-Webness-Key": process.env.BRAIN_API_KEY || "" },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return res.json({
        success: true,
        data: { status: "error", httpStatus: response.status },
      });
    }

    const data = await response.json();
    return res.json({ success: true, data });
  } catch (err) {
    return res.json({
      success: true,
      data: { status: "offline", error: (err as Error).message },
    });
  }
});

/**
 * POST /api/admin/brain/swap-model
 * Hot-swap the currently loaded model on the local brain
 */
adminRoutes.post("/brain/swap-model", auditLog("swap_model", "brain"), async (req: Request, res: Response) => {
  const { model } = req.body;

  if (!model || typeof model !== "string") {
    return res.status(400).json({ success: false, error: "model name required" });
  }

  try {
    const brainUrl = process.env.BRAIN_URL || "http://localhost:8000";
    const response = await fetch(`${brainUrl}/swap-model`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webness-Key": process.env.BRAIN_API_KEY || "",
      },
      body: JSON.stringify({ model }),
      signal: AbortSignal.timeout(30000), // Model loading can take time
    });

    const data = await response.json();

    logger.info(
      { model, admin: req.user!.email },
      "Model swap requested by admin"
    );

    return res.json({ success: true, data });
  } catch (err) {
    return res.status(502).json({
      success: false,
      error: `Brain unreachable: ${(err as Error).message}`,
    });
  }
});

// ────────────────────────────────────────────
// API KEY MANAGEMENT (per client)
// ────────────────────────────────────────────

/**
 * GET /api/admin/api-keys
 * List all API keys across all organizations
 */
adminRoutes.get("/api-keys", async (_req: Request, res: Response) => {
  const keys = await prisma.apiKey.findMany({
    include: {
      org: { select: { name: true, slug: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  // Never return the hashed key
  const sanitized = keys.map(({ hashedKey, ...rest }: any) => rest);

  return res.json({ success: true, data: sanitized });
});

/**
 * DELETE /api/admin/api-keys/:id
 * Revoke an API key
 */
adminRoutes.delete("/api-keys/:id", auditLog("revoke", "api_key"), async (req: Request, res: Response) => {
  const key = await prisma.apiKey.findUnique({
    where: { id: req.params.id as string },
  });

  if (!key) {
    return res.status(404).json({ success: false, error: "API key not found" });
  }

  await prisma.apiKey.delete({ where: { id: key.id } });

  logger.info(
    { keyId: key.id, keyName: key.name, admin: req.user!.email },
    "API key revoked by admin"
  );

  return res.json({ success: true, message: "API key revoked" });
});

// ────────────────────────────────────────────
// AUDIT LOG VIEWER
// ────────────────────────────────────────────

/**
 * GET /api/admin/audit-log
 * View audit log entries
 */
adminRoutes.get("/audit-log", async (req: Request, res: Response) => {
  const { page, limit } = paginationSchema.parse(req.query);
  const userId = req.query.userId as string | undefined;
  const action = req.query.action as string | undefined;
  const resource = req.query.resource as string | undefined;

  const where = {
    ...(userId ? { userId } : {}),
    ...(action ? { action: { contains: action, mode: "insensitive" as const } } : {}),
    ...(resource ? { resource: { contains: resource, mode: "insensitive" as const } } : {}),
  };

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: {
        user: { select: { name: true, email: true, role: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return res.json({
    success: true,
    data: logs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});
