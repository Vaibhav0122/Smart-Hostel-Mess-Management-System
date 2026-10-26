import request from "supertest";
import app from "../app";
import { User } from "../models/User";
import { AuditLog } from "../models/AuditLog";
import { UserRole, UserStatus } from "../constants/roles";
import { generateAccessToken } from "../utils/token";
import { CounterService } from "../services/counter.service";

// Mock User and AuditLog Mongoose models
jest.mock("../models/User");
jest.mock("../models/AuditLog");
jest.mock("../services/counter.service", () => ({
  CounterService: {
    generateStudentId: jest.fn().mockResolvedValue("STU-202610001"),
  },
}));

const MockedUser = User as jest.Mocked<typeof User>;
const MockedAuditLog = AuditLog as jest.Mocked<typeof AuditLog>;
const MockedCounterService = CounterService as jest.Mocked<typeof CounterService>;

describe("Phase 4: Student Onboarding & Bulk CSV Import", () => {
  const adminUser: any = {
    _id: "660000000000000000000001",
    email: "admin@hostel.edu",
    role: UserRole.HOSTEL_ADMIN,
    status: UserStatus.ACTIVE,
  };

  const studentUser: any = {
    _id: "660000000000000000000002",
    email: "student@hostel.edu",
    role: UserRole.STUDENT,
    status: UserStatus.ACTIVE,
    studentId: "STU-202610001",
  };

  let adminToken: string;
  let studentToken: string;

  beforeAll(() => {
    adminToken = generateAccessToken({
      sub: adminUser._id,
      email: adminUser.email,
      role: adminUser.role,
      status: adminUser.status,
    });

    studentToken = generateAccessToken({
      sub: studentUser._id,
      email: studentUser.email,
      role: studentUser.role,
      status: studentUser.status,
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();

    // Default auth mock: return corresponding active user by id
    (MockedUser.findById as jest.Mock).mockImplementation((id: string) => ({
      select: jest.fn().mockImplementation(() => {
        if (id === adminUser._id) return Promise.resolve(adminUser);
        if (id === studentUser._id) return Promise.resolve(studentUser);
        return Promise.resolve(null);
      }),
    }));

    // Default create mock: return user with generated _id
    (MockedUser.create as jest.Mock).mockImplementation((doc: any) =>
      Promise.resolve({
        _id: "user_" + Math.random().toString(36).substring(7),
        ...doc,
      })
    );

    // Default find mock (batch duplicate check in CSV import): return empty array
    (MockedUser.find as jest.Mock).mockReturnValue({
      select: jest.fn().mockResolvedValue([]),
    } as any);

    // Default AuditLog create mock
    (MockedAuditLog.create as jest.Mock).mockResolvedValue({} as any);

    // Default CounterService mock
    (MockedCounterService.generateStudentId as jest.Mock).mockResolvedValue("STU-202610001");
  });

  // -------------------------------------------------------------------------
  // 1. Single Student Registration (POST /api/v1/students)
  // -------------------------------------------------------------------------
  describe("POST /api/v1/students - Single Registration", () => {
    it("should successfully register a student with valid minimal payload", async () => {
      (MockedUser.findOne as jest.Mock).mockResolvedValueOnce(null);

      const response = await request(app)
        .post("/api/v1/students")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          email: "newstudent@hostel.edu",
          fullName: "Aditi Sharma",
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe("newstudent@hostel.edu");
      expect(response.body.data.user.studentId).toBe("STU-202610001");
      expect(response.body.data.user.role).toBe(UserRole.STUDENT);
      expect(response.body.data.user.status).toBe(UserStatus.PENDING_ACTIVATION);
      expect(response.body.data.devActivationToken).toBeDefined();

      expect(MockedUser.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: "newstudent@hostel.edu",
          studentId: "STU-202610001",
          role: UserRole.STUDENT,
          status: UserStatus.PENDING_ACTIVATION,
        })
      );
    });

    it("should register a student with complete academic and emergency contact info", async () => {
      (MockedUser.findOne as jest.Mock).mockResolvedValueOnce(null);

      const response = await request(app)
        .post("/api/v1/students")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          email: "rahul.verma@hostel.edu",
          fullName: "Rahul Verma",
          registeredPhone: "9876543210",
          academicInfo: {
            rollNumber: "CS2026-042",
            course: "B.Tech",
            branch: "Computer Science",
            yearOfStudy: 2,
          },
          emergencyContact: {
            name: "Sunil Verma",
            relationship: "Father",
            phone: "9123456780",
          },
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.studentId).toBe("STU-202610001");
    });

    it("should reject registration with 409 when email already exists", async () => {
      (MockedUser.findOne as jest.Mock).mockResolvedValueOnce({
        _id: "existing_123",
        email: "existing@hostel.edu",
      });

      const response = await request(app)
        .post("/api/v1/students")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          email: "existing@hostel.edu",
          fullName: "Existing Student",
        });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("EMAIL_ALREADY_EXISTS");
      expect(MockedUser.create).not.toHaveBeenCalled();
    });

    it("should reject registration with 400 when fullName is missing", async () => {
      const response = await request(app)
        .post("/api/v1/students")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          email: "test@hostel.edu",
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("should reject registration with 400 when email format is invalid", async () => {
      const response = await request(app)
        .post("/api/v1/students")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          email: "not-an-email",
          fullName: "Valid Name",
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("should reject registration with 400 when registeredPhone is invalid", async () => {
      const response = await request(app)
        .post("/api/v1/students")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          email: "valid@hostel.edu",
          fullName: "Valid Name",
          registeredPhone: "12345", // Invalid Indian phone number
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("should reject non-admin (STUDENT) role with 403 FORBIDDEN_PERMISSION", async () => {
      const response = await request(app)
        .post("/api/v1/students")
        .set("Authorization", `Bearer ${studentToken}`)
        .send({
          email: "someone@hostel.edu",
          fullName: "Someone Else",
        });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("FORBIDDEN_PERMISSION");
    });

    it("should reject unauthenticated request with 401 MISSING_AUTHENTICATION", async () => {
      const response = await request(app)
        .post("/api/v1/students")
        .send({
          email: "someone@hostel.edu",
          fullName: "Someone Else",
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("MISSING_AUTHENTICATION");
    });
  });

  // -------------------------------------------------------------------------
  // 2. Bulk CSV Import (POST /api/v1/students/import-csv)
  // -------------------------------------------------------------------------
  describe("POST /api/v1/students/import-csv - Bulk CSV Import", () => {
    it("should import students successfully from a valid CSV file", async () => {
      const csvData = [
        "email,fullName,registeredPhone,rollNumber,course,branch,yearOfStudy",
        "student1@hostel.edu,Aarav Patel,9876543210,CS001,B.Tech,CSE,1",
        "student2@hostel.edu,Diya Sen,9876543211,CS002,B.Tech,ECE,2",
      ].join("\n");

      (MockedCounterService.generateStudentId as jest.Mock)
        .mockResolvedValueOnce("STU-202610001")
        .mockResolvedValueOnce("STU-202610002");

      const response = await request(app)
        .post("/api/v1/students/import-csv")
        .set("Authorization", `Bearer ${adminToken}`)
        .attach("file", Buffer.from(csvData), {
          filename: "students.csv",
          contentType: "text/csv",
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.totalRows).toBe(2);
      expect(response.body.data.successCount).toBe(2);
      expect(response.body.data.errorCount).toBe(0);
      expect(response.body.data.created).toHaveLength(2);
      expect(response.body.data.created[0].email).toBe("student1@hostel.edu");
      expect(response.body.data.created[0].studentId).toBe("STU-202610001");
      expect(response.body.data.created[1].email).toBe("student2@hostel.edu");
      expect(response.body.data.created[1].studentId).toBe("STU-202610002");
    });

    it("should handle quoted fields containing commas correctly", async () => {
      const csvData = [
        'email,fullName,emergencyContactName',
        'neha@hostel.edu,"Gupta, Neha","Gupta, Suresh"',
      ].join("\n");

      const response = await request(app)
        .post("/api/v1/students/import-csv")
        .set("Authorization", `Bearer ${adminToken}`)
        .attach("file", Buffer.from(csvData), {
          filename: "students.csv",
          contentType: "text/csv",
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.successCount).toBe(1);
      expect(response.body.data.created[0].email).toBe("neha@hostel.edu");
    });

    it("should reject CSV with missing required columns with 400 CSV_MISSING_COLUMNS", async () => {
      const csvData = [
        "email,registeredPhone", // Missing 'fullName' column
        "student1@hostel.edu,9876543210",
      ].join("\n");

      const response = await request(app)
        .post("/api/v1/students/import-csv")
        .set("Authorization", `Bearer ${adminToken}`)
        .attach("file", Buffer.from(csvData), {
          filename: "students.csv",
          contentType: "text/csv",
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("CSV_MISSING_COLUMNS");
      expect(response.body.error.details.missingColumns).toContain("fullName");
    });

    it("should reject empty CSV file with 400 CSV_EMPTY", async () => {
      const csvData = "email,fullName\n"; // Only header, no data rows

      const response = await request(app)
        .post("/api/v1/students/import-csv")
        .set("Authorization", `Bearer ${adminToken}`)
        .attach("file", Buffer.from(csvData), {
          filename: "empty.csv",
          contentType: "text/csv",
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("CSV_EMPTY");
    });

    it("should reject request when no file is uploaded with 400 CSV_FILE_REQUIRED", async () => {
      const response = await request(app)
        .post("/api/v1/students/import-csv")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("CSV_FILE_REQUIRED");
    });

    it("should reject non-admin (STUDENT) role with 403 FORBIDDEN_PERMISSION", async () => {
      const csvData = "email,fullName\nstudent@hostel.edu,Test Student";

      const response = await request(app)
        .post("/api/v1/students/import-csv")
        .set("Authorization", `Bearer ${studentToken}`)
        .attach("file", Buffer.from(csvData), {
          filename: "test.csv",
          contentType: "text/csv",
        });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("FORBIDDEN_PERMISSION");
    });

    it("should report row-level errors for invalid email while creating valid rows", async () => {
      const csvData = [
        "email,fullName",
        "valid@hostel.edu,Valid Student",
        "invalid-email-address,Invalid Student",
      ].join("\n");

      const response = await request(app)
        .post("/api/v1/students/import-csv")
        .set("Authorization", `Bearer ${adminToken}`)
        .attach("file", Buffer.from(csvData), {
          filename: "students.csv",
          contentType: "text/csv",
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.totalRows).toBe(2);
      expect(response.body.data.successCount).toBe(1);
      expect(response.body.data.errorCount).toBe(1);
      expect(response.body.data.created).toHaveLength(1);
      expect(response.body.data.created[0].email).toBe("valid@hostel.edu");
      expect(response.body.data.errors).toHaveLength(1);
      expect(response.body.data.errors[0].row).toBe(3);
    });

    it("should detect duplicate emails within the CSV file and flag subsequent rows", async () => {
      const csvData = [
        "email,fullName",
        "duplicate@hostel.edu,First Person",
        "duplicate@hostel.edu,Second Person",
      ].join("\n");

      const response = await request(app)
        .post("/api/v1/students/import-csv")
        .set("Authorization", `Bearer ${adminToken}`)
        .attach("file", Buffer.from(csvData), {
          filename: "students.csv",
          contentType: "text/csv",
        });

      expect(response.status).toBe(201);
      expect(response.body.data.totalRows).toBe(2);
      expect(response.body.data.successCount).toBe(1);
      expect(response.body.data.errorCount).toBe(1);
      expect(response.body.data.errors[0].row).toBe(3);
      expect(response.body.data.errors[0].errors[0].message).toContain("Duplicate email within CSV");
    });

    it("should detect emails already present in the database and report row errors", async () => {
      const csvData = [
        "email,fullName",
        "alreadyindb@hostel.edu,Existing Person",
        "brandnew@hostel.edu,New Person",
      ].join("\n");

      // Mock database returning alreadyindb@hostel.edu in batch check
      (MockedUser.find as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockResolvedValueOnce([{ email: "alreadyindb@hostel.edu" }]),
      } as any);

      const response = await request(app)
        .post("/api/v1/students/import-csv")
        .set("Authorization", `Bearer ${adminToken}`)
        .attach("file", Buffer.from(csvData), {
          filename: "students.csv",
          contentType: "text/csv",
        });

      expect(response.status).toBe(201);
      expect(response.body.data.totalRows).toBe(2);
      expect(response.body.data.successCount).toBe(1);
      expect(response.body.data.errorCount).toBe(1);
      expect(response.body.data.created[0].email).toBe("brandnew@hostel.edu");
      expect(response.body.data.errors[0].row).toBe(2);
      expect(response.body.data.errors[0].errors[0].message).toContain("already exists");
    });
  });

  // -------------------------------------------------------------------------
  // 3. Student ID Auto-Generation & Unique Sequences
  // -------------------------------------------------------------------------
  describe("Student ID Sequence Generation", () => {
    it("should assign distinct sequential student IDs to multiple registrations", async () => {
      (MockedUser.findOne as jest.Mock).mockResolvedValue(null);
      (MockedCounterService.generateStudentId as jest.Mock)
        .mockResolvedValueOnce("STU-202610001")
        .mockResolvedValueOnce("STU-202610002")
        .mockResolvedValueOnce("STU-202610003");

      const res1 = await request(app)
        .post("/api/v1/students")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ email: "student1@hostel.edu", fullName: "Student One" });

      const res2 = await request(app)
        .post("/api/v1/students")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ email: "student2@hostel.edu", fullName: "Student Two" });

      const res3 = await request(app)
        .post("/api/v1/students")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ email: "student3@hostel.edu", fullName: "Student Three" });

      expect(res1.body.data.user.studentId).toBe("STU-202610001");
      expect(res2.body.data.user.studentId).toBe("STU-202610002");
      expect(res3.body.data.user.studentId).toBe("STU-202610003");
      expect(MockedCounterService.generateStudentId).toHaveBeenCalledTimes(3);
    });
  });
});
