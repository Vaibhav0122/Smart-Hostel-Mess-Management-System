import { Router } from "express";
import { DashboardController } from "../controllers/dashboard.controller";
import {
  requireAuth,
  requirePermission,
} from "../middlewares/auth.middleware";

const router = Router();

// GET /api/v1/dashboard/admin-metrics - Real-time KPI dashboard for administrators
router.get(
  "/admin-metrics",
  requireAuth,
  requirePermission("reports:view"),
  DashboardController.getAdminMetrics
);

// GET /api/v1/dashboard/student-summary - Student personalized dashboard
router.get(
  "/student-summary",
  requireAuth,
  requirePermission("profile:view_self", "reports:view"),
  DashboardController.getStudentSummary
);

export default router;
