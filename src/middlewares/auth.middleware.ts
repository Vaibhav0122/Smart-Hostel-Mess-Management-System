import { Request, Response, NextFunction } from "express";
import { User } from "../models/User";
import { UserRole, UserStatus } from "../constants/roles";
import { verifyAccessToken } from "../utils/token";
import { AppError } from "../errors/AppError";
import { HttpStatus } from "../constants/statusCodes";
import { hasPermission } from "../constants/permissions";

/**
 * Middleware: Verifies the JWT Access Token in the Authorization header.
 * Attaches the authenticated user context to `req.user`.
 */
export const requireAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AppError(
        HttpStatus.UNAUTHORIZED,
        "MISSING_AUTHENTICATION",
        "Authorization header with Bearer token is required."
      );
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      throw new AppError(
        HttpStatus.UNAUTHORIZED,
        "INVALID_TOKEN_FORMAT",
        "Bearer token format is invalid."
      );
    }

    const payload = verifyAccessToken(token);

    // Verify user still exists in the database and is active
    const user = await User.findById(payload.sub).select("_id email role status studentId");
    if (!user) {
      throw new AppError(
        HttpStatus.UNAUTHORIZED,
        "USER_NOT_FOUND",
        "The user account associated with this token no longer exists."
      );
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new AppError(
        HttpStatus.FORBIDDEN,
        "ACCOUNT_NOT_ACTIVE",
        `Your account is currently in ${user.status} status and cannot access protected resources.`
      );
    }

    // Attach verified server-side identity to request
    req.user = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      studentId: user.studentId,
      status: user.status,
    };

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware: Enforces that the requesting user possesses one of the specified roles.
 * Must be preceded by `requireAuth`.
 */
export const requireRole = (...allowedRoles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(
        new AppError(
          HttpStatus.UNAUTHORIZED,
          "UNAUTHENTICATED",
          "Authentication is required before verifying roles."
        )
      );
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(
          HttpStatus.FORBIDDEN,
          "FORBIDDEN_ROLE",
          "You do not possess the required role to access this resource."
        )
      );
    }

    next();
  };
};

/**
 * Middleware: Enforces that the requesting user's role possesses the granular permission.
 * Derived from docs/ROLE_PERMISSIONS.md. Must be preceded by `requireAuth`.
 */
export const requirePermission = (...permissions: string[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(
        new AppError(
          HttpStatus.UNAUTHORIZED,
          "UNAUTHENTICATED",
          "Authentication is required before checking permissions."
        )
      );
    }

    const hasAny = permissions.some((permission) => hasPermission(req.user!.role, permission));
    if (!hasAny) {
      return next(
        new AppError(
          HttpStatus.FORBIDDEN,
          "FORBIDDEN_PERMISSION",
          `You lack the required '${permissions.join("' or '")}' permission to perform this action.`
        )
      );
    }

    next();
  };
};

/**
 * Middleware: IDOR Defense - Prevents cross-student data access.
 * Allows administrators (SUPER_ADMIN, HOSTEL_ADMIN) to inspect any user resource,
 * but restricts students strictly to their own resource (matching id or studentId param).
 */
export const verifyOwnershipOrAdmin = (
  paramKey: string = "userId"
) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(
        new AppError(
          HttpStatus.UNAUTHORIZED,
          "UNAUTHENTICATED",
          "Authentication is required before verifying resource ownership."
        )
      );
    }

    // Administrators bypass individual resource ownership checks
    if (
      req.user.role === UserRole.SUPER_ADMIN ||
      req.user.role === UserRole.HOSTEL_ADMIN
    ) {
      return next();
    }

    // For students, the requested resource parameter must match their own ID or studentId
    const targetParam = req.params[paramKey];
    const isOwner =
      targetParam === req.user.id ||
      (req.user.studentId && targetParam === req.user.studentId);

    if (!isOwner) {
      return next(
        new AppError(
          HttpStatus.FORBIDDEN,
          "FORBIDDEN_CROSS_STUDENT_ACCESS",
          "Access denied: You are not authorized to view or modify another resident's data."
        )
      );
    }

    next();
  };
};

