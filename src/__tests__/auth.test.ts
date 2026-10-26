import request from "supertest";
import app from "../app";
import { User } from "../models/User";
import { AuditLog } from "../models/AuditLog";
import { UserRole, UserStatus } from "../constants/roles";
import { hashPassword } from "../utils/password";
import {
  generateAccessToken,
  generateRefreshToken,
  generateActivationToken,
} from "../utils/token";

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

describe("Phase 3: Authentication & Role-Based Access Control", () => {
  const TEST_PASSWORD = "Password@2026";
  let validPasswordHash: string;

  beforeAll(async () => {
    validPasswordHash = await hashPassword(TEST_PASSWORD);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // 1. User Login Tests
  // -------------------------------------------------------------------------
  describe("POST /api/v1/auth/login", () => {
    it("should authenticate successfully with email and return tokens & user envelope", async () => {
      const mockUser: any = {
        _id: "654321654321654321654321",
        email: "student@hostel.edu",
        studentId: "STU-202610001",
        role: UserRole.STUDENT,
        status: UserStatus.ACTIVE,
        passwordHash: validPasswordHash,
        failedLoginAttempts: 0,
        lockUntil: null,
      };

      (MockedUser.findOne as jest.Mock).mockResolvedValueOnce(mockUser);
      (MockedUser.findByIdAndUpdate as jest.Mock).mockResolvedValueOnce(mockUser);

      const response = await request(app)
        .post("/api/v1/auth/login")
        .send({
          identifier: "student@hostel.edu",
          password: TEST_PASSWORD,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.expiresIn).toBe(900);
      expect(response.body.data.user.email).toBe("student@hostel.edu");
      expect(response.body.data.user.role).toBe(UserRole.STUDENT);

      // Verify refreshToken cookie is set securely
      const cookieHeader = response.headers["set-cookie"];
      expect(cookieHeader).toBeDefined();
      expect(cookieHeader[0]).toContain("refreshToken=");
      expect(cookieHeader[0]).toContain("HttpOnly");
      expect(cookieHeader[0]).toContain("SameSite=Strict");
    });

    it("should authenticate successfully with student ID", async () => {
      const mockUser: any = {
        _id: "654321654321654321654321",
        email: "student@hostel.edu",
        studentId: "STU-202610001",
        role: UserRole.STUDENT,
        status: UserStatus.ACTIVE,
        passwordHash: validPasswordHash,
        failedLoginAttempts: 0,
      };

      (MockedUser.findOne as jest.Mock).mockResolvedValueOnce(mockUser);
      (MockedUser.findByIdAndUpdate as jest.Mock).mockResolvedValueOnce(mockUser);

      const response = await request(app)
        .post("/api/v1/auth/login")
        .send({
          identifier: "STU-202610001",
          password: TEST_PASSWORD,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.studentId).toBe("STU-202610001");
    });

    it("should reject invalid credentials with a generic 401 error", async () => {
      const mockUser: any = {
        _id: "654321654321654321654321",
        email: "student@hostel.edu",
        passwordHash: validPasswordHash,
        failedLoginAttempts: 0,
      };

      (MockedUser.findOne as jest.Mock).mockResolvedValueOnce(mockUser);
      (MockedUser.findByIdAndUpdate as jest.Mock).mockResolvedValueOnce(mockUser);

      const response = await request(app)
        .post("/api/v1/auth/login")
        .send({
          identifier: "student@hostel.edu",
          password: "WrongPassword@999",
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("INVALID_CREDENTIALS");
      expect(response.body.error.message).toBe("Invalid identifier or password.");
    });

    it("should reject non-existent user with the same generic 401 error (no account enumeration)", async () => {
      (MockedUser.findOne as jest.Mock).mockResolvedValueOnce(null);

      const response = await request(app)
        .post("/api/v1/auth/login")
        .send({
          identifier: "nonexistent@hostel.edu",
          password: "SomePassword@123",
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("INVALID_CREDENTIALS");
    });

    it("should reject login if account is pending activation", async () => {
      const pendingUser: any = {
        _id: "654321654321654321654321",
        email: "pending@hostel.edu",
        role: UserRole.STUDENT,
        status: UserStatus.PENDING_ACTIVATION,
        passwordHash: validPasswordHash,
      };

      (MockedUser.findOne as jest.Mock).mockResolvedValueOnce(pendingUser);

      const response = await request(app)
        .post("/api/v1/auth/login")
        .send({
          identifier: "pending@hostel.edu",
          password: TEST_PASSWORD,
        });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("ACCOUNT_PENDING_ACTIVATION");
    });

    it("should reject login if account is suspended or deactivated", async () => {
      const suspendedUser: any = {
        _id: "654321654321654321654321",
        email: "suspended@hostel.edu",
        role: UserRole.STUDENT,
        status: UserStatus.SUSPENDED,
        passwordHash: validPasswordHash,
      };

      (MockedUser.findOne as jest.Mock).mockResolvedValueOnce(suspendedUser);

      const response = await request(app)
        .post("/api/v1/auth/login")
        .send({
          identifier: "suspended@hostel.edu",
          password: TEST_PASSWORD,
        });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("ACCOUNT_INACTIVE");
    });

    it("should reject login if account is locked due to brute force attempts", async () => {
      const lockedUser: any = {
        _id: "654321654321654321654321",
        email: "locked@hostel.edu",
        passwordHash: validPasswordHash,
        lockUntil: new Date(Date.now() + 10 * 60 * 1000), // locked for 10 more minutes
      };

      (MockedUser.findOne as jest.Mock).mockResolvedValueOnce(lockedUser);

      const response = await request(app)
        .post("/api/v1/auth/login")
        .send({
          identifier: "locked@hostel.edu",
          password: TEST_PASSWORD,
        });

      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe("ACCOUNT_LOCKED");
    });

    it("should reject invalid login payloads with 400 VALIDATION_ERROR", async () => {
      const response = await request(app)
        .post("/api/v1/auth/login")
        .send({
          identifier: "",
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("should reject client attempt to inject unauthorized fields (e.g. role tampering)", async () => {
      const response = await request(app)
        .post("/api/v1/auth/login")
        .send({
          identifier: "student@hostel.edu",
          password: TEST_PASSWORD,
          role: "SUPER_ADMIN", // Malicious injection attempt
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
    });
  });

  // -------------------------------------------------------------------------
  // 2. Token Refresh & Rotation Tests
  // -------------------------------------------------------------------------
  describe("POST /api/v1/auth/refresh", () => {
    it("should rotate refresh token and issue new access token on valid cookie", async () => {
      const { rawToken, tokenHash } = generateRefreshToken();

      const mockUser: any = {
        _id: "654321654321654321654321",
        email: "student@hostel.edu",
        role: UserRole.STUDENT,
        status: UserStatus.ACTIVE,
        refreshTokenHash: tokenHash,
      };

      (MockedUser.findOne as jest.Mock).mockResolvedValueOnce(mockUser);
      (MockedUser.findByIdAndUpdate as jest.Mock).mockResolvedValueOnce(mockUser);

      const response = await request(app)
        .post("/api/v1/auth/refresh")
        .set("Cookie", [`refreshToken=${rawToken}`]);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBeDefined();

      // Verify that findByIdAndUpdate was called to rotate the refresh token hash
      expect(MockedUser.findByIdAndUpdate).toHaveBeenCalled();
    });

    it("should detect reuse/revocation and reject an unknown or old refresh token with 401", async () => {
      (MockedUser.findOne as jest.Mock).mockResolvedValueOnce(null);

      const response = await request(app)
        .post("/api/v1/auth/refresh")
        .set("Cookie", ["refreshToken=old_consumed_token_hex_string_12345678"]);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("INVALID_REFRESH_TOKEN");
    });

    it("should reject refresh if no token is provided", async () => {
      const response = await request(app).post("/api/v1/auth/refresh");

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe("REFRESH_TOKEN_REQUIRED");
    });
  });

  // -------------------------------------------------------------------------
  // 3. User Logout & Token Revocation Tests
  // -------------------------------------------------------------------------
  describe("POST /api/v1/auth/logout", () => {
    it("should revoke refresh token hash and clear client cookie upon logout", async () => {
      const mockUser: any = {
        _id: "654321654321654321654321",
        email: "student@hostel.edu",
        role: UserRole.STUDENT,
        status: UserStatus.ACTIVE,
      };

      const validAccessToken = generateAccessToken({
        sub: mockUser._id,
        email: mockUser.email,
        role: mockUser.role,
        status: mockUser.status,
      });

      (MockedUser.findById as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockResolvedValueOnce(mockUser),
      } as any);

      (MockedUser.findByIdAndUpdate as jest.Mock).mockResolvedValueOnce(mockUser);

      const response = await request(app)
        .post("/api/v1/auth/logout")
        .set("Authorization", `Bearer ${validAccessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(MockedUser.findByIdAndUpdate).toHaveBeenCalledWith(
        mockUser._id,
        { refreshTokenHash: null }
      );

      // Verify cookie is cleared (max-age=0 or expires in past)
      const cookieHeader = response.headers["set-cookie"];
      expect(cookieHeader).toBeDefined();
      expect(cookieHeader[0]).toContain("refreshToken=;");
    });
  });

  // -------------------------------------------------------------------------
  // 4. Student Account Activation Lifecycle Tests
  // -------------------------------------------------------------------------
  describe("POST /api/v1/auth/activate", () => {
    it("should activate pending student account and clear activation token", async () => {
      const { rawToken, tokenHash, expiresAt } = generateActivationToken(72);

      const pendingUser: any = {
        _id: "654321654321654321654321",
        email: "student@hostel.edu",
        studentId: "STU-202610001",
        role: UserRole.STUDENT,
        status: UserStatus.PENDING_ACTIVATION,
        activationTokenHash: tokenHash,
        activationTokenExpires: expiresAt,
      };

      (MockedUser.findOne as jest.Mock).mockResolvedValueOnce(pendingUser);
      (MockedUser.findByIdAndUpdate as jest.Mock).mockResolvedValueOnce(pendingUser);

      const response = await request(app)
        .post("/api/v1/auth/activate")
        .send({
          activationToken: rawToken,
          newPassword: "NewSecurePassword@2026",
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.studentId).toBe("STU-202610001");

      // Verify DB update consumed the token
      expect(MockedUser.findByIdAndUpdate).toHaveBeenCalledWith(
        pendingUser._id,
        expect.objectContaining({
          status: UserStatus.ACTIVE,
          activationTokenHash: null,
          activationTokenExpires: null,
        })
      );
    });

    it("should reject expired activation tokens", async () => {
      const { rawToken, tokenHash } = generateActivationToken(-1); // Expired 1 hour ago

      const pendingUser: any = {
        _id: "654321654321654321654321",
        status: UserStatus.PENDING_ACTIVATION,
        activationTokenHash: tokenHash,
        activationTokenExpires: new Date(Date.now() - 3600 * 1000),
      };

      (MockedUser.findOne as jest.Mock).mockResolvedValueOnce(pendingUser);

      const response = await request(app)
        .post("/api/v1/auth/activate")
        .send({
          activationToken: rawToken,
          newPassword: "NewSecurePassword@2026",
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe("EXPIRED_ACTIVATION_TOKEN");
    });

    it("should reject already-consumed or invalid activation tokens", async () => {
      (MockedUser.findOne as jest.Mock).mockResolvedValueOnce(null);

      const response = await request(app)
        .post("/api/v1/auth/activate")
        .send({
          activationToken: "consumed_or_invalid_token_12345678",
          newPassword: "NewSecurePassword@2026",
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe("INVALID_ACTIVATION_TOKEN");
    });

    it("should reject activation passwords that fail security regex policy", async () => {
      const response = await request(app)
        .post("/api/v1/auth/activate")
        .send({
          activationToken: "some_valid_looking_token_12345678",
          newPassword: "weakpassword", // Missing uppercase, number, special char
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
    });
  });

  // -------------------------------------------------------------------------
  // 5. Admin-Initiated Student Account Provisioning Tests
  // -------------------------------------------------------------------------
  describe("POST /api/v1/auth/initiate-activation", () => {
    it("should allow an authorized HOSTEL_ADMIN to initiate student activation", async () => {
      const adminUser: any = {
        _id: "111111111111111111111111",
        email: "warden@hostel.edu",
        role: UserRole.HOSTEL_ADMIN,
        status: UserStatus.ACTIVE,
      };

      const adminToken = generateAccessToken({
        sub: adminUser._id,
        email: adminUser.email,
        role: adminUser.role,
        status: adminUser.status,
      });

      (MockedUser.findById as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockResolvedValueOnce(adminUser),
      } as any);

      (MockedUser.findOne as jest.Mock).mockResolvedValueOnce(null); // No existing email
      (MockedUser.create as jest.Mock).mockResolvedValueOnce({
        _id: "222222222222222222222222",
        email: "newstudent@hostel.edu",
        studentId: "STU-202610001",
        role: UserRole.STUDENT,
        status: UserStatus.PENDING_ACTIVATION,
      });

      (MockedAuditLog.create as jest.Mock).mockResolvedValueOnce({} as any);

      const response = await request(app)
        .post("/api/v1/auth/initiate-activation")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          email: "newstudent@hostel.edu",
          fullName: "Rahul Verma",
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.role).toBe(UserRole.STUDENT);
      expect(response.body.data.user.studentId).toBe("STU-202610001");
      expect(MockedUser.create).toHaveBeenCalledWith(
        expect.objectContaining({
          role: UserRole.STUDENT,
          status: UserStatus.PENDING_ACTIVATION,
          studentId: "STU-202610001",
        })
      );
    });

    it("should prevent a STUDENT from initiating student activations (403 Forbidden)", async () => {
      const studentUser: any = {
        _id: "333333333333333333333333",
        email: "resident@hostel.edu",
        role: UserRole.STUDENT,
        status: UserStatus.ACTIVE,
      };

      const studentToken = generateAccessToken({
        sub: studentUser._id,
        email: studentUser.email,
        role: studentUser.role,
        status: studentUser.status,
      });

      (MockedUser.findById as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockResolvedValueOnce(studentUser),
      } as any);

      const response = await request(app)
        .post("/api/v1/auth/initiate-activation")
        .set("Authorization", `Bearer ${studentToken}`)
        .send({
          email: "another@hostel.edu",
          fullName: "Unauthorized User",
        });

      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe("FORBIDDEN_PERMISSION");
    });
  });

  // -------------------------------------------------------------------------
  // 6. RBAC Protected Routes Tests
  // -------------------------------------------------------------------------
  describe("Role-Based Access Control Guards", () => {
    it("should reject unauthenticated request to protected route with 401", async () => {
      const response = await request(app).get("/api/v1/rbac/admin-only");

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe("MISSING_AUTHENTICATION");
    });

    it("should deny student access to admin-only route with 403 FORBIDDEN_ROLE", async () => {
      const studentUser: any = {
        _id: "333333333333333333333333",
        email: "student@hostel.edu",
        role: UserRole.STUDENT,
        status: UserStatus.ACTIVE,
      };

      const studentToken = generateAccessToken({
        sub: studentUser._id,
        email: studentUser.email,
        role: studentUser.role,
        status: studentUser.status,
      });

      (MockedUser.findById as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockResolvedValueOnce(studentUser),
      } as any);

      const response = await request(app)
        .get("/api/v1/rbac/admin-only")
        .set("Authorization", `Bearer ${studentToken}`);

      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe("FORBIDDEN_ROLE");
    });

    it("should allow admin access to admin-only route with 200 OK", async () => {
      const adminUser: any = {
        _id: "111111111111111111111111",
        email: "admin@hostel.edu",
        role: UserRole.HOSTEL_ADMIN,
        status: UserStatus.ACTIVE,
      };

      const adminToken = generateAccessToken({
        sub: adminUser._id,
        email: adminUser.email,
        role: adminUser.role,
        status: adminUser.status,
      });

      (MockedUser.findById as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockResolvedValueOnce(adminUser),
      } as any);

      const response = await request(app)
        .get("/api/v1/rbac/admin-only")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain("Admin-only resource accessed successfully");
    });

    it("should allow student access to student-only route with 200 OK", async () => {
      const studentUser: any = {
        _id: "333333333333333333333333",
        email: "student@hostel.edu",
        role: UserRole.STUDENT,
        status: UserStatus.ACTIVE,
      };

      const studentToken = generateAccessToken({
        sub: studentUser._id,
        email: studentUser.email,
        role: studentUser.role,
        status: studentUser.status,
      });

      (MockedUser.findById as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockResolvedValueOnce(studentUser),
      } as any);

      const response = await request(app)
        .get("/api/v1/rbac/student-only")
        .set("Authorization", `Bearer ${studentToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain("Student-only resource accessed successfully");
    });
  });

  // -------------------------------------------------------------------------
  // 7. GET /api/v1/auth/me Profile Route Tests
  // -------------------------------------------------------------------------
  describe("GET /api/v1/auth/me", () => {
    it("should return sanitized profile for authenticated user without hashes", async () => {
      const mockUser: any = {
        _id: "444444444444444444444444",
        email: "resident@hostel.edu",
        role: UserRole.STUDENT,
        status: UserStatus.ACTIVE,
        studentId: "STU-202610001",
        createdAt: new Date(),
        lastLoginAt: new Date(),
      };

      const token = generateAccessToken({
        sub: mockUser._id,
        email: mockUser.email,
        role: mockUser.role,
        status: mockUser.status,
      });

      (MockedUser.findById as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockResolvedValueOnce(mockUser),
      } as any);

      (MockedUser.findById as jest.Mock).mockResolvedValueOnce(mockUser);

      const response = await request(app)
        .get("/api/v1/auth/me")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe("resident@hostel.edu");
      expect(response.body.data.user.role).toBe(UserRole.STUDENT);
      expect(response.body.data.user.passwordHash).toBeUndefined();
      expect(response.body.data.user.refreshTokenHash).toBeUndefined();
    });

    it("should reject expired access token with 401 ACCESS_TOKEN_EXPIRED", async () => {
      // Craft an expired JWT
      const jwt = require("jsonwebtoken");
      const { env } = require("../config/env");

      const expiredToken = jwt.sign(
        {
          sub: "444444444444444444444444",
          email: "resident@hostel.edu",
          role: UserRole.STUDENT,
          status: UserStatus.ACTIVE,
        },
        env.JWT_ACCESS_SECRET,
        { expiresIn: "-10s" } // Expired 10s ago
      );

      const response = await request(app)
        .get("/api/v1/auth/me")
        .set("Authorization", `Bearer ${expiredToken}`);

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe("ACCESS_TOKEN_EXPIRED");
    });

    it("should reject malformed or tampered token with 401 INVALID_ACCESS_TOKEN", async () => {
      const response = await request(app)
        .get("/api/v1/auth/me")
        .set("Authorization", "Bearer invalid.jwt.signature_fake_tampered");

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe("INVALID_ACCESS_TOKEN");
    });
  });

  // -------------------------------------------------------------------------
  // 8. IDOR & Cross-Student Data Access Defense Tests
  // -------------------------------------------------------------------------
  describe("IDOR & Cross-Student Data Access Defense", () => {
    const studentA: any = {
      _id: "studentA_1111111111111111",
      email: "studentA@hostel.edu",
      studentId: "STU-202610001",
      role: UserRole.STUDENT,
      status: UserStatus.ACTIVE,
    };

    const studentB: any = {
      _id: "studentB_2222222222222222",
      email: "studentB@hostel.edu",
      studentId: "STU-202610002",
      role: UserRole.STUDENT,
      status: UserStatus.ACTIVE,
    };

    const adminUser: any = {
      _id: "admin_9999999999999999",
      email: "warden@hostel.edu",
      role: UserRole.HOSTEL_ADMIN,
      status: UserStatus.ACTIVE,
    };

    it("should allow Student A to access their own private data", async () => {
      const tokenA = generateAccessToken({
        sub: studentA._id,
        email: studentA.email,
        role: studentA.role,
        studentId: studentA.studentId,
        status: studentA.status,
      });

      (MockedUser.findById as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockResolvedValueOnce(studentA),
      } as any);

      const response = await request(app)
        .get(`/api/v1/rbac/students/${studentA._id}/private-data`)
        .set("Authorization", `Bearer ${tokenA}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.targetUserId).toBe(studentA._id);
    });

    it("should deny Student A attempting to access Student B private data with 403", async () => {
      const tokenA = generateAccessToken({
        sub: studentA._id,
        email: studentA.email,
        role: studentA.role,
        studentId: studentA.studentId,
        status: studentA.status,
      });

      (MockedUser.findById as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockResolvedValueOnce(studentA),
      } as any);

      // Student A targets Student B's user ID
      const response = await request(app)
        .get(`/api/v1/rbac/students/${studentB._id}/private-data`)
        .set("Authorization", `Bearer ${tokenA}`);

      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe("FORBIDDEN_CROSS_STUDENT_ACCESS");
      expect(response.body.error.message).toContain("not authorized to view or modify another resident's data");
    });

    it("should allow an Administrator to access Student B private data", async () => {
      const adminToken = generateAccessToken({
        sub: adminUser._id,
        email: adminUser.email,
        role: adminUser.role,
        status: adminUser.status,
      });

      (MockedUser.findById as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockResolvedValueOnce(adminUser),
      } as any);

      const response = await request(app)
        .get(`/api/v1/rbac/students/${studentB._id}/private-data`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.targetUserId).toBe(studentB._id);
    });
  });

  // -------------------------------------------------------------------------
  // 9. Helmet Security Headers & CORS Checks
  // -------------------------------------------------------------------------
  describe("Security Headers & Sanitization", () => {
    it("should return Helmet security headers on responses", async () => {
      const response = await request(app).get("/");

      expect(response.headers["x-content-type-options"]).toBe("nosniff");
      expect(response.headers["x-frame-options"]).toBe("DENY");
    });
  });
});

