import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { validateRequest } from "../middlewares/validateRequest";
import {
  loginSchema,
  activateAccountSchema,
  refreshTokenSchema,
  initiateActivationSchema,
} from "../validations/auth.validation";
import { requireAuth, requirePermission } from "../middlewares/auth.middleware";
import { authRateLimiter } from "../middlewares/rateLimiter";

const router = Router();

// Public Authentication Endpoints (Rate Limited)
router.post(
  "/login",
  authRateLimiter,
  validateRequest(loginSchema),
  AuthController.login
);

router.post(
  "/refresh",
  authRateLimiter,
  validateRequest(refreshTokenSchema),
  AuthController.refresh
);

router.post(
  "/activate",
  authRateLimiter,
  validateRequest(activateAccountSchema),
  AuthController.activate
);

// Protected Authentication Endpoints
router.post("/logout", requireAuth, AuthController.logout);
router.get("/me", requireAuth, AuthController.getMe);

// Admin-Initiated Student Activation
router.post(
  "/initiate-activation",
  requireAuth,
  requirePermission("students:create"),
  validateRequest(initiateActivationSchema),
  AuthController.initiateStudentActivation
);

export default router;
