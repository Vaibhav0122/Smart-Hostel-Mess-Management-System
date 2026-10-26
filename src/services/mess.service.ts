import mongoose from "mongoose";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { Menu, IMenu, MealType } from "../models/Menu";
import { MealSelection, IMealSelection, MealSelectionChoice } from "../models/MealSelection";
import { FoodFeedback, IFoodFeedback } from "../models/FoodFeedback";
import { BedAllocation } from "../models/BedAllocation";
import { Contract } from "../models/Contract";
import { Hostel } from "../models/Hostel";
import { User } from "../models/User";
import { StudentProfile } from "../models/StudentProfile";
import { AuditLog } from "../models/AuditLog";
import { AppError } from "../errors/AppError";
import { HttpStatus } from "../constants/statusCodes";
import { AuthenticatedUser } from "../types/express";
import { UserRole } from "../constants/roles";
import { env } from "../config/env";
import {
  CreateMenuInput,
  UpdateMenuInput,
  SelectMealInput,
  OverrideSelectionInput,
  SubmitFeedbackInput,
} from "../validations/mess.validation";

dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * Checks whether the daily lunch cutoff has passed for a specific calendar date
 * in the configured hostel timezone (default: Asia/Kolkata).
 */
export function isCutoffPassed(
  mealDate: string,
  cutoffTime: string = env.DEFAULT_LUNCH_CUTOFF_TIME,
  tz: string = env.HOSTEL_TIMEZONE
): boolean {
  const nowInTz = dayjs().tz(tz);
  const todayDateStr = nowInTz.format("YYYY-MM-DD");

  if (mealDate < todayDateStr) {
    return true; // Past dates are locked
  }
  if (mealDate > todayDateStr) {
    return false; // Future dates are open
  }

  // Today: check hour and minute
  const [hours, minutes] = cutoffTime.split(":").map((v) => parseInt(v, 10));
  const cutoffMoment = nowInTz
    .hour(hours ?? 9)
    .minute(minutes ?? 30)
    .second(0)
    .millisecond(0);

  return nowInTz.isAfter(cutoffMoment) || nowInTz.isSame(cutoffMoment);
}

/**
 * Helper to resolve the student's associated hostelId from active allocation or contract
 */
async function resolveStudentHostelId(
  studentUserId: string,
  explicitHostelId?: string
): Promise<mongoose.Types.ObjectId> {
  if (explicitHostelId) {
    const hostel = await Hostel.findById(explicitHostelId);
    if (!hostel) {
      throw new AppError(HttpStatus.NOT_FOUND, "HOSTEL_NOT_FOUND", "Specified hostel not found.");
    }
    return new mongoose.Types.ObjectId(explicitHostelId);
  }

  // Look up active bed allocation
  const allocation = await BedAllocation.findOne({
    studentId: new mongoose.Types.ObjectId(studentUserId),
    status: "ACTIVE",
  });
  if (allocation) {
    return allocation.hostelId;
  }

  // Fallback to active contract
  const contract = await Contract.findOne({
    studentId: new mongoose.Types.ObjectId(studentUserId),
    status: "ACTIVE",
  });
  if (contract) {
    return contract.hostelId;
  }

  throw new AppError(
    HttpStatus.BAD_REQUEST,
    "HOSTEL_REQUIRED",
    "No active hostel allocation found for this resident. Please provide hostelId."
  );
}

export class MessService {
  // ---------------------------------------------------------------------------
  // 8.1 Menus
  // ---------------------------------------------------------------------------

  public static async createMenu(
    adminUser: AuthenticatedUser,
    input: CreateMenuInput,
    ipAddress?: string,
    userAgent?: string
  ): Promise<IMenu> {
    const hostel = await Hostel.findById(input.hostelId);
    if (!hostel) {
      throw new AppError(HttpStatus.NOT_FOUND, "HOSTEL_NOT_FOUND", "Hostel not found.");
    }

    const existing = await Menu.findOne({
      hostelId: new mongoose.Types.ObjectId(input.hostelId),
      mealDate: input.mealDate,
      mealType: input.mealType,
    });
    if (existing) {
      throw new AppError(
        HttpStatus.CONFLICT,
        "MENU_ALREADY_EXISTS",
        `A menu for ${input.mealType} on ${input.mealDate} already exists for this hostel.`
      );
    }

    const dateAnchor = new Date(`${input.mealDate}T00:00:00.000Z`);

    const menu = await Menu.create({
      hostelId: new mongoose.Types.ObjectId(input.hostelId),
      mealDate: input.mealDate,
      dateAnchor,
      mealType: input.mealType as MealType,
      title: input.title,
      items: input.items,
      isSpecialMeal: input.isSpecialMeal ?? false,
      dietaryTags: input.dietaryTags ?? [],
      createdByAdminId: new mongoose.Types.ObjectId(adminUser.id),
    });

    await AuditLog.create({
      actorId: new mongoose.Types.ObjectId(adminUser.id),
      actorRole: adminUser.role,
      action: "MENU_CREATED",
      targetCollection: "menus",
      targetDocumentId: menu._id,
      newState: {
        hostelId: input.hostelId,
        mealDate: input.mealDate,
        mealType: input.mealType,
        title: input.title,
      },
      ipAddress: ipAddress ?? null,
      userAgent: userAgent ?? null,
      timestamp: new Date(),
    });

    return menu;
  }

  public static async updateMenu(
    adminUser: AuthenticatedUser,
    menuId: string,
    input: UpdateMenuInput,
    ipAddress?: string,
    userAgent?: string
  ): Promise<IMenu> {
    const menu = await Menu.findById(menuId);
    if (!menu) {
      throw new AppError(HttpStatus.NOT_FOUND, "MENU_NOT_FOUND", "Menu item not found.");
    }

    const previousState = {
      title: menu.title,
      items: menu.items,
      isSpecialMeal: menu.isSpecialMeal,
      dietaryTags: menu.dietaryTags,
    };

    if (input.title !== undefined) menu.title = input.title;
    if (input.items !== undefined) menu.items = input.items;
    if (input.isSpecialMeal !== undefined) menu.isSpecialMeal = input.isSpecialMeal;
    if (input.dietaryTags !== undefined) menu.dietaryTags = input.dietaryTags;

    await menu.save();

    await AuditLog.create({
      actorId: new mongoose.Types.ObjectId(adminUser.id),
      actorRole: adminUser.role,
      action: "MENU_UPDATED",
      targetCollection: "menus",
      targetDocumentId: menu._id,
      previousState,
      newState: {
        title: menu.title,
        items: menu.items,
        isSpecialMeal: menu.isSpecialMeal,
        dietaryTags: menu.dietaryTags,
      },
      ipAddress: ipAddress ?? null,
      userAgent: userAgent ?? null,
      timestamp: new Date(),
    });

    return menu;
  }

  public static async deleteMenu(
    adminUser: AuthenticatedUser,
    menuId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    const menu = await Menu.findById(menuId);
    if (!menu) {
      throw new AppError(HttpStatus.NOT_FOUND, "MENU_NOT_FOUND", "Menu item not found.");
    }

    await menu.deleteOne();

    await AuditLog.create({
      actorId: new mongoose.Types.ObjectId(adminUser.id),
      actorRole: adminUser.role,
      action: "MENU_DELETED",
      targetCollection: "menus",
      targetDocumentId: menu._id,
      previousState: {
        hostelId: menu.hostelId,
        mealDate: menu.mealDate,
        mealType: menu.mealType,
        title: menu.title,
      },
      ipAddress: ipAddress ?? null,
      userAgent: userAgent ?? null,
      timestamp: new Date(),
    });
  }

  public static async getMenus(
    requestingUser: AuthenticatedUser,
    query: { hostelId?: string; startDate?: string; days?: number }
  ): Promise<IMenu[]> {
    let targetHostelId: mongoose.Types.ObjectId | null = null;

    if (query.hostelId) {
      targetHostelId = new mongoose.Types.ObjectId(query.hostelId);
    } else if (requestingUser.role === UserRole.STUDENT) {
      targetHostelId = await resolveStudentHostelId(requestingUser.id);
    }

    const tz = env.HOSTEL_TIMEZONE;
    const startStr = query.startDate || dayjs().tz(tz).format("YYYY-MM-DD");
    const numDays = Math.min(Math.max(query.days || 3, 1), 14);

    const dateList: string[] = [];
    const baseDay = dayjs.tz(startStr, tz);
    for (let i = 0; i < numDays; i++) {
      dateList.push(baseDay.add(i, "day").format("YYYY-MM-DD"));
    }

    const filter: Record<string, unknown> = {
      mealDate: { $in: dateList },
    };
    if (targetHostelId) {
      filter["hostelId"] = targetHostelId;
    }

    return Menu.find(filter).sort({ mealDate: 1, mealType: 1 });
  }

  // ---------------------------------------------------------------------------
  // 8.2 Meal Selections
  // ---------------------------------------------------------------------------

  public static async selectMeal(
    studentUser: AuthenticatedUser,
    input: SelectMealInput,
    ipAddress?: string,
    userAgent?: string
  ): Promise<IMealSelection> {
    // 1. Check cutoff
    if (isCutoffPassed(input.mealDate)) {
      throw new AppError(
        HttpStatus.UNPROCESSABLE_ENTITY,
        "CUTOFF_TIME_PASSED",
        `Daily cutoff time of ${env.DEFAULT_LUNCH_CUTOFF_TIME} AM (${env.HOSTEL_TIMEZONE}) has passed for meal date ${input.mealDate}.`
      );
    }

    // 2. Resolve hostelId
    const hostelId = await resolveStudentHostelId(studentUser.id, input.hostelId);

    // 3. Atomically upsert selection record
    const selection = await MealSelection.findOneAndUpdate(
      {
        studentId: new mongoose.Types.ObjectId(studentUser.id),
        mealDate: input.mealDate,
        mealType: "LUNCH",
      },
      {
        $set: {
          hostelId,
          selection: input.selection as MealSelectionChoice,
          isDefault: false,
          selectionTimestamp: new Date(),
          cutoffPassed: false,
        },
        $setOnInsert: {
          isOverridden: false,
        },
      },
      { new: true, upsert: true, runValidators: true }
    );

    await AuditLog.create({
      actorId: new mongoose.Types.ObjectId(studentUser.id),
      actorRole: studentUser.role,
      action: "MEAL_SELECTION_UPDATED",
      targetCollection: "mealselections",
      targetDocumentId: selection._id,
      newState: {
        mealDate: input.mealDate,
        selection: input.selection,
        isDefault: false,
      },
      ipAddress: ipAddress ?? null,
      userAgent: userAgent ?? null,
      timestamp: new Date(),
    });

    return selection;
  }

  public static async getMySelection(
    studentUser: AuthenticatedUser,
    mealDate?: string
  ): Promise<any> {
    const tz = env.HOSTEL_TIMEZONE;
    const targetDate = mealDate || dayjs().tz(tz).format("YYYY-MM-DD");

    const record = await MealSelection.findOne({
      studentId: new mongoose.Types.ObjectId(studentUser.id),
      mealDate: targetDate,
      mealType: "LUNCH",
    });

    if (record) {
      return record;
    }

    // Default to DINE_IN when no selection exists
    return {
      studentId: studentUser.id,
      mealDate: targetDate,
      mealType: "LUNCH",
      selection: MealSelectionChoice.DINE_IN,
      isDefault: true,
      cutoffPassed: isCutoffPassed(targetDate),
      selectionTimestamp: null,
      isOverridden: false,
    };
  }

  public static async overrideSelection(
    adminUser: AuthenticatedUser,
    input: OverrideSelectionInput,
    ipAddress?: string,
    userAgent?: string
  ): Promise<IMealSelection> {
    const student = await User.findById(input.studentId);
    if (!student || student.role !== UserRole.STUDENT) {
      throw new AppError(HttpStatus.NOT_FOUND, "STUDENT_NOT_FOUND", "Student not found.");
    }

    const hostelId = await resolveStudentHostelId(input.studentId, input.hostelId);

    const existing = await MealSelection.findOne({
      studentId: new mongoose.Types.ObjectId(input.studentId),
      mealDate: input.mealDate,
      mealType: "LUNCH",
    });

    const previousSelection = existing ? existing.selection : MealSelectionChoice.DINE_IN;

    const selection = await MealSelection.findOneAndUpdate(
      {
        studentId: new mongoose.Types.ObjectId(input.studentId),
        mealDate: input.mealDate,
        mealType: "LUNCH",
      },
      {
        $set: {
          hostelId,
          selection: input.newSelection as MealSelectionChoice,
          isDefault: false,
          isOverridden: true,
          overriddenByAdminId: new mongoose.Types.ObjectId(adminUser.id),
          overrideReason: input.overrideReason,
          overrideTimestamp: new Date(),
          previousSelection,
        },
      },
      { new: true, upsert: true, runValidators: true }
    );

    await AuditLog.create({
      actorId: new mongoose.Types.ObjectId(adminUser.id),
      actorRole: adminUser.role,
      action: "MEAL_SELECTION_OVERRIDDEN",
      targetCollection: "mealselections",
      targetDocumentId: selection._id,
      previousState: { selection: previousSelection },
      newState: {
        selection: input.newSelection,
        isOverridden: true,
        overrideReason: input.overrideReason,
        targetStudentId: input.studentId,
        mealDate: input.mealDate,
      },
      ipAddress: ipAddress ?? null,
      userAgent: userAgent ?? null,
      timestamp: new Date(),
    });

    return selection;
  }

  // ---------------------------------------------------------------------------
  // 8.3 Daily Kitchen Preparation & Tiffin Dispatch Roster
  // ---------------------------------------------------------------------------

  public static async getDailyKitchenReport(
    hostelId: string,
    mealDate: string
  ): Promise<{
    mealDate: string;
    hostelId: string;
    totalResidents: number;
    confirmedDineInCount: number;
    confirmedTiffinCount: number;
    explicitSelections: number;
    defaultSelections: number;
    tiffinRoster: Array<{
      studentId: string;
      name: string;
      room: string;
      phone: string;
      isOverridden: boolean;
      overrideReason?: string | null;
    }>;
  }> {
    const hostel = await Hostel.findById(hostelId);
    if (!hostel) {
      throw new AppError(HttpStatus.NOT_FOUND, "HOSTEL_NOT_FOUND", "Hostel not found.");
    }

    const hid = new mongoose.Types.ObjectId(hostelId);

    // 1. Fetch active residents in this hostel
    const allocations = await BedAllocation.find({
      hostelId: hid,
      status: "ACTIVE",
    })
      .populate("studentId", "email studentId")
      .populate("roomId", "roomNumber")
      .populate("bedId", "bedCode");

    const totalResidents = allocations.length;

    // 2. Fetch explicit meal selections recorded for this hostel and date
    const selections = await MealSelection.find({
      hostelId: hid,
      mealDate,
      mealType: "LUNCH",
    });

    const selectionMap = new Map<string, IMealSelection>();
    for (const sel of selections) {
      selectionMap.set(sel.studentId.toString(), sel);
    }

    let explicitTiffinCount = 0;
    let explicitDineInCount = 0;
    const tiffinStudentIds: string[] = [];

    for (const sel of selections) {
      if (sel.selection === MealSelectionChoice.TIFFIN) {
        explicitTiffinCount++;
        tiffinStudentIds.push(sel.studentId.toString());
      } else {
        explicitDineInCount++;
      }
    }

    const explicitSelections = selections.length;
    const defaultSelections = Math.max(0, totalResidents - explicitSelections);
    const confirmedDineInCount = explicitDineInCount + defaultSelections;
    const confirmedTiffinCount = explicitTiffinCount;

    // 3. Build detailed tiffin roster for dispatch
    const tiffinProfiles = await StudentProfile.find({
      userId: { $in: tiffinStudentIds.map((id) => new mongoose.Types.ObjectId(id)) },
    });

    const profileMap = new Map<string, any>();
    for (const p of tiffinProfiles) {
      profileMap.set(p.userId.toString(), p);
    }

    const allocationMap = new Map<string, any>();
    for (const a of allocations) {
      allocationMap.set(a.studentId?._id?.toString() || a.studentId?.toString(), a);
    }

    const tiffinRoster = tiffinStudentIds.map((studentUserId) => {
      const sel = selectionMap.get(studentUserId);
      const alloc = allocationMap.get(studentUserId);
      const prof = profileMap.get(studentUserId);

      const studentUser = alloc?.studentId as any;
      const room = alloc?.roomId ? `${alloc.roomId.roomNumber}-${alloc.bedId?.bedCode || "1"}` : "Unassigned";

      return {
        studentId: studentUser?.studentId || "N/A",
        name: prof?.fullName || studentUser?.email?.split("@")[0] || "Resident",
        room,
        phone: prof?.registeredPhone || "N/A",
        isOverridden: sel?.isOverridden || false,
        overrideReason: sel?.overrideReason || null,
      };
    });

    return {
      mealDate,
      hostelId,
      totalResidents,
      confirmedDineInCount,
      confirmedTiffinCount,
      explicitSelections,
      defaultSelections,
      tiffinRoster,
    };
  }

  // ---------------------------------------------------------------------------
  // 8.4 Food Feedback
  // ---------------------------------------------------------------------------

  public static async submitFeedback(
    studentUser: AuthenticatedUser,
    input: SubmitFeedbackInput,
    ipAddress?: string,
    userAgent?: string
  ): Promise<IFoodFeedback> {
    const hostelId = await resolveStudentHostelId(studentUser.id, input.hostelId);

    const feedback = await FoodFeedback.findOneAndUpdate(
      {
        studentId: new mongoose.Types.ObjectId(studentUser.id),
        mealDate: input.mealDate,
        mealType: input.mealType as MealType,
      },
      {
        $set: {
          hostelId,
          date: new Date(),
          rating: input.rating,
          tasteRating: input.tasteRating ?? null,
          hygieneRating: input.hygieneRating ?? null,
          comments: input.comments ?? null,
        },
      },
      { new: true, upsert: true, runValidators: true }
    );

    await AuditLog.create({
      actorId: new mongoose.Types.ObjectId(studentUser.id),
      actorRole: studentUser.role,
      action: "FEEDBACK_SUBMITTED",
      targetCollection: "foodfeedbacks",
      targetDocumentId: feedback._id,
      newState: {
        mealDate: input.mealDate,
        mealType: input.mealType,
        rating: input.rating,
      },
      ipAddress: ipAddress ?? null,
      userAgent: userAgent ?? null,
      timestamp: new Date(),
    });

    return feedback;
  }

  public static async listFeedback(
    requestingUser: AuthenticatedUser,
    query: {
      hostelId?: string;
      mealDate?: string;
      mealType?: string;
      startDate?: string;
      endDate?: string;
    }
  ): Promise<{
    feedbacks: IFoodFeedback[];
    summary: {
      totalReviews: number;
      averageRating: number;
      averageTaste: number | null;
      averageHygiene: number | null;
    };
  }> {
    const filter: Record<string, unknown> = {};

    if (requestingUser.role === UserRole.STUDENT) {
      filter["studentId"] = new mongoose.Types.ObjectId(requestingUser.id);
    } else if (query.hostelId) {
      filter["hostelId"] = new mongoose.Types.ObjectId(query.hostelId);
    }

    if (query.mealDate) filter["mealDate"] = query.mealDate;
    if (query.mealType) filter["mealType"] = query.mealType;
    if (query.startDate && query.endDate) {
      filter["mealDate"] = { $gte: query.startDate, $lte: query.endDate };
    }

    const feedbacks = await FoodFeedback.find(filter).sort({ date: -1 });

    const totalReviews = feedbacks.length;
    let avgRating = 0;
    let avgTaste: number | null = null;
    let avgHygiene: number | null = null;

    if (totalReviews > 0) {
      avgRating = Number((feedbacks.reduce((sum, f) => sum + f.rating, 0) / totalReviews).toFixed(2));

      const tasteList = feedbacks.filter((f) => f.tasteRating != null);
      if (tasteList.length > 0) {
        avgTaste = Number((tasteList.reduce((sum, f) => sum + f.tasteRating!, 0) / tasteList.length).toFixed(2));
      }

      const hygieneList = feedbacks.filter((f) => f.hygieneRating != null);
      if (hygieneList.length > 0) {
        avgHygiene = Number((hygieneList.reduce((sum, f) => sum + f.hygieneRating!, 0) / hygieneList.length).toFixed(2));
      }
    }

    return {
      feedbacks,
      summary: {
        totalReviews,
        averageRating: avgRating,
        averageTaste: avgTaste,
        averageHygiene: avgHygiene,
      },
    };
  }
}
