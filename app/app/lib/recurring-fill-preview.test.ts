import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  RECURRING_LONG_FILL_DAYS,
  recurringFillConfirmRequiredError,
  recurringFillDayCount,
  recurringFillNeedsConfirm,
  recurringFillPreviewCopy,
} from "./recurring-fill-preview";

const here = dirname(fileURLToPath(import.meta.url));

describe("recurring fill preview", () => {
  it("counts inclusive days and treats yesterday-only as one day", () => {
    expect(recurringFillDayCount("2026-09-15", "2026-09-15")).toBe(1);
    expect(recurringFillDayCount("2026-08-01", "2026-08-31")).toBe(31);
    expect(recurringFillDayCount("2026-01-01", "2026-09-15")).toBe(258);
    expect(recurringFillDayCount("2026-09-16", "2026-09-15")).toBe(0);
    expect(recurringFillDayCount("nope", "2026-09-15")).toBe(0);
  });

  it("asks for confirm only past 31 days", () => {
    expect(RECURRING_LONG_FILL_DAYS).toBe(31);
    expect(recurringFillNeedsConfirm(31)).toBe(false);
    expect(recurringFillNeedsConfirm(32)).toBe(true);
    const short = recurringFillPreviewCopy({
      fromYmd: "2026-09-01",
      throughYmd: "2026-09-15",
    });
    expect(short.needsConfirm).toBe(false);
    expect(short.body).toMatch(/15 empty days/);
    const long = recurringFillPreviewCopy({
      fromYmd: "2026-01-01",
      throughYmd: "2026-09-15",
      amount: 40,
      currency: "USD",
    });
    expect(long.needsConfirm).toBe(true);
    expect(long.body).toMatch(/258 days/);
    expect(long.body).toMatch(/USD 10,320/);
    expect(long.body).toMatch(/Confirm below/);
  });

  it("server error names the span without removing the feature", () => {
    const error = recurringFillConfirmRequiredError(
      258,
      "2026-01-01",
      "2026-09-15",
    );
    expect(error).toMatch(/258 days/);
    expect(error).toMatch(/2026-01-01/);
    expect(error).toMatch(/Check the box/);
  });

  it("Spend default first day stays yesterday and long fills require confirm", () => {
    const spend = readFileSync(join(here, "../routes/app.spend.tsx"), "utf8");
    expect(spend).toContain("useState(yesterdayKey)");
    expect(spend).toContain("recurringFillPreviewCopy");
    expect(spend).toContain("confirm_long_fill");
    expect(spend).toContain("recurringFillConfirmRequiredError");
    expect(spend).not.toContain("yesterdayFromTodayKey");
  });
});
