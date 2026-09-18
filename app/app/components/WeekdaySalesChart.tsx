import { WEEKDAY_SHORT } from "../lib/shopify-depth-stats";
import { formatCurrency } from "../lib/mer-format";
import { chartSeriesId } from "../lib/chart-smooth";
import { chartBarShellClassName } from "../lib/chart-bar";
import { useChartHover } from "../lib/use-chart-hover";
import { overviewCompactMoney } from "../lib/overview-sales-chart";
import { useDeskCurrency } from "../lib/desk-currency";
import { DeskIcon } from "./DeskIcon";
import { useDeskDrill } from "./DeskDrill";

/**
 * Weekend / weekday mix — range lives on this chart. Bars vs an even-split
 * reference, with the busiest weekday called out. Dollars when window sales are
 * known; otherwise share %. Never spend.
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
  const {
    hoverIndex,
    setHoverIndex,
    moveFromEvent,
    onPlotPointerLeave,
  } = useChartHover(
    shares?.length ?? 0,
    chartSeriesId(shares ?? []),
  );
  if (!shares || shares.length < 7) return null;
  // Zero shares omit this chart only — not the rest of Overview.
  if (!shares.some((share) => share > 0)) return null;
  const max = Math.max(...shares, 0.01);
  const evenSplit = shares.reduce((sum, share) => sum + share, 0) / shares.length;
  const evenPct = Math.min(100, Math.max(0, (evenSplit / max) * 100));
  const hasDollars =
    windowSales != null && Number.isFinite(windowSales) && windowSales > 0;
  const peakIndex =
    peakWeekday != null && peakWeekday >= 0 && peakWeekday < shares.length
      ? peakWeekday
      : shares.reduce((best, share, index) => (share > shares[best]! ? index : best), 0);
  const peakShare = shares[peakIndex] ?? 0;
  const weekendShare = (shares[0] ?? 0) + (shares[6] ?? 0);
  const ledeParts = [
    `${WEEKDAY_SHORT[peakIndex] ?? "—"} busiest`,
    hasDollars && windowSales != null
      ? formatCurrency(windowSales * peakShare, currency)
      : `${Math.round(peakShare * 100)}% of sales`,
    weekendShare > 0 ? `Sat–Sun ${Math.round(weekendShare * 100)}%` : null,
  ].filter((part): part is string => part != null);

  return (
    <section
      className={chartBarShellClassName("mcfly-chart mcfly-chart--weekdays", hoverIndex != null)}
      aria-label="Sales by weekday"
    >
      <div className="mcfly-chart__head">
        <p className="mcfly-chart__title">
          <DeskIcon name="weekend" />
          Weekday sales
        </p>
        {ledeParts.length > 0 ? (
          <p className="mcfly-chart__lede">{ledeParts.join(" · ")}</p>
        ) : null}
      </div>
      <div
        className="mcfly-chart__days"
        onPointerMove={moveFromEvent}
        onPointerLeave={onPlotPointerLeave}
      >
        {shares.map((share, index) => {
          const pct = Math.round(share * 100);
          const label = WEEKDAY_SHORT[index] ?? `D${index}`;
          const dollars =
            hasDollars && windowSales != null ? windowSales * share : null;
          const value =
            dollars != null
              ? overviewCompactMoney(dollars, currency)
              : pct > 0
                ? `${pct}%`
                : "—";
          const weekend = index === 0 || index === 6;
          const peak = peakIndex === index;
          const barPct = Math.max(6, (share / max) * 100);
          return (
            <button
              type="button"
              className={[
                "mcfly-chart__day",
                weekend ? "mcfly-chart__day--weekend" : null,
                peak ? "mcfly-chart__day--peak" : null,
                hoverIndex === index ? "mcfly-chart__day--on" : null,
              ]
                .filter(Boolean)
                .join(" ")}
              key={label}
              onFocus={() => setHoverIndex(index)}
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
                    peak ? { k: "Rank", v: "Busiest weekday" } : null,
                    weekend ? { k: "Day type", v: "Weekend" } : null,
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
              <span className="mcfly-chart__day-track">
                <span
                  className="mcfly-chart__day-even"
                  style={{ bottom: `${evenPct}%` }}
                  aria-hidden="true"
                />
                {peak ? (
                  <span className="mcfly-chart__day-flag">Peak</span>
                ) : null}
                <span
                  className="mcfly-chart__day-bar"
                  style={{ height: `${barPct}%` }}
                />
              </span>
              <span className="mcfly-chart__day-k">{label}</span>
              <span className="mcfly-chart__day-v">{value}</span>
            </button>
          );
        })}
      </div>
      <p className="mcfly-chart__hint">Tap a day · dashed = even split · Sat–Sun marked</p>
    </section>
  );
}
