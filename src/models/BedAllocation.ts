import mongoose, { Document, Model, Schema } from "mongoose";

export type AllocationStatus = "ACTIVE" | "TRANSFERRED" | "CHECKED_OUT";

export interface IBedAllocation extends Document {
  studentId: mongoose.Types.ObjectId;
  hostelId: mongoose.Types.ObjectId;
  buildingId: mongoose.Types.ObjectId;
  roomId: mongoose.Types.ObjectId;
  bedId: mongoose.Types.ObjectId;
  startDate: Date;
  endDate?: Date | null;
  status: AllocationStatus;
  allocatedByAdminId: mongoose.Types.ObjectId;
  remarks?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const bedAllocationSchema = new Schema<IBedAllocation>(
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
      index: true,
    },
    buildingId: {
      type: Schema.Types.ObjectId,
      ref: "Building",
      required: true,
      index: true,
    },
    roomId: {
      type: Schema.Types.ObjectId,
      ref: "Room",
      required: true,
      index: true,
    },
    bedId: {
      type: Schema.Types.ObjectId,
      ref: "Bed",
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "TRANSFERRED", "CHECKED_OUT"],
      default: "ACTIVE",
      index: true,
    },
    allocatedByAdminId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    remarks: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Unique partial indexes: strictly at most 1 ACTIVE allocation per student and per bed
bedAllocationSchema.index(
  { studentId: 1 },
  { unique: true, partialFilterExpression: { status: "ACTIVE" } }
);
bedAllocationSchema.index(
  { bedId: 1 },
  { unique: true, partialFilterExpression: { status: "ACTIVE" } }
);
bedAllocationSchema.index({ hostelId: 1, status: 1 });
bedAllocationSchema.index({ roomId: 1, status: 1 });

export const BedAllocation: Model<IBedAllocation> = mongoose.model<IBedAllocation>(
  "BedAllocation",
  bedAllocationSchema
);
