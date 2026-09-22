/**
 * P2-A contract. Overview and Goals must show this formula as text.
 * A missing input paints {@link missingDisplay}, never {@link missingMustNot}
 * and never {@link missingPercentMustNot}.
 */
export const P2A_ORDER_HISTORY_FORECAST_FIXTURE = {
  label: "Next month = typical day × days in that month",
  method:
    "Typical day is the median of stored days with sales. Honest estimate — not a black box.",
  missingDisplay: "—",
  missingMustNot: "$0",
  missingPercentMustNot: "0%",
} as const;
