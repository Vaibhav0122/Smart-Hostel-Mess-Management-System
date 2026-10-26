import { z } from "zod";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const createContractBodySchema = z
  .object({
    studentId: z
      .string({ required_error: "Student ID is required." })
      .regex(objectIdRegex, "Invalid student user ID format."),
    hostelId: z
      .string({ required_error: "Hostel ID is required." })
      .regex(objectIdRegex, "Invalid hostel ID format."),
    roomId: z.string().regex(objectIdRegex, "Invalid room ID format.").optional().nullable(),
    bedId: z.string().regex(objectIdRegex, "Invalid bed ID format.").optional().nullable(),
    startDate: z.string({ required_error: "Start date is required." }),
    endDate: z.string({ required_error: "End date is required." }),
    tenureMonths: z
      .number({ required_error: "Tenure in months is required." })
      .int()
      .min(1, "Tenure must be at least 1 month."),
    lockInUntilDate: z.string({ required_error: "Lock-in date is required." }),
    noticePeriodDays: z.number().int().min(0).optional().default(30),
    monthlyRentAmount: z
      .number({ required_error: "Monthly rent amount is required." })
      .min(0, "Rent amount cannot be negative."),
    securityDepositAmount: z
      .number({ required_error: "Security deposit amount is required." })
      .min(0, "Deposit amount cannot be negative."),
    includedServices: z.array(z.string().trim()).optional(),
    status: z.enum(["DRAFT", "ACTIVE"]).optional().default("DRAFT"),
  })
  .refine(
    (data) => new Date(data.endDate) > new Date(data.startDate),
    {
      message: "End date must be strictly after start date.",
      path: ["endDate"],
    }
  )
  .refine(
    (data) =>
      new Date(data.lockInUntilDate) >= new Date(data.startDate) &&
      new Date(data.lockInUntilDate) <= new Date(data.endDate),
    {
      message: "Lock-in date must fall between start date and end date.",
      path: ["lockInUntilDate"],
    }
  );

export const updateContractBodySchema = z.object({
  roomId: z.string().regex(objectIdRegex).optional().nullable(),
  bedId: z.string().regex(objectIdRegex).optional().nullable(),
  noticePeriodDays: z.number().int().min(0).optional(),
  monthlyRentAmount: z.number().min(0).optional(),
  securityDepositAmount: z.number().min(0).optional(),
  includedServices: z.array(z.string().trim()).optional(),
  status: z
    .enum(["DRAFT", "ACTIVE", "EXIT_REQUESTED", "EXIT_APPROVED", "COMPLETED", "TERMINATED"])
    .optional(),
});

export const exitRequestBodySchema = z.object({
  requestedExitDate: z.string({ required_error: "Requested exit date is required." }),
  reason: z
    .string({ required_error: "Reason for exit is required." })
    .trim()
    .min(3, "Reason must be at least 3 characters.")
    .max(500, "Reason must not exceed 500 characters."),
});

export const approveExitBodySchema = z.object({
  adminRemarks: z.string().trim().optional().nullable(),
  earlyExitPenaltyAmount: z.number().min(0).optional().default(0),
});

export const createContractSchema = z.object({
  body: createContractBodySchema,
});

export const updateContractSchema = z.object({
  body: updateContractBodySchema.strict(),
});

export const exitRequestSchema = z.object({
  body: exitRequestBodySchema.strict(),
});

export const approveExitSchema = z.object({
  body: approveExitBodySchema.strict(),
});

export type CreateContractInput = z.infer<typeof createContractBodySchema>;
export type UpdateContractInput = z.infer<typeof updateContractBodySchema>;
export type ExitRequestInput = z.infer<typeof exitRequestBodySchema>;
export type ApproveExitInput = z.infer<typeof approveExitBodySchema>;
