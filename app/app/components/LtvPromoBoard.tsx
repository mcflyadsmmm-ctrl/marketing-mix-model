import { formatCurrency } from "../lib/mer-format";
import { useDeskCurrency } from "../lib/desk-currency";
import { useDeskDrill } from "./DeskDrill";
import { DeskIcon } from "./DeskIcon";
import type {
  PromoEmpty,
  PromoEmptyKind,
  PromoLtvRow,
  PromoLtvView,
} from "../lib/ltv-promo";

function pct(share: number): string {
  return `${Math.round(share * 100)}%`;
}

function emptyValue(empty: PromoEmpty): string {
  switch (empty.kind) {
    case "syncing":
      return "Waiting on orders";
    case "discounts":
      return `${empty.buyers.toLocaleString()} on file`;
    case "thin":
    case "young":
      return `${empty.promoBuyers.toLocaleString()} promo first`;
    default: {
      const _exhaustive: never = empty.kind;
      return _exhaustive;
    }
  }
}

function emptyFloor(kind: PromoEmptyKind, need: number): string {
  switch (kind) {
    case "syncing":
    case "discounts":
    case "thin":
    case "young":
      return `Floor: ${need} buyers who started with the same first-order promo × 30 days, then 90, then the first year. Not $0.`;
    default: {
      const _exhaustive: never = kind;
      return _exhaustive;
    }
  }
}

function liftCopy(lift: number | null): string | null {
  if (lift == null) return null;
  return `${lift.toFixed(1)}× vs full price`;
}

/**
 * Promo / discount → LTV board. Which first-order promo starts the higher
 * lifetime path — 30 / 90 / year when those starters have lived it, lift vs
 * full-price first, and the written-out 90-day formula. Soft dense, not a
 * code dump. Live shops without discount $ keep the ActionCard-shaped empty.
 * Named codes only paint when they are on the order — never invented.
 */
export function LtvPromoBoard({
  promo,
}: {
  promo: PromoLtvView | null | undefined;
}) {
  const currency = useDeskCurrency();
  const drill = useDeskDrill();
  if (!promo) return null;

  const empty = promo.empty;
  const read = promo.read;
  const best = promo.best;
  // Flagship already owns the 0-buyer first-win. Paint discounts / thin / young
  // here so a live shop without discount $ is never a blank chart.
  const showEmpty = Boolean(empty && empty.kind !== "syncing");
  const showRead = Boolean(read);
  const showCards = promo.rows.length > 0 && read != null;
  const showMath = Boolean(best && best.predicted90 != null && best.formula90);
  if (!showEmpty && !showRead && !showCards && !showMath) return null;

  const first = best?.firstOrder90 ?? 0;
  const extra = best?.extraOrders90 ?? 0;
  const later = best?.laterOrder90 ?? 0;
  const estimate = best?.predicted90;
  const observed = best?.observed90;
  const codesNote = promo.codesKnown
    ? "Named codes are on the first order."
    : "Named discount codes are not on this shop’s stored orders — this is first orders with a discount $ vs none. We do not invent titles.";

  return (
    <section
      className="mcfly-book mcfly-depth mcfly-depth--soft mcfly-depth-flag mcfly-depth-promo"
      aria-label="First-order promo to lifetime value"
    >
      <div className="mcfly-depth-softhead">
        <h3 className="mcfly-chart__serif">
          <DeskIcon name="orders" />
          Promo → LTV
        </h3>
        <p className="mcfly-chart__muted">
          Which first-order promo starts the higher-value path. Discount $ on
          the first order, then 30 / 90 / first year among those starters.
          Lift is vs full-price first. A dash is not $0. No spend required.
        </p>
      </div>

      {showEmpty && empty ? (
        <button
          type="button"
          className="mcfly-depth-flag__empty"
          data-kind={empty.kind}
          onClick={() =>
            drill?.openDrill({
              title: "First-order promo",
              value: emptyValue(empty),
              kicker: empty.verb,
              blocks: [
                { k: "What this is", v: empty.copy },
                {
                  k: "What fills next",
                  v: `Floor: ${empty.need} buyers who started with the same first-order promo and have lived 30 days. Then 90 days, then the first year. Same math — no spend required.`,
                },
                {
                  k: "What’s needed",
                  v: "First-order discount $ on stored orders. Named titles/codes when Shopify sends them — we never invent a code from the dollar amount.",
                },
              ],
              next: "Averages from order history — not a promise, not email.",
            })
          }
        >
          <span className="mcfly-depth-flag__empty-k">First-order promo</span>
          <span className="mcfly-depth-flag__empty-verb">{empty.verb}</span>
          <span className="mcfly-depth-flag__empty-v">{emptyValue(empty)}</span>
          <span className="mcfly-depth-flag__empty-line">{empty.copy}</span>
          <span className="mcfly-depth-flag__empty-line">
            {emptyFloor(empty.kind, empty.need)}
          </span>
        </button>
      ) : null}

      {showRead && read ? (
        <button
          type="button"
          className="mcfly-depth-flag__read"
          onClick={() =>
            drill?.openDrill({
              title: `${read.promo} starters`,
              value: formatCurrency(read.worth, currency),
              kicker: `${read.buyers.toLocaleString()} buyers who started with this first-order promo and have lived ${read.worthLabel.toLowerCase()}`,
              blocks: [
                {
                  k: "Vs full-price first",
                  v:
                    read.lift != null
                      ? `${read.lift.toFixed(1)}× buyers whose first order had no discount in that window.`
                      : "Lift waits until this promo and full-price first have both sealed the window.",
                },
                {
                  k: "Came back",
                  v:
                    read.comeBack != null
                      ? `${pct(read.comeBack)} placed a second order inside this window.`
                      : "Come-back share waits until enough starters have lived the window.",
                },
                {
                  k: "The math vs observed",
                  v:
                    read.estimate != null && read.observed != null
                      ? `The written-out formula says ${formatCurrency(read.estimate, currency)}. Those same starters spent ${formatCurrency(read.observed, currency)}.`
                      : "The 90-day estimate waits until enough starters have lived 90 days.",
                },
                {
                  k: "Codes on file",
                  v: codesNote,
                },
                {
                  k: "First year",
                  v: read.yearPending
                    ? "Not on file yet — not enough of these starters have lived a full year. Not $0."
                    : "On the year line of the promo cards below.",
                },
              ],
              next: "Averages from order history — not a promise, not email.",
            })
          }
        >
          <span className="mcfly-depth-flag__read-k">Highest first-order promo</span>
          <span className="mcfly-depth-flag__read-v">
            {formatCurrency(read.worth, currency)}
          </span>
          <span className="mcfly-depth-flag__read-line">
            {read.promo} · {read.worthLabel}
            {read.lift != null ? ` · ${liftCopy(read.lift)}` : ""}
            {read.comeBack != null
              ? ` · ${pct(read.comeBack)} came back`
              : " · come-back —"}
          </span>
          <span className="mcfly-depth-flag__read-line">
            {read.estimate != null && read.observed != null
              ? `The math says ${formatCurrency(read.estimate, currency)} — those starters spent ${formatCurrency(read.observed, currency)}.`
              : read.yearPending
                ? "First year is not on file yet — not $0."
                : "Averages from the starters who have lived this window."}
          </span>
          {!promo.codesKnown ? (
            <span className="mcfly-depth-flag__read-line">{codesNote}</span>
          ) : null}
        </button>
      ) : null}

      {showCards ? (
        <div className="mcfly-kpi-grid mcfly-kpi-grid--peeks mcfly-kpi-grid--soft">
          {promo.rows.map((row) => (
            <PromoCard
              key={row.promo}
              row={row}
              currency={currency}
              fullPrice90={promo.fullPrice90}
            />
          ))}
        </div>
      ) : null}

      {showMath && estimate != null && best ? (
        <button
          type="button"
          className="mcfly-depth-formula__card"
          onClick={() =>
            drill?.openDrill({
              title: `${best.promo} — first 90 days`,
              value: formatCurrency(estimate, currency),
              kicker: `${best.day90N.toLocaleString()} ${best.promo} starters with 90 days on file`,
              blocks: [
                {
                  k: "Formula",
                  v: "Average first order + average extra orders in those 90 days × average later-order dollars — among buyers whose first order used this promo.",
                },
                {
                  k: "Plugged in",
                  v: best.formula90 ?? "",
                },
                {
                  k: "Observed among those starters",
                  v:
                    observed != null
                      ? formatCurrency(observed, currency)
                      : "—",
                },
                {
                  k: "Vs full-price first",
                  v:
                    best.lift90 != null && promo.fullPrice90 != null
                      ? `${best.lift90.toFixed(1)}× full-price first (${formatCurrency(promo.fullPrice90, currency)}).`
                      : "Lift waits until full-price first has sealed 90 days.",
                },
                {
                  k: "First year",
                  v:
                    best.day365Ltv != null
                      ? formatCurrency(best.day365Ltv, currency)
                      : "Not on file yet — not enough of these starters have lived a full year. Not $0.",
                },
              ],
              next: "An average from order history — not a promise for the next buyer.",
            })
          }
        >
          <p className="mcfly-depth-formula__eq">
            {best.promo} starters · first 90 days ≈ average first order +
            average extra orders × average later order
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
              ? `Those same ${best.promo} starters actually spent ${formatCurrency(observed, currency)} in 90 days.`
              : "Observed 90-day spend is not on file yet."}{" "}
            {best.day365Ltv != null
              ? `First year ${formatCurrency(best.day365Ltv, currency)}.`
              : "First year — not on file yet."}
          </p>
        </button>
      ) : null}
    </section>
  );
}

function PromoCard({
  row,
  currency,
  fullPrice90,
}: {
  row: PromoLtvRow;
  currency: string;
  fullPrice90: number | null;
}) {
  const drill = useDeskDrill();
  const money =
    row.day90Ltv != null
      ? formatCurrency(row.day90Ltv, currency)
      : row.day30Ltv != null
        ? formatCurrency(row.day30Ltv, currency)
        : "—";
  const windowLabel =
    row.day90Ltv != null
      ? "First 90 days"
      : row.day30Ltv != null
        ? "First 30 days"
        : "Not on file yet";
  const lift = row.kind === "full_price" ? null : liftCopy(row.lift90);
  const back =
    row.comeBack90 != null
      ? `${pct(row.comeBack90)} came back`
      : row.comeBack30 != null
        ? `${pct(row.comeBack30)} came back`
        : "Come-back —";

  return (
    <button
      type="button"
      className="mcfly-kpi mcfly-kpi--drill mcfly-kpi--peek mcfly-kpi--soft"
      onClick={() =>
        drill?.openDrill({
          title: `${row.promo} starters`,
          value: money,
          kicker: `${row.buyers.toLocaleString()} buyers whose first order was ${row.promo.toLowerCase()}`,
          blocks: [
            {
              k: "First 30 days",
              v:
                row.day30Ltv != null
                  ? `${formatCurrency(row.day30Ltv, currency)} among ${row.day30N.toLocaleString()} starters who have lived 30 days.`
                  : "Not on file yet — not enough of these starters have lived 30 days. Not $0.",
            },
            {
              k: "First 90 days",
              v:
                row.day90Ltv != null
                  ? `${formatCurrency(row.day90Ltv, currency)} among ${row.day90N.toLocaleString()} starters who have lived 90 days.`
                  : "Not on file yet — not enough of these starters have lived 90 days. Not $0.",
            },
            {
              k: "First year",
              v:
                row.day365Ltv != null
                  ? `${formatCurrency(row.day365Ltv, currency)} among ${row.day365N.toLocaleString()} starters who have lived a year.`
                  : "Not on file yet — not enough of these starters have lived a full year. Not $0.",
            },
            {
              k: "Vs full-price first",
              v:
                row.kind === "full_price"
                  ? "This is the full-price-first baseline."
                  : row.lift90 != null && fullPrice90 != null
                    ? `${row.lift90.toFixed(1)}× full-price first (${formatCurrency(fullPrice90, currency)}).`
                    : "Lift waits until this promo and full-price first have both sealed 90 days.",
            },
          ],
          next: "Averages from order history — not a promise, not email.",
        })
      }
    >
      <span className="mcfly-kpi__top">
        <DeskIcon name="sales" />
        <span className="mcfly-kpi__label">{row.promo}</span>
      </span>
      <span className="mcfly-kpi__value">{money}</span>
      <span className="mcfly-depth-windows__sub">
        {windowLabel} · {back}
      </span>
      {lift ? (
        <span className="mcfly-depth-windows__add">{lift}</span>
      ) : row.kind === "full_price" ? (
        <span className="mcfly-depth-windows__add">Baseline</span>
      ) : null}
    </button>
  );
}
