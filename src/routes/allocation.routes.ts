import { Router } from "express";
import { HostelController } from "../controllers/hostel.controller";
import {
  requireAuth,
  requirePermission,
  verifyOwnershipOrAdmin,
} from "../middlewares/auth.middleware";
import { validateRequest } from "../middlewares/validateRequest";
import {
  allocateBedSchema,
  transferBedSchema,
  checkoutBedSchema,
} from "../validations/hostel.validation";

const router = Router();

// POST /api/v1/allocations - Allocate bed to student
router.post(
  "/",
  requireAuth,
  requirePermission("allocations:create"),
  validateRequest(allocateBedSchema),
  HostelController.allocateBed
);

// POST /api/v1/allocations/transfer - Transfer student to a different bed
router.post(
  "/transfer",
  requireAuth,
  requirePermission("allocations:transfer"),
  validateRequest(transferBedSchema),
  HostelController.transferBed
);

// POST /api/v1/allocations/checkout - Checkout student and release bed
router.post(
  "/checkout",
  requireAuth,
  requirePermission("allocations:checkout"),
  validateRequest(checkoutBedSchema),
  HostelController.checkoutBed
);

// GET /api/v1/allocations - List allocations with filter
router.get(
  "/",
  requireAuth,
  requirePermission("rooms:view"),
  HostelController.listAllocations
);

// GET /api/v1/allocations/student/:studentId/history - View allocation history (IDOR protected)
router.get(
  "/student/:studentId/history",
  requireAuth,
  verifyOwnershipOrAdmin("studentId"),
  HostelController.getStudentAllocationHistory
);

export default router;
