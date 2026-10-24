import mongoose, { Document, Model, Schema } from "mongoose";

export interface IStudentIdCounter extends Document {
  yearMonth: string;
  seq: number;
  createdAt: Date;
  updatedAt: Date;
}

const studentIdCounterSchema = new Schema<IStudentIdCounter>(
  {
    yearMonth: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    seq: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export const StudentIdCounter: Model<IStudentIdCounter> = mongoose.model<IStudentIdCounter>(
  "StudentIdCounter",
  studentIdCounterSchema,
  "studentIdCounters"
);
