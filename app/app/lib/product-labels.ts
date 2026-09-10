/**
 * Public product noun — Mcfly Analytics.
 * Overview: order-book stats Shopify Analytics does not show.
 * Marketing section: Total ROAS = Shopify Total Sales ÷ ad spend.
 * Net view: product subtotal (`currentSubtotalPriceSet`) ÷ spend.
 * Order totals (`totalPriceSet`) = Ads Manager–comparable secondary.
 * Keep code identifiers as mer* / MarketingEfficiency / till* internally.
 *
 * Admin voice: short, benefit-first (docs/MDS_RESEARCH_ABSORB.md).
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
  salesExplorer: "Sales explorer",
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
  mdsThesis: "Deeper Shopify numbers Analytics does not show.",
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
  overviewTitle: "Overview",
  ordersTitle: "Orders",
  ordersMuted:
    "Typical order, discounts, returns, items — not Shopify’s average.",
  buyersTitle: "Buyers",
  buyersMuted:
    "New vs returning dollars, guests, days to a second order. No spend.",
  timingTitle: "Timing",
  timingMuted: "Weekends, busiest hour, Online vs POS. Shop-local, not ads.",
  marketingSection: "Marketing",
  uploadSpend: "Upload Spend",
  /** Spend mix / quarterly / rolling — route /app/allocation */
  spendAllocation: "Spend Allocation",
  /** Acquisition + cohort LTV deep-dive (route /app/ltv) */
  ltvTitle: "LTV",
  /** Primary CTA after spend / empty states — verb + outcome */
  openTotalRoas: "Open Total ROAS",
  openSpendAllocation: "Open Spend Allocation",
  openLtv: "Open LTV",
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
  nextCustomerPayback: "Next: LTV",
  /** Overview payback tile defs — plain English formulas */
  cashCacDef: "Period ad spend ÷ new customers",
  cashCacNeedsSpend: "Add spend — Cash CAC is spend ÷ new customers",
  ltv90Def: "Avg revenue per new customer in first 90 days",
  ltv30Def: "Avg revenue per new customer in first 30 days",
  ltv365Def: "Avg revenue per new customer in first 365 days",
  shopifyBookTitle: "Deeper than Analytics",
  shopifyBookMuted:
    "From this shop’s orders. Stats Overview skips. Last ~60 days. Spend optional.",
  bookGroupPeriod: "This period",
  bookGroupBuyers: "Buyers",
  bookGroupTiming: "Timing",
  bookTypicalOrder: "Typical order",
  bookTypicalOrderDef:
    "Middle order — Shopify’s average gets pulled up by a few large orders.",
  bookMostOrders: "Most orders",
  bookMostOrdersDef: "The middle half of orders, not the biggest and smallest.",
  bookGuestCheckouts: "Guest checkouts",
  bookWeekendSales: "Weekend sales",
  bookBusiestWeekday: "Busiest weekday",
  bookOrdersPerBuyer: "Orders per buyer",
  bookSalesPerBuyer: "Sales per buyer",
  bookSalesClock: "Original · after returns · product",
  bookSalesClockDef: "Checkout total · after returns · product only.",
  bookReturnsEdits: "Returns & edits",
  bookOneOrderBuyers: "Buyers with one order",
  bookOneOrderBuyersDef:
    "Identified buyers with exactly one order in this window.",
  bookDiscountedOrders: "Discounted orders",
  bookDiscountedOrdersDef: "Share of orders that used a discount — not the code.",
  bookChannelMix: "Online · POS · Shop",
  bookChannelMixDef: "Where the order was placed — not which ad.",
  bookItemsPerOrder: "Items per order",
  bookItemsPerOrderDef: "Units on the order. Not product names or SKUs.",
  bookBusiestHour: "Busiest hour",
  bookBusiestHourDef: "Shop-local hour with the most sales.",
  bookTypicalDay: "Typical day",
  bookTypicalDayDef:
    "Middle daily Total Sales. Average days get pulled up by a few big ones.",
  bookTypicalDayEmpty: "Needs five days with sales — not $0.",
  bookSecondWithin30: "Second order in 30 days",
  bookSecondWithin30Def:
    "First-time buyers who came back within 30 days. Last ~60 days of orders.",
  bookSecondWithin30Empty:
    "Needs more first-time buyers with 30 days to come back.",
  bookSecondVsThird: "2nd vs 3rd+ buyers",
  bookSecondVsThirdDef:
    "Identified buyers with two orders vs three or more this window.",
  bookSecondVsThirdEmpty: "Needs more buyers with a second order.",
  bookSecondVsFirst: "Second vs first order",
  bookSecondVsFirstDef:
    "Typical second order vs typical first, among buyers with two orders.",
  bookSecondVsFirstEmpty: "Needs more buyers with a second order.",
  ltvSnapMutedNoSpend:
    "What new buyers spend in 30 / 90 / 365 days. Orders only.",
  ltvSnapMutedWithSpend:
    "What new buyers spend in 30 / 90 / 365 days · spend ÷ new customers when spend exists.",
  goalsSnapTitle: "Goals vs calendar",
  goalsSnapMuted: "MTD / QTD / YTD vs days elapsed. Spend optional.",
  ltvCacDef: "LTV · 90d ÷ Cash CAC (average, not causal)",

  /** Support under thesis / empty states */
  supportLine:
    "Order-book stats Shopify Overview skips. Spend is optional.",
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
    "This shop’s Shopify sales. Add daily spend on Upload Spend. Switch to Sample data at the top anytime to try example numbers.",
  /** Founder-locked setup path labels (banner + empty-state CTAs) */
  setupAddSpend: "Upload Spend",
  setupSetGoals: "Set Goals",
  setupAdjustMargin: "Adjust Profit Margin",
  /** Spend job — three steps */
  spendJob:
    "Download the daily template → fill spend by channel → upload it. Same days replace.",
  /** LTV / Acquisition differentiator — till view Shopify Admin lacks */
  factsIncompleteSuffix: " · still loading sales days",
  ltvNotInShopify:
    "Shopify Analytics does not show first-order-month till LTV (30/90/365d) on this sales basis. Mcfly uses order history only — not email lists. Cash CAC needs spend.",
} as const;

export type SalesBasisPreference = "total" | "net";

export function isSalesBasisPreference(
  value: unknown,
): value is SalesBasisPreference {
  return value === "total" || value === "net";
}
