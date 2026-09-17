import { WEEKDAY_SHORT } from "../lib/shopify-depth-stats";
import { formatCurrency } from "../lib/mer-format";
import { useDeskCurrency } from "../lib/desk-currency";
import { DeskIcon } from "./DeskIcon";
import { useDeskDrill } from "./DeskDrill";

/**
 * Weekend / weekday mix — range lives on this chart.
 * Dollars when window sales are known; otherwise share %.
 */
export function WeekdaySalesChart({
  shares,
  windowSales = null,
  peakWeekday = null,
}: {
  shares: number[] | null;
  windowSales?: number | null;
  peakWeekday?: number | null;
}) {
  const currency = useDeskCurrency();
  const drill = useDeskDrill();
  if (!shares || shares.length < 7) return null;
  // Zero shares omit this chart only — not the rest of Overview.
  if (!shares.some((share) => share > 0)) return null;
  const max = Math.max(...shares, 0.01);
  const hasDollars =
    windowSales != null && Number.isFinite(windowSales) && windowSales > 0;

  return (
    <section className="mcfly-chart mcfly-chart--weekdays" aria-label="Sales by weekday">
      <div className="mcfly-chart__head">
        <p className="mcfly-chart__title">
          <DeskIcon name="weekend" />
          Weekday sales
        </p>
      </div>
      <div className="mcfly-chart__days">
        {shares.map((share, index) => {
          const pct = Math.round(share * 100);
          const label = WEEKDAY_SHORT[index] ?? `D${index}`;
          const dollars = hasDollars && windowSales != null
            ? windowSales * share
            : null;
          const value =
            dollars != null
              ? formatCurrency(dollars, currency)
              : pct > 0
                ? `${pct}%`
                : "—";
          const weekend = index === 0 || index === 6;
          const peak = peakWeekday === index;
          return (
            <button
              type="button"
              className={[
                "mcfly-chart__day",
                weekend ? "mcfly-chart__day--weekend" : null,
                peak ? "mcfly-chart__day--peak" : null,
              ]
                .filter(Boolean)
                .join(" ")}
              key={label}
              onClick={() =>
                drill?.openDrill({
                  title: label,
                  value,
                  kicker: "Shop-local weekday share",
                  blocks: [
                    dollars != null
                      ? { k: "Sales", v: formatCurrency(dollars, currency) }
                      : null,
                    {
                      k: "Share",
                      v: `${pct}% of sales this window`,
                    },
                    {
                      k: "What this is",
                      v: "Share of sales on this weekday in the selected window. Shopify Analytics Overview does not put this next to typical order.",
                    },
                  ].filter(
                    (block): block is { k: string; v: string } => block != null,
                  ),
                  next: "Busiest hour and Online vs POS sit on Orders.",
                  nextHref: "/app/orders",
                  nextLabel: "Open Orders",
                })
              }
            >
              <span
                className="mcfly-chart__day-bar"
                style={{ height: `${Math.max(8, (share / max) * 88)}%` }}
              />
              <span className="mcfly-chart__day-k">{label}</span>
              <span className="mcfly-chart__day-v">{value}</span>
            </button>
          );
        })}
      </div>
      <p className="mcfly-chart__hint">Tap a day · shop-local · Sat–Sun marked</p>
    </section>
  );
}
