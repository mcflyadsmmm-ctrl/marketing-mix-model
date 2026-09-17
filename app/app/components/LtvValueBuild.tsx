import { formatCurrency } from "../lib/mer-format";
import { useDeskDrill } from "./DeskDrill";
import { DeskIcon } from "./DeskIcon";
import { useDeskCurrency } from "../lib/desk-currency";

export type LtvBuildWindow = {
  /** Stable react key. */
  key: string;
  /** Merchant-facing window label — "First 30 days", "First 90 days". */
  label: string;
  /** Average revenue per new customer in the window, or null when not on file. */
  value: number | null;
  /** Plain-English formula for the drill. */
  detail: string;
  /**
   * Known-unknown: the window exists but Shopify has not shared enough order
   * history yet (~60 days). Paints a — bar so the build reads honestly instead
   * of implying $0 or a finished year.
   */
  pending?: boolean;
};

export function isRevenue(value: number | null): value is number {
  return value != null && Number.isFinite(value) && value > 0;
}

/**
 * Pure build resolver — decides whether the value-build chart is worth drawing
 * and returns the rows plus the bar scale. A single dollar is a KPI, not a
 * build, so at least two rows (one real dollar) are required; a pending window
 * (Shopify only shared ~60 days) counts as a row so the year reads as — rather
 * than a sealed 365. Returns null when there is nothing honest to draw.
 */
export function resolveLtvBuild(windows: LtvBuildWindow[]): {
  rows: LtvBuildWindow[];
  max: number;
} | null {
  const rows = windows.filter((row) => isRevenue(row.value) || row.pending);
  const knownCount = rows.filter((row) => isRevenue(row.value)).length;
  if (knownCount < 1 || rows.length < 2) return null;
  const max = Math.max(
    ...rows.map((row) => (isRevenue(row.value) ? row.value : 0)),
    0.01,
  );
  return { rows, max };
}

/**
 * The signature LTV visual: how much a new customer spends as their first
 * 30 → 90 → 365 days build. Horizontal dollar bars, each drillable to its
 * formula. Averages across new customers from order history only — never a
 * forecast, never email lists. The year bar stays a — when Shopify only shared
 * ~60 days, so the build is honest about the window instead of sealing 365.
 */
export function LtvValueBuild({
  windows,
  newBuyers,
  caption,
}: {
  windows: LtvBuildWindow[];
  newBuyers: number;
  caption?: string;
}) {
  const currency = useDeskCurrency();
  const drill = useDeskDrill();

  const build = resolveLtvBuild(windows);
  if (!build) return null;
  const { rows, max } = build;
  const buyerKicker =
    newBuyers > 0
      ? `${newBuyers.toLocaleString()} new customers on file`
      : undefined;

  return (
    <section
      className="mcfly-chart"
      aria-label="What a new customer spends over time"
    >
      <div className="mcfly-chart__head">
        <p className="mcfly-chart__title">
          <DeskIcon name="chart" />
          What a new customer spends over time
        </p>
      </div>
      <div className="mcfly-chart__hrows">
        {rows.map((row) => {
          const value = row.value;
          const display = isRevenue(value)
            ? formatCurrency(value, currency)
            : "—";
          const width = isRevenue(value)
            ? Math.max(8, (value / max) * 100)
            : 0;
          return (
            <button
              type="button"
              className="mcfly-chart__hrow"
              key={row.key}
              onClick={() =>
                drill?.openDrill({
                  title: row.label,
                  value: display,
                  ...(buyerKicker ? { kicker: buyerKicker } : {}),
                  blocks: [{ k: "What this is", v: row.detail }],
                  next: "Order history only — never email lists. Spend is optional.",
                })
              }
            >
              <span className="mcfly-chart__hlabel">{row.label}</span>
              <span className="mcfly-chart__htrack">
                <span
                  className="mcfly-chart__hfill"
                  style={{ width: `${width}%` }}
                />
              </span>
              <span className="mcfly-chart__hvalue">{display}</span>
            </button>
          );
        })}
      </div>
      <p className="mcfly-chart__hint">
        {caption ?? "Click a bar · average per new customer, not a promise"}
      </p>
    </section>
  );
}
