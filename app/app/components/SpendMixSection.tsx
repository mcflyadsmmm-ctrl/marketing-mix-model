import { useEffect, useLayoutEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { CashTrustBanners } from "./CashTrustBanners";
import { SpendMixPlan } from "./SpendMixPlan";
import { channelCssVar, channelFillKey } from "../lib/channel-fill";
import { spendChannelLabel } from "../lib/spend-channel-label";
import { formatCurrency, formatMer, formatPercent } from "../lib/mer-format";
import { PRODUCT_NOUN } from "../lib/product-labels";
import type { CashControlBoard } from "../lib/mer-control";
import {
  compareSpendShares,
  defaultWindowGrain,
  selectWindowsForGrain,
  WINDOW_GRAINS,
  windowGrainLabel,
  windowScopeCaption,
  type AllocationHistoryView,
  type RollingWindowTile,
  type SpendShareDiff,
  type TopWindowAllocation,
  type WindowGrain,
  type WindowSets,
} from "../lib/allocation-history";
import type { PeriodPreset } from "../lib/periods";
import { useDeskCurrency } from "../lib/desk-currency";

const ALLOCATION_CONTRAST =
  "Shopify Analytics channel reports are sessions and attribution. This page is entered spend mix and the daily cap.";

export const SPEND_PANEL_IDS = {
  roas: "mcfly-roas",
  mix: "mcfly-mix",
  cpa: "mcfly-cpa",
  explorer: "mcfly-explorer",
} as const;

export function useSpendPanelScroll() {
  const [searchParams] = useSearchParams();
  useLayoutEffect(() => {
    const panel = searchParams.get("panel");
    if (!panel) return;
    const id =
      panel === "roas"
        ? SPEND_PANEL_IDS.roas
        : panel === "mix"
          ? SPEND_PANEL_IDS.mix
          : panel === "cpa"
            ? SPEND_PANEL_IDS.cpa
            : panel === "explorer"
              ? SPEND_PANEL_IDS.explorer
              : null;
    if (!id) return;
    document.getElementById(id)?.scrollIntoView({ block: "start" });
  }, [searchParams]);
}

export type PeriodChannelRow = {
  name: string;
  spend: number;
  share: number;
  fill: string;
};

export function buildPeriodChannelRows(
  channels: Array<{ name: string; spend: number; spendShare: number }>,
): PeriodChannelRow[] {
  return channels
    .filter((channel) => channel.spend > 0)
    .map((channel) => ({
      name: channel.name,
      spend: channel.spend,
      share: channel.spendShare,
      fill: channelFillKey(channel.name),
    }))
    .sort((a, b) => b.spend - a.spend);
}

export function buildPeriodChannelRowsFromMix(
  mix: Array<{
    channel: string;
    amount: number;
    share: number;
    customLabel?: string;
  }>,
): PeriodChannelRow[] {
  return mix
    .filter((channel) => channel.amount > 0)
    .map((channel) => {
      const name = spendChannelLabel({
        channel: channel.channel,
        customLabel: channel.customLabel,
      });
      return {
        name,
        spend: channel.amount,
        share: channel.share,
        fill: channelFillKey(name),
      };
    })
    .sort((a, b) => b.spend - a.spend);
}

function periodTakeaway(input: {
  periodLabel: string;
  mer: number | null;
  breakEvenMer: number | null;
  top: PeriodChannelRow | null;
  hasSpend: boolean;
}): string {
  const mixBit = input.top
    ? `${input.top.name} is ${formatPercent(input.top.share)} of the budget.`
    : input.hasSpend
      ? "Channel mix is still catching up."
      : "Add spend to see where the money went.";
  if (input.mer == null) {
    return `${input.periodLabel}: ${mixBit}`;
  }
  const vs =
    input.breakEvenMer == null
      ? "Sales ÷ spend."
      : input.mer >= input.breakEvenMer
        ? "Covering break-even."
        : "Below break-even.";
  return `${input.periodLabel}: ${formatMer(input.mer)}× Total ROAS. ${vs} ${mixBit}`;
}

type MixMetrics = {
  period: { label: string };
  sales: number;
  totalSpend: number;
  mer: number | null;
  breakEvenMer: number | null;
  salesPending: boolean;
  allocation: {
    inputs: {
      channelEfficiencies: Array<{
        name: string;
        spend: number;
        spendShare: number;
      }>;
    };
  } | null;
  channelMix: Array<{
    channel: string;
    amount: number;
    share: number;
    customLabel?: string;
  }>;
  spendCoverage: { incomplete: boolean };
  cashActionReady: boolean;
  spendRecon?: { status: string } | null;
  blockedMockAsLive: boolean;
};

export function SpendMixSection({
  metrics,
  cashControl,
  history,
  windowSets,
  preset,
  shotMode,
  useSampleDesk,
  salesError,
  todaySalesUnavailable,
  todaySalesTruncated,
  salesFactsIncomplete,
  shopifyOrderWindowLimited,
  addSpendHref = "#mcfly-spend-add",
}: {
  metrics: MixMetrics;
  cashControl: CashControlBoard | null;
  history: AllocationHistoryView | null;
  windowSets: { period: WindowSets; lookback: WindowSets };
  preset: PeriodPreset;
  shotMode: boolean;
  useSampleDesk: boolean;
  salesError: string | null;
  todaySalesUnavailable: boolean;
  todaySalesTruncated: boolean;
  salesFactsIncomplete: {
    factDays: number;
    expectedClosedDays: number;
  } | null;
  shopifyOrderWindowLimited: boolean;
  addSpendHref?: string;
}) {
  const [grain, setGrain] = useState<WindowGrain>(() =>
    defaultWindowGrain(preset),
  );
  const [selectedWindowKey, setSelectedWindowKey] = useState<string | null>(
    null,
  );
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);

  useEffect(() => {
    setGrain(defaultWindowGrain(preset));
    setSelectedWindowKey(null);
    setSelectedChannel(null);
  }, [preset]);

  const allocation = salesError ? null : metrics.allocation;
  const cashLocked =
    !allocation &&
    metrics.breakEvenMer != null &&
    !shotMode &&
    (metrics.spendCoverage.incomplete || !metrics.cashActionReady);
  const lockCopy = cashLocked
    ? metrics.spendCoverage.incomplete
      ? "Spend mix waits until most days this period have spend, so empty Sundays don’t fake a high Total ROAS. Add more days when you have invoices — last month is enough to start."
      : metrics.spendRecon?.status === "drift"
        ? "Desk spend vs the Ads Manager total you declared is outside ±5%. Fix the CSV or declared total on Spend before mix advice."
        : "Add spend below, then mix can score the period."
    : null;

  const channelRows = allocation
    ? buildPeriodChannelRows(allocation.inputs.channelEfficiencies)
    : buildPeriodChannelRowsFromMix(metrics.channelMix);
  const rollingWindows = history?.rollingWindows ?? [];
  const pickedWindows = selectWindowsForGrain(
    windowSets.period[grain],
    windowSets.lookback[grain],
    grain,
  );
  const selectedWindow =
    pickedWindows.items.find((row) => row.key === selectedWindowKey) ?? null;
  const mixDiffs: SpendShareDiff[] = selectedWindow
    ? compareSpendShares(
        channelRows.map((row) => ({ channel: row.name, share: row.share })),
        selectedWindow.shares.map((share) => ({
          channel: share.channel,
          share: share.share,
        })),
      ).filter((diff) => Math.abs(diff.deltaPp) >= 1)
    : [];
  const takeaway = salesError
    ? null
    : periodTakeaway({
        periodLabel: metrics.period.label,
        mer: metrics.mer,
        breakEvenMer: metrics.breakEvenMer,
        top: channelRows[0] ?? null,
        hasSpend: metrics.totalSpend > 0,
      });

  return (
    <section
      id="mcfly-mix"
      className="mcfly-alloc-v2 mcfly-alloc-v2--soft"
      aria-label="Entered spend mix"
    >
      {!useSampleDesk && !shotMode ? (
        <CashTrustBanners
          blockedMockAsLive={Boolean(metrics.blockedMockAsLive)}
          spendCoverage={null}
          periodLabel={metrics.period.label}
          shopifyOrderWindowLimited={shopifyOrderWindowLimited}
          salesFactsIncomplete={salesFactsIncomplete}
          hasSpend={metrics.totalSpend > 0}
          todaySalesTruncated={todaySalesTruncated}
          todaySalesUnavailable={todaySalesUnavailable}
          shotMode={shotMode}
          cashActionReady={metrics.cashActionReady}
        />
      ) : null}

      {salesError && !shotMode ? (
        <section
          className="mcfly-state mcfly-state--critical mcfly-state--soft"
          aria-label="Sales load error"
        >
          <p className="mcfly-state__copy">
            Sales didn’t load — mix needs {PRODUCT_NOUN.totalRoas} from sales ÷
            spend.
          </p>
          <div className="mcfly-state__cta">
            <s-button
              href={`/app/spend?period=${preset}&panel=mix`}
              variant="primary"
            >
              Retry
            </s-button>
          </div>
        </section>
      ) : null}

      {cashLocked && lockCopy ? (
        <section
          className="mcfly-state mcfly-state--warn mcfly-state--soft"
          aria-label="Allocation locked until spend trust"
        >
          <p className="mcfly-state__copy">{lockCopy}</p>
          <div className="mcfly-state__cta">
            <s-button href={addSpendHref} variant="primary">
              Fill spend holes
            </s-button>
          </div>
        </section>
      ) : null}

      <p className="mcfly-topbar__def mcfly-topbar__def--solo">
        {ALLOCATION_CONTRAST}
      </p>

      {takeaway ? (
        <p className="mcfly-alloc-v2__takeaway">{takeaway}</p>
      ) : null}

      {channelRows.length === 0 &&
      metrics.totalSpend <= 0 &&
      !cashLocked &&
      !salesError ? (
        <section
          className="mcfly-state mcfly-state--empty mcfly-state--soft"
          aria-label="Allocation unavailable"
        >
          <p className="mcfly-state__copy">
            Add spend below to see mix, best windows, and the daily cap. Empty
            spend is not a made-up mix — never painted as $0 share.
          </p>
          <div className="mcfly-state__cta">
            <s-button href={addSpendHref} variant="primary">
              {PRODUCT_NOUN.setupAddSpend}
            </s-button>
          </div>
        </section>
      ) : (
        <>
          <PeriodMixSection
            rows={channelRows}
            totalSpend={metrics.totalSpend}
            periodLabel={metrics.period.label}
            totalRoas={metrics.mer}
            selectedChannel={selectedChannel}
            onSelectChannel={(name) =>
              setSelectedChannel((cur) => (cur === name ? null : name))
            }
            addSpendHref={addSpendHref}
          />

          {cashControl ? <SpendMixPlan board={cashControl} /> : null}

          <BestWindowsSection
            grain={grain}
            onGrainChange={(next) => {
              setGrain(next);
              setSelectedWindowKey(null);
            }}
            items={pickedWindows.items}
            scope={pickedWindows.scope}
            periodLabel={metrics.period.label}
            selectedKey={selectedWindowKey}
            onSelectKey={(key) =>
              setSelectedWindowKey((cur) => (cur === key ? null : key))
            }
            selectedWindow={selectedWindow}
            mixDiffs={mixDiffs}
          />

          <RollingWindowsSection tiles={rollingWindows} />
        </>
      )}
    </section>
  );
}

function namedMixWindow(periodLabel: string): string {
  return periodLabel === "Month to date" ? "This month" : periodLabel;
}

function PeriodMixSection({
  rows,
  totalSpend,
  periodLabel,
  totalRoas,
  selectedChannel,
  onSelectChannel,
  addSpendHref,
}: {
  rows: PeriodChannelRow[];
  totalSpend: number;
  periodLabel: string;
  totalRoas: number | null;
  selectedChannel: string | null;
  onSelectChannel: (name: string) => void;
  addSpendHref: string;
}) {
  const currency = useDeskCurrency();
  const selected = rows.find((row) => row.name === selectedChannel) ?? null;
  const windowName = namedMixWindow(periodLabel);
  return (
    <section
      className="mcfly-alloc-v2__mix mcfly-alloc-v2__mix--soft"
      aria-label={`Where the money went · ${windowName}`}
    >
      <div className="mcfly-alloc-v2__head">
        <h2>Where the money went · {windowName}</h2>
        <p className="mcfly-alloc-v2__muted">
          Click a channel · spend share, not channel ROAS ·{" "}
          {PRODUCT_NOUN.totalRoas}{" "}
          {totalRoas == null ? "—" : `${formatMer(totalRoas)}×`}
        </p>
      </div>
      {rows.length === 0 ? (
        <p className="mcfly-alloc-v2__empty mcfly-alloc-v2__empty--soft">
          No channel spend for {periodLabel}. Add it below — this page will not
          fake a mix. Empty spend is not a made-up mix.{" "}
          <s-link href={addSpendHref}>Add a day</s-link>
        </p>
      ) : (
        <>
          <div className="mcfly-alloc-v2__mix-grid">
            <SpendSharePie
              rows={rows}
              totalSpend={totalSpend}
              selectedChannel={selectedChannel}
              onSelectChannel={onSelectChannel}
            />
            <ul className="mcfly-alloc-v2__chan-list">
              {rows.map((row) => {
                const on = selectedChannel === row.name;
                return (
                  <li key={row.name}>
                    <button
                      type="button"
                      className={`mcfly-alloc-v2__chan mcfly-alloc-v2__chan--soft${on ? " mcfly-alloc-v2__chan--on" : ""}`}
                      aria-pressed={on}
                      onClick={() => onSelectChannel(row.name)}
                    >
                      <span
                        className={`mcfly-spend-dot mcfly-spend-dot--${row.fill}`}
                        aria-hidden="true"
                      />
                      <span className="mcfly-alloc-v2__chan-name">
                        {row.name} · {windowName}
                      </span>
                      <span className="mcfly-alloc-v2__chan-amt">
                        {formatCurrency(row.spend, currency)}
                      </span>
                      <span className="mcfly-alloc-v2__chan-pct">
                        {formatPercent(row.share)}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
          {selected ? (
            <p className="mcfly-alloc-v2__chan-callout">
              {selected.name} is {formatPercent(selected.share)} of this
              period’s ad spend ({formatCurrency(selected.spend, currency)}).
            </p>
          ) : (
            <p className="mcfly-alloc-v2__hedge">
              Pie and list are budget share — not which ad caused the sale.
            </p>
          )}
        </>
      )}
    </section>
  );
}

function SpendSharePie({
  rows,
  totalSpend,
  selectedChannel,
  onSelectChannel,
}: {
  rows: PeriodChannelRow[];
  totalSpend: number;
  selectedChannel: string | null;
  onSelectChannel: (name: string) => void;
}) {
  const size = 160;
  const cx = size / 2;
  const cy = size / 2;
  const r = 68;
  let angle = -Math.PI / 2;
  const slices =
    totalSpend > 0
      ? rows.map((row) => {
          const sweep = (row.spend / totalSpend) * Math.PI * 2;
          const start = angle;
          angle += sweep;
          const end = angle;
          const large = sweep > Math.PI ? 1 : 0;
          const x1 = cx + r * Math.cos(start);
          const y1 = cy + r * Math.sin(start);
          const x2 = cx + r * Math.cos(end);
          const y2 = cy + r * Math.sin(end);
          const isFull = rows.length === 1 && row.spend > 0;
          return { row, start, end, large, x1, y1, x2, y2, isFull };
        })
      : [];

  return (
    <div className="mcfly-alloc-v2__pie-wrap">
      <svg
        className="mcfly-alloc-v2__pie"
        viewBox={`0 0 ${size} ${size}`}
        width={size}
        height={size}
        role="img"
        aria-label="Channel spend share pie"
      >
        {slices.map(({ row, large, x1, y1, x2, y2, isFull }) => {
          const dim = selectedChannel != null && selectedChannel !== row.name;
          const sliceClass = dim
            ? "mcfly-alloc-v2__pie-slice mcfly-alloc-v2__pie-slice--dim"
            : "mcfly-alloc-v2__pie-slice";
          const onActivate = () => onSelectChannel(row.name);
          return isFull ? (
            <circle
              key={row.name}
              className={sliceClass}
              cx={cx}
              cy={cy}
              r={r}
              fill={channelCssVar(row.fill)}
              role="button"
              tabIndex={0}
              aria-label={`${row.name} spend share`}
              onClick={onActivate}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onActivate();
                }
              }}
            />
          ) : (
            <path
              key={row.name}
              className={sliceClass}
              d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`}
              fill={channelCssVar(row.fill)}
              role="button"
              tabIndex={0}
              aria-label={`${row.name} spend share`}
              onClick={onActivate}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onActivate();
                }
              }}
            />
          );
        })}
        <circle cx={cx} cy={cy} r={36} className="mcfly-alloc-v2__pie-hole" />
        <text
          x={cx}
          y={cy - 4}
          textAnchor="middle"
          className="mcfly-alloc-v2__pie-label"
        >
          Spend
        </text>
        <text
          x={cx}
          y={cy + 12}
          textAnchor="middle"
          className="mcfly-alloc-v2__pie-sub"
        >
          share
        </text>
      </svg>
    </div>
  );
}

function BestWindowsSection({
  grain,
  onGrainChange,
  items,
  scope,
  periodLabel,
  selectedKey,
  onSelectKey,
  selectedWindow,
  mixDiffs,
}: {
  grain: WindowGrain;
  onGrainChange: (grain: WindowGrain) => void;
  items: TopWindowAllocation[];
  scope: "period" | "lookback";
  periodLabel: string;
  selectedKey: string | null;
  onSelectKey: (key: string) => void;
  selectedWindow: TopWindowAllocation | null;
  mixDiffs: SpendShareDiff[];
}) {
  const currency = useDeskCurrency();
  return (
    <section className="mcfly-alloc-v2__quarters mcfly-alloc-v2__quarters--soft" aria-label="Best windows">
      <div className="mcfly-alloc-v2__head">
        <h2>Best windows</h2>
        <p className="mcfly-alloc-v2__muted">
          {windowScopeCaption(grain, scope, periodLabel)} Click a card to
          compare mix.
        </p>
      </div>
      <div
        className="mcfly-alloc-v2__grain"
        role="group"
        aria-label="Window size"
      >
        {WINDOW_GRAINS.map((value) => {
          const pressed = grain === value;
          return (
            <button
              key={value}
              type="button"
              className={`mcfly-alloc-v2__grain-btn${pressed ? " mcfly-alloc-v2__grain-btn--on" : ""}`}
              aria-pressed={pressed}
              onClick={() => onGrainChange(value)}
            >
              {windowGrainLabel(value)}
            </button>
          );
        })}
      </div>
      {items.length === 0 ? (
        <p className="mcfly-alloc-v2__empty mcfly-alloc-v2__empty--soft">
          Not enough {windowGrainLabel(grain).toLowerCase()} with spend to rank
          yet.
        </p>
      ) : (
        <ol className="mcfly-alloc-v2__q-list">
          {items.map((row, i) => {
            const selected = selectedKey === row.key;
            return (
              <li key={row.key}>
                <button
                  type="button"
                  className={`mcfly-alloc-v2__q-card mcfly-alloc-v2__q-card--soft${selected ? " mcfly-alloc-v2__q-card--on" : ""}`}
                  aria-pressed={selected}
                  onClick={() => onSelectKey(row.key)}
                >
                  <div className="mcfly-alloc-v2__q-rank" aria-hidden="true">
                    {i + 1}
                  </div>
                  <div className="mcfly-alloc-v2__q-body">
                    <div className="mcfly-alloc-v2__q-top">
                      <span className="mcfly-alloc-v2__q-label">
                        {row.label}
                      </span>
                      <span className="mcfly-alloc-v2__q-mer">
                        {row.mer == null ? "—" : `${formatMer(row.mer)}×`}
                      </span>
                    </div>
                    <p className="mcfly-alloc-v2__q-meta">
                      {PRODUCT_NOUN.totalRoas} · {formatCurrency(row.sales, currency)} ÷{" "}
                      {formatCurrency(row.spend, currency)}
                    </p>
                    <div
                      className="mcfly-alloc-v2__q-bar"
                      aria-hidden="true"
                      title="Spend share"
                    >
                      {row.shares.slice(0, 5).map((share) => (
                        <span
                          key={share.channel}
                          className={`mcfly-alloc-v2__q-seg mcfly-channel__fill--${channelFillKey(share.channel)}`}
                          style={{ flex: Math.max(0.02, share.share) }}
                        />
                      ))}
                    </div>
                    <div className="mcfly-alloc-v2__q-chips">
                      {row.shares.slice(0, 4).map((share) => (
                        <span key={share.channel}>
                          <span
                            className={`mcfly-spend-dot mcfly-spend-dot--${channelFillKey(share.channel)}`}
                            aria-hidden="true"
                          />
                          {share.channel} · {formatPercent(share.share)}
                        </span>
                      ))}
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ol>
      )}
      {selectedWindow ? (
        <div className="mcfly-alloc-v2__compare">
          <p className="mcfly-alloc-v2__compare-lead">
            {selectedWindow.label} vs this period · mix is spend share, not
            which channel caused sales.
          </p>
          {mixDiffs.length === 0 ? (
            <p className="mcfly-alloc-v2__muted">
              Mix looks similar to {periodLabel}.
            </p>
          ) : (
            <ul className="mcfly-alloc-v2__compare-list">
              {mixDiffs.slice(0, 4).map((diff) => {
                const more = diff.deltaPp >= 0;
                return (
                  <li key={diff.channel}>
                    <span
                      className={`mcfly-spend-dot mcfly-spend-dot--${channelFillKey(diff.channel)}`}
                      aria-hidden="true"
                    />
                    <span>
                      {diff.channel} was {Math.abs(diff.deltaPp).toFixed(0)}pp{" "}
                      {more ? "more" : "less"} of spend than this period
                      <span className="mcfly-alloc-v2__compare-shares">
                        {" "}
                        · {formatPercent(diff.windowShare)} then ·{" "}
                        {formatPercent(diff.periodShare)} now
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}
    </section>
  );
}

function RollingWindowsSection({ tiles }: { tiles: RollingWindowTile[] }) {
  return (
    <section className="mcfly-alloc-v2__rolling mcfly-alloc-v2__rolling--soft" aria-label="Recent pace">
      <div className="mcfly-alloc-v2__head">
        <h2>Recent pace · last 7 / 14 / 28 days</h2>
        <p className="mcfly-alloc-v2__muted">
          Closed days vs the prior equal window — not the MTD / QTD filter
        </p>
      </div>
      {tiles.length === 0 ? (
        <p className="mcfly-alloc-v2__empty mcfly-alloc-v2__empty--soft">
          Not enough closed-day history for a recent-pace pulse yet.
        </p>
      ) : (
        <div className="mcfly-alloc-v2__roll-grid">
          {tiles.map((tile) => {
            const tone =
              tile.delta == null
                ? "flat"
                : tile.delta > 0.02
                  ? "up"
                  : tile.delta < -0.02
                    ? "down"
                    : "flat";
            return (
              <article
                className={`mcfly-alloc-v2__roll mcfly-alloc-v2__roll--soft mcfly-alloc-v2__roll--${tone}`}
                key={tile.days}
              >
                <p className="mcfly-alloc-v2__roll-label">{tile.label}</p>
                <p className="mcfly-alloc-v2__roll-mer">
                  {tile.current.mer == null
                    ? "—"
                    : `${formatMer(tile.current.mer)}×`}
                </p>
                <p className="mcfly-alloc-v2__roll-delta">
                  {tile.delta == null
                    ? "vs prior —"
                    : `${tile.delta > 0 ? "+" : ""}${tile.delta.toFixed(2)} vs prior window`}
                </p>
                <p className="mcfly-alloc-v2__roll-prior">
                  Prior {tile.days}d ·{" "}
                  {tile.prior.mer == null
                    ? "—"
                    : `${formatMer(tile.prior.mer)}×`}
                </p>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
