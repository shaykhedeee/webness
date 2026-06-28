import { Router } from "express";
import { prisma } from "@webness/db";
import { authenticate } from "../middleware/auth.js";
import { tenantScope } from "../middleware/tenant.js";
import { logger } from "../utils/logger.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export const apiKeysRoutes = Router();

/**
 * GET /api/client-api-keys
 * List all API keys for the current organization
 */
apiKeysRoutes.get("/", authenticate, tenantScope, async (req, res, next) => {
  try {
    const keys = await prisma.apiKey.findMany({
      where: { orgId: req.user!.orgId },
      orderBy: { createdAt: "desc" },
    });

    // Strip out hashedKey for absolute security
    const sanitized = keys.map(({ hashedKey, ...rest }) => rest);

    res.json({ success: true, data: sanitized });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/client-api-keys
 * Generate a new API key for the current organization
 */
apiKeysRoutes.post("/", authenticate, tenantScope, async (req, res, next) => {
  try {
    const { name, permissions } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, error: "Key name is required" });
    }

    // Generate a secure API key
    // Prefix: wn_live_ + 24 secure bytes hex
    const secretPart = crypto.randomBytes(24).toString("hex");
    const fullKey = `wn_live_${secretPart}`;
    const keyPrefix = fullKey.substring(0, 16); // e.g. "wn_live_a1b2c3d4"

    // Hash the full key
    const hashedKey = await bcrypt.hash(fullKey, 10);

    const apiKey = await prisma.apiKey.create({
      data: {
        orgId: req.user!.orgId,
        hashedKey,
        keyPrefix,
        name,
        permissions: permissions || ["tools.execute", "tasks.read", "credits.read"],
        isActive: true,
      },
    });

    logger.info({ orgId: req.user!.orgId, keyId: apiKey.id }, "Programmatic API key generated");

    // Return the cleartext key ONCE so the user can copy it
    res.status(201).json({
      success: true,
      data: {
        id: apiKey.id,
        name: apiKey.name,
        keyPrefix: apiKey.keyPrefix,
        permissions: apiKey.permissions,
        createdAt: apiKey.createdAt,
        expiresAt: apiKey.expiresAt,
        isActive: apiKey.isActive,
        cleartextKey: fullKey, // ONLY RETURNED NOW
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/client-api-keys/:id
 * Revoke an API key
 */
apiKeysRoutes.delete("/:id", authenticate, tenantScope, async (req, res, next) => {
  try {
    const id = req.params.id as string;

    const key = await prisma.apiKey.findFirst({
      where: { id, orgId: req.user!.orgId as string },
    });

    if (!key) {
      return res.status(404).json({ success: false, error: "API Key not found" });
    }

    await prisma.apiKey.delete({
      where: { id },
    });

    logger.info({ orgId: req.user!.orgId, keyId: id }, "Programmatic API key revoked");
    res.json({ success: true, message: "Programmatic key revoked successfully." });
  } catch (err) {
    next(err);
  }
});
