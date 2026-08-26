/**
 * What a merchant sees in the first 90 seconds of Sample, checked through the
 * same pipeline the loader uses: generator → daily rows → buckets → legend.
 *
 * Live smoke on Fly v161 found Sample showing fourteen paid chips plus a grey
 * Other, with no Billboard anywhere. Billboard is the first-session example —
 * a merchant typing $400 of offline spend next to yesterday's sales — so it
 * has to be in Sample, in its own colour, high enough in the legend to notice.
 */
import { describe, expect, it } from "vitest";
import { buildThreeYearSampleDesk } from "./demo-sample-desk.server";
import {
  applyExplorerMode,
  bucketExplorerRows,
  explorerLegendChannels,
  explorerMixShares,
  fillExplorerDayHoles,
  type ExplorerDailyRow,
} from "./spend-explorer";
import { sliceFillKey } from "./channel-fill";

/** Mirrors buildDailyRowsForWindow: named extras key on `other:<slug>`. */
function sampleWindow(days: number): ExplorerDailyRow[] {
  const all = buildThreeYearSampleDesk({
    now: new Date("2026-08-26T12:00:00Z"),
    years: 1,
  });
  const rows = all.slice(-days).map((r) => {
    const channels = Object.entries(r.spendByChannel)
      .filter(([, amt]) => (amt ?? 0) > 0)
      .map(([channel, amount]) => ({ channel, amount: amount as number }));
    for (const extra of r.namedExtras) {
      channels.push({ channel: `other:${extra.slug}`, amount: extra.amount });
    }
    return {
      dateKey: r.day.toISOString().slice(0, 10),
      sales: r.sales,
      spend: channels.reduce((s, c) => s + c.amount, 0),
      channels,
    };
  });
  return fillExplorerDayHoles(
    rows,
    rows[0]!.dateKey,
    rows[rows.length - 1]!.dateKey,
  );
}

function bucketsFor(days: number) {
  return applyExplorerMode(
    bucketExplorerRows(sampleWindow(days), "Day"),
    "stacked",
  );
}

describe("Sample desk, first 90 seconds", () => {
  it("puts Billboard in the legend, high enough to read at a glance", () => {
    for (const days of [14, 30, 45, 90]) {
      const legend = explorerLegendChannels(bucketsFor(days), "stacked");
      const rank = legend.indexOf("other:billboard");
      expect(rank, `${days}d rank`).toBeGreaterThanOrEqual(0);
      expect(rank, `${days}d rank`).toBeLessThanOrEqual(2);
      // Short legend — a merchant should not hunt through sixteen chips.
      expect(legend.length, `${days}d chips`).toBeLessThanOrEqual(7);
    }
  });

  it("gives Billboard its own fill, never the grey Other band", () => {
    expect(sliceFillKey("other:billboard")).not.toBe("other");
    const legend = explorerLegendChannels(bucketsFor(45), "stacked");
    // Both series exist and they do not share a colour.
    expect(legend).toContain("other:billboard");
    expect(legend).toContain("other");
    expect(sliceFillKey("other:billboard")).not.toBe(sliceFillKey("other"));
  });

  it("spends real money on Billboard, not a rounding sliver", () => {
    const mix = explorerMixShares(bucketsFor(45), "stacked");
    expect(mix["other:billboard"]).toBeGreaterThan(0.08);
    expect(mix["other:billboard"]).toBeLessThan(0.25);
  });

  it("contains $0 holes so the missing-days caption is true", () => {
    const buckets = bucketsFor(45);
    const holes = buckets.filter((b) => b.spend === 0);
    expect(holes.length).toBeGreaterThan(0);
    // A dark day still sold — the hole is in spend, never in the till.
    for (const hole of holes) expect(hole.sales).toBeGreaterThan(0);
  });

  it("shows Billboard going dark while paid media keeps running", () => {
    const buckets = bucketsFor(45);
    const billboardDark = buckets.filter(
      (b) =>
        b.spend > 0 && !b.bars.some((s) => s.channel === "other:billboard"),
    );
    expect(billboardDark.length).toBeGreaterThan(0);
  });

  it("never lets Sample spend exceed Sample sales", () => {
    for (const bucket of bucketsFor(90)) {
      if (bucket.spend > 0) expect(bucket.spend).toBeLessThan(bucket.sales);
    }
  });
});
