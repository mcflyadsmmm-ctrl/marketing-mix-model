/**
 * Current vs recommended channel spend mix — SVG bars, not causal ROAS curves.
 */

import { SPEND_FLOOR_PCT } from "@mcfly/mer-core";
import { formatCurrency, formatPercent } from "../lib/mer-format";
import { PRODUCT_NOUN } from "../lib/product-labels";

export type AllocMixRow = {
  name: string;
  current: number;
  recommended: number;
};

type AllocMixChartProps = {
  rows: AllocMixRow[];
  totalSpend: number;
};

/**
 * Apply cut/shift/hold actions to current channel spends for a recommended mix.
 * Cuts reduce that channel; shifts move freed budget toward the named target.
 */
export function buildRecommendedMix(input: {
  channels: Array<{ name: string; spend: number }>;
  actions: Array<{
    type: string;
    channel: string;
    percentChange?: number;
  }>;
}): AllocMixRow[] {
  const map = new Map<string, { current: number; recommended: number }>();
  for (const ch of input.channels) {
    if (!(ch.spend > 0)) continue;
    map.set(ch.name, { current: ch.spend, recommended: ch.spend });
  }
  let freed = 0;
  for (const action of input.actions) {
    if (action.type !== "cut" || action.channel === "—") continue;
    const row = map.get(action.channel);
    if (!row || action.percentChange == null || action.percentChange >= 0) {
      continue;
    }
    const cutAmt = row.current * (Math.abs(action.percentChange) / 100);
    row.recommended = Math.max(0, row.current - cutAmt);
    freed += cutAmt;
  }
  for (const action of input.actions) {
    if (action.type !== "shift" || action.channel === "—" || !(freed > 0)) {
      continue;
    }
    const row = map.get(action.channel);
    if (!row) {
      map.set(action.channel, { current: 0, recommended: freed });
      freed = 0;
      break;
    }
    row.recommended += freed;
    freed = 0;
    break;
  }
  return [...map.entries()]
    .map(([name, v]) => ({
      name,
      current: v.current,
      recommended: v.recommended,
    }))
    .sort((a, b) => b.current - a.current);
}

export function AllocMixChart({ rows, totalSpend }: AllocMixChartProps) {
  const maxBar = Math.max(
    ...rows.flatMap((r) => [r.current, r.recommended]),
    1,
  );
  const floorKeep = totalSpend * ((100 - SPEND_FLOOR_PCT) / 100);
  const recommendedTotal = rows.reduce((s, r) => s + r.recommended, 0);

  return (
    <section
      className="mcfly-alloc-mix"
      aria-label="Current vs recommended spend mix"
    >
      <div className="mcfly-panel__head">
        <h2>Mix · current vs recommended</h2>
        <p className="mcfly-panel__muted">
          Portfolio shift from the primary move — not channel ROAS or path credit
        </p>
      </div>
      <p className="mcfly-alloc-mix__floor">
        Spend floor: keep ≥ {formatCurrency(floorKeep)} (
        {100 - SPEND_FLOOR_PCT}% of {formatCurrency(totalSpend)}) · recommended
        total {formatCurrency(recommendedTotal)}
      </p>
      <ul className="mcfly-alloc-mix__list">
        {rows.map((row) => {
          const curPct = totalSpend > 0 ? row.current / totalSpend : 0;
          const recPct =
            recommendedTotal > 0 ? row.recommended / recommendedTotal : 0;
          return (
            <li className="mcfly-alloc-mix__row" key={row.name}>
              <div className="mcfly-alloc-mix__head">
                <span className="mcfly-alloc-mix__name">{row.name}</span>
                <span className="mcfly-alloc-mix__meta">
                  {formatCurrency(row.current)} → {formatCurrency(row.recommended)}{" "}
                  · {formatPercent(curPct)} → {formatPercent(recPct)}
                </span>
              </div>
              <div className="mcfly-alloc-mix__bars" aria-hidden="true">
                <div className="mcfly-alloc-mix__track">
                  <div
                    className="mcfly-alloc-mix__fill mcfly-alloc-mix__fill--current"
                    style={{ width: `${(row.current / maxBar) * 100}%` }}
                  />
                </div>
                <div className="mcfly-alloc-mix__track">
                  <div
                    className="mcfly-alloc-mix__fill mcfly-alloc-mix__fill--rec"
                    style={{ width: `${(row.recommended / maxBar) * 100}%` }}
                  />
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      <p className="mcfly-panel__muted">
        {PRODUCT_NOUN.allocationHeuristic}
      </p>
    </section>
  );
}
