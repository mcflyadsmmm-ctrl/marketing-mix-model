import { formatCurrency } from "../lib/mer-format";
import { useDeskCurrency } from "../lib/desk-currency";
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
              <th scope="row">{row.label}</th>
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
    <section className="mcfly-book mcfly-depth" aria-label="First order size to lifetime value">
      <p className="mcfly-book__lede">
        What a first order becomes — grouped by its size, then by how many items
        were in it. Bought again is how many placed a second order (rate beside
        it); lifetime net is every dollar the group brought, LTV and first-90-days
        are per buyer. 90-day n is the buyers with a full 90 days behind that
        average. Order history, not a promise.
      </p>
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
