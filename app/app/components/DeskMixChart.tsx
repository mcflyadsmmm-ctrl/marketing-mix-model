import { DeskIcon } from "./DeskIcon";
import { useDeskDrill } from "./DeskDrill";
import { chartSeriesId } from "../lib/chart-smooth";
import { chartBarShellClassName } from "../lib/chart-bar";
import { useChartHover } from "../lib/use-chart-hover";

export type ShareBarItem = {
  label: string;
  value: string;
  share: number | null;
  detail: string;
};

export type CountBarItem = {
  label: string;
  count: number;
  detail: string;
};

/**
 * Horizontal mix bars — Black Clover split, grain on this chart.
 */
export function ShareBarsChart({
  title,
  items,
}: {
  title: string;
  items: ShareBarItem[];
}) {
  const drill = useDeskDrill();
  const usable = items.filter(
    (item): item is ShareBarItem & { share: number } =>
      item.share != null && Number.isFinite(item.share) && item.share > 0,
  );
  if (usable.length === 0) return null;
  const rows = usable;
  const max = Math.max(...rows.map((item) => item.share), 0.01);

  return (
    <section className="mcfly-chart" aria-label={title}>
      <div className="mcfly-chart__head">
        <p className="mcfly-chart__title">
          <DeskIcon name="chart" />
          {title}
        </p>
      </div>
      <div className="mcfly-chart__hrows">
        {rows.map((item) => {
          const pct = Math.round(Math.max(0, item.share) * 100);
          return (
            <button
              type="button"
              className="mcfly-chart__hrow"
              key={item.label}
              onClick={() =>
                drill?.openDrill({
                  title: item.label,
                  value: item.value,
                  kicker: `${pct}% of this window`,
                  blocks: [{ k: "What this is", v: item.detail }],
                  next: "The cards above keep the formula next to the number.",
                })
              }
            >
              <span className="mcfly-chart__hlabel">{item.label}</span>
              <span className="mcfly-chart__htrack">
                <span
                  className="mcfly-chart__hfill"
                  style={{ width: `${Math.max(8, (item.share / max) * 100)}%` }}
                />
              </span>
              <span className="mcfly-chart__hvalue">{item.value}</span>
            </button>
          );
        })}
      </div>
      <p className="mcfly-chart__hint">Click a bar · dollars, not headcount</p>
    </section>
  );
}

/**
 * First-order months — range lives on this chart, not in the tab bar.
 */
export function CountBarsChart({
  title,
  items,
}: {
  title: string;
  items: CountBarItem[];
}) {
  const drill = useDeskDrill();
  const usable = items.filter((item) => item.count > 0).slice(-12);
  const {
    hoverIndex,
    setHoverIndex,
    moveFromEvent,
    onPlotPointerLeave,
  } = useChartHover(
    usable.length,
    chartSeriesId(usable.map((item) => item.label)),
  );
  if (usable.length < 2) return null;
  const max = Math.max(...usable.map((item) => item.count), 1);

  return (
    <section
      className={chartBarShellClassName("mcfly-chart", hoverIndex != null)}
      aria-label={title}
    >
      <div className="mcfly-chart__head">
        <p className="mcfly-chart__title">
          <DeskIcon name="chart" />
          {title}
        </p>
      </div>
      <div
        className="mcfly-chart__months"
        onPointerMove={moveFromEvent}
        onPointerLeave={onPlotPointerLeave}
      >
        {usable.map((item, index) => (
          <button
            type="button"
            className={`mcfly-chart__month${hoverIndex === index ? " mcfly-chart__month--on" : ""}`}
            key={item.label}
            onFocus={() => setHoverIndex(index)}
            onClick={() =>
              drill?.openDrill({
                title: item.label,
                value: item.count.toLocaleString(),
                kicker: "First orders that month",
                blocks: [{ k: "What this is", v: item.detail }],
                next: "Open LTV for 30 / 90 / 365 day spend-back.",
                nextHref: "/app/ltv",
                nextLabel: "Open LTV",
              })
            }
          >
            <span
              className="mcfly-chart__month-bar"
              style={{ height: `${Math.max(8, (item.count / max) * 88)}%` }}
            />
            <span className="mcfly-chart__month-k">{item.label}</span>
            <span className="mcfly-chart__month-v">
              {item.count.toLocaleString()}
            </span>
          </button>
        ))}
      </div>
      <p className="mcfly-chart__hint">Click a month · shop-local first orders</p>
    </section>
  );
}
