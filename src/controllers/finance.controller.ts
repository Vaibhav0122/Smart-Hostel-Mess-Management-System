import { Request, Response, NextFunction } from "express";
import { FinanceService } from "../services/finance.service";
import { HttpStatus } from "../constants/statusCodes";

export class FinanceController {
  /**
   * POST /api/v1/finances/charges
   * Admin generates a charge/invoice for a student.
   */
  public static async createCharge(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const charge = await FinanceService.createCharge(
        req.user!,
        req.body,
        req.ip,
        req.headers["user-agent"]
      );
      res.status(HttpStatus.CREATED).json({
        success: true,
        message: "Charge record created successfully.",
        data: { charge },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/finances/charges
   * Admin lists all charges; student lists their own.
   */
  public static async listCharges(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const charges = await FinanceService.listCharges(
        req.user!,
        req.query as { studentId?: string; status?: string; billingPeriod?: string }
      );
      res.status(HttpStatus.OK).json({ success: true, data: { charges } });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/finances/charges/:id/cancel
   * Admin cancels an unpaid or partially-paid charge.
   */
  public static async cancelCharge(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const charge = await FinanceService.cancelCharge(
        req.user!,
        req.params["id"]!,
        req.body,
        req.ip,
        req.headers["user-agent"]
      );
      res.status(HttpStatus.OK).json({
        success: true,
        message: "Charge cancelled successfully.",
        data: { charge },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/finances/payments
   * Admin records a payment transaction (append-only).
   */
  public static async recordPayment(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const payment = await FinanceService.recordPayment(
        req.user!,
        req.body,
        req.ip,
        req.headers["user-agent"]
      );
      res.status(HttpStatus.CREATED).json({
        success: true,
        message: "Payment recorded successfully.",
        data: { payment },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/finances/payments
   * Admin lists all payments; student lists their own.
   */
  public static async listPayments(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const payments = await FinanceService.listPayments(
        req.user!,
        req.query as { studentId?: string }
      );
      res.status(HttpStatus.OK).json({ success: true, data: { payments } });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/finances/receipts/:receiptNumber
   * Student gets their own receipt; admin gets any receipt.
   */
  public static async getReceipt(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const receipt = await FinanceService.getReceiptByNumber(
        req.user!,
        req.params["receiptNumber"]!
      );
      res.status(HttpStatus.OK).json({ success: true, data: { receipt } });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/finances/payments/:id/reverse
   * Admin reverses a payment by creating an offsetting record.
   */
  public static async reversePayment(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const reversal = await FinanceService.reversePayment(
        req.user!,
        req.params["id"]!,
        req.body,
        req.ip,
        req.headers["user-agent"]
      );
      res.status(HttpStatus.CREATED).json({
        success: true,
        message: "Payment reversed successfully. An offsetting record has been created.",
        data: { reversal },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/finances/ledger/me
   * Student views their own ledger summary.
   */
  public static async getOwnLedger(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const ledger = await FinanceService.getLedger(req.user!, req.user!.id);
      res.status(HttpStatus.OK).json({ success: true, data: ledger });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/finances/ledger/:studentId
   * Admin views any student's ledger.
   */
  public static async getLedger(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const ledger = await FinanceService.getLedger(req.user!, req.params["studentId"]!);
      res.status(HttpStatus.OK).json({ success: true, data: ledger });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/finances/refunds
   * Admin issues a refund record.
   */
  public static async createRefund(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const refund = await FinanceService.createRefund(
        req.user!,
        req.body,
        req.ip,
        req.headers["user-agent"]
      );
      res.status(HttpStatus.CREATED).json({
        success: true,
        message: "Refund issued successfully.",
        data: { refund },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/finances/refunds
   * Admin lists all refunds; student lists their own.
   */
  public static async listRefunds(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const refunds = await FinanceService.listRefunds(
        req.user!,
        req.query as { studentId?: string }
      );
      res.status(HttpStatus.OK).json({ success: true, data: { refunds } });
    } catch (error) {
      next(error);
    }
  }
}
