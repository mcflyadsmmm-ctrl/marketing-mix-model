import { describe, expect, it } from "vitest";
import {
  listRecentClosedShopLocalDays,
  shopLocalDayKey,
  shopLocalDayRange,
} from "./shopify-sales.server";

describe("shopLocalDayKey", () => {
  it("resolves the local calendar day in a timezone behind UTC", () => {
    // 2026-07-01T02:00:00Z is still 2026-06-30 evening in America/Chicago (UTC-5 in summer).
    const instant = new Date("2026-07-01T02:00:00.000Z");
    expect(shopLocalDayKey(instant, "America/Chicago")).toBe("2026-06-30");
  });

  it("resolves the local calendar day in a timezone ahead of UTC", () => {
    // 2026-07-01T22:00:00Z is already 2026-07-02 in Australia/Sydney (UTC+10 in winter).
    const instant = new Date("2026-07-01T22:00:00.000Z");
    expect(shopLocalDayKey(instant, "Australia/Sydney")).toBe("2026-07-02");
  });

  it("agrees with UTC for the UTC timezone", () => {
    const instant = new Date("2026-01-15T12:34:56.000Z");
    expect(shopLocalDayKey(instant, "UTC")).toBe("2026-01-15");
  });
});

describe("shopLocalDayRange", () => {
  it("returns the UTC instant range covering one Chicago-local day", () => {
    const range = shopLocalDayRange("2026-07-01", "America/Chicago");
    // America/Chicago is UTC-5 during summer (CDT) — local midnight is 05:00 UTC.
    expect(range.start.toISOString()).toBe("2026-07-01T05:00:00.000Z");
    // End is 1ms before the next local midnight.
    expect(range.end.toISOString()).toBe("2026-07-02T04:59:59.999Z");
  });

  it("round-trips through shopLocalDayKey at the range boundaries", () => {
    const dateKey = "2026-03-10"; // near a US DST transition
    const range = shopLocalDayRange(dateKey, "America/Chicago");
    expect(shopLocalDayKey(range.start, "America/Chicago")).toBe(dateKey);
    expect(shopLocalDayKey(range.end, "America/Chicago")).toBe(dateKey);
  });

  it("returns a same-day UTC range for the UTC timezone", () => {
    const range = shopLocalDayRange("2026-01-15", "UTC");
    expect(range.start.toISOString()).toBe("2026-01-15T00:00:00.000Z");
    expect(range.end.toISOString()).toBe("2026-01-15T23:59:59.999Z");
  });
});

describe("listRecentClosedShopLocalDays", () => {
  it("excludes the in-progress local today and returns `count` prior closed days", () => {
    // 2026-07-15T10:00:00Z is 2026-07-15 05:00 local in Chicago (still "today").
    const now = new Date("2026-07-15T10:00:00.000Z");
    const days = listRecentClosedShopLocalDays("America/Chicago", 5, now);
    expect(days).toEqual([
      "2026-07-10",
      "2026-07-11",
      "2026-07-12",
      "2026-07-13",
      "2026-07-14",
    ]);
  });

  it("never includes a day matching the timezone's current local date", () => {
    const now = new Date("2026-07-15T23:59:00.000Z"); // late UTC, still 7/15 in Chicago
    const todayKey = shopLocalDayKey(now, "America/Chicago");
    const days = listRecentClosedShopLocalDays("America/Chicago", 60, now);
    expect(days).not.toContain(todayKey);
    expect(days).toHaveLength(60);
  });

  it("is honest to the shop timezone even when it differs from server-local UTC today", () => {
    // Late UTC evening: Sydney (UTC+10 in southern winter) is already on the next
    // calendar day while UTC itself is not — the two zones must disagree here.
    const now = new Date("2026-07-15T23:30:00.000Z");
    const sydneyDays = listRecentClosedShopLocalDays("Australia/Sydney", 3, now);
    const utcDays = listRecentClosedShopLocalDays("UTC", 3, now);
    expect(sydneyDays).not.toEqual(utcDays);
  });
});
