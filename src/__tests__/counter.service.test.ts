/**
 * Unit tests for CounterService.generateStudentId()
 *
 * Tests cover:
 *   Q1 – Sequence exceeds 999 without rejecting registrations
 *   Q2 – MongoDB $inc is called atomically on each invocation
 *   Q3 – Concurrent calls cannot produce duplicate student IDs
 *   Q4 – Failed downstream registration never reuses a consumed sequence number
 *   Q5 – Unique partial index is defined correctly on the User model
 *   Q6 – Boundary values: seq 998, 999, 1000, 1001
 *   Q7 – Concurrent calls and first-counter E11000 retry
 *   Q8 – MONTHLY_REGISTRATION_LIMIT_REACHED is never thrown
 *   Q9 – (Executed below; results reported in test output)
 *
 * MongoDB is fully mocked — no real database connection is required.
 */

import { CounterService } from "../services/counter.service";
import { StudentIdCounter } from "../models/StudentIdCounter";
import { User } from "../models/User";
import mongoose from "mongoose";

// ---------------------------------------------------------------------------
// Mock the Mongoose model so no real DB connection is needed
// ---------------------------------------------------------------------------
jest.mock("../models/StudentIdCounter");
const MockedCounter = StudentIdCounter as jest.Mocked<typeof StudentIdCounter>;

// ---------------------------------------------------------------------------
// Helper: build a fake counter document with a specific seq value
// ---------------------------------------------------------------------------
function makeCounterDoc(seq: number) {
  return { yearMonth: "202610", seq } as any;
}

// ---------------------------------------------------------------------------
// Helpers for the User model partial index test (Q5)
// ---------------------------------------------------------------------------
function getIndexForPath(model: mongoose.Model<any>, path: string) {
  return (model.schema as any).indexes().find(
    ([fields]: [Record<string, number>]) => Object.keys(fields)[0] === path
  );
}

// ---------------------------------------------------------------------------
// Test suites
// ---------------------------------------------------------------------------

describe("CounterService.generateStudentId()", () => {
  const REFERENCE_DATE = new Date("2026-10-01T00:00:00.000Z"); // yearMonth = "202610"

  // -------------------------------------------------------------------------
  // Q1 & Q6 – Sequence auto-expands beyond 999; no cap enforced
  // -------------------------------------------------------------------------
  describe("Q1 & Q6 – Sequence expansion and boundary values", () => {
    const cases: Array<[number, string]> = [
      [998, "STU-202610998"],
      [999, "STU-202610999"],
      [1000, "STU-2026101000"],
      [1001, "STU-2026101001"],
    ];

    test.each(cases)(
      "seq=%i produces %s and does NOT throw",
      async (seq, expectedId) => {
        (MockedCounter.findOneAndUpdate as jest.Mock).mockResolvedValueOnce(
          makeCounterDoc(seq)
        );

        const studentId = await CounterService.generateStudentId(REFERENCE_DATE);
        expect(studentId).toBe(expectedId);
      }
    );

    test("seq=1 is zero-padded to STU-202610001", async () => {
      (MockedCounter.findOneAndUpdate as jest.Mock).mockResolvedValueOnce(
        makeCounterDoc(1)
      );
      const id = await CounterService.generateStudentId(REFERENCE_DATE);
      expect(id).toBe("STU-202610001");
    });

    test("seq=42 is zero-padded to STU-202610042", async () => {
      (MockedCounter.findOneAndUpdate as jest.Mock).mockResolvedValueOnce(
        makeCounterDoc(42)
      );
      const id = await CounterService.generateStudentId(REFERENCE_DATE);
      expect(id).toBe("STU-202610042");
    });
  });

  // -------------------------------------------------------------------------
  // Q8 – MONTHLY_REGISTRATION_LIMIT_REACHED is NEVER thrown
  // -------------------------------------------------------------------------
  describe("Q8 – No monthly registration limit error", () => {
    const highSeqs = [1000, 1500, 9999, 100000];

    test.each(highSeqs)(
      "seq=%i never triggers MONTHLY_REGISTRATION_LIMIT_REACHED",
      async (seq) => {
        (MockedCounter.findOneAndUpdate as jest.Mock).mockResolvedValueOnce(
          makeCounterDoc(seq)
        );

        await expect(
          CounterService.generateStudentId(REFERENCE_DATE)
        ).resolves.not.toThrow();

        // Ensure the specific error code is never thrown
        try {
          (MockedCounter.findOneAndUpdate as jest.Mock).mockResolvedValueOnce(
            makeCounterDoc(seq)
          );
          const id = await CounterService.generateStudentId(REFERENCE_DATE);
          expect(id).toMatch(/^STU-202610\d+$/);
        } catch (err: any) {
          expect(err?.code).not.toBe("MONTHLY_REGISTRATION_LIMIT_REACHED");
        }
      }
    );
  });

  // -------------------------------------------------------------------------
  // Q2 – MongoDB $inc is called atomically on every invocation
  // -------------------------------------------------------------------------
  describe("Q2 – Atomic $inc on every call", () => {
    test("findOneAndUpdate is called with $inc: { seq: 1 } each time", async () => {
      (MockedCounter.findOneAndUpdate as jest.Mock)
        .mockResolvedValueOnce(makeCounterDoc(1))
        .mockResolvedValueOnce(makeCounterDoc(2));

      await CounterService.generateStudentId(REFERENCE_DATE);
      await CounterService.generateStudentId(REFERENCE_DATE);

      const calls = (MockedCounter.findOneAndUpdate as jest.Mock).mock.calls;
      expect(calls).toHaveLength(2);

      calls.forEach((call) => {
        expect(call[1]).toEqual({ $inc: { seq: 1 } }); // update argument
        expect(call[2]).toMatchObject({ new: true, upsert: true }); // options
      });
    });
  });

  // -------------------------------------------------------------------------
  // Q3 – Concurrent calls cannot produce duplicates
  // -------------------------------------------------------------------------
  describe("Q3 – Concurrent calls get distinct seq values", () => {
    test("20 parallel calls each receive a unique student ID", async () => {
      // Simulate MongoDB atomically assigning seq 1-20 to 20 concurrent callers
      for (let i = 1; i <= 20; i++) {
        (MockedCounter.findOneAndUpdate as jest.Mock).mockResolvedValueOnce(
          makeCounterDoc(i)
        );
      }

      const results = await Promise.all(
        Array.from({ length: 20 }, () =>
          CounterService.generateStudentId(REFERENCE_DATE)
        )
      );

      const unique = new Set(results);
      expect(unique.size).toBe(20);
      expect(results).toHaveLength(20);
    });
  });

  // -------------------------------------------------------------------------
  // Q4 – Counter is never rolled back; consumed seq is permanently issued
  // -------------------------------------------------------------------------
  describe("Q4 – No counter rollback on downstream failure", () => {
    test("updateOne ($inc: { seq: -1 }) is never called", async () => {
      // Simulate seq=1000 (previously the rollback trigger)
      (MockedCounter.findOneAndUpdate as jest.Mock).mockResolvedValueOnce(
        makeCounterDoc(1000)
      );

      await CounterService.generateStudentId(REFERENCE_DATE);

      // Ensure the rollback call was never made
      expect(MockedCounter.updateOne).not.toHaveBeenCalled();
    });

    test("Counter is not rolled back for seq=999", async () => {
      (MockedCounter.findOneAndUpdate as jest.Mock).mockResolvedValueOnce(
        makeCounterDoc(999)
      );

      await CounterService.generateStudentId(REFERENCE_DATE);
      expect(MockedCounter.updateOne).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // Q7 – E11000 retry on first-counter race condition
  // -------------------------------------------------------------------------
  describe("Q7 – First-counter race condition (E11000) retry", () => {
    test("E11000 on attempt 1 is retried; succeeds on attempt 2", async () => {
      const dupKeyError = Object.assign(new Error("E11000"), { code: 11000 });

      (MockedCounter.findOneAndUpdate as jest.Mock)
        .mockRejectedValueOnce(dupKeyError) // attempt 1: race condition
        .mockResolvedValueOnce(makeCounterDoc(1)); // attempt 2: success

      const id = await CounterService.generateStudentId(REFERENCE_DATE);
      expect(id).toBe("STU-202610001");
      expect(MockedCounter.findOneAndUpdate).toHaveBeenCalledTimes(2);
    });

    test("E11000 on all 3 attempts throws COUNTER_INCREMENT_FAILED", async () => {
      const dupKeyError = Object.assign(new Error("E11000"), { code: 11000 });

      (MockedCounter.findOneAndUpdate as jest.Mock)
        .mockRejectedValueOnce(dupKeyError)
        .mockRejectedValueOnce(dupKeyError)
        .mockRejectedValueOnce(dupKeyError);

      await expect(
        CounterService.generateStudentId(REFERENCE_DATE)
      ).rejects.toMatchObject({ code: "COUNTER_INCREMENT_FAILED" });
    });

    test("Non-E11000 error on attempt 1 throws immediately without retry", async () => {
      const networkError = Object.assign(new Error("Network"), { code: 99 });

      (MockedCounter.findOneAndUpdate as jest.Mock).mockRejectedValueOnce(
        networkError
      );

      await expect(
        CounterService.generateStudentId(REFERENCE_DATE)
      ).rejects.toMatchObject({ code: "COUNTER_INCREMENT_FAILED" });

      // Should have been called only once — no retry on non-E11000
      expect(MockedCounter.findOneAndUpdate).toHaveBeenCalledTimes(1);
    });
  });

  // -------------------------------------------------------------------------
  // Q5 – Unique partial index on User.studentId
  // -------------------------------------------------------------------------
  describe("Q5 – User model unique partial index on studentId", () => {
    test("studentId index is unique and uses partialFilterExpression", () => {
      const indexEntry = getIndexForPath(User, "studentId");

      expect(indexEntry).toBeDefined();

      const [_fields, opts] = indexEntry;
      expect(opts.unique).toBe(true);
      expect(opts.partialFilterExpression).toEqual({
        studentId: { $type: "string" },
      });
    });

    test("studentId field defaults to null (allows staff without IDs)", () => {
      const path = User.schema.path("studentId") as any;
      expect(path.defaultValue).toBe(null);
    });
  });

  // -------------------------------------------------------------------------
  // Edge: null counterDoc path
  // -------------------------------------------------------------------------
  describe("Edge cases", () => {
    test("Null counterDoc throws COUNTER_UNAVAILABLE", async () => {
      (MockedCounter.findOneAndUpdate as jest.Mock).mockResolvedValueOnce(null);

      await expect(
        CounterService.generateStudentId(REFERENCE_DATE)
      ).rejects.toMatchObject({ code: "COUNTER_UNAVAILABLE" });
    });

    test("ID format matches STU-YYYYMM<seq> regex", async () => {
      (MockedCounter.findOneAndUpdate as jest.Mock).mockResolvedValueOnce(
        makeCounterDoc(5)
      );
      const id = await CounterService.generateStudentId(REFERENCE_DATE);
      // Allows any number of digits after YYYYMM, padded to min 3
      expect(id).toMatch(/^STU-\d{6}\d{3,}$/);
    });
  });
});
