import { Router } from "express";
import { ContractController } from "../controllers/contract.controller";
import {
  requireAuth,
  requirePermission,
  verifyOwnershipOrAdmin,
} from "../middlewares/auth.middleware";
import { validateRequest } from "../middlewares/validateRequest";
import {
  createContractSchema,
  updateContractSchema,
  exitRequestSchema,
  approveExitSchema,
} from "../validations/contract.validation";

const router = Router();

// POST /api/v1/contracts - Admin creates a new contract
router.post(
  "/",
  requireAuth,
  requirePermission("contracts:create"),
  validateRequest(createContractSchema),
  ContractController.createContract
);

// GET /api/v1/contracts - Admin lists contracts
router.get(
  "/",
  requireAuth,
  requirePermission("contracts:view_all"),
  ContractController.listContracts
);

// GET /api/v1/contracts/student/:studentId/history - View residency contract history
router.get(
  "/student/:studentId/history",
  requireAuth,
  verifyOwnershipOrAdmin("studentId"),
  ContractController.getStudentContractHistory
);

// GET /api/v1/contracts/:id - Get contract by ID
router.get(
  "/:id",
  requireAuth,
  ContractController.getContractById
);

// PATCH /api/v1/contracts/:id - Admin updates contract details
router.patch(
  "/:id",
  requireAuth,
  requirePermission("contracts:create"),
  validateRequest(updateContractSchema),
  ContractController.updateContract
);

// POST /api/v1/contracts/:id/exit-request - Resident requests exit
router.post(
  "/:id/exit-request",
  requireAuth,
  requirePermission("contracts:request_exit"),
  validateRequest(exitRequestSchema),
  ContractController.requestExit
);

// POST /api/v1/contracts/:id/approve-exit - Admin approves exit
router.post(
  "/:id/approve-exit",
  requireAuth,
  requirePermission("contracts:approve_exit"),
  validateRequest(approveExitSchema),
  ContractController.approveExit
);

export default router;
