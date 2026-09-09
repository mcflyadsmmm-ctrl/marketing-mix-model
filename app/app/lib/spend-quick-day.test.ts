import { describe, expect, it } from "vitest";
import { PRODUCT_NOUN } from "./product-labels";
import {
  formatSpendDayAmount,
  formatSpendDayLabel,
  parseQuickSpendDay,
  QUICK_SPEND_COPY,
  QUICK_SPEND_ERRORS,
  QUICK_SPEND_MAX_DAY_AMOUNT,
  quickSpendDefaultDate,
  quickSpendSavedCopy,
  roasHrefForDay,
  roasPeriodForDay,
} from "./spend-quick-day";

const THEATER =
  /pixel|web pixel|multi-touch|mta|markov|shapley|meridian|robyn|true roas|view-through|path credit/i;

const TODAY = "2026-09-08";

function typedDay(overrides: Partial<Parameters<typeof parseQuickSpendDay>[0]> = {}) {
  return parseQuickSpendDay({
    date: "2026-09-07",
    amount: "40",
    channel: "meta",
    todayKey: TODAY,
    ...overrides,
  });
}

describe("parseQuickSpendDay", () => {
  it("accepts date + amount + channel with no file involved", () => {
    const result = typedDay();
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.day).toEqual({
      dateKey: "2026-09-07",
      channel: "meta",
      channelLabel: "Meta Ads",
      amount: 40,
      note: null,
    });
    expect(result.warning).toBeNull();
  });

  it("normalizes US-style dates and money typing", () => {
    const result = typedDay({ date: "09/07/2026", amount: "$1,234.56" });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.day.dateKey).toBe("2026-09-07");
    expect(result.day.amount).toBe(1234.56);
  });

  it("allows today — a merchant knows today's spend", () => {
    expect(typedDay({ date: TODAY }).ok).toBe(true);
  });

  it("refuses a day that has not happened", () => {
    const result = typedDay({ date: "2026-09-09" });
    expect(result).toEqual({
      ok: false,
      error: QUICK_SPEND_ERRORS.dateFuture,
      field: "date",
    });
  });

  it("refuses blank / unparseable days", () => {
    expect(typedDay({ date: "   " })).toEqual({
      ok: false,
      error: QUICK_SPEND_ERRORS.dateMissing,
      field: "date",
    });
    expect(typedDay({ date: "last tuesday" })).toEqual({
      ok: false,
      error: QUICK_SPEND_ERRORS.dateUnparseable,
      field: "date",
    });
  });

  it("refuses zero, negative, blank, and EU-comma amounts", () => {
    expect(typedDay({ amount: "0" }).ok).toBe(false);
    expect(typedDay({ amount: "0" })).toEqual({
      ok: false,
      error: QUICK_SPEND_ERRORS.amountNotPositive,
      field: "amount",
    });
    expect(typedDay({ amount: "-12" })).toEqual({
      ok: false,
      error: QUICK_SPEND_ERRORS.amountNotPositive,
      field: "amount",
    });
    expect(typedDay({ amount: "" })).toEqual({
      ok: false,
      error: QUICK_SPEND_ERRORS.amountMissing,
      field: "amount",
    });
    // 12,50 is ambiguous EU decimal — spend-csv fails closed, so must this.
    expect(typedDay({ amount: "12,50" })).toEqual({
      ok: false,
      error: QUICK_SPEND_ERRORS.amountMissing,
      field: "amount",
    });
  });

  it("fat-finger guard caps one day on one channel", () => {
    expect(typedDay({ amount: String(QUICK_SPEND_MAX_DAY_AMOUNT) }).ok).toBe(true);
    expect(typedDay({ amount: "1e9" })).toEqual({
      ok: false,
      error: QUICK_SPEND_ERRORS.amountTooLarge,
      field: "amount",
    });
  });

  it("refuses unknown channels and channels off this desk", () => {
    expect(typedDay({ channel: "billboards" })).toEqual({
      ok: false,
      error: QUICK_SPEND_ERRORS.channelInvalid,
      field: "channel",
    });
    expect(
      typedDay({ channel: "tiktok", allowedChannels: ["meta", "google"] }),
    ).toEqual({
      ok: false,
      error: QUICK_SPEND_ERRORS.channelNotAllowed,
      field: "channel",
    });
    expect(
      typedDay({ channel: "meta", allowedChannels: ["meta", "google"] }).ok,
    ).toBe(true);
  });

  it("requires a name for `other` and keeps it as the note", () => {
    expect(typedDay({ channel: "other" })).toEqual({
      ok: false,
      error: QUICK_SPEND_ERRORS.customNameMissing,
      field: "customName",
    });
    const named = typedDay({ channel: "other", customName: "  Influencers  " });
    expect(named.ok).toBe(true);
    if (!named.ok) return;
    expect(named.day.note).toBe("Influencers");
    expect(named.day.channelLabel).toBe("Other · Influencers");
  });

  it("warns (never blocks) when the day predates the Shopify sales window", () => {
    const result = typedDay({
      date: "2023-06-01",
      salesFloorKey: "2024-01-01",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.warning).toMatch(/no matching sales/i);
    expect(typedDay({ date: "2026-01-05", salesFloorKey: "2024-01-01" }).ok).toBe(
      true,
    );
  });
});

describe("quickSpendDefaultDate", () => {
  it("pre-fills the newest closed day that still has $0 spend", () => {
    expect(
      quickSpendDefaultDate({
        todayKey: TODAY,
        missingDates: ["2026-09-02", "2026-09-05", "2026-09-03"],
      }),
    ).toBe("2026-09-05");
  });

  it("falls back to yesterday with no holes, across a month edge", () => {
    expect(quickSpendDefaultDate({ todayKey: TODAY })).toBe("2026-09-07");
    expect(quickSpendDefaultDate({ todayKey: "2026-09-01" })).toBe("2026-08-31");
    expect(quickSpendDefaultDate({ todayKey: "2027-01-01" })).toBe("2026-12-31");
  });

  it("never pre-fills today or the future", () => {
    expect(
      quickSpendDefaultDate({
        todayKey: TODAY,
        missingDates: [TODAY, "2026-09-20", "garbage"],
      }),
    ).toBe("2026-09-07");
  });
});

describe("roasPeriodForDay", () => {
  it("picks the tightest Overview period containing the saved day", () => {
    expect(roasPeriodForDay("2026-09-07", TODAY)).toBe("mtd");
    expect(roasPeriodForDay("2026-08-30", TODAY)).toBe("lm");
    expect(roasPeriodForDay("2026-07-04", TODAY)).toBe("qtd");
    expect(roasPeriodForDay("2026-02-14", TODAY)).toBe("ytd");
    expect(roasPeriodForDay("2024-02-14", TODAY)).toBe("l12m");
  });

  it("treats a January today's previous month as last month, not last year", () => {
    expect(roasPeriodForDay("2025-12-20", "2026-01-05")).toBe("lm");
  });

  it("links Overview with stay=1 so first-open never bounces back to Spend", () => {
    expect(roasHrefForDay("2026-09-07", TODAY)).toBe("/app?stay=1&period=mtd");
  });
});

describe("quickSpendSavedCopy", () => {
  const base = {
    dateKey: "2026-09-07",
    channelLabel: "Meta Ads",
    amount: 40,
    todayKey: TODAY,
    replaced: false,
    firstLiveSpend: true,
  };

  it("sends the first live spend to a period that holds that day", () => {
    const copy = quickSpendSavedCopy(base);
    expect(copy.heading).toMatch(/First spend day/i);
    expect(copy.body).toContain("Meta Ads · $40 on Sep 7, 2026");
    expect(copy.body).toContain(PRODUCT_NOUN.definition);
    expect(copy.primaryLabel).toBe(PRODUCT_NOUN.openTotalRoas);
    expect(copy.primaryHref).toBe("/app?stay=1&period=mtd");
    expect(copy.note).toBeNull();
  });

  it("never states a ROAS number or attribution theater", () => {
    const blob = Object.values(
      quickSpendSavedCopy({ ...base, missingDays: 4 }),
    ).join("\n");
    expect(blob).not.toMatch(THEATER);
    expect(blob).not.toMatch(/\b\d+(\.\d+)?x\b/i);
    expect(blob).not.toMatch(/ROAS is \d/i);
  });

  it("says which days are still $0 instead of implying full coverage", () => {
    expect(quickSpendSavedCopy({ ...base, missingDays: 1 }).note).toMatch(
      /1 closed day .* \$0 spend/i,
    );
    expect(quickSpendSavedCopy({ ...base, missingDays: 4 }).note).toMatch(
      /reads higher than cash/i,
    );
  });

  it("prefers the sales-window warning over the coverage nag", () => {
    const copy = quickSpendSavedCopy({
      ...base,
      missingDays: 9,
      salesFloorWarning: "Saved. Shopify sales history starts later.",
    });
    expect(copy.note).toBe("Saved. Shopify sales history starts later.");
  });

  it("says replaced out loud on a repeat save of the same day", () => {
    const copy = quickSpendSavedCopy({
      ...base,
      firstLiveSpend: false,
      replaced: true,
      amount: 12.5,
    });
    expect(copy.heading).toBe("Spend saved");
    expect(copy.body).toContain("$12.50");
    expect(copy.body).toMatch(/replaced the earlier line/i);
  });
});

describe("typed-path copy", () => {
  it("promises no download and no ad-network login", () => {
    const blob = Object.values(QUICK_SPEND_COPY).join("\n");
    expect(blob).toMatch(/No file/i);
    expect(blob).not.toMatch(/download/i);
    expect(blob).not.toMatch(/oauth|connect meta|connect google/i);
    expect(blob).not.toMatch(THEATER);
    expect(blob).not.toMatch(/upgrade|\$39|free plan/i);
  });

  it("formats a single day for merchant eyes", () => {
    expect(formatSpendDayLabel("2026-09-07")).toBe("Sep 7, 2026");
    expect(formatSpendDayAmount(40)).toBe("$40");
    expect(formatSpendDayAmount(12.5)).toBe("$12.50");
  });
});
