import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  aggregateOrderRows,
  assembleOrdersIntelligence,
  buildOrdersAovTiers,
  buildOrdersCodeMoney,
  buildOrdersFrequency,
  buildOrdersIntelDays,
  buildOrdersIntelKpis,
  buildOrdersWeeklyRows,
  ordersCodeTookLabel,
  ordersIntelDelta,
  ordersIntelPeriodBadge,
  ordersIntelWindowLabel,
  ordersMonthBoardSentence,
  ordersReturnDrag,
  type OrderIntelRow,
} from "./orders-intelligence";

const here = dirname(fileURLToPath(import.meta.url));

function row(
  day: string,
  amount: number,
  customerKey: string,
  discount = 0,
): OrderIntelRow {
  const at = new Date(`${day}T12:00:00Z`);
  return {
    customerKey,
    amount,
    discountAmount: discount,
    orderedAt: at,
    shopLocalDate: new Date(`${day}T00:00:00Z`),
  };
}

/** Two closed days: c1 is new+returning, c2 new, one guest. */
function sampleRows(): OrderIntelRow[] {
  return [
    row("2026-09-07", 600, "sample:c1", 0),
    row("2026-09-07", 700, "sample:c2", 100),
    row("2026-09-08", 500, "sample:c1", 0),
    row("2026-09-08", 640, "guest", 0),
  ];
}

describe("orders intelligence aggregate", () => {
  it("totals orders, sales, AOV, and the discount depth (Σ discount ÷ gross)", () => {
    const agg = aggregateOrderRows(sampleRows());
    expect(agg.orders).toBe(4);
    expect(agg.sales).toBe(2440);
    expect(agg.aov).toBe(610);
    // gross = sales + discounts = 2440 + 100 = 2540 → 100/2540
    expect(agg.discountDepth).toBeCloseTo(100 / 2540, 5);
  });

  it("splits new vs returning by first identified order in the window", () => {
    const agg = aggregateOrderRows(sampleRows());
    // c1 first (9/7) = new, c1 (9/8) = returning, c2 = new. Guest excluded.
    expect(agg.newOrders).toBe(2);
    expect(agg.returningOrders).toBe(1);
    // new sales = c1 600 + c2 700 = 1300 of 2440 total
    expect(agg.newSalesShare).toBeCloseTo(1300 / 2440, 5);
  });

  it("buckets the daily series with per-day AOV", () => {
    const days = buildOrdersIntelDays(sampleRows());
    expect(days.map((d) => d.dateKey)).toEqual(["2026-09-07", "2026-09-08"]);
    expect(days[0]).toMatchObject({ orders: 2, sales: 1300, aov: 650 });
    expect(days[1]).toMatchObject({ orders: 2, sales: 1140, aov: 570 });
  });
});

describe("orders intelligence KPIs", () => {
  it("shows vs-prior deltas on orders, sales, and AOV", () => {
    const current = aggregateOrderRows(sampleRows());
    const prior = aggregateOrderRows([
      row("2026-06-09", 500, "sample:x1"),
      row("2026-06-10", 500, "sample:x2"),
    ]);
    const kpis = buildOrdersIntelKpis(current, prior, "USD");
    const byKey = Object.fromEntries(kpis.map((k) => [k.key, k]));
    expect(byKey.orders?.value).toBe("4");
    expect(byKey.orders?.delta?.dir).toBe("up");
    expect(byKey.sales?.value).toBe("$2,440");
    expect(byKey.aov?.value).toBe("$610");
    expect(byKey.newShare?.sub).toMatch(/new/);
    expect(byKey.newShare?.sub).toMatch(/returning/);
    expect(byKey.discount?.sub).toMatch(/gross/);
    // New share and discount depth carry no vs-prior delta (match the ref).
    expect(byKey.newShare?.delta).toBeUndefined();
    expect(byKey.discount?.delta).toBeUndefined();
  });

  it("does not paint a missing lifetime as zero new orders", () => {
    const current = aggregateOrderRows(
      [
        {
          ...row("2026-09-08", 70, "unsure"),
          lifetimeOrders: null,
          discountCode: "BUNDLE",
        },
      ],
      [
        {
          ...row("2026-09-08", 70, "unsure"),
          lifetimeOrders: null,
          discountCode: "BUNDLE",
        },
      ],
    );
    const kpis = buildOrdersIntelKpis(current, null, "USD");
    const share = kpis.find((kpi) => kpi.key === "newShare");
    expect(share?.value).toBe("—");
    expect(share?.sub).toBe("New versus already-bought is unknown");
    expect(share?.sub).not.toMatch(/0 new/);
  });

  it("drops deltas when there is no complete prior window", () => {
    const current = aggregateOrderRows(sampleRows());
    const kpis = buildOrdersIntelKpis(current, null, "USD");
    for (const kpi of kpis) expect(kpi.delta).toBeUndefined();
  });

  it("delta direction is up / down / flat with a guard on zero prior", () => {
    expect(ordersIntelDelta(110, 100)?.dir).toBe("up");
    expect(ordersIntelDelta(90, 100)?.dir).toBe("down");
    expect(ordersIntelDelta(100, 100)?.dir).toBe("flat");
    expect(ordersIntelDelta(100, 0)).toBeNull();
  });
});

describe("orders weekly ledger", () => {
  it("buckets rows into Monday-start weeks with AOV, discount depth, and trend", () => {
    const rows: OrderIntelRow[] = [
      // Week of Mon 2026-09-07
      row("2026-09-07", 600, "a", 0),
      row("2026-09-08", 800, "b", 200),
      // Week of Mon 2026-09-14
      row("2026-09-14", 500, "c", 0),
    ];
    const weeks = buildOrdersWeeklyRows(rows);
    expect(weeks.map((w) => w.weekKey)).toEqual(["2026-09-07", "2026-09-14"]);
    expect(weeks[0]).toMatchObject({ orders: 2, sales: 1400, aov: 700 });
    // discount depth wk1 = 200 / (1400 + 200)
    expect(weeks[0]!.discountDepth).toBeCloseTo(200 / 1600, 5);
    expect(weeks[0]!.ordersDelta).toBeNull();
    // wk2 orders 1 vs wk1 orders 2 → down
    expect(weeks[1]!.ordersDelta?.dir).toBe("down");
    expect(weeks[1]!.label).toMatch(/Wk of Sep 14/);
    expect(weeks[0]!.codeDollars).toBeNull();
    expect(weeks[0]!.returnsDrag).toBeNull();
  });

  it("names the code's dollars and whether returns are climbing", () => {
    const rows: OrderIntelRow[] = [
      {
        ...row("2026-09-07", 500, "a", 40),
        discountCode: "WELCOME10",
        grossAmount: 500,
        lifetimeOrders: 1,
      },
      {
        ...row("2026-09-14", 80, "b", 0),
        discountCode: "POWDER15",
        grossAmount: 130,
        lifetimeOrders: 1,
      },
    ];
    const weeks = buildOrdersWeeklyRows(rows);
    expect(weeks[0]!.codeLines).toEqual([{ code: "WELCOME10", sales: 500 }]);
    expect(weeks[0]!.codeDollars).toBe(500);
    expect(weeks[0]!.returnsDrag).toBe(0);
    expect(weeks[0]!.returnsClimbing).toBeNull();
    expect(weeks[1]!.returnsDrag).toBe(50);
    expect(weeks[1]!.returnsClimbing).toBe("climbing");
    expect(ordersCodeTookLabel("WELCOME10", 500, "USD")).toBe("WELCOME10 $500");
    expect(ordersCodeTookLabel("WELCOME10", 500, "USD")).not.toMatch(/%/);
    expect(weeks[0]!.discountDepth).not.toBeCloseTo(0.1, 2);
  });

  it("keeps a missing code and a missing return as unknown, never $0", () => {
    const rows: OrderIntelRow[] = [
      { ...row("2026-09-07", 500, "a", 0), discountCode: null, grossAmount: null },
      { ...row("2026-09-14", 80, "b", 0), discountCode: "  ", grossAmount: null },
    ];
    const weeks = buildOrdersWeeklyRows(rows);
    expect(weeks[0]!.codeDollars).toBeNull();
    expect(weeks[0]!.codeLines).toEqual([]);
    expect(weeks[1]!.codeDollars).toBeNull();
    expect(ordersReturnDrag(rows)).toBeNull();
    expect(weeks.every((week) => week.returnsDrag == null)).toBe(true);
  });
});

describe("orders AOV tiers", () => {
  it("is empty below 8 orders", () => {
    const rows = Array.from({ length: 5 }, (_, i) =>
      row("2026-09-01", 600 + i, `c${i}`),
    );
    expect(buildOrdersAovTiers(rows)).toEqual([]);
  });

  it("spreads orders across nice-rounded bands that sum to 100%", () => {
    // Snowdevil-like spread $520–$700.
    const rows = Array.from({ length: 60 }, (_, i) =>
      row("2026-09-01", 520 + (i % 19) * 10, `c${i}`),
    );
    const tiers = buildOrdersAovTiers(rows);
    expect(tiers.length).toBe(5);
    expect(tiers.reduce((s, t) => s + t.orders, 0)).toBe(60);
    expect(tiers.reduce((s, t) => s + t.orderShare, 0)).toBeCloseTo(1, 5);
    expect(tiers.reduce((s, t) => s + t.salesShare, 0)).toBeCloseTo(1, 5);
    // First band opens below, last band opens above; edges strictly increase.
    expect(tiers[0]!.lo).toBeNull();
    expect(tiers[tiers.length - 1]!.hi).toBeNull();
    const edges = tiers.slice(1).map((t) => t.lo!);
    for (let i = 1; i < edges.length; i += 1) {
      expect(edges[i]!).toBeGreaterThan(edges[i - 1]!);
    }
    // At least three bands carry orders — a real distribution, not one blob.
    expect(tiers.filter((t) => t.orders > 0).length).toBeGreaterThanOrEqual(3);
  });
});

describe("orders frequency distribution", () => {
  it("buckets identified customers by order count and excludes guests", () => {
    const rows: OrderIntelRow[] = [
      row("2026-09-01", 600, "sample:a"),
      row("2026-09-02", 600, "sample:b"),
      row("2026-09-03", 600, "sample:b"),
      row("2026-09-04", 600, "sample:c"),
      row("2026-09-05", 600, "sample:c"),
      row("2026-09-06", 600, "sample:c"),
      row("2026-09-07", 600, "guest"),
    ];
    const freq = buildOrdersFrequency(rows);
    const byKey = Object.fromEntries(freq.map((b) => [b.key, b.customers]));
    expect(byKey["1"]).toBe(1);
    expect(byKey["2"]).toBe(1);
    expect(byKey["3"]).toBe(1);
    // no customer has 4+ → those buckets are dropped
    expect(freq.some((b) => b.key === "4")).toBe(false);
    expect(freq.every((b) => b.customers > 0)).toBe(true);
  });

  it("uses stored lifetime instead of one order in the slice", () => {
    const period: OrderIntelRow[] = [
      { ...row("2026-09-08", 80, "quiet"), lifetimeOrders: 6 },
      { ...row("2026-09-08", 40, "fresh"), lifetimeOrders: 1 },
    ];
    const book: OrderIntelRow[] = [
      { ...row("2026-03-01", 55, "quiet"), lifetimeOrders: 6 },
      ...period,
    ];
    const freq = buildOrdersFrequency(period, book);
    const byKey = Object.fromEntries(freq.map((b) => [b.key, b.customers]));
    expect(byKey["1"]).toBe(1);
    expect(byKey["5-9"]).toBe(1);
    expect(byKey["unknown"]).toBeUndefined();
  });

  it("keeps a missing lifetime unknown instead of a one-order buyer", () => {
    const rows: OrderIntelRow[] = [
      { ...row("2026-09-08", 80, "unsure"), lifetimeOrders: null },
      { ...row("2026-09-08", 40, "fresh"), lifetimeOrders: 1 },
    ];
    const freq = buildOrdersFrequency(rows);
    const byKey = Object.fromEntries(freq.map((b) => [b.key, b.customers]));
    expect(byKey["1"]).toBe(1);
    expect(byKey["unknown"]).toBe(1);
    expect(freq.find((b) => b.key === "unknown")?.label).toBe("Lifetime unknown");
  });
});

describe("orders code money for the selected month", () => {
  it("treats an earlier stored order as already bought and leaves guests out", () => {
    const earlier: OrderIntelRow = {
      ...row("2026-03-02", 55, "quiet"),
      lifetimeOrders: 2,
    };
    const again: OrderIntelRow = {
      ...row("2026-09-08", 80, "quiet", 8),
      discountCode: "WELCOME10",
      grossAmount: 80,
      lifetimeOrders: 2,
    };
    const fresh: OrderIntelRow = {
      ...row("2026-09-09", 40, "fresh", 4),
      discountCode: "WELCOME10",
      grossAmount: 40,
      lifetimeOrders: 1,
    };
    const guest: OrderIntelRow = {
      ...row("2026-09-09", 25, "guest", 0),
      discountCode: "WELCOME10",
      grossAmount: 25,
      lifetimeOrders: null,
    };
    const codes = buildOrdersCodeMoney([again, fresh, guest], [earlier, again, fresh, guest]);
    expect(codes).toHaveLength(1);
    expect(codes[0]).toMatchObject({
      code: "WELCOME10",
      sales: 145,
      newSales: 40,
      returningSales: 80,
      unknownSales: null,
      guestSales: 25,
    });
  });

  it("keeps a missing lifetime unknown and never a fake zero", () => {
    const rows: OrderIntelRow[] = [
      {
        ...row("2026-09-08", 70, "unsure"),
        discountCode: "BUNDLE",
        lifetimeOrders: null,
        grossAmount: 70,
      },
    ];
    const codes = buildOrdersCodeMoney(rows);
    expect(codes[0]).toMatchObject({
      sales: 70,
      newSales: null,
      returningSales: null,
      unknownSales: 70,
    });
  });

  it("does not read WELCOME10 as 10%", () => {
    const rows: OrderIntelRow[] = [
      {
        ...row("2026-09-07", 500, "a", 40),
        discountCode: "WELCOME10",
        grossAmount: 540,
        lifetimeOrders: 1,
      },
      {
        ...row("2026-09-14", 200, "a", 0),
        grossAmount: 260,
        lifetimeOrders: 2,
      },
    ];
    const prior: OrderIntelRow[] = [
      {
        ...row("2026-08-03", 200, "z"),
        grossAmount: 200,
        lifetimeOrders: 1,
      },
    ];
    const sentence = ordersMonthBoardSentence({
      periodLabel: "Month to date",
      codes: buildOrdersCodeMoney(rows),
      returnsDrag: ordersReturnDrag(rows),
      priorReturnsDrag: ordersReturnDrag(prior),
      currency: "USD",
    });
    expect(sentence).toBe(
      "Month to date — WELCOME10 took $500 ($500 from new buyers). Returns are climbing.",
    );
    expect(sentence).not.toMatch(/10%/);
    expect(sentence).not.toMatch(/\$0/);
    expect(sentence).not.toContain("0×");
    expect(sentence).not.toMatch(/\d+×/);
  });

  it("says when the selected month has no code and no return dollars", () => {
    const sentence = ordersMonthBoardSentence({
      periodLabel: "Month to date",
      codes: [],
      returnsDrag: null,
      priorReturnsDrag: null,
      currency: "USD",
    });
    expect(sentence).toBe(
      "Month to date — no discount code on these orders. Return dollars are not on these orders.",
    );
    expect(sentence).not.toContain("90");
    expect(sentence).not.toMatch(/\$0/);
  });

  it("follows the selected period instead of a trailing 90-day caption", () => {
    const days = buildOrdersIntelDays([
      row("2026-09-02", 100, "a"),
      row("2026-09-18", 100, "b"),
    ]);
    expect(ordersIntelWindowLabel(days, "Month to date")).toBe(
      "Sep 2 → Sep 18 · Month to date",
    );
    expect(ordersIntelWindowLabel(days, "Month to date")).not.toMatch(/90/);
    expect(ordersIntelPeriodBadge("mtd")).toBe("MTD");
    expect(ordersIntelPeriodBadge("lm")).toBe("Last mo");
    expect(ordersIntelPeriodBadge("l12m")).not.toBe("90d");
    const intel = assembleOrdersIntelligence({
      rows: [row("2026-09-08", 80, "a"), row("2026-09-15", 40, "b")],
      priorRows: [],
      orderBook: [row("2026-09-08", 80, "a"), row("2026-09-15", 40, "b")],
      periodLabel: "Month to date",
      badge: ordersIntelPeriodBadge("mtd"),
    });
    expect(intel?.badge).toBe("MTD");
    expect(intel?.windowLabel).toContain("Month to date");
    expect(intel?.windowLabel).not.toMatch(/trailing 90/i);
    expect(intel?.days).toHaveLength(2);
  });
});

describe("orders month board wiring", () => {
  it("loads the selected period on the admin desk and mounts the same stack on demo", () => {
    const desk = readFileSync(join(here, "desk-sales-page.server.ts"), "utf8");
    const demo = readFileSync(join(here, "../routes/demo.orders.tsx"), "utf8");
    const board = readFileSync(join(here, "../components/OrdersIntelligence.tsx"), "utf8");
    expect(desk).toContain("resolvePeriod");
    expect(desk).toContain("resolvePriorPeriod");
    expect(desk).toContain("assembleOrdersIntelligence");
    expect(desk).not.toContain("ORDERS_INTEL_WINDOW_DAYS");
    expect(desk).not.toContain("trailing 90");
    expect(demo).toContain("<OrdersIntelligence");
    expect(demo).toContain("<OrdersFrequencyChart");
    expect(demo).toContain("assembleOrdersIntelligence");
    expect(demo).toContain("resolvePeriod");
    expect(board).toContain("{intel.badge}");
    expect(board).toContain("ordersMonthBoardSentence");
    expect(board).not.toContain(">90d<");
    expect(board).toContain("Codes");
    expect(board).toContain("Returns");
  });
});
