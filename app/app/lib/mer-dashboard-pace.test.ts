import { describe, expect, it } from "vitest";
import { buildControlPace } from "./mer-dashboard.server";
import { shopLocalDayKey, shopLocalDayRange } from "./shop-local-day";

describe("buildControlPace shop timezone", () => {
  it("uses shop-local closed days, not server-local midnight", () => {
    // 2026-07-15 02:00 UTC = still 2026-07-14 evening in America/Los_Angeles.
    const now = new Date("2026-07-15T02:00:00.000Z");
    const tz = "America/Los_Angeles";
    const todayKey = shopLocalDayKey(now, tz);
    expect(todayKey).toBe("2026-07-14");

    const mtdStart = shopLocalDayRange("2026-07-01", tz).start;
    const mtdEnd = shopLocalDayRange(todayKey, tz).end;

    const pace = buildControlPace({
      sales: 14_000,
      totalSpend: 5_000,
      targetMer: 3,
      period: { start: mtdStart, end: mtdEnd, label: "MTD" },
      now,
      ianaTimezone: tz,
    });

    // Shop-local today is Jul 14 → last closed day Jul 13 → 13 elapsed of 14.
    expect(pace.daysInPeriod).toBe(14);
    expect(pace.daysElapsed).toBe(13);
    expect(pace.remainingDays).toBe(1);
  });

  it("falls back to server-local day math when ianaTimezone is null", () => {
    const now = new Date(2026, 6, 15, 12, 0, 0); // Jul 15 local
    const periodStart = new Date(2026, 6, 1, 0, 0, 0);
    const periodEnd = new Date(2026, 6, 15, 23, 59, 59);

    const pace = buildControlPace({
      sales: 10_000,
      totalSpend: 4_000,
      targetMer: 2.5,
      period: { start: periodStart, end: periodEnd, label: "MTD" },
      now,
      ianaTimezone: null,
    });

    expect(pace.daysInPeriod).toBe(15);
    // Closed end = Jul 14 → 14 elapsed, 1 remaining.
    expect(pace.daysElapsed).toBe(14);
    expect(pace.remainingDays).toBe(1);
  });
});
