import dotenv from "dotenv";
import { z } from "zod";

// Load environment variables from .env file
dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.string().default("5000").transform((val) => parseInt(val, 10)),
  API_PREFIX: z.string().default("/api/v1"),
  CLIENT_ORIGIN: z.string().default("http://localhost:5173"),

  // Database
  MONGODB_URI: z.string().default("mongodb://127.0.0.1:27017/smart_hostel_db"),

  // Admin Setup
  ADMIN_SETUP_SECRET: z.string().min(16, "ADMIN_SETUP_SECRET must be at least 16 characters"),

  // JWT
  JWT_ACCESS_SECRET: z.string().min(16).default("dev_jwt_access_secret_smart_hostel_super_secure_32_chars"),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_SECRET: z.string().min(16).default("dev_jwt_refresh_secret_smart_hostel_super_secure_32_chars"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),

  // Activation & Security
  ACTIVATION_TOKEN_TTL_HOURS: z.string().default("72").transform((val) => parseInt(val, 10)),
  HASH_ALGORITHM: z.enum(["bcrypt", "argon2id"]).default("bcrypt"),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().default("900000").transform((val) => parseInt(val, 10)),
  RATE_LIMIT_MAX_REQUESTS: z.string().default("100").transform((val) => parseInt(val, 10)),
  AUTH_RATE_LIMIT_MAX_REQUESTS: z.string().default("5").transform((val) => parseInt(val, 10)),

  // Uploads
  STORAGE_DRIVER: z.enum(["local", "s3"]).default("local"),
  LOCAL_UPLOAD_DIR: z.string().default("./uploads"),
  MAX_FILE_SIZE_BYTES: z.string().default("5242880").transform((val) => parseInt(val, 10)),

  // Email
  EMAIL_PROVIDER: z.enum(["development_log", "smtp", "sendgrid"]).default("development_log"),
  EMAIL_FROM_ADDRESS: z.string().default("noreply@smarthostel.internal"),
  EMAIL_FROM_NAME: z.string().default("Smart Hostel Administration"),

  // Dining & Operations
  DEFAULT_LUNCH_CUTOFF_TIME: z.string().default("09:30"),
  HOSTEL_TIMEZONE: z.string().default("Asia/Kolkata"),
});

const parseResult = envSchema.safeParse(process.env);

if (!parseResult.success) {
  console.error("❌ Invalid environment variables configuration:");
  console.error(parseResult.error.format());
  process.exit(1);
}

export const env = parseResult.data;
