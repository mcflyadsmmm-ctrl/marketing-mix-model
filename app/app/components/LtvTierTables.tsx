import { formatCurrency } from "../lib/mer-format";
import { useDeskCurrency } from "../lib/desk-currency";
import { useDeskDrill } from "./DeskDrill";
import type { TierRow } from "../lib/ltv-depth";

function pct(share: number): string {
  return `${Math.round(share * 100)}%`;
}

function TierTable({
  rows,
  firstHeader,
}: {
  rows: TierRow[];
  firstHeader: string;
}) {
  const currency = useDeskCurrency();
  const drill = useDeskDrill();
  return (
    <div className="mcfly-depth-tablewrap">
      <table className="mcfly-depth-table mcfly-depth-table--tier">
        <thead>
          <tr>
            <th scope="col">{firstHeader}</th>
            <th scope="col">Buyers</th>
            <th scope="col">Bought again</th>
            <th scope="col">Rate</th>
            <th scope="col">Lifetime net</th>
            <th scope="col">LTV</th>
            <th scope="col">First 90 days</th>
            <th scope="col">90-day n</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key}>
              <th scope="row">
                <button
                  type="button"
                  className="mcfly-depth-table__drill"
                  onClick={() =>
                    drill?.openDrill({
                      title: row.label,
                      value: formatCurrency(row.ltv, currency),
                      kicker: `${row.buyers.toLocaleString()} buyers · ${pct(row.repeatPct)} bought again`,
                      blocks: [
                        {
                          k: "Lifetime LTV",
                          v: formatCurrency(row.ltv, currency),
                        },
                        {
                          k: "First 90 days",
                          v:
                            row.day90N > 0
                              ? formatCurrency(row.day90Ltv, currency)
                              : "— (not enough history)",
                        },
                        {
                          k: "What this is",
                          v: "Grouped by first-order size. LTV and first-90-days are per buyer. Order history, not a promise.",
                        },
                      ],
                      next: "Bigger first orders usually come back more — watch the rate column.",
                    })
                  }
                >
                  {row.label}
                </button>
              </th>
              <td>{row.buyers.toLocaleString()}</td>
              <td>{row.repeat.toLocaleString()}</td>
              <td>{pct(row.repeatPct)}</td>
              <td>{formatCurrency(row.lifetimeNet, currency)}</td>
              <td className="mcfly-depth-table__strong">
                {formatCurrency(row.ltv, currency)}
              </td>
              <td>{row.day90N > 0 ? formatCurrency(row.day90Ltv, currency) : "—"}</td>
              <td className="mcfly-depth-table__muted">
                {row.day90N > 0 ? row.day90N.toLocaleString() : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * First-order size → what a customer becomes. Bigger, deliberate first orders
 * (a board, not a stocking-stuffer) come back far more and are worth multiples
 * over their life — the acquisition read Shopify Analytics does not put next to
 * lifetime value. Two cuts: first-order dollars and first-order basket size.
 */
export function LtvTierTables({
  aov,
  basket,
}: {
  aov: TierRow[];
  basket: TierRow[];
}) {
  if (aov.length === 0 && basket.length === 0) return null;

  return (
    <section
      className="mcfly-book mcfly-depth mcfly-depth--soft"
      aria-label="First order size to lifetime value"
    >
      <div className="mcfly-depth-softhead">
        <h3 className="mcfly-chart__serif">AOV → LTV tiers</h3>
        <p className="mcfly-chart__muted">
          What a first order becomes — by size, then by item count. Bought again
          is a second order; LTV and first-90-days are per buyer. Click a tier.
        </p>
      </div>
      {aov.length > 0 ? (
        <>
          <p className="mcfly-depth__caption">First-order size</p>
          <TierTable rows={aov} firstHeader="First order" />
        </>
      ) : null}
      {basket.length > 0 ? (
        <>
          <p className="mcfly-depth__caption">First-order items</p>
          <TierTable rows={basket} firstHeader="First basket" />
        </>
      ) : null}
    </section>
  );
}
