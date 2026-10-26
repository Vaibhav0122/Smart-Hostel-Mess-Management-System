import mongoose, { Document, Model, Schema } from "mongoose";

export enum MealSelectionChoice {
  DINE_IN = "DINE_IN",
  TIFFIN = "TIFFIN",
}

export interface IMealSelection extends Document {
  studentId: mongoose.Types.ObjectId;
  hostelId: mongoose.Types.ObjectId;
  mealDate: string; // "YYYY-MM-DD"
  mealType: string; // "LUNCH"
  selection: MealSelectionChoice;
  isDefault: boolean;
  selectionTimestamp: Date;
  cutoffPassed: boolean;
  isOverridden: boolean;
  overriddenByAdminId?: mongoose.Types.ObjectId | null;
  overrideReason?: string | null;
  overrideTimestamp?: Date | null;
  previousSelection?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const mealSelectionSchema = new Schema<IMealSelection>(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    hostelId: {
      type: Schema.Types.ObjectId,
      ref: "Hostel",
      required: true,
      index: true,
    },
    mealDate: {
      type: String,
      required: true,
      trim: true,
      match: [/^\d{4}-\d{2}-\d{2}$/, "mealDate must be in YYYY-MM-DD format"],
      index: true,
    },
    mealType: {
      type: String,
      default: "LUNCH",
      enum: ["LUNCH"],
      required: true,
    },
    selection: {
      type: String,
      enum: Object.values(MealSelectionChoice),
      required: true,
      default: MealSelectionChoice.DINE_IN,
    },
    isDefault: {
      type: Boolean,
      required: true,
      default: false,
    },
    selectionTimestamp: {
      type: Date,
      default: Date.now,
      required: true,
    },
    cutoffPassed: {
      type: Boolean,
      default: false,
    },
    isOverridden: {
      type: Boolean,
      default: false,
    },
    overriddenByAdminId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    overrideReason: {
      type: String,
      default: null,
    },
    overrideTimestamp: {
      type: Date,
      default: null,
    },
    previousSelection: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

mealSelectionSchema.index({ studentId: 1, mealDate: 1, mealType: 1 }, { unique: true });
mealSelectionSchema.index({ hostelId: 1, mealDate: 1, selection: 1 });

export const MealSelection: Model<IMealSelection> = mongoose.model<IMealSelection>(
  "MealSelection",
  mealSelectionSchema
);
