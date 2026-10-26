import request from "supertest";
import app from "../app";
import mongoose from "mongoose";
import { User } from "../models/User";
import { Hostel } from "../models/Hostel";
import { Room } from "../models/Room";
import { Bed } from "../models/Bed";
import { BedAllocation } from "../models/BedAllocation";
import { Contract } from "../models/Contract";
import { ChargeRecord } from "../models/ChargeRecord";
import { PaymentTransaction } from "../models/PaymentTransaction";
import { RefundRecord } from "../models/RefundRecord";
import { Menu } from "../models/Menu";
import { MealSelection } from "../models/MealSelection";
import { FoodFeedback } from "../models/FoodFeedback";
import { StudentProfile } from "../models/StudentProfile";
import { UserRole, UserStatus } from "../constants/roles";
import { generateAccessToken } from "../utils/token";

// ── Mocks ──────────────────────────────────────────────────────────────────
jest.mock("../models/User");
jest.mock("../models/Hostel");
jest.mock("../models/Room");
jest.mock("../models/Bed");
jest.mock("../models/BedAllocation");
jest.mock("../models/Contract");
jest.mock("../models/ChargeRecord");
jest.mock("../models/PaymentTransaction");
jest.mock("../models/RefundRecord");
jest.mock("../models/Menu");
jest.mock("../models/MealSelection");
jest.mock("../models/FoodFeedback");
jest.mock("../models/StudentProfile");

const MockedUser = User as jest.Mocked<typeof User>;
const MockedHostel = Hostel as jest.Mocked<typeof Hostel>;
const MockedRoom = Room as jest.Mocked<typeof Room>;
const MockedBed = Bed as jest.Mocked<typeof Bed>;
const MockedBedAllocation = BedAllocation as jest.Mocked<typeof BedAllocation>;
const MockedContract = Contract as jest.Mocked<typeof Contract>;
const MockedChargeRecord = ChargeRecord as jest.Mocked<typeof ChargeRecord>;
const MockedPaymentTransaction = PaymentTransaction as jest.Mocked<typeof PaymentTransaction>;
const MockedRefundRecord = RefundRecord as jest.Mocked<typeof RefundRecord>;
const MockedMenu = Menu as jest.Mocked<typeof Menu>;
const MockedMealSelection = MealSelection as jest.Mocked<typeof MealSelection>;
const MockedFoodFeedback = FoodFeedback as jest.Mocked<typeof FoodFeedback>;
const MockedStudentProfile = StudentProfile as jest.Mocked<typeof StudentProfile>;

describe("Phase 10: Dashboards & Reports Engine", () => {
  const adminId = "990000000000000000000001";
  const studentId = "990000000000000000000002";
  const hostelId = "990000000000000000000010";

  const adminUser: any = {
    _id: adminId,
    email: "admin@hostel.edu",
    role: UserRole.HOSTEL_ADMIN,
    status: UserStatus.ACTIVE,
  };

  const studentUser: any = {
    _id: studentId,
    email: "student@hostel.edu",
    studentId: "STU-202610001",
    role: UserRole.STUDENT,
    status: UserStatus.ACTIVE,
  };

  let adminToken: string;
  let studentToken: string;

  const mockChainedQuery = (data: any) => {
    const q: any = {
      populate: jest.fn().mockImplementation(() => q),
      sort: jest.fn().mockImplementation(() => q),
      select: jest.fn().mockImplementation(() => q),
      skip: jest.fn().mockImplementation(() => q),
      limit: jest.fn().mockImplementation(() => q),
      then: (resolve: (val: any) => void) => resolve(data),
    };
    return q;
  };

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

    (MockedUser.findById as jest.Mock).mockImplementation((id: string) => {
      const u = id === adminUser._id ? adminUser : id === studentUser._id ? studentUser : null;
      return {
        select: jest.fn().mockResolvedValue(u),
        then: (resolve: (val: any) => void) => resolve(u),
      };
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // GROUP 1: Admin Dashboard KPI Metrics
  // ══════════════════════════════════════════════════════════════════════════

  describe("GET /api/v1/dashboard/admin-metrics", () => {
    it("allows admin to view real-time system metrics (200 OK)", async () => {
      (MockedUser.countDocuments as jest.Mock).mockResolvedValue(150);
      (MockedHostel.countDocuments as jest.Mock).mockResolvedValue(2);
      (MockedRoom.find as jest.Mock).mockReturnValue(mockChainedQuery([{ _id: new mongoose.Types.ObjectId() }]));
      (MockedBed.countDocuments as jest.Mock)
        .mockResolvedValueOnce(200) // totalBeds
        .mockResolvedValueOnce(160) // occupiedBeds
        .mockResolvedValueOnce(40); // vacantBeds

      (MockedChargeRecord.aggregate as jest.Mock).mockResolvedValue([{ total: 120000 }]);
      (MockedPaymentTransaction.aggregate as jest.Mock).mockResolvedValue([{ total: 95000 }]);
      (MockedRefundRecord.aggregate as jest.Mock).mockResolvedValue([{ total: 5000 }]);
      (MockedChargeRecord.countDocuments as jest.Mock).mockResolvedValue(15);
      (MockedBedAllocation.countDocuments as jest.Mock).mockResolvedValue(160);
      (MockedMealSelection.find as jest.Mock).mockResolvedValue([
        { selection: "TIFFIN" },
        { selection: "DINE_IN" },
      ] as any);
      (MockedFoodFeedback.aggregate as jest.Mock).mockResolvedValue([{ avgRating: 4.45 }]);

      const res = await request(app)
        .get("/api/v1/dashboard/admin-metrics")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const metrics = res.body.data;
      expect(metrics.totalStudents).toBe(150);
      expect(metrics.totalBeds).toBe(200);
      expect(metrics.occupiedBeds).toBe(160);
      expect(metrics.vacantBeds).toBe(40);
      expect(metrics.occupancyRate).toBe(80);
      expect(metrics.financials.totalChargesAmount).toBe(120000);
      expect(metrics.financials.totalPaidAmount).toBe(95000);
      expect(metrics.financials.totalPendingDues).toBe(30000); // 120k - (95k - 5k)
      expect(metrics.messSummary.todayLunchTiffin).toBe(1);
    });

    it("forbids student from accessing admin KPI metrics (403 Forbidden)", async () => {
      const res = await request(app)
        .get("/api/v1/dashboard/admin-metrics")
        .set("Authorization", `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe("FORBIDDEN_PERMISSION");
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // GROUP 2: Student Dashboard Summary
  // ══════════════════════════════════════════════════════════════════════════

  describe("GET /api/v1/dashboard/student-summary", () => {
    it("returns authorized student summary with room, contract, dues & mess (200 OK)", async () => {
      (MockedStudentProfile.findOne as jest.Mock).mockResolvedValue({
        fullName: "Rahul Verma",
        registeredPhone: "+919876543210",
      } as any);

      const mockAlloc = {
        _id: new mongoose.Types.ObjectId(),
        hostelId: { _id: new mongoose.Types.ObjectId(hostelId), name: "Aryabhata Hall", code: "ABH" },
        roomId: { roomNumber: "204", floor: 2 },
        bedId: { bedCode: "A" },
        startDate: new Date("2026-11-01"),
      };
      (MockedBedAllocation.findOne as jest.Mock).mockReturnValue(mockChainedQuery(mockAlloc));

      (MockedContract.findOne as jest.Mock).mockResolvedValue({
        status: "ACTIVE",
        startDate: "2026-11-01",
        endDate: "2027-10-31",
        monthlyRentAmount: 8500,
        securityDepositAmount: 15000,
        lockInUntilDate: "2027-04-30",
      } as any);

      (MockedChargeRecord.find as jest.Mock).mockResolvedValue([
        { amount: 8500, status: "UNPAID" },
      ] as any);

      (MockedPaymentTransaction.find as jest.Mock).mockReturnValue(
        mockChainedQuery([
          {
            _id: new mongoose.Types.ObjectId(),
            receiptNumber: "REC-202610-0001",
            amountPaid: 8500,
            paymentDate: new Date("2026-10-05"),
            paymentMethod: "UPI",
          },
        ])
      );

      (MockedRefundRecord.find as jest.Mock).mockResolvedValue([]);

      (MockedMealSelection.findOne as jest.Mock).mockResolvedValue({
        selection: "TIFFIN",
        isDefault: false,
        isOverridden: false,
      } as any);

      (MockedMenu.find as jest.Mock).mockReturnValue(
        mockChainedQuery([
          {
            _id: new mongoose.Types.ObjectId(),
            mealDate: "2026-11-01",
            mealType: "LUNCH",
            title: "Dal Makhani Feast",
            items: ["Dal Makhani", "Jeera Rice"],
            isSpecialMeal: false,
          },
        ])
      );

      const res = await request(app)
        .get("/api/v1/dashboard/student-summary")
        .set("Authorization", `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const summary = res.body.data;
      expect(summary.student.email).toBe("student@hostel.edu");
      expect(summary.student.fullName).toBe("Rahul Verma");
      expect(summary.allocation.hasAllocation).toBe(true);
      expect(summary.allocation.roomNumber).toBe("204");
      expect(summary.contract.hasContract).toBe(true);
      expect(summary.contract.monthlyRentAmount).toBe(8500);
      expect(summary.mess.todaySelection.selection).toBe("TIFFIN");
      expect(summary.mess.upcomingMenus.length).toBe(1);
    });

    it("returns 401 when accessing dashboard without authentication", async () => {
      const res = await request(app).get("/api/v1/dashboard/student-summary");
      expect(res.status).toBe(401);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // GROUP 3: Administrative Reports & CSV Export
  // ══════════════════════════════════════════════════════════════════════════

  describe("Administrative Reports & CSV Export", () => {
    it("returns paginated student report (200 OK)", async () => {
      (MockedUser.countDocuments as jest.Mock).mockResolvedValue(1);
      (MockedUser.find as jest.Mock).mockReturnValue(
        mockChainedQuery([
          {
            _id: new mongoose.Types.ObjectId(studentId),
            studentId: "STU-202610001",
            email: "student@hostel.edu",
            status: "ACTIVE",
          },
        ])
      );
      (MockedStudentProfile.find as jest.Mock).mockResolvedValue([
        { userId: new mongoose.Types.ObjectId(studentId), fullName: "Rahul Verma", registeredPhone: "+919876543210" },
      ] as any);
      (MockedBedAllocation.find as jest.Mock).mockReturnValue(
        mockChainedQuery([
          {
            studentId: new mongoose.Types.ObjectId(studentId),
            hostelId: { name: "Aryabhata Hall" },
            roomId: { roomNumber: "101" },
            bedId: { bedCode: "A" },
          },
        ])
      );
      (MockedContract.find as jest.Mock).mockResolvedValue([
        { studentId: new mongoose.Types.ObjectId(studentId), status: "ACTIVE", monthlyRentAmount: 8500 },
      ] as any);
      (MockedChargeRecord.find as jest.Mock).mockResolvedValue([
        { studentId: new mongoose.Types.ObjectId(studentId), amount: 8500 },
      ] as any);
      (MockedPaymentTransaction.find as jest.Mock).mockResolvedValue([
        { studentId: new mongoose.Types.ObjectId(studentId), amountPaid: 8500 },
      ] as any);

      const res = await request(app)
        .get("/api/v1/reports/students?page=1&limit=10")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.students.length).toBe(1);
      expect(res.body.data.students[0].name).toBe("Rahul Verma");
      expect(res.body.data.students[0].outstandingDues).toBe(0);
    });

    it("returns hostel occupancy report (200 OK)", async () => {
      (MockedHostel.find as jest.Mock).mockResolvedValue([
        { _id: new mongoose.Types.ObjectId(hostelId), name: "Aryabhata Hall", code: "ABH" },
      ] as any);
      (MockedRoom.find as jest.Mock).mockResolvedValue([{ _id: new mongoose.Types.ObjectId() }] as any);
      (MockedBed.countDocuments as jest.Mock)
        .mockResolvedValueOnce(50) // total
        .mockResolvedValueOnce(45) // occupied
        .mockResolvedValueOnce(4)  // available
        .mockResolvedValueOnce(1); // maintenance

      const res = await request(app)
        .get("/api/v1/reports/occupancy")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.hostels.length).toBe(1);
      expect(res.body.data.hostels[0].occupancyPercentage).toBe(90);
    });

    it("returns financial summary report (200 OK)", async () => {
      (MockedChargeRecord.aggregate as jest.Mock)
        .mockResolvedValueOnce([{ total: 100000 }]) // summary
        .mockResolvedValueOnce([{ _id: "MONTHLY_RENT", totalAmount: 100000, count: 10 }]); // breakdown
      (MockedPaymentTransaction.aggregate as jest.Mock)
        .mockResolvedValueOnce([{ total: 80000 }]) // summary
        .mockResolvedValueOnce([{ _id: "UPI", totalAmount: 80000, count: 8 }]); // breakdown
      (MockedRefundRecord.aggregate as jest.Mock).mockResolvedValue([{ total: 0 }]);

      const res = await request(app)
        .get("/api/v1/reports/finances")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.summary.totalCharges).toBe(100000);
      expect(res.body.data.summary.totalPayments).toBe(80000);
      expect(res.body.data.summary.outstandingBalance).toBe(20000);
    });

    it("streams CSV export file with attachment headers (200 OK)", async () => {
      (MockedUser.countDocuments as jest.Mock).mockResolvedValue(1);
      (MockedUser.find as jest.Mock).mockReturnValue(
        mockChainedQuery([
          {
            _id: new mongoose.Types.ObjectId(studentId),
            studentId: "STU-202610001",
            email: "student@hostel.edu",
            status: "ACTIVE",
          },
        ])
      );
      (MockedStudentProfile.find as jest.Mock).mockResolvedValue([]);
      (MockedBedAllocation.find as jest.Mock).mockReturnValue(mockChainedQuery([]));
      (MockedContract.find as jest.Mock).mockResolvedValue([]);
      (MockedChargeRecord.find as jest.Mock).mockResolvedValue([]);
      (MockedPaymentTransaction.find as jest.Mock).mockResolvedValue([]);

      const res = await request(app)
        .get("/api/v1/reports/export?type=students")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.headers["content-type"]).toContain("text/csv");
      expect(res.headers["content-disposition"]).toContain("attachment; filename=");
      expect(res.text).toContain("Student ID");
      expect(res.text).toContain("STU-202610001");
    });
  });
});
