import mongoose, { Document, Model, Schema } from "mongoose";

export type BuildingStatus = "ACTIVE" | "UNDER_RENOVATION" | "INACTIVE";

export interface IBuilding extends Document {
  hostelId: mongoose.Types.ObjectId;
  name: string;
  totalFloors: number;
  status: BuildingStatus;
  createdAt: Date;
  updatedAt: Date;
}

const buildingSchema = new Schema<IBuilding>(
  {
    hostelId: {
      type: Schema.Types.ObjectId,
      ref: "Hostel",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    totalFloors: {
      type: Number,
      required: true,
      min: 1,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "UNDER_RENOVATION", "INACTIVE"],
      default: "ACTIVE",
    },
  },
  {
    timestamps: true,
  }
);

// Compound Unique: Building name must be unique within a hostel
buildingSchema.index({ hostelId: 1, name: 1 }, { unique: true });

export const Building: Model<IBuilding> = mongoose.model<IBuilding>("Building", buildingSchema);
