import { formatCurrency } from "../lib/mer-format";
import { useDeskCurrency } from "../lib/desk-currency";
import { useDeskDrill } from "./DeskDrill";
import { DeskIcon } from "./DeskIcon";
import type {
  FlagshipWindowCurve,
  PredictiveLtv,
  RefundHonesty,
  RefundHonestyBasis,
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
 * One LTV board a merchant would pay $39 for with zero spend: 30/90/365
 * come-back + dollars, the estimate written out, refund honesty on the same
 * card. Not a dump of extra tables. Existing explorers stay below.
 */
export function LtvFlagshipBoard({
  windows,
  predictive,
  refunds,
}: {
  windows: FlagshipWindowCurve | null;
  predictive: PredictiveLtv | null;
  refunds: RefundHonesty | null;
}) {
  const currency = useDeskCurrency();
  const drill = useDeskDrill();
  const showWindows = Boolean(windows);
  const showMath = Boolean(predictive && predictive.predicted90 != null);
  const showRefunds = Boolean(refunds && refunds.orderCount > 0);
  if (!showWindows && !showMath && !showRefunds) return null;

  const first = predictive?.firstOrder90 ?? 0;
  const extra = predictive?.extraOrders90 ?? 0;
  const later = predictive?.laterOrder90 ?? 0;
  const estimate = predictive?.predicted90;
  const observed = predictive?.observed90;

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
          30 / 90 / first year from order history — come-back and dollars, then
          the math. A dash is not $0. No spend required.
        </p>
      </div>

      {windows ? (
        <div className="mcfly-kpi-grid mcfly-kpi-grid--peeks mcfly-kpi-grid--soft">
          {windows.points.map((point) => {
            const money =
              point.revenue != null
                ? formatCurrency(point.revenue, currency)
                : "—";
            const back =
              point.retention != null ? pct(point.retention) : "—";
            return (
              <button
                type="button"
                className="mcfly-kpi mcfly-kpi--drill mcfly-kpi--peek mcfly-kpi--soft"
                key={point.days}
                onClick={() =>
                  drill?.openDrill({
                    title: point.label,
                    value: money,
                    kicker:
                      point.n > 0
                        ? `${point.n.toLocaleString()} buyers who have lived this window`
                        : "Not enough buyers have lived this window yet",
                    blocks: [
                      {
                        k: "Value",
                        v:
                          point.revenue != null
                            ? `Average net dollars through ${point.label.toLowerCase()} among those buyers.`
                            : "Not on file yet — Shopify’s public-app window is about 60 days, so a first year stays a dash. Not $0 LTV.",
                      },
                      {
                        k: "Came back",
                        v:
                          point.retention != null
                            ? `${back} placed a second order inside this window.`
                            : "Come-back share waits until enough buyers have lived the window.",
                      },
                    ],
                    next: "Averages from order history — not a promise, not email.",
                  })
                }
              >
                <span className="mcfly-kpi__top">
                  <DeskIcon name={point.days === 365 ? "yoy" : "clock"} />
                  <span className="mcfly-kpi__label">{point.label}</span>
                </span>
                <span className="mcfly-kpi__value">{money}</span>
                <span className="mcfly-depth-windows__sub">
                  {point.retention != null ? `${back} came back` : "Come-back —"}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}

      {showMath && estimate != null && predictive ? (
        <button
          type="button"
          className="mcfly-depth-formula__card"
          onClick={() =>
            drill?.openDrill({
              title: "First 90 days — the math",
              value: formatCurrency(estimate, currency),
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
                {
                  k: "Observed among those buyers",
                  v:
                    observed != null
                      ? formatCurrency(observed, currency)
                      : "—",
                },
                {
                  k: "First year",
                  v:
                    predictive.formula365 ??
                    "Not on file yet — a year of orders is outside the window Shopify shares on this shop. Not $0.",
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
          <p className="mcfly-depth-formula__plug">
            {formatCurrency(first, currency)} + {extra.toFixed(1)} ×{" "}
            {formatCurrency(later, currency)} ={" "}
            <strong>{formatCurrency(estimate, currency)}</strong>
          </p>
          <p className="mcfly-depth-formula__obs">
            {observed != null
              ? `Those same buyers actually spent ${formatCurrency(observed, currency)} in 90 days.`
              : "Observed 90-day spend is not on file yet."}{" "}
            {predictive.predicted365 != null
              ? `First year ${formatCurrency(predictive.predicted365, currency)}.`
              : "First year — not on file yet."}
          </p>
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
              next: "The 30 / 90 / year cards use net dollars. Never a fake $0 refund.",
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
