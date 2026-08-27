import { useEffect, useMemo, useState, type FormEvent, type KeyboardEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import {
  EXPLORER_GRANULARITY_OPTIONS,
  EXPLORER_MODE_OPTIONS,
  EXPLORER_RANGE_OPTIONS,
  compareExplorerBuckets,
  dateKeyFromLocal,
  explorerLegendChannels,
  explorerMerCeil,
  explorerMoneyCeil,
  orderBarsByLegend,
  type ExplorerBucketComparison,
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
  /** mcflyads till instrument — sales polyline on shared left $ axis. */
  showSales: boolean;
  /** Effective window FROM (YYYY-MM-DD) for date inputs. */
  fromKey: string;
  /** Effective window TO (YYYY-MM-DD) for date inputs. */
  toKey: string;
  /** Closed-day as-of key for subtitle. */
  asOfKey: string;
  /**
   * Slice key → merchant-facing name for named `other` extras, so a Billboard
   * band is labelled Billboard here and on Overview, never "Other".
   */
  channelLabels?: Record<string, string>;
};

type SpendExplorerProps = {
  series: SpendExplorerSeriesView;
  /** Main desk period — preserved on explorer control navigations. */
  period: PeriodPreset;
  /** Preserve listing shot param when controls change. */
  shotMode?: boolean;
  /**
   * Where range / granularity clicks stay. Overview defaults to `/app`.
   * Spend embeds the explorer and must keep drill-down on `/app/spend`.
   */
  basePath?: "/app" | "/app/spend";
  /**
   * This-period-vs-prior comparison (day vs previous day, week vs previous
   * week, …) in the ROAS tip + a summary row. Default off — Overview
   * unchanged until it opts in.
   */
  compare?: boolean;
  /** Layout — "spend" trims chrome for the Spend tab embed. */
  variant?: SpendExplorerVariant;
};

/** "overview" = full chrome (default); "spend" = compact embed. */
export type SpendExplorerVariant = "overview" | "spend";

type ExplorerHover =
  | { kind: "seg"; bucketKey: string; channel: string }
  | { kind: "dot"; bucketKey: string }
  | null;

/** Unified scaled-mix note — always "cash spend", never Total Cost. */
const SCALED_MIX_NOTE =
  "Channels reported > cash spend — mix scaled to cash spend";

const PAD_L = 56;
const PAD_R = 48;
const PAD_T = 16;
const PAD_B = 28;
const PLOT_H = 270;

function channelLabel(
  channel: string,
  customLabels?: Record<string, string>,
): string {
  if (channel === "total") return "Total spend";
  const custom = customLabels?.[channel];
  if (custom) return custom;
  const known = SPEND_CHANNEL_LABELS[channel as SpendChannel];
  return known ?? channel;
}

/**
 * SVG fill / tip swatch class — uses CSS vars via `.mcfly-explorer__seg--*`.
 * Named extras arrive as `other:<slug>` and share the Other band colour.
 */
function channelSegClass(channel: string): string {
  if (channel === "total") return "mcfly-explorer__seg--total";
  const known = channel.split(":")[0] as SpendChannel;
  if (known in SPEND_CHANNEL_LABELS) {
    return `mcfly-explorer__seg--${known}`;
  }
  return "mcfly-explorer__seg--other";
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

function explorerVariantClass(variant: SpendExplorerVariant): string {
  switch (variant) {
    case "overview":
      return "";
    case "spend":
      return " mcfly-explorer--compact";
    default: {
      const _exhaustive: never = variant;
      return _exhaustive;
    }
  }
}

/** "vs prior day / week / month / quarter" noun for the compare row. */
function granCompareNoun(granularity: ExplorerGranularity): string {
  switch (granularity) {
    case "Day":
      return "day";
    case "Week":
      return "week";
    case "Month":
      return "month";
    case "Quarter":
      return "quarter";
    default: {
      const _exhaustive: never = granularity;
      return _exhaustive;
    }
  }
}

function signedCurrency(delta: number): string {
  const sign = delta < 0 ? "−" : "+";
  return `${sign}${formatCurrency(Math.abs(delta))}`;
}

function signedMer(delta: number): string {
  const sign = delta < 0 ? "−" : "+";
  return `${sign}${formatMer(Math.abs(delta))}×`;
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

function explorerEmptyCopy(variant: SpendExplorerVariant): string {
  switch (variant) {
    case "spend":
      return "Paste daily rows in Fill history, or add one day’s invoice. Day / week / month comparison fills once spend lands.";
    case "overview":
      return `Export channel spend by day and upload. ${PRODUCT_NOUN.definitionForPeriod}. The explorer fills once spend lands.`;
    default: {
      const _exhaustive: never = variant;
      return _exhaustive;
    }
  }
}

function explorerEmptySearch(searchParams: URLSearchParams): string {
  const q = searchParams.toString();
  return q ? `?${q}` : "";
}

function explorerEmptyActions(
  variant: SpendExplorerVariant,
  searchParams: URLSearchParams,
) {
  const search = explorerEmptySearch(searchParams);
  switch (variant) {
    case "spend":
      return (
        <>
          <Link
            className="mcfly-explorer__cta"
            preventScrollReset
            to={{
              pathname: "/app/spend",
              search,
              hash: "mcfly-spend-csv",
            }}
          >
            Fill history
          </Link>
          <Link
            className="mcfly-explorer__cta mcfly-explorer__cta--ghost"
            preventScrollReset
            to={{
              pathname: "/app/spend",
              search,
              hash: "mcfly-spend-add",
            }}
          >
            Add a day’s spend
          </Link>
        </>
      );
    case "overview":
      return (
        <>
          <Link
            className="mcfly-explorer__cta"
            preventScrollReset
            to={{
              pathname: "/app/spend",
              search,
              hash: "mcfly-spend-add",
            }}
          >
            Add a day’s spend
          </Link>
          <Link
            className="mcfly-explorer__cta mcfly-explorer__cta--ghost"
            preventScrollReset
            to={{
              pathname: "/app/spend",
              search,
            }}
          >
            Open Spend
          </Link>
        </>
      );
    default: {
      const _exhaustive: never = variant;
      return _exhaustive;
    }
  }
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

function colMinPxFor(
  gran: ExplorerGranularity,
  mode: ExplorerMode,
): number {
  if (gran === "Day") return 44;
  if (gran === "Quarter") return 64;
  if (mode === "total") return 48;
  return 52;
}

function axisMoneyLabel(n: number, isShare: boolean): string {
  if (isShare) return `${Math.round(n)}%`;
  return formatCurrency(n).replace(/\.00$/, "");
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

/**
 * Spend explorer — channel mix vs Total ROAS (sales ÷ spend).
 * Unified SVG plot (no Chart.js). URL: exRange, exGran, exMode, exSales, exFrom, exTo.
 */
export function SpendExplorer({
  series,
  period,
  shotMode = false,
  basePath = "/app",
  compare = false,
  variant = "overview",
}: SpendExplorerProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { buckets: allBuckets, mode, targetMer, breakEvenMer, showSales } =
    series;
  const customChannelLabels = series.channelLabels;
  const isShare = mode === "share";

  const comparisons = useMemo<Map<string, ExplorerBucketComparison> | null>(
    () =>
      compare
        ? new Map(
            compareExplorerBuckets(allBuckets, series.granularity).map(
              (c) => [c.key, c],
            ),
          )
        : null,
    [compare, allBuckets, series.granularity],
  );

  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [hover, setHover] = useState<ExplorerHover>(null);
  const [hiddenChannels, setHiddenChannels] = useState<Set<string>>(
    () => new Set(),
  );
  const [fromDraft, setFromDraft] = useState(series.fromKey);
  const [toDraft, setToDraft] = useState(series.toKey);

  const visibleBuckets = allBuckets;

  const legend = useMemo(
    () => explorerLegendChannels(allBuckets, mode),
    [allBuckets, mode],
  );

  const leftCeil = explorerMoneyCeil(visibleBuckets, mode, showSales && !isShare);
  const merCeil = explorerMerCeil(visibleBuckets, targetMer, breakEvenMer);
  const hasBars = allBuckets.some((b) => b.bars.length > 0 || b.spend > 0);

  const defaultKey =
    [...visibleBuckets]
      .reverse()
      .find((b) => b.spend > 0 || b.bars.length > 0)?.key ??
    visibleBuckets[visibleBuckets.length - 1]?.key ??
    null;

  useEffect(() => {
    setSelectedKey(defaultKey);
    setHover(null);
  }, [defaultKey, series.range, series.granularity, series.mode]);

  useEffect(() => {
    setFromDraft(series.fromKey);
    setToDraft(series.toKey);
  }, [series.fromKey, series.toKey]);

  useEffect(() => {
    setHiddenChannels(new Set());
  }, [series.mode, series.range, series.granularity]);

  const selected =
    visibleBuckets.find((b) => b.key === selectedKey) ??
    visibleBuckets.find((b) => b.key === defaultKey) ??
    null;
  const selectedIndex = selected
    ? visibleBuckets.findIndex((b) => b.key === selected.key)
    : -1;
  const hoverBucketKey = hover?.bucketKey ?? null;
  const tipBucket =
    !shotMode && hoverBucketKey
      ? (visibleBuckets.find((b) => b.key === hoverBucketKey) ?? null)
      : null;
  const tipIndex = tipBucket
    ? visibleBuckets.findIndex((b) => b.key === tipBucket.key)
    : -1;
  const activeKey = hoverBucketKey ?? selected?.key ?? null;
  const activeIndex =
    activeKey != null
      ? visibleBuckets.findIndex((b) => b.key === activeKey)
      : -1;

  const hoverSeg =
    hover?.kind === "seg" && tipBucket
      ? tipBucket.bars.find((s) => s.channel === hover.channel) ?? null
      : null;

  const selectedCmp =
    selected && comparisons ? (comparisons.get(selected.key) ?? null) : null;
  const tipCmp =
    tipBucket && comparisons ? (comparisons.get(tipBucket.key) ?? null) : null;
  const compareNoun = granCompareNoun(series.granularity);

  const datesDirty =
    fromDraft !== series.fromKey || toDraft !== series.toKey;

  const n = visibleBuckets.length;
  const colMinPx = colMinPxFor(series.granularity, mode);
  const vbW = Math.max(360, n * colMinPx);
  const vbH = PAD_T + PLOT_H + PAD_B;
  const plotW = Math.max(1, vbW - PAD_L - PAD_R);
  const slotW = n > 0 ? plotW / n : plotW;
  const barW = slotW * 0.62;

  const yLeft = (val: number) =>
    PAD_T + PLOT_H - (leftCeil > 0 ? (val / leftCeil) * PLOT_H : 0);
  const yMer = (val: number) =>
    PAD_T + PLOT_H - (merCeil > 0 ? (val / merCeil) * PLOT_H : 0);
  const xCenter = (i: number) => PAD_L + (i + 0.5) * slotW;

  const gridFracs = [0, 0.25, 0.5, 0.75, 1] as const;

  const merPoints = visibleBuckets.map((b, i) => {
    const x = xCenter(i);
    const y =
      b.mer != null && merCeil > 0
        ? yMer(Math.min(b.mer, merCeil))
        : null;
    return {
      x,
      y,
      tone: merToneBand(b.mer, targetMer),
      key: b.key,
    };
  });
  const merLine = merPoints
    .filter((p) => p.y != null)
    .map((p) => `${p.x},${p.y as number}`)
    .join(" ");

  const salesPoints =
    showSales && !isShare
      ? visibleBuckets.map((b, i) => {
          const x = xCenter(i);
          const y =
            leftCeil > 0
              ? yLeft(Math.min(b.sales, leftCeil))
              : null;
          return { x, y, key: b.key };
        })
      : [];
  const salesLine = salesPoints
    .filter((p) => p.y != null)
    .map((p) => `${p.x},${p.y as number}`)
    .join(" ");

  const labelCount = n;
  const labelStep = labelCount > 10 ? Math.ceil(labelCount / 8) : 1;
  const showAxisLabel = (index: number) => {
    if (labelCount <= 10) return true;
    if (index === 0 || index === labelCount - 1) return true;
    return index % labelStep === 0;
  };

  const tipLeftPct =
    tipIndex >= 0 && n > 0
      ? clamp((xCenter(tipIndex) / vbW) * 100, 10, 90)
      : 0;

  /** Tip sits mid-plot vertically so it doesn't cover the whole chart. */
  const tipTopPct =
    hover?.kind === "dot"
      ? 18
      : hover?.kind === "seg"
        ? 42
        : 28;

  const crosshairX =
    activeIndex >= 0 ? xCenter(activeIndex) : null;

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
      pathname: basePath,
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

  function onDateSubmit(e: FormEvent) {
    e.preventDefault();
    if (fromDraft && toDraft) goCustomDates(fromDraft, toDraft);
  }

  function moveSelection(delta: number) {
    if (!visibleBuckets.length) return;
    const cur =
      selectedIndex >= 0
        ? selectedIndex
        : Math.max(0, visibleBuckets.length - 1);
    const next = Math.min(
      visibleBuckets.length - 1,
      Math.max(0, cur + delta),
    );
    const key = visibleBuckets[next]?.key;
    if (key) setSelectedKey(key);
  }

  function onPlotKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      moveSelection(-1);
      return;
    }
    if (e.key === "ArrowRight") {
      e.preventDefault();
      moveSelection(1);
      return;
    }
    if (e.key === "Home") {
      e.preventDefault();
      const key = visibleBuckets[0]?.key;
      if (key) setSelectedKey(key);
      return;
    }
    if (e.key === "End") {
      e.preventDefault();
      const key = visibleBuckets[visibleBuckets.length - 1]?.key;
      if (key) setSelectedKey(key);
    }
  }

  function toggleChannel(channel: string) {
    setHiddenChannels((prev) => {
      const next = new Set(prev);
      if (next.has(channel)) next.delete(channel);
      else next.add(channel);
      return next;
    });
  }

  function visibleOrderedBars(bucket: ExplorerPlotBucket) {
    return orderBarsByLegend(bucket.bars, legend).filter(
      (seg) => !hiddenChannels.has(seg.channel),
    );
  }

  function segShare(bucket: ExplorerPlotBucket, channel: string): number {
    const ordered = visibleOrderedBars(bucket).filter((s) => s.amount > 0);
    const barSum = ordered.reduce((s, c) => s + c.amount, 0);
    const amt = ordered.find((s) => s.channel === channel)?.amount ?? 0;
    return barSum > 0 ? (amt / barSum) * 100 : 0;
  }

  return (
    <section
      className={`mcfly-panel mcfly-explorer mcfly-explorer--lean${explorerVariantClass(variant)}`}
      aria-label={PRODUCT_NOUN.explorer}
    >
      <div className="mcfly-panel__head mcfly-explorer__head mcfly-explorer__head--lean">
        <h2>{PRODUCT_NOUN.explorer}</h2>
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
                onChange={(e) => setFromDraft(e.target.value)}
              />
            </label>
            <label className="mcfly-explorer__date">
              TO
              <input
                type="date"
                name="exTo"
                value={toDraft}
                max={series.asOfKey || dateKeyFromLocal(new Date())}
                onChange={(e) => setToDraft(e.target.value)}
              />
            </label>
            <button
              type="submit"
              className={`mcfly-explorer__btn mcfly-explorer__btn--apply${datesDirty ? " mcfly-explorer__btn--on" : ""}`}
              disabled={!fromDraft || !toDraft}
            >
              Apply
            </button>
          </form>

          {variant === "spend" ? (
            <span className="mcfly-explorer__control-label">Group chart by</span>
          ) : null}
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
                ? "Sales line is hidden in share % mode"
                : "Toggle sales on shared $ axis"
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
            Sales
          </button>
        </div>
      ) : null}

      {hasBars ? (
        <>
          <div className="mcfly-explorer__scroll">
            <div
              className="mcfly-explorer__chart"
              style={{ minWidth: `${vbW}px` }}
            >
              <div
                className="mcfly-explorer__plot-area"
                role="listbox"
                aria-label={`${PRODUCT_NOUN.explorer} columns`}
                aria-activedescendant={
                  selected ? `explorer-col-${selected.key}` : undefined
                }
                tabIndex={0}
                onKeyDown={onPlotKeyDown}
                onPointerLeave={() => setHover(null)}
              >
                <svg
                  className="mcfly-explorer__plot-svg"
                  viewBox={`0 0 ${vbW} ${vbH}`}
                  preserveAspectRatio="xMidYMid meet"
                  width={vbW}
                  height={vbH}
                  role="img"
                  aria-label={`Channel spend mix and ${PRODUCT_NOUN.totalRoas}`}
                >
                  {/* 1. Grid + dual axis ticks */}
                  {gridFracs.map((frac) => {
                    const y = PAD_T + PLOT_H * (1 - frac);
                    const leftVal = leftCeil * frac;
                    const rightVal = merCeil * frac;
                    return (
                      <g key={`grid-${frac}`} aria-hidden="true">
                        <line
                          className="mcfly-explorer__grid-line"
                          x1={PAD_L}
                          x2={vbW - PAD_R}
                          y1={y}
                          y2={y}
                        />
                        <text
                          className="mcfly-explorer__tick mcfly-explorer__tick--left"
                          x={PAD_L - 6}
                          y={y}
                          dy="0.32em"
                          textAnchor="end"
                        >
                          {axisMoneyLabel(leftVal, isShare)}
                        </text>
                        <text
                          className="mcfly-explorer__tick mcfly-explorer__tick--right"
                          x={vbW - PAD_R + 6}
                          y={y}
                          dy="0.32em"
                          textAnchor="start"
                        >
                          {formatMer(rightVal)}×
                        </text>
                      </g>
                    );
                  })}
                  <text
                    className="mcfly-explorer__axis-title mcfly-explorer__axis-title--left"
                    x={4}
                    y={PAD_T - 4}
                    aria-hidden="true"
                  >
                    {isShare ? "Share %" : showSales ? "$ (shared)" : "Spend $"}
                  </text>
                  <text
                    className="mcfly-explorer__axis-title mcfly-explorer__axis-title--right"
                    x={vbW - 4}
                    y={PAD_T - 4}
                    textAnchor="end"
                    aria-hidden="true"
                  >
                    {PRODUCT_NOUN.totalRoas} ×
                  </text>

                  {/* 2. Target + BE rails (ROAS axis) */}
                  {targetMer > 0 && merCeil > 0 ? (
                    <g className="mcfly-explorer__rail-g" aria-hidden="true">
                      <line
                        className="mcfly-explorer__rail-line mcfly-explorer__rail-line--target"
                        x1={PAD_L}
                        x2={vbW - PAD_R}
                        y1={yMer(targetMer)}
                        y2={yMer(targetMer)}
                      />
                      <text
                        className="mcfly-explorer__rail-txt mcfly-explorer__rail-txt--target"
                        x={vbW - PAD_R - 2}
                        y={yMer(targetMer) - 4}
                        textAnchor="end"
                      >
                        Target {formatMer(targetMer)}×
                      </text>
                    </g>
                  ) : null}
                  {breakEvenMer != null && breakEvenMer > 0 && merCeil > 0 ? (
                    <g className="mcfly-explorer__rail-g" aria-hidden="true">
                      <line
                        className="mcfly-explorer__rail-line mcfly-explorer__rail-line--be"
                        x1={PAD_L}
                        x2={vbW - PAD_R}
                        y1={yMer(breakEvenMer)}
                        y2={yMer(breakEvenMer)}
                      />
                      <text
                        className="mcfly-explorer__rail-txt mcfly-explorer__rail-txt--be"
                        x={PAD_L + 2}
                        y={yMer(breakEvenMer) - 4}
                        textAnchor="start"
                      >
                        BE {formatMer(breakEvenMer)}×
                      </text>
                    </g>
                  ) : null}

                  {/* 3. Column select wash (behind bars) + stacked segments with mark hover */}
                  {visibleBuckets.map((bucket, i) => {
                    const ordered = visibleOrderedBars(bucket);
                    let yCursor = PAD_T + PLOT_H;
                    const cx = xCenter(i);
                    const x = cx - barW / 2;
                    const isOn = selected?.key === bucket.key;
                    const segs: {
                      key: string;
                      channel: string;
                      x: number;
                      y: number;
                      w: number;
                      h: number;
                      amount: number;
                    }[] = [];
                    for (const seg of ordered) {
                      if (!(seg.amount > 0) || leftCeil <= 0) continue;
                      const h = (seg.amount / leftCeil) * PLOT_H;
                      yCursor -= h;
                      segs.push({
                        key: `${bucket.key}-${seg.channel}`,
                        channel: seg.channel,
                        x,
                        y: yCursor,
                        w: barW,
                        h,
                        amount: seg.amount,
                      });
                    }
                    return (
                      <g
                        key={`bar-${bucket.key}`}
                        className={`mcfly-explorer__bar-g${isOn ? " mcfly-explorer__bar-g--on" : ""}`}
                      >
                        {/* Select wash — behind segments so clicks still hit marks */}
                        <rect
                          id={`explorer-col-${bucket.key}`}
                          className={`mcfly-explorer__col-wash${isOn ? " mcfly-explorer__col-wash--on" : ""}`}
                          role="option"
                          aria-label={bucketTitle(bucket, mode)}
                          aria-selected={isOn}
                          x={PAD_L + i * slotW}
                          y={PAD_T}
                          width={slotW}
                          height={PLOT_H}
                          onPointerDown={(e) => {
                            if (e.button !== 0) return;
                            setSelectedKey(bucket.key);
                          }}
                        />
                        {segs.map((seg) => {
                          const segHot =
                            hover?.kind === "seg" &&
                            hover.bucketKey === bucket.key &&
                            hover.channel === seg.channel;
                          const dimOthers =
                            hover?.kind === "seg" &&
                            !(
                              hover.bucketKey === bucket.key &&
                              hover.channel === seg.channel
                            );
                          return (
                            <rect
                              key={seg.key}
                              className={`mcfly-explorer__seg ${channelSegClass(seg.channel)}${segHot ? " mcfly-explorer__seg--hot" : ""}${dimOthers ? " mcfly-explorer__seg--dim" : ""}`}
                              x={seg.x}
                              y={seg.y}
                              width={seg.w}
                              height={Math.max(seg.h, 0.5)}
                              onPointerEnter={() => {
                                if (shotMode) return;
                                setHover({
                                  kind: "seg",
                                  bucketKey: bucket.key,
                                  channel: seg.channel,
                                });
                              }}
                              onPointerDown={(e) => {
                                if (e.button !== 0) return;
                                e.stopPropagation();
                                setSelectedKey(bucket.key);
                                setHover({
                                  kind: "seg",
                                  bucketKey: bucket.key,
                                  channel: seg.channel,
                                });
                              }}
                            />
                          );
                        })}
                      </g>
                    );
                  })}

                  {/* 4. Sales polyline (shared $ axis) */}
                  {salesLine ? (
                    <polyline
                      className="mcfly-explorer__sales-line"
                      points={salesLine}
                      fill="none"
                      pointerEvents="none"
                    />
                  ) : null}

                  {/* 5. Total ROAS polyline + interactive dots */}
                  {merLine ? (
                    <>
                      <polyline
                        className="mcfly-explorer__mer-line mcfly-explorer__mer-line--under"
                        points={merLine}
                        fill="none"
                        pointerEvents="none"
                      />
                      <polyline
                        className="mcfly-explorer__mer-line"
                        points={merLine}
                        fill="none"
                        pointerEvents="none"
                      />
                    </>
                  ) : null}
                  {merPoints.map((p) =>
                    p.y != null ? (
                      <g key={`dot-${p.key}`}>
                        {/* Larger invisible hit for the ROAS mark */}
                        <circle
                          className="mcfly-explorer__mer-hit"
                          cx={p.x}
                          cy={p.y}
                          r={10}
                          onPointerEnter={() => {
                            if (shotMode) return;
                            setHover({ kind: "dot", bucketKey: p.key });
                          }}
                          onPointerDown={(e) => {
                            if (e.button !== 0) return;
                            setSelectedKey(p.key);
                            setHover({ kind: "dot", bucketKey: p.key });
                          }}
                        />
                        <circle
                          className={
                            p.tone === "up"
                              ? "mcfly-explorer__mer-dot mcfly-explorer__mer-dot--up"
                              : p.tone === "down"
                                ? "mcfly-explorer__mer-dot mcfly-explorer__mer-dot--down"
                                : "mcfly-explorer__mer-dot"
                          }
                          cx={p.x}
                          cy={p.y}
                          r={
                            hover?.kind === "dot" && hover.bucketKey === p.key
                              ? 5
                              : p.key === selected?.key
                                ? 4
                                : 3.2
                          }
                          pointerEvents="none"
                        />
                      </g>
                    ) : null,
                  )}

                  {/* 6. Crosshair */}
                  {crosshairX != null ? (
                    <line
                      className="mcfly-explorer__crosshair"
                      x1={crosshairX}
                      x2={crosshairX}
                      y1={PAD_T}
                      y2={PAD_T + PLOT_H}
                      aria-hidden="true"
                      pointerEvents="none"
                    />
                  ) : null}

                  {/* X labels */}
                  {visibleBuckets.map((bucket, i) =>
                    showAxisLabel(i) ? (
                      <text
                        key={`lbl-${bucket.key}`}
                        className="mcfly-explorer__x-label"
                        x={xCenter(i)}
                        y={vbH - 8}
                        textAnchor="middle"
                        pointerEvents="none"
                      >
                        {bucket.label}
                      </text>
                    ) : null,
                  )}
                </svg>

                {tipBucket && hover ? (
                  <div
                    className="mcfly-explorer__tip mcfly-explorer__tip--float mcfly-explorer__tip--on mcfly-explorer__tip--compact"
                    role="tooltip"
                    style={{ left: `${tipLeftPct}%`, top: `${tipTopPct}%` }}
                  >
                    {hover.kind === "dot" ? (
                      <>
                        <strong>{tipBucket.label}</strong>
                        <span className="mcfly-explorer__tip-lead">
                          {PRODUCT_NOUN.totalRoas}{" "}
                          {tipBucket.mer != null
                            ? formatMer(tipBucket.mer)
                            : "—"}
                        </span>
                        <span>
                          Spend {formatCurrency(tipBucket.spend)}
                        </span>
                        <span>
                          Sales {formatCurrency(tipBucket.sales)}
                        </span>
                        {tipCmp?.hasPrior ? (
                          <span className="mcfly-explorer__tip-prior">
                            Prior {compareNoun} ({tipCmp.priorLabel}): spend{" "}
                            {formatCurrency(tipCmp.priorSpend ?? 0)} ·{" "}
                            {PRODUCT_NOUN.totalRoas}{" "}
                            {formatMer(tipCmp.priorMer)}
                          </span>
                        ) : null}
                      </>
                    ) : hoverSeg ? (
                      <>
                        <strong className="mcfly-explorer__tip-ch-head">
                          <i
                            className={`mcfly-explorer__tip-swatch ${channelSegClass(hover.channel)}`}
                            aria-hidden="true"
                          />
                          {channelLabel(hover.channel, customChannelLabels)}
                        </strong>
                        <span className="mcfly-explorer__tip-lead">
                          {mode === "share"
                            ? `${hoverSeg.amount.toFixed(1)}%`
                            : formatCurrency(hoverSeg.amount)}
                          {mode !== "share" ? (
                            <span className="mcfly-explorer__tip-share">
                              {" "}
                              · {Math.round(segShare(tipBucket, hover.channel))}%
                              of bar
                            </span>
                          ) : null}
                        </span>
                        <span className="mcfly-explorer__tip-period">
                          {tipBucket.label}
                        </span>
                      </>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          {compare && selectedCmp && !shotMode ? (
            <p className="mcfly-explorer__compare" aria-live="polite">
              {selectedCmp.hasPrior ? (
                <>
                  <strong>{selectedCmp.label}</strong>
                  <span className="mcfly-explorer__compare-vs">
                    {" "}
                    vs prior {compareNoun} ({selectedCmp.priorLabel})
                  </span>
                  {" · spend "}
                  {formatCurrency(selectedCmp.spend)}{" "}
                  <span className="mcfly-explorer__compare-delta">
                    ({signedCurrency(selectedCmp.spendDelta ?? 0)})
                  </span>
                  {" · sales "}
                  {formatCurrency(selectedCmp.sales)}{" "}
                  <span className="mcfly-explorer__compare-delta">
                    ({signedCurrency(selectedCmp.salesDelta ?? 0)})
                  </span>
                  {" · "}
                  {PRODUCT_NOUN.totalRoas} {formatMer(selectedCmp.mer)}{" "}
                  {selectedCmp.merDelta != null ? (
                    <span
                      className={`mcfly-explorer__compare-delta${
                        selectedCmp.merDelta > 0
                          ? " mcfly-explorer__compare-delta--up"
                          : selectedCmp.merDelta < 0
                            ? " mcfly-explorer__compare-delta--down"
                            : ""
                      }`}
                    >
                      ({signedMer(selectedCmp.merDelta)})
                    </span>
                  ) : (
                    <span
                      className="mcfly-explorer__compare-delta"
                      title="Total ROAS needs spend in both periods"
                    >
                      (—)
                    </span>
                  )}
                </>
              ) : (
                <>
                  <strong>{selectedCmp.label}</strong>
                  <span className="mcfly-explorer__compare-vs">
                    {" "}
                    — no prior {compareNoun} in this window
                  </span>
                </>
              )}
            </p>
          ) : null}

          {!shotMode ? (
            <div className="mcfly-explorer__channel-toggles" role="group" aria-label="Spend channels">
              {legend.map((channel) => {
                const hidden = hiddenChannels.has(channel);
                return (
                  <button
                    key={channel}
                    type="button"
                    className={`mcfly-explorer__ch-toggle${hidden ? " mcfly-explorer__ch-toggle--off" : ""}`}
                    aria-pressed={!hidden}
                    title={
                      hidden
                        ? `Show ${channelLabel(channel, customChannelLabels)}`
                        : `Hide ${channelLabel(channel, customChannelLabels)}`
                    }
                    onClick={() => toggleChannel(channel)}
                  >
                    <i
                      className={`mcfly-explorer__ch-dot ${channelSegClass(channel)}`}
                      aria-hidden="true"
                    />
                    <span>{channelLabel(channel, customChannelLabels)}</span>
                  </button>
                );
              })}
              <button
                type="button"
                className="mcfly-explorer__export-btn mcfly-explorer__export-btn--quiet"
                onClick={() =>
                  downloadExplorerCsv(
                    allBuckets,
                    mode,
                    series.range,
                    series.granularity,
                  )
                }
              >
                CSV
              </button>
            </div>
          ) : null}
        </>
      ) : (
        <div className="mcfly-guide-empty">
          <p className="mcfly-guide-empty__title">
            No spend in {series.windowLabel.toLowerCase()}
          </p>
          <p className="mcfly-guide-empty__copy">
            {explorerEmptyCopy(variant)}
          </p>
          <p className="mcfly-guide-empty__actions">
            {explorerEmptyActions(variant, searchParams)}
          </p>
        </div>
      )}
    </section>
  );
}
