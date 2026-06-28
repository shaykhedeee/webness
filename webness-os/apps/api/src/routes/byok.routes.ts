import { Router } from "express";
import { prisma } from "@webness/db";
import { authenticate } from "../middleware/auth.js";
import { tenantScope } from "../middleware/tenant.js";
import { encrypt } from "../utils/crypto.js";
import { logger } from "../utils/logger.js";

export const byokRoutes = Router();

/**
 * GET /api/byok/keys
 * Retrieves current client keys (masked for security)
 */
byokRoutes.get("/", authenticate, tenantScope, async (req, res, next) => {
  try {
    const org = await prisma.organization.findUnique({
      where: { id: req.user!.orgId },
    });

    if (!org) {
      return res.status(404).json({ success: false, error: "Organization not found" });
    }

    const byok = (org.byokKeys as Record<string, string>) || {};
    const maskedKeys: Record<string, string | boolean> = {
      groq: byok.groq ? "gsk_••••••••••••••••" : false,
      openai: byok.openai ? "sk-proj-••••••••••••" : false,
      gemini: byok.gemini ? "AIzaSy••••••••••••" : false,
      openrouter: byok.openrouter ? "sk-or-v1-••••••••" : false,
    };

    res.json({ success: true, data: maskedKeys });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/byok/keys
 * Securely encrypts and stores client-submitted API keys
 */
byokRoutes.post("/", authenticate, tenantScope, async (req, res, next) => {
  try {
    const { groq, openai, gemini, openrouter } = req.body;

    const org = await prisma.organization.findUnique({
      where: { id: req.user!.orgId },
    });

    if (!org) {
      return res.status(404).json({ success: false, error: "Organization not found" });
    }

    const currentByok = (org.byokKeys as Record<string, string>) || {};
    const updatedByok: Record<string, string> = { ...currentByok };

    // Encrypt each key if provided, or preserve/delete
    if (groq !== undefined) {
      updatedByok.groq = groq ? encrypt(groq) : "";
    }
    if (openai !== undefined) {
      updatedByok.openai = openai ? encrypt(openai) : "";
    }
    if (gemini !== undefined) {
      updatedByok.gemini = gemini ? encrypt(gemini) : "";
    }
    if (openrouter !== undefined) {
      updatedByok.openrouter = openrouter ? encrypt(openrouter) : "";
    }

    // Clean up empty keys
    Object.keys(updatedByok).forEach(key => {
      if (!updatedByok[key]) delete updatedByok[key];
    });

    await prisma.organization.update({
      where: { id: req.user!.orgId },
      data: { byokKeys: updatedByok },
    });

    logger.info({ orgId: req.user!.orgId }, "🔒 Updated client BYOK credentials");
    res.json({ success: true, message: "Credentials saved securely." });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/byok/keys
 * Clears all client-submitted API keys
 */
byokRoutes.delete("/", authenticate, tenantScope, async (req, res, next) => {
  try {
    await prisma.organization.update({
      where: { id: req.user!.orgId },
      data: { byokKeys: null as any },
    });

    logger.info({ orgId: req.user!.orgId }, "🧹 Cleared client BYOK credentials");
    res.json({ success: true, message: "BYOK keys removed." });
  } catch (err) {
    next(err);
  }
});
