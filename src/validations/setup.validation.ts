import { z } from "zod";

export const initialAdminSetupSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: "Email is required" })
      .email("Invalid email format")
      .toLowerCase()
      .trim(),
    password: z
      .string({ required_error: "Password is required" })
      .min(8, "Password must be at least 8 characters long")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one digit")
      .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
    fullName: z
      .string({ required_error: "Full name is required" })
      .min(2, "Full name must be at least 2 characters long")
      .trim(),
    setupSecret: z
      .string({ required_error: "Setup secret is required" })
      .min(1, "Setup secret cannot be empty"),
  }),
});

export type InitialAdminSetupInput = z.infer<typeof initialAdminSetupSchema>["body"];
