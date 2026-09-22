import { formatCurrency } from "../lib/mer-format";
import { useDeskCurrency } from "../lib/desk-currency";
import { useDeskDrill } from "./DeskDrill";
import { DeskIcon } from "./DeskIcon";
import {
  FIRST_PRODUCT_NO_REPEAT_COPY,
  FIRST_PRODUCT_TITLES_COPY,
  firstProductLtvDisplay,
  type FirstProductDriverRow,
  type FirstProductDriversView,
  type FirstProductEmpty,
  type FirstProductEmptyKind,
} from "../lib/ltv-first-product";

function emptyValue(empty: FirstProductEmpty): string {
  switch (empty.kind) {
    case "syncing":
      return "Waiting on orders";
    case "titles":
      return FIRST_PRODUCT_TITLES_COPY;
    default: {
      const _exhaustive: never = empty.kind;
      return _exhaustive;
    }
  }
}

function emptyFloor(kind: FirstProductEmptyKind): string {
  switch (kind) {
    case "syncing":
      return "Orders are still syncing. Not $0.";
    case "titles":
      return FIRST_PRODUCT_TITLES_COPY;
    default: {
      const _exhaustive: never = kind;
      return _exhaustive;
    }
  }
}

function repeatLine(row: FirstProductDriverRow): string {
  if (row.repeatBuyers <= 0 || row.avgLtv == null) {
    return FIRST_PRODUCT_NO_REPEAT_COPY;
  }
  const buyers = row.repeatBuyers.toLocaleString();
  return `${buyers} ${row.repeatBuyers === 1 ? "buyer" : "buyers"} ordered again.`;
}

/**
 * Customers → LTV chip, below the 30/90/365 triangle. Product title,
 * first-order count, and average revenue from those buyers. A product with
 * no later order prints a dash. Live shops without titles keep the empty.
 */
export function LtvFirstProductDrivers({
  drivers,
  useSampleDesk = false,
}: {
  drivers: FirstProductDriversView | null | undefined;
  useSampleDesk?: boolean;
}) {
  const currency = useDeskCurrency();
  const drill = useDeskDrill();
  if (!drivers) return null;

  const empty = drivers.empty;
  const showTable = drivers.rows.length > 0;
  const anyBlank = drivers.rows.some((row) => row.avgLtv == null);
  if (!showTable && !empty) return null;

  const source = useSampleDesk
    ? "From SAMPLE Snowdevil orders. Shopify orders only, no spend."
    : "From this shop’s Shopify orders. No spend required.";

  return (
    <section
      className="mcfly-book mcfly-depth mcfly-depth--soft mcfly-first-product-drivers"
      aria-label="First product to downstream LTV"
    >
      <div className="mcfly-depth-softhead">
        <h3 className="mcfly-chart__serif">
          <DeskIcon name="orders" />
          First product → LTV
        </h3>
        <p className="mcfly-chart__muted">
          {empty?.kind === "titles"
            ? FIRST_PRODUCT_TITLES_COPY
            : `Buyers whose first order was this product, how many of those first orders, and the average revenue from those buyers. A dash means no repeat history yet — not $0. ${source}`}
        </p>
      </div>

      {empty ? (
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
                { k: "What fills next", v: emptyFloor(empty.kind) },
              ],
              next: "Shopify orders only — not a forecast, not email.",
            })
          }
        >
          <span className="mcfly-depth-flag__empty-k">First product</span>
          <span className="mcfly-depth-flag__empty-verb">{empty.verb}</span>
          <span className="mcfly-depth-flag__empty-v">{emptyValue(empty)}</span>
          {empty.kind === "titles" ? null : (
            <>
              <span className="mcfly-depth-flag__empty-line">{empty.copy}</span>
              <span className="mcfly-depth-flag__empty-line">
                {emptyFloor(empty.kind)}
              </span>
            </>
          )}
        </button>
      ) : null}

      {showTable ? (
        <div className="mcfly-depth-tablewrap">
          <table
            className="mcfly-depth-table mcfly-depth-table--drivers"
            aria-label="First product downstream LTV"
          >
            <thead>
              <tr>
                <th scope="col">First product</th>
                <th scope="col">First orders</th>
                <th scope="col">Avg LTV</th>
              </tr>
            </thead>
            <tbody>
              {drivers.rows.map((row) => (
                <DriverRow key={row.product} row={row} currency={currency} />
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {anyBlank ? (
        <p className="mcfly-chart__muted">{FIRST_PRODUCT_NO_REPEAT_COPY}</p>
      ) : null}
    </section>
  );
}

function DriverRow({
  row,
  currency,
}: {
  row: FirstProductDriverRow;
  currency: string;
}) {
  const drill = useDeskDrill();
  const display = firstProductLtvDisplay(row.avgLtv, (amount) =>
    formatCurrency(amount, currency),
  );
  const blank = row.avgLtv == null;

  return (
    <tr>
      <th scope="row">{row.product}</th>
      <td>{row.firstOrderCount.toLocaleString()}</td>
      <td className="mcfly-depth-table__strong">
        <button
          type="button"
          className="mcfly-depth-table__drill"
          data-blank={blank ? "no-repeat" : undefined}
          onClick={() =>
            drill?.openDrill({
              title: row.product,
              value: display,
              kicker: `${row.firstOrderCount.toLocaleString()} first ${row.firstOrderCount === 1 ? "order" : "orders"}`,
              blocks: [
                {
                  k: "Revenue from those buyers",
                  v: blank
                    ? FIRST_PRODUCT_NO_REPEAT_COPY
                    : `${display} average across buyers whose first order was ${row.product}.`,
                },
                { k: "Later orders", v: repeatLine(row) },
              ],
              next: "Shopify orders only — not a forecast, not email.",
            })
          }
        >
          {display}
        </button>
      </td>
    </tr>
  );
}
