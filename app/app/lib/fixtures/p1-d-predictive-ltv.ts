/**
 * P1-D contract. The Customers LTV chip must show this label as text.
 * A missing input paints {@link missingDisplay}, never {@link missingMustNot}.
 */
export const P1D_PREDICTIVE_LTV_FIXTURE = {
  label: "Estimate — formula: average order value × expected orders",
  missingDisplay: "—",
  missingMustNot: "$0",
  aovWords: "net dollars ÷ orders",
  ordersWords: "1 + ",
} as const;
