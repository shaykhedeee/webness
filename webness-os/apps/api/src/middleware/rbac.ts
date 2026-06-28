import type { Request, Response, NextFunction } from "express";
import { createError } from "./errorHandler.js";

type UserRole = "SUPER_ADMIN" | "AGENCY_ADMIN" | "CLIENT_ADMIN" | "CLIENT_USER" | "CLIENT_VIEWER";

/**
 * RBAC Guard Middleware
 * Ensures the user has one of the allowed roles.
 *
 * Role hierarchy (highest to lowest):
 *   SUPER_ADMIN > AGENCY_ADMIN > CLIENT_ADMIN > CLIENT_USER > CLIENT_VIEWER
 */
const ROLE_HIERARCHY: Record<string, number> = {
  SUPER_ADMIN: 100,
  AGENCY_ADMIN: 80,
  CLIENT_ADMIN: 60,
  CLIENT_USER: 40,
  CLIENT_VIEWER: 20,
};

/**
 * Require specific roles
 */
export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(createError("Authentication required", 401));
    }

    const userRole = req.user.role as UserRole;

    if (!allowedRoles.includes(userRole)) {
      return next(
        createError(
          `Access denied. Required roles: ${allowedRoles.join(", ")}`,
          403
        )
      );
    }

    next();
  };
}

/**
 * Require minimum role level (uses hierarchy)
 */
export function requireMinRole(minRole: UserRole) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(createError("Authentication required", 401));
    }

    const userLevel = ROLE_HIERARCHY[req.user.role] || 0;
    const requiredLevel = ROLE_HIERARCHY[minRole] || 0;

    if (userLevel < requiredLevel) {
      return next(
        createError(`Access denied. Minimum role required: ${minRole}`, 403)
      );
    }

    next();
  };
}

/**
 * Require SUPER_ADMIN only (God mode)
 */
export function requireSuperAdmin(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    return next(createError("Authentication required", 401));
  }

  if (req.user.role !== "SUPER_ADMIN") {
    return next(createError("Super admin access required", 403));
  }

  next();
}
