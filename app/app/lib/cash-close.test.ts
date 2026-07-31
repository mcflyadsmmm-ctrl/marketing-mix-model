import { describe, expect, it, vi } from "vitest";

vi.mock("../db.server", () => ({
  default: {
    cashClose: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
    },
  },
}));

import {
  buildCloseExceptions,
  canLockCashClose,
  closeDecisionUiCopy,
  formatCashCloseCsv,
  formatCashCloseMemo,
  formatOverviewShareText,
  computeGrossMer,
  returnsHaircut,
  isCloseDecision,
  MAX_CUT_PCT,
  parseExceptionsJson,
  validateCloseDecision,
  type CloseMetricsInput,
} from "./cash-close";

function baseMetrics(
  overrides: Partial<CloseMetricsInput> = {},
): CloseMetricsInput {
  return {
    period: {
      start: new Date("2026-07-01T00:00:00.000Z"),
      end: new Date("2026-07-28T23:59:59.999Z"),
      label: "Month to date",
    },
    netSales: 100_000,
    grossSales: 110_000,
    totalSpend: 25_000,
    mer: 4,
    breakEvenMer: 2.86,
    marginPct: 0.35,
    cashActionReady: true,
    marginStale: false,
    spendCoverage: {
      daysWithSpend: 20,
      daysInPeriod: 27,
      coveragePct: 74,
      incomplete: false,
    },
    spendRecon: {
      status: "ok",
      csvTotal: 25_000,
      declared: 25_000,
      deltaPct: 0,
      thresholdPct: 5,
    },
    onboarding: { settingsSaved: true, hasSpend: true },
    ...overrides,
  };
}

describe("closeDecisionUiCopy", () => {
  it("returns short merchant hints for each decision", () => {
    expect(closeDecisionUiCopy("hold").hint).toMatch(/Average Total ROAS/);
    expect(closeDecisionUiCopy("reduce").hint).toMatch(/Illustrative/);
    expect(closeDecisionUiCopy("step_test").hint).toMatch(
      /Illustrative step-test/,
    );
    expect(closeDecisionUiCopy("step_test").hint).toMatch(
      /Average ≠ marginal ROAS/,
    );
    expect(closeDecisionUiCopy("hold").label).toMatch(/Hold/i);
  });
});

describe("validateCloseDecision", () => {
  it("accepts hold and clears cutPct", () => {
    expect(validateCloseDecision("hold", 20)).toEqual({
      ok: true,
      decision: "hold",
      cutPct: null,
    });
  });

  it("requires cutPct for reduce and step_test", () => {
    expect(validateCloseDecision("reduce", null).ok).toBe(false);
    expect(validateCloseDecision("step_test", undefined).ok).toBe(false);
    expect(validateCloseDecision("reduce", 25)).toEqual({
      ok: true,
      decision: "reduce",
      cutPct: 25,
    });
  });

  it(`rejects cut above ${MAX_CUT_PCT}%`, () => {
    const bad = validateCloseDecision("step_test", 51);
    expect(bad.ok).toBe(false);
  });

  it("rejects unknown decision", () => {
    expect(isCloseDecision("scale")).toBe(false);
    expect(validateCloseDecision("scale", 10).ok).toBe(false);
  });
});

describe("buildCloseExceptions + canLockCashClose", () => {
  it("blocks lock without margin or spend", () => {
    expect(
      canLockCashClose(
        baseMetrics({ onboarding: { settingsSaved: false, hasSpend: true } }),
      ).ok,
    ).toBe(false);
    expect(
      canLockCashClose(
        baseMetrics({ onboarding: { settingsSaved: true, hasSpend: false } }),
      ).ok,
    ).toBe(false);
    expect(canLockCashClose(baseMetrics()).ok).toBe(true);
  });

  it("blocks lock when salesError or salesFactsIncomplete", () => {
    expect(
      canLockCashClose(baseMetrics({ salesError: "Failed to load sales" })).ok,
    ).toBe(false);
    expect(
      canLockCashClose(baseMetrics({ salesFactsIncomplete: true })).ok,
    ).toBe(false);
  });

  it("marks margin unconfirmed and no spend as blocking", () => {
    const ex = buildCloseExceptions(
      baseMetrics({
        onboarding: { settingsSaved: false, hasSpend: false },
        cashActionReady: false,
        spendRecon: null,
      }),
    );
    expect(ex.some((e) => e.code === "margin_unconfirmed" && e.blocking)).toBe(
      true,
    );
    expect(ex.some((e) => e.code === "no_spend" && e.blocking)).toBe(true);
  });

  it("blocks lock and marks coverage incomplete as blocking", () => {
    const incomplete = baseMetrics({
      cashActionReady: false,
      marginStale: true,
      spendCoverage: {
        daysWithSpend: 10,
        daysInPeriod: 27,
        coveragePct: 37,
        incomplete: true,
      },
      spendRecon: {
        status: "drift",
        csvTotal: 25_000,
        declared: 30_000,
        deltaPct: -0.167,
        thresholdPct: 5,
      },
    });
    const ex = buildCloseExceptions(incomplete);
    expect(ex.find((e) => e.code === "coverage_incomplete")?.blocking).toBe(
      true,
    );
    expect(ex.find((e) => e.code === "recon_drift")?.blocking).toBe(false);
    expect(ex.find((e) => e.code === "margin_stale")?.blocking).toBe(false);
    expect(ex.find((e) => e.code === "cash_action_not_ready")?.blocking).toBe(
      false,
    );
    expect(ex.some((e) => e.code === "sales_basis")).toBe(true);
    expect(canLockCashClose(incomplete).ok).toBe(false);
    // Recon drift alone does not block lock when coverage is complete
    expect(
      canLockCashClose(
        baseMetrics({
          cashActionReady: false,
          spendCoverage: {
            daysWithSpend: 27,
            daysInPeriod: 27,
            coveragePct: 100,
            incomplete: false,
          },
        }),
      ).ok,
    ).toBe(true);
  });
});

describe("formatCashCloseCsv + parseExceptionsJson", () => {
  it("emits a header row and finance fields", () => {
    const csv = formatCashCloseCsv({
      id: "cl_1",
      periodLabel: "Month to date",
      periodStart: new Date("2026-07-01T00:00:00.000Z"),
      periodEnd: new Date("2026-07-28T23:59:59.999Z"),
      lockedAt: new Date("2026-07-28T12:00:00.000Z"),
      netSales: 100_000,
      grossSales: 110_000,
      spend: 25_000,
      mer: 4,
      breakEvenMer: 2.86,
      marginPct: 0.35,
      coveragePct: 74,
      reconStatus: "ok",
      cashActionReady: true,
      decision: "hold",
      decisionNote: null,
      cutPct: null,
      deltaSales: 5_000,
      deltaSpend: 1_000,
      deltaMer: 0.2,
      exceptionsJson: "[]",
    });
    const lines = csv.trim().split("\n");
    expect(lines).toHaveLength(2);
    expect(lines[0]).toContain("net_sales");
    expect(lines[0]).toContain("total_roas");
    expect(lines[0]).toContain("gross_total_roas");
    expect(lines[1]).toContain("cl_1");
    expect(lines[1]).toContain("100000");
    expect(lines[1]).toContain("hold");
    expect(lines[1]).toContain("35"); // margin as percent points
    expect(lines[1]).toContain("4.4"); // 110000/25000 gross mer
  });

  it("formats a forwardable Export memo", () => {
    const closeRow = {
      id: "cl_1",
      periodLabel: "Month to date",
      periodStart: new Date("2026-07-01T00:00:00.000Z"),
      periodEnd: new Date("2026-07-28T23:59:59.999Z"),
      lockedAt: new Date("2026-07-28T12:00:00.000Z"),
      netSales: 100_000,
      grossSales: 110_000,
      spend: 25_000,
      mer: 4,
      breakEvenMer: 2.86,
      marginPct: 0.35,
      coveragePct: 74,
      reconStatus: "ok",
      cashActionReady: true,
      decision: "hold",
      decisionNote: "Keep Meta pace",
      cutPct: null,
      deltaSales: 5_000,
      deltaSpend: 1_000,
      deltaMer: 0.2,
      exceptionsJson: "[]",
    };
    const memo = formatCashCloseMemo(closeRow, {
      statusLabel: "Sales ahead of calendar pace",
      headroomPeriod: 12_000,
      remainingDays: 3,
      densityLabel: "20 / 27 days with spend",
    });
    expect(memo).toContain("Export memo");
    expect(memo).toContain("SHOPIFY SALES");
    expect(memo).toContain("decision number");
    expect(memo).toContain("Ads Manager–comparable");
    expect(memo).toContain("Shopify sales after returns ÷ ad spend");
    expect(memo).not.toContain("TILL");
    expect(memo).not.toContain("not action");
    expect(memo).toContain("Keep Meta pace");
    expect(memo).toContain("Safe-spend headroom");
    expect(memo).not.toContain("aMER");
    expect(computeGrossMer(110_000, 25_000)).toBeCloseTo(4.4);
    expect(returnsHaircut(110_000, 100_000)).toEqual({
      dollars: 10_000,
      pct: 10_000 / 110_000,
    });
    expect(returnsHaircut(100_000, 100_000)).toBeNull();

    const withAmer = formatCashCloseMemo(closeRow, null, {
      newCustomerNetSales: 50_000,
    });
    expect(withAmer).toContain("aMER");
    expect(withAmer).toContain("New-customer net");
    expect(withAmer).toContain("average, not causal");
    expect(withAmer).toContain("2.00×"); // 50000/25000
  });

  it("memo Window uses shopLocalDayKey when IANA tz is known", () => {
    const closeRow = {
      id: "cl_tz",
      periodLabel: "Month to date",
      // Sydney Jul 1 local start = 2026-06-30T14:00:00.000Z (AEST).
      periodStart: new Date("2026-06-30T14:00:00.000Z"),
      periodEnd: new Date("2026-07-14T13:59:59.999Z"),
      lockedAt: new Date("2026-07-15T02:00:00.000Z"),
      netSales: 10_000,
      grossSales: 11_000,
      spend: 2_500,
      mer: 4,
      breakEvenMer: 2.86,
      marginPct: 0.35,
      coveragePct: 80,
      reconStatus: "ok",
      cashActionReady: true,
      decision: "hold",
      decisionNote: null,
      cutPct: null,
      deltaSales: null,
      deltaSpend: null,
      deltaMer: null,
      exceptionsJson: "[]",
    };
    const tz = "Australia/Sydney";
    const memo = formatCashCloseMemo(closeRow, null, null, tz);
    expect(memo).toContain("Window: 2026-07-01 → 2026-07-14");
    expect(memo).not.toContain("Window: 2026-06-30 → 2026-07-14");
    // Without tz, falls back to UTC ISO date slice.
    const utcMemo = formatCashCloseMemo(closeRow);
    expect(utcMemo).toContain("Window: 2026-06-30 → 2026-07-14");
  });

  it("formats Overview share text for merchant email", () => {
    const text = formatOverviewShareText({
      periodLabel: "Month to date",
      periodStartDay: "2026-07-01",
      periodEndDay: "2026-07-28",
      totalSales: 100_000,
      totalSpend: 25_000,
      mer: 4,
      breakEvenMer: 2.86,
      marginPct: 0.35,
      spendIncomplete: true,
      shopLabel: "demo.myshopify.com",
      channels: [
        { name: "Meta Ads", amount: 15_000, share: 0.6 },
        { name: "Google Ads", amount: 10_000, share: 0.4 },
      ],
      salesDeltaLine: "+11% vs prior",
    });
    expect(text).toContain("Total ROAS");
    expect(text).toContain("Shopify Total Sales");
    expect(text).not.toMatch(/Net sales/i);
    expect(text).toContain("demo.myshopify.com");
    expect(text).toContain("incomplete");
    expect(text).toContain("4.00×");
    expect(text).toContain("Meta Ads");
    expect(text).toContain("60%");
  });

  it("parses exceptions JSON safely", () => {
    expect(parseExceptionsJson("not-json")).toEqual([]);
    expect(
      parseExceptionsJson(
        JSON.stringify([
          { code: "a", label: "A", blocking: true },
          { code: 1 },
        ]),
      ),
    ).toEqual([{ code: "a", label: "A", blocking: true }]);
  });
});
