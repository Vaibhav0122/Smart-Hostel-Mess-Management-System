import mongoose from "mongoose";
import { Contract, IContract, ContractStatus } from "../models/Contract";
import { User } from "../models/User";
import { Hostel } from "../models/Hostel";
import { AuditLog } from "../models/AuditLog";
import { AppError } from "../errors/AppError";
import { HttpStatus } from "../constants/statusCodes";
import { AuthenticatedUser } from "../types/express";
import { UserRole } from "../constants/roles";
import {
  CreateContractInput,
  UpdateContractInput,
  ExitRequestInput,
  ApproveExitInput,
} from "../validations/contract.validation";

export class ContractService {
  /**
   * Admin generates a new residency contract for a student.
   */
  public static async createContract(
    adminUser: AuthenticatedUser,
    input: CreateContractInput,
    ipAddress?: string,
    userAgent?: string
  ): Promise<IContract> {
    const student = await User.findById(input.studentId);
    if (!student || student.role !== UserRole.STUDENT) {
      throw new AppError(
        HttpStatus.NOT_FOUND,
        "STUDENT_NOT_FOUND",
        "Target user was not found or is not a registered student."
      );
    }

    const hostel = await Hostel.findById(input.hostelId);
    if (!hostel) {
      throw new AppError(
        HttpStatus.NOT_FOUND,
        "HOSTEL_NOT_FOUND",
        "Target hostel complex was not found."
      );
    }

    // Check for an existing ACTIVE contract for this student
    if (input.status === "ACTIVE") {
      const activeContract = await Contract.findOne({
        studentId: input.studentId,
        status: "ACTIVE",
      });
      if (activeContract) {
        throw new AppError(
          HttpStatus.CONFLICT,
          "ACTIVE_CONTRACT_EXISTS",
          "Student already has an active residency contract. Terminate or complete it before creating a new one."
        );
      }
    }

    const startDate = new Date(input.startDate);
    const endDate = new Date(input.endDate);
    const lockInUntilDate = new Date(input.lockInUntilDate);

    const contract = await Contract.create({
      studentId: student._id,
      hostelId: hostel._id,
      roomId: input.roomId ? new mongoose.Types.ObjectId(input.roomId) : null,
      bedId: input.bedId ? new mongoose.Types.ObjectId(input.bedId) : null,
      startDate,
      endDate,
      tenureMonths: input.tenureMonths,
      lockInUntilDate,
      noticePeriodDays: input.noticePeriodDays ?? 30,
      monthlyRentAmount: input.monthlyRentAmount,
      securityDepositAmount: input.securityDepositAmount,
      includedServices: input.includedServices || [
        "WIFI",
        "MESS",
        "HOUSEKEEPING",
        "LAUNDRY",
      ],
      status: input.status || "DRAFT",
    });

    try {
      await AuditLog.create({
        actorId: adminUser.id,
        actorRole: adminUser.role,
        action: "CREATE_CONTRACT",
        targetCollection: "contracts",
        targetDocumentId: contract._id,
        newState: contract.toObject(),
        reason: `Admin ${adminUser.email} created contract for student ${student.email}`,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
      });
    } catch {
      // Non-fatal
    }

    return contract;
  }

  /**
   * Retrieves a contract by ID with IDOR protection.
   */
  public static async getContractById(
    requestingUser: AuthenticatedUser,
    contractId: string
  ): Promise<IContract> {
    const contract = await Contract.findById(contractId);
    if (!contract) {
      throw new AppError(
        HttpStatus.NOT_FOUND,
        "CONTRACT_NOT_FOUND",
        "Residency contract not found."
      );
    }

    if (
      requestingUser.role === UserRole.STUDENT &&
      contract.studentId.toString() !== requestingUser.id
    ) {
      throw new AppError(
        HttpStatus.FORBIDDEN,
        "FORBIDDEN_CROSS_STUDENT_ACCESS",
        "You are not authorized to view another resident's contract."
      );
    }

    return contract;
  }

  /**
   * Lists contracts with optional filters (Admin).
   */
  public static async listContracts(query: {
    studentId?: string;
    hostelId?: string;
    status?: ContractStatus;
  }): Promise<IContract[]> {
    const filter: Record<string, unknown> = {};
    if (query.studentId) filter.studentId = query.studentId;
    if (query.hostelId) filter.hostelId = query.hostelId;
    if (query.status) filter.status = query.status;

    return Contract.find(filter).sort({ createdAt: -1 });
  }

  /**
   * Returns complete residency contract history for a student.
   */
  public static async getStudentContractHistory(
    requestingUser: AuthenticatedUser,
    studentId: string
  ): Promise<IContract[]> {
    if (
      requestingUser.role === UserRole.STUDENT &&
      requestingUser.id !== studentId
    ) {
      throw new AppError(
        HttpStatus.FORBIDDEN,
        "FORBIDDEN_CROSS_STUDENT_ACCESS",
        "You are not authorized to view another resident's contract history."
      );
    }

    return Contract.find({ studentId }).sort({ createdAt: -1 });
  }

  /**
   * Updates contract details (Admin).
   */
  public static async updateContract(
    adminUser: AuthenticatedUser,
    contractId: string,
    input: UpdateContractInput,
    ipAddress?: string,
    userAgent?: string
  ): Promise<IContract> {
    const contract = await Contract.findById(contractId);
    if (!contract) {
      throw new AppError(
        HttpStatus.NOT_FOUND,
        "CONTRACT_NOT_FOUND",
        "Contract not found."
      );
    }

    const previousState = contract.toObject();

    if (input.roomId !== undefined) {
      contract.roomId = input.roomId ? new mongoose.Types.ObjectId(input.roomId) : null;
    }
    if (input.bedId !== undefined) {
      contract.bedId = input.bedId ? new mongoose.Types.ObjectId(input.bedId) : null;
    }
    if (input.noticePeriodDays !== undefined) contract.noticePeriodDays = input.noticePeriodDays;
    if (input.monthlyRentAmount !== undefined) contract.monthlyRentAmount = input.monthlyRentAmount;
    if (input.securityDepositAmount !== undefined) contract.securityDepositAmount = input.securityDepositAmount;
    if (input.includedServices) contract.includedServices = input.includedServices;
    if (input.status) contract.status = input.status;

    await contract.save();

    try {
      await AuditLog.create({
        actorId: adminUser.id,
        actorRole: adminUser.role,
        action: "UPDATE_CONTRACT",
        targetCollection: "contracts",
        targetDocumentId: contract._id,
        previousState,
        newState: contract.toObject(),
        reason: `Admin ${adminUser.email} updated contract ${contract._id}`,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
      });
    } catch {
      // Non-fatal
    }

    return contract;
  }

  /**
   * Student initiates an exit request on their active residency contract.
   */
  public static async requestExit(
    studentUser: AuthenticatedUser,
    contractId: string,
    input: ExitRequestInput,
    ipAddress?: string,
    userAgent?: string
  ): Promise<IContract> {
    const contract = await Contract.findById(contractId);
    if (!contract) {
      throw new AppError(
        HttpStatus.NOT_FOUND,
        "CONTRACT_NOT_FOUND",
        "Residency contract not found."
      );
    }

    if (contract.studentId.toString() !== studentUser.id) {
      throw new AppError(
        HttpStatus.FORBIDDEN,
        "FORBIDDEN_CROSS_STUDENT_ACCESS",
        "You can only submit an exit request on your own contract."
      );
    }

    if (contract.status !== "ACTIVE") {
      throw new AppError(
        HttpStatus.BAD_REQUEST,
        "CONTRACT_NOT_ACTIVE",
        `Cannot request exit on a contract in '${contract.status}' status. Only ACTIVE contracts can be exited.`
      );
    }

    const requestedExitDate = new Date(input.requestedExitDate);

    // Calculate early exit penalty if leaving prior to lock-in date
    let earlyExitPenaltyAmount = 0;
    if (requestedExitDate < contract.lockInUntilDate) {
      // Lock-in violation penalty: forfeit security deposit or 1 month rent
      earlyExitPenaltyAmount = Math.min(
        contract.securityDepositAmount,
        contract.monthlyRentAmount
      );
    }

    contract.status = "EXIT_REQUESTED";
    contract.exitRequest = {
      requestedExitDate,
      reason: input.reason.trim(),
      submissionTimestamp: new Date(),
      earlyExitPenaltyAmount,
      approvedByAdminId: null,
      approvalTimestamp: null,
      adminRemarks: null,
    };

    await contract.save();

    try {
      await AuditLog.create({
        actorId: studentUser.id,
        actorRole: studentUser.role,
        action: "REQUEST_CONTRACT_EXIT",
        targetCollection: "contracts",
        targetDocumentId: contract._id,
        newState: contract.toObject(),
        reason: `Student ${studentUser.email} requested contract exit on ${requestedExitDate.toISOString()}`,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
      });
    } catch {
      // Non-fatal
    }

    return contract;
  }

  /**
   * Admin approves student exit request and clears residency contract.
   */
  public static async approveExit(
    adminUser: AuthenticatedUser,
    contractId: string,
    input: ApproveExitInput,
    ipAddress?: string,
    userAgent?: string
  ): Promise<IContract> {
    const contract = await Contract.findById(contractId);
    if (!contract) {
      throw new AppError(
        HttpStatus.NOT_FOUND,
        "CONTRACT_NOT_FOUND",
        "Residency contract not found."
      );
    }

    if (
      contract.status !== "EXIT_REQUESTED" &&
      contract.status !== "ACTIVE"
    ) {
      throw new AppError(
        HttpStatus.BAD_REQUEST,
        "INVALID_CONTRACT_STATUS",
        `Cannot approve exit for contract currently in '${contract.status}' status.`
      );
    }

    contract.status = "EXIT_APPROVED";
    contract.duesCleared = true;
    contract.duesClearedAt = new Date();

    if (!contract.exitRequest) {
      contract.exitRequest = {
        requestedExitDate: new Date(),
        reason: "Administrative direct checkout approval",
        submissionTimestamp: new Date(),
        earlyExitPenaltyAmount: input.earlyExitPenaltyAmount || 0,
        approvedByAdminId: new mongoose.Types.ObjectId(adminUser.id),
        approvalTimestamp: new Date(),
        adminRemarks: input.adminRemarks || null,
      };
    } else {
      contract.exitRequest.approvedByAdminId = new mongoose.Types.ObjectId(adminUser.id);
      contract.exitRequest.approvalTimestamp = new Date();
      if (input.adminRemarks) contract.exitRequest.adminRemarks = input.adminRemarks;
      if (input.earlyExitPenaltyAmount !== undefined) {
        contract.exitRequest.earlyExitPenaltyAmount = input.earlyExitPenaltyAmount;
      }
    }

    await contract.save();

    try {
      await AuditLog.create({
        actorId: adminUser.id,
        actorRole: adminUser.role,
        action: "APPROVE_CONTRACT_EXIT",
        targetCollection: "contracts",
        targetDocumentId: contract._id,
        newState: contract.toObject(),
        reason: `Admin ${adminUser.email} approved exit for contract ${contract._id}`,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
      });
    } catch {
      // Non-fatal
    }

    return contract;
  }
}
