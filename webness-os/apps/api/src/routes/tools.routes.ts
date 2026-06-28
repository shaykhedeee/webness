import { Router } from "express";
import { prisma } from "@webness/db";
import { authenticate } from "../middleware/auth.js";
import { tenantScope } from "../middleware/tenant.js";
import { optionalAuth } from "../middleware/auth.js";
import { taskQueue } from "../utils/queue.js";

export const toolsRoutes = Router();

/**
 * GET /api/tools
 * List all available tools (public — shows catalog)
 */
toolsRoutes.get("/", optionalAuth, async (req, res, next) => {
  try {
    const tools = await prisma.tool.findMany({
      where: { isActive: true },
      orderBy: { creditCost: "asc" },
    });

    // If user is authenticated, show which tools they have access to
    const userPlan = req.user
      ? (
          await prisma.organization.findUnique({
            where: { id: req.user.orgId },
          })
        )?.plan || "FREE"
      : "FREE";

    const planHierarchy = ["FREE", "STARTER", "PRO", "ENTERPRISE", "SAASS"];
    const userPlanIndex = planHierarchy.indexOf(userPlan);

    const enrichedTools = tools.map((tool: any) => ({
      id: tool.id,
      slug: tool.slug,
      name: tool.name,
      description: tool.description,
      category: tool.category,
      creditCost: tool.creditCost,
      isFree: tool.isFree,
      minPlan: tool.minPlan,
      estimatedSeconds: tool.estimatedSeconds,
      icon: tool.icon,
      version: tool.version,
      inputSchema: tool.inputSchema,
      hasAccess:
        tool.isFree ||
        userPlanIndex >= planHierarchy.indexOf(tool.minPlan),
      accessible:
        tool.isFree ||
        userPlanIndex >= planHierarchy.indexOf(tool.minPlan),
    }));

    res.json({ success: true, data: enrichedTools });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/tools/:slug/execute
 * Execute a tool — creates a BullMQ job
 */
toolsRoutes.post(
  "/:slug/execute",
  authenticate,
  tenantScope,
  async (req, res, next) => {
    try {
      const slug = req.params.slug as string;
      const { input, priority } = req.body;

      // Find tool
      const tool = await prisma.tool.findUnique({ where: { slug } });
      if (!tool || !tool.isActive) {
        return res.status(404).json({
          success: false,
          error: `Tool "${slug}" not found or inactive`,
        });
      }

      // Check plan access
      const org = await prisma.organization.findUnique({
        where: { id: req.user!.orgId },
        include: { creditWallet: true },
      });

      if (!org) {
        return res
          .status(404)
          .json({ success: false, error: "Organization not found" });
      }

      // Check credits
      const wallet = org.creditWallet;
      if (!wallet || wallet.balance < tool.creditCost) {
        return res.status(402).json({
          success: false,
          error: `Insufficient credits. Need ${tool.creditCost}, have ${wallet?.balance || 0}`,
        });
      }

      // Create task
      const task = await prisma.task.create({
        data: {
          orgId: req.user!.orgId,
          userId: req.user!.id,
          toolId: tool.id,
          status: "QUEUED",
          priority: priority || 5,
          inputData: input || {},
          creditCost: tool.creditCost,
        },
      });

      // Deduct credits
      await prisma.$transaction([
        prisma.creditWallet.update({
          where: { id: wallet.id },
          data: { balance: { decrement: tool.creditCost } },
        }),
        prisma.creditTransaction.create({
          data: {
            walletId: wallet.id,
            userId: req.user!.id,
            amount: -tool.creditCost,
            balance: wallet.balance - tool.creditCost,
            type: "USAGE",
            taskId: task.id,
            metadata: { tool: slug as string },
          },
        }),
      ]);

      await taskQueue.add(
        "tool.execute",
        { taskId: task.id },
        {
          priority: priority || 5,
          jobId: task.id,
        }
      );

      res.status(201).json({
        success: true,
        data: {
          taskId: task.id,
          status: "QUEUED",
          creditCost: tool.creditCost,
          estimatedSeconds: tool.estimatedSeconds,
          streamUrl: `/api/stream?taskId=${task.id}`,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/tools/:slug/schema
 * Get input/output schema for a tool
 */
toolsRoutes.get("/:slug/schema", async (req, res, next) => {
  try {
    const tool = await prisma.tool.findUnique({
      where: { slug: req.params.slug },
    });

    if (!tool) {
      return res
        .status(404)
        .json({ success: false, error: "Tool not found" });
    }

    res.json({
      success: true,
      data: {
        slug: tool.slug,
        name: tool.name,
        inputSchema: tool.inputSchema,
        outputSchema: tool.outputSchema,
      },
    });
  } catch (err) {
    next(err);
  }
});
