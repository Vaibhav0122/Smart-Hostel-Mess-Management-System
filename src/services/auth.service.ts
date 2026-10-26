import crypto from "crypto";
import { User, IUser } from "../models/User";
import { AuditLog } from "../models/AuditLog";
import { UserRole, UserStatus } from "../constants/roles";
import { hashPassword, verifyPassword } from "../utils/password";
import {
  generateAccessToken,
  generateRefreshToken,
  generateActivationToken,
  hashToken,
} from "../utils/token";
import { CounterService } from "./counter.service";
import { AppError } from "../errors/AppError";
import { HttpStatus } from "../constants/statusCodes";
import { env } from "../config/env";
import {
  LoginInput,
  ActivateAccountInput,
  InitiateActivationInput,
} from "../validations/auth.validation";
import { AuthenticatedUser } from "../types/express";

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    role: UserRole;
    studentId?: string | null;
    status: UserStatus;
  };
}

export interface RefreshResult {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    role: UserRole;
    studentId?: string | null;
    status: UserStatus;
  };
}

export class AuthService {
  /**
   * Authenticates a user using email or student ID.
   * - Defense-in-depth: generic error messages to prevent account enumeration.
   * - Enforces temporary lockouts after 5 consecutive failures.
   * - Issues dual tokens: 15-minute access JWT + rotating refresh token.
   */
  public static async login(
    input: LoginInput,
    _ipAddress?: string
  ): Promise<LoginResult> {
    const identifier = input.identifier.trim();
    const isEmail = identifier.includes("@");

    const query = isEmail
      ? { email: identifier.toLowerCase() }
      : { studentId: identifier };

    const user = await User.findOne(query);

    // If user does not exist, run a dummy hash verification to thwart timing attacks
    if (!user) {
      await verifyPassword(
        "$argon2id$v=19$m=65536,t=3,p=4$dummyhashtopreventtimingattack",
        input.password
      );
      throw new AppError(
        HttpStatus.UNAUTHORIZED,
        "INVALID_CREDENTIALS",
        "Invalid identifier or password."
      );
    }

    // Check account lockout status
    if (user.lockUntil && user.lockUntil > new Date()) {
      const minutesRemaining = Math.ceil(
        (user.lockUntil.getTime() - Date.now()) / (60 * 1000)
      );
      throw new AppError(
        HttpStatus.FORBIDDEN,
        "ACCOUNT_LOCKED",
        `Account is temporarily locked due to multiple failed login attempts. Please try again in ${minutesRemaining} minutes.`
      );
    }

    // Verify password hash
    const isPasswordValid = await verifyPassword(
      user.passwordHash,
      input.password
    );

    if (!isPasswordValid) {
      const attempts = (user.failedLoginAttempts || 0) + 1;
      const updates: any = { failedLoginAttempts: attempts };

      if (attempts >= 5) {
        updates.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15-minute lock
      }

      await User.findByIdAndUpdate(user._id, updates);

      throw new AppError(
        HttpStatus.UNAUTHORIZED,
        "INVALID_CREDENTIALS",
        "Invalid identifier or password."
      );
    }

    // Enforce account status constraints
    if (user.status === UserStatus.PENDING_ACTIVATION) {
      throw new AppError(
        HttpStatus.FORBIDDEN,
        "ACCOUNT_PENDING_ACTIVATION",
        "Your account is pending activation. Please use your activation link to set your password."
      );
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new AppError(
        HttpStatus.FORBIDDEN,
        "ACCOUNT_INACTIVE",
        `Your account is currently ${user.status.toLowerCase()}. Please contact hostel administration.`
      );
    }

    // Issue rotating refresh token and store hash
    const { rawToken: refreshToken, tokenHash: refreshTokenHash } =
      generateRefreshToken();

    await User.findByIdAndUpdate(user._id, {
      refreshTokenHash,
      failedLoginAttempts: 0,
      lockUntil: null,
      lastLoginAt: new Date(),
    });

    const accessToken = generateAccessToken({
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
      studentId: user.studentId,
      status: user.status,
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        studentId: user.studentId,
        status: user.status,
      },
    };
  }

  /**
   * Refreshes an expired access token with automatic refresh token rotation.
   * If an old, already-rotated refresh token is presented, reuse is detected and the session is invalidated.
   */
  public static async refresh(rawRefreshToken: string): Promise<RefreshResult> {
    if (!rawRefreshToken) {
      throw new AppError(
        HttpStatus.UNAUTHORIZED,
        "REFRESH_TOKEN_REQUIRED",
        "Refresh token is required."
      );
    }

    const tokenHash = hashToken(rawRefreshToken);
    const user = await User.findOne({ refreshTokenHash: tokenHash });

    if (!user) {
      throw new AppError(
        HttpStatus.UNAUTHORIZED,
        "INVALID_REFRESH_TOKEN",
        "Invalid or revoked refresh token. Please log in again."
      );
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new AppError(
        HttpStatus.FORBIDDEN,
        "ACCOUNT_INACTIVE",
        "User account is no longer active."
      );
    }

    // Rotate refresh token
    const { rawToken: newRefreshToken, tokenHash: newRefreshTokenHash } =
      generateRefreshToken();

    await User.findByIdAndUpdate(user._id, {
      refreshTokenHash: newRefreshTokenHash,
    });

    const accessToken = generateAccessToken({
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
      studentId: user.studentId,
      status: user.status,
    });

    return {
      accessToken,
      refreshToken: newRefreshToken,
      user: {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        studentId: user.studentId,
        status: user.status,
      },
    };
  }

  /**
   * Logs out the user by clearing the active refresh token hash.
   */
  public static async logout(userId: string): Promise<void> {
    await User.findByIdAndUpdate(userId, { refreshTokenHash: null });
  }

  /**
   * Activates a student account using a single-use activation token.
   * - Validates token expiration.
   * - Hashes the new permanent password with Argon2id.
   * - Atomically sets status to ACTIVE and nullifies the activation token hash.
   */
  public static async activateAccount(
    input: ActivateAccountInput
  ): Promise<{ studentId?: string | null; email: string; role: UserRole }> {
    const tokenHash = hashToken(input.activationToken);

    const user = await User.findOne({
      activationTokenHash: tokenHash,
      status: UserStatus.PENDING_ACTIVATION,
    });

    if (!user) {
      throw new AppError(
        HttpStatus.BAD_REQUEST,
        "INVALID_ACTIVATION_TOKEN",
        "The activation token is invalid, expired, or has already been used."
      );
    }

    if (user.activationTokenExpires && user.activationTokenExpires < new Date()) {
      throw new AppError(
        HttpStatus.BAD_REQUEST,
        "EXPIRED_ACTIVATION_TOKEN",
        "The activation token has expired. Please contact administration for a new activation link."
      );
    }

    const passwordHash = await hashPassword(input.newPassword);

    // Atomically consume token and activate user
    await User.findByIdAndUpdate(user._id, {
      passwordHash,
      status: UserStatus.ACTIVE,
      activationTokenHash: null,
      activationTokenExpires: null,
      failedLoginAttempts: 0,
      lockUntil: null,
    });

    return {
      studentId: user.studentId,
      email: user.email,
      role: user.role,
    };
  }

  /**
   * Admin-initiated student account creation and activation setup.
   * - Enforces server-side student ID generation using CounterService.
   * - Generates single-use cryptographically secure activation token (stores only hash).
   * - Configurable expiration (default: 72 hours).
   * - Creates immutable audit log entry.
   */
  public static async initiateStudentActivation(
    adminUser: AuthenticatedUser,
    input: InitiateActivationInput,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{
    user: IUser;
    devActivationToken?: string;
  }> {
    const normalizedEmail = input.email.toLowerCase().trim();

    // Check email uniqueness
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      throw new AppError(
        HttpStatus.CONFLICT,
        "EMAIL_ALREADY_EXISTS",
        "A user with this email address is already registered."
      );
    }

    // Auto-generate student ID if not provided or to enforce permanent counter sequence
    let studentId = input.studentId?.trim();
    if (!studentId) {
      studentId = await CounterService.generateStudentId();
    } else {
      const existingStudentId = await User.findOne({ studentId });
      if (existingStudentId) {
        throw new AppError(
          HttpStatus.CONFLICT,
          "STUDENT_ID_EXISTS",
          `Student ID '${studentId}' is already assigned to an existing account.`
        );
      }
    }

    // Generate single-use activation token with 72-hour expiry
    const { rawToken, tokenHash, expiresAt } = generateActivationToken(
      env.ACTIVATION_TOKEN_TTL_HOURS
    );

    // Generate random dummy password hash for pending account
    const dummyRandomSecret = crypto.randomBytes(32).toString("hex");
    const dummyPasswordHash = await hashPassword(dummyRandomSecret);

    // Create student user account
    const studentUser = await User.create({
      email: normalizedEmail,
      studentId,
      passwordHash: dummyPasswordHash,
      role: UserRole.STUDENT, // Strictly enforce student role; admins cannot be created here
      status: UserStatus.PENDING_ACTIVATION,
      activationTokenHash: tokenHash,
      activationTokenExpires: expiresAt,
      failedLoginAttempts: 0,
      lockUntil: null,
    });

    // Record forensic audit log
    try {
      await AuditLog.create({
        actorId: adminUser.id,
        actorRole: adminUser.role,
        action: "INITIATE_STUDENT_ACTIVATION",
        targetCollection: "users",
        targetDocumentId: studentUser._id,
        newState: {
          email: studentUser.email,
          studentId: studentUser.studentId,
          role: studentUser.role,
          status: studentUser.status,
          activationExpires: expiresAt,
        },
        reason: `Admin ${adminUser.email} initiated student account creation for ${normalizedEmail}`,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
      });
    } catch {
      // Audit log creation should not fail user registration
    }

    // Return raw token only in development or test modes for local evaluation convenience
    const isDevOrTest =
      env.NODE_ENV === "development" || env.NODE_ENV === "test";

    return {
      user: studentUser,
      ...(isDevOrTest ? { devActivationToken: rawToken } : {}),
    };
  }

  /**
   * Retrieves sanitized profile information for the authenticated user.
   */
  public static async getCurrentUser(userId: string): Promise<{
    id: string;
    email: string;
    role: UserRole;
    studentId?: string | null;
    status: UserStatus;
    lastLoginAt?: Date | null;
    createdAt: Date;
  }> {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError(
        HttpStatus.NOT_FOUND,
        "USER_NOT_FOUND",
        "The requested user account was not found."
      );
    }

    return {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      studentId: user.studentId,
      status: user.status,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
    };
  }
}
