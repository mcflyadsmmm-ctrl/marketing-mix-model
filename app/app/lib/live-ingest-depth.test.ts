import { describe, expect, it } from "vitest";
import {
  liveIngestDepth,
  orderRowWindowDayCount,
  ORDER_ROW_WINDOW_MONTHS,
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

  it("gives trial the same sales window Shopify already granted", () => {
    expect(
      shopMayIngestFullHistory({ billingEnabled: true, isPro: false }),
    ).toBe(false);
    expect(liveIngestDepth({ billingEnabled: true, isPro: false })).toBe(
      "trial_slice",
    );
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

  it("caps order rows at 24 months for trial and paid", () => {
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
});
