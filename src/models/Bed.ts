import mongoose, { Document, Model, Schema } from "mongoose";

export type BedStatus = "VACANT" | "OCCUPIED" | "UNDER_MAINTENANCE" | "BLOCKED";

export interface IBed extends Document {
  roomId: mongoose.Types.ObjectId;
  buildingId: mongoose.Types.ObjectId;
  hostelId: mongoose.Types.ObjectId;
  bedLabel: string;
  status: BedStatus;
  currentAllocationId?: mongoose.Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const bedSchema = new Schema<IBed>(
  {
    roomId: {
      type: Schema.Types.ObjectId,
      ref: "Room",
      required: true,
      index: true,
    },
    buildingId: {
      type: Schema.Types.ObjectId,
      ref: "Building",
      required: true,
      index: true,
    },
    hostelId: {
      type: Schema.Types.ObjectId,
      ref: "Hostel",
      required: true,
      index: true,
    },
    bedLabel: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    status: {
      type: String,
      enum: ["VACANT", "OCCUPIED", "UNDER_MAINTENANCE", "BLOCKED"],
      default: "VACANT",
      index: true,
    },
    currentAllocationId: {
      type: Schema.Types.ObjectId,
      ref: "BedAllocation",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound Unique: bed label unique per room (e.g. Bed A, Bed B)
bedSchema.index({ roomId: 1, bedLabel: 1 }, { unique: true });
bedSchema.index({ hostelId: 1, status: 1 });

export const Bed: Model<IBed> = mongoose.model<IBed>("Bed", bedSchema);
