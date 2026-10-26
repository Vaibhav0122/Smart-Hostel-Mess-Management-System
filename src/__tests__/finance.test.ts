import request from "supertest";
import app from "../app";
import mongoose from "mongoose";
import { User } from "../models/User";
import { AuditLog } from "../models/AuditLog";
import { Contract } from "../models/Contract";
import { ChargeRecord } from "../models/ChargeRecord";
import { PaymentTransaction } from "../models/PaymentTransaction";
import { RefundRecord } from "../models/RefundRecord";
import { StudentIdCounter } from "../models/StudentIdCounter";
import { UserRole, UserStatus } from "../constants/roles";
import { ChargeStatus } from "../models/ChargeRecord";
import { PaymentStatus } from "../models/PaymentTransaction";
import { generateAccessToken } from "../utils/token";

// ── Mocks ──────────────────────────────────────────────────────────────────
jest.mock("../models/User");
jest.mock("../models/AuditLog");
jest.mock("../models/Contract");
jest.mock("../models/ChargeRecord");
jest.mock("../models/PaymentTransaction");
jest.mock("../models/RefundRecord");
jest.mock("../models/StudentIdCounter");
jest.mock("mongoose", () => {
  const original = jest.requireActual("mongoose");
  return {
    ...original,
    startSession: jest.fn().mockResolvedValue({
      withTransaction: jest.fn().mockImplementation(async (fn) => {
        await fn();
      }),
      endSession: jest.fn().mockResolvedValue(undefined),
    }),
  };
});

const MockedUser = User as jest.Mocked<typeof User>;
const MockedAuditLog = AuditLog as jest.Mocked<typeof AuditLog>;
const MockedContract = Contract as jest.Mocked<typeof Contract>;
const MockedChargeRecord = ChargeRecord as jest.Mocked<typeof ChargeRecord>;
const MockedPaymentTransaction = PaymentTransaction as jest.Mocked<typeof PaymentTransaction>;
const MockedRefundRecord = RefundRecord as jest.Mocked<typeof RefundRecord>;
const MockedStudentIdCounter = StudentIdCounter as jest.Mocked<typeof StudentIdCounter>;

describe("Phase 7: Financial Ledger – Charges, Payments & Refunds", () => {
  // ── Fixtures ──────────────────────────────────────────────────────────
  const adminUser: any = {
    _id: "770000000000000000000001",
    email: "accounts@hostel.edu",
    role: UserRole.HOSTEL_ADMIN,
    status: UserStatus.ACTIVE,
  };

  const studentUser: any = {
    _id: "770000000000000000000002",
    email: "student@hostel.edu",
    role: UserRole.STUDENT,
    status: UserStatus.ACTIVE,
    studentId: "STU-202610001",
  };

  const otherStudent: any = {
    _id: "770000000000000000000003",
    email: "other@hostel.edu",
    role: UserRole.STUDENT,
    status: UserStatus.ACTIVE,
    studentId: "STU-202610002",
  };

  const contractId = "770000000000000000000010";
  const chargeId = "770000000000000000000020";
  const paymentId = "770000000000000000000030";

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

    // User.findById default mock
    (MockedUser.findById as jest.Mock).mockImplementation((id: string) => {
      const u =
        id === adminUser._id
          ? adminUser
          : id === studentUser._id
          ? studentUser
          : id === otherStudent._id
          ? otherStudent
          : null;
      return {
        select: jest.fn().mockResolvedValue(u),
        then: (resolve: (val: any) => void) => resolve(u),
      };
    });

    // AuditLog.create always succeeds
    (MockedAuditLog.create as jest.Mock).mockResolvedValue({});

    // StudentIdCounter for sequence numbers
    (MockedStudentIdCounter.findOneAndUpdate as jest.Mock).mockResolvedValue({ seq: 42 });
  });


  // ════════════════════════════════════════════════════════════════════════
  // GROUP A – Charge Generation
  // ════════════════════════════════════════════════════════════════════════

  describe("POST /api/v1/finances/charges", () => {
    const validBody = {
      studentId: studentUser._id,
      contractId,
      chargeType: "MONTHLY_RENT",
      billingPeriod: "2026-11",
      amount: 8500,
      dueDate: "2026-11-05T00:00:00.000Z",
    };

    it("should create a charge successfully (admin)", async () => {
      (MockedContract.findById as jest.Mock).mockResolvedValue({ _id: contractId });

      const mockCharge: any = {
        _id: chargeId,
        chargeNumber: "CHG-202611-0042",
        status: ChargeStatus.UNPAID,
        ...validBody,
      };
      (MockedChargeRecord.create as jest.Mock).mockResolvedValue(mockCharge);

      const res = await request(app)
        .post("/api/v1/finances/charges")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(validBody);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.charge.chargeNumber).toBe("CHG-202611-0042");
    });

    it("should reject charge creation by a student (403)", async () => {
      const res = await request(app)
        .post("/api/v1/finances/charges")
        .set("Authorization", `Bearer ${studentToken}`)
        .send(validBody);

      expect(res.status).toBe(403);
    });

    it("should reject charge if student not found (404)", async () => {
      (MockedUser.findById as jest.Mock).mockImplementation((id: string) => {
        const u = id === adminUser._id ? adminUser : null;
        return {
          select: jest.fn().mockResolvedValue(u),
          then: (resolve: (val: any) => void) => resolve(u),
        };
      });

      const res = await request(app)
        .post("/api/v1/finances/charges")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(validBody);

      expect(res.status).toBe(404);
    });

    it("should reject charge if contract not found (404)", async () => {
      (MockedContract.findById as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .post("/api/v1/finances/charges")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(validBody);

      expect(res.status).toBe(404);
    });

    it("should reject invalid chargeType (400)", async () => {
      const res = await request(app)
        .post("/api/v1/finances/charges")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ ...validBody, chargeType: "INVALID_TYPE" });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("should reject negative amount (400)", async () => {
      const res = await request(app)
        .post("/api/v1/finances/charges")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ ...validBody, amount: -100 });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("should reject invalid billingPeriod format (400)", async () => {
      const res = await request(app)
        .post("/api/v1/finances/charges")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ ...validBody, billingPeriod: "November-2026" });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("should require authentication (401)", async () => {
      const res = await request(app).post("/api/v1/finances/charges").send(validBody);
      expect(res.status).toBe(401);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // GROUP B – Cancel a Charge
  // ════════════════════════════════════════════════════════════════════════

  describe("PATCH /api/v1/finances/charges/:id/cancel", () => {
    it("should cancel an UNPAID charge (admin)", async () => {
      const mockCharge: any = {
        _id: chargeId,
        status: ChargeStatus.UNPAID,
        amountPaid: 0,
        save: jest.fn().mockResolvedValue(undefined),
      };
      (MockedChargeRecord.findById as jest.Mock).mockResolvedValue(mockCharge);

      const res = await request(app)
        .patch(`/api/v1/finances/charges/${chargeId}/cancel`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ cancellationReason: "Student requested cancellation of deposit charge." });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("should reject cancellation of a PAID charge (409)", async () => {
      const mockCharge: any = {
        _id: chargeId,
        status: ChargeStatus.PAID,
        save: jest.fn(),
      };
      (MockedChargeRecord.findById as jest.Mock).mockResolvedValue(mockCharge);

      const res = await request(app)
        .patch(`/api/v1/finances/charges/${chargeId}/cancel`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ cancellationReason: "Attempting to cancel paid charge" });

      expect(res.status).toBe(409);
    });

    it("should reject cancellation by a student (403)", async () => {
      const res = await request(app)
        .patch(`/api/v1/finances/charges/${chargeId}/cancel`)
        .set("Authorization", `Bearer ${studentToken}`)
        .send({ cancellationReason: "Student should not cancel charges" });

      expect(res.status).toBe(403);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // GROUP C – Record Payment
  // ════════════════════════════════════════════════════════════════════════

  describe("POST /api/v1/finances/payments", () => {
    const validPayment = {
      studentId: studentUser._id,
      chargeRecordId: chargeId,
      amountPaid: 5000,
      paymentMethod: "UPI",
      referenceNumber: "UPI-987654321",
      paymentDate: "2026-11-03T10:00:00.000Z",
      notes: "Partial payment via Google Pay",
    };

    it("should record a payment and update charge status to PARTIALLY_PAID", async () => {
      const mockCharge: any = {
        _id: chargeId,
        amount: 8500,
        amountPaid: 0,
        status: ChargeStatus.UNPAID,
      };
      const mockTx: any = {
        _id: paymentId,
        receiptNumber: "REC-202611-00042",
        ...validPayment,
        status: PaymentStatus.SUCCESS,
      };

      (MockedPaymentTransaction.findOne as jest.Mock).mockResolvedValue(null);
      (MockedChargeRecord.findById as jest.Mock).mockResolvedValue(mockCharge);
      (MockedPaymentTransaction.create as jest.Mock).mockResolvedValue([mockTx]);
      (MockedChargeRecord.findByIdAndUpdate as jest.Mock).mockResolvedValue({});

      const res = await request(app)
        .post("/api/v1/finances/payments")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(validPayment);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.payment.receiptNumber).toBe("REC-202611-00042");
    });

    it("should reject duplicate referenceNumber (409)", async () => {
      const existingTx: any = { _id: paymentId, referenceNumber: "UPI-987654321" };
      (MockedPaymentTransaction.findOne as jest.Mock).mockResolvedValue(existingTx);

      const res = await request(app)
        .post("/api/v1/finances/payments")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(validPayment);

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe("DUPLICATE_REFERENCE_NUMBER");
    });

    it("should reject overpayment (422)", async () => {
      const mockCharge: any = {
        _id: chargeId,
        amount: 8500,
        amountPaid: 6000,
        status: ChargeStatus.PARTIALLY_PAID,
      };
      (MockedPaymentTransaction.findOne as jest.Mock).mockResolvedValue(null);
      (MockedChargeRecord.findById as jest.Mock).mockResolvedValue(mockCharge);

      const res = await request(app)
        .post("/api/v1/finances/payments")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ ...validPayment, amountPaid: 5000, referenceNumber: "UPI-999000111" }); // 5000 > 2500 outstanding

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("OVERPAYMENT_NOT_ALLOWED");
    });

    it("should reject payment against a CANCELLED charge (409)", async () => {
      const mockCharge: any = {
        _id: chargeId,
        amount: 8500,
        amountPaid: 0,
        status: ChargeStatus.CANCELLED,
      };
      (MockedPaymentTransaction.findOne as jest.Mock).mockResolvedValue(null);
      (MockedChargeRecord.findById as jest.Mock).mockResolvedValue(mockCharge);

      const res = await request(app)
        .post("/api/v1/finances/payments")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ ...validPayment, referenceNumber: "UPI-999000222" });

      expect(res.status).toBe(409);
    });

    it("should reject payment recording by a student (403)", async () => {
      const res = await request(app)
        .post("/api/v1/finances/payments")
        .set("Authorization", `Bearer ${studentToken}`)
        .send(validPayment);

      expect(res.status).toBe(403);
    });

    it("should reject missing required fields (400)", async () => {
      const res = await request(app)
        .post("/api/v1/finances/payments")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ studentId: studentUser._id });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // GROUP D – Payment Reversal
  // ════════════════════════════════════════════════════════════════════════

  describe("POST /api/v1/finances/payments/:id/reverse", () => {
    it("should reverse a SUCCESS payment and create offsetting record", async () => {
      const mockOriginal: any = {
        _id: paymentId,
        receiptNumber: "REC-202611-00042",
        studentId: new mongoose.Types.ObjectId(studentUser._id),
        chargeRecordId: new mongoose.Types.ObjectId(chargeId),
        amountPaid: 5000,
        paymentMethod: "UPI",
        referenceNumber: "UPI-987654321",
        status: PaymentStatus.SUCCESS,
        isReversal: false,
      };
      const mockReversal: any = {
        _id: "770000000000000000000099",
        receiptNumber: "REC-202611-00043",
        isReversal: true,
        status: PaymentStatus.REVERSED,
      };
      const mockCharge: any = {
        _id: chargeId,
        amount: 8500,
        amountPaid: 5000,
        status: ChargeStatus.PARTIALLY_PAID,
        session: jest.fn().mockResolvedValue(null),
      };

      (MockedPaymentTransaction.findById as jest.Mock).mockResolvedValue(mockOriginal);
      (MockedPaymentTransaction.findByIdAndUpdate as jest.Mock).mockResolvedValue({});
      (MockedPaymentTransaction.create as jest.Mock).mockResolvedValue([mockReversal]);
      (MockedChargeRecord.findById as jest.Mock).mockReturnValue({
        session: jest.fn().mockResolvedValue(mockCharge),
      });
      (MockedChargeRecord.findByIdAndUpdate as jest.Mock).mockResolvedValue({});

      const res = await request(app)
        .post(`/api/v1/finances/payments/${paymentId}/reverse`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ reversalReason: "Cheque bounced. Reversing payment for STU-202610001." });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it("should reject reversing an already-reversed transaction (409)", async () => {
      const mockOriginal: any = {
        _id: paymentId,
        status: PaymentStatus.REVERSED,
        isReversal: false,
      };
      (MockedPaymentTransaction.findById as jest.Mock).mockResolvedValue(mockOriginal);

      const res = await request(app)
        .post(`/api/v1/finances/payments/${paymentId}/reverse`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ reversalReason: "Trying to reverse already reversed transaction." });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe("ALREADY_REVERSED");
    });

    it("should reject reversing a reversal transaction (409)", async () => {
      const mockOriginal: any = {
        _id: paymentId,
        status: PaymentStatus.SUCCESS,
        isReversal: true,
      };
      (MockedPaymentTransaction.findById as jest.Mock).mockResolvedValue(mockOriginal);

      const res = await request(app)
        .post(`/api/v1/finances/payments/${paymentId}/reverse`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ reversalReason: "Trying to reverse a reversal." });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe("ALREADY_REVERSAL");
    });

    it("should reject reversal by a student (403)", async () => {
      const res = await request(app)
        .post(`/api/v1/finances/payments/${paymentId}/reverse`)
        .set("Authorization", `Bearer ${studentToken}`)
        .send({ reversalReason: "Students cannot reverse payments." });

      expect(res.status).toBe(403);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // GROUP E – Financial Ledger
  // ════════════════════════════════════════════════════════════════════════

  describe("GET /api/v1/finances/ledger/me (student)", () => {
    it("should return computed ledger for the authenticated student", async () => {
      const charges: any[] = [
        { amount: 8500, status: ChargeStatus.UNPAID, amountPaid: 0 },
        { amount: 1200, status: ChargeStatus.PAID, amountPaid: 1200 },
      ];
      const payments: any[] = [
        { amountPaid: 1200, status: PaymentStatus.SUCCESS, isReversal: false },
      ];
      const refunds: any[] = [];

      (MockedChargeRecord.find as jest.Mock).mockReturnValue({ sort: jest.fn().mockResolvedValue(charges) });
      (MockedPaymentTransaction.find as jest.Mock).mockReturnValue({ sort: jest.fn().mockResolvedValue(payments) });
      (MockedRefundRecord.find as jest.Mock).mockReturnValue({ sort: jest.fn().mockResolvedValue(refunds) });

      const res = await request(app)
        .get("/api/v1/finances/ledger/me")
        .set("Authorization", `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.totalCharges).toBe(9700);
      expect(res.body.data.totalPaid).toBe(1200);
      expect(res.body.data.outstandingBalance).toBe(8500);
    });
  });

  describe("GET /api/v1/finances/ledger/:studentId (admin)", () => {
    it("should return ledger for a specific student (admin)", async () => {
      (MockedChargeRecord.find as jest.Mock).mockReturnValue({ sort: jest.fn().mockResolvedValue([]) });
      (MockedPaymentTransaction.find as jest.Mock).mockReturnValue({ sort: jest.fn().mockResolvedValue([]) });
      (MockedRefundRecord.find as jest.Mock).mockReturnValue({ sort: jest.fn().mockResolvedValue([]) });

      const res = await request(app)
        .get(`/api/v1/finances/ledger/${studentUser._id}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.outstandingBalance).toBe(0);
    });

    it("should deny a student from viewing another student's ledger (403)", async () => {
      (MockedChargeRecord.find as jest.Mock).mockReturnValue({ sort: jest.fn().mockResolvedValue([]) });
      (MockedPaymentTransaction.find as jest.Mock).mockReturnValue({ sort: jest.fn().mockResolvedValue([]) });
      (MockedRefundRecord.find as jest.Mock).mockReturnValue({ sort: jest.fn().mockResolvedValue([]) });

      const res = await request(app)
        .get(`/api/v1/finances/ledger/${otherStudent._id}`)
        .set("Authorization", `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // GROUP F – Receipt Retrieval
  // ════════════════════════════════════════════════════════════════════════

  describe("GET /api/v1/finances/receipts/:receiptNumber", () => {
    it("should return the receipt to the owning student", async () => {
      const mockTx: any = {
        _id: paymentId,
        receiptNumber: "REC-202611-00042",
        studentId: new mongoose.Types.ObjectId(studentUser._id),
        amountPaid: 5000,
        status: PaymentStatus.SUCCESS,
      };
      (MockedPaymentTransaction.findOne as jest.Mock).mockResolvedValue(mockTx);

      const res = await request(app)
        .get("/api/v1/finances/receipts/REC-202611-00042")
        .set("Authorization", `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.receipt.receiptNumber).toBe("REC-202611-00042");
    });

    it("should deny a different student from viewing another student's receipt (403)", async () => {
      const mockTx: any = {
        _id: paymentId,
        receiptNumber: "REC-202611-00042",
        studentId: new mongoose.Types.ObjectId(otherStudent._id),
        amountPaid: 5000,
      };
      (MockedPaymentTransaction.findOne as jest.Mock).mockResolvedValue(mockTx);

      const res = await request(app)
        .get("/api/v1/finances/receipts/REC-202611-00042")
        .set("Authorization", `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
    });

    it("should return 404 for non-existent receipt", async () => {
      (MockedPaymentTransaction.findOne as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .get("/api/v1/finances/receipts/REC-NONEXISTENT")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // GROUP G – Refunds
  // ════════════════════════════════════════════════════════════════════════

  describe("POST /api/v1/finances/refunds", () => {
    const validRefund = {
      studentId: studentUser._id,
      contractId,
      amount: 15000,
      reason: "SECURITY_DEPOSIT_RETURN",
      paymentMethod: "BANK_TRANSFER",
      bankReferenceNumber: "NEFT-20261101-999XYZ",
      refundDate: "2026-11-30T00:00:00.000Z",
    };

    it("should issue a refund successfully (admin)", async () => {
      (MockedContract.findById as jest.Mock).mockResolvedValue({ _id: contractId });

      const mockRefund: any = {
        _id: "770000000000000000000040",
        refundNumber: "REF-202611-0042",
        ...validRefund,
      };
      (MockedRefundRecord.create as jest.Mock).mockResolvedValue(mockRefund);

      const res = await request(app)
        .post("/api/v1/finances/refunds")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(validRefund);

      expect(res.status).toBe(201);
      expect(res.body.data.refund.refundNumber).toBe("REF-202611-0042");
    });

    it("should reject invalid reason (400)", async () => {
      const res = await request(app)
        .post("/api/v1/finances/refunds")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ ...validRefund, reason: "RANDOM_REASON" });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("should reject refund from student (403)", async () => {
      const res = await request(app)
        .post("/api/v1/finances/refunds")
        .set("Authorization", `Bearer ${studentToken}`)
        .send(validRefund);

      expect(res.status).toBe(403);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // GROUP H – List Endpoints (RBAC)
  // ════════════════════════════════════════════════════════════════════════

  describe("List endpoints RBAC", () => {
    it("GET /finances/charges – student gets 200 (own)", async () => {
      (MockedChargeRecord.find as jest.Mock).mockReturnValue({ sort: jest.fn().mockResolvedValue([]) });
      const res = await request(app)
        .get("/api/v1/finances/charges")
        .set("Authorization", `Bearer ${studentToken}`);
      expect(res.status).toBe(200);
    });

    it("GET /finances/payments – student gets 200 (own)", async () => {
      (MockedPaymentTransaction.find as jest.Mock).mockReturnValue({ sort: jest.fn().mockResolvedValue([]) });
      const res = await request(app)
        .get("/api/v1/finances/payments")
        .set("Authorization", `Bearer ${studentToken}`);
      expect(res.status).toBe(200);
    });

    it("GET /finances/refunds – student gets 200 (own)", async () => {
      (MockedRefundRecord.find as jest.Mock).mockReturnValue({ sort: jest.fn().mockResolvedValue([]) });
      const res = await request(app)
        .get("/api/v1/finances/refunds")
        .set("Authorization", `Bearer ${studentToken}`);
      expect(res.status).toBe(200);
    });

    it("GET /finances/charges – unauthenticated gets 401", async () => {
      const res = await request(app).get("/api/v1/finances/charges");
      expect(res.status).toBe(401);
    });
  });
});
