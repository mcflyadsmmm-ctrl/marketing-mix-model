/**
 * Public product noun — Total ROAS.
 * Math is unchanged: sales ÷ ad spend, not path / “true ROAS.”
 * Keep code identifiers as mer* / MarketingEfficiency internally.
 */
export const PRODUCT_NOUN = {
  /** Primary metric name shown to merchants */
  totalRoas: "Total ROAS",
  /** Short form in dense UI */
  totalRoasShort: "ROAS",
  /** Goal / target label */
  totalRoasGoal: "Total ROAS Goal",
  /** Break-even threshold from margin */
  breakEvenTotalRoas: "Break-even Total ROAS",
  breakEvenShort: "Break-even",
  /** Explorer / chart */
  explorer: "Total ROAS Explorer",
  /** One-line definition */
  definition: "sales ÷ ad spend",
  /** Period-scoped definition for empty states / kickers */
  definitionForPeriod: "Total ROAS = sales ÷ spend for this period",
  /** Clarify vs platform / path ROAS */
  notTrueRoas: "Sales ÷ spend. Not path credit.",
  /** Calm MDS trust line — till-backed, not path credit */
  mdsTrust: "Marketing Data Science from your sales — not path credit.",
  /** Thesis — Advanced MDS for the merchant */
  mdsThesis: "Advanced Marketing Data Science for your business",
  /** Monday ritual one-liner */
  mondayCall: "Your Monday call — Total ROAS vs break-even",
  /** Page / nav titles that used to say Marketing Efficiency */
  deskTitle: "Total ROAS",
  /** Dedicated customer cohort deep-dive */
  ltvTitle: "Customer Lifetime Value",
  /** Primary CTA after spend / empty states — verb + outcome */
  openTotalRoas: "Open Total ROAS",
  openLtv: "Open Customer LTV",
  /** Support under thesis / empty states */
  supportLine:
    "Total ROAS is sales ÷ ad spend — then break-even, then one budget move.",
} as const;
