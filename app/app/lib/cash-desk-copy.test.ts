import { describe, expect, it } from "vitest";
import { PRODUCT_NOUN } from "./product-labels";
import {
  CASH_PAGE_WHY,
  FIRST_TRUSTED_ROAS_GATE,
  SAMPLE_MONEY_MARK,
  formatMissingDaysRoasImpact,
  ltvCashCacTeaching,
  ltvEmptyCashCopy,
  parseLtvEmptyKind,
  resolveFirstTrustedRoasGate,
} from "./cash-desk-copy";

const THEATER =
  /web pixel|multi-touch|mta|markov|shapley|meridian|robyn|true roas|view-through|path credit/i;

describe("CASH_PAGE_WHY", () => {
  it("ties every later page to till cash in one line", () => {
    expect(CASH_PAGE_WHY.spend).toMatch(/Total ROAS/i);
    expect(CASH_PAGE_WHY.spend).toMatch(/\$0/i);
    expect(CASH_PAGE_WHY.goals).toMatch(/sales cash|Total ROAS/i);
    expect(CASH_PAGE_WHY.allocation).toMatch(/break-even/i);
    expect(CASH_PAGE_WHY.allocation).toMatch(/hold|reduce|step-test/i);
    expect(CASH_PAGE_WHY.allocation).not.toMatch(/which channels to cut or keep/i);
    expect(CASH_PAGE_WHY.ltv).toMatch(/spend/i);
    expect(CASH_PAGE_WHY.advanced).toMatch(/trust Total ROAS/i);
    const blob = Object.values(CASH_PAGE_WHY).join("\n");
    expect(blob.replace(/not pixel attribution/gi, "")).not.toMatch(THEATER);
  });
});

describe("resolveFirstTrustedRoasGate", () => {
  it("shows only for cold live desks — not SAMPLE, shot, or spend-ready", () => {
    expect(
      resolveFirstTrustedRoasGate({
        hasLiveSpend: false,
        useSampleDesk: false,
      }).show,
    ).toBe(true);
    expect(
      resolveFirstTrustedRoasGate({
        hasLiveSpend: true,
        useSampleDesk: false,
      }).show,
    ).toBe(false);
    expect(
      resolveFirstTrustedRoasGate({
        hasLiveSpend: false,
        useSampleDesk: true,
      }).show,
    ).toBe(false);
    expect(
      resolveFirstTrustedRoasGate({
        hasLiveSpend: false,
        useSampleDesk: false,
        shotMode: true,
      }).show,
    ).toBe(false);
  });

  it("points at Spend, not a maze of extra routes", () => {
    const gate = resolveFirstTrustedRoasGate({
      hasLiveSpend: false,
      useSampleDesk: false,
    });
    expect(gate.heading).toBe(FIRST_TRUSTED_ROAS_GATE.heading);
    expect(gate.primaryHref).toBe("/app/spend");
    expect(gate.primaryLabel).toMatch(/spend/i);
    expect(gate.body).toMatch(/Shopify orders/i);
    expect(gate.body).toMatch(/Cash CAC/i);
    expect(gate.body).not.toMatch(/upgrade|\$39/i);
  });
});

describe("formatMissingDaysRoasImpact", () => {
  it("explains 26 missing days inflate Total ROAS", () => {
    const copy = formatMissingDaysRoasImpact({
      missingDays: 26,
      windowDays: 27,
      periodLabel: "the last 28 days",
    });
    expect(copy.heading).toMatch(/26 days missing/i);
    expect(copy.body).toMatch(/make Total ROAS look better than cash/i);
    expect(copy.body).toMatch(/\$0 spend/i);
    expect(copy.body).toMatch(/Download blanks/i);
    expect(copy.nextLabel).toMatch(/missing/i);
  });

  it("says Total ROAS cannot run when every day is empty", () => {
    const copy = formatMissingDaysRoasImpact({
      missingDays: 27,
      windowDays: 27,
    });
    expect(copy.heading).toMatch(/cannot run/i);
    expect(copy.nextLabel).toMatch(/template/i);
  });

  it("treats zero missing as trusted coverage", () => {
    const copy = formatMissingDaysRoasImpact({
      missingDays: 0,
      windowDays: 27,
      periodLabel: "Month to date",
    });
    expect(copy.heading).toMatch(/complete/i);
    expect(copy.body).toContain(PRODUCT_NOUN.totalRoas);
    expect(copy.nextLabel).toBe(PRODUCT_NOUN.openTotalRoas);
  });
});

describe("ltvEmptyCashCopy", () => {
  it("teaches the useful sales-first next step without calling LTV broken", () => {
    for (const kind of [
      "no_timezone",
      "history_limited",
      "backfilling",
      "pro_required",
      "unknown",
    ] as const) {
      const copy = ltvEmptyCashCopy(kind);
      expect(copy.body).not.toMatch(/permanently (dead|broken|empty)/i);
      expect(copy.body).not.toMatch(THEATER);
    }
    expect(ltvEmptyCashCopy("history_limited").body).toMatch(/Acquisition above is useful now/i);
    expect(ltvEmptyCashCopy("backfilling").body).toMatch(/new vs returning sales and AOV now/i);
    expect(ltvEmptyCashCopy("backfilling").body).toMatch(/Spend can wait/i);
    expect(ltvEmptyCashCopy("no_timezone").body).toMatch(/no email CRM/i);
  });

  it("parses known empty reasons", () => {
    expect(parseLtvEmptyKind("history_limited")).toBe("history_limited");
    expect(parseLtvEmptyKind("no_spend")).toBe("unknown");
    expect(parseLtvEmptyKind("nope")).toBe("unknown");
    expect(parseLtvEmptyKind(null)).toBe("unknown");
  });
});

describe("ltvCashCacTeaching", () => {
  it("withholds Cash CAC until the selected period has spend", () => {
    expect(
      ltvCashCacTeaching({
        hasPeriodSpend: false,
        hasNewBuyerCount: true,
      }),
    ).toMatch(/Add period spend to calculate Cash CAC/i);
  });

  it("keeps cohorts useful when spend is absent and explains a missing denominator honestly", () => {
    expect(CASH_PAGE_WHY.ltv).toMatch(/Shopify order cohorts/i);
    expect(CASH_PAGE_WHY.ltv).toMatch(/Add spend only/i);
    expect(CASH_PAGE_WHY.ltv).toMatch(/no email CRM/i);
    expect(
      ltvCashCacTeaching({
        hasPeriodSpend: true,
        hasNewBuyerCount: false,
      }),
    ).toMatch(/new-buyer count is still needed/i);
  });
});

describe("SAMPLE_MONEY_MARK", () => {
  it("cannot be read as live money", () => {
    expect(SAMPLE_MONEY_MARK).toMatch(/SAMPLE/);
    expect(SAMPLE_MONEY_MARK).toMatch(/not live money/i);
    expect(SAMPLE_MONEY_MARK).not.toMatch(/your store|live Shopify till/i);
  });
});
