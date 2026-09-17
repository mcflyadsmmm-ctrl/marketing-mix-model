import { formatCurrency } from "../lib/mer-format";
import { useDeskCurrency } from "../lib/desk-currency";
import { useDeskDrill } from "./DeskDrill";
import { DeskIcon } from "./DeskIcon";
import type {
  FirstProductLtvRow,
  ProductEmpty,
  ProductEmptyKind,
  ProductLtvView,
} from "../lib/ltv-product";

function pct(share: number): string {
  return `${Math.round(share * 100)}%`;
}

function emptyValue(empty: ProductEmpty): string {
  switch (empty.kind) {
    case "syncing":
      return "Waiting on orders";
    case "titles":
      return `${empty.buyers.toLocaleString()} on file`;
    case "thin":
    case "young":
      return `${empty.namedBuyers.toLocaleString()} named`;
    default: {
      const _exhaustive: never = empty.kind;
      return _exhaustive;
    }
  }
}

function emptyFloor(kind: ProductEmptyKind, need: number): string {
  switch (kind) {
    case "syncing":
    case "titles":
    case "thin":
    case "young":
      return `Floor: ${need} buyers who started with the same named product × 30 days, then 90, then the first year. Not $0.`;
    default: {
      const _exhaustive: never = kind;
      return _exhaustive;
    }
  }
}

function liftCopy(lift: number | null): string | null {
  if (lift == null) return null;
  return `${lift.toFixed(1)}× the shop`;
}

/**
 * First product → LTV board. Which titled first-line item starts the higher
 * lifetime path — 30 / 90 / year when those starters have lived it, the
 * written-out 90-day formula, and the typical next product. Soft dense, not a
 * catalog dump. Live shops without titles keep the ActionCard-shaped empty.
 */
export function LtvProductBoard({
  product,
}: {
  product: ProductLtvView | null | undefined;
}) {
  const currency = useDeskCurrency();
  const drill = useDeskDrill();
  if (!product) return null;

  const empty = product.empty;
  const read = product.read;
  const best = product.best;
  // Flagship already owns the 0-buyer first-win. Paint titles / thin / young
  // here so a live shop without line-item titles is never a blank chart.
  const showEmpty = Boolean(empty && empty.kind !== "syncing");
  const showRead = Boolean(read);
  const showCards = product.rows.length > 0 && read != null;
  const showMath = Boolean(
    best && best.predicted90 != null && best.formula90,
  );
  if (!showEmpty && !showRead && !showCards && !showMath) return null;

  const first = best?.firstOrder90 ?? 0;
  const extra = best?.extraOrders90 ?? 0;
  const later = best?.laterOrder90 ?? 0;
  const estimate = best?.predicted90;
  const observed = best?.observed90;

  return (
    <section
      className="mcfly-book mcfly-depth mcfly-depth--soft mcfly-depth-flag mcfly-depth-product"
      aria-label="First product to lifetime value"
    >
      <div className="mcfly-depth-softhead">
        <h3 className="mcfly-chart__serif">
          <DeskIcon name="orders" />
          First product → LTV
        </h3>
        <p className="mcfly-chart__muted">
          Which first product starts the higher-value path. Titled line items
          on the first order, then 30 / 90 / first year among those starters.
          A dash is not $0. No spend required.
        </p>
      </div>

      {showEmpty && empty ? (
        <button
          type="button"
          className="mcfly-depth-flag__empty"
          data-kind={empty.kind}
          onClick={() =>
            drill?.openDrill({
              title: "First product",
              value: emptyValue(empty),
              kicker: empty.verb,
              blocks: [
                { k: "What this is", v: empty.copy },
                {
                  k: "What fills next",
                  v: `Floor: ${empty.need} buyers who started with the same named first-line item and have lived 30 days. Then 90 days, then the first year. Same math — no spend required.`,
                },
              ],
              next: "Averages from order history — not a promise, not email.",
            })
          }
        >
          <span className="mcfly-depth-flag__empty-k">First product</span>
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
              title: `${read.product} starters`,
              value: formatCurrency(read.worth, currency),
              kicker: `${read.buyers.toLocaleString()} buyers who started with this first-line item and have lived ${read.worthLabel.toLowerCase()}`,
              blocks: [
                {
                  k: "Vs the shop",
                  v:
                    read.lift != null
                      ? `${read.lift.toFixed(1)}× the average identified buyer in that window.`
                      : "Lift waits until this product and the shop have both sealed the window.",
                },
                {
                  k: "Came back",
                  v:
                    read.comeBack != null
                      ? `${pct(read.comeBack)} placed a second order inside this window.`
                      : "Come-back share waits until enough starters have lived the window.",
                },
                {
                  k: "Typical next",
                  v:
                    read.nextProduct != null
                      ? `${read.nextProduct}${read.nextShare != null ? ` · ${pct(read.nextShare)} of titled second orders` : ""}.`
                      : "The next titled product waits until enough of these starters came back.",
                },
                {
                  k: "The math vs observed",
                  v:
                    read.estimate != null && read.observed != null
                      ? `The written-out formula says ${formatCurrency(read.estimate, currency)}. Those same starters spent ${formatCurrency(read.observed, currency)}.`
                      : "The 90-day estimate waits until enough starters have lived 90 days.",
                },
                {
                  k: "First year",
                  v: read.yearPending
                    ? "Not on file yet — not enough of these starters have lived a full year. Not $0."
                    : "On the year line of the product cards below.",
                },
              ],
              next: "Averages from order history — not a promise, not email.",
            })
          }
        >
          <span className="mcfly-depth-flag__read-k">Highest first product</span>
          <span className="mcfly-depth-flag__read-v">
            {formatCurrency(read.worth, currency)}
          </span>
          <span className="mcfly-depth-flag__read-line">
            {read.product} · {read.worthLabel}
            {read.lift != null ? ` · ${liftCopy(read.lift)}` : ""}
            {read.comeBack != null
              ? ` · ${pct(read.comeBack)} came back`
              : " · come-back —"}
          </span>
          {read.nextProduct ? (
            <span className="mcfly-depth-flag__read-line">
              Then {read.nextProduct}
              {read.nextShare != null ? ` · ${pct(read.nextShare)} of titled next orders` : ""}
            </span>
          ) : null}
          <span className="mcfly-depth-flag__read-line">
            {read.estimate != null && read.observed != null
              ? `The math says ${formatCurrency(read.estimate, currency)} — those starters spent ${formatCurrency(read.observed, currency)}.`
              : read.yearPending
                ? "First year is not on file yet — not $0."
                : "Averages from the starters who have lived this window."}
          </span>
        </button>
      ) : null}

      {showCards ? (
        <div className="mcfly-kpi-grid mcfly-kpi-grid--peeks mcfly-kpi-grid--soft">
          {product.rows.map((row) => (
            <ProductCard
              key={row.product}
              row={row}
              currency={currency}
              shop90={product.shop90}
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
              title: `${best.product} — first 90 days`,
              value: formatCurrency(estimate, currency),
              kicker: `${best.day90N.toLocaleString()} ${best.product} starters with 90 days on file`,
              blocks: [
                {
                  k: "Formula",
                  v: "Average first order + average extra orders in those 90 days × average later-order dollars — among buyers whose first titled line item was this product.",
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
            {best.product} starters · first 90 days ≈ average first order +
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
              ? `Those same ${best.product} starters actually spent ${formatCurrency(observed, currency)} in 90 days.`
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

function ProductCard({
  row,
  currency,
  shop90,
}: {
  row: FirstProductLtvRow;
  currency: string;
  shop90: number | null;
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
  const lift = liftCopy(row.lift90);
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
          title: `${row.product} starters`,
          value: money,
          kicker: `${row.buyers.toLocaleString()} buyers whose first titled line item was ${row.product}`,
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
              k: "Vs the shop",
              v:
                row.lift90 != null && shop90 != null
                  ? `${row.lift90.toFixed(1)}× the shop 90-day average (${formatCurrency(shop90, currency)}).`
                  : "Lift waits until this product and the shop have both sealed 90 days.",
            },
            {
              k: "Typical next",
              v:
                row.nextProduct != null
                  ? `${row.nextProduct}${row.nextShare != null ? ` · ${pct(row.nextShare)} of titled second orders` : ""}.`
                  : "The next titled product waits until enough of these starters came back.",
            },
          ],
          next: "Averages from order history — not a promise, not email.",
        })
      }
    >
      <span className="mcfly-kpi__top">
        <DeskIcon name="sales" />
        <span className="mcfly-kpi__label">{row.product}</span>
      </span>
      <span className="mcfly-kpi__value">{money}</span>
      <span className="mcfly-depth-windows__sub">
        {windowLabel} · {back}
      </span>
      {lift ? (
        <span className="mcfly-depth-windows__add">{lift}</span>
      ) : null}
      {row.nextProduct ? (
        <span className="mcfly-depth-product__next">
          Then {row.nextProduct}
        </span>
      ) : null}
    </button>
  );
}
