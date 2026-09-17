import { formatCurrency } from "../lib/mer-format";
import { useDeskCurrency } from "../lib/desk-currency";
import { useDeskDrill } from "./DeskDrill";
import { DeskIcon } from "./DeskIcon";
import type { PredictiveLtv } from "../lib/ltv-flagship";

/**
 * Transparent predictive LTV — the formula is the card. Historical analog
 * among buyers who have lived the window. Year stays a dash when Shopify
 * has not shared a year of orders. Order history only; no black box.
 */
export function LtvPredictive({ predictive }: { predictive: PredictiveLtv | null }) {
  const currency = useDeskCurrency();
  const drill = useDeskDrill();
  if (!predictive || predictive.predicted90 == null) return null;

  const first = predictive.firstOrder90 ?? 0;
  const extra = predictive.extraOrders90 ?? 0;
  const later = predictive.laterOrder90 ?? 0;
  const estimate = predictive.predicted90;
  const observed = predictive.observed90;

  return (
    <section
      className="mcfly-book mcfly-depth mcfly-depth--soft mcfly-depth-formula"
      aria-label="What a new buyer is worth — the math"
    >
      <div className="mcfly-depth-softhead">
        <h3 className="mcfly-chart__serif">
          <DeskIcon name="sales" />
          What a new buyer is worth — the math
        </h3>
        <p className="mcfly-chart__muted">
          Written out from order history. Same buyers who have already lived
          90 days. Not a hidden model, not email, not spend.
        </p>
      </div>

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
          First 90 days ≈ average first order + average extra orders × average
          later order
        </p>
        <p className="mcfly-depth-formula__plug">
          {formatCurrency(first, currency)} + {extra.toFixed(1)} ×{" "}
          {formatCurrency(later, currency)} ={" "}
          <strong>{formatCurrency(estimate, currency)}</strong>
        </p>
        <p className="mcfly-depth-formula__obs">
          {observed != null
            ? `Those same buyers actually spent ${formatCurrency(observed, currency)} in 90 days.`
            : "Observed 90-day spend is not on file yet."}
        </p>
      </button>

      <div className="mcfly-kpi-grid mcfly-kpi-grid--peeks mcfly-kpi-grid--soft">
        <div className="mcfly-kpi mcfly-kpi--peek mcfly-kpi--soft">
          <span className="mcfly-kpi__top">
            <DeskIcon name="orders" />
            <span className="mcfly-kpi__label">First year estimate</span>
          </span>
          <span className="mcfly-kpi__value">
            {predictive.predicted365 != null
              ? formatCurrency(predictive.predicted365, currency)
              : "—"}
          </span>
          <span className="mcfly-depth-windows__sub">
            {predictive.formula365
              ? `${predictive.nMature365.toLocaleString()} buyers with a year on file`
              : "Year not on file yet — not $0"}
          </span>
        </div>
      </div>
    </section>
  );
}
