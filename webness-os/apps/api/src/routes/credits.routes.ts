import { Router } from "express";
import { prisma } from "@webness/db";
import { authenticate } from "../middleware/auth.js";
import { tenantScope } from "../middleware/tenant.js";

export const creditsRoutes = Router();

/**
 * GET /api/credits/balance
 * Get current credit balance
 */
creditsRoutes.get(
  "/balance",
  authenticate,
  tenantScope,
  async (req, res, next) => {
    try {
      const wallet = await prisma.creditWallet.findUnique({
        where: { orgId: req.user!.orgId },
      });

      res.json({
        success: true,
        data: {
          balance: wallet?.balance ?? 0,
          orgId: req.user!.orgId,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/credits/history
 * Get credit transaction history
 */
creditsRoutes.get(
  "/history",
  authenticate,
  tenantScope,
  async (req, res, next) => {
    try {
      const wallet = await prisma.creditWallet.findUnique({
        where: { orgId: req.user!.orgId },
      });

      if (!wallet) {
        return res.json({ success: true, data: [] });
      }

      const transactions = await prisma.creditTransaction.findMany({
        where: { walletId: wallet.id },
        include: {
          user: { select: { name: true, email: true } },
          task: { select: { id: true, status: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      });

      res.json({ success: true, data: transactions });
    } catch (err) {
      next(err);
    }
  }
);
