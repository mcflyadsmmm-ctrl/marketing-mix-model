/**
 * @vitest-environment jsdom
 *
 * Founder P1: the Spend chart must switch between stacked bar and line without
 * dying — on day, week and month buckets, with $0 calendar holes and a
 * Billboard series that is its own colour rather than the grey Other band.
 *
 * These drive the real controls: the mark toggle is a router Link, so the test
 * clicks it, lets the URL change, and re-renders from the new URL the way the
 * loader would. Nothing here hand-feeds `mark=`.
 */
import { afterEach, describe, expect, it } from "vitest";
import { StrictMode, act, createElement, useMemo } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, useSearchParams } from "react-router";
import { SpendExplorer, type SpendExplorerSeriesView } from "./SpendExplorer";
import { namedExtraFillKey, sliceFillKey } from "../lib/channel-fill";
import {
  applyExplorerMode,
  bucketExplorerRows,
  fillExplorerDayHoles,
  parseExplorerGranularity,
  parseExplorerMark,
  parseExplorerMode,
  summarizeExplorer,
  type ExplorerDailyRow,
  type ExplorerGranularity,
  type ExplorerMark,
  type ExplorerMode,
} from "../lib/spend-explorer";

declare global {
  // eslint-disable-next-line no-var
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

function day(
  dateKey: string,
  sales: number,
  channels: Record<string, number>,
): ExplorerDailyRow {
  const list = Object.entries(channels).map(([channel, amount]) => ({
    channel,
    amount,
  }));
  const spend = list.reduce((s, c) => s + c.amount, 0);
  return { dateKey, sales, spend, channels: list };
}

/** Sparse spend with a Billboard extra and $0 holes between the buys. */
const SPARSE_WITH_BILLBOARD = fillExplorerDayHoles(
  [
    day("2026-06-02", 1200, { meta: 80, "other:billboard": 400 }),
    day("2026-06-19", 900, { meta: 90, google: 120 }),
    day("2026-07-08", 1500, { meta: 140, "other:billboard": 260 }),
    day("2026-08-04", 1100, { google: 130, "other:billboard": 180 }),
  ],
  "2026-06-01",
  "2026-08-06",
);

/** A window where every closed day is $0 — Live desk before any upload. */
const ALL_EMPTY_DAYS = fillExplorerDayHoles([], "2026-08-01", "2026-08-06");

const BILLBOARD_FILL = namedExtraFillKey("billboard");

function buildSeries(opts: {
  rows: ExplorerDailyRow[];
  mode: ExplorerMode;
  mark: ExplorerMark;
  granularity: ExplorerGranularity;
  showSales?: boolean;
  showCash?: boolean;
  showPriorPeriod?: boolean;
  priorChannelSpend?: Array<{ channel: string; amount: number }> | null;
}): SpendExplorerSeriesView {
  const buckets = applyExplorerMode(
    bucketExplorerRows(opts.rows, opts.granularity),
    opts.mode,
  );
  return {
    buckets,
    summary: summarizeExplorer(opts.rows, { bucketCount: buckets.length }),
    mode: opts.mode,
    granularity: opts.granularity,
    range: "custom",
    windowLabel: "Jun 1 – Aug 6",
    targetMer: 3.6,
    breakEvenMer: 2.86,
    showSales: opts.showSales ?? true,
    mark: opts.mark,
    showCash: opts.showCash ?? true,
    showPriorPeriod: opts.showPriorPeriod ?? false,
    fromKey: "2026-06-01",
    toKey: "2026-08-06",
    asOfKey: "2026-08-06",
    channelLabels: { "other:billboard": "Billboard" },
    priorChannelSpend: opts.priorChannelSpend ?? null,
  };
}

/**
 * Stands in for the route loader: reads the explorer's own URL params and
 * rebuilds the series, so clicking a control really does change the chart.
 */
function Harness({ rows }: { rows: ExplorerDailyRow[] }) {
  const [params] = useSearchParams();
  const mark = parseExplorerMark(params.get("exMark"));
  const granularity = parseExplorerGranularity(params.get("exGran"));
  const mode = parseExplorerMode(params.get("exMode"));
  const series = useMemo(
    () => buildSeries({ rows, mode, mark, granularity }),
    [rows, mode, mark, granularity],
  );
  return createElement(SpendExplorer, {
    series,
    period: "mtd" as const,
    basePath: "/app/spend" as const,
    compare: true,
  });
}

let root: Root | null = null;
let host: HTMLDivElement | null = null;

function mountTree(node: React.ReactElement, entry = "/app/spend") {
  host = document.createElement("div");
  document.body.appendChild(host);
  const created = createRoot(host);
  root = created;
  act(() => {
    created.render(
      createElement(
        StrictMode,
        null,
        createElement(MemoryRouter, { initialEntries: [entry] }, node),
      ),
    );
  });
  return created;
}

function unmount(created: Root) {
  act(() => created.unmount());
  host?.remove();
  root = null;
  host = null;
}

/** Click a segmented control by its visible label. */
function clickControl(label: string) {
  const link = [...host!.querySelectorAll("a.mcfly-explorer__btn")].find(
    (a) => a.textContent?.trim() === label,
  ) as HTMLAnchorElement | undefined;
  if (!link) throw new Error(`No control labelled "${label}"`);
  act(() => {
    link.dispatchEvent(
      new window.MouseEvent("click", {
        bubbles: true,
        cancelable: true,
        button: 0,
      }),
    );
  });
  return link;
}

function activeMarkLabel(): string | null {
  const on = [...host!.querySelectorAll("a.mcfly-explorer__btn--on")].find(
    (a) => a.textContent?.trim() === "Line" || a.textContent?.trim() === "Stacked bar",
  );
  return on?.textContent?.trim() ?? null;
}

afterEach(() => {
  if (root) act(() => root!.unmount());
  host?.remove();
  root = null;
  host = null;
});

describe("Spend chart: clicking Stacked bar vs Line", () => {
  for (const grain of ["Day", "Week", "Month"] as ExplorerGranularity[]) {
    it(`switches marks on ${grain} buckets with $0 holes and Billboard`, () => {
      const created = mountTree(
        createElement(Harness, { rows: SPARSE_WITH_BILLBOARD }),
        `/app/spend?exGran=${grain}`,
      );

      // Starts as stacked bar: real rects, no bands.
      expect(activeMarkLabel(), `${grain} initial`).toBe("Stacked bar");
      expect(
        host!.querySelectorAll("rect.mcfly-explorer__seg").length,
        `${grain} bar segs`,
      ).toBeGreaterThan(0);
      expect(host!.querySelectorAll(".mcfly-explorer__band-line").length).toBe(
        0,
      );

      // Click Line — the URL carries exMark and the chart rebuilds from it.
      clickControl("Line");
      expect(activeMarkLabel(), `${grain} after Line`).toBe("Line");
      expect(
        host!.querySelectorAll(".mcfly-explorer__band-line").length,
        `${grain} line bands`,
      ).toBeGreaterThan(0);
      expect(host!.querySelectorAll("rect.mcfly-explorer__seg").length).toBe(0);
      expect(host!.textContent, `${grain} line`).not.toMatch(/NaN|Infinity/);

      // Click back — no crash in either direction.
      clickControl("Stacked bar");
      expect(activeMarkLabel(), `${grain} back to bar`).toBe("Stacked bar");
      expect(
        host!.querySelectorAll("rect.mcfly-explorer__seg").length,
        `${grain} bar segs again`,
      ).toBeGreaterThan(0);
      expect(host!.textContent, `${grain} bar`).not.toMatch(/NaN|Infinity/);

      unmount(created);
    });
  }

  it("survives switching grain and mode while on the Line mark", () => {
    const created = mountTree(
      createElement(Harness, { rows: SPARSE_WITH_BILLBOARD }),
      "/app/spend?exGran=Day",
    );
    clickControl("Line");
    for (const step of ["Week", "Month", "Quarter", "Share %", "Total $", "Channels $"]) {
      clickControl(step);
      expect(host!.querySelector("svg"), `after ${step}`).toBeTruthy();
      expect(host!.textContent, `after ${step}`).not.toMatch(/NaN|Infinity/);
    }
    expect(activeMarkLabel()).toBe("Line");
    unmount(created);
  });
});

describe("Billboard is its own series", () => {
  it("does not share the Other fill on the chart, legend, or table", () => {
    expect(BILLBOARD_FILL).not.toBe("other");
    expect(sliceFillKey("other:billboard")).toBe(BILLBOARD_FILL);
    expect(sliceFillKey("other")).toBe("other");
    // The label and the slug must land on the same colour.
    expect(namedExtraFillKey("Billboard")).toBe(BILLBOARD_FILL);

    const created = mountTree(
      createElement(Harness, { rows: SPARSE_WITH_BILLBOARD }),
      "/app/spend?exGran=Day",
    );
    const billboardRects = host!.querySelectorAll(
      `rect.mcfly-explorer__seg--${BILLBOARD_FILL}`,
    );
    expect(billboardRects.length).toBeGreaterThan(0);

    // Nothing labelled Billboard may be reachable through the Other fill.
    const legendOther = [
      ...host!.querySelectorAll(".mcfly-explorer__ch-toggle"),
    ].find((b) =>
      b.querySelector(".mcfly-explorer__ch-dot.mcfly-explorer__seg--other"),
    );
    expect(legendOther?.textContent ?? "").not.toContain("Billboard");
    unmount(created);
  });

  it("names Billboard in the legend with its own swatch and mix percent", () => {
    const created = mountTree(
      createElement(Harness, { rows: SPARSE_WITH_BILLBOARD }),
      "/app/spend?exGran=Day",
    );
    const legend = host!.querySelector(".mcfly-explorer__channel-toggles");
    expect(legend?.textContent).toContain("Billboard");
    expect(legend?.textContent).not.toContain("other:billboard");
    expect(legend?.textContent).toMatch(/\d+%/);
    expect(
      legend?.querySelector(`.mcfly-explorer__ch-dot.mcfly-explorer__seg--${BILLBOARD_FILL}`),
    ).toBeTruthy();
    unmount(created);
  });

  it("hovering the Billboard band reports Billboard, not Other", () => {
    const created = mountTree(
      createElement(Harness, { rows: SPARSE_WITH_BILLBOARD }),
      "/app/spend?exGran=Day",
    );
    const seg = host!.querySelector(
      `rect.mcfly-explorer__seg--${BILLBOARD_FILL}`,
    ) as SVGRectElement | null;
    expect(seg).toBeTruthy();
    act(() => {
      // React synthesizes onPointerEnter from a bubbling pointerover.
      seg!.dispatchEvent(
        new window.PointerEvent("pointerover", { bubbles: true }),
      );
    });
    const tip = host!.querySelector(".mcfly-explorer__tip");
    expect(tip?.textContent).toContain("Billboard");
    expect(tip?.textContent).not.toContain("other:billboard");
    expect(tip?.textContent).toMatch(/of mix/);
    unmount(created);
  });
});

describe("Line hover names the column under the pointer", () => {
  it("reports the hovered bucket, not the selected or first one", () => {
    const created = mountTree(
      createElement(Harness, { rows: SPARSE_WITH_BILLBOARD }),
      "/app/spend?exGran=Week",
    );
    clickControl("Line");

    const washes = [
      ...host!.querySelectorAll("rect.mcfly-explorer__col-wash"),
    ] as SVGRectElement[];
    expect(washes.length).toBeGreaterThan(3);

    // Bands must not intercept the pointer, or the column would be a guess.
    for (const band of host!.querySelectorAll(".mcfly-explorer__band-g")) {
      expect(band.getAttribute("pointer-events")).toBe("none");
    }

    const third = washes[2]!;
    const expectedLabel = third
      .getAttribute("aria-label")
      ?.split(":")[0]
      ?.trim();
    act(() => {
      third.dispatchEvent(
        new window.PointerEvent("pointerover", { bubbles: true }),
      );
    });
    const tip = host!.querySelector(".mcfly-explorer__tip");
    expect(tip?.textContent).toContain(expectedLabel!);

    // A different column must produce a different tooltip.
    const fifth = washes[4]!;
    const otherLabel = fifth.getAttribute("aria-label")?.split(":")[0]?.trim();
    act(() => {
      fifth.dispatchEvent(
        new window.PointerEvent("pointerover", { bubbles: true }),
      );
    });
    expect(host!.querySelector(".mcfly-explorer__tip")?.textContent).toContain(
      otherLabel!,
    );
    expect(otherLabel).not.toBe(expectedLabel);
    unmount(created);
  });
});

describe("Empty and honest states", () => {
  it("draws $0 holes instead of an empty plot when every day is $0", () => {
    for (const mark of ["bar", "line"] as ExplorerMark[]) {
      const created = mountTree(
        createElement(SpendExplorer, {
          series: buildSeries({
            rows: ALL_EMPTY_DAYS,
            mode: "stacked",
            mark,
            granularity: "Day",
          }),
          period: "mtd" as const,
          basePath: "/app/spend" as const,
        }),
      );
      expect(
        host!.querySelectorAll(".mcfly-explorer__hole-tick").length,
        `${mark} hole ticks`,
      ).toBe(6);
      expect(host!.textContent).not.toMatch(/NaN|Infinity/);
      expect(host!.textContent).not.toContain("No spend in");
      unmount(created);
    }
  });

  it("shows $0 and a needs-more-days line on an empty Live window", () => {
    const created = mountTree(
      createElement(SpendExplorer, {
        series: buildSeries({
          rows: ALL_EMPTY_DAYS,
          mode: "stacked",
          mark: "line",
          granularity: "Day",
        }),
        period: "mtd" as const,
        basePath: "/app/spend" as const,
      }),
    );
    const strip = host!.querySelector(".mcfly-explorer__readout");
    expect(strip?.textContent).toContain("$0");
    expect(strip?.textContent).toContain("Days with spend");
    expect(strip?.textContent).toContain("0 of 6");
    expect(host!.querySelector(".mcfly-explorer__caption")?.textContent).toMatch(
      /Needs 6 more days of spend/,
    );
    unmount(created);
  });

  it("keeps ids and aria-activedescendant usable as CSS selectors", () => {
    // Defensive hygiene, not a crash: week and quarter bucket keys carry a
    // colon, which is legal in an id but not in a `#id` selector.
    for (const grain of ["Week", "Quarter"] as ExplorerGranularity[]) {
      const created = mountTree(
        createElement(SpendExplorer, {
          series: buildSeries({
            rows: SPARSE_WITH_BILLBOARD,
            mode: "stacked",
            mark: "bar",
            granularity: grain,
          }),
          period: "mtd" as const,
          basePath: "/app/spend" as const,
        }),
      );
      const ids = [...host!.querySelectorAll("[id]")].map((el) => el.id);
      expect(ids.length, `${grain} ids`).toBeGreaterThan(0);
      for (const id of ids) expect(id, `${grain} id`).not.toContain(":");
      const active = host!
        .querySelector("[aria-activedescendant]")
        ?.getAttribute("aria-activedescendant");
      expect(active, `${grain} activedescendant`).toBeTruthy();
      expect(host!.querySelector(`#${active}`)).toBeTruthy();
      unmount(created);
    }
  });

  it("reads cash left after ads without exceeding Shopify sales", () => {
    const created = mountTree(
      createElement(Harness, { rows: SPARSE_WITH_BILLBOARD }),
      "/app/spend?exGran=Day",
    );
    const strip = host!.querySelector(".mcfly-explorer__readout");
    expect(strip?.textContent).toContain("Cash left after ads");
    expect(strip?.textContent).toContain("Shopify sales");
    expect(strip?.textContent).not.toMatch(/NaN/);
    expect(
      host!.querySelector(".mcfly-explorer__caption")?.textContent,
    ).toMatch(/not who caused the sale/);
    expect(host!.textContent?.toLowerCase()).not.toContain("profit");
    unmount(created);
  });

  it("draws cash left after ads per bucket, red when ads outspent the till", () => {
    const created = mountTree(
      createElement(SpendExplorer, {
        series: buildSeries({
          rows: [
            day("2026-08-01", 1200, { meta: 200 }),
            day("2026-08-02", 100, { meta: 900 }),
          ],
          mode: "stacked",
          mark: "bar",
          granularity: "Day",
        }),
        period: "mtd" as const,
        basePath: "/app/spend" as const,
      }),
    );
    expect(host!.querySelectorAll(".mcfly-explorer__cash-bar").length).toBe(2);
    expect(
      host!.querySelectorAll(".mcfly-explorer__cash-bar--neg").length,
    ).toBe(1);
    unmount(created);
  });

  it("overlays last week only where a week lag means something", () => {
    const fourteen = fillExplorerDayHoles(
      Array.from({ length: 14 }, (_, i) =>
        day(`2026-08-${String(i + 1).padStart(2, "0")}`, 400 + i * 25, {
          meta: 90,
        }),
      ),
      "2026-08-01",
      "2026-08-14",
    );
    const created = mountTree(
      createElement(SpendExplorer, {
        series: buildSeries({
          rows: fourteen,
          mode: "stacked",
          mark: "bar",
          granularity: "Day",
          showPriorPeriod: true,
        }),
        period: "mtd" as const,
        basePath: "/app/spend" as const,
      }),
    );
    expect(host!.querySelector(".mcfly-explorer__prior-line")).toBeTruthy();
    unmount(created);

    const monthly = mountTree(
      createElement(SpendExplorer, {
        series: buildSeries({
          rows: fourteen,
          mode: "stacked",
          mark: "bar",
          granularity: "Month",
          showPriorPeriod: true,
        }),
        period: "mtd" as const,
        basePath: "/app/spend" as const,
      }),
    );
    expect(host!.querySelector(".mcfly-explorer__prior-line")).toBeNull();
    unmount(monthly);
  });

  it("tables where the money went, with vs-last only when a prior window is given", () => {
    const created = mountTree(
      createElement(SpendExplorer, {
        series: buildSeries({
          rows: SPARSE_WITH_BILLBOARD,
          mode: "stacked",
          mark: "line",
          granularity: "Day",
        }),
        period: "mtd" as const,
        basePath: "/app/spend" as const,
      }),
    );
    let table = host!.querySelector(".mcfly-mixtable");
    expect(table?.textContent).toContain("Billboard");
    expect(table?.textContent).toMatch(/Not a claim that a channel caused/);
    expect(table?.textContent).not.toContain("vs last");
    unmount(created);

    const withPrior = mountTree(
      createElement(SpendExplorer, {
        series: buildSeries({
          rows: SPARSE_WITH_BILLBOARD,
          mode: "stacked",
          mark: "line",
          granularity: "Day",
          priorChannelSpend: [
            { channel: "Meta Ads", amount: 900 },
            { channel: "Billboard", amount: 100 },
          ],
        }),
        period: "mtd" as const,
        basePath: "/app/spend" as const,
      }),
    );
    table = host!.querySelector(".mcfly-mixtable");
    expect(table?.textContent).toContain("vs last");
    expect(table?.textContent).toMatch(/pp/);
    expect(table?.textContent).not.toContain("other:billboard");
    unmount(withPrior);
  });
});
