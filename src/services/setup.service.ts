import bcrypt from "bcryptjs";
import { User, IUser } from "../models/User";
import { UserRole, UserStatus } from "../constants/roles";
import { AppError } from "../errors/AppError";
import { HttpStatus } from "../constants/statusCodes";
import { env } from "../config/env";
import { InitialAdminSetupInput } from "../validations/setup.validation";

export class SetupService {
  /**
   * Performs the one-time initial administrator account creation.
   *
   * Security Controls:
   * 1. Requires valid ADMIN_SETUP_SECRET.
   * 2. Checks if an administrator already exists; if found, immediately rejects with 403 Forbidden.
   * 3. Hashes password using bcrypt (work factor 12).
   * 4. Provisions the root SUPER_ADMIN in ACTIVE status.
   */
  public static async createInitialAdmin(input: InitialAdminSetupInput): Promise<IUser> {
    // 1. Verify administrative setup secret
    if (input.setupSecret !== env.ADMIN_SETUP_SECRET) {
      throw new AppError(
        HttpStatus.UNAUTHORIZED,
        "INVALID_SETUP_SECRET",
        "The provided administrator setup secret is invalid."
      );
    }

    // 2. Permanent lockdown check: Has any administrator already been provisioned?
    const existingAdminCount = await User.countDocuments({
      role: { $in: [UserRole.SUPER_ADMIN, UserRole.HOSTEL_ADMIN] },
    });

    if (existingAdminCount > 0) {
      throw new AppError(
        HttpStatus.FORBIDDEN,
        "SETUP_ALREADY_COMPLETED",
        "Initial administrator setup has already been completed. This endpoint is permanently locked."
      );
    }

    // 3. Ensure email uniqueness
    const existingUser = await User.findOne({ email: input.email });
    if (existingUser) {
      throw new AppError(
        HttpStatus.CONFLICT,
        "EMAIL_ALREADY_EXISTS",
        "A user with this email address already exists in the system."
      );
    }

    // 4. Hash password with bcrypt (cost factor 12)
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(input.password, salt);

    // 5. Create super administrator
    const adminUser = await User.create({
      email: input.email,
      passwordHash,
      role: UserRole.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
      studentId: null, // Staff/Admins have no studentId
    });

    return adminUser;
  }

  /**
   * Checks whether the initial setup has already been completed.
   */
  public static async isSetupCompleted(): Promise<boolean> {
    const adminCount = await User.countDocuments({
      role: { $in: [UserRole.SUPER_ADMIN, UserRole.HOSTEL_ADMIN] },
    });
    return adminCount > 0;
  }
}
