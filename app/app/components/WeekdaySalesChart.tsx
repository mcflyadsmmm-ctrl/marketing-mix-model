import { WEEKDAY_SHORT } from "../lib/shopify-depth-stats";
import { DeskIcon } from "./DeskIcon";
import { useDeskDrill } from "./DeskDrill";

/**
 * Weekend / weekday mix — range lives on this chart.
 */
export function WeekdaySalesChart({
  shares,
}: {
  shares: number[] | null;
}) {
  const drill = useDeskDrill();
  if (!shares || shares.length < 7) return null;
  // Zero shares omit this chart only — not the rest of Overview.
  if (!shares.some((share) => share > 0)) return null;
  const max = Math.max(...shares, 0.01);

  return (
    <section className="mcfly-chart" aria-label="Sales by weekday">
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
          return (
            <button
              type="button"
              className="mcfly-chart__day"
              key={label}
              onClick={() =>
                drill?.openDrill({
                  title: label,
                  value: `${pct}%`,
                  kicker: "Shop-local weekday share",
                  blocks: [
                    {
                      k: "What this is",
                      v: "Share of sales on this weekday in the selected window. Shopify Analytics Overview does not put this next to typical order.",
                    },
                  ],
                  next: "Busiest hour and Online vs POS sit in the cards above.",
                })
              }
            >
              <span
                className="mcfly-chart__day-bar"
                style={{ height: `${Math.max(8, (share / max) * 88)}%` }}
              />
              <span className="mcfly-chart__day-k">{label}</span>
              <span className="mcfly-chart__day-v">{pct > 0 ? `${pct}%` : "—"}</span>
            </button>
          );
        })}
      </div>
      <p className="mcfly-chart__hint">Click a day · shop-local</p>
    </section>
  );
}
