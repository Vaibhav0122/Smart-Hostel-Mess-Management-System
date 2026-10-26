import mongoose, { Document, Model, Schema } from "mongoose";

export enum RefundReason {
  SECURITY_DEPOSIT_RETURN = "SECURITY_DEPOSIT_RETURN",
  OVERPAYMENT_REFUND = "OVERPAYMENT_REFUND",
  CONTRACT_CANCELLATION = "CONTRACT_CANCELLATION",
}

export enum RefundPaymentMethod {
  BANK_TRANSFER = "BANK_TRANSFER",
  UPI = "UPI",
  CHEQUE = "CHEQUE",
}

export interface IRefundRecord extends Document {
  refundNumber: string;
  studentId: mongoose.Types.ObjectId;
  originalPaymentId?: mongoose.Types.ObjectId | null;
  contractId: mongoose.Types.ObjectId;
  amount: number;
  reason: RefundReason;
  paymentMethod: RefundPaymentMethod;
  bankReferenceNumber: string;
  approvedByAdminId: mongoose.Types.ObjectId;
  refundDate: Date;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const refundRecordSchema = new Schema<IRefundRecord>(
  {
    refundNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    originalPaymentId: {
      type: Schema.Types.ObjectId,
      ref: "PaymentTransaction",
      default: null,
    },
    contractId: {
      type: Schema.Types.ObjectId,
      ref: "Contract",
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },
    reason: {
      type: String,
      enum: Object.values(RefundReason),
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: Object.values(RefundPaymentMethod),
      required: true,
    },
    bankReferenceNumber: {
      type: String,
      required: true,
      trim: true,
    },
    approvedByAdminId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    refundDate: {
      type: Date,
      required: true,
    },
    notes: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

refundRecordSchema.index({ studentId: 1, refundDate: -1 });

export const RefundRecord: Model<IRefundRecord> = mongoose.model<IRefundRecord>(
  "RefundRecord",
  refundRecordSchema
);
