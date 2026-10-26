import mongoose, { Document, Model, Schema } from "mongoose";

export enum ChargeType {
  MONTHLY_RENT = "MONTHLY_RENT",
  SECURITY_DEPOSIT = "SECURITY_DEPOSIT",
  MESS_FEE = "MESS_FEE",
  LATE_FINE = "LATE_FINE",
  DAMAGE_PENALTY = "DAMAGE_PENALTY",
  UTILITIES = "UTILITIES",
  WAIVER_ADJUSTMENT = "WAIVER_ADJUSTMENT",
}

export enum ChargeStatus {
  UNPAID = "UNPAID",
  PARTIALLY_PAID = "PARTIALLY_PAID",
  PAID = "PAID",
  CANCELLED = "CANCELLED",
}

export interface IChargeRecord extends Document {
  chargeNumber: string;
  studentId: mongoose.Types.ObjectId;
  contractId: mongoose.Types.ObjectId;
  chargeType: ChargeType;
  billingPeriod?: string | null;
  amount: number;
  dueDate: Date;
  status: ChargeStatus;
  amountPaid: number;
  cancellationReason?: string | null;
  cancelledByAdminId?: mongoose.Types.ObjectId | null;
  generatedByAdminId?: mongoose.Types.ObjectId | null;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const chargeRecordSchema = new Schema<IChargeRecord>(
  {
    chargeNumber: {
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
    contractId: {
      type: Schema.Types.ObjectId,
      ref: "Contract",
      required: true,
      index: true,
    },
    chargeType: {
      type: String,
      enum: Object.values(ChargeType),
      required: true,
    },
    billingPeriod: {
      type: String,
      trim: true,
      default: null,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(ChargeStatus),
      default: ChargeStatus.UNPAID,
      index: true,
    },
    amountPaid: {
      type: Number,
      default: 0,
      min: 0,
    },
    cancellationReason: {
      type: String,
      default: null,
    },
    cancelledByAdminId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    generatedByAdminId: {
      type: Schema.Types.ObjectId,
      ref: "User",
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

chargeRecordSchema.index({ studentId: 1, status: 1 });
chargeRecordSchema.index({ studentId: 1, billingPeriod: 1, chargeType: 1 });

export const ChargeRecord: Model<IChargeRecord> = mongoose.model<IChargeRecord>(
  "ChargeRecord",
  chargeRecordSchema
);
