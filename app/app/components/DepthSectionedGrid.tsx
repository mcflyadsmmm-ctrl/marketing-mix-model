import { useEffect, useMemo, type ReactNode } from "react";
import { useFetcher } from "react-router";
import { DeskSection } from "./DeskSection";
import { DepthChartCard } from "./DepthChartCard";
import {
  preferFilledDepthCharts,
  type DepthChartModel,
} from "../lib/shopify-depth-metrics";
import {
  deskSectionsForTab,
  SALES_LEDGER_FEATURE_IDS,
  type DeskSectionDef,
} from "../lib/desk-sections";

type HeavyPayload = {
  charts: DepthChartModel[];
};

function mergeProgressiveCharts(args: {
  fastCharts: DepthChartModel[];
  placeholders: DepthChartModel[];
  heavyCharts: DepthChartModel[];
}): DepthChartModel[] {
  const filledFast = preferFilledDepthCharts(args.fastCharts);
  const filledHeavy = preferFilledDepthCharts(args.heavyCharts);
  const heavyById = new Map(filledHeavy.map((c) => [c.id, c] as const));
  const seen = new Set<string>();
  const merged: DepthChartModel[] = [];

  for (const chart of filledFast) {
    merged.push(chart);
    seen.add(chart.id);
  }
  for (const slot of args.placeholders) {
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
  return merged;
}

function chartsForSection(
  section: DeskSectionDef,
  byId: Map<string, DepthChartModel>,
): { hero: DepthChartModel | null; rest: DepthChartModel[] } {
  const ordered: DepthChartModel[] = [];
  for (const id of section.featureIds) {
    const chart = byId.get(id);
    if (chart) ordered.push(chart);
  }
  let hero: DepthChartModel | null = null;
  if (section.heroFeatureId) {
    const idx = ordered.findIndex((c) => c.id === section.heroFeatureId);
    if (idx >= 0) {
      hero = ordered[idx]!;
      ordered.splice(idx, 1);
    }
  }
  return { hero, rest: ordered };
}

/**
 * Progressive depth charts composed into named desk sections
 * instead of a flat card dump.
 */
export function DepthSectionedGrid({
  tab,
  fastCharts,
  placeholders,
  heavyHref,
  deferHeavy,
  ledgerNote,
}: {
  tab: "sales" | "customers";
  fastCharts: DepthChartModel[];
  placeholders: DepthChartModel[];
  heavyHref: string | null;
  deferHeavy: boolean;
  ledgerNote?: ReactNode;
}) {
  const fetcher = useFetcher<HeavyPayload>();

  useEffect(() => {
    if (!deferHeavy || !heavyHref) return;
    if (fetcher.state !== "idle") return;
    if (fetcher.data) return;
    fetcher.load(heavyHref);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deferHeavy, heavyHref, fetcher.state, fetcher.data]);

  const merged = useMemo(
    () =>
      mergeProgressiveCharts({
        fastCharts,
        placeholders,
        heavyCharts: fetcher.data?.charts ?? [],
      }),
    [fastCharts, placeholders, fetcher.data?.charts],
  );

  const byId = useMemo(() => {
    const map = new Map<string, DepthChartModel>();
    for (const chart of merged) {
      if (tab === "sales" && SALES_LEDGER_FEATURE_IDS.has(chart.id)) continue;
      map.set(chart.id, chart);
    }
    return map;
  }, [merged, tab]);

  const sections = deskSectionsForTab(tab);
  const assigned = new Set<string>();
  for (const section of sections) {
    for (const id of section.featureIds) assigned.add(id);
  }
  const overflow = merged.filter(
    (c) =>
      !assigned.has(c.id) &&
      !(tab === "sales" && SALES_LEDGER_FEATURE_IDS.has(c.id)),
  );

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
    <div className="mcfly-depth-sectioned">
      {showStatus ? (
        <p className="mcfly-depth-progressive__status" aria-live="polite">
          {fetcher.data
            ? preferFilledDepthCharts(fetcher.data.charts ?? []).length > 0
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

      {sections.map((section, sectionIndex) => {
        const { hero, rest } = chartsForSection(section, byId);
        if (!hero && rest.length === 0) return null;
        return (
          <DeskSection
            key={section.id}
            id={section.id}
            title={section.title}
            blurb={section.blurb}
            hero={Boolean(hero)}
          >
            {sectionIndex === 0 && ledgerNote ? (
              <p className="mcfly-desk-section__note">{ledgerNote}</p>
            ) : null}
            {hero ? (
              <div className="mcfly-desk-section__hero-chart">
                <DepthChartCard model={hero} />
              </div>
            ) : null}
            {rest.length > 0 ? (
              <div className="mcfly-depth-chart-grid">
                {rest.map((model) => (
                  <div key={model.id} className="mcfly-depth-chart-slot">
                    <DepthChartCard model={model} />
                  </div>
                ))}
              </div>
            ) : null}
          </DeskSection>
        );
      })}

      {overflow.length > 0 ? (
        <DeskSection
          id="more"
          title="More"
          blurb="Additional filled charts for this period."
        >
          <div className="mcfly-depth-chart-grid">
            {overflow.map((model) => (
              <div key={model.id} className="mcfly-depth-chart-slot">
                <DepthChartCard model={model} />
              </div>
            ))}
          </div>
        </DeskSection>
      ) : null}
    </div>
  );
}
