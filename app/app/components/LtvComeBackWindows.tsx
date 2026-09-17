import { formatCurrency } from "../lib/mer-format";
import { useDeskCurrency } from "../lib/desk-currency";
import { useDeskDrill } from "./DeskDrill";
import { DeskIcon } from "./DeskIcon";
import type {
  FlagshipMonthRow,
  FlagshipWindowCurve,
} from "../lib/ltv-flagship";

function pct(share: number): string {
  return `${Math.round(share * 100)}%`;
}

function cell(value: number | null, kind: "pct" | "money", currency: string): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return kind === "pct" ? pct(value) : formatCurrency(value, currency);
}

/**
 * 30 / 90 / 365 come-back + revenue — the order-history read Shopify
 * Analytics never puts next to LTV. Soft cards for the blended windows,
 * then first-order months with honest dashes until each horizon has
 * elapsed. Does not touch the existing month-offset curves or heat.
 */
export function LtvComeBackWindows({
  windows,
  months,
}: {
  windows: FlagshipWindowCurve | null;
  months: FlagshipMonthRow[];
}) {
  const currency = useDeskCurrency();
  const drill = useDeskDrill();
  if (!windows && months.length === 0) return null;

  return (
    <section
      className="mcfly-book mcfly-depth mcfly-depth--soft"
      aria-label="Come-back and value at 30, 90, and 365 days"
    >
      <div className="mcfly-depth-softhead">
        <h3 className="mcfly-chart__serif">
          <DeskIcon name="chart" />
          30 / 90 / 365 come-back
        </h3>
        <p className="mcfly-chart__muted">
          Share who ordered again, and what they spent, at 30 days, 90 days,
          and the first year. A dash means that window has not fully passed
          for enough buyers — not $0. Order history only.
        </p>
      </div>

      {windows ? (
        <div className="mcfly-kpi-grid mcfly-kpi-grid--peeks mcfly-kpi-grid--soft">
          {windows.points.map((point) => {
            const money = cell(point.revenue, "money", currency);
            const back = cell(point.retention, "pct", currency);
            return (
              <button
                type="button"
                className="mcfly-kpi mcfly-kpi--drill mcfly-kpi--peek mcfly-kpi--soft"
                key={point.days}
                onClick={() =>
                  drill?.openDrill({
                    title: point.label,
                    value: money,
                    kicker:
                      point.n > 0
                        ? `${point.n.toLocaleString()} buyers who have lived this window`
                        : "Not enough buyers have lived this window yet",
                    blocks: [
                      {
                        k: "Value",
                        v:
                          point.revenue != null
                            ? `Average net dollars through ${point.label.toLowerCase()} among those buyers.`
                            : "Not on file yet — Shopify’s public-app window is about 60 days, so a first year stays a dash. Not $0 LTV.",
                      },
                      {
                        k: "Came back",
                        v:
                          point.retention != null
                            ? `${back} placed a second order inside this window.`
                            : "Come-back share waits until enough buyers have lived the window.",
                      },
                    ],
                    next: "Averages from order history — not a promise, not email.",
                  })
                }
              >
                <span className="mcfly-kpi__top">
                  <DeskIcon name={point.days === 365 ? "yoy" : "clock"} />
                  <span className="mcfly-kpi__label">{point.label}</span>
                </span>
                <span className="mcfly-kpi__value">{money}</span>
                <span className="mcfly-depth-windows__sub">
                  {point.retention != null ? `${back} came back` : "Come-back —"}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}

      {months.length > 0 ? (
        <div className="mcfly-depth-tablewrap">
          <table className="mcfly-depth-table mcfly-depth-table--windows">
            <thead>
              <tr>
                <th scope="col">First order</th>
                <th scope="col">Buyers</th>
                <th scope="col">30d back</th>
                <th scope="col">30d $</th>
                <th scope="col">90d back</th>
                <th scope="col">90d $</th>
                <th scope="col">Year back</th>
                <th scope="col">Year $</th>
              </tr>
            </thead>
            <tbody>
              {months.map((row) => (
                <tr key={row.label}>
                  <th scope="row">
                    <button
                      type="button"
                      className="mcfly-depth-table__drill"
                      onClick={() =>
                        drill?.openDrill({
                          title: `First on file · ${row.label}`,
                          value:
                            row.rev90 != null
                              ? formatCurrency(row.rev90, currency)
                              : "—",
                          kicker: `${row.customers.toLocaleString()} buyers`,
                          blocks: [
                            {
                              k: "30 days",
                              v: `${cell(row.retain30, "pct", currency)} came back · ${cell(row.rev30, "money", currency)}`,
                            },
                            {
                              k: "90 days",
                              v: `${cell(row.retain90, "pct", currency)} came back · ${cell(row.rev90, "money", currency)}`,
                            },
                            {
                              k: "First year",
                              v: `${cell(row.retain365, "pct", currency)} came back · ${cell(row.rev365, "money", currency)}`,
                            },
                          ],
                          next: "Dashes are windows that have not fully passed — not $0.",
                        })
                      }
                    >
                      {row.label}
                    </button>
                    <span className="mcfly-depth-table__sub">
                      {row.customers.toLocaleString()}
                    </span>
                  </th>
                  <td>{row.customers.toLocaleString()}</td>
                  <td>{cell(row.retain30, "pct", currency)}</td>
                  <td>{cell(row.rev30, "money", currency)}</td>
                  <td>{cell(row.retain90, "pct", currency)}</td>
                  <td className="mcfly-depth-table__strong">
                    {cell(row.rev90, "money", currency)}
                  </td>
                  <td>{cell(row.retain365, "pct", currency)}</td>
                  <td>{cell(row.rev365, "money", currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
