import { describe, expect, it } from "vitest";
import { resolvePeriod, resolvePriorPeriod } from "./periods";
import { shopLocalDayKey, shopLocalDayRange } from "./shop-local-day";

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
});

describe("resolvePriorPeriod with shop IANA", () => {
  it("prior MTD uses the previous shop-local month through the same calendar day", () => {
    const now = new Date("2026-07-15T18:00:00.000Z");
    const prior = resolvePriorPeriod("mtd", now, "America/Denver");
    expect(shopLocalDayKey(prior.start, "America/Denver")).toBe("2026-06-01");
    expect(shopLocalDayKey(prior.end, "America/Denver")).toBe("2026-06-15");
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
