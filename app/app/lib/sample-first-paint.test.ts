/**
 * Fly v162 smoke: the first Sample load showed the previous release's desk —
 * twelve chips, no Billboard, "25 of 25 days" — and only a refresh brought the
 * new shape in. The heal was fire-and-forget, so the paint raced it.
 *
 * These drive the Spend loader's sample sequence against an in-memory store:
 * heal, then read spend, then compose the explorer. One pass, no refresh.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it, vi } from "vitest";
import { buildThreeYearSampleDesk } from "./demo-sample-desk.server";
import { ensureSampleDeskSeeded } from "./sample-desk.server";
import { spendBucketKey, spendChannelLabel } from "./spend-channel-label";
import {
  applyExplorerMode,
  bucketExplorerRows,
  explorerLegendChannels,
  fillExplorerDayHoles,
  type ExplorerDailyRow,
} from "./spend-explorer";

const here = dirname(fileURLToPath(import.meta.url));
const read = (rel: string) => readFileSync(join(here, rel), "utf8");

type StoredSpend = {
  dateKey: string;
  channel: string;
  customKey: string;
  note: string;
  amount: number;
};

/** Stands in for SpendEntry rows with source="sample". */
class SampleStore {
  rows: StoredSpend[] = [];
  sales = new Map<string, number>();

  /** Mirrors seedThreeYearSampleDesk's writes, minus Prisma. */
  seed() {
    this.rows = [];
    this.sales = new Map();
    for (const day of buildThreeYearSampleDesk({
      now: new Date("2026-08-26T12:00:00Z"),
      years: 1,
    })) {
      const dateKey = day.day.toISOString().slice(0, 10);
      this.sales.set(dateKey, day.sales);
      for (const [channel, amount] of Object.entries(day.spendByChannel)) {
        if (!((amount ?? 0) > 0)) continue;
        this.rows.push({
          dateKey,
          channel,
          customKey: "",
          note: "sample:v2",
          amount: amount as number,
        });
      }
      for (const extra of day.namedExtras) {
        this.rows.push({
          dateKey,
          channel: "other",
          customKey: extra.slug,
          note: extra.label,
          amount: extra.amount,
        });
      }
    }
  }

  /** Mirrors buildDailyRowsForWindow: slice keys plus merchant-facing names. */
  dailyRows(fromKey: string, toKey: string) {
    const byDay = new Map<string, Map<string, number>>();
    const channelLabels: Record<string, string> = {};
    for (const row of this.rows) {
      if (row.dateKey < fromKey || row.dateKey > toKey) continue;
      const bucket = spendBucketKey(row.channel, row.customKey);
      if (bucket !== row.channel) {
        channelLabels[bucket] = spendChannelLabel({
          channel: row.channel,
          customLabel: row.note ?? row.customKey,
        });
      }
      const day = byDay.get(row.dateKey) ?? new Map<string, number>();
      day.set(bucket, (day.get(bucket) ?? 0) + row.amount);
      byDay.set(row.dateKey, day);
    }
    const rows: ExplorerDailyRow[] = [];
    for (const [dateKey, sales] of this.sales) {
      if (dateKey < fromKey || dateKey > toKey) continue;
      const channels = [...(byDay.get(dateKey) ?? new Map())].map(
        ([channel, amount]) => ({ channel, amount: amount as number }),
      );
      rows.push({
        dateKey,
        sales,
        spend: channels.reduce((s, c) => s + c.amount, 0),
        channels,
      });
    }
    rows.sort((a, b) => a.dateKey.localeCompare(b.dateKey));
    return { rows: fillExplorerDayHoles(rows, fromKey, toKey), channelLabels };
  }
}

const FROM = "2026-08-02";
const TO = "2026-08-26";

/** One Spend loader pass over a stale Sample shop. */
async function spendLoaderPass(opts: {
  store: SampleStore;
  stale: { value: boolean };
  awaitHeal: boolean;
  seedSpy: ReturnType<typeof vi.fn>;
  needsSeedSpy: ReturnType<typeof vi.fn>;
}) {
  const deps = {
    needsSeed: opts.needsSeedSpy as unknown as (
      shopId: string,
    ) => Promise<boolean>,
    seed: opts.seedSpy as unknown as (
      shopId: string,
      targetMer: number,
    ) => Promise<unknown>,
  };
  const heal = ensureSampleDeskSeeded(
    `shop-${Math.random()}`,
    4.4,
    deps,
  );
  if (opts.awaitHeal) await heal;

  const { rows, channelLabels } = opts.store.dailyRows(FROM, TO);
  const buckets = applyExplorerMode(bucketExplorerRows(rows, "Day"), "stacked");
  return {
    legend: explorerLegendChannels(buckets, "stacked"),
    channelLabels,
    buckets,
    heal,
  };
}

function harness() {
  const store = new SampleStore();
  const stale = { value: true };
  const needsSeedSpy = vi.fn(async () => stale.value);
  const seedSpy = vi.fn(async () => {
    // A real seed is a transaction; make the test await something real.
    await new Promise((r) => setTimeout(r, 0));
    store.seed();
    stale.value = false;
  });
  return { store, stale, needsSeedSpy, seedSpy };
}

describe("Spend Sample loader, first paint", () => {
  it("puts other:billboard in the legend on one request, no refresh", async () => {
    const h = harness();
    const out = await spendLoaderPass({ ...h, awaitHeal: true });

    expect(h.needsSeedSpy).toHaveBeenCalledTimes(1);
    expect(h.seedSpy).toHaveBeenCalledTimes(1);
    // The thing the founder could not see on first load.
    expect(out.legend).toContain("other:billboard");
    expect(out.channelLabels["other:billboard"]).toBe("Billboard");
    expect(out.legend.indexOf("other:billboard")).toBeLessThanOrEqual(2);
    expect(out.legend.length).toBeLessThanOrEqual(7);
    // And the $0 holes the caption promises.
    expect(out.buckets.filter((b) => b.spend === 0).length).toBeGreaterThan(0);
  });

  it("would have missed it if the paint did not await the heal", async () => {
    // Proves the assertion above has teeth: this is the v162 behaviour.
    const h = harness();
    const out = await spendLoaderPass({ ...h, awaitHeal: false });
    expect(out.legend).not.toContain("other:billboard");
    expect(out.legend).toHaveLength(0);
    await out.heal;
  });

  it("does not re-seed a shop that is already current", async () => {
    const h = harness();
    await spendLoaderPass({ ...h, awaitHeal: true });
    h.needsSeedSpy.mockClear();
    h.seedSpy.mockClear();

    const second = await spendLoaderPass({ ...h, awaitHeal: true });
    expect(h.needsSeedSpy).toHaveBeenCalledTimes(1);
    expect(h.seedSpy).not.toHaveBeenCalled();
    expect(second.legend).toContain("other:billboard");
  });

  it("shares one seed between concurrent paints of the same shop", async () => {
    const h = harness();
    const deps = {
      needsSeed: h.needsSeedSpy as unknown as (s: string) => Promise<boolean>,
      seed: h.seedSpy as unknown as (s: string, m: number) => Promise<unknown>,
    };
    const shopId = "shop-concurrent";
    const [a, b, c] = await Promise.all([
      ensureSampleDeskSeeded(shopId, 4.4, deps),
      ensureSampleDeskSeeded(shopId, 4.4, deps),
      ensureSampleDeskSeeded(shopId, 4.4, deps),
    ]);
    expect([a, b, c]).toEqual([true, true, true]);
    expect(h.seedSpy).toHaveBeenCalledTimes(1);
  });

  it("never takes the desk down when seeding fails", async () => {
    const seeded = await ensureSampleDeskSeeded("shop-broken", 4.4, {
      needsSeed: async () => true,
      seed: async () => {
        throw new Error("database is on fire");
      },
    });
    expect(seeded).toBe(false);
  });
});

describe("Loaders await the heal before reading Sample", () => {
  const beforeRead: Array<[string, string]> = [
    ["../routes/app._index.tsx", "await buildSpendExplorerSeries("],
    ["../routes/app.spend.tsx", "await buildSpendExplorerSeries("],
    ["../routes/app.allocation.tsx", "await buildDailyRowsForWindow("],
  ];

  for (const [route, readCall] of beforeRead) {
    it(`${route} seeds before it reads sample spend`, () => {
      const src = read(route);
      const healAt = src.indexOf("await ensureSampleDeskSeeded(");
      const readAt = src.indexOf(readCall);
      expect(healAt, `${route} awaits the heal`).toBeGreaterThan(-1);
      expect(readAt, `${route} reads spend`).toBeGreaterThan(-1);
      expect(healAt, `${route} order`).toBeLessThan(readAt);
      // A bare `void`/fire-and-forget call would race the paint again.
      expect(src).not.toMatch(/ensureSampleDeskFresh/);
      expect(src).not.toMatch(/void ensureSampleDeskSeeded/);
    });
  }
});
