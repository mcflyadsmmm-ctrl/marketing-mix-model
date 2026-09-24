import { formatCurrency } from "../lib/mer-format";
import { useDeskCurrency } from "../lib/desk-currency";
import { useDeskDrill } from "./DeskDrill";
import { DeskIcon } from "./DeskIcon";
import {
  flagshipEmptyState,
  type FlagshipWindowCurve,
  type PredictiveLtv,
  type RefundHonesty,
  type RefundHonestyBasis,
} from "../lib/ltv-flagship";

function pct(share: number): string {
  return `${Math.round(share * 100)}%`;
}

function basisCopy(basis: RefundHonestyBasis): string {
  switch (basis) {
    case "sample_gross_known":
      return "SAMPLE dollars below are net of refunds. A known gross is on file so the haircut is visible.";
    case "shopify_current_total":
      return "Dollars below use Shopify Total Sales after returns. Refund $ is not broken out on this shop — we do not invent a refund total.";
    case "unknown":
      return "LTV stays net when Shopify sent a current total. We never invent a refund.";
    default: {
      const _exhaustive: never = basis;
      return _exhaustive;
    }
  }
}

/**
 * Come-back math and refund honesty under the First 90 days figure.
 * Not a second 30/90/year dollar ladder, and not a first-year closer.
 */
export function LtvFlagshipBoard({
  windows,
  predictive,
  refunds,
  buyers = 0,
}: {
  windows: FlagshipWindowCurve | null;
  predictive: PredictiveLtv | null;
  refunds: RefundHonesty | null;
  buyers?: number;
}) {
  const currency = useDeskCurrency();
  const drill = useDeskDrill();
  const empty = flagshipEmptyState(windows, buyers);
  const showMath = Boolean(predictive && predictive.predicted90 != null);
  const showRefunds = Boolean(refunds && refunds.orderCount > 0);
  if (!showMath && !showRefunds && !empty) return null;

  const first = predictive?.firstOrder90 ?? 0;
  const extra = predictive?.extraOrders90 ?? 0;
  const later = predictive?.laterOrder90 ?? 0;

  return (
    <section
      className="mcfly-book mcfly-depth mcfly-depth--soft mcfly-depth-flag"
      aria-label="What a new buyer is worth"
    >
      <div className="mcfly-depth-softhead">
        <h3 className="mcfly-chart__serif">
          <DeskIcon name="sales" />
          What a new buyer is worth
        </h3>
        <p className="mcfly-chart__muted">
          Come-back math from order history. Worth on this page is First 90
          days — one figure. A dash is not $0. No spend required.
        </p>
      </div>

      {empty ? (
        <button
          type="button"
          className="mcfly-depth-flag__empty"
          data-kind={empty.kind}
          onClick={() =>
            drill?.openDrill({
              title: "First win",
              value:
                empty.kind === "syncing"
                  ? "Waiting on orders"
                  : `${empty.buyers.toLocaleString()} on file`,
              kicker: empty.verb,
              blocks: [
                { k: "What this is", v: empty.copy },
                {
                  k: "What fills next",
                  v: `Floor: ${empty.need} buyers who have lived 30 days. Then 90 days, then the first year. Same math — no spend required.`,
                },
              ],
              next: "Averages from order history — not a promise, not email.",
            })
          }
        >
          <span className="mcfly-depth-flag__empty-k">First win</span>
          <span className="mcfly-depth-flag__empty-verb">{empty.verb}</span>
          <span className="mcfly-depth-flag__empty-v">
            {empty.kind === "syncing"
              ? "Waiting on orders"
              : `${empty.buyers.toLocaleString()} on file`}
          </span>
          <span className="mcfly-depth-flag__empty-line">{empty.copy}</span>
          <span className="mcfly-depth-flag__empty-line">
            Floor: {empty.need} buyers × 30 days, then 90, then the first year.
            Not $0.
          </span>
        </button>
      ) : null}

      {showMath && predictive ? (
        <button
          type="button"
          className="mcfly-depth-formula__card"
          onClick={() =>
            drill?.openDrill({
              title: "First 90 days — the math",
              value: "First 90 days",
              kicker: `${predictive.nMature90.toLocaleString()} buyers with 90 days on file`,
              blocks: [
                {
                  k: "Formula",
                  v: "Average first order + average extra orders in those 90 days × average later-order dollars.",
                },
                {
                  k: "Plugged in",
                  v: predictive.formula90,
                },
              ],
              next: "An average from order history — not a promise for the next buyer.",
            })
          }
        >
          <p className="mcfly-depth-formula__eq">
            First 90 days ≈ average first order + average extra orders ×
            average later order
          </p>
          <div className="mcfly-depth-formula__parts">
            <span className="mcfly-depth-formula__part">
              <span className="mcfly-depth-formula__part-k">First order</span>
              <span className="mcfly-depth-formula__part-v">
                {formatCurrency(first, currency)}
              </span>
            </span>
            <span className="mcfly-depth-formula__part">
              <span className="mcfly-depth-formula__part-k">Extra orders</span>
              <span className="mcfly-depth-formula__part-v">
                {extra.toFixed(1)}
              </span>
            </span>
            <span className="mcfly-depth-formula__part">
              <span className="mcfly-depth-formula__part-k">Later order</span>
              <span className="mcfly-depth-formula__part-v">
                {formatCurrency(later, currency)}
              </span>
            </span>
          </div>
        </button>
      ) : null}

      {showRefunds && refunds ? (
        <button
          type="button"
          className="mcfly-depth-flag__refund"
          onClick={() =>
            drill?.openDrill({
              title: "Net of refunds",
              value: refunds.brokenOut
                ? formatCurrency(refunds.refundedDollars ?? 0, currency)
                : "Net of returns",
              kicker: `${refunds.orderCount.toLocaleString()} identified orders`,
              blocks: [
                { k: "What this is", v: basisCopy(refunds.basis) },
                {
                  k: "Net dollars in this book",
                  v: formatCurrency(refunds.netDollars, currency),
                },
                {
                  k: "Refunds broken out",
                  v: refunds.brokenOut
                    ? `${formatCurrency(refunds.refundedDollars ?? 0, currency)} taken back.`
                    : "Not on file — we do not invent a refund total.",
                },
              ],
              next: "Net of refunds. Never a fake $0 refund.",
            })
          }
        >
          {refunds.brokenOut
            ? `Net of refunds · ${formatCurrency(refunds.refundedDollars ?? 0, currency)} taken back (${pct(refunds.refundShare ?? 0)} of gross).`
            : basisCopy(refunds.basis)}
        </button>
      ) : null}
    </section>
  );
}
