import { describe, expect, it } from "vitest";
import { LIVE_UNPAID_INGEST_DAYS } from "./live-unpark";
import {
  liveIngestDepth,
  orderRowWindowDayCount,
  ORDER_ROW_WINDOW_MONTHS,
  resolveCommercialOrderWindowDays,
  resolveLiveIngestWindowDays,
  resolveOrderRowWindowDays,
  shopMayIngestFullHistory,
} from "./live-ingest-depth";

describe("Live ingest windows", () => {
  it("does not clamp sales days when the host is not charging", () => {
    expect(
      shopMayIngestFullHistory({ billingEnabled: false, isPro: false }),
    ).toBe(true);
    expect(
      resolveLiveIngestWindowDays({
        billingEnabled: false,
        isPro: false,
        paidWindowDays: 1800,
      }),
    ).toBe(1800);
  });

  it("does not shrink trial sales below the granted Shopify window", () => {
    expect(
      shopMayIngestFullHistory({ billingEnabled: true, isPro: false }),
    ).toBe(true);
    expect(liveIngestDepth({ billingEnabled: true, isPro: false })).toBe(
      "paid_full",
    );
    expect(LIVE_UNPAID_INGEST_DAYS).toBe(90);
    expect(
      resolveLiveIngestWindowDays({
        billingEnabled: true,
        isPro: false,
        paidWindowDays: 1800,
      }),
    ).toBe(1800);
    expect(
      resolveLiveIngestWindowDays({
        billingEnabled: true,
        isPro: false,
        paidWindowDays: 60,
      }),
    ).toBe(60);
  });

  it("does not extend paid sales past the Shopify window", () => {
    expect(
      resolveLiveIngestWindowDays({
        billingEnabled: true,
        isPro: true,
        paidWindowDays: 1800,
      }),
    ).toBe(1800);
  });

  it("caps a granted order window at 24 months", () => {
    expect(ORDER_ROW_WINDOW_MONTHS).toBe(24);
    const now = new Date("2026-09-18T12:00:00.000Z");
    const cap = orderRowWindowDayCount(now);
    expect(cap).toBeGreaterThan(700);
    expect(cap).toBeLessThan(750);
    expect(
      resolveOrderRowWindowDays({ shopifyWindowDays: 1800, now }),
    ).toBe(cap);
    expect(resolveOrderRowWindowDays({ shopifyWindowDays: 60, now })).toBe(60);
  });

  it("keeps trial and paid order rows on the 24-month cap", () => {
    const now = new Date("2026-09-18T12:00:00.000Z");
    const cap = orderRowWindowDayCount(now);
    expect(
      resolveCommercialOrderWindowDays({
        billingEnabled: true,
        isPro: false,
        shopifyWindowDays: 1800,
        now,
      }),
    ).toBe(cap);
    expect(
      resolveCommercialOrderWindowDays({
        billingEnabled: true,
        isPro: false,
        shopifyWindowDays: 60,
        now,
      }),
    ).toBe(60);
    expect(
      resolveCommercialOrderWindowDays({
        billingEnabled: true,
        isPro: true,
        shopifyWindowDays: 1800,
        now,
      }),
    ).toBe(cap);
    expect(
      resolveCommercialOrderWindowDays({
        billingEnabled: false,
        isPro: false,
        shopifyWindowDays: 1800,
        now,
      }),
    ).toBe(cap);
  });
});
