import mongoose, { Document, Model, Schema } from "mongoose";
import { UserRole, UserStatus } from "../constants/roles";

export interface IUser extends Document {
  studentId?: string | null;
  email: string;
  passwordHash: string;
  role: UserRole;
  status: UserStatus;
  activationTokenHash?: string | null;
  activationTokenExpires?: Date | null;
  refreshTokenHash?: string | null;
  passwordResetTokenHash?: string | null;
  passwordResetExpires?: Date | null;
  lastLoginAt?: Date | null;
  failedLoginAttempts: number;
  lockUntil?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    studentId: {
      type: String,
      trim: true,
      default: null,
    },
    email: {
      type: String,
      required: [true, "Email address is required"],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: [true, "Password hash is required"],
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      required: [true, "User role is required"],
      default: UserRole.STUDENT,
    },
    status: {
      type: String,
      enum: Object.values(UserStatus),
      required: [true, "User status is required"],
      default: UserStatus.PENDING_ACTIVATION,
    },
    activationTokenHash: {
      type: String,
      default: null,
    },
    activationTokenExpires: {
      type: Date,
      default: null,
    },
    refreshTokenHash: {
      type: String,
      default: null,
    },
    passwordResetTokenHash: {
      type: String,
      default: null,
    },
    passwordResetExpires: {
      type: Date,
      default: null,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        delete (ret as any).passwordHash;
        delete (ret as any).activationTokenHash;
        delete (ret as any).refreshTokenHash;
        delete (ret as any).passwordResetTokenHash;
        delete (ret as any).__v;
        return ret;
      },
    },
  }
);

// CRITICAL UNIQUE PARTIAL INDEX:
// Strictly indexes only documents where studentId is of type "string".
// This allows administrator, warden, and staff accounts to exist without student IDs
// without duplicate key collisions on null values.
userSchema.index(
  { studentId: 1 },
  {
    unique: true,
    partialFilterExpression: { studentId: { $type: "string" } },
  }
);

// Compound index for role-status filtering
userSchema.index({ role: 1, status: 1 });

export const User: Model<IUser> = mongoose.model<IUser>("User", userSchema, "users");
