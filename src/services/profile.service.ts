import mongoose from "mongoose";
import { StudentProfile, IStudentProfile, IKycDocument } from "../models/StudentProfile";
import { User } from "../models/User";
import { AuditLog } from "../models/AuditLog";
import { AppError } from "../errors/AppError";
import { HttpStatus } from "../constants/statusCodes";
import { AuthenticatedUser } from "../types/express";
import { UserRole } from "../constants/roles";
import {
  CreateProfileInput,
  UpdateProfileInput,
  UpdateOwnProfileInput,
  UploadKycInput,
} from "../validations/profile.validation";

export class ProfileService {
  /**
   * Helper: Mask bank account number to show only last 4 digits.
   */
  private static maskAccountNumber(acc: string): string {
    const cleaned = acc.trim();
    if (cleaned.length <= 4) return cleaned;
    const visible = cleaned.slice(-4);
    return "X".repeat(Math.max(6, cleaned.length - 4)) + visible;
  }

  /**
   * Helper: Mask KYC identification number.
   */
  private static maskIdNumber(idStr: string): string {
    const cleaned = idStr.trim();
    if (cleaned.length <= 4) return cleaned;
    const last4 = cleaned.slice(-4);
    return `XXXX-XXXX-${last4}`;
  }

  /**
   * Admin creates a student profile record.
   */
  public static async createProfile(
    adminUser: AuthenticatedUser,
    input: CreateProfileInput,
    ipAddress?: string,
    userAgent?: string
  ): Promise<IStudentProfile> {
    const user = await User.findById(input.userId);
    if (!user || user.role !== UserRole.STUDENT) {
      throw new AppError(
        HttpStatus.NOT_FOUND,
        "STUDENT_NOT_FOUND",
        "Target user was not found or is not a registered student."
      );
    }

    const existingProfile = await StudentProfile.findOne({ userId: input.userId });
    if (existingProfile) {
      throw new AppError(
        HttpStatus.CONFLICT,
        "PROFILE_ALREADY_EXISTS",
        "A profile already exists for this student."
      );
    }

    const bankDetails = input.bankDetails
      ? {
          accountHolderName: input.bankDetails.accountHolderName,
          maskedAccountNumber: input.bankDetails.accountNumber
            ? this.maskAccountNumber(input.bankDetails.accountNumber)
            : undefined,
          ifscCode: input.bankDetails.ifscCode,
          bankName: input.bankDetails.bankName,
        }
      : undefined;

    const profile = await StudentProfile.create({
      userId: input.userId,
      fullName: input.fullName.trim(),
      registeredPhone: input.registeredPhone.trim(),
      alternatePhone: input.alternatePhone || null,
      dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : null,
      gender: input.gender || null,
      bloodGroup: input.bloodGroup || "UNKNOWN",
      dietaryPreference: input.dietaryPreference || "VEGETARIAN",
      academicInfo: input.academicInfo || {},
      addresses: input.addresses || {},
      emergencyContact: input.emergencyContact,
      bankDetails,
      kycDocuments: [],
    });

    try {
      await AuditLog.create({
        actorId: adminUser.id,
        actorRole: adminUser.role,
        action: "CREATE_STUDENT_PROFILE",
        targetCollection: "studentProfiles",
        targetDocumentId: profile._id,
        newState: profile.toObject(),
        reason: `Admin ${adminUser.email} created profile for student ${user.email}`,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
      });
    } catch {
      // Non-fatal
    }

    return profile;
  }

  /**
   * Retrieves a student profile by user ID with strict IDOR and sensitivity enforcement.
   */
  public static async getProfileByUserId(
    requestingUser: AuthenticatedUser,
    targetUserId: string
  ): Promise<IStudentProfile> {
    // If student is requesting, enforce strict self-ownership
    if (requestingUser.role === UserRole.STUDENT && requestingUser.id !== targetUserId) {
      throw new AppError(
        HttpStatus.FORBIDDEN,
        "FORBIDDEN_CROSS_STUDENT_ACCESS",
        "You are not authorized to view another student's profile."
      );
    }

    const profile = await StudentProfile.findOne({ userId: targetUserId });
    if (!profile) {
      throw new AppError(
        HttpStatus.NOT_FOUND,
        "PROFILE_NOT_FOUND",
        "Student profile not found."
      );
    }

    return profile;
  }

  /**
   * Student updates permitted fields in their own profile.
   */
  public static async updateOwnProfile(
    studentUser: AuthenticatedUser,
    input: UpdateOwnProfileInput,
    ipAddress?: string,
    userAgent?: string
  ): Promise<IStudentProfile> {
    const profile = await StudentProfile.findOne({ userId: studentUser.id });
    if (!profile) {
      throw new AppError(
        HttpStatus.NOT_FOUND,
        "PROFILE_NOT_FOUND",
        "Your student profile does not exist yet. Please contact administration."
      );
    }

    const previousState = profile.toObject();

    if (input.alternatePhone !== undefined) profile.alternatePhone = input.alternatePhone;
    if (input.bloodGroup) profile.bloodGroup = input.bloodGroup;
    if (input.dietaryPreference) profile.dietaryPreference = input.dietaryPreference;
    if (input.addresses) {
      profile.addresses = {
        ...profile.addresses,
        ...input.addresses,
      };
    }
    if (input.emergencyContact) {
      profile.emergencyContact = {
        ...profile.emergencyContact,
        ...input.emergencyContact,
      };
    }
    if (input.bankDetails) {
      profile.bankDetails = {
        accountHolderName:
          input.bankDetails.accountHolderName ?? profile.bankDetails?.accountHolderName,
        maskedAccountNumber: input.bankDetails.accountNumber
          ? this.maskAccountNumber(input.bankDetails.accountNumber)
          : profile.bankDetails?.maskedAccountNumber,
        ifscCode: input.bankDetails.ifscCode ?? profile.bankDetails?.ifscCode,
        bankName: input.bankDetails.bankName ?? profile.bankDetails?.bankName,
      };
    }

    await profile.save();

    try {
      await AuditLog.create({
        actorId: studentUser.id,
        actorRole: studentUser.role,
        action: "UPDATE_OWN_PROFILE",
        targetCollection: "studentProfiles",
        targetDocumentId: profile._id,
        previousState,
        newState: profile.toObject(),
        reason: `Student ${studentUser.email} updated own profile`,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
      });
    } catch {
      // Non-fatal
    }

    return profile;
  }

  /**
   * Admin updates any student profile.
   */
  public static async updateProfileByAdmin(
    adminUser: AuthenticatedUser,
    targetUserId: string,
    input: UpdateProfileInput,
    ipAddress?: string,
    userAgent?: string
  ): Promise<IStudentProfile> {
    const profile = await StudentProfile.findOne({ userId: targetUserId });
    if (!profile) {
      throw new AppError(
        HttpStatus.NOT_FOUND,
        "PROFILE_NOT_FOUND",
        "Student profile not found."
      );
    }

    const previousState = profile.toObject();

    if (input.fullName) profile.fullName = input.fullName.trim();
    if (input.registeredPhone) profile.registeredPhone = input.registeredPhone.trim();
    if (input.alternatePhone !== undefined) profile.alternatePhone = input.alternatePhone;
    if (input.dateOfBirth) profile.dateOfBirth = new Date(input.dateOfBirth);
    if (input.gender) profile.gender = input.gender;
    if (input.bloodGroup) profile.bloodGroup = input.bloodGroup;
    if (input.dietaryPreference) profile.dietaryPreference = input.dietaryPreference;
    if (input.academicInfo) {
      profile.academicInfo = { ...profile.academicInfo, ...input.academicInfo };
    }
    if (input.addresses) {
      profile.addresses = { ...profile.addresses, ...input.addresses };
    }
    if (input.emergencyContact) {
      profile.emergencyContact = { ...profile.emergencyContact, ...input.emergencyContact };
    }
    if (input.bankDetails) {
      profile.bankDetails = {
        accountHolderName: input.bankDetails.accountHolderName ?? profile.bankDetails?.accountHolderName,
        maskedAccountNumber: input.bankDetails.accountNumber
          ? this.maskAccountNumber(input.bankDetails.accountNumber)
          : profile.bankDetails?.maskedAccountNumber,
        ifscCode: input.bankDetails.ifscCode ?? profile.bankDetails?.ifscCode,
        bankName: input.bankDetails.bankName ?? profile.bankDetails?.bankName,
      };
    }

    await profile.save();

    try {
      await AuditLog.create({
        actorId: adminUser.id,
        actorRole: adminUser.role,
        action: "ADMIN_UPDATE_PROFILE",
        targetCollection: "studentProfiles",
        targetDocumentId: profile._id,
        previousState,
        newState: profile.toObject(),
        reason: `Admin ${adminUser.email} updated student profile ${targetUserId}`,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
      });
    } catch {
      // Non-fatal
    }

    return profile;
  }

  /**
   * Upload and attach a KYC document to the student's profile.
   */
  public static async uploadKycDocument(
    user: AuthenticatedUser,
    input: UploadKycInput,
    fileMetadata?: { fileName?: string; mimeType?: string; size?: number },
    ipAddress?: string,
    userAgent?: string
  ): Promise<IKycDocument> {
    const profile = await StudentProfile.findOne({ userId: user.id });
    if (!profile) {
      throw new AppError(
        HttpStatus.NOT_FOUND,
        "PROFILE_NOT_FOUND",
        "Student profile not found. Complete basic profile registration first."
      );
    }

    const maskedIdNumber = this.maskIdNumber(input.idNumber);
    const fileKey = `kyc/${user.id}/${Date.now()}_${input.documentType.toLowerCase()}.pdf`;

    const newDoc: IKycDocument = {
      _id: new mongoose.Types.ObjectId(),
      documentType: input.documentType,
      maskedIdNumber,
      fileKey,
      fileName: fileMetadata?.fileName || `${input.documentType.toLowerCase()}_proof.pdf`,
      fileMimeType: fileMetadata?.mimeType || "application/pdf",
      fileSize: fileMetadata?.size || 1024,
      verified: false,
      verifiedByAdminId: null,
      verifiedAt: null,
      uploadedAt: new Date(),
    };

    profile.kycDocuments.push(newDoc);
    await profile.save();

    try {
      await AuditLog.create({
        actorId: user.id,
        actorRole: user.role,
        action: "UPLOAD_KYC_DOCUMENT",
        targetCollection: "studentProfiles",
        targetDocumentId: profile._id,
        newState: {
          documentType: input.documentType,
          maskedIdNumber,
          fileKey,
        },
        reason: `Student ${user.email} uploaded KYC proof (${input.documentType})`,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
      });
    } catch {
      // Non-fatal
    }

    return newDoc;
  }

  /**
   * Admin verifies an uploaded KYC document.
   */
  public static async verifyKycDocument(
    adminUser: AuthenticatedUser,
    targetUserId: string,
    documentId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<IKycDocument> {
    const profile = await StudentProfile.findOne({ userId: targetUserId });
    if (!profile) {
      throw new AppError(HttpStatus.NOT_FOUND, "PROFILE_NOT_FOUND", "Profile not found.");
    }

    const doc = profile.kycDocuments.find(
      (d) => d._id?.toString() === documentId
    );
    if (!doc) {
      throw new AppError(HttpStatus.NOT_FOUND, "DOCUMENT_NOT_FOUND", "KYC document not found.");
    }

    doc.verified = true;
    doc.verifiedByAdminId = new mongoose.Types.ObjectId(adminUser.id);
    doc.verifiedAt = new Date();

    await profile.save();

    try {
      await AuditLog.create({
        actorId: adminUser.id,
        actorRole: adminUser.role,
        action: "VERIFY_KYC_DOCUMENT",
        targetCollection: "studentProfiles",
        targetDocumentId: profile._id,
        newState: {
          documentId,
          verified: true,
          verifiedBy: adminUser.id,
        },
        reason: `Admin ${adminUser.email} verified KYC document ${documentId}`,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
      });
    } catch {
      // Non-fatal
    }

    return doc;
  }

  /**
   * List student profiles (Admin).
   */
  public static async listProfiles(query: {
    course?: string;
    branch?: string;
    yearOfStudy?: number | string;
  }): Promise<IStudentProfile[]> {
    const filter: Record<string, unknown> = {};
    if (query.course) filter["academicInfo.course"] = query.course;
    if (query.branch) filter["academicInfo.branch"] = query.branch;
    if (query.yearOfStudy) filter["academicInfo.yearOfStudy"] = Number(query.yearOfStudy);

    return StudentProfile.find(filter).sort({ fullName: 1 });
  }
}
