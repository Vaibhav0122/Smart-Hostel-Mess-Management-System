import { z } from "zod";
import mongoose from "mongoose";

const objectIdString = z
  .string()
  .refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: "Invalid ObjectId format",
  });

const dateStringRegex = /^\d{4}-\d{2}-\d{2}$/;

export const studentReportQuerySchema = z.object({
  query: z
    .object({
      hostelId: objectIdString.optional(),
      status: z.enum(["ACTIVE", "PENDING_ACTIVATION", "SUSPENDED", "DEACTIVATED"]).optional(),
      search: z.string().trim().optional(),
      page: z
        .string()
        .optional()
        .transform((val) => (val ? Math.max(1, parseInt(val, 10)) : 1)),
      limit: z
        .string()
        .optional()
        .transform((val) => (val ? Math.min(100, Math.max(1, parseInt(val, 10))) : 20)),
    })
    .strict(),
});

export const occupancyReportQuerySchema = z.object({
  query: z
    .object({
      hostelId: objectIdString.optional(),
    })
    .strict(),
});

export const financeReportQuerySchema = z.object({
  query: z
    .object({
      hostelId: objectIdString.optional(),
      startDate: z.string().regex(dateStringRegex, "startDate must be YYYY-MM-DD").optional(),
      endDate: z.string().regex(dateStringRegex, "endDate must be YYYY-MM-DD").optional(),
    })
    .strict(),
});

export const messReportQuerySchema = z.object({
  query: z
    .object({
      hostelId: objectIdString.optional(),
      startDate: z.string().regex(dateStringRegex, "startDate must be YYYY-MM-DD").optional(),
      endDate: z.string().regex(dateStringRegex, "endDate must be YYYY-MM-DD").optional(),
    })
    .strict(),
});

export const exportReportQuerySchema = z.object({
  query: z
    .object({
      type: z.enum(["students", "occupancy", "finances", "mess"], {
        required_error: "Report type is required (students, occupancy, finances, mess)",
      }),
      hostelId: objectIdString.optional(),
      startDate: z.string().regex(dateStringRegex, "startDate must be YYYY-MM-DD").optional(),
      endDate: z.string().regex(dateStringRegex, "endDate must be YYYY-MM-DD").optional(),
    })
    .strict(),
});

export type StudentReportQuery = z.infer<typeof studentReportQuerySchema>["query"];
export type OccupancyReportQuery = z.infer<typeof occupancyReportQuerySchema>["query"];
export type FinanceReportQuery = z.infer<typeof financeReportQuerySchema>["query"];
export type MessReportQuery = z.infer<typeof messReportQuerySchema>["query"];
export type ExportReportQuery = z.infer<typeof exportReportQuerySchema>["query"];
