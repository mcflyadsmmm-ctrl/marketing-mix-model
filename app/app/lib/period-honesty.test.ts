import { describe, expect, it } from "vitest";
import { PRODUCT_NOUN } from "./product-labels";
import {
  PERIOD_HONESTY_SUFFIX,
  formatPeriodHonestyChip,
  formatPeriodHonestyTillLabel,
  periodHonestyWidePresetTitle,
  periodPresetBeyondLiveShopifyWindow,
  resolvePeriodHonesty,
} from "./period-honesty";

const THEATER =
  /pixel|web pixel|multi-touch|mta|markov|shapley|meridian|robyn|true roas|view-through|path credit/i;

describe("resolvePeriodHonesty", () => {
  it("keeps SAMPLE as practice, not the merchant’s store", () => {
    expect(
      resolvePeriodHonesty({
        useSampleDesk: true,
        factsIncomplete: true,
        periodWiderThanLiveWindow: true,
        periodExceedsFactWindow: true,
      }),
    ).toBe("sample");
    expect(
      formatPeriodHonestyTillLabel("Last 12 months", {
        useSampleDesk: true,
        listingCapture: false,
        periodWiderThanLiveWindow: true,
      }),
    ).toBe("Last 12 months · SAMPLE");
  });

  it("strips honesty suffixes in listing-capture shots", () => {
    expect(
      resolvePeriodHonesty({
        useSampleDesk: false,
        listingCapture: true,
        factsIncomplete: true,
        periodWiderThanLiveWindow: true,
      }),
    ).toBe("hidden");
    expect(
      formatPeriodHonestyTillLabel("L12M", {
        useSampleDesk: false,
        listingCapture: true,
        factsIncomplete: true,
        periodWiderThanLiveWindow: true,
      }),
    ).toBe("L12M");
  });

  it("does not call a complete MTD a stored-facts year", () => {
    expect(
      resolvePeriodHonesty({
        useSampleDesk: false,
        factsIncomplete: false,
        periodWiderThanLiveWindow: false,
        periodExceedsFactWindow: false,
      }),
    ).toBe("live");
    expect(
      formatPeriodHonestyTillLabel("Month to date", {
        useSampleDesk: false,
        listingCapture: false,
      }),
    ).toBe("Month to date · live sales");
  });

  it("labels L12M past the live Shopify window as stored facts only", () => {
    expect(
      resolvePeriodHonesty({
        useSampleDesk: false,
        factsIncomplete: false,
        periodWiderThanLiveWindow: true,
      }),
    ).toBe("stored_facts");
    expect(
      formatPeriodHonestyTillLabel("Last 12 months", {
        useSampleDesk: false,
        listingCapture: false,
        periodWiderThanLiveWindow: true,
        factsIncomplete: false,
      }),
    ).toBe(`Last 12 months · ${PERIOD_HONESTY_SUFFIX.stored_facts}`);
  });

  it("labels thin SalesDayFact coverage on a wide period as incomplete stored facts", () => {
    expect(
      resolvePeriodHonesty({
        useSampleDesk: false,
        factsIncomplete: true,
        periodWiderThanLiveWindow: true,
      }),
    ).toBe("incomplete_stored_facts");
    expect(
      formatPeriodHonestyTillLabel("Last 12 months", {
        useSampleDesk: false,
        listingCapture: false,
        factsIncomplete: true,
        periodWiderThanLiveWindow: true,
      }),
    ).toBe(`Last 12 months · ${PERIOD_HONESTY_SUFFIX.incomplete_stored_facts}`);
    expect(
      formatPeriodHonestyChip({
        useSampleDesk: false,
        factsIncomplete: true,
        periodWiderThanLiveWindow: true,
      }),
    ).toBe("Incomplete · stored facts only");
  });

  it("labels a 4yr-window overshoot as incomplete stored facts", () => {
    expect(
      resolvePeriodHonesty({
        useSampleDesk: false,
        factsIncomplete: false,
        periodExceedsFactWindow: true,
        periodWiderThanLiveWindow: true,
      }),
    ).toBe("incomplete_stored_facts");
  });

  it("keeps short-window backfill as facts incomplete, not a live year", () => {
    expect(
      resolvePeriodHonesty({
        useSampleDesk: false,
        factsIncomplete: true,
        periodWiderThanLiveWindow: false,
      }),
    ).toBe("facts_incomplete");
    expect(
      formatPeriodHonestyTillLabel("Month to date", {
        useSampleDesk: false,
        listingCapture: false,
        factsIncomplete: true,
      }),
    ).toBe("Month to date · facts incomplete");
  });

  it("treats sales errors as unavailable, not live", () => {
    expect(
      resolvePeriodHonesty({
        useSampleDesk: false,
        salesError: true,
        periodWiderThanLiveWindow: true,
      }),
    ).toBe("sales_unavailable");
  });
});

describe("wide presets", () => {
  it("marks L12M and 3yr as beyond the live Shopify window", () => {
    expect(periodPresetBeyondLiveShopifyWindow("l12m")).toBe(true);
    expect(periodPresetBeyondLiveShopifyWindow("y3")).toBe(true);
    expect(periodPresetBeyondLiveShopifyWindow("mtd")).toBe(false);
    expect(periodHonestyWidePresetTitle("l12m")).toMatch(/stored sales facts only/i);
    expect(periodHonestyWidePresetTitle("mtd")).toBeUndefined();
  });
});

describe("religion", () => {
  it("does not invent pixels, MTA, or a connector zoo", () => {
    const blob = [
      PERIOD_HONESTY_SUFFIX.stored_facts,
      PERIOD_HONESTY_SUFFIX.incomplete_stored_facts,
      periodHonestyWidePresetTitle("l12m") ?? "",
      PRODUCT_NOUN.totalRoas,
    ].join("\n");
    expect(blob).not.toMatch(THEATER);
    expect(blob).toMatch(/stored facts/i);
  });
});
