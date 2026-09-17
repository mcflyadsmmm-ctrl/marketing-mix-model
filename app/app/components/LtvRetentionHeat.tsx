import { useDeskDrill } from "./DeskDrill";
import type { RetentionHeat } from "../lib/ltv-depth";

function pct(share: number): string {
  return `${Math.round(share * 100)}%`;
}

/**
 * Still-ordering grid: for each first-order month, the share of those customers
 * who placed an order in each later month. M0 is 100% (they placed the first
 * order). Cells stay blank (—) until a month has fully passed — the young
 * bottom-right is honestly empty, never a fake 0%. Colour tracks the share so
 * the drop-off reads at a glance. Click a cell for the formula.
 */
export function LtvRetentionHeat({
  heat,
  buyers = 0,
}: {
  heat: RetentionHeat | null;
  buyers?: number;
}) {
  const drill = useDeskDrill();
  if (!heat || heat.rows.length < 2) {
    if (buyers <= 0) return null;
    return (
      <section
        className="mcfly-book mcfly-depth mcfly-depth--soft mcfly-depth-empty"
        aria-label="Who is still ordering"
      >
        <p className="mcfly-depth-empty__k">Who is still ordering</p>
        <p className="mcfly-depth-empty__v">Waiting on a second month</p>
        <p className="mcfly-depth-empty__line">
          Needs two first-order months. Blank is not 0% — the grid fills as
          months pass. Order history only.
        </p>
      </section>
    );
  }

  // Scale colour to the strongest come-back month (beyond M0) so a healthy
  // shop is not washed out by the always-100% first column.
  let maxCell = 0;
  for (const row of heat.rows) {
    row.cells.forEach((cell, k) => {
      if (k > 0 && cell != null && cell > maxCell) maxCell = cell;
    });
  }
  const scale = maxCell > 0 ? maxCell : 1;

  return (
    <section className="mcfly-book mcfly-depth mcfly-depth--soft" aria-label="Who is still ordering by month">
      <div className="mcfly-depth-softhead">
        <h3 className="mcfly-chart__serif">Who is still ordering</h3>
        <p className="mcfly-chart__muted">
          Each first-order month, then the share who came back later. Blank = month
          not fully passed yet — not $0. Order history, not an email list.
        </p>
      </div>
      <div className="mcfly-depth-tablewrap">
        <table className="mcfly-depth-table mcfly-depth-table--heat">
          <thead>
            <tr>
              <th scope="col">First order</th>
              {heat.offsets.map((k) => (
                <th key={k} scope="col">
                  M{k}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {heat.rows.map((row) => (
              <tr key={row.cohortMonth}>
                <th scope="row">
                  <span className="mcfly-depth-table__month">{row.label}</span>
                  <span className="mcfly-depth-table__sub">
                    {row.customers.toLocaleString()}
                  </span>
                </th>
                {row.cells.map((cell, k) => {
                  if (cell == null) {
                    return (
                      <td key={k} className="mcfly-depth-heat__cell mcfly-depth-heat__cell--none">
                        —
                      </td>
                    );
                  }
                  const intensity = k === 0 ? 1 : Math.min(1, cell / scale);
                  const alpha = 0.1 + intensity * 0.78;
                  return (
                    <td key={k} className="mcfly-depth-heat__cell">
                      <button
                        type="button"
                        className="mcfly-depth-heat__btn"
                        style={{
                          background: `rgba(2, 132, 199, ${alpha.toFixed(3)})`,
                          color: alpha > 0.5 ? "#fff" : "var(--mcfly-ink)",
                        }}
                        onClick={() =>
                          drill?.openDrill({
                            title: `${row.label} · M${k}`,
                            value: pct(cell),
                            kicker: `${row.customers.toLocaleString()} first-order customers`,
                            blocks: [
                              {
                                k: "What this is",
                                v:
                                  k === 0
                                    ? "M0 is always 100% — everyone placed a first order that month."
                                    : `Share of ${row.label} first-order customers who placed any order in month ${k} after that first order.`,
                              },
                            ],
                            next: "Blank cells mean that month has not fully passed yet — not $0 retention.",
                            foot: "Order history only — never an email list.",
                          })
                        }
                      >
                        {pct(cell)}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
