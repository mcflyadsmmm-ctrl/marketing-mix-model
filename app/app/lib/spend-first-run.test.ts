import { describe, expect, it } from "vitest";
import {
  SPEND_BILL_ANCHOR,
  SPEND_FIRST_RUN_COPY,
  SPEND_TRUSTED_COVERAGE_RATIO,
  billSpreadPreviewLine,
  billSpreadPrimaryLabel,
  billSpreadSavedCopy,
  resolveBillSpreadCoverage,
  trustedCoverageDays,
} from "./spend-first-run";
import { planLumpSpread } from "./spend-period-allocate";

/** 28 closed days ending 2026-09-09 (today = 2026-09-10). */
function coverageWindow(filledDates: string[] = []) {
  const filled = new Set(filledDates);
  const days: { dateKey: string; filled: boolean }[] = [];
  for (let i = 27; i >= 0; i--) {
    const day = new Date(Date.UTC(2026, 8, 9) - i * 86_400_000)
      .toISOString()
      .slice(0, 10);
    days.push({ dateKey: day, filled: filled.has(day) });
  }
  return days;
}

describe("trustedCoverageDays", () => {
  it("holds the ~70% bar the critique measured trust against", () => {
    expect(SPEND_TRUSTED_COVERAGE_RATIO).toBe(0.7);
    expect(trustedCoverageDays(28)).toBe(20);
    expect(trustedCoverageDays(10)).toBe(7);
    expect(trustedCoverageDays(0)).toBe(0);
    expect(trustedCoverageDays(Number.NaN)).toBe(0);
  });
});

describe("resolveBillSpreadCoverage", () => {
  it("counts what one month of spread does to closed-day coverage", () => {
    const plan = planLumpSpread({
      totalAmount: 1200,
      periodType: "month",
      anchor: "2026-08",
      channel: "meta",
    });
    expect(plan.ok).toBe(true);
    if (!plan.ok) return;

    const coverage = resolveBillSpreadCoverage({
      closedDays: coverageWindow(),
      planStartDateYmd: plan.plan.startDateYmd,
      planEndDateYmd: plan.plan.endDateYmd,
      todayKey: "2026-09-10",
    });

    // Aug 13 – Aug 31 of the 28-day window fall inside an August bill.
    expect(coverage.windowDays).toBe(28);
    expect(coverage.filledBefore).toBe(0);
    expect(coverage.addedDays).toBe(19);
    expect(coverage.filledAfter).toBe(19);
    expect(coverage.futureDays).toBe(0);
    expect(coverage.trustedAfter).toBe(false);
    expect(coverage.headline).toContain("19 of 28 closed days");
    expect(coverage.note).toMatch(/about 20 of 28/);
    expect(coverage.note).toMatch(/month before this one/i);
  });

  it("clears the trust bar once two bills cover the window", () => {
    const august = planLumpSpread({
      totalAmount: 1200,
      periodType: "month",
      anchor: "2026-08",
      channel: "meta",
    });
    expect(august.ok).toBe(true);
    if (!august.ok) return;
    const alreadyFilled = august.plan.days.map((d) => d.date);

    const september = planLumpSpread({
      totalAmount: 900,
      periodType: "month",
      anchor: "2026-09",
      channel: "meta",
    });
    expect(september.ok).toBe(true);
    if (!september.ok) return;

    const coverage = resolveBillSpreadCoverage({
      closedDays: coverageWindow(alreadyFilled),
      planStartDateYmd: september.plan.startDateYmd,
      planEndDateYmd: september.plan.endDateYmd,
      todayKey: "2026-09-10",
    });

    expect(coverage.filledBefore).toBe(19);
    expect(coverage.addedDays).toBe(9);
    expect(coverage.filledAfter).toBe(28);
    expect(coverage.trustedAfter).toBe(true);
    expect(coverage.note).toMatch(/act on/i);
  });

  it("says plainly that unclosed days in the bill are not trusted", () => {
    const september = planLumpSpread({
      totalAmount: 900,
      periodType: "month",
      anchor: "2026-09",
      channel: "meta",
    });
    expect(september.ok).toBe(true);
    if (!september.ok) return;

    const coverage = resolveBillSpreadCoverage({
      closedDays: coverageWindow(),
      planStartDateYmd: september.plan.startDateYmd,
      planEndDateYmd: september.plan.endDateYmd,
      todayKey: "2026-09-10",
    });

    // Sep 10 – Sep 30 inclusive.
    expect(coverage.futureDays).toBe(21);
    expect(coverage.note).toMatch(/have not happened yet/);
    expect(coverage.note).toMatch(/only divides closed days/);
  });

  it("never counts a filled day twice or exceeds the window", () => {
    const plan = planLumpSpread({
      totalAmount: 500,
      periodType: "year",
      anchor: "2026-01",
      channel: "google",
    });
    expect(plan.ok).toBe(true);
    if (!plan.ok) return;

    const coverage = resolveBillSpreadCoverage({
      closedDays: coverageWindow(["2026-09-01", "2026-09-02"]),
      planStartDateYmd: plan.plan.startDateYmd,
      planEndDateYmd: plan.plan.endDateYmd,
      todayKey: "2026-09-10",
    });

    expect(coverage.filledAfter).toBe(28);
    expect(coverage.addedDays).toBe(26);
    expect(coverage.ratioAfter).toBe(1);
  });

  it("survives an empty coverage window without inventing trust", () => {
    const coverage = resolveBillSpreadCoverage({
      closedDays: [],
      planStartDateYmd: "2026-08-01",
      planEndDateYmd: "2026-08-31",
      todayKey: "2026-09-10",
    });
    expect(coverage.windowDays).toBe(0);
    expect(coverage.trustedAfter).toBe(false);
    expect(coverage.headline).toMatch(/no closed day/i);
  });
});

describe("billSpreadPrimaryLabel", () => {
  it("names the work in sentence case once a plan exists", () => {
    expect(billSpreadPrimaryLabel({ dayCount: 31 })).toBe(
      "Spread across 31 days",
    );
    expect(billSpreadPrimaryLabel({ dayCount: 1 })).toBe("Spread across 1 day");
  });

  it("falls back before an amount is typed, and says why when SAMPLE blocks it", () => {
    expect(billSpreadPrimaryLabel(null)).toBe(
      SPEND_FIRST_RUN_COPY.fallbackPrimaryLabel,
    );
    expect(billSpreadPrimaryLabel({ dayCount: 31 }, { blocked: true })).toBe(
      SPEND_FIRST_RUN_COPY.blockedPrimaryLabel,
    );
    expect(SPEND_FIRST_RUN_COPY.blockedPrimaryLabel).toMatch(/Real store/);
  });
});

describe("billSpreadPreviewLine", () => {
  it("shows the daily rate, the day count, and the window", () => {
    const plan = planLumpSpread({
      totalAmount: 1200,
      periodType: "month",
      anchor: "2026-08",
      channel: "meta",
    });
    expect(plan.ok).toBe(true);
    if (!plan.ok) return;
    const line = billSpreadPreviewLine(plan.plan);
    expect(line).toContain("$38.71 a day");
    expect(line).toContain("31 days");
    expect(line).toContain("Aug 1, 2026 → Aug 31, 2026");
  });
});

describe("billSpreadSavedCopy", () => {
  const saved = billSpreadSavedCopy({
    dayCount: 31,
    dailyAmount: 38.71,
    totalAmount: 1200,
    startDateYmd: "2026-08-01",
    endDateYmd: "2026-08-31",
    channelLabel: "Meta Ads",
    missingDays: 9,
  });

  it("reports what was written and hands off to Total ROAS", () => {
    expect(saved.heading).toBe("31 days of spend are on the desk");
    expect(saved.body).toContain("Meta Ads");
    expect(saved.body).toContain("$1,200");
    expect(saved.body).toContain("$38.71 a day");
    expect(saved.primaryLabel).toBe("Open Total ROAS");
    expect(saved.primaryHref).toBe("/app?stay=1");
    expect(saved.secondaryHref).toBe(`#${SPEND_BILL_ANCHOR}`);
  });

  it("keeps the equal-split assumption and the remaining holes honest", () => {
    expect(saved.note).toContain("9 closed days");
    expect(saved.note).toContain("Equal daily split");
    expect(saved.note).toMatch(/replaces that row/);
  });


  it("prefers the sales-window warning when spend predates sales history", () => {
    const warned = billSpreadSavedCopy({
      dayCount: 31,
      dailyAmount: 38.71,
      totalAmount: 1200,
      startDateYmd: "2019-08-01",
      endDateYmd: "2019-08-31",
      channelLabel: "Meta Ads",
      salesWindowWarning: "Some spend days start before 2024-01-01.",
    });
    expect(warned.note).toBe("Some spend days start before 2024-01-01.");
  });

  it("never prints a multiple or asks for an ad-network login", () => {
    const blob = [
      SPEND_FIRST_RUN_COPY.billHeading,
      SPEND_FIRST_RUN_COPY.billHint,
      SPEND_FIRST_RUN_COPY.billBody,
      SPEND_FIRST_RUN_COPY.previewTitle,
      SPEND_FIRST_RUN_COPY.downloadLabel,
      SPEND_FIRST_RUN_COPY.equalSplitNote,
      SPEND_FIRST_RUN_COPY.dayLede,
      saved.heading,
      saved.body,
      saved.note,
    ].join("\n");
    expect(blob).not.toMatch(/\d+(\.\d+)?×|\bROAS of\b/);
    expect(blob).not.toMatch(/connect (meta|google)|oauth|pixel|attribution/i);
    expect(blob).not.toMatch(/upgrade|\$39/i);
    expect(SPEND_FIRST_RUN_COPY.billBody).toContain(
      "Shopify Total Sales ÷ ad spend",
    );
  });
});
