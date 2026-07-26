import { useEffect, useState } from "react";
import {
  EXPLORER_GRANULARITY_OPTIONS,
  EXPLORER_MODE_OPTIONS,
  EXPLORER_RANGE_OPTIONS,
  explorerBarMax,
  explorerLegendChannels,
  explorerMerCeil,
  type ExplorerGranularity,
  type ExplorerMode,
  type ExplorerPlotBucket,
  type ExplorerRange,
  type ExplorerSummary,
} from "../lib/spend-explorer";
import { formatCurrency, formatMer } from "../lib/mer-format";
import { SPEND_CHANNEL_LABELS, type SpendChannel } from "@mcfly/mer-engine";
import type { PeriodPreset } from "../lib/periods";

export type SpendExplorerSeriesView = {
  buckets: ExplorerPlotBucket[];
  summary: ExplorerSummary;
  mode: ExplorerMode;
  granularity: ExplorerGranularity;
  range: ExplorerRange;
  windowLabel: string;
  targetMer: number;
};

type SpendExplorerProps = {
  series: SpendExplorerSeriesView;
  /** Main desk period — preserved on explorer control navigations. */
  period: PeriodPreset;
  /** Preserve listing shot param when controls change. */
  shotMode?: boolean;
};

function channelLabel(channel: string): string {
  if (channel === "total") return "Total spend";
  const known = SPEND_CHANNEL_LABELS[channel as SpendChannel];
  return known ?? channel;
}

function channelSegClass(channel: string): string {
  if (channel === "total") return "mcfly-explorer__bar-seg--total";
  const known = channel as SpendChannel;
  if (known in SPEND_CHANNEL_LABELS) {
    return `mcfly-stack__seg--${known}`;
  }
  return "mcfly-stack__seg--other";
}

function granPhrase(granularity: ExplorerGranularity, count: number): string {
  switch (granularity) {
    case "Day":
      return count === 1 ? "1 day" : `${count} days`;
    case "Week":
      return count === 1 ? "1 ISO week (Mon start)" : `${count} ISO weeks (Mon start)`;
    case "Month":
      return count === 1 ? "1 month" : `${count} months`;
    default: {
      const _exhaustive: never = granularity;
      return _exhaustive;
    }
  }
}

function modeAxisHint(mode: ExplorerMode): string {
  switch (mode) {
    case "share":
      return "Channel share (%)";
    case "total":
      return "Total spend ($)";
    case "stacked":
      return "Spend by channel ($)";
    default: {
      const _exhaustive: never = mode;
      return _exhaustive;
    }
  }
}

function merToneClass(
  mer: number | null,
  targetMer: number,
): "up" | "down" | "flat" {
  if (mer == null || !(targetMer > 0)) return "flat";
  if (mer >= targetMer) return "up";
  if (mer >= targetMer * 0.85) return "flat";
  return "down";
}

function explorerHref(opts: {
  period: PeriodPreset;
  shotMode: boolean;
  range: ExplorerRange;
  gran: ExplorerGranularity;
  mode: ExplorerMode;
}): string {
  const params = new URLSearchParams();
  params.set("period", opts.period);
  params.set("exRange", opts.range);
  params.set("exGran", opts.gran);
  params.set("exMode", opts.mode);
  if (opts.shotMode) params.set("shot", "1");
  return `/app?${params.toString()}`;
}

function bucketTitle(bucket: ExplorerPlotBucket, mode: ExplorerMode): string {
  const merBit =
    bucket.mer != null
      ? `MER ${formatMer(bucket.mer)} · ${formatCurrency(bucket.sales)} ÷ ${formatCurrency(bucket.spend)}`
      : `${formatCurrency(bucket.spend)} spend · no MER yet`;
  const scaleBit = bucket.scaledToCash ? " · mix scaled to cash spend" : "";
  const modeBit =
    mode === "share" ? " · 100% share" : mode === "total" ? " · total" : "";
  return `${bucket.label}: ${merBit}${modeBit}${scaleBit}`;
}

function segmentDetail(
  bucket: ExplorerPlotBucket,
  mode: ExplorerMode,
): string {
  if (!bucket.bars.length) return "No channel spend in this bucket.";
  return bucket.bars
    .map((seg) =>
      mode === "share"
        ? `${channelLabel(seg.channel)} ${seg.amount.toFixed(1)}%`
        : `${channelLabel(seg.channel)} ${formatCurrency(seg.amount)}`,
    )
    .join(" · ");
}

function downloadExplorerCsv(
  buckets: ExplorerPlotBucket[],
  mode: ExplorerMode,
  range: ExplorerRange,
  gran: ExplorerGranularity,
) {
  const channels = explorerLegendChannels(buckets, mode).filter(
    (c) => c !== "total",
  );
  const headers = [
    "bucket",
    "label",
    "sales",
    "spend",
    "mer",
    ...channels.map((c) => `spend_${c}`),
  ];
  const lines = [headers.join(",")];
  for (const b of buckets) {
    const byCh = new Map(b.bars.map((s) => [s.channel, s.amount]));
    const row = [
      b.key,
      `"${b.label.replace(/"/g, '""')}"`,
      b.sales.toFixed(2),
      b.spend.toFixed(2),
      b.mer == null ? "" : b.mer.toFixed(4),
      ...channels.map((c) => (byCh.get(c) ?? 0).toFixed(2)),
    ];
    lines.push(row.join(","));
  }
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `mcfly-spend-explorer-${range}-${gran}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Spend explorer — channel mix vs cash MER (sales ÷ spend).
 * Server-rendered controls via query links (no Chart.js).
 * URL params: exRange, exGran, exMode (period= kept for main period control).
 */
export function SpendExplorer({
  series,
  period,
  shotMode = false,
}: SpendExplorerProps) {
  const { buckets, mode, targetMer, summary } = series;
  const barMax = explorerBarMax(buckets, mode);
  const merCeil = explorerMerCeil(buckets, targetMer);
  const targetRailPct =
    merCeil > 0 ? Math.min(100, (targetMer / merCeil) * 100) : 0;
  const legend = explorerLegendChannels(buckets, mode);
  const hasBars = buckets.some((b) => b.bars.length > 0 || b.spend > 0);
  const bucketCount = summary.bucketCount || buckets.length;

  const defaultKey =
    [...buckets].reverse().find((b) => b.spend > 0 || b.bars.length > 0)?.key ??
    buckets[buckets.length - 1]?.key ??
    null;
  const [selectedKey, setSelectedKey] = useState<string | null>(defaultKey);

  useEffect(() => {
    setSelectedKey(defaultKey);
  }, [defaultKey, series.range, series.granularity, series.mode]);

  const selected =
    buckets.find((b) => b.key === selectedKey) ??
    buckets.find((b) => b.key === defaultKey) ??
    null;

  const merPoints = buckets.map((b, i) => {
    const x = buckets.length > 0 ? ((i + 0.5) / buckets.length) * 100 : 0;
    const y =
      b.mer != null && merCeil > 0
        ? 100 - Math.min(100, (b.mer / merCeil) * 100)
        : null;
    return {
      x,
      y,
      above: b.mer != null && targetMer > 0 ? b.mer >= targetMer : null,
    };
  });
  const merLine = merPoints
    .filter((p) => p.y != null)
    .map((p) => `${p.x},${p.y as number}`)
    .join(" ");

  const colMinPx =
    series.granularity === "Day" ? 36 : mode === "total" ? 40 : 48;
  const chartMinWidth = Math.max(360, buckets.length * colMinPx + 40);

  return (
    <section
      className="mcfly-panel mcfly-explorer"
      aria-label="Spend explorer — channel mix vs MER"
    >
      <div className="mcfly-panel__head">
        <h2>Spend explorer · channel mix vs MER</h2>
        <p className="mcfly-panel__muted">
          {hasBars
            ? `${granPhrase(series.granularity, bucketCount)} · ${series.windowLabel} · cash MER = sales ÷ spend · closed days only`
            : `No closed days in ${series.windowLabel.toLowerCase()} · cash MER = sales ÷ spend · closed days only`}
        </p>
      </div>

      {hasBars ? (
        <>
          <ul className="mcfly-explorer__chips" aria-label="Explorer summary">
            <li className="mcfly-explorer__chip">
              <span className="mcfly-explorer__chip-k">Sales</span>
              <span className="mcfly-explorer__chip-v">
                {formatCurrency(summary.totalSales)}
              </span>
            </li>
            <li className="mcfly-explorer__chip">
              <span className="mcfly-explorer__chip-k">Spend</span>
              <span className="mcfly-explorer__chip-v">
                {formatCurrency(summary.totalSpend)}
              </span>
            </li>
            <li className="mcfly-explorer__chip">
              <span className="mcfly-explorer__chip-k">Cash MER</span>
              <span
                className={`mcfly-explorer__chip-v mcfly-explorer__chip-v--${merToneClass(summary.overallMer, targetMer)}`}
              >
                {formatMer(summary.overallMer)}
              </span>
            </li>
            <li className="mcfly-explorer__chip mcfly-explorer__chip--mute">
              <span className="mcfly-explorer__chip-k">Bars</span>
              <span className="mcfly-explorer__chip-v">{modeAxisHint(mode)}</span>
            </li>
          </ul>
          {summary.costPerNew != null || summary.costPerCustomer != null ? (
            <p className="mcfly-explorer__eff">
              Efficiency
              {summary.costPerNew != null
                ? ` · cost/new ${formatCurrency(summary.costPerNew)}`
                : ""}
              {summary.costPerCustomer != null
                ? ` · cost/customer ${formatCurrency(summary.costPerCustomer)}`
                : ""}
            </p>
          ) : null}
        </>
      ) : null}

      {!shotMode ? (
        <div className="mcfly-explorer__controls">
          <div
            className="mcfly-explorer__segmented"
            role="group"
            aria-label="Explorer range"
          >
            {EXPLORER_RANGE_OPTIONS.map(({ value, label }) => {
              const on = series.range === value;
              return (
                <a
                  key={value}
                  href={explorerHref({
                    period,
                    shotMode,
                    range: value,
                    gran: series.granularity,
                    mode: series.mode,
                  })}
                  className={`mcfly-explorer__btn${on ? " mcfly-explorer__btn--on" : ""}`}
                  aria-current={on ? "true" : undefined}
                >
                  {label}
                </a>
              );
            })}
          </div>
          <div
            className="mcfly-explorer__segmented"
            role="group"
            aria-label="Bucket size"
          >
            {EXPLORER_GRANULARITY_OPTIONS.map(({ value, label }) => {
              const on = series.granularity === value;
              return (
                <a
                  key={value}
                  href={explorerHref({
                    period,
                    shotMode,
                    range: series.range,
                    gran: value,
                    mode: series.mode,
                  })}
                  className={`mcfly-explorer__btn${on ? " mcfly-explorer__btn--on" : ""}`}
                  aria-current={on ? "true" : undefined}
                >
                  {label}
                </a>
              );
            })}
          </div>
          <div
            className="mcfly-explorer__segmented"
            role="group"
            aria-label="Spend breakdown"
          >
            {EXPLORER_MODE_OPTIONS.map(({ value, label }) => {
              const on = series.mode === value;
              return (
                <a
                  key={value}
                  href={explorerHref({
                    period,
                    shotMode,
                    range: series.range,
                    gran: series.granularity,
                    mode: value,
                  })}
                  className={`mcfly-explorer__btn${on ? " mcfly-explorer__btn--on" : ""}`}
                  aria-current={on ? "true" : undefined}
                >
                  {label}
                </a>
              );
            })}
          </div>
        </div>
      ) : null}

      {hasBars ? (
        <>
          <div className="mcfly-explorer__scroll">
            <div
              className="mcfly-explorer__chart"
              style={{ minWidth: `${chartMinWidth}px` }}
            >
              <div
                className="mcfly-explorer__mer-row"
                style={{
                  gridTemplateColumns: `repeat(${Math.max(buckets.length, 1)}, minmax(0, 1fr))`,
                }}
              >
                {buckets.map((bucket) => {
                  const tone = merToneClass(bucket.mer, targetMer);
                  return (
                    <div
                      key={`mer-${bucket.key}`}
                      className={`mcfly-explorer__mer mcfly-explorer__mer--${tone}`}
                      title={bucketTitle(bucket, mode)}
                    >
                      {bucket.mer != null ? formatMer(bucket.mer) : "—"}
                    </div>
                  );
                })}
              </div>

              <div className="mcfly-explorer__plot-area">
                <div className="mcfly-explorer__axis mcfly-explorer__axis--left" aria-hidden="true">
                  <span>Bars</span>
                  <span>
                    {mode === "share"
                      ? "100%"
                      : formatCurrency(barMax).replace(/\.00$/, "")}
                  </span>
                  <span>0</span>
                </div>
                <div className="mcfly-explorer__axis mcfly-explorer__axis--right" aria-hidden="true">
                  <span>MER</span>
                  <span>{formatMer(merCeil)}</span>
                  <span>0×</span>
                </div>

                <div className="mcfly-explorer__grid" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                  <span />
                </div>

                <div
                  className="mcfly-explorer__rail"
                  style={{ bottom: `${targetRailPct}%` }}
                  aria-hidden="true"
                >
                  <span className="mcfly-explorer__rail-label">
                    Target {formatMer(targetMer)}
                  </span>
                </div>

                <svg
                  className="mcfly-explorer__mer-svg"
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  {merLine ? (
                    <polyline
                      className="mcfly-explorer__mer-line"
                      points={merLine}
                      fill="none"
                    />
                  ) : null}
                  {merPoints.map((p, i) =>
                    p.y != null ? (
                      <circle
                        key={buckets[i]?.key ?? i}
                        className={
                          p.above
                            ? "mcfly-explorer__mer-dot mcfly-explorer__mer-dot--up"
                            : p.above === false
                              ? "mcfly-explorer__mer-dot mcfly-explorer__mer-dot--down"
                              : "mcfly-explorer__mer-dot"
                        }
                        cx={p.x}
                        cy={p.y}
                        r={1.25}
                      />
                    ) : null,
                  )}
                </svg>

                <div
                  className="mcfly-explorer__cols"
                  role="list"
                  style={{
                    gridTemplateColumns: `repeat(${Math.max(buckets.length, 1)}, minmax(0, 1fr))`,
                  }}
                >
                  {buckets.map((bucket) => {
                    const barTotal =
                      mode === "share"
                        ? 100
                        : mode === "total"
                          ? bucket.spend
                          : bucket.bars.reduce((s, c) => s + c.amount, 0);
                    const barH =
                      barTotal > 0
                        ? Math.max(3, Math.round((barTotal / barMax) * 100))
                        : 0;
                    const isOn = selected?.key === bucket.key;
                    return (
                      <div
                        className={`mcfly-explorer__col${isOn ? " mcfly-explorer__col--on" : ""}`}
                        role="listitem"
                        key={bucket.key}
                        tabIndex={0}
                        title={bucketTitle(bucket, mode)}
                        aria-label={bucketTitle(bucket, mode)}
                        aria-pressed={isOn}
                        onClick={() => setSelectedKey(bucket.key)}
                        onFocus={() => setSelectedKey(bucket.key)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setSelectedKey(bucket.key);
                          }
                        }}
                      >
                        <div className="mcfly-explorer__plot">
                          {barH > 0 ? (
                            <div
                              className="mcfly-explorer__bar"
                              style={{ height: `${barH}%` }}
                            >
                              {bucket.bars.map((seg) => (
                                <span
                                  key={seg.channel}
                                  className={`mcfly-explorer__bar-seg ${channelSegClass(seg.channel)}`}
                                  style={{
                                    flexGrow: Math.max(seg.amount, 0.01),
                                    flexBasis: 0,
                                  }}
                                  title={
                                    mode === "share"
                                      ? `${channelLabel(seg.channel)}: ${seg.amount.toFixed(1)}%`
                                      : `${channelLabel(seg.channel)}: ${formatCurrency(seg.amount)}`
                                  }
                                />
                              ))}
                            </div>
                          ) : (
                            <div className="mcfly-explorer__bar mcfly-explorer__bar--empty" />
                          )}
                        </div>
                        <div className="mcfly-explorer__tip" role="tooltip">
                          <strong>{bucket.label}</strong>
                          <span>
                            {bucket.mer != null
                              ? `MER ${formatMer(bucket.mer)}`
                              : "MER —"}
                            {" · "}
                            {formatCurrency(bucket.sales)} sales ÷{" "}
                            {formatCurrency(bucket.spend)} spend
                          </span>
                          <span>{segmentDetail(bucket, mode)}</span>
                          {bucket.scaledToCash ? (
                            <span className="mcfly-explorer__tip-note">
                              Mix scaled to cash spend
                            </span>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div
                className="mcfly-explorer__label-row"
                style={{
                  gridTemplateColumns: `repeat(${Math.max(buckets.length, 1)}, minmax(0, 1fr))`,
                }}
              >
                {buckets.map((bucket) => (
                  <div key={`lbl-${bucket.key}`} className="mcfly-explorer__label">
                    {bucket.label}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mcfly-explorer__readout" aria-live="polite">
            {selected ? (
              <>
                <strong>{selected.label}</strong>
                <span>
                  {selected.mer != null
                    ? `MER ${formatMer(selected.mer)}`
                    : "MER —"}
                  {" · "}
                  {formatCurrency(selected.sales)} sales ÷{" "}
                  {formatCurrency(selected.spend)} spend
                </span>
                <span>{segmentDetail(selected, mode)}</span>
                {selected.scaledToCash ? (
                  <span className="mcfly-explorer__tip-note">
                    Mix scaled to cash spend
                  </span>
                ) : null}
              </>
            ) : (
              <span>
                Select a column · cash MER = sales ÷ spend · bars ={" "}
                {modeAxisHint(mode).toLowerCase()}; line = MER (×)
              </span>
            )}
          </div>

          {!shotMode ? (
            <div className="mcfly-explorer__export">
              <button
                type="button"
                className="mcfly-explorer__export-btn"
                onClick={() =>
                  downloadExplorerCsv(
                    buckets,
                    mode,
                    series.range,
                    series.granularity,
                  )
                }
              >
                Export explorer CSV
              </button>
              <span>Bucket sales · spend · MER · channel mix</span>
            </div>
          ) : null}

          <ul className="mcfly-explorer__legend">
            <li>
              <i
                className="mcfly-explorer__swatch mcfly-explorer__swatch--mer"
                aria-hidden="true"
              />
              MER (sales ÷ spend)
            </li>
            <li>
              <i
                className="mcfly-explorer__swatch mcfly-explorer__swatch--rail"
                aria-hidden="true"
              />
              Target {formatMer(targetMer)}
            </li>
            {legend.map((channel) => (
              <li key={channel}>
                <i
                  className={`mcfly-explorer__swatch ${channelSegClass(channel)}`}
                  aria-hidden="true"
                />
                {channelLabel(channel)}
              </li>
            ))}
          </ul>
        </>
      ) : (
        <div className="mcfly-guide-empty">
          <p className="mcfly-guide-empty__title">
            No spend in {series.windowLabel.toLowerCase()}
          </p>
          <p className="mcfly-guide-empty__copy">
            Log spend by channel by day and the explorer lights up — Shopify sales
            power MER (sales ÷ spend).{" "}
            <a href="/app/spend">Add spend</a>.
          </p>
        </div>
      )}
    </section>
  );
}
