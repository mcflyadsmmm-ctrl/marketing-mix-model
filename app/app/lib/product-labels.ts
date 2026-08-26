/**
 * Public product noun — Total ROAS.
 * Action default: Shopify Total Sales (`currentTotalPriceSet`) ÷ ad spend.
 * Net view: product subtotal (`currentSubtotalPriceSet`) ÷ spend.
 * Order totals (`totalPriceSet`) = Ads Manager–comparable secondary.
 * Keep code identifiers as mer* / MarketingEfficiency / till* internally.
 *
 * Admin voice: short, benefit-first (docs/MDS_RESEARCH_ABSORB.md).
 * Exact spend by platform · any period · decide any day · full transparency.
 * Ban in merchant chrome: coexist, attribution suites, cash-action ready,
 * non-actionable, path credit as a lead line, “Monday math” cringe.
 */
export const PRODUCT_NOUN = {
  /** Primary metric name shown to merchants */
  totalRoas: "Total ROAS",
  /** Short form in dense UI */
  totalRoasShort: "ROAS",
  /** Acquisition MER — new-customer sales ÷ spend (average, not causal) */
  amer: "aMER",
  amerDef: "New-customer sales ÷ spend",
  /** Goal / target label */
  totalRoasGoal: "Total ROAS Goal",
  /** Break-even threshold from margin */
  breakEvenTotalRoas: "Break-even Total ROAS",
  breakEvenShort: "Break-even",
  /** Explorer / chart */
  explorer: "Total ROAS Explorer",
  /** One-line definition — Shopify Total Sales (incl. shipping/tax; after returns) */
  definition: "Shopify Total Sales ÷ ad spend",
  /** Period-scoped definition for empty states / kickers */
  definitionForPeriod:
    "Total ROAS = Shopify Total Sales ÷ spend (after returns)",
  /** Clarify vs platform / path ROAS — use once under KPIs, not every banner */
  notTrueRoas: "Sales ÷ spend. Not platform ROAS.",
  /** Calm MDS trust line — sales-backed */
  mdsTrust:
    "Marketing Data Science from Shopify Total Sales.",
  /** Thesis — Advanced MDS for the merchant */
  mdsThesis: "See ad spend next to sales, day by day.",
  /** Decision — any day of the week */
  mondayCall: "Total ROAS vs break-even — any day",
  /**
   * Share Overview — merchant emails/forwards Total ROAS themselves (no Mcfly email).
   * Monday Close UI is retired (`docs/RETIRED_SURFACES.md`); `/app/close` redirects home.
   */
  shareOverview: "Share Overview",
  shareOverviewDef:
    "Share Total ROAS vs break-even for the period you picked — email or copy it yourself.",
  shareOverviewEmail: "Email",
  shareOverviewEmailDef:
    "Opens your email app with this period’s Total ROAS cards — Mcfly does not send mail.",
  /** Page / nav titles */
  deskTitle: "Total ROAS",
  /** Spend mix / quarterly / rolling — route /app/allocation */
  spendAllocation: "Spend Allocation",
  /** Acquisition + cohort LTV deep-dive (route /app/ltv) */
  ltvTitle: "LTV / Acquisition",
  /** Primary CTA after spend / empty states — verb + outcome */
  openTotalRoas: "Open Total ROAS",
  openSpendAllocation: "Open Spend Allocation",
  openLtv: "Open LTV / Acquisition",
  /** Enterprise MDS lab — averages, not causal channel ROAS */
  advancedMetrics: "Advanced Metrics",
  openAdvanced: "Open Advanced Metrics",
  advancedKicker:
    "Enterprise formulas · averages, not causal channel ROAS",
  /** Spend Allocation snapshot labels (facts, not AI advice) */
  allocationPrimary: "Portfolio mix",
  allocationHedge: "Spend share · Total ROAS = sales ÷ spend",
  /** Spend Allocation history strip */
  allocationHistoryHedge:
    "Spend mix in top Total ROAS windows — portfolio co-occurrence",
  /** Customer payback one-liner prefix */
  customerPayback: "Customer payback",
  nextAllocation: "Next: Spend Allocation",
  nextCustomerPayback: "Next: LTV / Acquisition",
  /** Overview payback tile defs — plain English formulas */
  cashCacDef: "Period ad spend ÷ new customers",
  ltv90Def: "Avg revenue per new customer in first 90 days",
  ltvCacDef: "LTV · 90d ÷ Cash CAC (average, not causal)",

  /** Support under thesis / empty states */
  supportLine:
    "Exact spend by platform. Sales ÷ spend. Goals. Allocate to grow.",
  /**
   * Sales SoT — Shopify Total Sales (currentTotalPriceSet): shipping, taxes,
   * duties, fees included; after returns. Cancelled/test excluded.
   */
  salesBasis:
    "Shopify Total Sales — shipping, taxes, duties & fees; after returns",
  salesBasisShort: "Shopify Total Sales",
  salesBasisNet: "Net Sales (excl. shipping & tax)",
  salesBasisTotal: "Total Sales",
  /** Hero one-liner under sales — no need to repeat “Shopify Total Sales” */
  totalSalesHeroHint: "Shipping, tax & fees included · after returns",
  /** Cash-close IA one-liner */
  cashClose:
    "Exact spend by platform · sales ÷ spend · decide any day",
  /** Allocation honesty */
  allocationHeuristic:
    "Shift spend to protect break-even. Keep at least half of this period’s spend.",
  /** Sample data | Live data — never Free/Pro/trial as a view */
  sampleData: "Sample data",
  liveData: "Live data",
  samplePeriodSuffix: " · Sample data",
  sampleHint:
    "Example numbers so you can click around. Not this shop’s Shopify sales.",
  liveDataHint:
    "This shop’s Shopify sales and the ad spend you add.",
  sampleHiddenStatus: "Sample data is hidden in Settings",
  samplePreview: "Sample data",
  samplePreviewOn: "Sample data is on — example numbers, not this shop",
  samplePreviewOffCta: "Switch to Live data",
  /** Demo page copy when Sample is on — defer to the top toggle */
  samplePreviewOffReviewKicker: "You are viewing Sample data",
  samplePreviewOffReviewTitle: "These are example numbers",
  samplePreviewOffReviewBody:
    "Use Sample data | Live data at the top of any page to switch. Live data shows this shop’s Shopify sales and the ad spend you add. Hide Sample data in Settings if you never want the example set.",
  samplePreviewLiveStore: "You are viewing Live data",
  samplePreviewLiveStoreBody:
    "This shop’s Shopify sales. Add spend on Spend. Switch to Sample data at the top anytime to try example numbers.",
  /** Founder-locked setup path labels (banner + empty-state CTAs) */
  setupAddSpend: "Add Spend",
  setupSetGoals: "Set Goals",
  setupAdjustMargin: "Adjust Profit Margin",
  /** Spend job — three steps */
  spendJob:
    "Add one day’s invoice (any platform, including billboard) → CSV only if you have many days. Same days replace.",
  /** LTV / Acquisition differentiator — till view Shopify Admin lacks */
  factsIncompleteSuffix: " · still loading sales days",
  ltvNotInShopify:
    "Shopify Analytics does not combine LTV with ad spend. Mcfly uses order history only — not email lists.",
} as const;

export type SalesBasisPreference = "total" | "net";

export function isSalesBasisPreference(
  value: unknown,
): value is SalesBasisPreference {
  return value === "total" || value === "net";
}
