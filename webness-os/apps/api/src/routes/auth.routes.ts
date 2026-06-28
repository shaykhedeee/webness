import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "@webness/db";
import { registerSchema, loginSchema } from "../utils/validators.js";
import { createError } from "../middleware/errorHandler.js";
import { authenticate } from "../middleware/auth.js";
import { JWT_CONFIG } from "@webness/shared";
import { logger } from "../utils/logger.js";

export const authRoutes = Router();

/**
 * POST /api/auth/register
 * Create a new organization + admin user
 */
authRoutes.post("/register", async (req, res, next) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      throw createError(parsed.error.errors[0].message, 400);
    }

    const { email, password, name, orgName } = parsed.data;

    // Check if email already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw createError("Email already registered", 409);
    }

    // Create slug from org name
    const slug = orgName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    // Check slug uniqueness
    const existingOrg = await prisma.organization.findUnique({
      where: { slug },
    });
    if (existingOrg) {
      throw createError("Organization name already taken", 409);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create org + user + credit wallet in a transaction
    const result = await prisma.$transaction(async (tx: any) => {
      const org = await tx.organization.create({
        data: {
          name: orgName,
          slug,
          plan: "FREE",
        },
      });

      const user = await tx.user.create({
        data: {
          email,
          passwordHash,
          name,
          role: "CLIENT_ADMIN",
          orgId: org.id,
        },
      });

      // Create credit wallet with free tier credits
      await tx.creditWallet.create({
        data: {
          orgId: org.id,
          balance: 50, // Free tier starting credits
        },
      });

      // Log the initial credit grant
      const wallet = await tx.creditWallet.findUnique({
        where: { orgId: org.id },
      });

      if (wallet) {
        await tx.creditTransaction.create({
          data: {
            walletId: wallet.id,
            userId: user.id,
            amount: 50,
            type: "BONUS",
            balance: 50,
            metadata: { reason: "Welcome bonus — free tier" },
          },
        });
      }

      return { org, user };
    });

    // Generate tokens
    const tokens = generateTokens(result.user);

    logger.info(
      { userId: result.user.id, orgId: result.org.id },
      "New user registered"
    );

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          role: result.user.role,
        },
        org: {
          id: result.org.id,
          name: result.org.name,
          slug: result.org.slug,
          plan: result.org.plan,
        },
        tokens,
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/auth/login
 */
authRoutes.post("/login", async (req, res, next) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      throw createError(parsed.error.errors[0].message, 400);
    }

    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { email },
      include: { org: true },
    });

    if (!user || !user.passwordHash) {
      throw createError("Invalid email or password", 401);
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw createError("Invalid email or password", 401);
    }

    // Update last active
    await prisma.user.update({
      where: { id: user.id },
      data: { lastActiveAt: new Date() },
    });

    const tokens = generateTokens(user);

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          favoriteShape: user.favoriteShape,
        },
        org: {
          id: user.org.id,
          name: user.org.name,
          slug: user.org.slug,
          plan: user.org.plan,
        },
        tokens,
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/auth/refresh
 */
authRoutes.post("/refresh", async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      throw createError("Refresh token required", 400);
    }

    const secret = process.env.JWT_REFRESH_SECRET;
    if (!secret) throw createError("JWT refresh secret not configured", 500);

    const decoded = jwt.verify(refreshToken, secret) as {
      userId: string;
      email: string;
      role: string;
      orgId: string;
    };

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      throw createError("User not found", 401);
    }

    const tokens = generateTokens(user);
    res.json({
      success: true,
      data: {
        tokens,
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    });
  } catch (err) {
    if (err instanceof jwt.JsonWebTokenError) {
      next(createError("Invalid refresh token", 401));
    } else {
      next(err);
    }
  }
});

/**
 * GET /api/auth/me
 */
authRoutes.get("/me", authenticate, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: {
        org: {
          include: { creditWallet: true },
        },
      },
    });

    if (!user) throw createError("User not found", 404);

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          favoriteShape: user.favoriteShape,
          avatar: user.avatar,
        },
        org: {
          id: user.org.id,
          name: user.org.name,
          slug: user.org.slug,
          plan: user.org.plan,
          industry: user.org.industry,
        },
        credits: user.org.creditWallet?.balance ?? 0,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ---- Helper ----

function generateTokens(user: { id: string; email: string; role: string; orgId: string }) {
  const jwtSecret = process.env.JWT_SECRET!;
  const refreshSecret = process.env.JWT_REFRESH_SECRET!;

  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    orgId: user.orgId,
  };

  const accessToken = jwt.sign(payload, jwtSecret, {
    expiresIn: JWT_CONFIG.ACCESS_TOKEN_EXPIRY,
  });

  const refreshToken = jwt.sign(payload, refreshSecret, {
    expiresIn: JWT_CONFIG.REFRESH_TOKEN_EXPIRY,
  });

  return { accessToken, refreshToken };
}
