import mongoose, { Document, Model, Schema } from "mongoose";

export type Gender = "MALE" | "FEMALE" | "OTHER";
export type BloodGroup =
  | "A+"
  | "A-"
  | "B+"
  | "B-"
  | "AB+"
  | "AB-"
  | "O+"
  | "O-"
  | "UNKNOWN";
export type DietaryPreference =
  | "VEGETARIAN"
  | "NON_VEGETARIAN"
  | "EGGITARIAN"
  | "VEGAN";
export type KycDocumentType = "AADHAAR" | "PAN" | "COLLEGE_ID" | "PASSPORT";

export interface IAddress {
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export interface IEmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  email?: string | null;
}

export interface IAcademicInfo {
  rollNumber?: string;
  course?: string;
  branch?: string;
  yearOfStudy?: number;
}

export interface IBankDetails {
  accountHolderName?: string;
  maskedAccountNumber?: string;
  ifscCode?: string;
  bankName?: string;
}

export interface IKycDocument {
  _id?: mongoose.Types.ObjectId;
  documentType: KycDocumentType;
  maskedIdNumber: string;
  fileKey: string;
  fileName?: string;
  fileMimeType?: string;
  fileSize?: number;
  verified: boolean;
  verifiedByAdminId?: mongoose.Types.ObjectId | null;
  verifiedAt?: Date | null;
  uploadedAt: Date;
}

export interface IStudentProfile extends Document {
  userId: mongoose.Types.ObjectId;
  fullName: string;
  registeredPhone: string;
  alternatePhone?: string | null;
  dateOfBirth?: Date | null;
  gender?: Gender;
  bloodGroup?: BloodGroup;
  dietaryPreference: DietaryPreference;
  academicInfo?: IAcademicInfo;
  addresses?: {
    permanent?: IAddress;
    current?: IAddress;
  };
  emergencyContact: IEmergencyContact;
  bankDetails?: IBankDetails;
  kycDocuments: IKycDocument[];
  profilePictureKey?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const kycDocumentSchema = new Schema<IKycDocument>(
  {
    documentType: {
      type: String,
      enum: ["AADHAAR", "PAN", "COLLEGE_ID", "PASSPORT"],
      required: true,
    },
    maskedIdNumber: {
      type: String,
      required: true,
      trim: true,
    },
    fileKey: {
      type: String,
      required: true,
    },
    fileName: {
      type: String,
      default: "document.pdf",
    },
    fileMimeType: {
      type: String,
      default: "application/pdf",
    },
    fileSize: {
      type: Number,
      default: 0,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    verifiedByAdminId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const studentProfileSchema = new Schema<IStudentProfile>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    registeredPhone: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    alternatePhone: {
      type: String,
      trim: true,
      default: null,
    },
    dateOfBirth: {
      type: Date,
      default: null,
    },
    gender: {
      type: String,
      enum: ["MALE", "FEMALE", "OTHER"],
      default: null,
    },
    bloodGroup: {
      type: String,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "UNKNOWN"],
      default: "UNKNOWN",
    },
    dietaryPreference: {
      type: String,
      enum: ["VEGETARIAN", "NON_VEGETARIAN", "EGGITARIAN", "VEGAN"],
      default: "VEGETARIAN",
    },
    academicInfo: {
      rollNumber: { type: String, trim: true },
      course: { type: String, trim: true },
      branch: { type: String, trim: true },
      yearOfStudy: { type: Number, min: 1, max: 6 },
    },
    addresses: {
      permanent: {
        street: { type: String, trim: true },
        city: { type: String, trim: true },
        state: { type: String, trim: true },
        postalCode: { type: String, trim: true },
        country: { type: String, trim: true, default: "India" },
      },
      current: {
        street: { type: String, trim: true },
        city: { type: String, trim: true },
        state: { type: String, trim: true },
        postalCode: { type: String, trim: true },
        country: { type: String, trim: true, default: "India" },
      },
    },
    emergencyContact: {
      name: { type: String, required: true, trim: true },
      relationship: { type: String, required: true, trim: true },
      phone: { type: String, required: true, trim: true },
      email: { type: String, trim: true, default: null },
    },
    bankDetails: {
      accountHolderName: { type: String, trim: true },
      maskedAccountNumber: { type: String, trim: true },
      ifscCode: { type: String, trim: true },
      bankName: { type: String, trim: true },
    },
    kycDocuments: {
      type: [kycDocumentSchema],
      default: [],
    },
    profilePictureKey: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export const StudentProfile: Model<IStudentProfile> = mongoose.model<IStudentProfile>(
  "StudentProfile",
  studentProfileSchema
);
