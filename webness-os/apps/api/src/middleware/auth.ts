import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "@webness/db";
import { createError } from "./errorHandler.js";
// Logger available if needed for auth debugging
// import { logger } from "../utils/logger.js";
import bcrypt from "bcryptjs";

// Extend Express Request to include user info
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
        orgId: string;
      };
    }
  }
}

/**
 * JWT Authentication Middleware
 * Supports both Bearer token and API key authentication
 */
export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    const aiBrainKey = req.headers["x-ai-brain-key"] as string | undefined;
    const queryToken = req.query.token as string | undefined;

    // ---- AI Brain Access ----
    if (aiBrainKey && aiBrainKey === process.env.AI_BRAIN_KEY) {
      req.user = {
        id: "AI_BRAIN",
        email: "brain@webness.in",
        role: "SUPER_ADMIN",
        orgId: "SYSTEM",
      };
      return next();
    }

    let token = "";
    if (authHeader) {
      token = authHeader.replace("Bearer ", "");
    } else if (queryToken) {
      token = queryToken;
    } else {
      throw createError("Authentication required", 401);
    }

    // ---- API Key Auth (starts with wn_) ----
    if (token.startsWith("wn_")) {
      const apiKey = await prisma.apiKey.findFirst({
        where: {
          keyPrefix: token.substring(0, 11), // "wn_live_xx"
          isActive: true,
        },
        include: { org: true },
      });

      if (!apiKey) {
        throw createError("Invalid API key", 401);
      }

      // Verify full key hash
      const isValid = await bcrypt.compare(token, apiKey.hashedKey);
      if (!isValid) {
        throw createError("Invalid API key", 401);
      }

      // Check expiry
      if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
        throw createError("API key expired", 401);
      }

      // Update last used
      await prisma.apiKey.update({
        where: { id: apiKey.id },
        data: { lastUsedAt: new Date() },
      });

      req.user = {
        id: `apikey:${apiKey.id}`,
        email: `apikey@${apiKey.org.slug}`,
        role: "CLIENT_USER",
        orgId: apiKey.orgId,
      };
      return next();
    }

    // ---- JWT Auth ----
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw createError("JWT secret not configured", 500);
    }

    const decoded = jwt.verify(token, secret) as {
      userId: string;
      email: string;
      role: string;
      orgId: string;
    };

    req.user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      orgId: decoded.orgId,
    };

    next();
  } catch (err) {
    if (err instanceof jwt.JsonWebTokenError) {
      next(createError("Invalid or expired token", 401));
    } else {
      next(err);
    }
  }
}

/**
 * Optional authentication — sets req.user if token present, but doesn't fail
 */
export async function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return next();

    const token = authHeader.replace("Bearer ", "");
    const secret = process.env.JWT_SECRET;
    if (!secret) return next();

    const decoded = jwt.verify(token, secret) as {
      userId: string;
      email: string;
      role: string;
      orgId: string;
    };

    req.user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      orgId: decoded.orgId,
    };
  } catch {
    // Silently ignore invalid tokens for optional auth
  }
  next();
}
