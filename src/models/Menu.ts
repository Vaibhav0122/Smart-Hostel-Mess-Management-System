import mongoose, { Document, Model, Schema } from "mongoose";

export enum MealType {
  BREAKFAST = "BREAKFAST",
  LUNCH = "LUNCH",
  SNACKS = "SNACKS",
  DINNER = "DINNER",
}

export interface IMenu extends Document {
  hostelId: mongoose.Types.ObjectId;
  mealDate: string; // "YYYY-MM-DD"
  dateAnchor: Date; // UTC anchor
  mealType: MealType;
  title: string;
  items: string[];
  isSpecialMeal: boolean;
  dietaryTags: string[];
  createdByAdminId?: mongoose.Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const menuSchema = new Schema<IMenu>(
  {
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
    dateAnchor: {
      type: Date,
      required: true,
      index: true,
    },
    mealType: {
      type: String,
      enum: Object.values(MealType),
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    items: {
      type: [String],
      required: true,
      validate: [(val: string[]) => val.length > 0, "Menu must contain at least one item."],
    },
    isSpecialMeal: {
      type: Boolean,
      default: false,
    },
    dietaryTags: {
      type: [String],
      default: [],
    },
    createdByAdminId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

menuSchema.index({ hostelId: 1, mealDate: 1, mealType: 1 }, { unique: true });
menuSchema.index({ hostelId: 1, dateAnchor: 1 });

export const Menu: Model<IMenu> = mongoose.model<IMenu>("Menu", menuSchema);
