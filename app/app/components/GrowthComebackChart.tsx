import { DeskIcon } from "./DeskIcon";
import { useDeskDrill } from "./DeskDrill";
import type { GrowthBar } from "../lib/growth-comeback";

/**
 * Growth-owned order-depth bars — how far past a first order buyers went,
 * as a share of identified buyers. Same horizontal-bar chrome as the desk's
 * share chart, but the hint and drill say buyers, never dollars.
 *
 * Renders nothing until two real bars exist — one bar is not a funnel.
 */
export function GrowthComebackChart({
  title,
  items,
  hint,
  drillNext,
  drillHref,
  drillLabel,
}: {
  title: string;
  items: GrowthBar[];
  hint: string;
  drillNext: string;
  drillHref?: string;
  drillLabel?: string;
}) {
  const drill = useDeskDrill();
  const usable = items.filter(
    (item) => Number.isFinite(item.share) && item.share > 0,
  );
  if (usable.length < 2) return null;
  const max = Math.max(...usable.map((item) => item.share), 0.01);

  return (
    <section className="mcfly-chart" aria-label={title}>
      <div className="mcfly-chart__head">
        <p className="mcfly-chart__title">
          <DeskIcon name="customers" />
          {title}
        </p>
      </div>
      <div className="mcfly-chart__hrows">
        {usable.map((item) => {
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
                  kicker: `${pct}% of identified buyers`,
                  blocks: [{ k: "What this is", v: item.detail }],
                  next: drillNext,
                  nextHref: drillHref,
                  nextLabel: drillLabel,
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
      <p className="mcfly-chart__hint">{hint}</p>
    </section>
  );
}
