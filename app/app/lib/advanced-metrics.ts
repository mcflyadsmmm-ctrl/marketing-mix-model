/**
 * Advanced Metrics lab — pure tile builders from DashboardMetrics.
 * Averages / portfolio math only — never channel ROAS or causal claims.
 */

import { computeGrossMer } from "./cash-close";
import { formatCurrency, formatMer } from "./mer-format";
import { roundMer, roundMoney } from "./contrib-ltv";
import {
  formatSpendCoverageLine,
  formatSpendReconLine,
  type SpendPeriodCoverage,
  type SpendReconResult,
} from "./mer-trust";
import { PRODUCT_NOUN } from "./product-labels";

/** Minimal desk shape for Advanced tiles — avoids importing mer-dashboard.server. */
export type AdvancedMetricsInput = {
  sales: number;
  totalSalesAmount: number;
  grossSales: number;
  grossSalesKnown: boolean;
  netSales: number;
  netSalesKnown: boolean;
  salesBasis: "total" | "net";
  orderCount: number;
  newCustomers: number;
  returningCustomers: number;
  newCustomerNetSales: number;
  guestOrders: number;
  customerMetricsAvailable: boolean;
  totalSpend: number;
  mer: number | null;
  amer: number | null;
  breakEvenMer: number | null;
  targetMer: number;
  channelMix: Array<{ channel: string; amount: number; share: number }>;
  spendCoverage: SpendPeriodCoverage;
  spendRecon: SpendReconResult | null;
  control: {
    headroomPeriod: number;
    headroomMonth: number;
    headroomDay: number;
    remainingDays: number;
    densityLabel: string;
    statusLabel: string;
    salesProgressPct: number;
    calendarProgressPct: number;
    progressCls: string;
  };
  deltas: {
    priorLabel: string;
    priorSales: number;
    priorSpend: number;
    priorMer: number | null;
    salesPct: number | null;
    spendPct: number | null;
    merAbs: number | null;
  } | null;
  allocation: {
    why: string;
    suggestedTestDays: number;
    actions: Array<{
      type: string;
      channel: string;
      percentChange?: number;
    }>;
  } | null;
  tillLtv: {
    available: boolean;
    emptyReason: string | null;
    historyLimited: boolean;
    avgRevenueD30: number | null;
    avgRevenueD90: number | null;
    avgRevenueD365: number | null;
    cashCac: number | null;
    newBuyers: number;
    ltvCacRatio: number | null;
    repeatRate: number | null;
  };
};

export type AdvancedTile = {
  id: string;
  label: string;
  value: string;
  formula: string;
  caveat: string;
};

export type AdvancedSection = {
  id: string;
  title: string;
  open?: boolean;
  tiles: AdvancedTile[];
  /** When set, section shows Pro upsell instead of tiles. */
  lockedReason?: string;
};

function merOrDash(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—.——";
  return formatMer(roundMer(n));
}

function moneyOrDash(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return formatCurrency(roundMoney(n));
}

function pctOrDash(n: number | null | undefined, digits = 0): string {
  if (n == null || !Number.isFinite(n)) return "—";
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(digits)}%`;
}

/**
 * Build Advanced Metrics sections from desk metrics.
 * `canUseLtv` gates the acquisition/LTV section (Pro / SAMPLE).
 */
export function buildAdvancedSections(
  metrics: AdvancedMetricsInput,
  options: { canUseLtv: boolean; periodLabel: string },
): AdvancedSection[] {
  const { canUseLtv, periodLabel } = options;
  const spend = metrics.totalSpend;
  const grossMer =
    metrics.grossSalesKnown && spend > 0
      ? computeGrossMer(metrics.grossSales, spend)
      : null;
  const netVsTotal =
    metrics.netSalesKnown && metrics.totalSalesAmount > 0
      ? metrics.totalSalesAmount - metrics.netSales
      : null;
  const vsTarget =
    metrics.mer != null && Number.isFinite(metrics.targetMer)
      ? metrics.mer - metrics.targetMer
      : null;
  const vsBe =
    metrics.mer != null && metrics.breakEvenMer != null
      ? metrics.mer - metrics.breakEvenMer
      : null;
  const aov =
    metrics.orderCount > 0 ? metrics.sales / metrics.orderCount : null;
  const maxSpendAtTarget =
    metrics.targetMer > 0 ? metrics.sales / metrics.targetMer : null;
  const maxSpendAtBe =
    metrics.breakEvenMer != null && metrics.breakEvenMer > 0
      ? metrics.sales / metrics.breakEvenMer
      : null;

  const portfolio: AdvancedSection = {
    id: "portfolio",
    title: "Portfolio efficiency",
    open: true,
    tiles: [
      {
        id: "total-roas",
        label: PRODUCT_NOUN.totalRoas,
        value: merOrDash(metrics.mer),
        formula: PRODUCT_NOUN.definitionForPeriod,
        caveat: `Basis: ${metrics.salesBasis === "net" ? PRODUCT_NOUN.salesBasisNet : PRODUCT_NOUN.salesBasisTotal}. Average portfolio efficiency — not causal.`,
      },
      {
        id: "amer",
        label: PRODUCT_NOUN.amer,
        value: merOrDash(metrics.amer),
        formula: PRODUCT_NOUN.amerDef,
        caveat: "Acquisition average for the period — not marginal or channel ROAS.",
      },
      {
        id: "gross-mer",
        label: "Gross ÷ spend",
        value: metrics.grossSalesKnown ? merOrDash(grossMer) : "—",
        formula: "Order totals (totalPriceSet) ÷ ad spend",
        caveat: metrics.grossSalesKnown
          ? "Ads Manager–comparable secondary — not action Total ROAS."
          : "Gross still backfilling — no Ads Manager claim yet.",
      },
      {
        id: "net-vs-total",
        label: "Total − Net Sales",
        value: moneyOrDash(netVsTotal),
        formula: "Total Sales − Net Sales (shipping/tax/fees delta)",
        caveat: metrics.netSalesKnown
          ? "Shows how much Total Sales sits above product subtotal."
          : "Net Sales not fully persisted yet.",
      },
      {
        id: "vs-target",
        label: "vs Target",
        value:
          vsTarget == null
            ? "—"
            : `${vsTarget >= 0 ? "+" : ""}${vsTarget.toFixed(2)}×`,
        formula: `${PRODUCT_NOUN.totalRoas} − target ${formatMer(metrics.targetMer)}`,
        caveat: "Operating goal gap for this period.",
      },
      {
        id: "vs-be",
        label: "vs Break-even",
        value:
          vsBe == null
            ? "—"
            : `${vsBe >= 0 ? "+" : ""}${vsBe.toFixed(2)}×`,
        formula: `${PRODUCT_NOUN.totalRoas} − BE ${merOrDash(metrics.breakEvenMer)}`,
        caveat: "Affordability line from margin / cost stack.",
      },
    ],
  };

  const control = metrics.control;
  const affordability: AdvancedSection = {
    id: "affordability",
    title: "Affordability control",
    open: true,
    tiles: [
      {
        id: "headroom-period",
        label: "Headroom (period)",
        value: moneyOrDash(control.headroomPeriod),
        formula: "Sales ÷ target − spend (actuals at target rail)",
        caveat: control.statusLabel,
      },
      {
        id: "headroom-month",
        label: "Headroom (pace-forward)",
        value: moneyOrDash(control.headroomMonth),
        formula: "Projected sales ÷ target − projected spend",
        caveat: "Illustrative pace — not a forecast guarantee.",
      },
      {
        id: "headroom-day",
        label: "Headroom / remaining day",
        value: moneyOrDash(control.headroomDay),
        formula: "Pace-forward headroom ÷ remaining days",
        caveat: `${control.remainingDays} days left · ${control.densityLabel}`,
      },
      {
        id: "max-at-target",
        label: "Max spend at target",
        value: moneyOrDash(maxSpendAtTarget),
        formula: "Sales ÷ target Total ROAS",
        caveat: "Ceiling if you hold sales constant at the target rail.",
      },
      {
        id: "max-at-be",
        label: "Max spend at break-even",
        value: moneyOrDash(maxSpendAtBe),
        formula: "Sales ÷ break-even Total ROAS",
        caveat: "Ceiling at the BE rail — keep a spend floor in Allocation.",
      },
      {
        id: "pace",
        label: "Sales vs calendar pace",
        value: `${Math.round(control.salesProgressPct)}% · cal ${Math.round(control.calendarProgressPct)}%`,
        formula: "Sales progress % vs calendar elapsed %",
        caveat: `Class: ${control.progressCls}`,
      },
    ],
  };

  let acquisition: AdvancedSection;
  if (!canUseLtv) {
    acquisition = {
      id: "acquisition",
      title: "Acquisition & payback",
      open: true,
      tiles: [],
      lockedReason:
        "Cash CAC, cohort LTV 30/90/365, and LTV:CAC unlock on Pro ($39/store/mo). Everything in Free stays; preview the full lab on SAMPLE.",
    };
  } else {
    const ltv = metrics.tillLtv;
    acquisition = {
      id: "acquisition",
      title: "Acquisition & payback",
      open: true,
      tiles: [
        {
          id: "new-vs-ret",
          label: "New vs returning",
          value: metrics.customerMetricsAvailable
            ? `${metrics.newCustomers.toLocaleString()} new · ${metrics.returningCustomers.toLocaleString()} returning`
            : "—",
          formula: "Shopify order customer flags (Level 1)",
          caveat: metrics.customerMetricsAvailable
            ? `${metrics.guestOrders.toLocaleString()} guest orders`
            : "Needs read_customers — reinstall if missing.",
        },
        {
          id: "aov",
          label: "AOV",
          value: moneyOrDash(aov),
          formula: "Action sales ÷ orders",
          caveat: `${metrics.orderCount.toLocaleString()} orders · ${periodLabel}`,
        },
        {
          id: "new-cust-sales",
          label: "New-customer sales",
          value: moneyOrDash(metrics.newCustomerNetSales),
          formula: "aMER numerator (new-customer sales $)",
          caveat: "Additive period sales — not unique CRM revenue.",
        },
        {
          id: "cash-cac",
          label: "Cash CAC",
          value: moneyOrDash(ltv.available ? ltv.cashCac : null),
          formula: "Period spend ÷ new buyers",
          caveat: ltv.available
            ? `${ltv.newBuyers.toLocaleString()} new buyers · blended, not platform CAC`
            : (ltv.emptyReason ?? "Cohorts unavailable"),
        },
        {
          id: "ltv-30",
          label: "LTV · 30d",
          value: moneyOrDash(ltv.available ? ltv.avgRevenueD30 : null),
          formula: "Cohort avg revenue · 30d window",
          caveat: PRODUCT_NOUN.ltvNotInShopify,
        },
        {
          id: "ltv-90",
          label: "LTV · 90d",
          value: moneyOrDash(ltv.available ? ltv.avgRevenueD90 : null),
          formula: "Cohort avg revenue · 90d window",
          caveat: "Average cohort payback — not causal.",
        },
        {
          id: "ltv-365",
          label: "LTV · 365d",
          value: moneyOrDash(ltv.available ? ltv.avgRevenueD365 : null),
          formula: "Cohort avg revenue · 365d window",
          caveat: ltv.historyLimited
            ? "History limited — longer windows may understate."
            : PRODUCT_NOUN.ltvNotInShopify,
        },
        {
          id: "ltv-cac",
          label: "LTV : CAC",
          value:
            ltv.available && ltv.ltvCacRatio != null
              ? `${ltv.ltvCacRatio.toFixed(2)}×`
              : "—",
          formula: "90d LTV ÷ cash CAC",
          caveat:
            ltv.repeatRate != null
              ? `Repeat rate ${(ltv.repeatRate * 100).toFixed(0)}% · average, not causal`
              : "Average portfolio payback ratio.",
        },
      ],
    };
  }

  const mixTiles: AdvancedTile[] = metrics.channelMix
    .filter((c) => c.amount > 0)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 8)
    .map((c) => ({
      id: `mix-${c.channel}`,
      label: c.channel,
      value: `${formatCurrency(c.amount)} · ${Math.round(c.share * 100)}%`,
      formula: "Logged CSV spend share",
      caveat: "Spend structure only — not channel ROAS.",
    }));

  const spendStructure: AdvancedSection = {
    id: "spend",
    title: "Spend structure",
    open: false,
    tiles: [
      {
        id: "coverage",
        label: "Spend coverage",
        value: `${Math.round(metrics.spendCoverage.coveragePct)}%`,
        formula: formatSpendCoverageLine(metrics.spendCoverage, periodLabel),
        caveat: metrics.spendCoverage.incomplete
          ? "Incomplete days understate spend and inflate Total ROAS."
          : "Coverage looks ready for this period.",
      },
      {
        id: "recon",
        label: "Ads Manager recon",
        value: metrics.spendRecon
          ? metrics.spendRecon.status
          : "none",
        formula: metrics.spendRecon
          ? formatSpendReconLine(metrics.spendRecon)
          : "No Ads Manager total declared for this period",
        caveat: "Optional honesty check — not a connector sync.",
      },
      ...mixTiles,
    ],
  };

  const alloc = metrics.allocation;
  const topMix = [...metrics.channelMix]
    .filter((c) => c.amount > 0)
    .sort((a, b) => b.amount - a.amount)[0];
  const allocationSnap: AdvancedSection = {
    id: "allocation",
    title: PRODUCT_NOUN.spendAllocation,
    open: false,
    tiles: [
      {
        id: "alloc-portfolio-mer",
        label: `Portfolio ${PRODUCT_NOUN.totalRoas}`,
        value: metrics.mer == null ? "—" : formatMer(metrics.mer),
        formula: "Shopify Total Sales ÷ logged ad spend",
        caveat: PRODUCT_NOUN.allocationHedge,
      },
      {
        id: "alloc-top-share",
        label: "Largest spend share",
        value: topMix
          ? `${topMix.channel} · ${Math.round(topMix.share * 100)}%`
          : alloc
            ? "—"
            : "No spend yet",
        formula: "Channel spend ÷ total spend (this period)",
        caveat: "Spend mix only — not channel causal ROAS",
      },
    ],
  };

  const deltas = metrics.deltas;
  const prior: AdvancedSection = {
    id: "prior",
    title: "Prior period",
    open: false,
    tiles: deltas
      ? [
          {
            id: "sales-delta",
            label: "Sales Δ",
            value: pctOrDash(deltas.salesPct),
            formula: `vs ${deltas.priorLabel}`,
            caveat: `Prior sales ${formatCurrency(deltas.priorSales)}`,
          },
          {
            id: "spend-delta",
            label: "Spend Δ",
            value: pctOrDash(deltas.spendPct),
            formula: `vs ${deltas.priorLabel}`,
            caveat: `Prior spend ${formatCurrency(deltas.priorSpend)}`,
          },
          {
            id: "mer-delta",
            label: `${PRODUCT_NOUN.totalRoas} Δ`,
            value:
              deltas.merAbs == null
                ? "—"
                : `${deltas.merAbs >= 0 ? "+" : ""}${deltas.merAbs.toFixed(2)}×`,
            formula: `vs ${deltas.priorLabel} (${merOrDash(deltas.priorMer)})`,
            caveat: "Absolute change in × units — average, not causal.",
          },
        ]
      : [
          {
            id: "prior-none",
            label: "Prior window",
            value: "—",
            formula: "No prior-period fetch for this preset",
            caveat: "Try MTD / QTD / YTD for YoY-style deltas.",
          },
        ],
  };

  return [
    portfolio,
    affordability,
    acquisition,
    spendStructure,
    allocationSnap,
    prior,
  ];
}
