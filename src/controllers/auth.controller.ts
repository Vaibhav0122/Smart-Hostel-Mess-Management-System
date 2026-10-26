import { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/auth.service";
import { HttpStatus } from "../constants/statusCodes";
import { env } from "../config/env";

const COOKIE_NAME = "refreshToken";

// Refresh cookie security configuration
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/api/v1/auth",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

export class AuthController {
  /**
   * POST /api/v1/auth/login
   */
  public static async login(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const result = await AuthService.login(req.body, req.ip);

      // Set rotating refresh token in secure HttpOnly cookie
      res.cookie(COOKIE_NAME, result.refreshToken, COOKIE_OPTIONS);

      res.status(HttpStatus.OK).json({
        success: true,
        message: "Login successful.",
        data: {
          accessToken: result.accessToken,
          expiresIn: 900, // 15 minutes (in seconds)
          user: result.user,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/refresh
   */
  public static async refresh(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const rawRefreshToken =
        req.cookies?.[COOKIE_NAME] || req.body?.refreshToken;

      const result = await AuthService.refresh(rawRefreshToken);

      // Rotate cookie with new refresh token
      res.cookie(COOKIE_NAME, result.refreshToken, COOKIE_OPTIONS);

      res.status(HttpStatus.OK).json({
        success: true,
        message: "Token refreshed successfully.",
        data: {
          accessToken: result.accessToken,
          expiresIn: 900,
          user: result.user,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/logout
   */
  public static async logout(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (req.user?.id) {
        await AuthService.logout(req.user.id);
      }

      // Clear refresh token cookie
      res.clearCookie(COOKIE_NAME, {
        httpOnly: true,
        secure: env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/api/v1/auth",
      });

      res.status(HttpStatus.OK).json({
        success: true,
        message: "Logged out successfully.",
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/activate
   */
  public static async activate(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const result = await AuthService.activateAccount(req.body);

      res.status(HttpStatus.OK).json({
        success: true,
        message: "Account activated successfully. You may now log in with your new password.",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/auth/me
   */
  public static async getMe(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const user = await AuthService.getCurrentUser(req.user!.id);

      res.status(HttpStatus.OK).json({
        success: true,
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/initiate-activation
   * Admin-initiated account creation for a student.
   */
  public static async initiateStudentActivation(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const result = await AuthService.initiateStudentActivation(
        req.user!,
        req.body,
        req.ip,
        req.headers["user-agent"]
      );

      res.status(HttpStatus.CREATED).json({
        success: true,
        message: "Student account provisioned and activation token generated.",
        data: {
          user: result.user,
          ...(result.devActivationToken
            ? { devActivationToken: result.devActivationToken }
            : {}),
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
