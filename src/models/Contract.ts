import mongoose, { Document, Model, Schema } from "mongoose";

export type ContractStatus =
  | "DRAFT"
  | "ACTIVE"
  | "EXIT_REQUESTED"
  | "EXIT_APPROVED"
  | "COMPLETED"
  | "TERMINATED";

export interface IExitRequest {
  requestedExitDate: Date;
  reason: string;
  submissionTimestamp: Date;
  earlyExitPenaltyAmount?: number;
  approvedByAdminId?: mongoose.Types.ObjectId | null;
  approvalTimestamp?: Date | null;
  adminRemarks?: string | null;
}

export interface IContract extends Document {
  studentId: mongoose.Types.ObjectId;
  hostelId: mongoose.Types.ObjectId;
  roomId?: mongoose.Types.ObjectId | null;
  bedId?: mongoose.Types.ObjectId | null;
  startDate: Date;
  endDate: Date;
  tenureMonths: number;
  lockInUntilDate: Date;
  noticePeriodDays: number;
  monthlyRentAmount: number;
  securityDepositAmount: number;
  includedServices: string[];
  status: ContractStatus;
  exitRequest?: IExitRequest | null;
  duesCleared: boolean;
  duesClearedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const exitRequestSchema = new Schema<IExitRequest>(
  {
    requestedExitDate: {
      type: Date,
      required: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    submissionTimestamp: {
      type: Date,
      default: Date.now,
    },
    earlyExitPenaltyAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    approvedByAdminId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    approvalTimestamp: {
      type: Date,
      default: null,
    },
    adminRemarks: {
      type: String,
      default: null,
    },
  },
  { _id: false }
);

const contractSchema = new Schema<IContract>(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    hostelId: {
      type: Schema.Types.ObjectId,
      ref: "Hostel",
      required: true,
    },
    roomId: {
      type: Schema.Types.ObjectId,
      ref: "Room",
      default: null,
    },
    bedId: {
      type: Schema.Types.ObjectId,
      ref: "Bed",
      default: null,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    tenureMonths: {
      type: Number,
      required: true,
      min: 1,
    },
    lockInUntilDate: {
      type: Date,
      required: true,
    },
    noticePeriodDays: {
      type: Number,
      default: 30,
      min: 0,
    },
    monthlyRentAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    securityDepositAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    includedServices: {
      type: [String],
      default: ["WIFI", "MESS", "HOUSEKEEPING", "LAUNDRY"],
    },
    status: {
      type: String,
      enum: [
        "DRAFT",
        "ACTIVE",
        "EXIT_REQUESTED",
        "EXIT_APPROVED",
        "COMPLETED",
        "TERMINATED",
      ],
      default: "DRAFT",
    },
    exitRequest: {
      type: exitRequestSchema,
      default: null,
    },
    duesCleared: {
      type: Boolean,
      default: false,
    },
    duesClearedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

contractSchema.index({ studentId: 1, status: 1 });
contractSchema.index({ hostelId: 1, status: 1 });

export const Contract: Model<IContract> = mongoose.model<IContract>(
  "Contract",
  contractSchema
);
