import type { RetentionHeat } from "../lib/ltv-depth";

function pct(share: number): string {
  return `${Math.round(share * 100)}%`;
}

/**
 * Still-ordering grid: for each first-order month, the share of those customers
 * who placed an order in each later month. M0 is 100% (they placed the first
 * order). Cells stay blank (—) until a month has fully passed — the young
 * bottom-right is honestly empty, never a fake 0%. Colour tracks the share so
 * the drop-off reads at a glance without a legend.
 */
export function LtvRetentionHeat({ heat }: { heat: RetentionHeat | null }) {
  if (!heat || heat.rows.length < 2) return null;

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
    <section className="mcfly-book mcfly-depth" aria-label="Who is still ordering by month">
      <p className="mcfly-book__lede">
        Who is still ordering — each first-order month, then the share who came
        back in each later month. Order history, not an email list. Blank means
        that month has not fully passed yet — not $0.
      </p>
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
                  const intensity =
                    k === 0 ? 1 : Math.min(1, cell / scale);
                  const alpha = 0.1 + intensity * 0.78;
                  return (
                    <td
                      key={k}
                      className="mcfly-depth-heat__cell"
                      style={{
                        background: `rgba(2, 132, 199, ${alpha.toFixed(3)})`,
                        color: alpha > 0.5 ? "#fff" : "var(--mcfly-ink)",
                      }}
                    >
                      {pct(cell)}
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
