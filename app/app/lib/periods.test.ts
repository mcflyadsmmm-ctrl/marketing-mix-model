import { describe, expect, it } from "vitest";
import {
  deskPeriodTimeZone,
  formatPeriodQuery,
  resolvePeriod,
  resolvePriorPeriod,
} from "./periods";
import { shopLocalDayKey, shopLocalDayRange } from "./shop-local-day";
import { resolveExplorerWindow } from "./spend-explorer";

describe("resolvePeriod with shop IANA", () => {
  it("MTD edges follow America/Denver calendar, not UTC machine midnight", () => {
    // 2026-07-01T05:30:00Z is still 2026-06-30 23:30 in America/Denver (MDT = UTC-6).
    const now = new Date("2026-07-01T05:30:00.000Z");
    const denver = resolvePeriod("mtd", now, "America/Denver");
    const utc = resolvePeriod("mtd", now, "UTC");

    expect(shopLocalDayKey(denver.start, "America/Denver")).toBe("2026-06-01");
    expect(shopLocalDayKey(denver.end, "America/Denver")).toBe("2026-06-30");
    expect(shopLocalDayKey(utc.start, "UTC")).toBe("2026-07-01");
    expect(shopLocalDayKey(utc.end, "UTC")).toBe("2026-07-01");

    // Denver MTD must not start on UTC July 1 when the shop is still in June.
    expect(denver.start.toISOString()).not.toBe(utc.start.toISOString());
  });

  it("YTD start is shop-local Jan 1 midnight in America/Denver", () => {
    const now = new Date("2026-07-15T18:00:00.000Z");
    const range = resolvePeriod("ytd", now, "America/Denver");
    const jan1 = shopLocalDayRange("2026-01-01", "America/Denver");
    expect(range.start.toISOString()).toBe(jan1.start.toISOString());
    expect(shopLocalDayKey(range.end, "America/Denver")).toBe("2026-07-15");
  });

  it("without timezone keeps server-local Date behavior for legacy callers", () => {
    const now = new Date(2026, 6, 15, 12, 0, 0); // local Jul 15
    const range = resolvePeriod("mtd", now);
    expect(range.start.getFullYear()).toBe(2026);
    expect(range.start.getMonth()).toBe(6);
    expect(range.start.getDate()).toBe(1);
    expect(range.label).toBe("Month to date");
  });

  it("LM is the full previous shop-local calendar month", () => {
    const now = new Date("2026-07-15T18:00:00.000Z");
    const range = resolvePeriod("lm", now, "America/Denver");
    expect(shopLocalDayKey(range.start, "America/Denver")).toBe("2026-06-01");
    expect(shopLocalDayKey(range.end, "America/Denver")).toBe("2026-06-30");
    expect(range.label).toBe("Last month");
  });

  it("LM server-local is previous calendar month", () => {
    const now = new Date(2026, 6, 15, 12, 0, 0); // local Jul 15
    const range = resolvePeriod("lm", now);
    expect(range.start.getFullYear()).toBe(2026);
    expect(range.start.getMonth()).toBe(5);
    expect(range.start.getDate()).toBe(1);
    expect(range.end.getMonth()).toBe(5);
    expect(range.end.getDate()).toBe(30);
    expect(range.label).toBe("Last month");
  });
});

describe("formatPeriodQuery", () => {
  it("bounds created_at and excludes cancelled + test orders", () => {
    const range = {
      start: new Date("2026-07-01T06:00:00.000Z"),
      end: new Date("2026-07-15T05:59:59.999Z"),
      label: "Month to date",
    };
    const q = formatPeriodQuery(range);
    expect(q).toContain("created_at:>=2026-07-01T06:00:00.000Z");
    expect(q).toContain("created_at:<=2026-07-15T05:59:59.999Z");
    expect(q).toContain("(status:open OR status:closed)");
    expect(q).toContain("test:false");
    expect(q).not.toContain("status:cancelled");
  });
});

describe("resolvePriorPeriod with shop IANA", () => {
  it("prior MTD uses the previous shop-local month through the same calendar day", () => {
    const now = new Date("2026-07-15T18:00:00.000Z");
    const prior = resolvePriorPeriod("mtd", now, "America/Denver");
    expect(shopLocalDayKey(prior.start, "America/Denver")).toBe("2026-06-01");
    expect(shopLocalDayKey(prior.end, "America/Denver")).toBe("2026-06-15");
  });

  it("prior LM is the month before last", () => {
    const now = new Date("2026-07-15T18:00:00.000Z");
    const prior = resolvePriorPeriod("lm", now, "America/Denver");
    expect(shopLocalDayKey(prior.start, "America/Denver")).toBe("2026-05-01");
    expect(shopLocalDayKey(prior.end, "America/Denver")).toBe("2026-05-31");
    expect(prior.label).toBe("Prior last month");
  });

  it("near UTC midnight, Denver QTD stays on prior shop-local month", () => {
    // Still June 30 evening in Denver while UTC is already July 1.
    const now = new Date("2026-07-01T05:30:00.000Z");
    const denver = resolvePeriod("qtd", now, "America/Denver");
    const utc = resolvePeriod("qtd", now, "UTC");

    expect(shopLocalDayKey(denver.start, "America/Denver")).toBe("2026-04-01");
    expect(shopLocalDayKey(denver.end, "America/Denver")).toBe("2026-06-30");
    expect(shopLocalDayKey(utc.start, "UTC")).toBe("2026-07-01");
    expect(shopLocalDayKey(utc.end, "UTC")).toBe("2026-07-01");
    expect(denver.start.toISOString()).not.toBe(utc.start.toISOString());
  });

  it("l12m start/end disagree across America/Denver vs UTC at midnight edge", () => {
    const now = new Date("2026-07-01T05:30:00.000Z");
    const denver = resolvePeriod("l12m", now, "America/Denver");
    const utc = resolvePeriod("l12m", now, "UTC");

    expect(shopLocalDayKey(denver.end, "America/Denver")).toBe("2026-06-30");
    expect(shopLocalDayKey(utc.end, "UTC")).toBe("2026-07-01");
    expect(denver.end.toISOString()).not.toBe(utc.end.toISOString());
    expect(denver.start.toISOString()).not.toBe(utc.start.toISOString());
  });
});

describe("explorer day keys vs shopLocalDayKey (east-of-UTC)", () => {
  it("Australia/Sydney explorer fromKey matches shopLocalDayKey, not UTC ISO slice", () => {
    const tz = "Australia/Sydney";
    // 2026-07-01 02:00 UTC = Jul 1 afternoon AEST — last closed shop day is Jun 30.
    const now = new Date("2026-07-01T02:00:00.000Z");
    const win = resolveExplorerWindow("14d", now, { timeZone: tz });
    const fromKey = shopLocalDayKey(win.start, tz);
    const toKey = shopLocalDayKey(win.end, tz);
    const asOfKey = shopLocalDayKey(win.end, tz);

    expect(fromKey).toBe(shopLocalDayKey(win.start, tz));
    expect(toKey).toBe(asOfKey);
    expect(toKey).toBe("2026-06-30");
    // UTC ISO date slice on the range start is the prior UTC calendar day.
    expect(win.start.toISOString().slice(0, 10)).not.toBe(fromKey);
  });

  it("Pacific/Auckland period start key matches shopLocalDayKey", () => {
    const tz = "Pacific/Auckland";
    const now = new Date("2026-07-15T10:00:00.000Z");
    const win = resolveExplorerWindow("YTD", now, { timeZone: tz });
    expect(shopLocalDayKey(win.start, tz)).toBe("2026-01-01");
    expect(win.start.toISOString().slice(0, 10)).toBe("2025-12-31");
  });
});

describe("deskPeriodTimeZone", () => {
  it("forces UTC on Sample so sales/spend day keys join", () => {
    expect(deskPeriodTimeZone(true, "America/Denver")).toBe("UTC");
    expect(deskPeriodTimeZone(true, null)).toBe("UTC");
  });

  it("passes shop IANA on Your store", () => {
    expect(deskPeriodTimeZone(false, "America/Denver")).toBe("America/Denver");
    expect(deskPeriodTimeZone(false, null)).toBeNull();
  });
});
