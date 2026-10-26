import mongoose, { Document, Model, Schema } from "mongoose";

export enum PaymentMethod {
  CASH = "CASH",
  UPI = "UPI",
  BANK_TRANSFER = "BANK_TRANSFER",
  CHEQUE = "CHEQUE",
  DEMAND_DRAFT = "DEMAND_DRAFT",
}

export enum PaymentStatus {
  SUCCESS = "SUCCESS",
  REVERSED = "REVERSED",
}

export interface IPaymentTransaction extends Document {
  receiptNumber: string;
  studentId: mongoose.Types.ObjectId;
  chargeRecordId?: mongoose.Types.ObjectId | null;
  amountPaid: number;
  paymentMethod: PaymentMethod;
  referenceNumber: string;
  paymentDate: Date;
  recordedByAdminId: mongoose.Types.ObjectId;
  status: PaymentStatus;
  isReversal: boolean;
  reversalReason?: string | null;
  reversedTransactionId?: mongoose.Types.ObjectId | null;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const paymentTransactionSchema = new Schema<IPaymentTransaction>(
  {
    receiptNumber: {
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
    chargeRecordId: {
      type: Schema.Types.ObjectId,
      ref: "ChargeRecord",
      default: null,
      index: true,
    },
    amountPaid: {
      type: Number,
      required: true,
      min: 0.01,
    },
    paymentMethod: {
      type: String,
      enum: Object.values(PaymentMethod),
      required: true,
    },
    referenceNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    paymentDate: {
      type: Date,
      required: true,
    },
    recordedByAdminId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.SUCCESS,
      index: true,
    },
    isReversal: {
      type: Boolean,
      default: false,
    },
    reversalReason: {
      type: String,
      default: null,
    },
    reversedTransactionId: {
      type: Schema.Types.ObjectId,
      ref: "PaymentTransaction",
      default: null,
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

paymentTransactionSchema.index({ studentId: 1, paymentDate: -1 });

export const PaymentTransaction: Model<IPaymentTransaction> = mongoose.model<IPaymentTransaction>(
  "PaymentTransaction",
  paymentTransactionSchema
);
