import { z } from "zod";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;
const phoneRegex = /^[6-9]\d{9}$/;

// ---------------------------------------------------------------------------
// Profile Schemas
// ---------------------------------------------------------------------------

const addressSchema = z.object({
  street: z.string().trim().optional(),
  city: z.string().trim().optional(),
  state: z.string().trim().optional(),
  postalCode: z.string().trim().optional(),
  country: z.string().trim().optional(),
});

const emergencyContactSchema = z.object({
  name: z.string({ required_error: "Emergency contact name is required." }).trim().min(2),
  relationship: z.string({ required_error: "Relationship is required." }).trim().min(1),
  phone: z
    .string({ required_error: "Emergency contact phone is required." })
    .trim()
    .regex(phoneRegex, "Emergency phone must be a valid 10-digit Indian number."),
  email: z.string().trim().email("Invalid emergency contact email.").optional().nullable(),
});

const academicInfoSchema = z.object({
  rollNumber: z.string().trim().optional(),
  course: z.string().trim().optional(),
  branch: z.string().trim().optional(),
  yearOfStudy: z.number().int().min(1).max(6).optional(),
});

const bankDetailsSchema = z.object({
  accountHolderName: z.string().trim().optional(),
  accountNumber: z.string().trim().min(6).max(30).optional(),
  ifscCode: z.string().trim().toUpperCase().optional(),
  bankName: z.string().trim().optional(),
});

// Admin creates or manages full student profile
export const createProfileBodySchema = z.object({
  userId: z
    .string({ required_error: "User ID is required." })
    .regex(objectIdRegex, "Invalid user ID format."),
  fullName: z
    .string({ required_error: "Full name is required." })
    .trim()
    .min(2, "Full name must be at least 2 characters.")
    .max(100),
  registeredPhone: z
    .string({ required_error: "Registered phone is required." })
    .trim()
    .regex(phoneRegex, "Registered phone must be a valid 10-digit Indian number starting with 6-9."),
  alternatePhone: z.string().trim().regex(phoneRegex).optional().nullable(),
  dateOfBirth: z.string().optional().nullable(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional().nullable(),
  bloodGroup: z
    .enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "UNKNOWN"])
    .optional(),
  dietaryPreference: z
    .enum(["VEGETARIAN", "NON_VEGETARIAN", "EGGITARIAN", "VEGAN"])
    .optional(),
  academicInfo: academicInfoSchema.optional(),
  addresses: z
    .object({
      permanent: addressSchema.optional(),
      current: addressSchema.optional(),
    })
    .optional(),
  emergencyContact: emergencyContactSchema,
  bankDetails: bankDetailsSchema.optional(),
});

export const updateProfileBodySchema = createProfileBodySchema.partial();

// Student self-service updates: allowed ONLY personal/contact/bank fields
export const updateOwnProfileBodySchema = z
  .object({
    alternatePhone: z
      .string()
      .trim()
      .regex(phoneRegex, "Phone must be a valid 10-digit number.")
      .optional()
      .nullable(),
    bloodGroup: z
      .enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "UNKNOWN"])
      .optional(),
    dietaryPreference: z
      .enum(["VEGETARIAN", "NON_VEGETARIAN", "EGGITARIAN", "VEGAN"])
      .optional(),
    addresses: z
      .object({
        permanent: addressSchema.optional(),
        current: addressSchema.optional(),
      })
      .optional(),
    emergencyContact: emergencyContactSchema.optional(),
    bankDetails: bankDetailsSchema.optional(),
  })
  .strict();

export const uploadKycBodySchema = z.object({
  documentType: z.enum(["AADHAAR", "PAN", "COLLEGE_ID", "PASSPORT"], {
    required_error: "Document type is required.",
  }),
  idNumber: z
    .string({ required_error: "ID number is required." })
    .trim()
    .min(4, "ID number must be at least 4 characters.")
    .max(50),
});

export const createProfileSchema = z.object({
  body: createProfileBodySchema.strict(),
});

export const updateProfileSchema = z.object({
  body: updateProfileBodySchema.strict(),
});

export const updateOwnProfileSchema = z.object({
  body: updateOwnProfileBodySchema,
});

export const uploadKycSchema = z.object({
  body: uploadKycBodySchema,
});

export type CreateProfileInput = z.infer<typeof createProfileBodySchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileBodySchema>;
export type UpdateOwnProfileInput = z.infer<typeof updateOwnProfileBodySchema>;
export type UploadKycInput = z.infer<typeof uploadKycBodySchema>;
