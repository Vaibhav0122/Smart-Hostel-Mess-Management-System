import { Router } from "express";
import { FinanceController } from "../controllers/finance.controller";
import {
  requireAuth,
  requirePermission,
} from "../middlewares/auth.middleware";
import { validateRequest } from "../middlewares/validateRequest";
import {
  createChargeSchema,
  cancelChargeSchema,
  recordPaymentSchema,
  reversePaymentSchema,
  createRefundSchema,
} from "../validations/finance.validation";

const router = Router();

// ── Charges ────────────────────────────────────────────────────────────────

// POST /api/v1/finances/charges - Admin generates a charge/invoice
router.post(
  "/charges",
  requireAuth,
  requirePermission("finances:charge"),
  validateRequest(createChargeSchema),
  FinanceController.createCharge
);

// GET /api/v1/finances/charges - Admin lists all; student sees own
router.get(
  "/charges",
  requireAuth,
  requirePermission("finances:view_self", "finances:view_all"),
  FinanceController.listCharges
);

// PATCH /api/v1/finances/charges/:id/cancel - Admin cancels a charge
router.patch(
  "/charges/:id/cancel",
  requireAuth,
  requirePermission("finances:charge"),
  validateRequest(cancelChargeSchema),
  FinanceController.cancelCharge
);

// ── Payments ───────────────────────────────────────────────────────────────

// POST /api/v1/finances/payments - Admin records a payment
router.post(
  "/payments",
  requireAuth,
  requirePermission("finances:record_payment"),
  validateRequest(recordPaymentSchema),
  FinanceController.recordPayment
);

// GET /api/v1/finances/payments - Admin lists all; student sees own
router.get(
  "/payments",
  requireAuth,
  requirePermission("finances:view_self", "finances:view_all"),
  FinanceController.listPayments
);

// GET /api/v1/finances/receipts/:receiptNumber - Get receipt by number
router.get(
  "/receipts/:receiptNumber",
  requireAuth,
  requirePermission("finances:view_self", "finances:view_all"),
  FinanceController.getReceipt
);

// POST /api/v1/finances/payments/:id/reverse - Admin reverses a payment
router.post(
  "/payments/:id/reverse",
  requireAuth,
  requirePermission("finances:reverse"),
  validateRequest(reversePaymentSchema),
  FinanceController.reversePayment
);

// ── Ledger ─────────────────────────────────────────────────────────────────

// GET /api/v1/finances/ledger/me - Student views own ledger
router.get(
  "/ledger/me",
  requireAuth,
  requirePermission("finances:view_self"),
  FinanceController.getOwnLedger
);

// GET /api/v1/finances/ledger/:studentId - Admin views any student's ledger
router.get(
  "/ledger/:studentId",
  requireAuth,
  requirePermission("finances:view_all"),
  FinanceController.getLedger
);

// ── Refunds ────────────────────────────────────────────────────────────────

// POST /api/v1/finances/refunds - Admin issues a refund
router.post(
  "/refunds",
  requireAuth,
  requirePermission("finances:reverse"),
  validateRequest(createRefundSchema),
  FinanceController.createRefund
);

// GET /api/v1/finances/refunds - Admin lists all; student sees own
router.get(
  "/refunds",
  requireAuth,
  requirePermission("finances:view_self", "finances:view_all"),
  FinanceController.listRefunds
);

export default router;
