import { Router } from "express";
import { prisma } from "@webness/db";
import { authenticate } from "../middleware/auth.js";
import { tenantScope } from "../middleware/tenant.js";
import { paginationSchema } from "../utils/validators.js";
import { taskQueue } from "../utils/queue.js";

export const projectsRoutes = Router();

/**
 * GET /api/projects
 * List tasks for the authenticated org
 */
projectsRoutes.get("/", authenticate, tenantScope, async (req, res, next) => {
  try {
    const { page, limit } = paginationSchema.parse(req.query);
    const skip = (page - 1) * limit;

    const where =
      req.user!.role === "SUPER_ADMIN" && req.user!.orgId === "SYSTEM"
        ? {} // SUPER_ADMIN sees all
        : { orgId: req.user!.orgId };

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        include: {
          tool: { select: { name: true, slug: true, icon: true } },
          user: { select: { name: true, email: true } },
        },
        orderBy: { queuedAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.task.count({ where }),
    ]);

    res.json({
      success: true,
      data: tasks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/projects/:id
 * Get task details with steps
 */
projectsRoutes.get(
  "/:id",
  authenticate,
  tenantScope,
  async (req, res, next) => {
    try {
      const task = await prisma.task.findFirst({
        where: {
          id: req.params.id as string,
          ...(req.user!.role !== "SUPER_ADMIN"
            ? { orgId: req.user!.orgId }
            : {}),
        },
        include: {
          tool: true,
          user: { select: { name: true, email: true } },
          steps: {
            include: {
              agent: { select: { name: true, model: true } },
            },
            orderBy: { stepNumber: "asc" },
          },
        },
      });

      if (!task) {
        return res
          .status(404)
          .json({ success: false, error: "Task not found" });
      }

      res.json({ success: true, data: task });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/projects/:id/respond
 * Respond to clarifying questions for a task in WAITING_INPUT state
 */
projectsRoutes.post(
  "/:id/respond",
  authenticate,
  tenantScope,
  async (req, res, next) => {
    try {
      const id = req.params.id as string;
      const { answers } = req.body;

      if (!answers || typeof answers !== "object") {
        return res.status(400).json({
          success: false,
          error: "Answers object is required",
        });
      }

      const task = await prisma.task.findFirst({
        where: {
          id,
          orgId: req.user!.orgId,
        },
      });

      if (!task) {
        return res.status(404).json({
          success: false,
          error: "Task not found",
        });
      }

      if (task.status !== "WAITING_INPUT") {
        return res.status(400).json({
          success: false,
          error: `Task is not waiting for input (current status: ${task.status})`,
        });
      }

      // Merge answers into task inputData
      const currentInput = (task.inputData as Record<string, any>) || {};
      const updatedInput = {
        ...currentInput,
        hitlAnswers: {
          ...(currentInput.hitlAnswers || {}),
          ...answers,
        },
      };

      // Update task back to QUEUED to resume execution
      const updatedTask = await prisma.task.update({
        where: { id },
        data: {
          status: "QUEUED",
          inputData: updatedInput,
        },
      });

      // Re-enqueue in BullMQ
      await taskQueue.add(
        "tool.execute",
        { taskId: id },
        {
          priority: task.priority || 5,
          jobId: id,
        }
      );

      res.json({
        success: true,
        message: "Responses saved, task has been re-queued",
        data: updatedTask,
      });
    } catch (err) {
      next(err);
    }
  }
);

