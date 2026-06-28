import { Router } from "express";
import { prisma } from "@webness/db";
import { authenticate } from "../middleware/auth.js";
import { tenantScope } from "../middleware/tenant.js";
import { generateClientReportNarrative } from "../utils/signal-room-generator.js";
import { decrypt } from "../utils/crypto.js";
import { logger } from "../utils/logger.js";
import { z } from "zod";

export const signalRoomRoutes = Router();

// Zod schemas for input validation
const createClientSchema = z.object({
  name: z.string().min(1),
  website: z.string().url().optional().nullable(),
  industry: z.string().optional().nullable(),
  goals: z.any().optional(),
  reportCadence: z.string().default("weekly"),
  brandTone: z.any().optional(),
});

const ingestSignalSchema = z.object({
  source: z.string().min(1),
  title: z.string().min(1),
  value: z.any(),
  periodStart: z.string().optional().nullable(),
  periodEnd: z.string().optional().nullable(),
});

const generateReportSchema = z.object({
  title: z.string().min(1),
  periodStart: z.string(),
  periodEnd: z.string(),
  signalIds: z.array(z.string()).optional(),
});

/**
 * GET /api/signal-room/clients
 * List all client rooms for the organization
 */
signalRoomRoutes.get("/clients", authenticate, tenantScope, async (req, res, next) => {
  try {
    const clients = await prisma.clientRoom.findMany({
      where: { orgId: req.user!.orgId, isActive: true },
      orderBy: { name: "asc" },
    });
    res.json({ success: true, data: clients });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/signal-room/clients
 * Create a new client room
 */
signalRoomRoutes.post("/clients", authenticate, tenantScope, async (req, res, next) => {
  try {
    const body = createClientSchema.parse(req.body);
    const client = await prisma.clientRoom.create({
      data: {
        orgId: req.user!.orgId,
        name: body.name,
        website: body.website,
        industry: body.industry,
        goals: body.goals || {},
        reportCadence: body.reportCadence,
        brandTone: body.brandTone || {},
      },
    });

    logger.info({ orgId: req.user!.orgId, clientId: client.id }, "🆕 Created new client room");
    res.status(201).json({ success: true, data: client });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/signal-room/clients/:id
 * Get individual client room details along with recent reports, action items, and signals
 */
signalRoomRoutes.get("/clients/:id", authenticate, tenantScope, async (req, res, next) => {
  try {
    const id = req.params.id as string;
    const client = await prisma.clientRoom.findFirst({
      where: { id, orgId: req.user!.orgId },
      include: {
        signals: {
          orderBy: { createdAt: "desc" },
          take: 20,
        },
        reports: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        actionItems: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!client) {
      return res.status(404).json({ success: false, error: "Client room not found" });
    }

    res.json({ success: true, data: client });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/signal-room/clients/:id/signals
 * Ingest a signal for a client room
 */
signalRoomRoutes.post("/clients/:id/signals", authenticate, tenantScope, async (req, res, next) => {
  try {
    const id = req.params.id as string;
    const body = ingestSignalSchema.parse(req.body);

    const client = await prisma.clientRoom.findFirst({
      where: { id, orgId: req.user!.orgId },
    });

    if (!client) {
      return res.status(404).json({ success: false, error: "Client room not found" });
    }

    const signal = await prisma.signal.create({
      data: {
        orgId: req.user!.orgId,
        clientRoomId: id,
        source: body.source,
        title: body.title,
        value: body.value,
        periodStart: body.periodStart ? new Date(body.periodStart) : null,
        periodEnd: body.periodEnd ? new Date(body.periodEnd) : null,
      },
    });

    logger.info({ signalId: signal.id, clientId: id }, "📥 Ingested new signal");
    res.status(201).json({ success: true, data: signal });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/signal-room/clients/:id/signals
 * Fetch all signals for a client room
 */
signalRoomRoutes.get("/clients/:id/signals", authenticate, tenantScope, async (req, res, next) => {
  try {
    const id = req.params.id as string;
    const signals = await prisma.signal.findMany({
      where: { clientRoomId: id, orgId: req.user!.orgId },
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, data: signals });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/signal-room/clients/:id/reports/generate
 * Run the AI Report Generator on selected or recent signals
 */
signalRoomRoutes.post("/clients/:id/reports/generate", authenticate, tenantScope, async (req, res, next) => {
  try {
    const id = req.params.id as string;
    const body = generateReportSchema.parse(req.body);

    // 1. Fetch client room
    const clientRoom = await prisma.clientRoom.findFirst({
      where: { id, orgId: req.user!.orgId },
    });

    if (!clientRoom) {
      return res.status(404).json({ success: false, error: "Client room not found" });
    }

    // 2. Fetch signals
    let signals;
    if (body.signalIds && body.signalIds.length > 0) {
      signals = await prisma.signal.findMany({
        where: {
          id: { in: body.signalIds },
          clientRoomId: id,
          orgId: req.user!.orgId,
        },
      });
    } else {
      // Fallback: Fetch signals in date range
      signals = await prisma.signal.findMany({
        where: {
          clientRoomId: id,
          orgId: req.user!.orgId,
          createdAt: {
            gte: new Date(body.periodStart),
            lte: new Date(body.periodEnd),
          },
        },
      });
    }

    // 3. Decrypt organization BYOK keys
    const org = await prisma.organization.findUnique({
      where: { id: req.user!.orgId },
    });

    const byok = (org?.byokKeys as Record<string, string>) || {};
    const decryptedKeys = {
      groq: byok.groq ? decrypt(byok.groq) : "",
      openai: byok.openai ? decrypt(byok.openai) : "",
      gemini: byok.gemini ? decrypt(byok.gemini) : "",
      openrouter: byok.openrouter ? decrypt(byok.openrouter) : "",
    };

    // 4. Generate report narrative & action items using utility
    const narrativeResult = await generateClientReportNarrative({
      orgId: req.user!.orgId,
      clientRoom: {
        name: clientRoom.name,
        website: clientRoom.website,
        industry: clientRoom.industry,
        goals: clientRoom.goals,
        brandTone: clientRoom.brandTone,
        reportCadence: clientRoom.reportCadence,
      },
      signals: signals,
      keys: decryptedKeys,
    });

    // 5. Save report draft in the database
    const report = await prisma.clientReport.create({
      data: {
        orgId: req.user!.orgId,
        clientRoomId: id,
        status: "DRAFT",
        title: body.title,
        periodStart: new Date(body.periodStart),
        periodEnd: new Date(body.periodEnd),
        narrative: narrativeResult as any,
        sourceIds: signals.map((s) => s.id),
      },
    });

    // 6. Create proposed action items
    const actionItemsData = narrativeResult.recommendedActions.map((act) => ({
      orgId: req.user!.orgId,
      clientRoomId: id,
      reportId: report.id,
      title: act.title,
      description: act.description,
      impact: act.impact,
      effort: act.effort,
      status: "PROPOSED",
      approval: "REQUIRED",
    }));

    if (actionItemsData.length > 0) {
      await prisma.actionItem.createMany({
        data: actionItemsData,
      });
    }

    logger.info({ reportId: report.id, clientId: id }, "🤖 Generated weekly report draft");
    res.status(201).json({ success: true, data: report });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/signal-room/reports/:id
 * Retrieve individual report details with linked action items
 */
signalRoomRoutes.get("/reports/:id", authenticate, tenantScope, async (req, res, next) => {
  try {
    const id = req.params.id as string;
    const report = await prisma.clientReport.findFirst({
      where: { id, orgId: req.user!.orgId },
      include: {
        clientRoom: { select: { name: true, website: true, industry: true } },
        actionItems: true,
      },
    });

    if (!report) {
      return res.status(404).json({ success: false, error: "Report not found" });
    }

    res.json({ success: true, data: report });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/signal-room/reports/:id/approve
 * Approve report and promote action items to active status
 */
signalRoomRoutes.post("/reports/:id/approve", authenticate, tenantScope, async (req, res, next) => {
  try {
    const id = req.params.id as string;

    const report = await prisma.clientReport.findFirst({
      where: { id, orgId: req.user!.orgId },
    });

    if (!report) {
      return res.status(404).json({ success: false, error: "Report not found" });
    }

    // Update report status
    const updatedReport = await prisma.clientReport.update({
      where: { id },
      data: {
        status: "APPROVED",
        sentAt: new Date(),
      },
    });

    // Promote all proposed action items for this report to APPROVED status
    await prisma.actionItem.updateMany({
      where: { reportId: id, orgId: req.user!.orgId, status: "PROPOSED" },
      data: {
        status: "APPROVED",
      },
    });

    logger.info({ reportId: id }, "✅ Approved report and promoted proposed tasks");
    res.json({ success: true, message: "Report approved, tasks promoted.", data: updatedReport });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/signal-room/reports/:id/share
 * Public read-only endpoint (no authentication required) to view reports (for clients)
 */
signalRoomRoutes.get("/reports/:id/share", async (req, res, next) => {
  try {
    const id = req.params.id as string;
    const report = await prisma.clientReport.findUnique({
      where: { id },
      include: {
        clientRoom: { select: { name: true, website: true, industry: true } },
        actionItems: {
          where: { status: { in: ["APPROVED", "IN_PROGRESS", "COMPLETED"] } },
        },
      },
    });

    if (!report) {
      return res.status(404).json({ success: false, error: "Report not found or unavailable" });
    }

    res.json({ success: true, data: report });
  } catch (err) {
    next(err);
  }
});
