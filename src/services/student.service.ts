import crypto from "crypto";
import { User, IUser } from "../models/User";
import { AuditLog } from "../models/AuditLog";
import { UserRole, UserStatus } from "../constants/roles";
import { hashPassword } from "../utils/password";
import { generateActivationToken } from "../utils/token";
import { CounterService } from "./counter.service";
import { AppError } from "../errors/AppError";
import { HttpStatus } from "../constants/statusCodes";
import { env } from "../config/env";
import {
  RegisterStudentInput,
  csvRowSchema,
  REQUIRED_CSV_COLUMNS,
} from "../validations/student.validation";
import { parseCsvText } from "../utils/csvParser";
import { AuthenticatedUser } from "../types/express";

// -------------------------------------------------------------------------
// Interfaces
// -------------------------------------------------------------------------

export interface StudentRegistrationResult {
  user: IUser;
  devActivationToken?: string;
}

export interface CsvRowError {
  row: number;
  email?: string;
  errors: Array<{ field: string; message: string }>;
}

export interface CsvImportResult {
  totalRows: number;
  successCount: number;
  errorCount: number;
  created: Array<{
    row: number;
    email: string;
    studentId: string;
  }>;
  errors: CsvRowError[];
  devActivationTokens?: Array<{
    email: string;
    studentId: string;
    activationToken: string;
  }>;
}

// -------------------------------------------------------------------------
// Service
// -------------------------------------------------------------------------

export class StudentService {
  /**
   * Registers a single student account.
   * - Validates email uniqueness.
   * - Generates atomic student ID via CounterService.
   * - Creates account in PENDING_ACTIVATION status with activation token.
   * - Writes audit log.
   */
  public static async registerStudent(
    adminUser: AuthenticatedUser,
    input: RegisterStudentInput,
    ipAddress?: string,
    userAgent?: string
  ): Promise<StudentRegistrationResult> {
    const normalizedEmail = input.email.toLowerCase().trim();

    // Check email uniqueness
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      throw new AppError(
        HttpStatus.CONFLICT,
        "EMAIL_ALREADY_EXISTS",
        "A user with this email address is already registered."
      );
    }

    // Generate atomic student ID
    const studentId = await CounterService.generateStudentId();

    // Generate single-use activation token with configurable expiry
    const { rawToken, tokenHash, expiresAt } = generateActivationToken(
      env.ACTIVATION_TOKEN_TTL_HOURS
    );

    // Generate dummy password hash for pending account
    const dummyRandomSecret = crypto.randomBytes(32).toString("hex");
    const dummyPasswordHash = await hashPassword(dummyRandomSecret);

    // Create student user account
    const studentUser = await User.create({
      email: normalizedEmail,
      studentId,
      passwordHash: dummyPasswordHash,
      role: UserRole.STUDENT,
      status: UserStatus.PENDING_ACTIVATION,
      activationTokenHash: tokenHash,
      activationTokenExpires: expiresAt,
      failedLoginAttempts: 0,
      lockUntil: null,
    });

    // Record audit log
    try {
      await AuditLog.create({
        actorId: adminUser.id,
        actorRole: adminUser.role,
        action: "REGISTER_STUDENT",
        targetCollection: "users",
        targetDocumentId: studentUser._id,
        newState: {
          email: studentUser.email,
          studentId: studentUser.studentId,
          fullName: input.fullName,
          role: studentUser.role,
          status: studentUser.status,
          activationExpires: expiresAt,
        },
        reason: `Admin ${adminUser.email} registered student ${normalizedEmail}`,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
      });
    } catch {
      // Audit log creation should not fail student registration
    }

    const isDevOrTest =
      env.NODE_ENV === "development" || env.NODE_ENV === "test";

    return {
      user: studentUser,
      ...(isDevOrTest ? { devActivationToken: rawToken } : {}),
    };
  }

  /**
   * Bulk imports students from a parsed CSV text.
   * - Validates required columns exist.
   * - Validates each row against csvRowSchema.
   * - Detects duplicate emails within the CSV and against existing DB records.
   * - Creates accounts row-by-row with atomic student IDs.
   * - Reports per-row errors without aborting the entire import.
   */
  public static async importStudentsFromCsv(
    adminUser: AuthenticatedUser,
    csvText: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<CsvImportResult> {
    const result: CsvImportResult = {
      totalRows: 0,
      successCount: 0,
      errorCount: 0,
      created: [],
      errors: [],
    };

    // 1. Parse the CSV text
    const parsed = parseCsvText(csvText);

    // Report parse-level errors
    if (parsed.parseErrors.length > 0) {
      for (const pe of parsed.parseErrors) {
        result.errors.push({
          row: pe.row,
          errors: [{ field: "csv", message: pe.message }],
        });
      }
    }

    // 2. Validate required columns
    const normalizedHeaders = parsed.headers.map((h) => h.trim());
    const missingColumns: string[] = [];
    for (const required of REQUIRED_CSV_COLUMNS) {
      if (!normalizedHeaders.includes(required)) {
        missingColumns.push(required);
      }
    }

    if (missingColumns.length > 0) {
      throw new AppError(
        HttpStatus.BAD_REQUEST,
        "CSV_MISSING_COLUMNS",
        `CSV is missing required columns: ${missingColumns.join(", ")}`,
        { missingColumns }
      );
    }

    if (parsed.rows.length === 0) {
      throw new AppError(
        HttpStatus.BAD_REQUEST,
        "CSV_EMPTY",
        "CSV file contains no data rows."
      );
    }

    result.totalRows = parsed.rows.length;

    // 3. Validate each row and detect intra-CSV duplicates
    const seenEmails = new Set<string>();
    const validRows: Array<{
      rowIndex: number;
      data: Record<string, string>;
    }> = [];

    for (let i = 0; i < parsed.rows.length; i++) {
      const rowNumber = i + 2; // 1-indexed, accounting for header row
      const rawRow = parsed.rows[i];

      // Zod validation
      const parseResult = csvRowSchema.safeParse(rawRow);
      if (!parseResult.success) {
        const rowErrors = parseResult.error.errors.map((e) => ({
          field: e.path.join(".") || "unknown",
          message: e.message,
        }));
        result.errors.push({
          row: rowNumber,
          email: rawRow.email || undefined,
          errors: rowErrors,
        });
        result.errorCount++;
        continue;
      }

      const email = (rawRow.email || "").toLowerCase().trim();

      // Intra-CSV duplicate detection
      if (seenEmails.has(email)) {
        result.errors.push({
          row: rowNumber,
          email,
          errors: [
            {
              field: "email",
              message: `Duplicate email within CSV. This email appears in an earlier row.`,
            },
          ],
        });
        result.errorCount++;
        continue;
      }

      seenEmails.add(email);
      validRows.push({ rowIndex: rowNumber, data: rawRow });
    }

    // 4. Check for existing emails in the database (batch query)
    if (validRows.length > 0) {
      const emailsToCheck = validRows.map(
        (r) => (r.data.email || "").toLowerCase().trim()
      );
      const existingUsers = await User.find({
        email: { $in: emailsToCheck },
      }).select("email");
      const existingEmailSet = new Set(
        existingUsers.map((u) => u.email.toLowerCase())
      );

      // Filter out rows with existing emails
      const finalValidRows: typeof validRows = [];
      for (const row of validRows) {
        const email = (row.data.email || "").toLowerCase().trim();
        if (existingEmailSet.has(email)) {
          result.errors.push({
            row: row.rowIndex,
            email,
            errors: [
              {
                field: "email",
                message: "A user with this email address already exists in the system.",
              },
            ],
          });
          result.errorCount++;
        } else {
          finalValidRows.push(row);
        }
      }

      // 5. Create student accounts for all valid rows
      const isDevOrTest =
        env.NODE_ENV === "development" || env.NODE_ENV === "test";
      const devTokens: Array<{
        email: string;
        studentId: string;
        activationToken: string;
      }> = [];

      for (const row of finalValidRows) {
        try {
          const email = (row.data.email || "").toLowerCase().trim();

          // Generate atomic student ID
          const studentId = await CounterService.generateStudentId();

          // Generate activation token
          const { rawToken, tokenHash, expiresAt } = generateActivationToken(
            env.ACTIVATION_TOKEN_TTL_HOURS
          );

          // Generate dummy password hash
          const dummyRandomSecret = crypto.randomBytes(32).toString("hex");
          const dummyPasswordHash = await hashPassword(dummyRandomSecret);

          // Create student user
          const studentUser = await User.create({
            email,
            studentId,
            passwordHash: dummyPasswordHash,
            role: UserRole.STUDENT,
            status: UserStatus.PENDING_ACTIVATION,
            activationTokenHash: tokenHash,
            activationTokenExpires: expiresAt,
            failedLoginAttempts: 0,
            lockUntil: null,
          });

          result.created.push({
            row: row.rowIndex,
            email,
            studentId,
          });
          result.successCount++;

          if (isDevOrTest) {
            devTokens.push({
              email,
              studentId,
              activationToken: rawToken,
            });
          }

          // Audit log (fire-and-forget)
          try {
            await AuditLog.create({
              actorId: adminUser.id,
              actorRole: adminUser.role,
              action: "CSV_IMPORT_STUDENT",
              targetCollection: "users",
              targetDocumentId: studentUser._id,
              newState: {
                email: studentUser.email,
                studentId: studentUser.studentId,
                fullName: row.data.fullName,
                role: studentUser.role,
                status: studentUser.status,
                csvRow: row.rowIndex,
              },
              reason: `Admin ${adminUser.email} imported student ${email} from CSV (row ${row.rowIndex})`,
              ipAddress: ipAddress || null,
              userAgent: userAgent || null,
            });
          } catch {
            // Audit log should not fail the import
          }
        } catch (err: unknown) {
          const errorMessage =
            err instanceof Error ? err.message : "Unknown error during account creation";

          // Handle MongoDB duplicate key error that may slip through
          if (
            typeof err === "object" &&
            err !== null &&
            "code" in err &&
            (err as { code: number }).code === 11000
          ) {
            result.errors.push({
              row: row.rowIndex,
              email: (row.data.email || "").toLowerCase().trim(),
              errors: [
                {
                  field: "email",
                  message: "Duplicate key conflict. This email or student ID already exists.",
                },
              ],
            });
          } else {
            result.errors.push({
              row: row.rowIndex,
              email: (row.data.email || "").toLowerCase().trim(),
              errors: [
                {
                  field: "system",
                  message: errorMessage,
                },
              ],
            });
          }
          result.errorCount++;
        }
      }

      if (isDevOrTest && devTokens.length > 0) {
        result.devActivationTokens = devTokens;
      }
    }

    return result;
  }
}
