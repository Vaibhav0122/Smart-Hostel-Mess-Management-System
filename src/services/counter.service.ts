import dayjs from "dayjs";
import { StudentIdCounter } from "../models/StudentIdCounter";
import { AppError } from "../errors/AppError";
import { HttpStatus } from "../constants/statusCodes";

export class CounterService {
  /**
   * Generates an atomic sequential student ID in the format STU-YYYYMM<seq>,
   * where <seq> is zero-padded to at least 3 digits.
   *
   * Examples:
   *   seq=1    → STU-202610001
   *   seq=42   → STU-202610042
   *   seq=999  → STU-202610999
   *   seq=1000 → STU-2026101000  (auto-expands; no cap enforced)
   *   seq=1001 → STU-2026101001
   *
   * Guarantees:
   *   1. Atomic monthly increment via MongoDB findOneAndUpdate $inc — no two concurrent
   *      callers receive the same seq value.
   *   2. Concurrency-safe first-time creation: E11000 duplicate key errors during the
   *      initial upsert of a new month are handled with automatic retry (up to 3 attempts).
   *   3. No monthly registration cap — the sequence expands automatically beyond 999.
   *   4. The counter is NEVER rolled back. Once $inc returns a seq, that value is
   *      permanently consumed, even if the downstream registration workflow fails.
   *      IDs are monotonically increasing and never reused.
   */
  public static async generateStudentId(referenceDate: Date = new Date()): Promise<string> {
    const yearMonth = dayjs(referenceDate).format("YYYYMM");
    const maxRetries = 3;
    let counterDoc = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        counterDoc = await StudentIdCounter.findOneAndUpdate(
          { yearMonth },
          { $inc: { seq: 1 } },
          {
            new: true,
            upsert: true,
            setDefaultsOnInsert: true,
          }
        );
        break; // Successfully incremented or upserted
      } catch (error: any) {
        // Concurrency race condition: two threads attempted upsert simultaneously for a new month.
        // Thread 1 created the doc; Thread 2 hit E11000 duplicate key error.
        // On retry the document now exists, so findOneAndUpdate will cleanly execute $inc.
        if (error.code === 11000 && attempt < maxRetries) {
          continue;
        }
        throw new AppError(
          HttpStatus.INTERNAL_SERVER_ERROR,
          "COUNTER_INCREMENT_FAILED",
          `Failed to increment student ID counter for period ${yearMonth}`,
          error
        );
      }
    }

    if (!counterDoc) {
      throw new AppError(
        HttpStatus.INTERNAL_SERVER_ERROR,
        "COUNTER_UNAVAILABLE",
        "Unable to generate student ID: counter document not returned"
      );
    }

    // Zero-pad to at least 3 digits. For seq <= 999 this produces "001" … "999".
    // For seq >= 1000 padStart(3) is a no-op and the full number is used as-is,
    // producing "1000", "1001", etc. — no cap, no rejection.
    const sequencePadded = String(counterDoc.seq).padStart(3, "0");
    return `STU-${yearMonth}${sequencePadded}`;
  }
}
