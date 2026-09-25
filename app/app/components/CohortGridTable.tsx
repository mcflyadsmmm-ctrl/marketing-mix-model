import type { CohortBoard } from "../lib/cohort-grid";
import { formatSpendAmount } from "../lib/mer-format";

function money(amount: number | null, currency: string | null): string {
  if (amount == null || !currency) return "—";
  return formatSpendAmount(amount, currency);
}

function pct(value: number | null): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return `${(value * 100).toFixed(1)}%`;
}

function days(value: number | null): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return value.toLocaleString("en-US", { maximumFractionDigits: 1 });
}

export function CohortGridTable({
  board,
  currency,
}: {
  board: CohortBoard;
  currency: string | null;
}) {
  const status =
    board.status === "checked"
      ? "Checked"
      : board.status === "loading"
        ? "Still loading"
        : "Failed";
  return (
    <section className="mcfly-recon" aria-label="Cohorts">
      <header className="mcfly-recon__head">
        <h2>Cohorts</h2>
        <p>{status}</p>
      </header>
      <p className="mcfly-recon__def">
        First order starts the cohort. Cumulative order total. Equal months. An empty month stays blank. Time between orders is the median gap in days. A refund without a date stays off the grid.
      </p>
      <p>
        Time between orders <strong className="mcfly-recon__num">{days(board.medianDaysBetween)}</strong>
        {" · "}
        Refunds without a date <strong className="mcfly-recon__num">{money(board.undatedRefund, currency)}</strong>
      </p>
      {board.grid.months.length === 0 ? (
        <p>—</p>
      ) : (
        <div className="mcfly-cohort-scroll">
          <table className="mcfly-recon__table mcfly-cohort">
            <thead>
              <tr>
                <th scope="col">Cohort</th>
                <th scope="col">Customers</th>
                <th scope="col">Repeat rate</th>
                {board.grid.months.map((month) => (
                  <th key={month} scope="col">
                    {month}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {board.grid.rows.map((row) => (
                <tr key={row.cohort}>
                  <th scope="row">{row.cohort}</th>
                  <td>{row.customers}</td>
                  <td>{pct(row.repeatRate)}</td>
                  {row.cells.map((cell, index) => (
                    <td key={board.grid.months[index] ?? index}>{money(cell, currency)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
