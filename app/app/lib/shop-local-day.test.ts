import { describe, expect, it } from "vitest";
import {
  listRecentClosedShopLocalDays,
  shopLocalDayKey,
  shopLocalDayKeyFromIso,
  shopLocalDayRange,
} from "./shopify-sales.server";
import { shopLocalDayKey as shopLocalDayKeyDirect } from "./shop-local-day";

describe("shopLocalDayKeyFromIso — midnight America/Denver vs UTC", () => {
  it("buckets an order just after UTC midnight into the prior Denver day", () => {
    // 2026-07-01T05:30:00Z = 2026-06-30 23:30 MDT (America/Denver).
    const iso = "2026-07-01T05:30:00.000Z";
    expect(shopLocalDayKeyFromIso(iso, "America/Denver")).toBe("2026-06-30");
    expect(shopLocalDayKeyFromIso(iso, "UTC")).toBe("2026-07-01");
  });

  it("buckets an order just after Denver midnight into the new Denver day", () => {
    // 2026-07-01T06:30:00Z = 2026-07-01 00:30 MDT.
    const iso = "2026-07-01T06:30:00.000Z";
    expect(shopLocalDayKeyFromIso(iso, "America/Denver")).toBe("2026-07-01");
    expect(shopLocalDayKeyFromIso(iso, "UTC")).toBe("2026-07-01");
  });

  it("disagrees with UTC for late-evening Denver orders that are next-day UTC", () => {
    // 2026-07-01T01:00:00Z = 2026-06-30 19:00 MDT.
    const iso = "2026-07-01T01:00:00.000Z";
    expect(shopLocalDayKeyFromIso(iso, "America/Denver")).toBe("2026-06-30");
    expect(shopLocalDayKeyFromIso(iso, "UTC")).toBe("2026-07-01");
  });

  it("returns empty string for invalid ISO", () => {
    expect(shopLocalDayKeyFromIso("not-a-date", "America/Denver")).toBe("");
  });
});

describe("shopLocalDayKey re-export parity", () => {
  it("shopify-sales re-export matches shop-local-day module", () => {
    const instant = new Date("2026-07-01T05:30:00.000Z");
    expect(shopLocalDayKey(instant, "America/Denver")).toBe(
      shopLocalDayKeyDirect(instant, "America/Denver"),
    );
  });
});

describe("shopLocalDayKey", () => {
  it("resolves the local calendar day in a timezone behind UTC", () => {
    const instant = new Date("2026-07-01T02:00:00.000Z");
    expect(shopLocalDayKey(instant, "America/Chicago")).toBe("2026-06-30");
  });

  it("resolves the local calendar day in a timezone ahead of UTC", () => {
    const instant = new Date("2026-07-01T22:00:00.000Z");
    expect(shopLocalDayKey(instant, "Australia/Sydney")).toBe("2026-07-02");
  });

  it("agrees with UTC for the UTC timezone", () => {
    const instant = new Date("2026-01-15T12:34:56.000Z");
    expect(shopLocalDayKey(instant, "UTC")).toBe("2026-01-15");
  });
});

describe("shopLocalDayRange", () => {
  it("returns the UTC instant range covering one Denver-local day", () => {
    const range = shopLocalDayRange("2026-07-01", "America/Denver");
    // America/Denver is UTC-6 during summer (MDT) — local midnight is 06:00 UTC.
    expect(range.start.toISOString()).toBe("2026-07-01T06:00:00.000Z");
    expect(range.end.toISOString()).toBe("2026-07-02T05:59:59.999Z");
  });

  it("round-trips through shopLocalDayKey at the range boundaries", () => {
    const dateKey = "2026-03-10";
    const range = shopLocalDayRange(dateKey, "America/Denver");
    expect(shopLocalDayKey(range.start, "America/Denver")).toBe(dateKey);
    expect(shopLocalDayKey(range.end, "America/Denver")).toBe(dateKey);
  });
});

describe("listRecentClosedShopLocalDays", () => {
  it("excludes in-progress Denver today when UTC has already rolled", () => {
    // 2026-07-15T05:30Z is still 2026-07-14 evening in Denver.
    const now = new Date("2026-07-15T05:30:00.000Z");
    const denverDays = listRecentClosedShopLocalDays("America/Denver", 3, now);
    const utcDays = listRecentClosedShopLocalDays("UTC", 3, now);
    expect(denverDays).toEqual(["2026-07-11", "2026-07-12", "2026-07-13"]);
    expect(utcDays).toEqual(["2026-07-12", "2026-07-13", "2026-07-14"]);
    expect(denverDays).not.toEqual(utcDays);
  });
});
