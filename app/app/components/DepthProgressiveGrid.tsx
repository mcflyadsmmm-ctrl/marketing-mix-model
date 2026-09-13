import { useEffect } from "react";
import { useFetcher } from "react-router";
import { DepthChartCard } from "./DepthChartCard";
import {
  preferFilledDepthCharts,
  type DepthChartModel,
} from "../lib/shopify-depth-metrics";

type HeavyPayload = {
  charts: DepthChartModel[];
};

/**
 * First paint: filled day-fact charts only (no empty shells).
 * Then fetch heavyHref and append filled order-fact charts — never
 * park "Loading…" or "not enough data" cards in the grid.
 */
export function DepthProgressiveGrid({
  fastCharts,
  placeholders,
  heavyHref,
  deferHeavy,
}: {
  fastCharts: DepthChartModel[];
  placeholders: DepthChartModel[];
  heavyHref: string | null;
  /** When false (listing shots), caller already loaded full charts into fastCharts. */
  deferHeavy: boolean;
}) {
  const fetcher = useFetcher<HeavyPayload>();

  useEffect(() => {
    if (!deferHeavy || !heavyHref) return;
    if (fetcher.state !== "idle") return;
    if (fetcher.data) return;
    fetcher.load(heavyHref);
    // Intentionally omit `fetcher` identity — only reload when href/mode changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deferHeavy, heavyHref, fetcher.state, fetcher.data]);

  const filledFast = preferFilledDepthCharts(fastCharts);
  const filledHeavy = preferFilledDepthCharts(fetcher.data?.charts ?? []);
  const heavyById = new Map(filledHeavy.map((c) => [c.id, c] as const));
  const seen = new Set<string>();
  const merged: DepthChartModel[] = [];

  for (const chart of filledFast) {
    merged.push(chart);
    seen.add(chart.id);
  }
  // Only splice in heavy charts that actually filled — skip pending shells.
  for (const slot of placeholders) {
    if (seen.has(slot.id)) continue;
    const heavy = heavyById.get(slot.id);
    if (!heavy) continue;
    merged.push(heavy);
    seen.add(slot.id);
  }
  for (const chart of filledHeavy) {
    if (seen.has(chart.id)) continue;
    merged.push(chart);
  }

  const loadingHeavy =
    deferHeavy &&
    placeholders.length > 0 &&
    !fetcher.data &&
    fetcher.state === "loading";

  const showStatus =
    deferHeavy &&
    placeholders.length > 0 &&
    (loadingHeavy || Boolean(fetcher.data));

  const emptyDesk =
    merged.length === 0 && !loadingHeavy && !(deferHeavy && !fetcher.data);

  return (
    <div className="mcfly-depth-progressive">
      {showStatus ? (
        <p className="mcfly-depth-progressive__status" aria-live="polite">
          {fetcher.data
            ? filledHeavy.length > 0
              ? "Order-history charts ready."
              : "Order history loaded — deeper charts need more buyer history."
            : "Loading order-history charts…"}
        </p>
      ) : null}
      {emptyDesk ? (
        <p className="mcfly-depth-progressive__empty" role="status">
          Charts show up once closed days have sales — we hide empty shells so a
          young store is not a wall of “not enough data.”
        </p>
      ) : null}
      <div className="mcfly-depth-chart-grid">
        {merged.map((model) => (
          <div key={model.id} className="mcfly-depth-chart-slot">
            <DepthChartCard model={model} />
          </div>
        ))}
      </div>
    </div>
  );
}
