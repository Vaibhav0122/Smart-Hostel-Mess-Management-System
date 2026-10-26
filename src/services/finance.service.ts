import mongoose from "mongoose";
import dayjs from "dayjs";
import { ChargeRecord, IChargeRecord, ChargeStatus, ChargeType } from "../models/ChargeRecord";
import { PaymentTransaction, IPaymentTransaction, PaymentStatus } from "../models/PaymentTransaction";
import { RefundRecord, IRefundRecord } from "../models/RefundRecord";
import { Contract } from "../models/Contract";
import { User } from "../models/User";
import { AuditLog } from "../models/AuditLog";
import { AppError } from "../errors/AppError";
import { HttpStatus } from "../constants/statusCodes";
import { AuthenticatedUser } from "../types/express";
import { UserRole } from "../constants/roles";
import {
  CreateChargeInput,
  CancelChargeInput,
  RecordPaymentInput,
  ReversePaymentInput,
  CreateRefundInput,
} from "../validations/finance.validation";

// ---------------------------------------------------------------------------
// Internal sequence generators
// ---------------------------------------------------------------------------

async function nextChargeNumber(): Promise<string> {
  const ym = dayjs().format("YYYYMM");
  // Use atomic increment on ChargeRecord itself (count-based approach).
  // We use a simple cross-document findOneAndUpdate on a singleton counter
  // keyed inside StudentIdCounter collection with a special prefix key.
  const { StudentIdCounter } = await import("../models/StudentIdCounter");
  const doc = await StudentIdCounter.findOneAndUpdate(
    { yearMonth: `CHG-${ym}` },
    { $inc: { seq: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  if (!doc) throw new AppError(HttpStatus.INTERNAL_SERVER_ERROR, "COUNTER_ERROR", "Charge counter failed");
  const seq = String(doc.seq).padStart(4, "0");
  return `CHG-${ym}-${seq}`;
}

async function nextReceiptNumber(): Promise<string> {
  const ym = dayjs().format("YYYYMM");
  const { StudentIdCounter } = await import("../models/StudentIdCounter");
  const doc = await StudentIdCounter.findOneAndUpdate(
    { yearMonth: `REC-${ym}` },
    { $inc: { seq: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  if (!doc) throw new AppError(HttpStatus.INTERNAL_SERVER_ERROR, "COUNTER_ERROR", "Receipt counter failed");
  const seq = String(doc.seq).padStart(5, "0");
  return `REC-${ym}-${seq}`;
}

async function nextRefundNumber(): Promise<string> {
  const ym = dayjs().format("YYYYMM");
  const { StudentIdCounter } = await import("../models/StudentIdCounter");
  const doc = await StudentIdCounter.findOneAndUpdate(
    { yearMonth: `REF-${ym}` },
    { $inc: { seq: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  if (!doc) throw new AppError(HttpStatus.INTERNAL_SERVER_ERROR, "COUNTER_ERROR", "Refund counter failed");
  const seq = String(doc.seq).padStart(4, "0");
  return `REF-${ym}-${seq}`;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function assertStudentExists(studentId: string): Promise<void> {
  const student = await User.findById(studentId);
  if (!student || student.role !== UserRole.STUDENT) {
    throw new AppError(HttpStatus.NOT_FOUND, "STUDENT_NOT_FOUND", "Student not found.");
  }
}

async function assertContractExists(contractId: string): Promise<void> {
  const contract = await Contract.findById(contractId);
  if (!contract) {
    throw new AppError(HttpStatus.NOT_FOUND, "CONTRACT_NOT_FOUND", "Contract not found.");
  }
}

// ---------------------------------------------------------------------------
// FinanceService
// ---------------------------------------------------------------------------

export class FinanceService {
  // -----------------------------------------------------------------------
  // 7.1 Generate a charge / invoice
  // -----------------------------------------------------------------------
  public static async createCharge(
    adminUser: AuthenticatedUser,
    input: CreateChargeInput,
    ipAddress?: string,
    userAgent?: string
  ): Promise<IChargeRecord> {
    await assertStudentExists(input.studentId);
    await assertContractExists(input.contractId);

    const chargeNumber = await nextChargeNumber();

    const charge = await ChargeRecord.create({
      chargeNumber,
      studentId: new mongoose.Types.ObjectId(input.studentId),
      contractId: new mongoose.Types.ObjectId(input.contractId),
      chargeType: input.chargeType as ChargeType,
      billingPeriod: input.billingPeriod ?? null,
      amount: input.amount,
      dueDate: input.dueDate,
      status: ChargeStatus.UNPAID,
      amountPaid: 0,
      generatedByAdminId: new mongoose.Types.ObjectId(adminUser.id),
      notes: input.notes ?? null,
    });

    await AuditLog.create({
      actorId: new mongoose.Types.ObjectId(adminUser.id),
      actorRole: adminUser.role,
      action: "CHARGE_CREATED",
      targetCollection: "chargerecords",
      targetDocumentId: charge._id,
      newState: { chargeNumber, amount: input.amount, chargeType: input.chargeType },
      ipAddress: ipAddress ?? null,
      userAgent: userAgent ?? null,
      timestamp: new Date(),
    });

    return charge;
  }

  // -----------------------------------------------------------------------
  // List charges (admin sees all, student sees own)
  // -----------------------------------------------------------------------
  public static async listCharges(
    requestingUser: AuthenticatedUser,
    query: { studentId?: string; status?: string; billingPeriod?: string }
  ): Promise<IChargeRecord[]> {
    const filter: Record<string, unknown> = {};

    if (requestingUser.role === UserRole.STUDENT) {
      // Students can only see their own charges
      filter["studentId"] = new mongoose.Types.ObjectId(requestingUser.id);
    } else if (query.studentId) {
      filter["studentId"] = new mongoose.Types.ObjectId(query.studentId);
    }

    if (query.status) filter["status"] = query.status;
    if (query.billingPeriod) filter["billingPeriod"] = query.billingPeriod;

    return ChargeRecord.find(filter).sort({ createdAt: -1 });
  }

  // -----------------------------------------------------------------------
  // Cancel a charge (admin only – must not be PAID)
  // -----------------------------------------------------------------------
  public static async cancelCharge(
    adminUser: AuthenticatedUser,
    chargeId: string,
    input: CancelChargeInput,
    ipAddress?: string,
    userAgent?: string
  ): Promise<IChargeRecord> {
    const charge = await ChargeRecord.findById(chargeId);
    if (!charge) {
      throw new AppError(HttpStatus.NOT_FOUND, "CHARGE_NOT_FOUND", "Charge record not found.");
    }
    if (charge.status === ChargeStatus.PAID) {
      throw new AppError(
        HttpStatus.CONFLICT,
        "CHARGE_ALREADY_PAID",
        "A fully paid charge cannot be cancelled. Issue a refund instead."
      );
    }
    if (charge.status === ChargeStatus.CANCELLED) {
      throw new AppError(HttpStatus.CONFLICT, "CHARGE_ALREADY_CANCELLED", "Charge is already cancelled.");
    }

    const previousStatus = charge.status;
    charge.status = ChargeStatus.CANCELLED;
    charge.cancellationReason = input.cancellationReason;
    charge.cancelledByAdminId = new mongoose.Types.ObjectId(adminUser.id);
    await charge.save();

    await AuditLog.create({
      actorId: new mongoose.Types.ObjectId(adminUser.id),
      actorRole: adminUser.role,
      action: "CHARGE_CANCELLED",
      targetCollection: "chargerecords",
      targetDocumentId: charge._id,
      previousState: { status: previousStatus },
      newState: { status: ChargeStatus.CANCELLED, cancellationReason: input.cancellationReason },
      ipAddress: ipAddress ?? null,
      userAgent: userAgent ?? null,
      timestamp: new Date(),
    });

    return charge;
  }

  // -----------------------------------------------------------------------
  // 7.2 Record a payment (append-only, admin only)
  // -----------------------------------------------------------------------
  public static async recordPayment(
    adminUser: AuthenticatedUser,
    input: RecordPaymentInput,
    ipAddress?: string,
    userAgent?: string
  ): Promise<IPaymentTransaction> {
    await assertStudentExists(input.studentId);

    // Duplicate UTR / reference check
    const existing = await PaymentTransaction.findOne({ referenceNumber: input.referenceNumber });
    if (existing) {
      throw new AppError(
        HttpStatus.CONFLICT,
        "DUPLICATE_REFERENCE_NUMBER",
        `Payment with reference number "${input.referenceNumber}" has already been recorded.`
      );
    }

    // Validate charge if provided
    let chargeRef: IChargeRecord | null = null;
    if (input.chargeRecordId) {
      chargeRef = await ChargeRecord.findById(input.chargeRecordId);
      if (!chargeRef) {
        throw new AppError(HttpStatus.NOT_FOUND, "CHARGE_NOT_FOUND", "Linked charge record not found.");
      }
      if (chargeRef.status === ChargeStatus.CANCELLED) {
        throw new AppError(HttpStatus.CONFLICT, "CHARGE_CANCELLED", "Cannot pay against a cancelled charge.");
      }
      if (chargeRef.status === ChargeStatus.PAID) {
        throw new AppError(HttpStatus.CONFLICT, "CHARGE_ALREADY_PAID", "This charge has already been fully paid.");
      }
      // Validate amount does not exceed outstanding
      const outstanding = chargeRef.amount - chargeRef.amountPaid;
      if (input.amountPaid > outstanding + 0.001) {
        throw new AppError(
          HttpStatus.UNPROCESSABLE_ENTITY,
          "OVERPAYMENT_NOT_ALLOWED",
          `Payment amount (${input.amountPaid}) exceeds outstanding balance (${outstanding.toFixed(2)}).`
        );
      }
    }

    const receiptNumber = await nextReceiptNumber();

    // Atomic session: insert payment + update charge in one transaction
    const session = await mongoose.startSession();
    let payment: IPaymentTransaction | null = null;

    try {
      await session.withTransaction(async () => {
        const [tx] = await PaymentTransaction.create(
          [
            {
              receiptNumber,
              studentId: new mongoose.Types.ObjectId(input.studentId),
              chargeRecordId: input.chargeRecordId
                ? new mongoose.Types.ObjectId(input.chargeRecordId)
                : null,
              amountPaid: input.amountPaid,
              paymentMethod: input.paymentMethod,
              referenceNumber: input.referenceNumber,
              paymentDate: input.paymentDate,
              recordedByAdminId: new mongoose.Types.ObjectId(adminUser.id),
              status: PaymentStatus.SUCCESS,
              isReversal: false,
              notes: input.notes ?? null,
            },
          ],
          { session }
        );

        payment = tx;

        // Update charge record if linked
        if (chargeRef && input.chargeRecordId) {
          const newAmountPaid = chargeRef.amountPaid + input.amountPaid;
          const newStatus =
            newAmountPaid >= chargeRef.amount - 0.001
              ? ChargeStatus.PAID
              : ChargeStatus.PARTIALLY_PAID;

          await ChargeRecord.findByIdAndUpdate(
            input.chargeRecordId,
            { $inc: { amountPaid: input.amountPaid }, $set: { status: newStatus } },
            { session }
          );
        }
      });
    } finally {
      await session.endSession();
    }

    if (!payment) {
      throw new AppError(HttpStatus.INTERNAL_SERVER_ERROR, "PAYMENT_FAILED", "Payment transaction failed.");
    }

    await AuditLog.create({
      actorId: new mongoose.Types.ObjectId(adminUser.id),
      actorRole: adminUser.role,
      action: "PAYMENT_RECORDED",
      targetCollection: "paymenttransactions",
      targetDocumentId: (payment as IPaymentTransaction)._id,
      newState: {
        receiptNumber,
        amountPaid: input.amountPaid,
        paymentMethod: input.paymentMethod,
        referenceNumber: input.referenceNumber,
      },
      ipAddress: ipAddress ?? null,
      userAgent: userAgent ?? null,
      timestamp: new Date(),
    });

    return payment as IPaymentTransaction;
  }

  // -----------------------------------------------------------------------
  // List payment transactions (admin sees all, student sees own)
  // -----------------------------------------------------------------------
  public static async listPayments(
    requestingUser: AuthenticatedUser,
    query: { studentId?: string }
  ): Promise<IPaymentTransaction[]> {
    const filter: Record<string, unknown> = {};
    if (requestingUser.role === UserRole.STUDENT) {
      filter["studentId"] = new mongoose.Types.ObjectId(requestingUser.id);
    } else if (query.studentId) {
      filter["studentId"] = new mongoose.Types.ObjectId(query.studentId);
    }
    return PaymentTransaction.find(filter).sort({ paymentDate: -1 });
  }

  // -----------------------------------------------------------------------
  // Get receipt by receipt number
  // -----------------------------------------------------------------------
  public static async getReceiptByNumber(
    requestingUser: AuthenticatedUser,
    receiptNumber: string
  ): Promise<IPaymentTransaction> {
    const tx = await PaymentTransaction.findOne({ receiptNumber });
    if (!tx) {
      throw new AppError(HttpStatus.NOT_FOUND, "RECEIPT_NOT_FOUND", "Payment receipt not found.");
    }
    // Students can only see their own receipts
    if (
      requestingUser.role === UserRole.STUDENT &&
      tx.studentId.toString() !== requestingUser.id
    ) {
      throw new AppError(HttpStatus.FORBIDDEN, "ACCESS_DENIED", "You do not have permission to view this receipt.");
    }
    return tx;
  }

  // -----------------------------------------------------------------------
  // 7.4 Reverse a payment (admin only — creates an offsetting record)
  // -----------------------------------------------------------------------
  public static async reversePayment(
    adminUser: AuthenticatedUser,
    originalTxId: string,
    input: ReversePaymentInput,
    ipAddress?: string,
    userAgent?: string
  ): Promise<IPaymentTransaction> {
    const original = await PaymentTransaction.findById(originalTxId);
    if (!original) {
      throw new AppError(HttpStatus.NOT_FOUND, "TRANSACTION_NOT_FOUND", "Original payment transaction not found.");
    }
    if (original.isReversal) {
      throw new AppError(HttpStatus.CONFLICT, "ALREADY_REVERSAL", "Cannot reverse a reversal transaction.");
    }
    if (original.status === PaymentStatus.REVERSED) {
      throw new AppError(HttpStatus.CONFLICT, "ALREADY_REVERSED", "This transaction has already been reversed.");
    }

    const receiptNumber = await nextReceiptNumber();

    const session = await mongoose.startSession();
    let reversalTx: IPaymentTransaction | null = null;

    try {
      await session.withTransaction(async () => {
        // 1. Mark original as REVERSED
        await PaymentTransaction.findByIdAndUpdate(
          originalTxId,
          { $set: { status: PaymentStatus.REVERSED } },
          { session }
        );

        // 2. Create reversal record
        const [tx] = await PaymentTransaction.create(
          [
            {
              receiptNumber,
              studentId: original.studentId,
              chargeRecordId: original.chargeRecordId ?? null,
              amountPaid: original.amountPaid,
              paymentMethod: original.paymentMethod,
              referenceNumber: `REV-${original.referenceNumber}-${Date.now()}`,
              paymentDate: new Date(),
              recordedByAdminId: new mongoose.Types.ObjectId(adminUser.id),
              status: PaymentStatus.REVERSED,
              isReversal: true,
              reversalReason: input.reversalReason,
              reversedTransactionId: original._id,
              notes: `Reversal of ${original.receiptNumber}`,
            },
          ],
          { session }
        );
        reversalTx = tx;

        // 3. Roll back the charge record if linked
        if (original.chargeRecordId) {
          const charge = await ChargeRecord.findById(original.chargeRecordId).session(session);
          if (charge) {
            const newAmountPaid = Math.max(0, charge.amountPaid - original.amountPaid);
            let newStatus: ChargeStatus;
            if (newAmountPaid <= 0) newStatus = ChargeStatus.UNPAID;
            else if (newAmountPaid >= charge.amount - 0.001) newStatus = ChargeStatus.PAID;
            else newStatus = ChargeStatus.PARTIALLY_PAID;

            await ChargeRecord.findByIdAndUpdate(
              original.chargeRecordId,
              { $set: { amountPaid: newAmountPaid, status: newStatus } },
              { session }
            );
          }
        }
      });
    } finally {
      await session.endSession();
    }

    if (!reversalTx) {
      throw new AppError(HttpStatus.INTERNAL_SERVER_ERROR, "REVERSAL_FAILED", "Payment reversal failed.");
    }

    await AuditLog.create({
      actorId: new mongoose.Types.ObjectId(adminUser.id),
      actorRole: adminUser.role,
      action: "PAYMENT_REVERSED",
      targetCollection: "paymenttransactions",
      targetDocumentId: original._id,
      previousState: { status: PaymentStatus.SUCCESS },
      newState: {
        status: PaymentStatus.REVERSED,
        reversalReason: input.reversalReason,
        reversalReceiptNumber: receiptNumber,
      },
      ipAddress: ipAddress ?? null,
      userAgent: userAgent ?? null,
      timestamp: new Date(),
    });

    return reversalTx as IPaymentTransaction;
  }

  // -----------------------------------------------------------------------
  // 7.3 Financial Ledger / Dues summary
  // -----------------------------------------------------------------------
  public static async getLedger(
    requestingUser: AuthenticatedUser,
    studentId: string
  ): Promise<{
    totalCharges: number;
    totalPaid: number;
    totalRefunded: number;
    outstandingBalance: number;
    chargeHistory: IChargeRecord[];
    paymentHistory: IPaymentTransaction[];
    refundHistory: IRefundRecord[];
  }> {
    // IDOR: students can only view their own ledger
    if (requestingUser.role === UserRole.STUDENT && requestingUser.id !== studentId) {
      throw new AppError(HttpStatus.FORBIDDEN, "ACCESS_DENIED", "You can only view your own financial ledger.");
    }

    const sid = new mongoose.Types.ObjectId(studentId);

    const [charges, payments, refunds] = await Promise.all([
      ChargeRecord.find({ studentId: sid }).sort({ createdAt: -1 }),
      PaymentTransaction.find({ studentId: sid }).sort({ paymentDate: -1 }),
      RefundRecord.find({ studentId: sid }).sort({ refundDate: -1 }),
    ]);

    const totalCharges = charges
      .filter((c) => c.status !== ChargeStatus.CANCELLED)
      .reduce((sum, c) => sum + c.amount, 0);

    const totalPaid = payments
      .filter((p) => p.status === PaymentStatus.SUCCESS && !p.isReversal)
      .reduce((sum, p) => sum + p.amountPaid, 0);

    const totalRefunded = refunds.reduce((sum, r) => sum + r.amount, 0);

    const netPaid = totalPaid - totalRefunded;
    const outstandingBalance = Math.max(0, totalCharges - netPaid);

    return {
      totalCharges,
      totalPaid,
      totalRefunded,
      outstandingBalance,
      chargeHistory: charges,
      paymentHistory: payments,
      refundHistory: refunds,
    };
  }

  // -----------------------------------------------------------------------
  // 7.5 Issue a refund (admin only)
  // -----------------------------------------------------------------------
  public static async createRefund(
    adminUser: AuthenticatedUser,
    input: CreateRefundInput,
    ipAddress?: string,
    userAgent?: string
  ): Promise<IRefundRecord> {
    await assertStudentExists(input.studentId);
    await assertContractExists(input.contractId);

    if (input.originalPaymentId) {
      const origPay = await PaymentTransaction.findById(input.originalPaymentId);
      if (!origPay) {
        throw new AppError(HttpStatus.NOT_FOUND, "PAYMENT_NOT_FOUND", "Referenced payment transaction not found.");
      }
    }

    const refundNumber = await nextRefundNumber();

    const refund = await RefundRecord.create({
      refundNumber,
      studentId: new mongoose.Types.ObjectId(input.studentId),
      originalPaymentId: input.originalPaymentId
        ? new mongoose.Types.ObjectId(input.originalPaymentId)
        : null,
      contractId: new mongoose.Types.ObjectId(input.contractId),
      amount: input.amount,
      reason: input.reason,
      paymentMethod: input.paymentMethod,
      bankReferenceNumber: input.bankReferenceNumber,
      approvedByAdminId: new mongoose.Types.ObjectId(adminUser.id),
      refundDate: input.refundDate,
      notes: input.notes ?? null,
    });

    await AuditLog.create({
      actorId: new mongoose.Types.ObjectId(adminUser.id),
      actorRole: adminUser.role,
      action: "REFUND_ISSUED",
      targetCollection: "refundrecords",
      targetDocumentId: refund._id,
      newState: { refundNumber, amount: input.amount, reason: input.reason },
      ipAddress: ipAddress ?? null,
      userAgent: userAgent ?? null,
      timestamp: new Date(),
    });

    return refund;
  }

  // -----------------------------------------------------------------------
  // List refunds (admin sees all, student sees own)
  // -----------------------------------------------------------------------
  public static async listRefunds(
    requestingUser: AuthenticatedUser,
    query: { studentId?: string }
  ): Promise<IRefundRecord[]> {
    const filter: Record<string, unknown> = {};
    if (requestingUser.role === UserRole.STUDENT) {
      filter["studentId"] = new mongoose.Types.ObjectId(requestingUser.id);
    } else if (query.studentId) {
      filter["studentId"] = new mongoose.Types.ObjectId(query.studentId);
    }
    return RefundRecord.find(filter).sort({ refundDate: -1 });
  }
}
