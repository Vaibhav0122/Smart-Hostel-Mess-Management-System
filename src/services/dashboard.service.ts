import mongoose from "mongoose";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { User } from "../models/User";
import { StudentProfile } from "../models/StudentProfile";
import { Hostel } from "../models/Hostel";
import { Room } from "../models/Room";
import { Bed } from "../models/Bed";
import { BedAllocation } from "../models/BedAllocation";
import { Contract } from "../models/Contract";
import { ChargeRecord } from "../models/ChargeRecord";
import { PaymentTransaction, PaymentStatus } from "../models/PaymentTransaction";
import { RefundRecord } from "../models/RefundRecord";
import { Menu } from "../models/Menu";
import { MealSelection, MealSelectionChoice } from "../models/MealSelection";
import { FoodFeedback } from "../models/FoodFeedback";
import { UserRole, UserStatus } from "../constants/roles";
import { env } from "../config/env";
import { isCutoffPassed } from "./mess.service";
import { AppError } from "../errors/AppError";
import { HttpStatus } from "../constants/statusCodes";

dayjs.extend(utc);
dayjs.extend(timezone);

export interface AdminMetricsResult {
  totalStudents: number;
  totalHostels: number;
  totalRooms: number;
  totalBeds: number;
  occupiedBeds: number;
  vacantBeds: number;
  occupancyRate: number;
  financials: {
    totalChargesAmount: number;
    totalPaidAmount: number;
    totalRefundedAmount: number;
    totalPendingDues: number;
    pendingChargesCount: number;
  };
  messSummary: {
    todayDate: string;
    todayLunchDineIn: number;
    todayLunchTiffin: number;
    activeResidentsCount: number;
    averageRating: number | null;
  };
}

export interface StudentSummaryResult {
  student: {
    id: string;
    studentId?: string | null;
    email: string;
    status: string;
    fullName?: string;
    phone?: string;
    roomNumber?: string;
    bedCode?: string;
    hostelName?: string;
  };
  allocation: {
    hasAllocation: boolean;
    hostelId?: string;
    hostelName?: string;
    roomNumber?: string;
    bedCode?: string;
    startDate?: Date;
  };
  contract: {
    hasContract: boolean;
    status?: string;
    startDate?: Date | string;
    endDate?: Date | string;
    monthlyRentAmount?: number;
    securityDepositAmount?: number;
    lockInUntilDate?: Date | string;
  };
  financials: {
    totalCharges: number;
    totalPaid: number;
    totalRefunded: number;
    outstandingBalance: number;
    recentTransactions: Array<{
      id: string;
      receiptNumber: string;
      amountPaid: number;
      paymentDate: Date;
      paymentMethod: string;
    }>;
  };
  mess: {
    todayDate: string;
    cutoffPassed: boolean;
    todaySelection: {
      selection: string;
      isDefault: boolean;
      isOverridden: boolean;
    };
    upcomingMenus: Array<{
      id: string;
      mealDate: string;
      mealType: string;
      title: string;
      items: string[];
      isSpecialMeal: boolean;
    }>;
  };
}

export class DashboardService {
  /**
   * Real-time executive KPI metrics for Admins and Accounts Managers
   */
  public static async getAdminMetrics(hostelId?: string): Promise<AdminMetricsResult> {
    const tz = env.HOSTEL_TIMEZONE;
    const todayDate = dayjs().tz(tz).format("YYYY-MM-DD");

    // 1. Student count
    const totalStudents = await User.countDocuments({
      role: UserRole.STUDENT,
      status: UserStatus.ACTIVE,
    });

    const totalHostels = await Hostel.countDocuments();

    // 2. Room & Bed inventory
    let roomFilter: Record<string, unknown> = {};
    if (hostelId) {
      roomFilter["hostelId"] = new mongoose.Types.ObjectId(hostelId);
    }

    const rooms = await Room.find(roomFilter).select("_id");
    const roomIds = rooms.map((r) => r._id);

    let bedFilter: Record<string, unknown> = {};
    if (hostelId) {
      bedFilter["roomId"] = { $in: roomIds };
    }

    const totalRooms = rooms.length;
    const totalBeds = await Bed.countDocuments(bedFilter);
    const occupiedBeds = await Bed.countDocuments({ ...bedFilter, status: "OCCUPIED" });
    const vacantBeds = await Bed.countDocuments({ ...bedFilter, status: "AVAILABLE" });
    const occupancyRate = totalBeds > 0 ? Number(((occupiedBeds / totalBeds) * 100).toFixed(1)) : 0;

    // 3. Financial aggregates
    let chargeFilter: Record<string, unknown> = { status: { $ne: "CANCELLED" } };
    if (hostelId) {
      // Find students in this hostel
      const allocations = await BedAllocation.find({
        hostelId: new mongoose.Types.ObjectId(hostelId),
      }).select("studentId");
      const sIds = allocations.map((a) => a.studentId);
      chargeFilter["studentId"] = { $in: sIds };
    }

    const chargesAgg = await ChargeRecord.aggregate([
      { $match: chargeFilter },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const totalChargesAmount = chargesAgg[0]?.total || 0;

    let paymentFilter: Record<string, unknown> = {
      status: PaymentStatus.SUCCESS,
      isReversal: { $ne: true },
    };
    if (hostelId) {
      const allocations = await BedAllocation.find({
        hostelId: new mongoose.Types.ObjectId(hostelId),
      }).select("studentId");
      const sIds = allocations.map((a) => a.studentId);
      paymentFilter["studentId"] = { $in: sIds };
    }

    const paymentsAgg = await PaymentTransaction.aggregate([
      { $match: paymentFilter },
      { $group: { _id: null, total: { $sum: "$amountPaid" } } },
    ]);
    const totalPaidAmount = paymentsAgg[0]?.total || 0;

    let refundFilter: Record<string, unknown> = {};
    if (hostelId) {
      const allocations = await BedAllocation.find({
        hostelId: new mongoose.Types.ObjectId(hostelId),
      }).select("studentId");
      const sIds = allocations.map((a) => a.studentId);
      refundFilter["studentId"] = { $in: sIds };
    }

    const refundsAgg = await RefundRecord.aggregate([
      { $match: refundFilter },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const totalRefundedAmount = refundsAgg[0]?.total || 0;

    const netPaid = totalPaidAmount - totalRefundedAmount;
    const totalPendingDues = Math.max(0, totalChargesAmount - netPaid);
    const pendingChargesCount = await ChargeRecord.countDocuments({
      ...chargeFilter,
      status: { $in: ["UNPAID", "PARTIALLY_PAID"] },
    });

    // 4. Daily Mess & Meal Selection Metrics for Today
    let allocFilter: Record<string, unknown> = { status: "ACTIVE" };
    if (hostelId) {
      allocFilter["hostelId"] = new mongoose.Types.ObjectId(hostelId);
    }
    const activeResidentsCount = await BedAllocation.countDocuments(allocFilter);

    let mealSelFilter: Record<string, unknown> = {
      mealDate: todayDate,
      mealType: "LUNCH",
    };
    if (hostelId) {
      mealSelFilter["hostelId"] = new mongoose.Types.ObjectId(hostelId);
    }

    const selections = await MealSelection.find(mealSelFilter);
    let explicitTiffins = 0;
    let explicitDineIns = 0;
    for (const sel of selections) {
      if (sel.selection === MealSelectionChoice.TIFFIN) {
        explicitTiffins++;
      } else {
        explicitDineIns++;
      }
    }
    const defaultDineIns = Math.max(0, activeResidentsCount - selections.length);
    const todayLunchDineIn = explicitDineIns + defaultDineIns;
    const todayLunchTiffin = explicitTiffins;

    // Average rating
    const feedbackAgg = await FoodFeedback.aggregate([
      { $group: { _id: null, avgRating: { $avg: "$rating" } } },
    ]);
    const averageRating = feedbackAgg[0]?.avgRating
      ? Number(feedbackAgg[0].avgRating.toFixed(2))
      : null;

    return {
      totalStudents,
      totalHostels,
      totalRooms,
      totalBeds,
      occupiedBeds,
      vacantBeds,
      occupancyRate,
      financials: {
        totalChargesAmount,
        totalPaidAmount,
        totalRefundedAmount,
        totalPendingDues,
        pendingChargesCount,
      },
      messSummary: {
        todayDate,
        todayLunchDineIn,
        todayLunchTiffin,
        activeResidentsCount,
        averageRating,
      },
    };
  }

  /**
   * Authenticated student summary dashboard
   */
  public static async getStudentSummary(studentUserId: string): Promise<StudentSummaryResult> {
    const tz = env.HOSTEL_TIMEZONE;
    const todayDate = dayjs().tz(tz).format("YYYY-MM-DD");

    const user = await User.findById(studentUserId).select("-passwordHash -refreshTokenHash");
    if (!user) {
      throw new AppError(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "Student account not found.");
    }

    const profile = await StudentProfile.findOne({ userId: user._id });

    // Active Bed Allocation
    const allocation = await BedAllocation.findOne({
      studentId: user._id,
      status: "ACTIVE",
    })
      .populate("hostelId", "name code")
      .populate("roomId", "roomNumber floor")
      .populate("bedId", "bedCode");

    const hostelObj = allocation?.hostelId as any;
    const roomObj = allocation?.roomId as any;
    const bedObj = allocation?.bedId as any;

    // Active Contract
    const contract = await Contract.findOne({
      studentId: user._id,
      status: "ACTIVE",
    });

    // Financial ledger
    const charges = await ChargeRecord.find({
      studentId: user._id,
      status: { $ne: "CANCELLED" },
    });
    const totalCharges = charges.reduce((acc, c) => acc + c.amount, 0);

    const payments = await PaymentTransaction.find({
      studentId: user._id,
      status: PaymentStatus.SUCCESS,
      isReversal: { $ne: true },
    }).sort({ paymentDate: -1 });

    const totalPaid = payments.reduce((acc, p) => acc + p.amountPaid, 0);

    const refunds = await RefundRecord.find({
      studentId: user._id,
    });
    const totalRefunded = refunds.reduce((acc, r) => acc + r.amount, 0);

    const netPaid = totalPaid - totalRefunded;
    const outstandingBalance = Math.max(0, totalCharges - netPaid);

    const recentTransactions = payments.slice(0, 5).map((p) => ({
      id: p._id.toString(),
      receiptNumber: p.receiptNumber,
      amountPaid: p.amountPaid,
      paymentDate: p.paymentDate,
      paymentMethod: p.paymentMethod,
    }));

    // Mess & Meal Selection
    const todaySelectionDoc = await MealSelection.findOne({
      studentId: user._id,
      mealDate: todayDate,
      mealType: "LUNCH",
    });

    const cutoffPassed = isCutoffPassed(todayDate);

    const todaySelection = todaySelectionDoc
      ? {
          selection: todaySelectionDoc.selection,
          isDefault: todaySelectionDoc.isDefault,
          isOverridden: todaySelectionDoc.isOverridden,
        }
      : {
          selection: MealSelectionChoice.DINE_IN,
          isDefault: true,
          isOverridden: false,
        };

    // Upcoming 3 days menu
    const nextDates = [
      todayDate,
      dayjs().tz(tz).add(1, "day").format("YYYY-MM-DD"),
      dayjs().tz(tz).add(2, "day").format("YYYY-MM-DD"),
    ];

    let menuFilter: Record<string, unknown> = {
      mealDate: { $in: nextDates },
    };
    if (hostelObj?._id) {
      menuFilter["hostelId"] = hostelObj._id;
    }

    const menus = await Menu.find(menuFilter).sort({ mealDate: 1, mealType: 1 });
    const upcomingMenus = menus.map((m) => ({
      id: m._id.toString(),
      mealDate: m.mealDate,
      mealType: m.mealType,
      title: m.title,
      items: m.items,
      isSpecialMeal: m.isSpecialMeal,
    }));

    return {
      student: {
        id: user._id.toString(),
        studentId: user.studentId,
        email: user.email,
        status: user.status,
        fullName: profile?.fullName || user.email.split("@")[0],
        phone: profile?.registeredPhone || "N/A",
        roomNumber: roomObj?.roomNumber,
        bedCode: bedObj?.bedCode,
        hostelName: hostelObj?.name,
      },
      allocation: {
        hasAllocation: !!allocation,
        hostelId: hostelObj?._id?.toString(),
        hostelName: hostelObj?.name,
        roomNumber: roomObj?.roomNumber,
        bedCode: bedObj?.bedCode,
        startDate: allocation?.startDate,
      },
      contract: {
        hasContract: !!contract,
        status: contract?.status,
        startDate: contract?.startDate,
        endDate: contract?.endDate,
        monthlyRentAmount: contract?.monthlyRentAmount,
        securityDepositAmount: contract?.securityDepositAmount,
        lockInUntilDate: contract?.lockInUntilDate,
      },
      financials: {
        totalCharges,
        totalPaid,
        totalRefunded,
        outstandingBalance,
        recentTransactions,
      },
      mess: {
        todayDate,
        cutoffPassed,
        todaySelection,
        upcomingMenus,
      },
    };
  }
}
