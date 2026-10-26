import request from "supertest";
import app from "../app";
import { User } from "../models/User";
import { AuditLog } from "../models/AuditLog";
import { Hostel } from "../models/Hostel";
import { StudentProfile } from "../models/StudentProfile";
import { Contract } from "../models/Contract";
import { UserRole, UserStatus } from "../constants/roles";
import { generateAccessToken } from "../utils/token";

jest.mock("../models/User");
jest.mock("../models/AuditLog");
jest.mock("../models/Hostel");
jest.mock("../models/StudentProfile");
jest.mock("../models/Contract");

const MockedUser = User as jest.Mocked<typeof User>;
const MockedAuditLog = AuditLog as jest.Mocked<typeof AuditLog>;
const MockedHostel = Hostel as jest.Mocked<typeof Hostel>;
const MockedStudentProfile = StudentProfile as jest.Mocked<typeof StudentProfile>;
const MockedContract = Contract as jest.Mocked<typeof Contract>;

describe("Phase 6: Student Profiles & Hostel Contracts", () => {
  const adminUser: any = {
    _id: "660000000000000000000001",
    email: "warden@hostel.edu",
    role: UserRole.HOSTEL_ADMIN,
    status: UserStatus.ACTIVE,
  };

  const studentUser1: any = {
    _id: "660000000000000000000002",
    email: "student1@hostel.edu",
    role: UserRole.STUDENT,
    status: UserStatus.ACTIVE,
    studentId: "STU-202610001",
  };

  const studentUser2: any = {
    _id: "660000000000000000000003",
    email: "student2@hostel.edu",
    role: UserRole.STUDENT,
    status: UserStatus.ACTIVE,
    studentId: "STU-202610002",
  };

  let adminToken: string;
  let student1Token: string;

  beforeAll(() => {
    adminToken = generateAccessToken({
      sub: adminUser._id,
      email: adminUser.email,
      role: adminUser.role,
      status: adminUser.status,
    });

    student1Token = generateAccessToken({
      sub: studentUser1._id,
      email: studentUser1.email,
      role: studentUser1.role,
      status: studentUser1.status,
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();

    (MockedUser.findById as jest.Mock).mockImplementation((id: string) => {
      const u =
        id === adminUser._id
          ? adminUser
          : id === studentUser1._id
          ? studentUser1
          : id === studentUser2._id
          ? studentUser2
          : null;
      return {
        select: jest.fn().mockResolvedValue(u),
        then: (resolve: (val: any) => void) => resolve(u),
      };
    });

    (MockedAuditLog.create as jest.Mock).mockResolvedValue({} as any);
  });

  // =========================================================================
  // 1. STUDENT PROFILE TESTS
  // =========================================================================
  describe("Student Profile Management APIs (/api/v1/profile)", () => {
    it("should allow admin to create a student profile", async () => {
      (MockedStudentProfile.findOne as jest.Mock).mockResolvedValueOnce(null);

      const mockProfile: any = {
        _id: "profile_001",
        userId: studentUser1._id,
        fullName: "Aarav Sharma",
        registeredPhone: "9876543210",
        emergencyContact: {
          name: "Suresh Sharma",
          relationship: "Father",
          phone: "9876543211",
        },
        bankDetails: {
          accountHolderName: "Aarav Sharma",
          maskedAccountNumber: "XXXXXX7890",
        },
      };
      mockProfile.toObject = () => mockProfile;
      (MockedStudentProfile.create as jest.Mock).mockResolvedValueOnce(mockProfile);

      const response = await request(app)
        .post("/api/v1/profile")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          userId: studentUser1._id,
          fullName: "Aarav Sharma",
          registeredPhone: "9876543210",
          emergencyContact: {
            name: "Suresh Sharma",
            relationship: "Father",
            phone: "9876543211",
          },
          bankDetails: {
            accountHolderName: "Aarav Sharma",
            accountNumber: "1234567890",
          },
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.profile.fullName).toBe("Aarav Sharma");
      expect(MockedStudentProfile.create).toHaveBeenCalled();
    });

    it("should reject duplicate profile creation for same user with 409", async () => {
      (MockedStudentProfile.findOne as jest.Mock).mockResolvedValueOnce({
        _id: "profile_existing",
        userId: studentUser1._id,
      });

      const response = await request(app)
        .post("/api/v1/profile")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          userId: studentUser1._id,
          fullName: "Aarav Sharma",
          registeredPhone: "9876543210",
          emergencyContact: {
            name: "Suresh Sharma",
            relationship: "Father",
            phone: "9876543211",
          },
        });

      expect(response.status).toBe(409);
      expect(response.body.error.code).toBe("PROFILE_ALREADY_EXISTS");
    });

    it("should allow student to view their own profile via /me", async () => {
      const mockProfile: any = {
        _id: "profile_001",
        userId: studentUser1._id,
        fullName: "Aarav Sharma",
        registeredPhone: "9876543210",
        bankDetails: {
          maskedAccountNumber: "XXXXXX7890",
        },
      };
      (MockedStudentProfile.findOne as jest.Mock).mockResolvedValueOnce(mockProfile);

      const response = await request(app)
        .get("/api/v1/profile/me")
        .set("Authorization", `Bearer ${student1Token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.profile.fullName).toBe("Aarav Sharma");
    });

    it("should allow student to update permitted fields in their own profile", async () => {
      const mockProfile: any = {
        _id: "profile_001",
        userId: studentUser1._id,
        fullName: "Aarav Sharma",
        bloodGroup: "O+",
        dietaryPreference: "VEGETARIAN",
        addresses: { current: { city: "Delhi" } },
      };
      mockProfile.toObject = () => mockProfile;
      mockProfile.save = jest.fn().mockResolvedValue(mockProfile);
      (MockedStudentProfile.findOne as jest.Mock).mockResolvedValueOnce(mockProfile);

      const response = await request(app)
        .patch("/api/v1/profile/me")
        .set("Authorization", `Bearer ${student1Token}`)
        .send({
          bloodGroup: "O+",
          dietaryPreference: "VEGAN",
          addresses: {
            current: { city: "Noida", street: "Sector 62" },
          },
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(mockProfile.save).toHaveBeenCalled();
    });

    it("should reject student attempting to update forbidden fields like role with 400", async () => {
      const response = await request(app)
        .patch("/api/v1/profile/me")
        .set("Authorization", `Bearer ${student1Token}`)
        .send({
          role: "SUPER_ADMIN", // Forbidden field
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("should allow student to upload a KYC document", async () => {
      const mockProfile: any = {
        _id: "profile_001",
        userId: studentUser1._id,
        kycDocuments: [],
      };
      mockProfile.save = jest.fn().mockResolvedValue(mockProfile);
      (MockedStudentProfile.findOne as jest.Mock).mockResolvedValueOnce(mockProfile);

      const response = await request(app)
        .post("/api/v1/profile/documents")
        .set("Authorization", `Bearer ${student1Token}`)
        .send({
          documentType: "AADHAAR",
          idNumber: "123456789012",
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.document.documentType).toBe("AADHAAR");
      expect(response.body.data.document.maskedIdNumber).toBe("XXXX-XXXX-9012");
      expect(mockProfile.save).toHaveBeenCalled();
    });

    it("should allow admin to verify a student's KYC document", async () => {
      const docId = "660000000000000000000099";
      const mockDoc: any = {
        _id: docId,
        documentType: "AADHAAR",
        verified: false,
      };
      const mockProfile: any = {
        _id: "profile_001",
        userId: studentUser1._id,
        kycDocuments: [mockDoc],
      };
      mockProfile.save = jest.fn().mockResolvedValue(mockProfile);
      (MockedStudentProfile.findOne as jest.Mock).mockResolvedValueOnce(mockProfile);

      const response = await request(app)
        .patch(`/api/v1/profile/${studentUser1._id}/documents/${docId}/verify`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(mockDoc.verified).toBe(true);
      expect(mockProfile.save).toHaveBeenCalled();
    });

    it("should prevent Student 1 from viewing Student 2's profile with 403", async () => {
      const response = await request(app)
        .get(`/api/v1/profile/${studentUser2._id}`)
        .set("Authorization", `Bearer ${student1Token}`);

      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe("FORBIDDEN_CROSS_STUDENT_ACCESS");
    });
  });

  // =========================================================================
  // 2. HOSTEL CONTRACT TESTS
  // =========================================================================
  describe("Hostel Contract APIs (/api/v1/contracts)", () => {
    it("should allow admin to create a new residency contract with valid dates", async () => {
      (MockedHostel.findById as jest.Mock).mockResolvedValueOnce({
        _id: "660000000000000000000010",
        name: "Alpha Hostel",
      });
      (MockedContract.findOne as jest.Mock).mockResolvedValueOnce(null);

      const mockContract: any = {
        _id: "contract_001",
        studentId: studentUser1._id,
        hostelId: "660000000000000000000010",
        startDate: new Date("2026-11-01"),
        endDate: new Date("2027-10-31"),
        tenureMonths: 12,
        lockInUntilDate: new Date("2027-04-30"),
        monthlyRentAmount: 8500,
        securityDepositAmount: 15000,
        status: "ACTIVE",
      };
      mockContract.toObject = () => mockContract;
      (MockedContract.create as jest.Mock).mockResolvedValueOnce(mockContract);

      const response = await request(app)
        .post("/api/v1/contracts")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          studentId: studentUser1._id,
          hostelId: "660000000000000000000010",
          startDate: "2026-11-01",
          endDate: "2027-10-31",
          tenureMonths: 12,
          lockInUntilDate: "2027-04-30",
          monthlyRentAmount: 8500,
          securityDepositAmount: 15000,
          status: "ACTIVE",
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.contract.monthlyRentAmount).toBe(8500);
      expect(MockedContract.create).toHaveBeenCalled();
    });

    it("should reject contract creation with 400 when endDate is before startDate", async () => {
      const response = await request(app)
        .post("/api/v1/contracts")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          studentId: studentUser1._id,
          hostelId: "660000000000000000000010",
          startDate: "2027-11-01",
          endDate: "2026-10-31", // Invalid: end before start
          tenureMonths: 12,
          lockInUntilDate: "2027-04-30",
          monthlyRentAmount: 8500,
          securityDepositAmount: 15000,
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("should reject contract when lockInUntilDate falls outside contract dates", async () => {
      const response = await request(app)
        .post("/api/v1/contracts")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          studentId: studentUser1._id,
          hostelId: "660000000000000000000010",
          startDate: "2026-11-01",
          endDate: "2027-10-31",
          tenureMonths: 12,
          lockInUntilDate: "2028-01-01", // Outside contract range
          monthlyRentAmount: 8500,
          securityDepositAmount: 15000,
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("should reject contract if student already holds an ACTIVE contract with 409", async () => {
      (MockedHostel.findById as jest.Mock).mockResolvedValueOnce({
        _id: "660000000000000000000010",
      });
      (MockedContract.findOne as jest.Mock).mockResolvedValueOnce({
        _id: "contract_existing",
        studentId: studentUser1._id,
        status: "ACTIVE",
      });

      const response = await request(app)
        .post("/api/v1/contracts")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          studentId: studentUser1._id,
          hostelId: "660000000000000000000010",
          startDate: "2026-11-01",
          endDate: "2027-10-31",
          tenureMonths: 12,
          lockInUntilDate: "2027-04-30",
          monthlyRentAmount: 8500,
          securityDepositAmount: 15000,
          status: "ACTIVE",
        });

      expect(response.status).toBe(409);
      expect(response.body.error.code).toBe("ACTIVE_CONTRACT_EXISTS");
    });

    it("should allow student to view their own contract history", async () => {
      const mockContracts = [
        { _id: "c1", studentId: studentUser1._id, status: "ACTIVE" },
      ];
      (MockedContract.find as jest.Mock).mockReturnValueOnce({
        sort: jest.fn().mockResolvedValueOnce(mockContracts),
      } as any);

      const response = await request(app)
        .get(`/api/v1/contracts/student/${studentUser1._id}/history`)
        .set("Authorization", `Bearer ${student1Token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.contracts).toHaveLength(1);
    });

    it("should reject Student 1 attempting to view Student 2 contract history with 403", async () => {
      const response = await request(app)
        .get(`/api/v1/contracts/student/${studentUser2._id}/history`)
        .set("Authorization", `Bearer ${student1Token}`);

      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe("FORBIDDEN_CROSS_STUDENT_ACCESS");
    });

    it("should allow student to submit an exit request on active contract", async () => {
      const mockContract: any = {
        _id: "contract_001",
        studentId: studentUser1._id,
        status: "ACTIVE",
        lockInUntilDate: new Date("2027-04-30"),
        monthlyRentAmount: 8500,
        securityDepositAmount: 15000,
      };
      mockContract.toObject = () => mockContract;
      mockContract.save = jest.fn().mockResolvedValue(mockContract);
      (MockedContract.findById as jest.Mock).mockResolvedValueOnce(mockContract);

      const response = await request(app)
        .post("/api/v1/contracts/contract_001/exit-request")
        .set("Authorization", `Bearer ${student1Token}`)
        .send({
          requestedExitDate: "2027-05-15",
          reason: "Graduating semester",
        });

      expect(response.status).toBe(200);
      expect(mockContract.status).toBe("EXIT_REQUESTED");
      expect(mockContract.exitRequest.reason).toBe("Graduating semester");
      expect(mockContract.save).toHaveBeenCalled();
    });

    it("should allow admin to approve exit request and finalize contract", async () => {
      const mockContract: any = {
        _id: "contract_001",
        studentId: studentUser1._id,
        status: "EXIT_REQUESTED",
        exitRequest: {
          requestedExitDate: new Date("2027-05-15"),
          reason: "Graduating semester",
        },
      };
      mockContract.toObject = () => mockContract;
      mockContract.save = jest.fn().mockResolvedValue(mockContract);
      (MockedContract.findById as jest.Mock).mockResolvedValueOnce(mockContract);

      const response = await request(app)
        .post("/api/v1/contracts/contract_001/approve-exit")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          adminRemarks: "Dues cleared, room handed over in good order",
        });

      expect(response.status).toBe(200);
      expect(mockContract.status).toBe("EXIT_APPROVED");
      expect(mockContract.duesCleared).toBe(true);
      expect(mockContract.save).toHaveBeenCalled();
    });

    it("should reject student attempting to create contracts with 403", async () => {
      const response = await request(app)
        .post("/api/v1/contracts")
        .set("Authorization", `Bearer ${student1Token}`)
        .send({
          studentId: studentUser1._id,
          hostelId: "660000000000000000000010",
          startDate: "2026-11-01",
          endDate: "2027-10-31",
          tenureMonths: 12,
          lockInUntilDate: "2027-04-30",
          monthlyRentAmount: 8500,
          securityDepositAmount: 15000,
        });

      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe("FORBIDDEN_PERMISSION");
    });
  });
});
