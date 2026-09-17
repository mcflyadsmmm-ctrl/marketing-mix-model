import { useEffect, useMemo, useState } from "react";
import { formatCurrency } from "../lib/mer-format";
import { PRODUCT_NOUN } from "../lib/product-labels";
import {
  CPA_EXPLORER_LABEL,
  CPA_EXPLORER_LONG,
  CPA_EXPLORER_RANGES,
  CPA_GRAIN_LABEL,
  CPA_GRAINS,
  bucketCpaDays,
  cpaExplorerActivityDays,
  filterCpaDays,
  typicalCpa,
  type CpaDayPoint,
  type CpaExplorerRange,
  type CpaGrain,
  type CpaWindowId,
} from "../lib/cpa-desk";
import {
  overviewChartAxis,
  overviewChartLabelIndices,
  overviewCompactMoney,
} from "../lib/overview-sales-chart";
import { useDeskCurrency } from "../lib/desk-currency";
import { DeskIcon } from "./DeskIcon";
import { useDeskDrill } from "./DeskDrill";

const VIEW_W = 760;
const VIEW_H = 300;
const PAD_L = 52;
const PAD_R = 50;
const PAD_T = 20;
const PAD_B = 36;
const PLOT_LEFT = PAD_L;
const PLOT_RIGHT = VIEW_W - PAD_R;
const PLOT_TOP = PAD_T;
const PLOT_BOTTOM = VIEW_H - PAD_B;
const PLOT_W = PLOT_RIGHT - PLOT_LEFT;
const PLOT_H = PLOT_BOTTOM - PLOT_TOP;

const xPct = (coord: number) => (coord / VIEW_W) * 100;
const yPct = (coord: number) => (coord / VIEW_H) * 100;

export const CPA_CHART_EMPTY =
  "Add spend to see cash CPA over time — never a fake $0.";

function ChartEmptyFrame({ copy }: { copy: string }) {
  const ghost = [0.28, 0.46, 0.38, 0.62, 0.5, 0.72, 0.58];
  return (
    <section className="mcfly-chart mcfly-chart--sales mcfly-cpa__chart mcfly-cpa__chart--empty mcfly-chart--soft" aria-label="Cash CPA explorer">
      <div className="mcfly-chart__head">
        <p className="mcfly-chart__title">
          <DeskIcon name="chart" />
          Cash CPA explorer
        </p>
      </div>
      <div className="mcfly-chart__plot mcfly-cust-mix__ghost" aria-hidden="true">
        <svg
          className="mcfly-chart__svg"
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          preserveAspectRatio="none"
          role="presentation"
        >
          {ghost.map((h, i) => {
            const band = PLOT_W / ghost.length;
            const barW = band * 0.5;
            const barH = PLOT_H * h;
            return (
              <rect
                key={i}
                className="mcfly-cust-mix__ghost-bar"
                x={PLOT_LEFT + band * i + (band - barW) / 2}
                y={PLOT_BOTTOM - barH}
                width={barW}
                height={barH}
                rx="2"
              />
            );
          })}
        </svg>
      </div>
      <p className="mcfly-chart__empty">{copy}</p>
    </section>
  );
}

export function CpaExplorer({
  days,
  ranges,
  selectedWindow,
  onSelectWindow,
}: {
  days: CpaDayPoint[];
  ranges: Record<CpaExplorerRange, { fromKey: string; toKey: string }>;
  selectedWindow: CpaWindowId;
  onSelectWindow: (id: CpaWindowId) => void;
}) {
  const currency = useDeskCurrency();
  const drill = useDeskDrill();
  const [rangeId, setRangeId] = useState<CpaExplorerRange>(selectedWindow);
  const [grain, setGrain] = useState<CpaGrain>("day");
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  useEffect(() => {
    setRangeId(selectedWindow);
  }, [selectedWindow]);

  const activeRange = rangeId;

  const range = ranges[activeRange];
  const rangeDays = useMemo(
    () => filterCpaDays(cpaExplorerActivityDays(days), range.fromKey, range.toKey),
    [days, range.fromKey, range.toKey],
  );

  const grainCounts = useMemo(() => {
    const counts = {} as Record<CpaGrain, number>;
    for (const option of CPA_GRAINS) {
      counts[option] = bucketCpaDays(rangeDays, option).length;
    }
    return counts;
  }, [rangeDays]);

  const effectiveGrain: CpaGrain = grainCounts[grain] >= 2 ? grain : "day";
  const points = useMemo(
    () => bucketCpaDays(rangeDays, effectiveGrain),
    [rangeDays, effectiveGrain],
  );

  if (cpaExplorerActivityDays(days).length < 2) {
    return <ChartEmptyFrame copy={CPA_CHART_EMPTY} />;
  }

  if (points.length < 2) {
    return <ChartEmptyFrame copy={CPA_CHART_EMPTY} />;
  }

  const spendMax = Math.max(...points.map((point) => point.spend), 1);
  const cpaValues = points
    .map((point) => point.cashCpa)
    .filter((value): value is number => value != null && value > 0);
  const typical = typicalCpa(points);
  const cpaMax = Math.max(...cpaValues, typical ?? 0, 1);
  const leftAxis = overviewChartAxis(spendMax, 4);
  const rightAxis = overviewChartAxis(cpaMax, 4);
  const band = PLOT_W / points.length;
  const barW = Math.min(42, Math.max(1.2, band * 0.6));
  const yForSpend = (value: number) =>
    PLOT_BOTTOM - Math.min(1, Math.max(0, value / leftAxis.max)) * PLOT_H;
  const yForCpa = (value: number) =>
    PLOT_BOTTOM - Math.min(1, Math.max(0, value / rightAxis.max)) * PLOT_H;
  const centerX = (index: number) => PLOT_LEFT + band * index + band / 2;
  const barX = (index: number) => PLOT_LEFT + band * index + (band - barW) / 2;
  const railY = typical != null ? yForCpa(typical) : null;
  const labelIndices = new Set(overviewChartLabelIndices(points.length, 6));

  let cpaLine = "";
  let started = false;
  for (let index = 0; index < points.length; index++) {
    const value = points[index]?.cashCpa;
    if (value == null) {
      started = false;
      continue;
    }
    const cmd = started ? "L" : "M";
    started = true;
    cpaLine += `${cpaLine ? " " : ""}${cmd}${centerX(index).toFixed(1)} ${yForCpa(value).toFixed(1)}`;
  }

  const activeIndex = hoverIndex != null ? hoverIndex : points.length - 1;
  const active = points[activeIndex] ?? null;
  const totalSpend = points.reduce((sum, point) => sum + point.spend, 0);
  const totalBuyers = points.reduce(
    (sum, point) => sum + (point.buyers ?? 0),
    0,
  );
  const buyersKnown = points.some((point) => point.buyers != null);
  const spendDays = points.filter((point) => point.spend > 0).length;
  const rangeCpa = typicalCpa(points);
  const best = [...points].reverse().reduce<typeof points[0] | null>((win, point) => {
    if (point.cashCpa == null) return win;
    if (win?.cashCpa == null || point.cashCpa < win.cashCpa) return point;
    return win;
  }, null);

  const tipOpen = hoverIndex != null && active != null;
  const tipCenter = centerX(activeIndex);
  const tipTopY = active ? yForSpend(active.spend) : PLOT_TOP;
  const tipEdge =
    xPct(tipCenter) < 26 ? "left" : xPct(tipCenter) > 74 ? "right" : "mid";
  const tipBelow = tipTopY < PLOT_TOP + 84;

  return (
    <section className="mcfly-chart mcfly-chart--sales mcfly-cpa__chart mcfly-chart--soft" aria-label="Cash CPA explorer">
      <div className="mcfly-chart__head mcfly-chart__board">
        <div className="mcfly-chart__masthead">
          <h3 className="mcfly-chart__serif">Cash CPA explorer</h3>
          <p className="mcfly-chart__muted">
            {CPA_EXPLORER_LONG[activeRange]} · spend bars · Cash CPA line ·{" "}
            {PRODUCT_NOUN.amer} stays off this chart
          </p>
        </div>
        {active ? (
          <div className="mcfly-chart__readout" role="status">
            <p className="mcfly-chart__when">{active.label}</p>
            <p className="mcfly-chart__hero">
              {active.cashCpa != null
                ? formatCurrency(active.cashCpa, currency)
                : "—"}
            </p>
            <p className="mcfly-chart__vs">
              {active.spend > 0
                ? `${formatCurrency(active.spend, currency)} spend`
                : "No typed spend"}
            </p>
          </div>
        ) : (
          <p className="mcfly-chart__hover mcfly-chart__hover--idle" aria-hidden="true">
            Tap a bar
          </p>
        )}
      </div>

      <ul className="mcfly-chart__stats mcfly-chart__stats--soft">
        <li className="mcfly-chart__stat">
          <span className="mcfly-chart__stat-k">Typical CPA</span>
          <span className="mcfly-chart__stat-v">
            {rangeCpa != null ? formatCurrency(rangeCpa, currency) : "—"}
          </span>
          <span className="mcfly-chart__stat-sub">median of days with buyers</span>
        </li>
        <li className="mcfly-chart__stat">
          <span className="mcfly-chart__stat-k">Spend in range</span>
          <span className="mcfly-chart__stat-v">
            {totalSpend > 0 ? formatCurrency(totalSpend, currency) : "—"}
          </span>
          <span className="mcfly-chart__stat-sub">{spendDays} spend {spendDays === 1 ? "day" : "days"}</span>
        </li>
        <li className="mcfly-chart__stat">
          <span className="mcfly-chart__stat-k">Identified buyers</span>
          <span className="mcfly-chart__stat-v">
            {buyersKnown && totalBuyers > 0 ? totalBuyers.toLocaleString() : "—"}
          </span>
          <span className="mcfly-chart__stat-sub">day counts in this grain</span>
        </li>
        <li className="mcfly-chart__stat">
          <span className="mcfly-chart__stat-k">Best CPA</span>
          <span className="mcfly-chart__stat-v">
            {best?.cashCpa != null ? formatCurrency(best.cashCpa, currency) : "—"}
          </span>
          <span className="mcfly-chart__stat-sub">{best?.label ?? "needs buyers"}</span>
        </li>
      </ul>

      <div className="mcfly-chart__controls">
        <div className="mcfly-period__group" role="group" aria-label="CPA range">
          {CPA_EXPLORER_RANGES.map((option) => (
            <button
              key={option}
              type="button"
              className={`mcfly-period__btn${activeRange === option ? " mcfly-period__btn--on" : ""}`}
              aria-pressed={activeRange === option}
              onClick={() => {
                setRangeId(option);
                setHoverIndex(null);
                if (option === "this_month" || option === "last_28") {
                  onSelectWindow(option);
                }
              }}
            >
              {CPA_EXPLORER_LABEL[option]}
            </button>
          ))}
        </div>
        <div className="mcfly-period__group" role="group" aria-label="Chart grain">
          {CPA_GRAINS.map((option) => (
            <button
              key={option}
              type="button"
              className={`mcfly-period__btn${effectiveGrain === option ? " mcfly-period__btn--on" : ""}`}
              aria-pressed={effectiveGrain === option}
              disabled={grainCounts[option] < 2}
              onClick={() => {
                setGrain(option);
                setHoverIndex(null);
              }}
            >
              {CPA_GRAIN_LABEL[option]}
            </button>
          ))}
        </div>
      </div>

      <div className="mcfly-chart__plot">
        <svg
          className="mcfly-chart__svg"
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          preserveAspectRatio="none"
          role="img"
          aria-label={`${points.length} ${effectiveGrain} spend bars with a Cash CPA trend`}
        >
          {leftAxis.ticks.map((tick) => (
            <line
              key={`grid-${tick}`}
              className="mcfly-chart__grid"
              x1={PLOT_LEFT}
              y1={yForSpend(tick).toFixed(1)}
              x2={PLOT_RIGHT}
              y2={yForSpend(tick).toFixed(1)}
              vectorEffect="non-scaling-stroke"
            />
          ))}

          {railY != null ? (
            <line
              className="mcfly-chart__typical"
              x1={PLOT_LEFT}
              y1={railY.toFixed(1)}
              x2={PLOT_RIGHT}
              y2={railY.toFixed(1)}
              vectorEffect="non-scaling-stroke"
            />
          ) : null}

          {points.map((point, index) => {
            const barH = Math.max(1.5, PLOT_BOTTOM - yForSpend(point.spend));
            const openBar = () =>
              drill?.openDrill({
                title: `${CPA_GRAIN_LABEL[effectiveGrain]} cash CPA`,
                value:
                  point.cashCpa != null
                    ? formatCurrency(point.cashCpa, currency)
                    : "—",
                kicker: point.label,
                blocks: [
                  {
                    k: "Spend",
                    v:
                      point.spend > 0
                        ? formatCurrency(point.spend, currency)
                        : "—",
                  },
                  {
                    k: "Identified buyers",
                    v:
                      point.buyers != null && point.buyers > 0
                        ? point.buyers.toLocaleString()
                        : "—",
                  },
                  {
                    k: "Cash CPA",
                    v:
                      point.cashCpa != null
                        ? formatCurrency(point.cashCpa, currency)
                        : "—",
                  },
                  typical != null
                    ? {
                        k: "Typical CPA",
                        v: formatCurrency(typical, currency),
                      }
                    : null,
                  {
                    k: "What this is",
                    v: "Entered spend ÷ Shopify buyers in this bar. Not ads-manager CPA. Missing spend stays —.",
                  },
                ].filter((block): block is { k: string; v: string } => block != null),
                next: "Open Spend Upload to add or edit a day.",
                nextHref: "/app/spend",
                nextLabel: "Spend Upload",
              });
            const barClass = [
              "mcfly-chart__bar",
              point.weekend ? "mcfly-chart__bar--weekend" : null,
              point.cashCpa == null ? "mcfly-chart__bar--cool" : "mcfly-chart__bar--hot",
              activeIndex === index ? "mcfly-chart__bar--on" : null,
            ]
              .filter(Boolean)
              .join(" ");
            return (
              <rect
                key={point.key}
                className={barClass}
                x={barX(index)}
                y={PLOT_BOTTOM - barH}
                width={barW}
                height={barH}
                rx={Math.min(3, barW / 2)}
                tabIndex={0}
                role="button"
                aria-label={`${point.label} spend ${point.spend > 0 ? formatCurrency(point.spend, currency) : "none"}`}
                onClick={openBar}
                onMouseEnter={() => setHoverIndex(index)}
                onMouseLeave={() => setHoverIndex(null)}
                onFocus={() => setHoverIndex(index)}
                onBlur={() => setHoverIndex(null)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    openBar();
                  }
                }}
              />
            );
          })}

          {cpaLine ? <path className="mcfly-chart__sales-line" d={cpaLine} /> : null}

          {active ? (
            <>
              <line
                className="mcfly-chart__guide"
                x1={tipCenter.toFixed(1)}
                y1={PLOT_TOP}
                x2={tipCenter.toFixed(1)}
                y2={PLOT_BOTTOM}
                vectorEffect="non-scaling-stroke"
              />
              {active.cashCpa != null ? (
                <circle
                  className="mcfly-chart__marker"
                  cx={tipCenter.toFixed(1)}
                  cy={yForCpa(active.cashCpa).toFixed(1)}
                  r={3.5}
                />
              ) : null}
            </>
          ) : null}
        </svg>

        <div className="mcfly-chart__axis-y" aria-hidden="true">
          {leftAxis.ticks.map((tick) => (
            <span
              key={`yt-${tick}`}
              className="mcfly-chart__ytick"
              style={{ top: `${yPct(yForSpend(tick))}%`, width: `${xPct(PLOT_LEFT - 8)}%` }}
            >
              {overviewCompactMoney(tick, currency)}
            </span>
          ))}
        </div>
        <div className="mcfly-chart__axis-y2" aria-hidden="true">
          {rightAxis.ticks.map((tick) => (
            <span
              key={`y2-${tick}`}
              className="mcfly-chart__y2tick"
              style={{ top: `${yPct(yForCpa(tick))}%`, right: `${xPct(PAD_R - 8)}%` }}
            >
              {overviewCompactMoney(tick, currency)}
            </span>
          ))}
        </div>
        {railY != null && typical != null ? (
          <span
            className="mcfly-chart__rail-k"
            style={{ top: `${yPct(railY)}%`, left: `${xPct(PLOT_LEFT + 6)}%` }}
            aria-hidden="true"
          >
            typical CPA {formatCurrency(typical, currency)}
          </span>
        ) : null}
        <div className="mcfly-chart__axis-x" aria-hidden="true">
          {points.map((point, index) =>
            labelIndices.has(index) ? (
              <span
                key={`xt-${point.key}`}
                className="mcfly-chart__xtick"
                style={{ left: `${xPct(centerX(index))}%`, top: `${yPct(PLOT_BOTTOM + 7)}%` }}
              >
                {point.label}
              </span>
            ) : null,
          )}
        </div>

        {tipOpen && active ? (
          <div
            className={`mcfly-chart__tip mcfly-chart__tip--${tipEdge}${tipBelow ? " mcfly-chart__tip--below" : ""}`}
            style={{ left: `${xPct(tipCenter)}%`, top: `${yPct(tipTopY)}%` }}
            role="status"
          >
            <p className="mcfly-chart__tip-when">{active.label}</p>
            <ul className="mcfly-chart__tip-rows">
              <li className="mcfly-chart__tip-row">
                <span className="mcfly-chart__tip-dot mcfly-chart__tip-dot--sales" />
                <span className="mcfly-chart__tip-k">Spend</span>
                <span className="mcfly-chart__tip-v">
                  {active.spend > 0 ? formatCurrency(active.spend, currency) : "—"}
                </span>
              </li>
              <li className="mcfly-chart__tip-row">
                <span className="mcfly-chart__tip-dot mcfly-chart__tip-dot--aov" />
                <span className="mcfly-chart__tip-k">Cash CPA</span>
                <span className="mcfly-chart__tip-v">
                  {active.cashCpa != null
                    ? formatCurrency(active.cashCpa, currency)
                    : "—"}
                </span>
              </li>
              {active.buyers != null ? (
                <li className="mcfly-chart__tip-row">
                  <span className="mcfly-chart__tip-dot mcfly-chart__tip-dot--orders" />
                  <span className="mcfly-chart__tip-k">Buyers</span>
                  <span className="mcfly-chart__tip-v">
                    {active.buyers > 0 ? active.buyers.toLocaleString() : "—"}
                  </span>
                </li>
              ) : null}
            </ul>
            <p className="mcfly-chart__tip-foot">
              {active.cashCpa != null
                ? `${formatCurrency(active.spend, currency)} ÷ ${active.buyers?.toLocaleString() ?? "—"} buyers`
                : "Spend without identified buyers stays — , never $0 CPA"}
            </p>
          </div>
        ) : null}
      </div>

      <ul className="mcfly-chart__legend" aria-hidden="true">
        <li className="mcfly-chart__legend-item">
          <span className="mcfly-chart__legend-swatch mcfly-chart__legend-swatch--hot" />
          Spend with CPA
        </li>
        <li className="mcfly-chart__legend-item">
          <span className="mcfly-chart__legend-swatch mcfly-chart__legend-swatch--cool" />
          Spend · buyers unknown
        </li>
        {typical != null ? (
          <li className="mcfly-chart__legend-item">
            <span className="mcfly-chart__legend-swatch mcfly-chart__legend-swatch--rail" />
            Typical CPA
          </li>
        ) : null}
        <li className="mcfly-chart__legend-item">
          <span className="mcfly-chart__legend-swatch mcfly-chart__legend-swatch--aov" />
          Cash CPA
        </li>
      </ul>
    </section>
  );
}
