import { z } from "zod";

// Password policy: min 8 characters, at least 1 uppercase, 1 lowercase, 1 number, 1 special character
export const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+=\-\[\]{}|:;,.])[A-Za-z\d@$!%*?&#^()_+=\-\[\]{}|:;,.]{8,}$/;

export const loginSchema = z.object({
  body: z.object({
    identifier: z
      .string({ required_error: "Identifier (email or student ID) is required." })
      .trim()
      .min(1, "Identifier cannot be empty."),
    password: z
      .string({ required_error: "Password is required." })
      .min(1, "Password cannot be empty."),
  }).strict(),
});

export const activateAccountSchema = z.object({
  body: z.object({
    activationToken: z
      .string({ required_error: "Activation token is required." })
      .trim()
      .min(16, "Activation token is invalid or incomplete."),
    newPassword: z
      .string({ required_error: "New password is required." })
      .min(8, "Password must be at least 8 characters long.")
      .regex(
        passwordRegex,
        "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character."
      ),
  }).strict(),
});

export const refreshTokenSchema = z.object({
  body: z
    .object({
      refreshToken: z.string().optional(),
    })
    .optional(),
});

export const initiateActivationSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: "Student email is required." })
      .email("Must be a valid email address.")
      .trim()
      .toLowerCase(),
    fullName: z
      .string({ required_error: "Student full name is required." })
      .trim()
      .min(2, "Full name must be at least 2 characters long."),
    studentId: z.string().trim().optional(),
  }).strict(),
});

export type LoginInput = z.infer<typeof loginSchema>["body"];
export type ActivateAccountInput = z.infer<typeof activateAccountSchema>["body"];
export type InitiateActivationInput = z.infer<typeof initiateActivationSchema>["body"];
