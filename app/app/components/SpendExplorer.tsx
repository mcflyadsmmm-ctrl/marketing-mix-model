import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import {
  EXPLORER_GRANULARITY_OPTIONS,
  EXPLORER_MODE_OPTIONS,
  EXPLORER_RANGE_OPTIONS,
  dateKeyFromLocal,
  explorerBarMax,
  explorerLegendChannels,
  explorerMerCeil,
  explorerSalesCeil,
  type ExplorerGranularity,
  type ExplorerMode,
  type ExplorerPlotBucket,
  type ExplorerRange,
  type ExplorerSummary,
} from "../lib/spend-explorer";
import { formatCurrency, formatMer, merToneBand } from "../lib/mer-format";
import { PRODUCT_NOUN } from "../lib/product-labels";
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
  /** Break-even Total ROAS rail (from margin) — optional dashed accent. */
  breakEvenMer: number | null;
  /** mcflyads till instrument — sales polyline on left $ axis. */
  showSales: boolean;
  /** Effective window FROM (YYYY-MM-DD) for date inputs. */
  fromKey: string;
  /** Effective window TO (YYYY-MM-DD) for date inputs. */
  toKey: string;
  /** Closed-day as-of key for subtitle. */
  asOfKey: string;
};

type SpendExplorerProps = {
  series: SpendExplorerSeriesView;
  /** Main desk period — preserved on explorer control navigations. */
  period: PeriodPreset;
  /** Preserve listing shot param when controls change. */
  shotMode?: boolean;
};

/** Unified scaled-mix note — always "cash spend", never Total Cost. */
const SCALED_MIX_NOTE =
  "Channels reported > cash spend — mix scaled to cash spend";

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

/** One phrase: "Total ROAS Z× · X sales ÷ Y spend" for tip / title / readout. */
function bucketMerPhrase(bucket: {
  sales: number;
  spend: number;
  mer: number | null;
}): string {
  const base = `${formatCurrency(bucket.sales)} sales ÷ ${formatCurrency(bucket.spend)} spend`;
  return bucket.mer != null
    ? `${PRODUCT_NOUN.totalRoas} ${formatMer(bucket.mer)} · ${base}`
    : base;
}

/** Desk query keys we own — everything else (shop/host/embedded/…) must survive. */
const EXPLORER_OWNED_KEYS = [
  "period",
  "exRange",
  "exGran",
  "exMode",
  "exSales",
  "exFrom",
  "exTo",
  "shot",
] as const;

function explorerSearch(
  current: URLSearchParams,
  opts: {
    period: PeriodPreset;
    shotMode: boolean;
    range: ExplorerRange;
    gran: ExplorerGranularity;
    mode: ExplorerMode;
    showSales: boolean;
    from?: string | null;
    to?: string | null;
  },
): string {
  const params = new URLSearchParams(current);
  for (const key of EXPLORER_OWNED_KEYS) params.delete(key);
  params.set("period", opts.period);
  params.set("exRange", opts.range);
  params.set("exGran", opts.gran);
  params.set("exMode", opts.mode);
  if (opts.showSales) params.set("exSales", "1");
  if (opts.range === "custom" && opts.from && opts.to) {
    params.set("exFrom", opts.from);
    params.set("exTo", opts.to);
  }
  if (opts.shotMode) params.set("shot", "1");
  const q = params.toString();
  return q ? `?${q}` : "";
}

function bucketTitle(bucket: ExplorerPlotBucket, mode: ExplorerMode): string {
  const scaleBit = bucket.scaledToCash ? ` · ${SCALED_MIX_NOTE}` : "";
  const modeBit =
    mode === "share" ? " · 100% share" : mode === "total" ? " · total" : "";
  return `${bucket.label}: ${bucketMerPhrase(bucket)}${modeBit}${scaleBit}`;
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
    "total_roas",
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
 * Spend explorer — channel mix vs Total ROAS (sales ÷ spend).
 * Server-rendered controls via query links (no Chart.js).
 * URL: exRange, exGran, exMode, exSales, exFrom, exTo (period= kept for desk).
 */
export function SpendExplorer({
  series,
  period,
  shotMode = false,
}: SpendExplorerProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { buckets, mode, targetMer, breakEvenMer, showSales } = series;
  const isShare = mode === "share";
  const barMax = explorerBarMax(buckets, mode);
  /** Spend bars / left axis stay on spend scale — sales polyline uses its own ceil. */
  const leftCeil = barMax;
  const salesCeil =
    showSales && !isShare ? explorerSalesCeil(buckets, 0) : 0;
  const merCeil = explorerMerCeil(buckets, targetMer, breakEvenMer);
  const targetRailPct =
    merCeil > 0 && targetMer > 0
      ? Math.min(100, (targetMer / merCeil) * 100)
      : 0;
  const beRailPct =
    merCeil > 0 && breakEvenMer != null && breakEvenMer > 0
      ? Math.min(100, (breakEvenMer / merCeil) * 100)
      : null;
  const legend = explorerLegendChannels(buckets, mode);
  const hasBars = buckets.some((b) => b.bars.length > 0 || b.spend > 0);

  const defaultKey =
    [...buckets].reverse().find((b) => b.spend > 0 || b.bars.length > 0)?.key ??
    buckets[buckets.length - 1]?.key ??
    null;
  const [selectedKey, setSelectedKey] = useState<string | null>(defaultKey);
  const [fromDraft, setFromDraft] = useState(series.fromKey);
  const [toDraft, setToDraft] = useState(series.toKey);

  useEffect(() => {
    setSelectedKey(defaultKey);
  }, [defaultKey, series.range, series.granularity, series.mode]);

  useEffect(() => {
    setFromDraft(series.fromKey);
    setToDraft(series.toKey);
  }, [series.fromKey, series.toKey]);

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
      tone: merToneBand(b.mer, targetMer),
    };
  });
  const merLine = merPoints
    .filter((p) => p.y != null)
    .map((p) => `${p.x},${p.y as number}`)
    .join(" ");

  const salesPoints =
    showSales && !isShare
      ? buckets.map((b, i) => {
          const x = buckets.length > 0 ? ((i + 0.5) / buckets.length) * 100 : 0;
          const y =
            salesCeil > 0
              ? 100 - Math.min(100, (b.sales / salesCeil) * 100)
              : null;
          return { x, y };
        })
      : [];
  const salesLine = salesPoints
    .filter((p) => p.y != null)
    .map((p) => `${p.x},${p.y as number}`)
    .join(" ");

  const colMinPx =
    series.granularity === "Day"
      ? 36
      : series.granularity === "Quarter"
        ? 56
        : mode === "total"
          ? 40
          : 48;
  const chartMinWidth = Math.max(360, buckets.length * colMinPx + 40);

  const hrefBase = {
    period,
    shotMode,
    gran: series.granularity,
    mode: series.mode,
    showSales,
  };

  function toExplorer(opts: {
    range: ExplorerRange;
    gran?: ExplorerGranularity;
    mode?: ExplorerMode;
    showSales?: boolean;
    from?: string | null;
    to?: string | null;
  }) {
    return {
      pathname: "/app" as const,
      search: explorerSearch(searchParams, {
        ...hrefBase,
        range: opts.range,
        gran: opts.gran ?? series.granularity,
        mode: opts.mode ?? series.mode,
        showSales: opts.showSales ?? showSales,
        from: opts.from,
        to: opts.to,
      }),
    };
  }

  function goCustomDates(from: string, to: string) {
    if (!from || !to) return;
    navigate(
      toExplorer({
        range: "custom",
        from,
        to,
      }),
      { preventScrollReset: true },
    );
  }

  const labelCount = buckets.length;
  const labelStep =
    labelCount > 10 ? Math.ceil(labelCount / 8) : 1;
  const showAxisLabel = (index: number) => {
    if (labelCount <= 10) return true;
    if (index === 0 || index === labelCount - 1) return true;
    return index % labelStep === 0;
  };

  function onDateSubmit(e: FormEvent) {
    e.preventDefault();
    if (fromDraft && toDraft) goCustomDates(fromDraft, toDraft);
  }

  return (
    <section
      className="mcfly-panel mcfly-explorer mcfly-explorer--lean"
      aria-label={PRODUCT_NOUN.explorer}
    >
      <div className="mcfly-panel__head mcfly-explorer__head">
        <h2>{PRODUCT_NOUN.explorer}</h2>
        <p className="mcfly-panel__muted">
          Channel mix vs {PRODUCT_NOUN.totalRoas} · {PRODUCT_NOUN.definition} ·{" "}
          {series.windowLabel} · as of {series.asOfKey}
        </p>
      </div>
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
                <Link
                  key={value}
                  to={toExplorer({ range: value })}
                  preventScrollReset
                  className={`mcfly-explorer__btn${on ? " mcfly-explorer__btn--on" : ""}`}
                  aria-current={on ? "true" : undefined}
                >
                  {label}
                </Link>
              );
            })}
          </div>

          <form
            className="mcfly-explorer__dates"
            aria-label="Custom date range"
            onSubmit={onDateSubmit}
          >
            <label className="mcfly-explorer__date">
              FROM
              <input
                type="date"
                name="exFrom"
                value={fromDraft}
                max={series.asOfKey || dateKeyFromLocal(new Date())}
                onChange={(e) => {
                  const v = e.target.value;
                  setFromDraft(v);
                  if (v && toDraft) goCustomDates(v, toDraft);
                }}
              />
            </label>
            <label className="mcfly-explorer__date">
              TO
              <input
                type="date"
                name="exTo"
                value={toDraft}
                max={series.asOfKey || dateKeyFromLocal(new Date())}
                onChange={(e) => {
                  const v = e.target.value;
                  setToDraft(v);
                  if (fromDraft && v) goCustomDates(fromDraft, v);
                }}
              />
            </label>
          </form>

          <div
            className="mcfly-explorer__segmented"
            role="group"
            aria-label="Bucket size"
          >
            {EXPLORER_GRANULARITY_OPTIONS.map(({ value, label }) => {
              const on = series.granularity === value;
              return (
                <Link
                  key={value}
                  to={toExplorer({
                    range: series.range,
                    gran: value,
                    from: series.range === "custom" ? series.fromKey : null,
                    to: series.range === "custom" ? series.toKey : null,
                  })}
                  preventScrollReset
                  className={`mcfly-explorer__btn${on ? " mcfly-explorer__btn--on" : ""}`}
                  aria-current={on ? "true" : undefined}
                >
                  {label}
                </Link>
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
                <Link
                  key={value}
                  to={toExplorer({
                    range: series.range,
                    mode: value,
                    from: series.range === "custom" ? series.fromKey : null,
                    to: series.range === "custom" ? series.toKey : null,
                  })}
                  preventScrollReset
                  className={`mcfly-explorer__btn${on ? " mcfly-explorer__btn--on" : ""}`}
                  aria-current={on ? "true" : undefined}
                >
                  {label}
                </Link>
              );
            })}
          </div>

          <button
            type="button"
            className={`mcfly-explorer__sales-toggle${showSales ? " mcfly-explorer__sales-toggle--on" : ""}${isShare ? " mcfly-explorer__sales-toggle--disabled" : ""}`}
            aria-pressed={showSales}
            disabled={isShare}
            title={
              isShare
                ? "Sales line is hidden in share % mode (left axis is %)"
                : "Toggle sales polyline (own $ scale — spend bars stay full height)"
            }
            onClick={() => {
              if (isShare) return;
              navigate(
                toExplorer({
                  range: series.range,
                  showSales: !showSales,
                  from: series.range === "custom" ? series.fromKey : null,
                  to: series.range === "custom" ? series.toKey : null,
                }),
                { preventScrollReset: true },
              );
            }}
          >
            <span
              className="mcfly-explorer__sales-check"
              aria-hidden="true"
            />
            Sales line
          </button>
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
                  const tone = merToneBand(bucket.mer, targetMer);
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
                <div
                  className="mcfly-explorer__axis mcfly-explorer__axis--left"
                  aria-hidden="true"
                >
                  <span>{isShare ? "Share" : "Spend"}</span>
                  <span>
                    {isShare
                      ? "100%"
                      : formatCurrency(leftCeil).replace(/\.00$/, "")}
                  </span>
                  <span>0</span>
                </div>
                <div
                  className="mcfly-explorer__axis mcfly-explorer__axis--right"
                  aria-hidden="true"
                >
                  <span>{PRODUCT_NOUN.totalRoas}</span>
                  <span>{formatMer(merCeil)}</span>
                  <span>0×</span>
                </div>

                <div className="mcfly-explorer__grid" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                  <span />
                </div>

                {beRailPct != null ? (
                  <div
                    className="mcfly-explorer__rail mcfly-explorer__rail--be"
                    style={{ bottom: `${beRailPct}%` }}
                    aria-hidden="true"
                  >
                    <span className="mcfly-explorer__rail-label">
                      BE {formatMer(breakEvenMer)}
                    </span>
                  </div>
                ) : null}

                {targetMer > 0 ? (
                  <div
                    className="mcfly-explorer__rail mcfly-explorer__rail--target"
                    style={{ bottom: `${targetRailPct}%` }}
                    aria-hidden="true"
                  >
                    <span className="mcfly-explorer__rail-label">
                      Target {PRODUCT_NOUN.totalRoasShort} {formatMer(targetMer)}
                    </span>
                  </div>
                ) : null}

                <svg
                  className="mcfly-explorer__mer-svg"
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  {salesLine ? (
                    <polyline
                      className="mcfly-explorer__sales-line"
                      points={salesLine}
                      fill="none"
                    />
                  ) : null}
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
                          p.tone === "up"
                            ? "mcfly-explorer__mer-dot mcfly-explorer__mer-dot--up"
                            : p.tone === "down"
                              ? "mcfly-explorer__mer-dot mcfly-explorer__mer-dot--down"
                              : "mcfly-explorer__mer-dot"
                        }
                        cx={p.x}
                        cy={p.y}
                        // Small, constant “point” per bucket (keeps the chart calm).
                        r={0.85}
                      />
                    ) : null,
                  )}
                </svg>

                  <div
                    className="mcfly-explorer__cols"
                    role="listbox"
                    aria-label={`${PRODUCT_NOUN.explorer} columns`}
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
                        ? Math.max(3, Math.round((barTotal / leftCeil) * 100))
                        : 0;
                    const isOn = selected?.key === bucket.key;
                    return (
                      <div
                        className={`mcfly-explorer__col${isOn ? " mcfly-explorer__col--on" : ""}`}
                        role="option"
                        key={bucket.key}
                        tabIndex={0}
                        title={bucketTitle(bucket, mode)}
                        aria-label={bucketTitle(bucket, mode)}
                        aria-selected={isOn}
                        onClick={() => setSelectedKey(bucket.key)}
                        onFocus={() => setSelectedKey(bucket.key)}
                        onMouseEnter={() => setSelectedKey(bucket.key)}
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
                          <span>{bucketMerPhrase(bucket)}</span>
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
                {buckets.map((bucket, index) => {
                  const visible = showAxisLabel(index);
                  return (
                    <div
                      key={`lbl-${bucket.key}`}
                      className={`mcfly-explorer__label${visible ? "" : " mcfly-explorer__label--mute"}`}
                      aria-hidden={visible ? undefined : true}
                    >
                      {visible ? bucket.label : ""}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div
            className={`mcfly-explorer__readout${selected ? " mcfly-explorer__readout--on" : ""}`}
            aria-live="polite"
          >
            {selected ? (
              <>
                <strong>{selected.label}</strong>
                <span>{bucketMerPhrase(selected)}</span>
                {selected.scaledToCash ? (
                  <span className="mcfly-explorer__tip-note">
                    Mix scaled to cash spend
                  </span>
                ) : null}
              </>
            ) : (
              <span>Hover or click a column</span>
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
              <span>
                Bucket sales · spend · {PRODUCT_NOUN.totalRoasShort} · channel mix
              </span>
            </div>
          ) : null}

          <ul className="mcfly-explorer__legend">
            <li>
              <i
                className="mcfly-explorer__swatch mcfly-explorer__swatch--mer"
                aria-hidden="true"
              />
              {PRODUCT_NOUN.totalRoas} (sales ÷ spend)
            </li>
            {targetMer > 0 ? (
              <li>
                <i
                  className="mcfly-explorer__swatch mcfly-explorer__swatch--rail"
                  aria-hidden="true"
                />
                Target {PRODUCT_NOUN.totalRoas}
              </li>
            ) : null}
            {beRailPct != null ? (
              <li>
                <i
                  className="mcfly-explorer__swatch mcfly-explorer__swatch--rail-be"
                  aria-hidden="true"
                />
                {PRODUCT_NOUN.breakEvenShort}
              </li>
            ) : null}
            {showSales && !isShare ? (
              <li>
                <i
                  className="mcfly-explorer__swatch mcfly-explorer__swatch--sales"
                  aria-hidden="true"
                />
                Sales
              </li>
            ) : null}
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
            Export channel spend by day and upload.{" "}
            {PRODUCT_NOUN.definitionForPeriod}. The explorer fills once spend
            lands.
          </p>
          <p className="mcfly-guide-empty__actions">
            <Link
              className="mcfly-explorer__cta"
              preventScrollReset
              to={{
                pathname: "/app/spend",
                search: searchParams.toString()
                  ? `?${searchParams.toString()}`
                  : "",
                hash: "mcfly-spend-uploads",
              }}
            >
              Export &amp; upload spend
            </Link>
            <Link
              className="mcfly-explorer__cta mcfly-explorer__cta--ghost"
              preventScrollReset
              to={{
                pathname: "/app/spend",
                search: searchParams.toString()
                  ? `?${searchParams.toString()}`
                  : "",
              }}
            >
              Open Spend
            </Link>
          </p>
        </div>
      )}
    </section>
  );
}
