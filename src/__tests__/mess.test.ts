import request from "supertest";
import app from "../app";
import mongoose from "mongoose";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { User } from "../models/User";
import { Hostel } from "../models/Hostel";
import { Menu } from "../models/Menu";
import { MealSelection } from "../models/MealSelection";
import { FoodFeedback } from "../models/FoodFeedback";
import { BedAllocation } from "../models/BedAllocation";
import { StudentProfile } from "../models/StudentProfile";
import { AuditLog } from "../models/AuditLog";
import { UserRole, UserStatus } from "../constants/roles";
import { MealType } from "../models/Menu";
import { MealSelectionChoice } from "../models/MealSelection";
import { generateAccessToken } from "../utils/token";

dayjs.extend(utc);
dayjs.extend(timezone);

// ── Mocks ──────────────────────────────────────────────────────────────────
jest.mock("../models/User");
jest.mock("../models/Hostel");
jest.mock("../models/Menu");
jest.mock("../models/MealSelection");
jest.mock("../models/FoodFeedback");
jest.mock("../models/BedAllocation");
jest.mock("../models/StudentProfile");
jest.mock("../models/AuditLog");

const MockedUser = User as jest.Mocked<typeof User>;
const MockedHostel = Hostel as jest.Mocked<typeof Hostel>;
const MockedMenu = Menu as jest.Mocked<typeof Menu>;
const MockedMealSelection = MealSelection as jest.Mocked<typeof MealSelection>;
const MockedFoodFeedback = FoodFeedback as jest.Mocked<typeof FoodFeedback>;
const MockedBedAllocation = BedAllocation as jest.Mocked<typeof BedAllocation>;
const MockedStudentProfile = StudentProfile as jest.Mocked<typeof StudentProfile>;
const MockedAuditLog = AuditLog as jest.Mocked<typeof AuditLog>;

describe("Phase 8: Mess Menu, Meal Selection, Attendance & Feedback", () => {
  // ── Fixtures ─────────────────────────────────────────────────────────────
  const hostelId = "880000000000000000000001";
  const menuId = "880000000000000000000010";

  const adminUser: any = {
    _id: "880000000000000000000002",
    email: "admin@hostel.edu",
    role: UserRole.HOSTEL_ADMIN,
    status: UserStatus.ACTIVE,
  };

  const messStaffUser: any = {
    _id: "880000000000000000000003",
    email: "mess@hostel.edu",
    role: UserRole.MESS_STAFF,
    status: UserStatus.ACTIVE,
  };

  const studentUser: any = {
    _id: "880000000000000000000004",
    email: "student1@hostel.edu",
    role: UserRole.STUDENT,
    status: UserStatus.ACTIVE,
    studentId: "STU-202610001",
  };

  const studentUser2: any = {
    _id: "880000000000000000000005",
    email: "student2@hostel.edu",
    role: UserRole.STUDENT,
    status: UserStatus.ACTIVE,
    studentId: "STU-202610002",
  };

  const mockHostel: any = {
    _id: new mongoose.Types.ObjectId(hostelId),
    name: "Aryabhata Hall of Residence",
    code: "ABH-01",
  };

  let adminToken: string;
  let messStaffToken: string;
  let studentToken: string;

  // Helper for chained query mocks
  const mockChainedQuery = (data: any) => {
    const q: any = {
      populate: jest.fn().mockImplementation(() => q),
      sort: jest.fn().mockImplementation(() => q),
      select: jest.fn().mockImplementation(() => q),
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
    messStaffToken = generateAccessToken({
      sub: messStaffUser._id,
      email: messStaffUser.email,
      role: messStaffUser.role,
      status: messStaffUser.status,
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

    // User lookup mock
    (MockedUser.findById as jest.Mock).mockImplementation((id: string) => {
      const u =
        id === adminUser._id
          ? adminUser
          : id === messStaffUser._id
          ? messStaffUser
          : id === studentUser._id
          ? studentUser
          : id === studentUser2._id
          ? studentUser2
          : null;
      return {
        select: jest.fn().mockResolvedValue(u),
        then: (resolve: (val: any) => void) => resolve(u),
      };
    });

    // Hostel lookup mock
    (MockedHostel.findById as jest.Mock).mockResolvedValue(mockHostel);

    // BedAllocation lookup mock for student hostel resolution
    (MockedBedAllocation.findOne as jest.Mock).mockResolvedValue({
      _id: new mongoose.Types.ObjectId("880000000000000000000020"),
      studentId: new mongoose.Types.ObjectId(studentUser._id),
      hostelId: new mongoose.Types.ObjectId(hostelId),
      status: "ACTIVE",
    });

    // AuditLog.create mock
    (MockedAuditLog.create as jest.Mock).mockResolvedValue({});
  });

  // ══════════════════════════════════════════════════════════════════════════
  // GROUP 1: Menu Management (Admins & Mess Staff)
  // ══════════════════════════════════════════════════════════════════════════

  describe("Daily Menu Management", () => {
    const validMenuPayload = {
      hostelId,
      mealDate: "2026-11-01",
      mealType: "LUNCH",
      title: "Royal North Indian Thali",
      items: [
        "Paneer Butter Masala",
        "Jeera Rice",
        "Tandoori Roti",
        "Gulab Jamun",
      ],
      isSpecialMeal: false,
      dietaryTags: ["VEGETARIAN", "NORTH_INDIAN"],
    };

    it("allows admin to create a daily menu (201 Created)", async () => {
      (MockedMenu.findOne as jest.Mock).mockResolvedValue(null);
      (MockedMenu.create as jest.Mock).mockResolvedValue({
        _id: new mongoose.Types.ObjectId(menuId),
        ...validMenuPayload,
        hostelId: new mongoose.Types.ObjectId(hostelId),
        createdByAdminId: new mongoose.Types.ObjectId(adminUser._id),
      } as any);

      const res = await request(app)
        .post("/api/v1/mess/menu")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(validMenuPayload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.menu.title).toBe(validMenuPayload.title);
      expect(MockedMenu.create).toHaveBeenCalledTimes(1);
      expect(MockedAuditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "MENU_CREATED",
          actorRole: UserRole.HOSTEL_ADMIN,
        })
      );
    });

    it("allows mess staff to create a menu (201 Created)", async () => {
      (MockedMenu.findOne as jest.Mock).mockResolvedValue(null);
      (MockedMenu.create as jest.Mock).mockResolvedValue({
        _id: new mongoose.Types.ObjectId(menuId),
        ...validMenuPayload,
        hostelId: new mongoose.Types.ObjectId(hostelId),
      } as any);

      const res = await request(app)
        .post("/api/v1/mess/menu")
        .set("Authorization", `Bearer ${messStaffToken}`)
        .send(validMenuPayload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it("rejects duplicate menu creation for same hostel, date, and meal type (409 Conflict)", async () => {
      (MockedMenu.findOne as jest.Mock).mockResolvedValue({
        _id: new mongoose.Types.ObjectId(menuId),
        ...validMenuPayload,
      } as any);

      const res = await request(app)
        .post("/api/v1/mess/menu")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(validMenuPayload);

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("MENU_ALREADY_EXISTS");
    });

    it("forbids student from creating a menu (403 Forbidden)", async () => {
      const res = await request(app)
        .post("/api/v1/mess/menu")
        .set("Authorization", `Bearer ${studentToken}`)
        .send(validMenuPayload);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("FORBIDDEN_PERMISSION");
    });

    it("allows admin to update an existing menu (200 OK)", async () => {
      const mockMenuDoc = {
        _id: new mongoose.Types.ObjectId(menuId),
        hostelId: new mongoose.Types.ObjectId(hostelId),
        title: "Old Title",
        items: [{ name: "Dal Khichdi" }],
        isSpecialMeal: false,
        dietaryTags: [],
        save: jest.fn().mockResolvedValue(true),
      };
      (MockedMenu.findById as jest.Mock).mockResolvedValue(mockMenuDoc as any);

      const res = await request(app)
        .put(`/api/v1/mess/menu/${menuId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          title: "Special Sunday Feast",
          isSpecialMeal: true,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockMenuDoc.title).toBe("Special Sunday Feast");
      expect(mockMenuDoc.isSpecialMeal).toBe(true);
      expect(mockMenuDoc.save).toHaveBeenCalledTimes(1);
    });

    it("returns 404 when updating non-existent menu", async () => {
      (MockedMenu.findById as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .put(`/api/v1/mess/menu/${menuId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ title: "Updated" });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("MENU_NOT_FOUND");
    });

    it("allows admin to delete a menu (200 OK)", async () => {
      const mockMenuDoc = {
        _id: new mongoose.Types.ObjectId(menuId),
        hostelId: new mongoose.Types.ObjectId(hostelId),
        mealDate: "2026-11-01",
        mealType: "LUNCH",
        title: "To Be Deleted",
        deleteOne: jest.fn().mockResolvedValue(true),
      };
      (MockedMenu.findById as jest.Mock).mockResolvedValue(mockMenuDoc as any);

      const res = await request(app)
        .delete(`/api/v1/mess/menu/${menuId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockMenuDoc.deleteOne).toHaveBeenCalledTimes(1);
    });

    it("fetches upcoming menus for the next 3 days (200 OK)", async () => {
      const mockMenus = [
        {
          _id: new mongoose.Types.ObjectId(menuId),
          mealDate: "2026-11-01",
          mealType: MealType.LUNCH,
          title: "Lunch Menu",
          items: [{ name: "Pulao" }],
        },
      ];
      (MockedMenu.find as jest.Mock).mockImplementation(() => mockChainedQuery(mockMenus));

      const res = await request(app)
        .get("/api/v1/mess/menu?days=3")
        .set("Authorization", `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.menus)).toBe(true);
      expect(res.body.data.menus.length).toBe(1);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // GROUP 2: Meal Selection & Cutoff Enforcement
  // ══════════════════════════════════════════════════════════════════════════

  describe("Meal Selection & Cutoff Rules", () => {
    // 2099 is definitely in the future so isCutoffPassed is false
    const futureDate = "2099-11-01";
    // 2020 is definitely in the past so isCutoffPassed is true
    const pastDate = "2020-01-01";

    it("allows student to select TIFFIN for lunch on future date (200 OK)", async () => {
      const mockSelection = {
        _id: new mongoose.Types.ObjectId("880000000000000000000030"),
        studentId: new mongoose.Types.ObjectId(studentUser._id),
        hostelId: new mongoose.Types.ObjectId(hostelId),
        mealDate: futureDate,
        mealType: "LUNCH",
        selection: MealSelectionChoice.TIFFIN,
        isDefault: false,
        isOverridden: false,
      };
      (MockedMealSelection.findOneAndUpdate as jest.Mock).mockResolvedValue(mockSelection as any);

      const res = await request(app)
        .post("/api/v1/mess/selection")
        .set("Authorization", `Bearer ${studentToken}`)
        .send({
          mealDate: futureDate,
          selection: MealSelectionChoice.TIFFIN,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.selection.selection).toBe(MealSelectionChoice.TIFFIN);
      expect(MockedMealSelection.findOneAndUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          mealDate: futureDate,
          mealType: "LUNCH",
        }),
        expect.any(Object),
        expect.any(Object)
      );
    });

    it("rejects student meal selection after cutoff time has passed (422 Unprocessable Entity)", async () => {
      const res = await request(app)
        .post("/api/v1/mess/selection")
        .set("Authorization", `Bearer ${studentToken}`)
        .send({
          mealDate: pastDate,
          selection: MealSelectionChoice.TIFFIN,
        });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("CUTOFF_TIME_PASSED");
      expect(MockedMealSelection.findOneAndUpdate).not.toHaveBeenCalled();
    });

    it("returns default DINE_IN when student has made no selection (200 OK)", async () => {
      (MockedMealSelection.findOne as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .get(`/api/v1/mess/selection/me?mealDate=${futureDate}`)
        .set("Authorization", `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.selection.selection).toBe(MealSelectionChoice.DINE_IN);
      expect(res.body.data.selection.isDefault).toBe(true);
    });

    it("returns recorded explicit selection if student already made one (200 OK)", async () => {
      (MockedMealSelection.findOne as jest.Mock).mockResolvedValue({
        _id: new mongoose.Types.ObjectId("880000000000000000000030"),
        studentId: new mongoose.Types.ObjectId(studentUser._id),
        mealDate: futureDate,
        mealType: "LUNCH",
        selection: MealSelectionChoice.TIFFIN,
        isDefault: false,
      } as any);

      const res = await request(app)
        .get(`/api/v1/mess/selection/me?mealDate=${futureDate}`)
        .set("Authorization", `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.selection.selection).toBe(MealSelectionChoice.TIFFIN);
      expect(res.body.data.selection.isDefault).toBe(false);
    });

    it("allows admin to override student choice post-cutoff with audit log (200 OK)", async () => {
      (MockedMealSelection.findOne as jest.Mock).mockResolvedValue({
        selection: MealSelectionChoice.DINE_IN,
      } as any);

      const overriddenSelection = {
        _id: new mongoose.Types.ObjectId("880000000000000000000030"),
        studentId: new mongoose.Types.ObjectId(studentUser._id),
        hostelId: new mongoose.Types.ObjectId(hostelId),
        mealDate: pastDate,
        selection: MealSelectionChoice.TIFFIN,
        isOverridden: true,
        overriddenByAdminId: new mongoose.Types.ObjectId(adminUser._id),
        overrideReason: "Emergency laboratory class off-campus; packed tiffin requested",
      };
      (MockedMealSelection.findOneAndUpdate as jest.Mock).mockResolvedValue(overriddenSelection as any);

      const res = await request(app)
        .patch("/api/v1/mess/selection/override")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          studentId: studentUser._id,
          mealDate: pastDate,
          newSelection: MealSelectionChoice.TIFFIN,
          overrideReason: "Emergency laboratory class off-campus; packed tiffin requested",
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.selection.isOverridden).toBe(true);
      expect(res.body.data.selection.selection).toBe(MealSelectionChoice.TIFFIN);
      expect(MockedAuditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "MEAL_SELECTION_OVERRIDDEN",
          actorRole: UserRole.HOSTEL_ADMIN,
        })
      );
    });

    it("forbids student from attempting an admin override (403 Forbidden)", async () => {
      const res = await request(app)
        .patch("/api/v1/mess/selection/override")
        .set("Authorization", `Bearer ${studentToken}`)
        .send({
          studentId: studentUser._id,
          mealDate: pastDate,
          newSelection: MealSelectionChoice.TIFFIN,
          overrideReason: "Student trying to override themselves",
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("FORBIDDEN_PERMISSION");
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // GROUP 3: Daily Kitchen Preparation & Tiffin Dispatch Roster
  // ══════════════════════════════════════════════════════════════════════════

  describe("Daily Kitchen Preparation & Tiffin Dispatch Report", () => {
    it("generates accurate meal counts and tiffin dispatch roster (200 OK)", async () => {
      // 2 residents active in hostel
      const mockAllocations = [
        {
          _id: new mongoose.Types.ObjectId("880000000000000000000051"),
          studentId: {
            _id: new mongoose.Types.ObjectId(studentUser._id),
            studentId: studentUser.studentId,
            email: studentUser.email,
          },
          roomId: { roomNumber: "101" },
          bedId: { bedCode: "A" },
        },
        {
          _id: new mongoose.Types.ObjectId("880000000000000000000052"),
          studentId: {
            _id: new mongoose.Types.ObjectId(studentUser2._id),
            studentId: studentUser2.studentId,
            email: studentUser2.email,
          },
          roomId: { roomNumber: "102" },
          bedId: { bedCode: "B" },
        },
      ];
      (MockedBedAllocation.find as jest.Mock).mockImplementation(() => mockChainedQuery(mockAllocations));

      // 1 explicit TIFFIN selection (student1), student2 has no selection (defaults to DINE_IN)
      const mockSelections = [
        {
          studentId: new mongoose.Types.ObjectId(studentUser._id),
          selection: MealSelectionChoice.TIFFIN,
          isOverridden: false,
          overrideReason: null,
        },
      ];
      (MockedMealSelection.find as jest.Mock).mockResolvedValue(mockSelections as any);

      (MockedStudentProfile.find as jest.Mock).mockResolvedValue([
        {
          userId: new mongoose.Types.ObjectId(studentUser._id),
          fullName: "Aarav Sharma",
          registeredPhone: "+919876543210",
        },
      ] as any);

      const res = await request(app)
        .get(`/api/v1/mess/reports/daily-kitchen?hostelId=${hostelId}&mealDate=2026-11-01`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const report = res.body.data;
      expect(report.totalResidents).toBe(2);
      expect(report.confirmedTiffinCount).toBe(1);
      expect(report.confirmedDineInCount).toBe(1); // 0 explicit dine-in + 1 default dine-in
      expect(report.explicitSelections).toBe(1);
      expect(report.defaultSelections).toBe(1);
      expect(report.tiffinRoster.length).toBe(1);
      expect(report.tiffinRoster[0].name).toBe("Aarav Sharma");
      expect(report.tiffinRoster[0].room).toBe("101-A");
    });

    it("allows mess staff to view the kitchen roster (200 OK)", async () => {
      (MockedBedAllocation.find as jest.Mock).mockImplementation(() => mockChainedQuery([]));
      (MockedMealSelection.find as jest.Mock).mockResolvedValue([]);
      (MockedStudentProfile.find as jest.Mock).mockResolvedValue([]);

      const res = await request(app)
        .get(`/api/v1/mess/reports/daily-kitchen?hostelId=${hostelId}&mealDate=2026-11-01`)
        .set("Authorization", `Bearer ${messStaffToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("forbids student from viewing daily kitchen reports (403 Forbidden)", async () => {
      const res = await request(app)
        .get(`/api/v1/mess/reports/daily-kitchen?hostelId=${hostelId}&mealDate=2026-11-01`)
        .set("Authorization", `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe("FORBIDDEN_PERMISSION");
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // GROUP 4: Food Ratings & Feedback
  // ══════════════════════════════════════════════════════════════════════════

  describe("Food Ratings & Feedback", () => {
    it("allows student to submit food feedback (201 Created)", async () => {
      const mockFeedback = {
        _id: new mongoose.Types.ObjectId("880000000000000000000060"),
        studentId: new mongoose.Types.ObjectId(studentUser._id),
        hostelId: new mongoose.Types.ObjectId(hostelId),
        mealDate: "2026-11-01",
        mealType: "LUNCH",
        rating: 4,
        tasteRating: 4,
        hygieneRating: 5,
        comments: "Excellent paneer curry, roti was fresh and hot.",
      };
      (MockedFoodFeedback.findOneAndUpdate as jest.Mock).mockResolvedValue(mockFeedback as any);

      const res = await request(app)
        .post("/api/v1/mess/feedback")
        .set("Authorization", `Bearer ${studentToken}`)
        .send({
          mealDate: "2026-11-01",
          mealType: "LUNCH",
          rating: 4,
          tasteRating: 4,
          hygieneRating: 5,
          comments: "Excellent paneer curry, roti was fresh and hot.",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.feedback.rating).toBe(4);
      expect(MockedAuditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "FEEDBACK_SUBMITTED",
          actorRole: UserRole.STUDENT,
        })
      );
    });

    it("rejects feedback with invalid rating out of bounds (400 Validation Error)", async () => {
      const res = await request(app)
        .post("/api/v1/mess/feedback")
        .set("Authorization", `Bearer ${studentToken}`)
        .send({
          mealDate: "2026-11-01",
          mealType: "LUNCH",
          rating: 6, // Invalid > 5
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("allows admin to view feedback list with summary metrics (200 OK)", async () => {
      const mockFeedbacks = [
        {
          _id: new mongoose.Types.ObjectId("880000000000000000000061"),
          rating: 4,
          tasteRating: 4,
          hygieneRating: 5,
          comments: "Good food",
        },
        {
          _id: new mongoose.Types.ObjectId("880000000000000000000062"),
          rating: 5,
          tasteRating: 5,
          hygieneRating: 5,
          comments: "Tasty",
        },
      ];
      (MockedFoodFeedback.find as jest.Mock).mockImplementation(() => mockChainedQuery(mockFeedbacks));

      const res = await request(app)
        .get(`/api/v1/mess/feedback?hostelId=${hostelId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.summary.totalReviews).toBe(2);
      expect(res.body.data.summary.averageRating).toBe(4.5);
      expect(res.body.data.summary.averageTaste).toBe(4.5);
      expect(res.body.data.summary.averageHygiene).toBe(5);
    });
  });
});
