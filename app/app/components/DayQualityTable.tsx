import { formatDayQualityCsv, type DayQualityTable } from "../lib/day-quality";

function money(n: number): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function moneyExact(n: number): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(n);
}

function pct(share: number): string {
  return `${Math.round(share * 100)}%`;
}

function formatRoas(n: number): string {
  return `${n.toFixed(2)}×`;
}

function bandLabel(band: "above" | "near" | "below"): string {
  switch (band) {
    case "above":
      return "Above";
    case "near":
      return "Near";
    case "below":
      return "Below";
    default: {
      const _exhaustive: never = band;
      return _exhaustive;
    }
  }
}

function bandTitle(
  band: "above" | "near" | "below",
  breakEvenMer: number | null,
): string {
  const be =
    breakEvenMer != null && Number.isFinite(breakEvenMer)
      ? ` break-even (${breakEvenMer.toFixed(2)}×)`
      : " break-even";
  switch (band) {
    case "above":
      return `Above${be}`;
    case "near":
      return `Near${be}`;
    case "below":
      return `Below${be}`;
    default: {
      const _exhaustive: never = band;
      return _exhaustive;
    }
  }
}

function downloadDayQualityCsv(table: DayQualityTable, periodLabel: string) {
  const blob = new Blob([formatDayQualityCsv(table)], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const safe = periodLabel.replace(/[^\w.-]+/g, "-").replace(/^-|-$/g, "");
  a.href = url;
  a.download = `mcfly-day-board-${safe || "period"}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

type Props = {
  table: DayQualityTable;
  periodLabel: string;
  breakEvenMer: number | null;
};

/**
 * Period day board — orders, AOV, new-sales share, spend, ROAS vs break-even.
 * The Sheets dump Shopify Analytics will not put on Overview.
 */
export function DayQualityTablePanel({
  table,
  periodLabel,
  breakEvenMer,
}: Props) {
  if (table.rows.length === 0) {
    return (
      <section
        className="mcfly-day-quality mcfly-day-quality--empty"
        aria-label="Day quality"
      >
        <div className="mcfly-day-quality__head">
          <p className="mcfly-day-quality__kicker">
            Day board · {periodLabel}
          </p>
          <h2 className="mcfly-day-quality__title">No day facts yet</h2>
        </div>
        <p className="mcfly-day-quality__lede">
          When orders land, each day shows orders, AOV, new-buyer share, and
          spend ROAS against break-even — one board instead of a Sheets rebuild.
        </p>
      </section>
    );
  }

  const coverageLine =
    table.coverage.expectedClosedDays > 0
      ? `${table.coverage.factDays} of ${table.coverage.expectedClosedDays} closed days loaded` +
        (table.coverage.daysWithSpend > 0
          ? ` · spend on ${table.coverage.daysWithSpend}`
          : " · no spend logged yet")
      : `${table.coverage.factDays} days with sales`;

  const unit = table.granularity === "week" ? "week" : "day";

  return (
    <section className="mcfly-day-quality" aria-label="Day quality">
      <div className="mcfly-day-quality__head">
        <div className="mcfly-day-quality__headline">
          <p className="mcfly-day-quality__kicker">
            Day board · {periodLabel}
            {table.granularity === "week" ? " · weekly" : ""}
          </p>
          <h2 className="mcfly-day-quality__title">
            Orders, AOV, and spend by {unit}
          </h2>
        </div>
        <p className="mcfly-day-quality__meta">{coverageLine}</p>
      </div>

      <div className="mcfly-day-quality__scroll">
        <table className="mcfly-day-quality__table">
          <caption className="mcfly-day-quality__caption">
            Period day quality — sales facts joined to spend
            {breakEvenMer != null
              ? ` · break-even ${breakEvenMer.toFixed(2)}×`
              : ""}
          </caption>
          <thead>
            <tr>
              <th scope="col">{table.granularity === "week" ? "Week" : "Day"}</th>
              <th scope="col" className="mcfly-day-quality__num">
                Orders
              </th>
              <th scope="col" className="mcfly-day-quality__num">
                Sales
              </th>
              <th scope="col" className="mcfly-day-quality__num">
                AOV
              </th>
              <th scope="col" className="mcfly-day-quality__num">
                New sales
              </th>
              <th scope="col" className="mcfly-day-quality__num">
                Spend
              </th>
              <th scope="col" className="mcfly-day-quality__num">
                ROAS
              </th>
              <th scope="col">vs BE</th>
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row) => (
              <tr
                key={row.dayKey}
                className={
                  row.partial
                    ? "mcfly-day-quality__row mcfly-day-quality__row--partial"
                    : "mcfly-day-quality__row"
                }
              >
                <th scope="row">
                  {row.label}
                  {row.partial ? (
                    <span className="mcfly-day-quality__partial"> · today</span>
                  ) : null}
                </th>
                <td className="mcfly-day-quality__num">
                  {row.orders.toLocaleString()}
                </td>
                <td className="mcfly-day-quality__num">{money(row.sales)}</td>
                <td className="mcfly-day-quality__num">
                  {row.aov != null ? moneyExact(row.aov) : "—"}
                </td>
                <td className="mcfly-day-quality__num">
                  {row.newSales != null ? (
                    <>
                      {money(row.newSales)}
                      {row.newShare != null ? (
                        <span className="mcfly-day-quality__share">
                          {" "}
                          · {pct(row.newShare)}
                        </span>
                      ) : null}
                    </>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="mcfly-day-quality__num">
                  {row.spend > 0 ? money(row.spend) : "—"}
                </td>
                <td className="mcfly-day-quality__num">
                  {row.roas != null ? formatRoas(row.roas) : "—"}
                </td>
                <td>
                  {row.band == null ? (
                    "—"
                  ) : (
                    <span
                      className={`mcfly-day-quality__band mcfly-day-quality__band--${row.band}`}
                      title={bandTitle(row.band, breakEvenMer)}
                    >
                      {bandLabel(row.band)}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row">Period</th>
              <td className="mcfly-day-quality__num">
                {table.totals.orders.toLocaleString()}
              </td>
              <td className="mcfly-day-quality__num">
                {money(table.totals.sales)}
              </td>
              <td className="mcfly-day-quality__num">
                {table.totals.aov != null
                  ? moneyExact(table.totals.aov)
                  : "—"}
              </td>
              <td className="mcfly-day-quality__num">
                {table.totals.newSales != null
                  ? money(table.totals.newSales)
                  : "—"}
              </td>
              <td className="mcfly-day-quality__num">
                {table.totals.spend > 0 ? money(table.totals.spend) : "—"}
              </td>
              <td className="mcfly-day-quality__num">
                {table.totals.roas != null
                  ? formatRoas(table.totals.roas)
                  : "—"}
              </td>
              <td>
                {table.prior != null ? (
                  <span className="mcfly-day-quality__prior">
                    prior {money(table.prior.sales)}
                    {table.prior.roas != null
                      ? ` · ${formatRoas(table.prior.roas)}`
                      : ""}
                  </span>
                ) : (
                  "—"
                )}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="mcfly-day-quality__foot">
        <p className="mcfly-day-quality__hint">
          {table.customerSplitAvailable
            ? "New sales share uses first-time buyer revenue for that day."
            : "New-buyer split fills as order history backfills."}
          {breakEvenMer == null
            ? " Confirm margin in Settings to score days vs break-even."
            : ` Days score against ${breakEvenMer.toFixed(2)}× break-even.`}
        </p>
        <button
          type="button"
          className="mcfly-day-quality__csv"
          onClick={() => downloadDayQualityCsv(table, periodLabel)}
        >
          Download CSV
        </button>
      </div>
    </section>
  );
}
