import { describe, expect, it } from "vitest";
import {
  AllocationQuerySchema,
  MAX_QUERY_RANGE_DAYS,
  MerQuerySchema,
} from "@mcfly/api-contract";

describe("API query date range cap", () => {
  it("accepts ranges within MAX_QUERY_RANGE_DAYS inclusive", () => {
    const ok = MerQuerySchema.safeParse({
      from: "2025-01-01",
      to: "2025-12-31", // 365 days inclusive in non-leap? Jan1-Dec31 = 365 days
    });
    expect(ok.success).toBe(true);

    // Exactly 366 inclusive days: 2024 is leap — Jan 1 → Dec 31 = 366
    const leapYear = MerQuerySchema.safeParse({
      from: "2024-01-01",
      to: "2024-12-31",
    });
    expect(leapYear.success).toBe(true);
    expect(MAX_QUERY_RANGE_DAYS).toBe(366);
  });

  it("rejects ranges over 366 inclusive days with a clear message", () => {
    const over = MerQuerySchema.safeParse({
      from: "2024-01-01",
      to: "2025-01-01", // 367 inclusive days
    });
    expect(over.success).toBe(false);
    if (!over.success) {
      expect(over.error.issues[0]?.message).toMatch(/maximum of 366 days/i);
    }

    const alloc = AllocationQuerySchema.safeParse({
      from: "2023-01-01",
      to: "2025-01-01",
    });
    expect(alloc.success).toBe(false);
  });

  it("rejects from after to", () => {
    const bad = AllocationQuerySchema.safeParse({
      from: "2026-02-01",
      to: "2026-01-01",
    });
    expect(bad.success).toBe(false);
    if (!bad.success) {
      expect(bad.error.issues[0]?.message).toMatch(/on or before/i);
    }
  });
});
