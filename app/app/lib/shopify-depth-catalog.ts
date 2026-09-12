/**
 * Spend-free Shopify depth catalog — every Overview-replacement insight
 * with a tab home and chart kind. Marketing Spend is excluded here.
 */

export type DepthTab = "sales" | "customers" | "goals";

export type DepthChartKind =
  | "kpi_row"
  | "bars"
  | "share"
  | "histogram"
  | "ranked"
  | "curve"
  | "heatmap"
  | "table"
  | "callout";

export type DepthDataNeed =
  | "day_facts"
  | "order_facts"
  | "line_items"
  | "history"
  | "goals";

/** core = first viewport; more = advanced (expand when history can fill it). */
export type DepthDensity = "core" | "more";

export type DepthFeature = {
  id: string;
  tab: DepthTab;
  title: string;
  blurb: string;
  chart: DepthChartKind;
  needs: DepthDataNeed;
  /**
   * core = always on first viewport for small stores / calm demo.
   * more = advanced depth — expand when history (or SAMPLE) can fill it.
   */
  tier: DepthDensity;
};

/** Full spend-free list — Sales / Customers / Goals only. */
export const SHOPIFY_DEPTH_CATALOG: readonly DepthFeature[] = [
  // —— Sales: calendar & pace ——
  {
    id: "weekday_rhythm",
    tab: "sales",
    title: "Weekday rhythm",
    blurb: "Mon–Sun sales share — where the week actually earns.",
    chart: "bars",
    needs: "day_facts",
    tier: "core",
  },
  {
    id: "weekend_vs_weekday",
    tab: "sales",
    title: "Weekend vs weekday",
    blurb: "Sat–Sun vs Mon–Fri sales mix for the period.",
    chart: "share",
    needs: "day_facts",
    tier: "core",
  },
  {
    id: "day_of_month",
    tab: "sales",
    title: "Day-of-month pattern",
    blurb: "Which calendar dates in the month carry the most sales.",
    chart: "bars",
    needs: "day_facts",
    tier: "more",
  },
  {
    id: "hour_of_day",
    tab: "sales",
    title: "Hour-of-day orders",
    blurb: "When orders land in shop time — Analytics buries this.",
    chart: "bars",
    needs: "order_facts",
    tier: "core",
  },
  {
    id: "sales_volatility",
    tab: "sales",
    title: "Day-to-day volatility",
    blurb: "How feast-or-famine daily sales are in this period.",
    chart: "kpi_row",
    needs: "day_facts",
    tier: "core",
  },
  {
    id: "sales_streaks",
    tab: "sales",
    title: "Above / below average streaks",
    blurb: "Longest runs above and below the period’s daily average.",
    chart: "callout",
    needs: "day_facts",
    tier: "more",
  },
  {
    id: "pace_vs_prior",
    tab: "sales",
    title: "Pace vs prior period",
    blurb: "Sales, orders, and AOV versus the matched prior window.",
    chart: "kpi_row",
    needs: "day_facts",
    tier: "core",
  },
  {
    id: "closed_day_honesty",
    tab: "sales",
    title: "Closed days vs today",
    blurb: "How many shop-local days are closed facts vs still open.",
    chart: "kpi_row",
    needs: "day_facts",
    tier: "core",
  },
  {
    id: "seasonality_dow",
    tab: "sales",
    title: "Seasonality vs baseline",
    blurb: "This period’s weekday mix vs an 8-week baseline when history exists.",
    chart: "bars",
    needs: "history",
    tier: "more",
  },
  // —— Sales: order shape ——
  {
    id: "aov_mean",
    tab: "sales",
    title: "Average order value",
    blurb: "Mean AOV for the period — next to the distribution below.",
    chart: "kpi_row",
    needs: "day_facts",
    tier: "core",
  },
  {
    id: "aov_distribution",
    tab: "sales",
    title: "AOV distribution",
    blurb: "Order-size buckets (p50 context) — not just the average.",
    chart: "histogram",
    needs: "order_facts",
    tier: "more",
  },
  {
    id: "order_size_histogram",
    tab: "sales",
    title: "Order size histogram",
    blurb: "Count of orders by dollar band.",
    chart: "histogram",
    needs: "order_facts",
    tier: "more",
  },
  {
    id: "sales_basis_compare",
    tab: "sales",
    title: "Gross vs net vs total",
    blurb: "Sales basis haircut when Shopify facts expose the split.",
    chart: "share",
    needs: "day_facts",
    tier: "more",
  },
  {
    id: "refund_haircut",
    tab: "sales",
    title: "Refund / return haircut",
    blurb: "Returns pressure on the period when net vs gross is known.",
    chart: "kpi_row",
    needs: "day_facts",
    tier: "more",
  },
  {
    id: "discount_dependency",
    tab: "sales",
    title: "Discount dependency",
    blurb: "Needs line-item / discount allocations on orders.",
    chart: "kpi_row",
    needs: "line_items",
    tier: "core",
  },
  {
    id: "shipping_share",
    tab: "sales",
    title: "Shipping share of order",
    blurb: "Needs shipping lines on order ingest.",
    chart: "kpi_row",
    needs: "line_items",
    tier: "more",
  },
  {
    id: "tax_duty_share",
    tab: "sales",
    title: "Tax / duty share",
    blurb: "Needs tax lines on order ingest.",
    chart: "kpi_row",
    needs: "line_items",
    tier: "more",
  },
  {
    id: "guest_vs_logged_in",
    tab: "sales",
    title: "Guest vs logged-in",
    blurb: "Guest checkout share of orders and sales.",
    chart: "share",
    needs: "order_facts",
    tier: "more",
  },
  {
    id: "same_day_multi",
    tab: "sales",
    title: "Same-day multi-order buyers",
    blurb: "Buyers who placed more than one order on the same shop day.",
    chart: "kpi_row",
    needs: "order_facts",
    tier: "more",
  },
  {
    id: "units_per_order",
    tab: "sales",
    title: "Units / lines per order",
    blurb: "Needs line items on order ingest.",
    chart: "kpi_row",
    needs: "line_items",
    tier: "more",
  },
  {
    id: "day_board",
    tab: "sales",
    title: "Day board",
    blurb: "Every day: sales, orders, AOV, new-buyer share.",
    chart: "table",
    needs: "day_facts",
    tier: "core",
  },
  {
    id: "strongest_softest_day",
    tab: "sales",
    title: "Strongest & softest day",
    blurb: "Peak and trough shop-local days in the period.",
    chart: "callout",
    needs: "day_facts",
    tier: "core",
  },
  {
    id: "new_vs_returning_sales",
    tab: "sales",
    title: "New vs returning sales",
    blurb: "Attributed sales split — not just order counts.",
    chart: "share",
    needs: "day_facts",
    tier: "core",
  },
  {
    id: "wow_mom_yoy",
    tab: "sales",
    title: "WoW / MoM / YoY movers",
    blurb: "Period deltas when a comparable prior window exists.",
    chart: "kpi_row",
    needs: "history",
    tier: "more",
  },
  {
    id: "what_changed",
    tab: "sales",
    title: "What changed",
    blurb: "Plain-English movers from the biggest period deltas.",
    chart: "callout",
    needs: "day_facts",
    tier: "core",
  },
  {
    id: "sales_export",
    tab: "sales",
    title: "Day board export",
    blurb: "CSV of the day board — Sheets replacement.",
    chart: "callout",
    needs: "day_facts",
    tier: "more",
  },
  // —— Customers ——
  {
    id: "second_order_30_60_90",
    tab: "customers",
    title: "2nd-order rate (30 / 60 / 90)",
    blurb: "Maturity-gated repeat — only buyers old enough to count.",
    chart: "bars",
    needs: "order_facts",
    tier: "core",
  },
  {
    id: "median_days_to_second",
    tab: "customers",
    title: "Median days to 2nd order",
    blurb: "How long a typical repeater takes.",
    chart: "kpi_row",
    needs: "order_facts",
    tier: "core",
  },
  {
    id: "third_plus_rate",
    tab: "customers",
    title: "3rd+ order rate",
    blurb: "Share of buyers who reach a third purchase (mature cohorts).",
    chart: "kpi_row",
    needs: "order_facts",
    tier: "more",
  },
  {
    id: "one_and_done",
    tab: "customers",
    title: "One-and-done rate",
    blurb: "Mature buyers still on a single order.",
    chart: "kpi_row",
    needs: "order_facts",
    tier: "core",
  },
  {
    id: "first_vs_subsequent",
    tab: "customers",
    title: "First vs subsequent $",
    blurb: "Revenue from first orders vs all later orders.",
    chart: "share",
    needs: "order_facts",
    tier: "core",
  },
  {
    id: "time_between_orders",
    tab: "customers",
    title: "Time between orders",
    blurb: "Gap distribution between consecutive purchases.",
    chart: "histogram",
    needs: "order_facts",
    tier: "more",
  },
  {
    id: "first_aov_vs_returning",
    tab: "customers",
    title: "First AOV vs returning AOV",
    blurb: "Ticket size on first purchase vs later ones.",
    chart: "bars",
    needs: "order_facts",
    tier: "more",
  },
  {
    id: "repeat_lag_curve",
    tab: "customers",
    title: "Repeat revenue lag curve",
    blurb: "Cumulative repeat $ by days since first order.",
    chart: "curve",
    needs: "order_facts",
    tier: "more",
  },
  {
    id: "cohort_ltv_30_90_365",
    tab: "customers",
    title: "Cohort LTV 30 / 90 / 365",
    blurb: "Average revenue per new buyer at classic horizons.",
    chart: "bars",
    needs: "order_facts",
    tier: "more",
  },
  {
    id: "cohort_quality_rank",
    tab: "customers",
    title: "Cohort month quality",
    blurb: "Which first-order months aged into the most revenue.",
    chart: "ranked",
    needs: "order_facts",
    tier: "more",
  },
  {
    id: "buyer_concentration",
    tab: "customers",
    title: "Buyer concentration",
    blurb: "Top 10% / 20% lifetime revenue share.",
    chart: "bars",
    needs: "order_facts",
    tier: "core",
  },
  {
    id: "concentration_trend",
    tab: "customers",
    title: "Concentration trend",
    blurb: "Whether whale share is rising vs an earlier window.",
    chart: "kpi_row",
    needs: "order_facts",
    tier: "more",
  },
  {
    id: "whale_board",
    tab: "customers",
    title: "Whale board",
    blurb: "Top buyers by lifetime $ (opaque ids — no CRM).",
    chart: "ranked",
    needs: "order_facts",
    tier: "more",
  },
  {
    id: "rfm_lite",
    tab: "customers",
    title: "RFM-lite segments",
    blurb: "Recency · frequency · monetary bands from order facts only.",
    chart: "share",
    needs: "order_facts",
    tier: "more",
  },
  {
    id: "lapsing_risk",
    tab: "customers",
    title: "Lapsing risk",
    blurb: "Once-buyers quiet past the typical repurchase window.",
    chart: "kpi_row",
    needs: "order_facts",
    tier: "more",
  },
  {
    id: "reactivation_share",
    tab: "customers",
    title: "Reactivation share",
    blurb: "Lapsed buyers who ordered again in this period.",
    chart: "kpi_row",
    needs: "order_facts",
    tier: "more",
  },
  {
    id: "new_buyer_quality",
    tab: "customers",
    title: "New-buyer quality",
    blurb: "New buyers vs their sales contribution this period.",
    chart: "kpi_row",
    needs: "order_facts",
    tier: "core",
  },
  {
    id: "returning_sales_share",
    tab: "customers",
    title: "Returning sales share",
    blurb: "Period sales from returning buyers.",
    chart: "share",
    needs: "day_facts",
    tier: "core",
  },
  // —— Goals (sales only; no margin / ROAS) ——
  {
    id: "sales_goal_mtd",
    tab: "goals",
    title: "Sales goal pace",
    blurb: "MTD / QTD / YTD against the sales goal you set.",
    chart: "kpi_row",
    needs: "goals",
    tier: "core",
  },
  {
    id: "sales_goal_board",
    tab: "goals",
    title: "Monthly goal board",
    blurb: "Actual vs goal vs prior year by month.",
    chart: "table",
    needs: "goals",
    tier: "core",
  },
  {
    id: "yoy_grow",
    tab: "goals",
    title: "YoY grow presets",
    blurb: "Set monthly goals from prior-year actuals.",
    chart: "callout",
    needs: "goals",
    tier: "core",
  },
];

export function depthFeaturesForTab(
  tab: DepthTab,
  density: DepthDensity | "all" = "all",
): DepthFeature[] {
  return SHOPIFY_DEPTH_CATALOG.filter((f) => {
    if (f.tab !== tab) return false;
    if (density === "all") return true;
    if (density === "core") return f.tier === "core";
    return f.tier === "more";
  });
}

export function depthFeatureById(
  id: string,
): DepthFeature | undefined {
  return SHOPIFY_DEPTH_CATALOG.find((f) => f.id === id);
}
