import { envSchema } from "../config/env";

describe("Environment Variables Schema Validation", () => {
  const validBaseEnv = {
    NODE_ENV: "development",
    PORT: "5000",
    API_PREFIX: "/api/v1",
    CLIENT_ORIGIN: "http://localhost:5173",
    MONGODB_URI: "mongodb://127.0.0.1:27017/smart_hostel_db",
    ADMIN_SETUP_SECRET: "minimum_sixteen_characters_setup_secret_key",
    JWT_ACCESS_SECRET: "jwt_access_secret_longer_than_sixteen_chars",
    JWT_REFRESH_SECRET: "jwt_refresh_secret_longer_than_sixteen_chars",
    ACTIVATION_TOKEN_TTL_HOURS: "72",
    HASH_ALGORITHM: "bcrypt",
    RATE_LIMIT_WINDOW_MS: "900000",
    RATE_LIMIT_MAX_REQUESTS: "100",
    AUTH_RATE_LIMIT_MAX_REQUESTS: "5",
    STORAGE_DRIVER: "local",
    LOCAL_UPLOAD_DIR: "./uploads",
    MAX_FILE_SIZE_BYTES: "5242880",
    EMAIL_PROVIDER: "development_log",
  };

  it("should validate and parse a complete, valid environment configuration", () => {
    const result = envSchema.safeParse(validBaseEnv);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.PORT).toBe(5000);
      expect(result.data.NODE_ENV).toBe("development");
      expect(result.data.ADMIN_SETUP_SECRET).toBe("minimum_sixteen_characters_setup_secret_key");
      expect(result.data.ACTIVATION_TOKEN_TTL_HOURS).toBe(72);
      expect(result.data.RATE_LIMIT_MAX_REQUESTS).toBe(100);
    }
  });

  it("should reject ADMIN_SETUP_SECRET if shorter than 16 characters", () => {
    const invalidEnv = {
      ...validBaseEnv,
      ADMIN_SETUP_SECRET: "short_secret",
    };
    const result = envSchema.safeParse(invalidEnv);
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find(
        (i) => i.path[0] === "ADMIN_SETUP_SECRET"
      );
      expect(issue).toBeDefined();
      expect(issue?.message).toContain("ADMIN_SETUP_SECRET must be at least 16 characters");
    }
  });

  it("should reject invalid NODE_ENV values", () => {
    const invalidEnv = {
      ...validBaseEnv,
      NODE_ENV: "invalid_env_mode",
    };
    const result = envSchema.safeParse(invalidEnv);
    expect(result.success).toBe(false);
  });

  it("should supply sensible defaults when optional keys are omitted", () => {
    const minimalEnv = {
      ADMIN_SETUP_SECRET: "a_valid_secret_with_more_than_sixteen_chars",
    };
    const result = envSchema.safeParse(minimalEnv);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.PORT).toBe(5000);
      expect(result.data.NODE_ENV).toBe("development");
      expect(result.data.API_PREFIX).toBe("/api/v1");
      expect(result.data.STORAGE_DRIVER).toBe("local");
      expect(result.data.EMAIL_PROVIDER).toBe("development_log");
    }
  });
});
