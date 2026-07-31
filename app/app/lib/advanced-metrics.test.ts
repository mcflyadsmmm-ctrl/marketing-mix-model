import { describe, expect, it } from "vitest";
import {
  buildAdvancedSections,
  type AdvancedMetricsInput,
} from "./advanced-metrics";

function baseMetrics(
  overrides: Partial<AdvancedMetricsInput> = {},
): AdvancedMetricsInput {
  return {
    sales: 100_000,
    totalSalesAmount: 100_000,
    grossSales: 110_000,
    grossSalesKnown: true,
    netSales: 90_000,
    netSalesKnown: true,
    salesBasis: "total",
    orderCount: 500,
    newCustomers: 200,
    returningCustomers: 300,
    newCustomerNetSales: 40_000,
    guestOrders: 10,
    customerMetricsAvailable: true,
    totalSpend: 25_000,
    mer: 4,
    amer: 1.6,
    breakEvenMer: 2.5,
    targetMer: 4,
    channelMix: [
      { channel: "meta", amount: 15_000, share: 0.6 },
      { channel: "google", amount: 10_000, share: 0.4 },
    ],
    spendCoverage: {
      daysWithSpend: 28,
      daysInPeriod: 30,
      coveragePct: 93,
      incomplete: false,
    },
    spendRecon: null,
    control: {
      headroomPeriod: 0,
      headroomMonth: 1000,
      headroomDay: 50,
      remainingDays: 2,
      densityLabel: "dense",
      statusLabel: "On rail",
      salesProgressPct: 90,
      calendarProgressPct: 93,
      progressCls: "good",
    },
    deltas: {
      priorLabel: "prior 30d",
      priorSales: 90_000,
      priorSpend: 22_000,
      priorMer: 4.09,
      salesPct: 11,
      spendPct: 14,
      merAbs: -0.09,
    },
    allocation: {
      why: "Above break-even — hold mix",
      suggestedTestDays: 7,
      actions: [{ type: "hold", channel: "—" }],
    },
    tillLtv: {
      available: true,
      emptyReason: "backfilling",
      historyLimited: false,
      avgRevenueD30: 80,
      avgRevenueD90: 120,
      avgRevenueD365: 200,
      cashCac: 125,
      newBuyers: 200,
      ltvCacRatio: 0.96,
      repeatRate: 0.2,
    },
    ...overrides,
  };
}

describe("buildAdvancedSections", () => {
  it("includes aMER and gross MER in portfolio when gross known", () => {
    const sections = buildAdvancedSections(baseMetrics(), {
      canUseLtv: true,
      periodLabel: "Last 30 days",
    });
    const portfolio = sections.find((s) => s.id === "portfolio");
    expect(portfolio?.tiles.some((t) => t.id === "amer")).toBe(true);
    expect(portfolio?.tiles.some((t) => t.id === "gross-mer")).toBe(true);
    const gross = portfolio?.tiles.find((t) => t.id === "gross-mer");
    expect(gross?.value).toMatch(/4\.40/);
  });

  it("locks acquisition when canUseLtv is false", () => {
    const sections = buildAdvancedSections(baseMetrics(), {
      canUseLtv: false,
      periodLabel: "Last 30 days",
    });
    const acq = sections.find((s) => s.id === "acquisition");
    expect(acq?.lockedReason).toMatch(/Pro/i);
    expect(acq?.tiles).toHaveLength(0);
  });

  it("surfaces allocation portfolio facts", () => {
    const sections = buildAdvancedSections(baseMetrics(), {
      canUseLtv: true,
      periodLabel: "Last 30 days",
    });
    const alloc = sections.find((s) => s.id === "allocation");
    const mer = alloc?.tiles.find((t) => t.id === "alloc-portfolio-mer");
    expect(mer?.value).toMatch(/4\.00/);
    const top = alloc?.tiles.find((t) => t.id === "alloc-top-share");
    expect(top?.value).toMatch(/meta/i);
  });
});
