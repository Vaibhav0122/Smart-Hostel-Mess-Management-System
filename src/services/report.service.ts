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
import { MealSelection, MealSelectionChoice } from "../models/MealSelection";
import { FoodFeedback } from "../models/FoodFeedback";
import { UserRole } from "../constants/roles";
import { env } from "../config/env";
import {
  StudentReportQuery,
  OccupancyReportQuery,
  FinanceReportQuery,
  MessReportQuery,
  ExportReportQuery,
} from "../validations/report.validation";

dayjs.extend(utc);
dayjs.extend(timezone);

function escapeCsv(val: any): string {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

export class ReportService {
  /**
   * 1. Student Master Report (with room, contract, and balance dues)
   */
  public static async getStudentReport(params: StudentReportQuery): Promise<{
    students: any[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const userFilter: Record<string, unknown> = {
      role: UserRole.STUDENT,
    };
    if (params.status) {
      userFilter["status"] = params.status;
    }
    if (params.search) {
      userFilter["$or"] = [
        { email: { $regex: params.search, $options: "i" } },
        { studentId: { $regex: params.search, $options: "i" } },
      ];
    }

    const total = await User.countDocuments(userFilter);
    const users = await User.find(userFilter)
      .select("-passwordHash -refreshTokenHash")
      .sort({ studentId: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const userIds = users.map((u) => u._id);

    // Batch fetch student profiles
    const profiles = await StudentProfile.find({ userId: { $in: userIds } });
    const profileMap = new Map<string, any>();
    for (const p of profiles) {
      profileMap.set(p.userId.toString(), p);
    }

    // Batch fetch active allocations
    const allocations = await BedAllocation.find({
      studentId: { $in: userIds },
      status: "ACTIVE",
    })
      .populate("hostelId", "name code")
      .populate("roomId", "roomNumber")
      .populate("bedId", "bedCode");

    const allocMap = new Map<string, any>();
    for (const a of allocations) {
      allocMap.set(a.studentId.toString(), a);
    }

    // Batch fetch active contracts
    const contracts = await Contract.find({
      studentId: { $in: userIds },
      status: "ACTIVE",
    });
    const contractMap = new Map<string, any>();
    for (const c of contracts) {
      contractMap.set(c.studentId.toString(), c);
    }

    // Batch calculate dues
    const charges = await ChargeRecord.find({
      studentId: { $in: userIds },
      status: { $ne: "CANCELLED" },
    });
    const payments = await PaymentTransaction.find({
      studentId: { $in: userIds },
      status: PaymentStatus.SUCCESS,
      isReversal: { $ne: true },
    });

    const chargesMap = new Map<string, number>();
    for (const ch of charges) {
      const sid = ch.studentId.toString();
      chargesMap.set(sid, (chargesMap.get(sid) || 0) + ch.amount);
    }

    const paymentsMap = new Map<string, number>();
    for (const p of payments) {
      const sid = p.studentId.toString();
      paymentsMap.set(sid, (paymentsMap.get(sid) || 0) + p.amountPaid);
    }

    const students = users.map((u) => {
      const uid = u._id.toString();
      const prof = profileMap.get(uid);
      const alloc = allocMap.get(uid);
      const cont = contractMap.get(uid);
      const totalCharged = chargesMap.get(uid) || 0;
      const totalPaid = paymentsMap.get(uid) || 0;
      const dues = Math.max(0, totalCharged - totalPaid);

      const hostel = alloc?.hostelId as any;
      const room = alloc?.roomId as any;
      const bed = alloc?.bedId as any;

      return {
        id: uid,
        studentId: u.studentId || "N/A",
        name: prof?.fullName || u.email.split("@")[0],
        email: u.email,
        phone: prof?.registeredPhone || "N/A",
        status: u.status,
        hostelName: hostel?.name || "Unassigned",
        roomNumber: room?.roomNumber || "-",
        bedCode: bed?.bedCode || "-",
        contractStatus: cont?.status || "NO_CONTRACT",
        monthlyRent: cont?.monthlyRentAmount || 0,
        outstandingDues: dues,
      };
    });

    return {
      students,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * 2. Hostel Occupancy Report
   */
  public static async getOccupancyReport(params: OccupancyReportQuery): Promise<{
    hostels: any[];
    overall: {
      totalCapacity: number;
      occupiedBeds: number;
      availableBeds: number;
      occupancyPercentage: number;
    };
  }> {
    let hostelFilter: Record<string, unknown> = {};
    if (params.hostelId) {
      hostelFilter["_id"] = new mongoose.Types.ObjectId(params.hostelId);
    }

    const hostels = await Hostel.find(hostelFilter);
    const hostelResults: any[] = [];

    let overallCapacity = 0;
    let overallOccupied = 0;
    let overallAvailable = 0;

    for (const h of hostels) {
      const rooms = await Room.find({ hostelId: h._id });
      const roomIds = rooms.map((r) => r._id);

      const totalBeds = await Bed.countDocuments({ roomId: { $in: roomIds } });
      const occupied = await Bed.countDocuments({ roomId: { $in: roomIds }, status: "OCCUPIED" });
      const available = await Bed.countDocuments({ roomId: { $in: roomIds }, status: "AVAILABLE" });
      const maintenance = await Bed.countDocuments({ roomId: { $in: roomIds }, status: "MAINTENANCE" });

      const occupancyRate = totalBeds > 0 ? Number(((occupied / totalBeds) * 100).toFixed(1)) : 0;

      overallCapacity += totalBeds;
      overallOccupied += occupied;
      overallAvailable += available;

      hostelResults.push({
        hostelId: h._id.toString(),
        name: h.name,
        code: h.code,
        totalRooms: rooms.length,
        totalCapacity: totalBeds,
        occupiedBeds: occupied,
        availableBeds: available,
        maintenanceBeds: maintenance,
        occupancyPercentage: occupancyRate,
      });
    }

    const overallOccupancyRate =
      overallCapacity > 0 ? Number(((overallOccupied / overallCapacity) * 100).toFixed(1)) : 0;

    return {
      hostels: hostelResults,
      overall: {
        totalCapacity: overallCapacity,
        occupiedBeds: overallOccupied,
        availableBeds: overallAvailable,
        occupancyPercentage: overallOccupancyRate,
      },
    };
  }

  /**
   * 3. Financial Summary Report
   */
  public static async getFinanceReport(params: FinanceReportQuery): Promise<{
    summary: {
      totalCharges: number;
      totalPayments: number;
      totalRefunds: number;
      outstandingBalance: number;
    };
    chargeBreakdown: Array<{ chargeType: string; totalAmount: number; count: number }>;
    paymentMethodBreakdown: Array<{ method: string; totalAmount: number; count: number }>;
  }> {
    const chargeFilter: Record<string, unknown> = { status: { $ne: "CANCELLED" } };
    const paymentFilter: Record<string, unknown> = {
      status: PaymentStatus.SUCCESS,
      isReversal: { $ne: true },
    };

    if (params.startDate && params.endDate) {
      paymentFilter["paymentDate"] = {
        $gte: new Date(params.startDate),
        $lte: new Date(params.endDate + "T23:59:59.999Z"),
      };
    }

    // Charges summary
    const chargesAgg = await ChargeRecord.aggregate([
      { $match: chargeFilter },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const totalCharges = chargesAgg[0]?.total || 0;

    // Payments summary
    const paymentsAgg = await PaymentTransaction.aggregate([
      { $match: paymentFilter },
      { $group: { _id: null, total: { $sum: "$amountPaid" } } },
    ]);
    const totalPayments = paymentsAgg[0]?.total || 0;

    // Refunds summary
    const refundsAgg = await RefundRecord.aggregate([
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const totalRefunds = refundsAgg[0]?.total || 0;

    const netPaid = totalPayments - totalRefunds;
    const outstandingBalance = Math.max(0, totalCharges - netPaid);

    // By charge type
    const chargeTypeAgg = await ChargeRecord.aggregate([
      { $match: chargeFilter },
      { $group: { _id: "$chargeType", totalAmount: { $sum: "$amount" }, count: { $sum: 1 } } },
    ]);
    const chargeBreakdown = chargeTypeAgg.map((ct) => ({
      chargeType: ct._id || "OTHER",
      totalAmount: ct.totalAmount,
      count: ct.count,
    }));

    // By payment method
    const paymentMethodAgg = await PaymentTransaction.aggregate([
      { $match: paymentFilter },
      { $group: { _id: "$paymentMethod", totalAmount: { $sum: "$amountPaid" }, count: { $sum: 1 } } },
    ]);
    const paymentMethodBreakdown = paymentMethodAgg.map((pm) => ({
      method: pm._id || "OTHER",
      totalAmount: pm.totalAmount,
      count: pm.count,
    }));

    return {
      summary: {
        totalCharges,
        totalPayments,
        totalRefunds,
        outstandingBalance,
      },
      chargeBreakdown,
      paymentMethodBreakdown,
    };
  }

  /**
   * 4. Daily Mess & Meal Attendance Report
   */
  public static async getMessReport(params: MessReportQuery): Promise<{
    dailyMetrics: Array<{
      mealDate: string;
      totalResidents: number;
      confirmedDineIn: number;
      confirmedTiffin: number;
      explicitSelections: number;
      defaultSelections: number;
      averageRating: number | null;
    }>;
  }> {
    const tz = env.HOSTEL_TIMEZONE;
    const endStr = params.endDate || dayjs().tz(tz).format("YYYY-MM-DD");
    const startStr = params.startDate || dayjs().tz(tz).subtract(6, "day").format("YYYY-MM-DD");

    let allocFilter: Record<string, unknown> = { status: "ACTIVE" };
    if (params.hostelId) {
      allocFilter["hostelId"] = new mongoose.Types.ObjectId(params.hostelId);
    }
    const totalResidents = await BedAllocation.countDocuments(allocFilter);

    // Generate date sequence
    const dates: string[] = [];
    let cur = dayjs.tz(startStr, tz);
    const end = dayjs.tz(endStr, tz);
    while (cur.isBefore(end) || cur.isSame(end, "day")) {
      dates.push(cur.format("YYYY-MM-DD"));
      cur = cur.add(1, "day");
    }

    const dailyMetrics: any[] = [];

    for (const d of dates) {
      let selFilter: Record<string, unknown> = { mealDate: d, mealType: "LUNCH" };
      if (params.hostelId) {
        selFilter["hostelId"] = new mongoose.Types.ObjectId(params.hostelId);
      }

      const selections = await MealSelection.find(selFilter);
      let tiffins = 0;
      let dineIns = 0;
      for (const s of selections) {
        if (s.selection === MealSelectionChoice.TIFFIN) {
          tiffins++;
        } else {
          dineIns++;
        }
      }
      const defaultDineIns = Math.max(0, totalResidents - selections.length);
      const confirmedDineIn = dineIns + defaultDineIns;
      const confirmedTiffin = tiffins;

      // Avg rating for date
      const feedbackAgg = await FoodFeedback.aggregate([
        { $match: { mealDate: d } },
        { $group: { _id: null, avg: { $avg: "$rating" } } },
      ]);
      const avgRating = feedbackAgg[0]?.avg ? Number(feedbackAgg[0].avg.toFixed(2)) : null;

      dailyMetrics.push({
        mealDate: d,
        totalResidents,
        confirmedDineIn,
        confirmedTiffin,
        explicitSelections: selections.length,
        defaultSelections: defaultDineIns,
        averageRating: avgRating,
      });
    }

    return { dailyMetrics };
  }

  /**
   * 5. Export Server-Side CSV Report
   */
  public static async exportReportCsv(params: ExportReportQuery): Promise<{
    filename: string;
    csv: string;
  }> {
    const timestamp = dayjs().format("YYYYMMDD-HHmmss");

    switch (params.type) {
      case "students": {
        const data = await this.getStudentReport({
          hostelId: params.hostelId,
          page: 1,
          limit: 1000,
        });

        const headers = [
          "Student ID",
          "Full Name",
          "Email",
          "Phone",
          "Status",
          "Hostel",
          "Room",
          "Bed",
          "Contract Status",
          "Monthly Rent (INR)",
          "Outstanding Dues (INR)",
        ];

        const rows = data.students.map((s) => [
          escapeCsv(s.studentId),
          escapeCsv(s.name),
          escapeCsv(s.email),
          escapeCsv(s.phone),
          escapeCsv(s.status),
          escapeCsv(s.hostelName),
          escapeCsv(s.roomNumber),
          escapeCsv(s.bedCode),
          escapeCsv(s.contractStatus),
          escapeCsv(s.monthlyRent),
          escapeCsv(s.outstandingDues),
        ]);

        const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
        return {
          filename: `students-report-${timestamp}.csv`,
          csv,
        };
      }

      case "occupancy": {
        const data = await this.getOccupancyReport({ hostelId: params.hostelId });

        const headers = [
          "Hostel Name",
          "Code",
          "Total Rooms",
          "Total Capacity",
          "Occupied Beds",
          "Available Beds",
          "Maintenance Beds",
          "Occupancy %",
        ];

        const rows = data.hostels.map((h) => [
          escapeCsv(h.name),
          escapeCsv(h.code),
          escapeCsv(h.totalRooms),
          escapeCsv(h.totalCapacity),
          escapeCsv(h.occupiedBeds),
          escapeCsv(h.availableBeds),
          escapeCsv(h.maintenanceBeds),
          escapeCsv(h.occupancyPercentage),
        ]);

        // Add overall row
        rows.push([
          escapeCsv("OVERALL TOTAL"),
          escapeCsv("ALL"),
          escapeCsv("-"),
          escapeCsv(data.overall.totalCapacity),
          escapeCsv(data.overall.occupiedBeds),
          escapeCsv(data.overall.availableBeds),
          escapeCsv("-"),
          escapeCsv(data.overall.occupancyPercentage),
        ]);

        const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
        return {
          filename: `occupancy-report-${timestamp}.csv`,
          csv,
        };
      }

      case "finances": {
        const data = await this.getFinanceReport({
          hostelId: params.hostelId,
          startDate: params.startDate,
          endDate: params.endDate,
        });

        const headers = ["Category", "Metric", "Amount (INR)", "Count"];
        const rows = [
          [escapeCsv("Summary"), escapeCsv("Total Charges"), escapeCsv(data.summary.totalCharges), escapeCsv("-")],
          [escapeCsv("Summary"), escapeCsv("Total Payments"), escapeCsv(data.summary.totalPayments), escapeCsv("-")],
          [escapeCsv("Summary"), escapeCsv("Total Refunds"), escapeCsv(data.summary.totalRefunds), escapeCsv("-")],
          [escapeCsv("Summary"), escapeCsv("Outstanding Balance"), escapeCsv(data.summary.outstandingBalance), escapeCsv("-")],
          ...data.chargeBreakdown.map((cb) => [
            escapeCsv("Charge Breakdown"),
            escapeCsv(cb.chargeType),
            escapeCsv(cb.totalAmount),
            escapeCsv(cb.count),
          ]),
          ...data.paymentMethodBreakdown.map((pm) => [
            escapeCsv("Payment Method"),
            escapeCsv(pm.method),
            escapeCsv(pm.totalAmount),
            escapeCsv(pm.count),
          ]),
        ];

        const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
        return {
          filename: `finances-report-${timestamp}.csv`,
          csv,
        };
      }

      case "mess": {
        const data = await this.getMessReport({
          hostelId: params.hostelId,
          startDate: params.startDate,
          endDate: params.endDate,
        });

        const headers = [
          "Date",
          "Total Residents",
          "Confirmed Dine-In",
          "Confirmed Tiffin",
          "Explicit Choices",
          "Default Choices",
          "Average Rating",
        ];

        const rows = data.dailyMetrics.map((m) => [
          escapeCsv(m.mealDate),
          escapeCsv(m.totalResidents),
          escapeCsv(m.confirmedDineIn),
          escapeCsv(m.confirmedTiffin),
          escapeCsv(m.explicitSelections),
          escapeCsv(m.defaultSelections),
          escapeCsv(m.averageRating ?? "N/A"),
        ]);

        const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
        return {
          filename: `mess-report-${timestamp}.csv`,
          csv,
        };
      }
    }
  }
}
