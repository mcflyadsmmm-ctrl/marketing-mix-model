/**
 * Public product noun — Total ROAS.
 * Math is unchanged: Total Sales (currentTotalPriceSet, after returns) ÷ ad spend,
 * not path / “true ROAS.” Order totals = Ads Manager–comparable secondary.
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
  /** Acquisition MER — new-customer net ÷ spend (average, not causal) */
  amer: "aMER",
  amerDef: "New-customer sales ÷ spend",
  /** Goal / target label */
  totalRoasGoal: "Total ROAS Goal",
  /** Break-even threshold from margin */
  breakEvenTotalRoas: "Break-even Total ROAS",
  breakEvenShort: "Break-even",
  /** Explorer / chart */
  explorer: "Total ROAS Explorer",
  /** One-line definition — Shopify sales after returns (currentTotalPriceSet) */
  definition: "Shopify sales after returns ÷ ad spend",
  /** Period-scoped definition for empty states / kickers */
  definitionForPeriod:
    "Total ROAS = sales ÷ spend for this period",
  /** Clarify vs platform / path ROAS — use once under KPIs, not every banner */
  notTrueRoas: "Sales ÷ spend. Not platform ROAS.",
  /** Calm MDS trust line — sales-backed */
  mdsTrust:
    "Marketing Data Science from Shopify sales after returns.",
  /** Thesis — Advanced MDS for the merchant */
  mdsThesis: "Advanced Marketing Data Science, made easy",
  /** Decision — any day of the week */
  mondayCall: "Total ROAS vs break-even — any day",
  /**
   * Share Overview — merchant emails/forwards Total ROAS themselves (no Mcfly email).
   * Legacy mondayClose keys kept for any residual deep links; route /app/close redirects home.
   */
  mondayClose: "Share Overview",
  mondayCloseDef:
    "Share Total ROAS vs break-even for the period you picked — email or copy it yourself.",
  shareOverview: "Share Overview",
  shareOverviewDef:
    "Email or copy Total ROAS vs break-even for this period — Mcfly does not send mail for you.",
  /** Page / nav titles */
  deskTitle: "Total ROAS",
  /** Dedicated customer cohort deep-dive */
  ltvTitle: "Customer Lifetime Value",
  /** Primary CTA after spend / empty states — verb + outcome */
  openTotalRoas: "Open Total ROAS",
  openLtv: "Open Customer LTV",
  /** Support under thesis / empty states */
  supportLine:
    "Exact spend by platform. Sales ÷ spend. Goals. Allocate to grow.",
  /**
   * Sales SoT honesty — action Total ROAS uses currentTotalPriceSet (after returns);
   * gross (totalPriceSet) is Ads Manager–comparable secondary.
   */
  salesBasis:
    "Shopify sales after returns · cancelled/test excluded · Order totals shown as Ads Manager–comparable",
  salesBasisShort: "Sales after returns",
  /** Cash-close IA one-liner */
  cashClose:
    "Exact spend by platform · sales ÷ spend · decide any day",
  /** Allocation honesty */
  allocationHeuristic:
    "Shift spend to protect break-even. Keep at least half of this period’s spend.",
  /** SAMPLE preview — listing / rehearsal only (not live store) */
  samplePreview: "SAMPLE preview",
  samplePreviewOn: "SAMPLE preview is on — not your live store",
  samplePreviewOffCta: "Use my real store",
  /** Demo hero when SAMPLE ON — App Store / install smoke path */
  samplePreviewOffReviewKicker: "Before App Store review",
  samplePreviewOffReviewTitle: "Turn SAMPLE preview OFF",
  samplePreviewOffReviewBody:
    "Use the Sample | Real store switch at the top of any page — or hide Sample for good in Settings. Reviewers must see live Shopify sales ÷ your spend.",
  samplePreviewLiveStore: "Using your real store",
  samplePreviewLiveStoreBody:
    "Live Shopify sales. Log spend on Spend anytime. Use the top Sample | Real switch to practice again, or hide Sample in Settings.",
  /** Founder-locked setup path labels (banner + empty-state CTAs) */
  setupAddSpend: "Add Spend",
  setupSetGoals: "Set Goals",
  setupAdjustMargin: "Adjust Profit Margin",
  /** Spend job — three steps */
  spendJob:
    "Download a blank template → fill daily ad spend → paste or upload. Same days replace.",
} as const;
