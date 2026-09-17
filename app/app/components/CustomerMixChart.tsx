import { useState } from "react";
import { DeskIcon } from "./DeskIcon";
import { useDeskDrill } from "./DeskDrill";
import { formatCurrency } from "../lib/mer-format";
import { parseShopCurrencyCode } from "../lib/spend-money";
import { useDeskCurrency } from "../lib/desk-currency";
import type { CustomerAnalytics, MixWeek } from "../lib/customers-analytics";

function compact(amount: number, currency: string): string {
  const code = parseShopCurrencyCode(currency);
  if (!code) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: code,
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(amount);
}

function sharePct(s: number | null): string {
  return s != null && Number.isFinite(s) ? `${Math.round(s * 100)}%` : "—";
}

/**
 * New vs returning dollars, week over week — the marquee interactive chart:
 * stacked bars (new + returning $) on the left axis, a returning-share line on
 * the right axis, a dashed window-average rail, and a moving hover readout.
 * Order dollars only — no spend ever overlays this. Hover/tap a week; click for
 * the breakdown.
 */
export function CustomerMixChart({ analytics }: { analytics: CustomerAnalytics }) {
  const currency = useDeskCurrency();
  const drill = useDeskDrill();
  const weeks = analytics.mixWeekly;
  const [active, setActive] = useState<MixWeek | null>(weeks[weeks.length - 1] ?? null);

  if (weeks.length < 2) {
    return (
      <section className="mcfly-chart mcfly-cust-mix" aria-label="New vs returning dollars by week">
        <div className="mcfly-chart__head">
          <p className="mcfly-chart__title">
            <DeskIcon name="chart" /> New vs returning dollars
          </p>
        </div>
        <p className="mcfly-cust-note">
          Needs at least two weeks of orders on file — not zero. Snowdevil SAMPLE fills this in.
        </p>
      </section>
    );
  }

  const width = 720;
  const height = 280;
  const padLeft = 46;
  const padRight = 40;
  const padTop = 16;
  const padBottom = 34;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;
  const baseline = padTop + plotH;
  const gap = Math.max(6, plotW / weeks.length / 5);
  const barW = (plotW - gap * (weeks.length + 1)) / weeks.length;
  const maxDollars = Math.max(...weeks.map((w) => w.total), 1);
  const avg = analytics.mixReturningShareAvg;

  const xOf = (i: number) => padLeft + gap + i * (barW + gap);
  const dToY = (v: number) => baseline - Math.max(0, (v / maxDollars) * plotH);
  const sToY = (s: number) => baseline - Math.min(1, Math.max(0, s)) * plotH;

  const linePts = weeks
    .map((w, i) => ({ w, i }))
    .filter((p) => p.w.returningShare != null)
    .map((p) => ({ x: xOf(p.i) + barW / 2, y: sToY(p.w.returningShare as number) }));
  const line = linePts
    .map((pt, i) => `${i === 0 ? "M" : "L"}${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`)
    .join(" ");

  const shown = active ?? weeks[weeks.length - 1]!;
  const dollarTicks = [0, maxDollars / 2, maxDollars];

  const openWeek = (w: MixWeek) =>
    drill?.openDrill({
      title: `${w.label} · new vs returning`,
      value: formatCurrency(w.returningDollars, currency),
      kicker: `${sharePct(w.returningShare)} of the week's dollars are returning`,
      blocks: [
        { k: "Returning dollars", v: formatCurrency(w.returningDollars, currency) },
        { k: "First-time dollars", v: formatCurrency(w.newDollars, currency) },
        {
          k: "What this is",
          v: "Returning = orders from buyers who had already ordered on file; first-time = their first order (or a guest). Order dollars only — no spend, no pixel.",
        },
      ],
      next: "When they come back (above) shows the repurchase clock behind this line.",
    });

  return (
    <section className="mcfly-chart mcfly-cust-mix" aria-label="New vs returning dollars by week">
      <div className="mcfly-chart__head mcfly-chart__board">
        <p className="mcfly-chart__title">
          <DeskIcon name="chart" /> New vs returning dollars
        </p>
        <div className="mcfly-chart__readout" role="status">
          <p className="mcfly-chart__when">{shown.label} · returning</p>
          <p className="mcfly-chart__hero">{formatCurrency(shown.returningDollars, currency)}</p>
          <p className="mcfly-cust-mix__readsub">
            {sharePct(shown.returningShare)} returning · first-time {formatCurrency(shown.newDollars, currency)}
          </p>
        </div>
      </div>

      <svg
        className="mcfly-chart__svg mcfly-cust-mix__svg"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`${weeks.length} weeks of new vs returning dollars with a returning-share line`}
      >
        {dollarTicks.map((t) => (
          <g key={`y${t}`}>
            <line
              className="mcfly-cust-mix__grid"
              x1={padLeft}
              y1={dToY(t)}
              x2={width - padRight}
              y2={dToY(t)}
            />
            <text className="mcfly-cust-mix__axis" x={padLeft - 6} y={dToY(t) + 3} textAnchor="end">
              {compact(t, currency)}
            </text>
          </g>
        ))}
        {[0, 0.5, 1].map((s) => (
          <text
            key={`r${s}`}
            className="mcfly-cust-mix__axis mcfly-cust-mix__axis--right"
            x={width - padRight + 6}
            y={sToY(s) + 3}
            textAnchor="start"
          >
            {Math.round(s * 100)}%
          </text>
        ))}

        {avg != null ? (
          <>
            <line
              className="mcfly-cust-mix__rail"
              x1={padLeft}
              y1={sToY(avg)}
              x2={width - padRight}
              y2={sToY(avg)}
            />
            <text className="mcfly-cust-mix__rail-k" x={padLeft + 4} y={sToY(avg) - 5}>
              avg returning {Math.round(avg * 100)}%
            </text>
          </>
        ) : null}

        {weeks.map((w, i) => {
          const x = xOf(i);
          const newH = (w.newDollars / maxDollars) * plotH;
          const retH = (w.returningDollars / maxDollars) * plotH;
          const on = shown.key === w.key;
          return (
            <g key={w.key} className={on ? "mcfly-cust-mix__col mcfly-cust-mix__col--on" : "mcfly-cust-mix__col"}>
              <rect
                className="mcfly-cust-mix__bar mcfly-cust-mix__bar--new"
                x={x}
                y={baseline - newH}
                width={barW}
                height={Math.max(0, newH)}
                rx="2"
              />
              <rect
                className="mcfly-cust-mix__bar mcfly-cust-mix__bar--ret"
                x={x}
                y={baseline - newH - retH}
                width={barW}
                height={Math.max(0, retH)}
                rx="2"
              />
            </g>
          );
        })}

        <path className="mcfly-cust-mix__line" d={line} />
        {linePts.map((pt, i) => (
          <circle key={`d${i}`} className="mcfly-cust-mix__dot" cx={pt.x} cy={pt.y} r="2.6" />
        ))}

        {weeks.map((w, i) => (
          <rect
            key={`hit-${w.key}`}
            className="mcfly-cust-mix__hit"
            x={xOf(i) - gap / 2}
            y={padTop}
            width={barW + gap}
            height={plotH}
            tabIndex={0}
            role="button"
            aria-label={`${w.label}: returning ${formatCurrency(w.returningDollars, currency)}, first-time ${formatCurrency(w.newDollars, currency)}`}
            onMouseEnter={() => setActive(w)}
            onMouseLeave={() => setActive(weeks[weeks.length - 1] ?? null)}
            onFocus={() => setActive(w)}
            onClick={() => openWeek(w)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                openWeek(w);
              }
            }}
          />
        ))}

        {weeks.map((w, i) =>
          i % 2 === 0 ? (
            <text
              key={`x${w.key}`}
              className="mcfly-cust-mix__axis"
              x={xOf(i) + barW / 2}
              y={height - 12}
              textAnchor="middle"
            >
              {w.label}
            </text>
          ) : null,
        )}
      </svg>

      <div className="mcfly-cust-legend">
        <span className="mcfly-cust-legend__tag mcfly-cust-mix__tag--ret">Returning $</span>
        <span className="mcfly-cust-legend__tag mcfly-cust-mix__tag--new">First-time $</span>
        <span className="mcfly-cust-legend__tag mcfly-cust-mix__tag--line">Returning share</span>
      </div>
    </section>
  );
}
