import { formatCurrency } from "../lib/mer-format";
import { useDeskCurrency } from "../lib/desk-currency";
import { useDeskDrill } from "./DeskDrill";
import {
  SOURCE_LTV_MIN_BUYERS,
  type SourceLtvRow,
  type SourceLtvView,
} from "../lib/ltv-by-source";

/**
 * Four Online / POS / Shop / Other rows under Promo → LTV on the open lane.
 * Thin groups stay —. Not ad attribution.
 */
export function LtvBySourceRows({
  bySource,
}: {
  bySource: SourceLtvView | null | undefined;
}) {
  const currency = useDeskCurrency();
  if (!bySource) return null;

  return (
    <div className="mcfly-depth-tablewrap">
      <table
        className="mcfly-depth-table mcfly-depth-table--drivers"
        aria-label="First-order source lifetime value"
      >
        <thead>
          <tr>
            <th scope="col">First source</th>
            <th scope="col">Buyers</th>
            <th scope="col">Avg LTV</th>
          </tr>
        </thead>
        <tbody>
          {bySource.rows.map((row) => (
            <SourceRow key={row.kind} row={row} currency={currency} />
          ))}
        </tbody>
      </table>
      <p className="mcfly-chart__muted">
        First order Online, POS, Shop, or Other. Floor: {SOURCE_LTV_MIN_BUYERS}{" "}
        buyers on that source. A dash is not $0. Not which ad sent them.
      </p>
    </div>
  );
}

function SourceRow({
  row,
  currency,
}: {
  row: SourceLtvRow;
  currency: string;
}) {
  const drill = useDeskDrill();
  const blank = row.ltv == null;
  const display = blank
    ? "—"
    : formatCurrency(row.ltv!, currency);

  return (
    <tr>
      <th scope="row">{row.label}</th>
      <td>{row.buyers.toLocaleString()}</td>
      <td className="mcfly-depth-table__strong">
        <button
          type="button"
          className="mcfly-depth-table__drill"
          data-blank={blank ? "thin" : undefined}
          onClick={() =>
            drill?.openDrill({
              title: `${row.label} first`,
              value: display,
              kicker: `${row.buyers.toLocaleString()} buyers whose first order was ${row.label}`,
              blocks: [
                {
                  k: "Average lifetime revenue",
                  v: blank
                    ? `Needs ${SOURCE_LTV_MIN_BUYERS} buyers who started on ${row.label}. A dash is not $0.`
                    : `${display} average across buyers whose first order was ${row.label}.`,
                },
                {
                  k: "What this is not",
                  v: "Not which ad sent them. Online / POS / Shop from Shopify sourceName only.",
                },
              ],
              next: "Averages from order history — not a promise, not email.",
            })
          }
        >
          {display}
        </button>
      </td>
    </tr>
  );
}
