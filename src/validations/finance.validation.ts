import { z } from "zod";
import mongoose from "mongoose";

const objectIdString = z
  .string()
  .refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: "Invalid ObjectId format",
  });

// ------------------------------------------------------------------
// 7.1 Generate a charge record (admin)
// ------------------------------------------------------------------
export const createChargeBodySchema = z
  .object({
    studentId: objectIdString,
    contractId: objectIdString,
    chargeType: z.enum([
      "MONTHLY_RENT",
      "SECURITY_DEPOSIT",
      "MESS_FEE",
      "LATE_FINE",
      "DAMAGE_PENALTY",
      "UTILITIES",
      "WAIVER_ADJUSTMENT",
    ]),
    billingPeriod: z
      .string()
      .regex(/^\d{4}-\d{2}$/, "billingPeriod must be in YYYY-MM format")
      .optional()
      .nullable(),
    amount: z.number().positive("Amount must be a positive number"),
    dueDate: z
      .string()
      .datetime({ message: "dueDate must be a valid ISO date string" })
      .transform((v) => new Date(v)),
    notes: z.string().max(500).optional().nullable(),
  })
  .strict();

export const createChargeSchema = z.object({
  body: createChargeBodySchema,
});

export type CreateChargeInput = z.infer<typeof createChargeBodySchema>;

// ------------------------------------------------------------------
// Cancel a charge (admin)
// ------------------------------------------------------------------
export const cancelChargeBodySchema = z
  .object({
    cancellationReason: z
      .string()
      .min(5, "Please provide a reason for cancellation (min 5 chars)"),
  })
  .strict();

export const cancelChargeSchema = z.object({
  body: cancelChargeBodySchema,
});

export type CancelChargeInput = z.infer<typeof cancelChargeBodySchema>;

// ------------------------------------------------------------------
// 7.2 Record a payment transaction (admin)
// ------------------------------------------------------------------
export const recordPaymentBodySchema = z
  .object({
    studentId: objectIdString,
    chargeRecordId: objectIdString.optional().nullable(),
    amountPaid: z.number().positive("amountPaid must be a positive number"),
    paymentMethod: z.enum([
      "CASH",
      "UPI",
      "BANK_TRANSFER",
      "CHEQUE",
      "DEMAND_DRAFT",
    ]),
    referenceNumber: z
      .string()
      .min(4, "referenceNumber must be at least 4 characters"),
    paymentDate: z
      .string()
      .datetime({ message: "paymentDate must be a valid ISO date string" })
      .transform((v) => new Date(v)),
    notes: z.string().max(500).optional().nullable(),
  })
  .strict();

export const recordPaymentSchema = z.object({
  body: recordPaymentBodySchema,
});

export type RecordPaymentInput = z.infer<typeof recordPaymentBodySchema>;

// ------------------------------------------------------------------
// Reverse a payment (admin – creates an offsetting record)
// ------------------------------------------------------------------
export const reversePaymentBodySchema = z
  .object({
    reversalReason: z
      .string()
      .min(5, "Please provide a reversal reason (min 5 chars)"),
  })
  .strict();

export const reversePaymentSchema = z.object({
  body: reversePaymentBodySchema,
});

export type ReversePaymentInput = z.infer<typeof reversePaymentBodySchema>;

// ------------------------------------------------------------------
// 7.5 Issue a refund (admin)
// ------------------------------------------------------------------
export const createRefundBodySchema = z
  .object({
    studentId: objectIdString,
    contractId: objectIdString,
    originalPaymentId: objectIdString.optional().nullable(),
    amount: z.number().positive("amount must be a positive number"),
    reason: z.enum([
      "SECURITY_DEPOSIT_RETURN",
      "OVERPAYMENT_REFUND",
      "CONTRACT_CANCELLATION",
    ]),
    paymentMethod: z.enum(["BANK_TRANSFER", "UPI", "CHEQUE"]),
    bankReferenceNumber: z
      .string()
      .min(4, "bankReferenceNumber must be at least 4 characters"),
    refundDate: z
      .string()
      .datetime({ message: "refundDate must be a valid ISO date string" })
      .transform((v) => new Date(v)),
    notes: z.string().max(500).optional().nullable(),
  })
  .strict();

export const createRefundSchema = z.object({
  body: createRefundBodySchema,
});

export type CreateRefundInput = z.infer<typeof createRefundBodySchema>;
