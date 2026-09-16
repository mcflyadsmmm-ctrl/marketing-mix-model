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
  amer: "New sales ÷ spend",
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
   * Share Overview — merchant emails/forwards the period themselves (no Mcfly email).
   * Monday Close UI is retired (`docs/RETIRED_SURFACES.md`); `/app/close` redirects home.
   * Sales-first when spend is empty; Total ROAS only once spend is on file.
   */
  shareOverview: "Share Overview",
  shareOverviewDef:
    "Share this period’s Shopify Total Sales — and Total ROAS once you’ve added spend. Email or copy it yourself.",
  shareOverviewEmail: "Email",
  shareOverviewEmailDef:
    "Opens your email app with this period’s sales (and Total ROAS if spend is on file) — Mcfly does not send mail.",
  /** Page / nav titles */
  deskTitle: "Total ROAS",
  overviewTitle: "Overview",
  ordersTitle: "Orders",
  ordersMuted:
    "Typical order, discounts, returns, items, weekends, Online vs POS — not Shopify’s average.",
  buyersTitle: "Customers",
  buyersMuted:
    "Returning dollars, guests, who spends more. No spend. LTV is its own tab.",
  growthTitle: "Growth",
  growthMuted:
    "New customers and who came back. Not an email list, not ads.",
  timingTitle: "Timing",
  timingMuted: "Weekends, busiest hour, Online vs POS. Shop-local, not ads.",
  marketingSection: "Marketing",
  uploadSpend: "Upload Spend",
  /** Spend mix / quarterly / rolling — route /app/allocation */
  spendAllocation: "Channel Allocation",
  /** Acquisition + cohort LTV deep-dive (route /app/ltv) */
  ltvTitle: "LTV",
  /** Primary CTA after spend / empty states — verb + outcome */
  openTotalRoas: "Open Total ROAS",
  openOverview: "Open Overview",
  openSpendAllocation: "Open Channel Allocation",
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
  nextAllocation: "Next: Channel Allocation",
  nextCustomerPayback: "Next: LTV",
  /** Overview payback tile defs — plain English formulas */
  cashCacDef: "Period ad spend ÷ new customers",
  cashCacNeedsSpend: "Add spend — Cash CAC is spend ÷ new customers",
  ltv90Def:
    "Avg revenue per new-on-file buyer in the first 90 days after their first order in this Shopify window — not lifetime first if they bought before this crawl",
  ltv30Def:
    "Avg revenue per new-on-file buyer in the first 30 days after their first order in this Shopify window",
  ltv365Def:
    "Avg revenue per new-on-file buyer in the first 365 days after their first order in this Shopify window",
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
  goalsSnapMuted: "This month, this quarter, and this year vs days elapsed. Spend optional.",
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
    "Example sales and spend so you can click around. Not this shop’s Shopify sales, and not spend you typed.",
  liveDataHint:
    "This shop’s Shopify sales and the ad spend you add.",
  sampleHiddenStatus: "Sample data is hidden in Settings",
  samplePreview: "Sample data",
  samplePreviewOn: "Sample data is on — example numbers, not this shop",
  samplePreviewOffCta: "Switch to Live data",
  /** Demo page copy when Sample is on — switch lives in Settings */
  samplePreviewOffReviewKicker: "You are viewing Sample data",
  samplePreviewOffReviewTitle: "These are example numbers",
  samplePreviewOffReviewBody:
    "Switch Sample data | Live data in Settings. Live data shows this shop’s Shopify sales and the ad spend you add. Hide Sample data in Settings if you never want the example set.",
  samplePreviewLiveStore: "You are viewing Live data",
  samplePreviewLiveStoreBody:
    "This shop’s Shopify sales. Add daily spend on Spend Upload. Switch to Sample data in Settings to try example numbers.",
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
    "What a new customer spends in their first 30, 90, and 365 days — Shopify Analytics does not put this on one screen. Order history only, never email lists. Spend is optional.",
  controlAsOf: "Through",
  monthClose: "Finish the month",
  mtdFlatClose: "If this month stays even",
  l7Close: "If the last 7 days continue",
  spendLeftAtGoal: "Spend left at your goal",
  salesStillNeeded: "Sales still needed",
  spendRoom: "Spend you can still add",
  spendOverGoal: "Spend over goal",
  vsLastMonth: "This month vs last month",
  vsLastYearMonth: "This month vs last year",
  emailStays: "Email stays as-is",
  hitGoal: "Hit goal",
  missedGoal: "Below goal",
  holdSalesCut: "Cut one channel · sales held flat",
} as const;

export type SalesBasisPreference = "total" | "net";

export function isSalesBasisPreference(
  value: unknown,
): value is SalesBasisPreference {
  return value === "total" || value === "net";
}
