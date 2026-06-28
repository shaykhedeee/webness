import type { Request, Response, NextFunction } from "express";
import { createError } from "./errorHandler.js";

/**
 * Tenant Isolation Middleware
 * Ensures every query is scoped to the authenticated user's organization.
 * CRITICAL SECURITY: This prevents data leaks between tenants.
 *
 * After this middleware, req.user.orgId is guaranteed to be set.
 * SUPER_ADMIN can optionally scope to a specific org via ?orgId= query param.
 */
export function tenantScope(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    return next(createError("Authentication required", 401));
  }

  // SUPER_ADMIN can target any org
  if (req.user.role === "SUPER_ADMIN") {
    const targetOrg = req.query.orgId as string | undefined;
    if (targetOrg) {
      req.user.orgId = targetOrg;
    }
    // If no targetOrg specified, SUPER_ADMIN operates globally
    return next();
  }

  // All other users MUST have an orgId
  if (!req.user.orgId) {
    return next(createError("Organization context missing", 403));
  }

  next();
}
