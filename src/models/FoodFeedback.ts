import mongoose, { Document, Model, Schema } from "mongoose";
import { MealType } from "./Menu";

export interface IFoodFeedback extends Document {
  studentId: mongoose.Types.ObjectId;
  hostelId: mongoose.Types.ObjectId;
  mealDate: string; // "YYYY-MM-DD"
  date: Date;
  mealType: MealType;
  rating: number; // 1 to 5
  tasteRating?: number | null;
  hygieneRating?: number | null;
  comments?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const foodFeedbackSchema = new Schema<IFoodFeedback>(
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
    date: {
      type: Date,
      default: Date.now,
      required: true,
    },
    mealType: {
      type: String,
      enum: Object.values(MealType),
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: [1, "Rating must be at least 1."],
      max: [5, "Rating cannot exceed 5."],
    },
    tasteRating: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },
    hygieneRating: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },
    comments: {
      type: String,
      maxlength: [1000, "Comments cannot exceed 1000 characters."],
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

foodFeedbackSchema.index({ hostelId: 1, mealDate: -1 });
foodFeedbackSchema.index({ studentId: 1, mealDate: -1 });
foodFeedbackSchema.index({ studentId: 1, mealDate: 1, mealType: 1 });

export const FoodFeedback: Model<IFoodFeedback> = mongoose.model<IFoodFeedback>(
  "FoodFeedback",
  foodFeedbackSchema
);
