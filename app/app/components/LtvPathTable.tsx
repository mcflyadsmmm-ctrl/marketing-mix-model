import { formatCurrency } from "../lib/mer-format";
import { useDeskCurrency } from "../lib/desk-currency";
import type { PathLtvRow } from "../lib/ltv-depth";

/**
 * First product → second product journeys: how many buyers walked each path,
 * what they are worth over their life, and in their first 90 days. Only orders
 * with product names on file count (SAMPLE Snowdevil) — live orders hide titles,
 * so this table simply does not paint there. Biggest journeys first.
 */
export function LtvPathTable({ paths }: { paths: PathLtvRow[] }) {
  const currency = useDeskCurrency();
  if (paths.length === 0) return null;

  return (
    <section className="mcfly-book mcfly-depth mcfly-depth--soft" aria-label="First to second product journeys">
      <div className="mcfly-depth-softhead">
        <h3 className="mcfly-chart__serif">Path LTV</h3>
        <p className="mcfly-chart__muted">
          What they buy first, then next — and what that journey is worth. The
          second product is the tell. Lifetime and first-90-days are per buyer.
          Order history, not a forecast.
        </p>
      </div>
      <div className="mcfly-depth-tablewrap">
        <table className="mcfly-depth-table mcfly-depth-table--path">
          <thead>
            <tr>
              <th scope="col">First</th>
              <th scope="col">Then</th>
              <th scope="col">Buyers</th>
              <th scope="col">Lifetime</th>
              <th scope="col">First 90 days</th>
              <th scope="col">90-day n</th>
            </tr>
          </thead>
          <tbody>
            {paths.map((row) => (
              <tr key={`${row.first}\u0000${row.second}`}>
                <th scope="row">{row.first}</th>
                <td className="mcfly-depth-table__second">
                  {row.samePath ? (
                    <span className="mcfly-depth-table__repeat" title="Bought the same product again">
                      ↻&nbsp;
                    </span>
                  ) : null}
                  {row.second}
                </td>
                <td>{row.buyers.toLocaleString()}</td>
                <td className="mcfly-depth-table__strong">
                  {formatCurrency(row.lifetimeLtv, currency)}
                </td>
                <td>
                  {row.day90N > 0 ? formatCurrency(row.day90Ltv, currency) : "—"}
                </td>
                <td className="mcfly-depth-table__muted">
                  {row.day90N > 0 ? row.day90N.toLocaleString() : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
