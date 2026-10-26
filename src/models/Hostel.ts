import mongoose, { Document, Model, Schema } from "mongoose";

export type GenderType = "MALE" | "FEMALE" | "CO_ED";

export interface IHostelAddress {
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
}

export interface IHostel extends Document {
  name: string;
  code: string;
  genderType: GenderType;
  wardenInChargeId?: mongoose.Types.ObjectId | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
  address?: IHostelAddress;
  amenities: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const hostelSchema = new Schema<IHostel>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    code: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      unique: true,
    },
    genderType: {
      type: String,
      enum: ["MALE", "FEMALE", "CO_ED"],
      required: true,
    },
    wardenInChargeId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    contactPhone: {
      type: String,
      trim: true,
      default: null,
    },
    contactEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: null,
    },
    address: {
      street: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      postalCode: { type: String, trim: true },
    },
    amenities: {
      type: [String],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Hostel: Model<IHostel> = mongoose.model<IHostel>("Hostel", hostelSchema);
