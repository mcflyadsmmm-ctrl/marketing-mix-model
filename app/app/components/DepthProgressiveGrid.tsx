import { useEffect } from "react";
import { useFetcher } from "react-router";
import { DepthChartCard } from "./DepthChartCard";
import type { DepthChartModel } from "../lib/shopify-depth-metrics";

type HeavyPayload = {
  charts: DepthChartModel[];
};

/**
 * First paint: day-fact (+ empty shell) charts.
 * Then fetch heavyHref and splice order-fact charts into catalog order.
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

  const heavyById = new Map(
    (fetcher.data?.charts ?? []).map((c) => [c.id, c] as const),
  );
  const fastById = new Map(fastCharts.map((c) => [c.id, c] as const));

  const merged: DepthChartModel[] = [];
  const seen = new Set<string>();

  // Preserve catalog order: fast charts first in their relative order,
  // placeholders (slow ids) in catalog order with heavy swap-in.
  for (const chart of fastCharts) {
    merged.push(chart);
    seen.add(chart.id);
  }
  for (const slot of placeholders) {
    if (seen.has(slot.id)) continue;
    merged.push(heavyById.get(slot.id) ?? slot);
    seen.add(slot.id);
  }
  // Any unexpected heavy ids append last.
  for (const chart of fetcher.data?.charts ?? []) {
    if (seen.has(chart.id)) continue;
    merged.push(chart);
  }

  const waiting =
    deferHeavy &&
    placeholders.length > 0 &&
    !fetcher.data &&
    fetcher.state !== "idle";

  return (
    <div className="mcfly-depth-progressive">
      {deferHeavy && placeholders.length > 0 ? (
        <p className="mcfly-depth-progressive__status" aria-live="polite">
          {fetcher.data
            ? "Order-history charts ready."
            : waiting || fetcher.state === "loading"
              ? "Loading order-history charts…"
              : "Loading order-history charts…"}
        </p>
      ) : null}
      <div className="mcfly-depth-chart-grid">
        {merged.map((model) => (
          <div
            key={model.id}
            className={
              deferHeavy &&
              placeholders.some((p) => p.id === model.id) &&
              !heavyById.has(model.id)
                ? "mcfly-depth-chart-slot mcfly-depth-chart-slot--pending"
                : "mcfly-depth-chart-slot"
            }
          >
            <DepthChartCard model={model} />
          </div>
        ))}
      </div>
    </div>
  );
}
