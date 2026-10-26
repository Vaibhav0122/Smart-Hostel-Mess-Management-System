import { z } from "zod";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;
const phoneRegex = /^[6-9]\d{9}$/;

// ---------------------------------------------------------------------------
// Hostel Schemas
// ---------------------------------------------------------------------------
export const createHostelBodySchema = z.object({
  name: z
    .string({ required_error: "Hostel name is required." })
    .trim()
    .min(2, "Hostel name must be at least 2 characters.")
    .max(100, "Hostel name must not exceed 100 characters."),
  code: z
    .string({ required_error: "Hostel code is required." })
    .trim()
    .min(2, "Hostel code must be at least 2 characters.")
    .max(20, "Hostel code must not exceed 20 characters.")
    .toUpperCase(),
  genderType: z.enum(["MALE", "FEMALE", "CO_ED"], {
    required_error: "Gender type must be MALE, FEMALE, or CO_ED.",
  }),
  wardenInChargeId: z
    .string()
    .regex(objectIdRegex, "Invalid warden user ID format.")
    .optional()
    .nullable(),
  contactPhone: z
    .string()
    .trim()
    .regex(phoneRegex, "Contact phone must be a valid 10-digit Indian number.")
    .optional()
    .nullable(),
  contactEmail: z.string().trim().email("Invalid contact email format.").optional().nullable(),
  address: z
    .object({
      street: z.string().trim().optional(),
      city: z.string().trim().optional(),
      state: z.string().trim().optional(),
      postalCode: z.string().trim().optional(),
    })
    .optional(),
  amenities: z.array(z.string().trim()).optional(),
  isActive: z.boolean().optional(),
});

export const updateHostelBodySchema = createHostelBodySchema.partial();

export const createHostelSchema = z.object({
  body: createHostelBodySchema.strict(),
});

export const updateHostelSchema = z.object({
  body: updateHostelBodySchema.strict(),
});

// ---------------------------------------------------------------------------
// Building Schemas
// ---------------------------------------------------------------------------
export const createBuildingBodySchema = z.object({
  hostelId: z
    .string({ required_error: "Hostel ID is required." })
    .regex(objectIdRegex, "Invalid hostel ID format."),
  name: z
    .string({ required_error: "Building name is required." })
    .trim()
    .min(1, "Building name is required.")
    .max(100, "Building name must not exceed 100 characters."),
  totalFloors: z
    .number({ required_error: "Total floors is required." })
    .int("Total floors must be an integer.")
    .min(1, "Total floors must be at least 1."),
  status: z.enum(["ACTIVE", "UNDER_RENOVATION", "INACTIVE"]).optional(),
});

export const updateBuildingBodySchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  totalFloors: z.number().int().min(1).optional(),
  status: z.enum(["ACTIVE", "UNDER_RENOVATION", "INACTIVE"]).optional(),
});

export const createBuildingSchema = z.object({
  body: createBuildingBodySchema.strict(),
});

export const updateBuildingSchema = z.object({
  body: updateBuildingBodySchema.strict(),
});

// ---------------------------------------------------------------------------
// Room Schemas
// ---------------------------------------------------------------------------
export const createRoomBodySchema = z.object({
  hostelId: z
    .string({ required_error: "Hostel ID is required." })
    .regex(objectIdRegex, "Invalid hostel ID format."),
  buildingId: z
    .string({ required_error: "Building ID is required." })
    .regex(objectIdRegex, "Invalid building ID format."),
  roomNumber: z
    .string({ required_error: "Room number is required." })
    .trim()
    .min(1, "Room number is required.")
    .max(20, "Room number must not exceed 20 characters."),
  floor: z
    .number({ required_error: "Floor number is required." })
    .int("Floor must be an integer."),
  roomType: z.enum(["SINGLE", "DOUBLE", "TRIPLE", "FOUR_BED"], {
    required_error: "Room type must be SINGLE, DOUBLE, TRIPLE, or FOUR_BED.",
  }),
  baseMonthlyRent: z
    .number({ required_error: "Base monthly rent is required." })
    .min(0, "Rent cannot be negative."),
  status: z.enum(["AVAILABLE", "FULL", "UNDER_MAINTENANCE", "DECOMMISSIONED"]).optional(),
  maintenanceReason: z.string().trim().optional().nullable(),
});

export const updateRoomBodySchema = z.object({
  roomNumber: z.string().trim().min(1).max(20).optional(),
  floor: z.number().int().optional(),
  baseMonthlyRent: z.number().min(0).optional(),
  status: z.enum(["AVAILABLE", "FULL", "UNDER_MAINTENANCE", "DECOMMISSIONED"]).optional(),
  maintenanceReason: z.string().trim().optional().nullable(),
});

export const createRoomSchema = z.object({
  body: createRoomBodySchema.strict(),
});

export const updateRoomSchema = z.object({
  body: updateRoomBodySchema.strict(),
});

// ---------------------------------------------------------------------------
// Bed Schemas
// ---------------------------------------------------------------------------
export const updateBedBodySchema = z.object({
  status: z.enum(["VACANT", "OCCUPIED", "UNDER_MAINTENANCE", "BLOCKED"], {
    required_error: "Bed status is required.",
  }),
});

export const updateBedSchema = z.object({
  body: updateBedBodySchema.strict(),
});

// ---------------------------------------------------------------------------
// Allocation Schemas
// ---------------------------------------------------------------------------
export const allocateBedBodySchema = z.object({
  studentId: z
    .string({ required_error: "Student ID is required." })
    .regex(objectIdRegex, "Invalid student ID format."),
  bedId: z
    .string({ required_error: "Bed ID is required." })
    .regex(objectIdRegex, "Invalid bed ID format."),
  startDate: z
    .string()
    .optional()
    .transform((val) => (val ? new Date(val) : new Date())),
  remarks: z.string().trim().optional().nullable(),
});

export const transferBedBodySchema = z.object({
  currentAllocationId: z
    .string({ required_error: "Current allocation ID is required." })
    .regex(objectIdRegex, "Invalid allocation ID format."),
  targetBedId: z
    .string({ required_error: "Target bed ID is required." })
    .regex(objectIdRegex, "Invalid target bed ID format."),
  transferReason: z.string().trim().optional().nullable(),
});

export const checkoutBedBodySchema = z.object({
  allocationId: z
    .string({ required_error: "Allocation ID is required." })
    .regex(objectIdRegex, "Invalid allocation ID format."),
  remarks: z.string().trim().optional().nullable(),
});

export const allocateBedSchema = z.object({
  body: allocateBedBodySchema.strict(),
});

export const transferBedSchema = z.object({
  body: transferBedBodySchema.strict(),
});

export const checkoutBedSchema = z.object({
  body: checkoutBedBodySchema.strict(),
});

export type CreateHostelInput = z.infer<typeof createHostelBodySchema>;
export type UpdateHostelInput = z.infer<typeof updateHostelBodySchema>;
export type CreateBuildingInput = z.infer<typeof createBuildingBodySchema>;
export type UpdateBuildingInput = z.infer<typeof updateBuildingBodySchema>;
export type CreateRoomInput = z.infer<typeof createRoomBodySchema>;
export type UpdateRoomInput = z.infer<typeof updateRoomBodySchema>;
export type AllocateBedInput = z.infer<typeof allocateBedBodySchema>;
export type TransferBedInput = z.infer<typeof transferBedBodySchema>;
export type CheckoutBedInput = z.infer<typeof checkoutBedBodySchema>;
