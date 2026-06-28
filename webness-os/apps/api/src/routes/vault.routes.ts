import { Router } from "express";
import { prisma } from "@webness/db";
import { authenticate } from "../middleware/auth.js";
import { tenantScope } from "../middleware/tenant.js";
import { logger } from "../utils/logger.js";

export const vaultRoutes = Router();

/**
 * GET /api/vault
 * List all documents/notes in organization vault
 */
vaultRoutes.get("/", authenticate, tenantScope, async (req, res, next) => {
  try {
    const assets = await prisma.asset.findMany({
      where: {
        orgId: req.user!.orgId,
        type: { in: ["DOCUMENT", "BLOG_POST", "SOCIAL_POST", "INVOICE_PDF", "RECEIPT_PDF"] },
      },
      orderBy: { createdAt: "desc" },
    });

    const notes = assets.map((asset) => {
      const meta = (asset.metadata as Record<string, any>) || {};
      return {
        id: asset.id,
        title: asset.name,
        content: asset.content || "",
        folder: meta.folder || "Inbox",
        tags: meta.tags || [],
        createdAt: asset.createdAt,
        updatedAt: asset.createdAt,
        source: meta.source || "manual",
        wordCount: meta.wordCount || (asset.content ? asset.content.trim().split(/\s+/).filter(Boolean).length : 0),
      };
    });

    res.json({ success: true, data: notes });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/vault
 * Create/Import a document in organization vault
 */
vaultRoutes.post("/", authenticate, tenantScope, async (req, res, next) => {
  try {
    const { title, content, folder, tags, source } = req.body;
    if (!title) {
      return res.status(400).json({ success: false, error: "Title is required" });
    }

    const cleanContent = content || "";
    const wordCount = cleanContent.trim().split(/\s+/).filter(Boolean).length;

    const asset = await prisma.asset.create({
      data: {
        orgId: req.user!.orgId,
        type: "DOCUMENT",
        name: title,
        content: cleanContent,
        metadata: {
          folder: folder || "Inbox",
          tags: tags || [],
          source: source || "manual",
          wordCount,
        },
      },
    });

    logger.info({ orgId: req.user!.orgId, documentId: asset.id }, "Document saved in vault");

    res.status(201).json({
      success: true,
      data: {
        id: asset.id,
        title: asset.name,
        content: asset.content || "",
        folder: folder || "Inbox",
        tags: tags || [],
        createdAt: asset.createdAt,
        updatedAt: asset.createdAt,
        source: source || "manual",
        wordCount,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/vault/:id
 * Delete a document from organization vault
 */
vaultRoutes.delete("/:id", authenticate, tenantScope, async (req, res, next) => {
  try {
    const id = req.params.id as string;

    const doc = await prisma.asset.findFirst({
      where: { id, orgId: req.user!.orgId as string },
    });

    if (!doc) {
      return res.status(404).json({ success: false, error: "Document not found" });
    }

    await prisma.asset.delete({
      where: { id },
    });

    logger.info({ orgId: req.user!.orgId, documentId: id }, "Document deleted from vault");
    res.json({ success: true, message: "Document deleted from vault successfully." });
  } catch (err) {
    next(err);
  }
});
