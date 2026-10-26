import { Router } from "express";
import { ReportController } from "../controllers/report.controller";
import {
  requireAuth,
  requirePermission,
} from "../middlewares/auth.middleware";
import { validateRequest } from "../middlewares/validateRequest";
import {
  studentReportQuerySchema,
  occupancyReportQuerySchema,
  financeReportQuerySchema,
  messReportQuerySchema,
  exportReportQuerySchema,
} from "../validations/report.validation";

const router = Router();

// GET /api/v1/reports/students - Student Master Report
router.get(
  "/students",
  requireAuth,
  requirePermission("reports:view"),
  validateRequest(studentReportQuerySchema),
  ReportController.getStudentReport
);

// GET /api/v1/reports/occupancy - Hostel Occupancy Report
router.get(
  "/occupancy",
  requireAuth,
  requirePermission("reports:view"),
  validateRequest(occupancyReportQuerySchema),
  ReportController.getOccupancyReport
);

// GET /api/v1/reports/finances - Financial Summary Report
router.get(
  "/finances",
  requireAuth,
  requirePermission("reports:view"),
  validateRequest(financeReportQuerySchema),
  ReportController.getFinanceReport
);

// GET /api/v1/reports/mess - Mess Attendance & Selection Report
router.get(
  "/mess",
  requireAuth,
  requirePermission("reports:view"),
  validateRequest(messReportQuerySchema),
  ReportController.getMessReport
);

// GET /api/v1/reports/export - Stream CSV Export
router.get(
  "/export",
  requireAuth,
  requirePermission("reports:export"),
  validateRequest(exportReportQuerySchema),
  ReportController.exportReportCsv
);

export default router;
