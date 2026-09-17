import { formatCurrency } from "../lib/mer-format";
import { useDeskCurrency } from "../lib/desk-currency";
import { useDeskDrill } from "./DeskDrill";
import { DeskIcon } from "./DeskIcon";
import {
  flagshipDailyRead,
  flagshipEmptyState,
  windowAddedAfterPrior,
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

function afterWindowLabel(afterDays: 30 | 90): string {
  switch (afterDays) {
    case 30:
      return "after first 30 days";
    case 90:
      return "after first 90 days";
    default: {
      const _exhaustive: never = afterDays;
      return _exhaustive;
    }
  }
}

function moneyDelta(amount: number, currency: string): string {
  const pretty = formatCurrency(Math.abs(amount), currency);
  if (amount > 0) return `+${pretty}`;
  if (amount < 0) return `−${pretty}`;
  return pretty;
}

/**
 * One LTV board a merchant would pay $39 for with zero spend: today’s read,
 * 30/90/365 come-back + dollars + same-buyer lift, the estimate as three
 * labeled parts, refund honesty on the same card. Not a dump of extra tables.
 * Existing explorers stay below.
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
  const daily = flagshipDailyRead(windows, predictive);
  const empty = flagshipEmptyState(windows, buyers);
  const showWindows = Boolean(windows);
  const showMath = Boolean(predictive && predictive.predicted90 != null);
  const showRefunds = Boolean(refunds && refunds.orderCount > 0);
  if (!showWindows && !showMath && !showRefunds && !empty) return null;

  const first = predictive?.firstOrder90 ?? 0;
  const extra = predictive?.extraOrders90 ?? 0;
  const later = predictive?.laterOrder90 ?? 0;
  const estimate = predictive?.predicted90;
  const observed = predictive?.observed90;

  const worthLabel =
    daily?.worthDays === 30
      ? "First 30 days"
      : daily?.worthDays === 365
        ? "First year"
        : "First 90 days";

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

      {empty ? (
        <div
          className="mcfly-depth-flag__empty"
          data-kind={empty.kind}
        >
          <p className="mcfly-depth-flag__empty-k">First win</p>
          <p className="mcfly-depth-flag__empty-v">
            {empty.kind === "syncing"
              ? "Waiting on orders"
              : `${empty.buyers.toLocaleString()} on file`}
          </p>
          <p className="mcfly-depth-flag__empty-line">{empty.copy}</p>
          <p className="mcfly-depth-flag__empty-line">
            Floor: {empty.need} buyers who have lived 30 days. Then 90 days,
            then the first year. Same math — no spend required.
          </p>
        </div>
      ) : null}

      {daily ? (
        <button
          type="button"
          className="mcfly-depth-flag__read"
          onClick={() =>
            drill?.openDrill({
              title: "What a new buyer is worth",
              value: formatCurrency(daily.worth, currency),
              kicker: `${daily.buyers.toLocaleString()} buyers who have lived ${worthLabel.toLowerCase()}`,
              blocks: [
                {
                  k: "Came back",
                  v:
                    daily.comeBack != null
                      ? `${pct(daily.comeBack)} placed a second order inside this window.`
                      : "Come-back share waits until enough buyers have lived the window.",
                },
                {
                  k: "First order vs later",
                  v:
                    daily.firstOrder != null && daily.laterInWindow != null
                      ? `${formatCurrency(daily.firstOrder, currency)} on the first order, then ${formatCurrency(daily.laterInWindow, currency)} more in that window.`
                      : "Later dollars in the window wait until the 90-day read is on file.",
                },
                {
                  k: "The math vs observed",
                  v:
                    daily.estimate != null && daily.observed != null
                      ? `The written-out formula says ${formatCurrency(daily.estimate, currency)}. Those same buyers spent ${formatCurrency(daily.observed, currency)}.`
                      : "The 90-day estimate waits until enough buyers have lived 90 days.",
                },
                {
                  k: "First year",
                  v: daily.yearPending
                    ? "Not on file yet — not enough buyers have lived a full year. Not $0."
                    : "On the year card below, among buyers who have lived a full year.",
                },
              ],
              next: "Averages from order history — not a promise, not email.",
            })
          }
        >
          <span className="mcfly-depth-flag__read-k">Today’s read</span>
          <span className="mcfly-depth-flag__read-v">
            {formatCurrency(daily.worth, currency)}
          </span>
          <span className="mcfly-depth-flag__read-line">
            {worthLabel}
            {daily.comeBack != null
              ? ` · ${pct(daily.comeBack)} came back`
              : " · come-back —"}
          </span>
          {daily.firstOrder != null && daily.laterInWindow != null ? (
            <span className="mcfly-depth-flag__read-line">
              First order {formatCurrency(daily.firstOrder, currency)} · later{" "}
              {formatCurrency(daily.laterInWindow, currency)} in that window
            </span>
          ) : null}
          <span className="mcfly-depth-flag__read-line">
            {daily.estimate != null && daily.observed != null
              ? `The math says ${formatCurrency(daily.estimate, currency)} — those buyers spent ${formatCurrency(daily.observed, currency)}.`
              : daily.yearPending
                ? "First year is not on file yet — not $0."
                : "Averages from the buyers who have lived this window."}
          </span>
        </button>
      ) : null}

      {windows ? (
        <div className="mcfly-kpi-grid mcfly-kpi-grid--peeks mcfly-kpi-grid--soft">
          {windows.points.map((point) => {
            const money =
              point.revenue != null
                ? formatCurrency(point.revenue, currency)
                : "—";
            const back =
              point.retention != null ? pct(point.retention) : "—";
            const lift = windowAddedAfterPrior(windows.points, point.days);
            const liftLine =
              lift != null
                ? `${moneyDelta(lift.added, currency)} ${afterWindowLabel(lift.afterDays)}`
                : null;
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
                            : "Not on file yet — not enough buyers have lived this window. Not $0 LTV.",
                      },
                      {
                        k: "Came back",
                        v:
                          point.retention != null
                            ? `${back} placed a second order inside this window.`
                            : "Come-back share waits until enough buyers have lived the window.",
                      },
                      ...(liftLine
                        ? [
                            {
                              k: "Added",
                              v: `${liftLine} — same buyers, not a mixed pool.`,
                            },
                          ]
                        : []),
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
                {liftLine ? (
                  <span className="mcfly-depth-windows__add">{liftLine}</span>
                ) : null}
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
