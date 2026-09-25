/**
 * Spend Upload + Total ROAS empty-state rhythm (Lifetimely steal map craft).
 * Deterministic Signal / Evidence / Next move — never an AI Profit Agent.
 * Religion: Total ROAS = Shopify sales ÷ entered spend; empty = —, never 0×.
 */

export type SpendFinding = {
  signal: string;
  evidence: string;
  next: string;
};

/** Louder MER framing — Amp buries MER; Mcfly leads with it. */
export const HONEST_MER_LINE =
  "Honest MER = Shopify sales ÷ entered spend — not attributed campaign ROAS.";

export const CERTIFIED_WINDOWS_KICKER =
  "Certified windows · honest MER = sales ÷ entered spend";

/** First-fold label when entered spend is missing. Not a zero multiple. */
export const SPEND_EMPTY_MER_STRIP = "Need spend";

/** Live Spend Upload with no rows yet — doors stay input-only. */
export function spendUploadEmptyFinding(): SpendFinding {
  return {
    signal: "No spend on file yet",
    evidence:
      "Empty spend is not a certified $0 — and never paints 0× on Total ROAS.",
    next: "Type yesterday’s channel spend, or paste daily rows. Channel names are yours — no Ads Manager login.",
  };
}

/** Total ROAS with sales but no entered spend — scoreboard shells stay —, never 0×. */
export function totalRoasEmptySpendFinding(): SpendFinding {
  return {
    signal: "Sales without entered spend",
    evidence: HONEST_MER_LINE,
    next: "Open Upload Spend to certify Yesterday / last N / month / quarter / year against your goal in Settings.",
  };
}
