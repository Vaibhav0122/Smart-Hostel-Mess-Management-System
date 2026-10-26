import { z } from "zod";
import mongoose from "mongoose";

const objectIdString = z
  .string()
  .refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: "Invalid ObjectId format",
  });

const dateStringRegex = /^\d{4}-\d{2}-\d{2}$/;

// ---------------------------------------------------------------------------
// 8.1 Menu Schemas
// ---------------------------------------------------------------------------

export const createMenuBodySchema = z
  .object({
    hostelId: objectIdString,
    mealDate: z
      .string({ required_error: "mealDate is required." })
      .regex(dateStringRegex, "mealDate must be in YYYY-MM-DD format."),
    mealType: z.enum(["BREAKFAST", "LUNCH", "SNACKS", "DINNER"], {
      required_error: "mealType must be BREAKFAST, LUNCH, SNACKS, or DINNER.",
    }),
    title: z
      .string({ required_error: "title is required." })
      .trim()
      .min(2, "title must be at least 2 characters.")
      .max(200, "title cannot exceed 200 characters."),
    items: z
      .array(z.string().trim().min(1, "Menu item cannot be empty."))
      .min(1, "Menu must contain at least one item."),
    isSpecialMeal: z.boolean().optional().default(false),
    dietaryTags: z.array(z.string().trim()).optional().default([]),
  })
  .strict();

export const updateMenuBodySchema = z
  .object({
    title: z.string().trim().min(2).max(200).optional(),
    items: z.array(z.string().trim().min(1)).min(1).optional(),
    isSpecialMeal: z.boolean().optional(),
    dietaryTags: z.array(z.string().trim()).optional(),
  })
  .strict();

export const createMenuSchema = z.object({
  body: createMenuBodySchema,
});

export const updateMenuSchema = z.object({
  body: updateMenuBodySchema,
});

export const getMenuQuerySchema = z.object({
  query: z
    .object({
      hostelId: objectIdString.optional(),
      startDate: z.string().regex(dateStringRegex).optional(),
      days: z
        .string()
        .optional()
        .transform((val) => (val ? parseInt(val, 10) : 3))
        .refine((num) => num >= 1 && num <= 14, {
          message: "days must be between 1 and 14.",
        }),
    })
    .optional(),
});

export type CreateMenuInput = z.infer<typeof createMenuBodySchema>;
export type UpdateMenuInput = z.infer<typeof updateMenuBodySchema>;

// ---------------------------------------------------------------------------
// 8.2 Meal Selection Schemas
// ---------------------------------------------------------------------------

export const selectMealBodySchema = z
  .object({
    mealDate: z
      .string({ required_error: "mealDate is required." })
      .regex(dateStringRegex, "mealDate must be in YYYY-MM-DD format."),
    selection: z.enum(["DINE_IN", "TIFFIN"], {
      required_error: "selection must be DINE_IN or TIFFIN.",
    }),
    hostelId: objectIdString.optional(),
  })
  .strict();

export const selectMealSchema = z.object({
  body: selectMealBodySchema,
});

export const overrideSelectionBodySchema = z
  .object({
    studentId: objectIdString,
    mealDate: z
      .string({ required_error: "mealDate is required." })
      .regex(dateStringRegex, "mealDate must be in YYYY-MM-DD format."),
    newSelection: z.enum(["DINE_IN", "TIFFIN"], {
      required_error: "newSelection must be DINE_IN or TIFFIN.",
    }),
    overrideReason: z
      .string({ required_error: "overrideReason is required." })
      .trim()
      .min(3, "overrideReason must be at least 3 characters.")
      .max(500, "overrideReason cannot exceed 500 characters."),
    hostelId: objectIdString.optional(),
  })
  .strict();

export const overrideSelectionSchema = z.object({
  body: overrideSelectionBodySchema,
});

export type SelectMealInput = z.infer<typeof selectMealBodySchema>;
export type OverrideSelectionInput = z.infer<typeof overrideSelectionBodySchema>;

// ---------------------------------------------------------------------------
// 8.3 Kitchen Roster & Report Query Schema
// ---------------------------------------------------------------------------

export const kitchenRosterQuerySchema = z.object({
  query: z.object({
    hostelId: objectIdString,
    mealDate: z
      .string({ required_error: "mealDate query parameter is required." })
      .regex(dateStringRegex, "mealDate must be in YYYY-MM-DD format."),
  }),
});

// ---------------------------------------------------------------------------
// 8.4 Food Feedback Schemas
// ---------------------------------------------------------------------------

export const submitFeedbackBodySchema = z
  .object({
    hostelId: objectIdString.optional(),
    mealDate: z
      .string({ required_error: "mealDate is required." })
      .regex(dateStringRegex, "mealDate must be in YYYY-MM-DD format."),
    mealType: z.enum(["BREAKFAST", "LUNCH", "SNACKS", "DINNER"], {
      required_error: "mealType must be BREAKFAST, LUNCH, SNACKS, or DINNER.",
    }),
    rating: z
      .number({ required_error: "rating is required." })
      .int()
      .min(1, "Rating must be at least 1.")
      .max(5, "Rating cannot exceed 5."),
    tasteRating: z.number().int().min(1).max(5).optional(),
    hygieneRating: z.number().int().min(1).max(5).optional(),
    comments: z.string().trim().max(1000, "Comments cannot exceed 1000 characters.").optional().nullable(),
  })
  .strict();

export const submitFeedbackSchema = z.object({
  body: submitFeedbackBodySchema,
});

export type SubmitFeedbackInput = z.infer<typeof submitFeedbackBodySchema>;
