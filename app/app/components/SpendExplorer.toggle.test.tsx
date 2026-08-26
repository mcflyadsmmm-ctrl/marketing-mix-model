/**
 * @vitest-environment jsdom
 *
 * Founder P1: switching the Spend chart between stacked bar and line must not
 * throw — including on $0 calendar holes and with a Billboard extra, whose
 * slice key (`other:billboard`) and week bucket keys (`w:2026-08-03`) both
 * carry a colon that cannot go into an SVG/ARIA id.
 */
import { afterEach, describe, expect, it } from "vitest";
import { StrictMode, act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router";
import {
  SpendExplorer,
  type SpendExplorerSeriesView,
} from "./SpendExplorer";
import {
  applyExplorerMode,
  bucketExplorerRows,
  fillExplorerDayHoles,
  summarizeExplorer,
  type ExplorerDailyRow,
  type ExplorerGranularity,
  type ExplorerMark,
  type ExplorerMode,
} from "../lib/spend-explorer";

declare global {
  // React 18+ opt-in flag; silences the act() environment warning.
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

/** Two spend days with a Billboard extra, three $0 holes between/after. */
const SPARSE_WITH_BILLBOARD = fillExplorerDayHoles(
  [
    day("2026-08-01", 1200, { meta: 80, "other:billboard": 400 }),
    day("2026-08-04", 900, { meta: 90, google: 120 }),
  ],
  "2026-08-01",
  "2026-08-06",
);

/** A window where every closed day is $0 — Live desk before any upload. */
const ALL_EMPTY_DAYS = fillExplorerDayHoles([], "2026-08-01", "2026-08-06");

function seriesFor(opts: {
  rows: ExplorerDailyRow[];
  mode: ExplorerMode;
  mark: ExplorerMark;
  granularity: ExplorerGranularity;
  showSales: boolean;
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
    windowLabel: "Aug 1–6",
    targetMer: 3.6,
    breakEvenMer: 2.86,
    showSales: opts.showSales,
    mark: opts.mark,
    fromKey: "2026-08-01",
    toKey: "2026-08-06",
    asOfKey: "2026-08-06",
    channelLabels: { "other:billboard": "Billboard" },
  };
}

let root: Root | null = null;
let host: HTMLDivElement | null = null;

function mount(series: SpendExplorerSeriesView) {
  host = document.createElement("div");
  document.body.appendChild(host);
  const created = createRoot(host);
  root = created;
  act(() => {
    created.render(
      createElement(
        StrictMode,
        null,
        createElement(
          MemoryRouter,
          { initialEntries: ["/app/spend"] },
          createElement(SpendExplorer, {
            series,
            period: "mtd" as const,
            basePath: "/app/spend" as const,
            compare: true,
            variant: "spend" as const,
          }),
        ),
      ),
    );
  });
  return created;
}

function rerender(created: Root, series: SpendExplorerSeriesView) {
  act(() => {
    created.render(
      createElement(
        StrictMode,
        null,
        createElement(
          MemoryRouter,
          { initialEntries: ["/app/spend"] },
          createElement(SpendExplorer, {
            series,
            period: "mtd" as const,
            basePath: "/app/spend" as const,
            compare: true,
            variant: "spend" as const,
          }),
        ),
      ),
    );
  });
}

afterEach(() => {
  if (root) act(() => root!.unmount());
  host?.remove();
  root = null;
  host = null;
});

describe("Spend chart: stacked bar vs line", () => {
  it("toggles bar → line → bar in every mode with holes and Billboard", () => {
    const modes: ExplorerMode[] = ["stacked", "share", "total"];
    for (const mode of modes) {
      const base = {
        rows: SPARSE_WITH_BILLBOARD,
        mode,
        granularity: "Day" as const,
        showSales: true,
      };
      const created = mount(seriesFor({ ...base, mark: "bar" }));
      expect(host!.querySelector("svg"), `${mode} bar svg`).toBeTruthy();

      rerender(created, seriesFor({ ...base, mark: "line" }));
      expect(
        host!.querySelectorAll(".mcfly-explorer__band-line").length,
        `${mode} line bands`,
      ).toBeGreaterThan(0);
      expect(host!.querySelectorAll("rect.mcfly-explorer__seg").length).toBe(0);

      rerender(created, seriesFor({ ...base, mark: "bar" }));
      if (mode !== "total") {
        expect(
          host!.querySelectorAll("rect.mcfly-explorer__seg").length,
          `${mode} bar segs`,
        ).toBeGreaterThan(0);
      }

      act(() => created.unmount());
      host!.remove();
      root = null;
    }
  });

  it("keeps every SVG id and aria-activedescendant colon-free and resolvable", () => {
    for (const mark of ["bar", "line"] as ExplorerMark[]) {
      const created = mount(
        seriesFor({
          rows: SPARSE_WITH_BILLBOARD,
          mode: "stacked",
          mark,
          // Week buckets key on `w:2026-08-03`.
          granularity: "Week",
          showSales: true,
        }),
      );
      const ids = [...host!.querySelectorAll("[id]")].map((el) => el.id);
      expect(ids.length, `${mark} ids`).toBeGreaterThan(0);
      for (const id of ids) expect(id, `${mark} id`).not.toContain(":");

      const active = host!
        .querySelector("[aria-activedescendant]")
        ?.getAttribute("aria-activedescendant");
      expect(active, `${mark} activedescendant`).toBeTruthy();
      expect(active).not.toContain(":");
      // A colon id makes this selector a syntax error; a safe id resolves.
      expect(
        host!.querySelector(`#${active}`),
        `${mark} activedescendant resolves`,
      ).toBeTruthy();

      act(() => created.unmount());
      host!.remove();
      root = null;
    }
  });

  it("draws $0 holes instead of an empty plot when every day is $0", () => {
    for (const mark of ["bar", "line"] as ExplorerMark[]) {
      const created = mount(
        seriesFor({
          rows: ALL_EMPTY_DAYS,
          mode: "stacked",
          mark,
          granularity: "Day",
          showSales: true,
        }),
      );
      expect(
        host!.querySelectorAll(".mcfly-explorer__hole-tick").length,
        `${mark} hole ticks`,
      ).toBe(6);
      expect(host!.textContent).not.toMatch(/NaN|Infinity/);
      act(() => created.unmount());
      host!.remove();
      root = null;
    }
  });

  it("names the Billboard extra in the legend, never a raw slug", () => {
    const created = mount(
      seriesFor({
        rows: SPARSE_WITH_BILLBOARD,
        mode: "stacked",
        mark: "line",
        granularity: "Day",
        showSales: true,
      }),
    );
    const legend = host!.querySelector(".mcfly-explorer__channel-toggles");
    expect(legend?.textContent).toContain("Billboard");
    expect(legend?.textContent).not.toContain("other:billboard");
    // Mix % is the merchant-readable share of budget, shown next to the name.
    expect(legend?.textContent).toMatch(/\d+%/);
    act(() => created.unmount());
    host!.remove();
    root = null;
  });

  it("reads cash left after ads without exceeding Shopify sales", () => {
    const created = mount(
      seriesFor({
        rows: SPARSE_WITH_BILLBOARD,
        mode: "stacked",
        mark: "bar",
        granularity: "Day",
        showSales: true,
      }),
    );
    const strip = host!.querySelector(".mcfly-explorer__readout");
    expect(strip?.textContent).toContain("Cash left after ads");
    expect(strip?.textContent).toContain("Shopify sales");
    expect(strip?.textContent).toContain("Days with spend");
    expect(strip?.textContent).not.toMatch(/NaN/);
    // Mix is where money went, never who caused the sale.
    const caption = host!.querySelector(".mcfly-explorer__caption");
    expect(caption?.textContent).toMatch(/not who caused the sale/);
    act(() => created.unmount());
    host!.remove();
    root = null;
  });

  it("shows $0 and a needs-more-days line on an empty Live window", () => {
    const created = mount(
      seriesFor({
        rows: ALL_EMPTY_DAYS,
        mode: "stacked",
        mark: "line",
        granularity: "Day",
        showSales: true,
      }),
    );
    const strip = host!.querySelector(".mcfly-explorer__readout");
    expect(strip?.textContent).toContain("$0");
    expect(strip?.textContent).toContain("Days with spend");
    expect(strip?.textContent).toContain("0 of 6");
    expect(host!.querySelector(".mcfly-explorer__caption")?.textContent).toMatch(
      /Needs 6 more days of spend/,
    );
    expect(host!.textContent).not.toMatch(/NaN|Infinity/);
    act(() => created.unmount());
    host!.remove();
    root = null;
  });

  it("hovering a column and a segment renders English, not a slug", () => {
    const created = mount(
      seriesFor({
        rows: SPARSE_WITH_BILLBOARD,
        mode: "stacked",
        mark: "bar",
        granularity: "Day",
        showSales: true,
      }),
    );
    const seg = host!.querySelector(
      "rect.mcfly-explorer__seg--other",
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
    act(() => created.unmount());
    host!.remove();
    root = null;
  });
});
