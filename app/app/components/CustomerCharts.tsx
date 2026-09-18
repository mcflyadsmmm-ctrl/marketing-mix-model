import { useDeskDrill } from "./DeskDrill";
import { chartSeriesId } from "../lib/chart-smooth";
import { chartBarShellClassName } from "../lib/chart-bar";
import { useChartHover } from "../lib/use-chart-hover";

export type BarItem = {
  key: string;
  label: string;
  value: number;
  detail?: string;
};

/**
 * One interactive vertical-bar chart — hover/tap a column for its readout,
 * click for the formula. Order-history only; used for days-to-2nd cadence and
 * order-frequency distribution.
 */
export function VerticalBars({
  title,
  subtitle,
  items,
  valueFormat,
  emptyCopy = "Not enough orders on file yet — not zero.",
  ariaUnit = "",
}: {
  title: string;
  subtitle?: string;
  items: BarItem[];
  valueFormat?: (n: number) => string;
  emptyCopy?: string;
  ariaUnit?: string;
}) {
  const drill = useDeskDrill();
  const fmt = valueFormat ?? ((n: number) => Math.round(n).toLocaleString());
  const peak = items.reduce<BarItem | null>(
    (best, it) => (best == null || it.value > best.value ? it : best),
    null,
  );
  const {
    hoverIndex,
    setHoverIndex,
    moveFromEvent,
    onPlotPointerLeave,
  } = useChartHover(
    items.length,
    chartSeriesId(items.map((item) => item.key)),
  );
  const max = Math.max(...items.map((i) => i.value), 1);
  if (items.length === 0 || items.every((i) => i.value === 0)) {
    return <p className="mcfly-cust-note">{emptyCopy}</p>;
  }
  const shown =
    hoverIndex != null ? (items[hoverIndex] ?? peak) : peak;

  return (
    <div className={chartBarShellClassName("mcfly-cust-vbars", hoverIndex != null)}>
      <div className="mcfly-cust-vbars__head">
        <p className="mcfly-cust-vbars__title">
          {title}
          {subtitle ? (
            <span className="mcfly-cust-vbars__sub"> · {subtitle}</span>
          ) : null}
        </p>
        {shown ? (
          <p className="mcfly-cust-vbars__readout" role="status">
            <strong>{fmt(shown.value)}</strong> {shown.label}
          </p>
        ) : null}
      </div>
      <div
        className="mcfly-cust-vbars__plot"
        onPointerMove={moveFromEvent}
        onPointerLeave={onPlotPointerLeave}
      >
        {items.map((it, index) => (
          <button
            type="button"
            key={it.key}
            className={`mcfly-cust-col${shown?.key === it.key ? " mcfly-cust-col--on" : ""}`}
            aria-label={`${it.label} ${fmt(it.value)}${ariaUnit}`}
            onFocus={() => setHoverIndex(index)}
            onClick={() =>
              drill?.openDrill({
                title: it.label,
                value: `${fmt(it.value)}${ariaUnit}`,
                kicker: title,
                blocks: it.detail
                  ? [{ k: "What this is", v: it.detail }]
                  : [],
                next: "From this shop's Shopify orders — no email list, no spend.",
              })
            }
          >
            <span className="mcfly-cust-col__track">
              <span
                className="mcfly-cust-col__bar"
                style={{ height: `${Math.max(2, (it.value / max) * 100)}%` }}
              />
            </span>
            <span className="mcfly-cust-col__v">{fmt(it.value)}</span>
            <span className="mcfly-cust-col__k">{it.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export type DualItem = {
  key: string;
  label: string;
  a: number;
  b: number;
  detail?: string;
};

/**
 * Dual-axis grouped bars — customers (left) vs revenue (right) by band. Each
 * series scales to its own max so the shape of both reads at once.
 */
export function DualBars({
  title,
  subtitle,
  items,
  aLabel,
  bLabel,
  formatA,
  formatB,
  emptyCopy = "Not enough identified buyers yet — not zero.",
}: {
  title: string;
  subtitle?: string;
  items: DualItem[];
  aLabel: string;
  bLabel: string;
  formatA: (n: number) => string;
  formatB: (n: number) => string;
  emptyCopy?: string;
}) {
  const drill = useDeskDrill();
  const {
    hoverIndex,
    setHoverIndex,
    moveFromEvent,
    onPlotPointerLeave,
  } = useChartHover(
    items.length,
    chartSeriesId(items.map((item) => item.key)),
  );
  const maxA = Math.max(...items.map((i) => i.a), 1);
  const maxB = Math.max(...items.map((i) => i.b), 1);
  if (items.length === 0 || items.every((i) => i.a === 0 && i.b === 0)) {
    return <p className="mcfly-cust-note">{emptyCopy}</p>;
  }
  const active = hoverIndex != null ? (items[hoverIndex] ?? null) : null;

  return (
    <div className={chartBarShellClassName("mcfly-cust-dual", hoverIndex != null)}>
      <div className="mcfly-cust-vbars__head">
        <p className="mcfly-cust-vbars__title">
          {title}
          {subtitle ? (
            <span className="mcfly-cust-vbars__sub"> · {subtitle}</span>
          ) : null}
        </p>
        {active ? (
          <p className="mcfly-cust-vbars__readout" role="status">
            {active.label}: <strong>{formatA(active.a)}</strong> {aLabel} ·{" "}
            <strong>{formatB(active.b)}</strong> {bLabel}
          </p>
        ) : null}
      </div>
      <div
        className="mcfly-cust-dual__plot"
        onPointerMove={moveFromEvent}
        onPointerLeave={onPlotPointerLeave}
      >
        {items.map((it, index) => (
          <button
            type="button"
            key={it.key}
            className={`mcfly-cust-dual__group${active?.key === it.key ? " mcfly-cust-dual__group--on" : ""}`}
            aria-label={`${it.label}: ${formatA(it.a)} ${aLabel}, ${formatB(it.b)} ${bLabel}`}
            onFocus={() => setHoverIndex(index)}
            onClick={() =>
              drill?.openDrill({
                title: it.label,
                value: `${formatA(it.a)} ${aLabel}`,
                kicker: title,
                blocks: [
                  { k: aLabel, v: formatA(it.a) },
                  { k: bLabel, v: formatB(it.b) },
                  it.detail ? { k: "What this is", v: it.detail } : null,
                ].filter((x): x is { k: string; v: string } => x != null),
                next: "Order history only — no spend, no email.",
              })
            }
          >
            <span className="mcfly-cust-dual__bars">
              <span
                className="mcfly-cust-dual__bar mcfly-cust-dual__bar--a"
                style={{ height: `${Math.max(2, (it.a / maxA) * 100)}%` }}
              />
              <span
                className="mcfly-cust-dual__bar mcfly-cust-dual__bar--b"
                style={{ height: `${Math.max(2, (it.b / maxB) * 100)}%` }}
              />
            </span>
            <span className="mcfly-cust-col__k">{it.label}</span>
          </button>
        ))}
      </div>
      <div className="mcfly-cust-legend">
        <span className="mcfly-cust-legend__tag mcfly-cust-legend__tag--a">
          {aLabel}
        </span>
        <span className="mcfly-cust-legend__tag mcfly-cust-legend__tag--b">
          {bLabel}
        </span>
      </div>
    </div>
  );
}
