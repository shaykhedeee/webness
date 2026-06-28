import type { Request, Response, NextFunction } from "express";
import { prisma } from "@webness/db";
import { logger } from "../utils/logger.js";

/**
 * Audit Log Middleware
 * Logs every mutating action for security.
 * Used on admin routes and sensitive operations.
 */
export function auditLog(action: string, resource: string) {
  return async (
    req: Request,
    _res: Response,
    next: NextFunction
  ): Promise<void> => {
    // Log after the request completes
    const originalEnd = _res.end;
    const startTime = Date.now();

    _res.end = function (this: Response, ...args: Parameters<Response["end"]>) {
      const resourceId =
        (req.params.id as string) ||
        (req.body?.orgId as string) ||
        undefined;

      prisma.auditLog
        .create({
          data: {
            actorId: req.user?.id || "anonymous",
            actorType: req.user?.id === "AI_BRAIN" ? "ai_brain" : "user",
            action,
            resource,
            resourceId,
            metadata: {
              method: req.method,
              path: req.path,
              statusCode: _res.statusCode,
              durationMs: Date.now() - startTime,
              body:
                req.method !== "GET" ? sanitizeBody(req.body) : undefined,
            } as any,
            ipAddress:
              (req.headers["x-forwarded-for"] as string) ||
              req.socket.remoteAddress ||
              null,
          },
        })
        .catch((err: unknown) => {
          logger.error({ err, action, resource }, "Failed to write audit log");
        });

      return originalEnd.apply(this, args);
    } as typeof originalEnd;

    next();
  };
}

/**
 * Remove sensitive fields from request body before logging
 */
function sanitizeBody(body: Record<string, unknown>): Record<string, unknown> {
  if (!body || typeof body !== "object") return {};

  const sanitized = { ...body };
  const sensitiveFields = [
    "password",
    "passwordHash",
    "accessToken",
    "refreshToken",
    "apiKey",
    "secret",
    "token",
  ];

  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = "[REDACTED]";
    }
  }

  return sanitized;
}
