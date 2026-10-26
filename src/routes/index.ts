import { Router, Request, Response } from "express";
import setupRoutes from "./setup.routes";
import healthRoutes from "./health.routes";
import authRoutes from "./auth.routes";
import studentRoutes from "./student.routes";
import hostelRoutes from "./hostel.routes";
import buildingRoutes from "./building.routes";
import roomRoutes from "./room.routes";
import bedRoutes from "./bed.routes";
import allocationRoutes from "./allocation.routes";
import profileRoutes from "./profile.routes";
import contractRoutes from "./contract.routes";
import financeRoutes from "./finance.routes";
import messRoutes from "./mess.routes";
import dashboardRoutes from "./dashboard.routes";
import reportRoutes from "./report.routes";
import {
  requireAuth,
  requireRole,
  verifyOwnershipOrAdmin,
} from "../middlewares/auth.middleware";
import { UserRole } from "../constants/roles";

const router = Router();

// Mount modules
router.use("/health", healthRoutes);
router.use("/setup", setupRoutes);
router.use("/auth", authRoutes);
router.use("/students", studentRoutes);
router.use("/hostels", hostelRoutes);
router.use("/buildings", buildingRoutes);
router.use("/rooms", roomRoutes);
router.use("/beds", bedRoutes);
router.use("/allocations", allocationRoutes);
router.use("/profile", profileRoutes);
router.use("/contracts", contractRoutes);
router.use("/finances", financeRoutes);
router.use("/mess", messRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/reports", reportRoutes);

// RBAC Verification Routes (Phase 3 testing without premature Phase 4+ implementation)
router.get(
  "/rbac/admin-only",
  requireAuth,
  requireRole(UserRole.HOSTEL_ADMIN, UserRole.SUPER_ADMIN),
  (_req: Request, res: Response) => {
    res.status(200).json({
      success: true,
      message: "Admin-only resource accessed successfully.",
    });
  }
);

router.get(
  "/rbac/student-only",
  requireAuth,
  requireRole(UserRole.STUDENT),
  (_req: Request, res: Response) => {
    res.status(200).json({
      success: true,
      message: "Student-only resource accessed successfully.",
    });
  }
);

router.get(
  "/rbac/students/:userId/private-data",
  requireAuth,
  verifyOwnershipOrAdmin("userId"),
  (req: Request, res: Response) => {
    res.status(200).json({
      success: true,
      message: "Private student resource accessed successfully.",
      data: { targetUserId: req.params.userId },
    });
  }
);

export default router;
