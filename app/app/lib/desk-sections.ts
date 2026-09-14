/**
 * Named section composition for Sales / Customers depth desks.
 * Feature ids match `SHOPIFY_DEPTH_CATALOG` exactly.
 */

export type DeskSectionId =
  | "rhythm"
  | "change"
  | "order_shape"
  | "repeat"
  | "concentration"
  | "more";

export type DeskSectionDef = {
  id: DeskSectionId;
  title: string;
  blurb: string;
  featureIds: readonly string[];
  heroFeatureId?: string;
};

/** Sales story desk — day_board lives on Days. */
export const SALES_DESK_SECTIONS: readonly DeskSectionDef[] = [
  {
    id: "rhythm",
    title: "Rhythm",
    blurb: "Where the week earns — weekday mix and new vs returning share.",
    heroFeatureId: "weekday_rhythm",
    featureIds: [
      "weekday_rhythm",
      "weekend_vs_weekday",
      "new_vs_returning_sales",
      "strongest_softest_day",
    ],
  },
  {
    id: "change",
    title: "What changed",
    blurb: "Pace, volatility, and the plain-English movers for this period.",
    heroFeatureId: "what_changed",
    featureIds: [
      "what_changed",
      "pace_vs_prior",
      "sales_volatility",
      "closed_day_honesty",
      "aov_mean",
    ],
  },
  {
    id: "order_shape",
    title: "Order shape",
    blurb: "Distribution and economics when order history can fill them.",
    featureIds: [
      "aov_distribution",
      "order_size_histogram",
      "sales_basis_compare",
      "refund_haircut",
      "discount_dependency",
      "shipping_share",
      "tax_duty_share",
      "guest_vs_logged_in",
      "same_day_multi",
      "units_per_order",
      "hour_of_day",
      "day_of_month",
      "sales_streaks",
      "seasonality_dow",
      "wow_mom_yoy",
      "sales_export",
    ],
  },
] as const;

/** Customers desk — buyer ledger is a separate hero table on the route. */
export const CUSTOMERS_DESK_SECTIONS: readonly DeskSectionDef[] = [
  {
    id: "repeat",
    title: "Repeat health",
    blurb: "Second-order pace and returning sales share for the period.",
    heroFeatureId: "second_order_30_60_90",
    featureIds: [
      "second_order_30_60_90",
      "returning_sales_share",
      "median_days_to_second",
      "one_and_done",
      "first_vs_subsequent",
      "third_plus_rate",
    ],
  },
  {
    id: "concentration",
    title: "Concentration",
    blurb: "Who carries revenue — top-decile share and whale board.",
    heroFeatureId: "buyer_concentration",
    featureIds: [
      "buyer_concentration",
      "whale_board",
      "concentration_trend",
      "new_buyer_quality",
    ],
  },
  {
    id: "more",
    title: "More depth",
    blurb: "Cohorts, RFM-lite, and reactivation when history is thick enough.",
    featureIds: [
      "cohort_ltv_30_90_365",
      "cohort_quality_rank",
      "repeat_lag_curve",
      "time_between_orders",
      "first_aov_vs_returning",
      "rfm_lite",
      "lapsing_risk",
      "reactivation_share",
    ],
  },
] as const;

/** Features that moved to ledger desks — hide from Sales chart dump. */
export const SALES_LEDGER_FEATURE_IDS = new Set(["day_board"]);

export function deskSectionsForTab(
  tab: "sales" | "customers",
): readonly DeskSectionDef[] {
  return tab === "sales" ? SALES_DESK_SECTIONS : CUSTOMERS_DESK_SECTIONS;
}
