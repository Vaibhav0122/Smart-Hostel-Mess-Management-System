import mongoose, { Document, Model, Schema } from "mongoose";

export type RoomType = "SINGLE" | "DOUBLE" | "TRIPLE" | "FOUR_BED";
export type RoomStatus = "AVAILABLE" | "FULL" | "UNDER_MAINTENANCE" | "DECOMMISSIONED";

export const ROOM_CAPACITY_MAP: Record<RoomType, number> = {
  SINGLE: 1,
  DOUBLE: 2,
  TRIPLE: 3,
  FOUR_BED: 4,
};

export interface IRoom extends Document {
  hostelId: mongoose.Types.ObjectId;
  buildingId: mongoose.Types.ObjectId;
  roomNumber: string;
  floor: number;
  roomType: RoomType;
  capacity: number;
  occupiedBeds: number;
  baseMonthlyRent: number;
  status: RoomStatus;
  maintenanceReason?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const roomSchema = new Schema<IRoom>(
  {
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
    roomNumber: {
      type: String,
      required: true,
      trim: true,
    },
    floor: {
      type: Number,
      required: true,
    },
    roomType: {
      type: String,
      enum: ["SINGLE", "DOUBLE", "TRIPLE", "FOUR_BED"],
      required: true,
    },
    capacity: {
      type: Number,
      required: true,
      min: 1,
    },
    occupiedBeds: {
      type: Number,
      default: 0,
      min: 0,
    },
    baseMonthlyRent: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["AVAILABLE", "FULL", "UNDER_MAINTENANCE", "DECOMMISSIONED"],
      default: "AVAILABLE",
    },
    maintenanceReason: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound Unique: room number unique per hostel and building
roomSchema.index({ hostelId: 1, buildingId: 1, roomNumber: 1 }, { unique: true });
roomSchema.index({ hostelId: 1, status: 1 });
roomSchema.index({ buildingId: 1, floor: 1 });

export const Room: Model<IRoom> = mongoose.model<IRoom>("Room", roomSchema);
