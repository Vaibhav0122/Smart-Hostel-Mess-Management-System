import { z } from "zod";

/**
 * Phase 4: Zod validation schemas for student registration and CSV import.
 *
 * Validates the input payload for POST /api/v1/students and CSV column data.
 * Reuses global password policy from auth.validation.ts for consistency.
 */

// Indian 10-digit phone number regex
const phoneRegex = /^[6-9]\d{9}$/;

// -------------------------------------------------------------------------
// Single Student Registration Schema
// -------------------------------------------------------------------------
export const registerStudentBodySchema = z.object({
  email: z
    .string({ required_error: "Student email is required." })
    .email("Must be a valid email address.")
    .trim()
    .toLowerCase(),
  fullName: z
    .string({ required_error: "Student full name is required." })
    .trim()
    .min(2, "Full name must be at least 2 characters long.")
    .max(100, "Full name must not exceed 100 characters."),
  registeredPhone: z
    .string()
    .trim()
    .regex(phoneRegex, "Must be a valid 10-digit Indian phone number starting with 6-9.")
    .optional(),
  academicInfo: z
    .object({
      rollNumber: z.string().trim().min(1, "Roll number is required.").optional(),
      course: z.string().trim().min(1, "Course is required.").optional(),
      branch: z.string().trim().min(1, "Branch is required.").optional(),
      yearOfStudy: z
        .number()
        .int()
        .min(1, "Year of study must be at least 1.")
        .max(6, "Year of study must not exceed 6.")
        .optional(),
    })
    .optional(),
  emergencyContact: z
    .object({
      name: z.string().trim().min(2, "Emergency contact name is required.").optional(),
      relationship: z.string().trim().optional(),
      phone: z
        .string()
        .trim()
        .regex(phoneRegex, "Emergency phone must be a valid 10-digit Indian number.")
        .optional(),
    })
    .optional(),
});

export const registerStudentSchema = z.object({
  body: registerStudentBodySchema.strict(),
});

export type RegisterStudentInput = z.infer<typeof registerStudentBodySchema>;

// -------------------------------------------------------------------------
// CSV Row Validation Schema (applied per-row during bulk import parsing)
// -------------------------------------------------------------------------

/**
 * Required CSV columns:
 *   email, fullName
 * Optional CSV columns:
 *   registeredPhone, rollNumber, course, branch, yearOfStudy,
 *   emergencyContactName, emergencyRelationship, emergencyPhone
 */
export const csvRowSchema = z.object({
  email: z
    .string({ required_error: "email column is required." })
    .email("Must be a valid email address.")
    .trim()
    .toLowerCase(),
  fullName: z
    .string({ required_error: "fullName column is required." })
    .trim()
    .min(2, "Full name must be at least 2 characters."),
  registeredPhone: z
    .string()
    .trim()
    .regex(phoneRegex, "Must be a valid 10-digit Indian phone number.")
    .optional()
    .or(z.literal("")),
  rollNumber: z.string().trim().optional().or(z.literal("")),
  course: z.string().trim().optional().or(z.literal("")),
  branch: z.string().trim().optional().or(z.literal("")),
  yearOfStudy: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .transform((val) => {
      if (!val || val === "") return undefined;
      const num = parseInt(val, 10);
      if (isNaN(num) || num < 1 || num > 6) return undefined;
      return num;
    }),
  emergencyContactName: z.string().trim().optional().or(z.literal("")),
  emergencyRelationship: z.string().trim().optional().or(z.literal("")),
  emergencyPhone: z
    .string()
    .trim()
    .regex(phoneRegex, "Emergency phone must be a valid 10-digit Indian number.")
    .optional()
    .or(z.literal("")),
});

export type CsvRowInput = z.infer<typeof csvRowSchema>;

// -------------------------------------------------------------------------
// Required CSV column headers (case-insensitive matching done by service)
// -------------------------------------------------------------------------
export const REQUIRED_CSV_COLUMNS = ["email", "fullName"] as const;
export const OPTIONAL_CSV_COLUMNS = [
  "registeredPhone",
  "rollNumber",
  "course",
  "branch",
  "yearOfStudy",
  "emergencyContactName",
  "emergencyRelationship",
  "emergencyPhone",
] as const;

export const ALL_CSV_COLUMNS = [
  ...REQUIRED_CSV_COLUMNS,
  ...OPTIONAL_CSV_COLUMNS,
] as const;
