import { describe, expect, it } from "vitest";
import {
  liveIngestDepth,
  resolveLiveIngestWindowDays,
  shopMayIngestFullHistory,
  TRIAL_LIVE_SLICE_DAYS,
} from "./live-ingest-depth";

describe("Live ingest billing hard-stop", () => {
  it("does not clamp when the host is not charging", () => {
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

  it("keeps unpaid/trial on the ~90d Live slice — no free multi-year backfill", () => {
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
    ).toBe(TRIAL_LIVE_SLICE_DAYS);
    expect(
      resolveLiveIngestWindowDays({
        billingEnabled: true,
        isPro: false,
        paidWindowDays: 60,
      }),
    ).toBe(60);
  });

  it("unlocks the full paid book immediately on subscribe", () => {
    expect(
      shopMayIngestFullHistory({ billingEnabled: true, isPro: true }),
    ).toBe(true);
    expect(liveIngestDepth({ billingEnabled: true, isPro: true })).toBe(
      "paid_full",
    );
    expect(
      resolveLiveIngestWindowDays({
        billingEnabled: true,
        isPro: true,
        paidWindowDays: 1800,
      }),
    ).toBe(1800);
  });
});
