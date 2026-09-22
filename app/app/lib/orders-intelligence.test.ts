import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { ORDER_STEP_MIN_BUYERS } from "./customers-analytics";
import {
  aggregateOrderRows,
  assembleOrdersIntelligence,
  buildOrdersAovTiers,
  buildOrdersCheckoutDiscount,
  buildOrdersCodeMoney,
  buildOrdersConcentration,
  buildOrdersDollarsPerUnit,
  buildOrdersFrequency,
  buildOrdersIntelDays,
  buildOrdersIntelKpis,
  buildOrdersKeptShare,
  buildOrdersPeriodTickets,
  buildOrdersStepMix,
  buildOrdersTimingSplit,
  buildOrdersWeeklyRows,
  buildOrdersYearDiscount,
  buildOrdersZeroAmountOrders,
  ordersCodeTookLabel,
  ordersIntelDelta,
  ordersIntelPeriodBadge,
  ordersIntelWindowLabel,
  ordersMonthBoardSentence,
  ordersPaintStepSales,
  ordersReturnDrag,
  ORDERS_TICKET_BASIS,
  type OrderIntelRow,
} from "./orders-intelligence";
import { HOUR_STATS_MIN_ORDERS } from "./shopify-depth-stats";

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

function lifetimeRow(
  day: string,
  amount: number,
  customerKey: string,
  lifetimeOrders: number | null,
  extra: Partial<OrderIntelRow> = {},
): OrderIntelRow {
  return { ...row(day, amount, customerKey), lifetimeOrders, ...extra };
}

function nBuyers(opts: {
  n: number;
  prefix: string;
  day: string;
  amount: number;
  lifetime: number | null;
  extra?: Partial<OrderIntelRow>;
}): OrderIntelRow[] {
  return Array.from({ length: opts.n }, (_, i) =>
    lifetimeRow(
      opts.day,
      opts.amount,
      `${opts.prefix}${i}`,
      opts.lifetime,
      opts.extra,
    ),
  );
}

/** Period order at `lifetime`, plus one earlier stored order so the book can number it. */
function nReturning(opts: {
  n: number;
  prefix: string;
  periodDay: string;
  priorDay: string;
  amount: number;
  lifetime: number;
  extra?: Partial<OrderIntelRow>;
}): { period: OrderIntelRow[]; book: OrderIntelRow[] } {
  const period: OrderIntelRow[] = [];
  const book: OrderIntelRow[] = [];
  for (let i = 0; i < opts.n; i += 1) {
    const key = `${opts.prefix}${i}`;
    const prior = lifetimeRow(opts.priorDay, 40, key, opts.lifetime);
    const current = lifetimeRow(
      opts.periodDay,
      opts.amount,
      key,
      opts.lifetime,
      opts.extra,
    );
    period.push(current);
    book.push(prior, current);
  }
  return { period, book };
}

describe("orders step mix — this period’s dollars by 1st / 2nd / 3rd / 4th+", () => {
  it("keeps the same 8-buyer floor as Growth wait columns, without painting wait", () => {
    expect(ORDER_STEP_MIN_BUYERS).toBe(8);
    const mix = buildOrdersStepMix([], []);
    expect(mix.map((bar) => bar.id)).toEqual([
      "first",
      "second",
      "third",
      "fourthPlus",
    ]);
    expect(mix.map((bar) => bar.label)).toEqual(["1st", "2nd", "3rd", "4th+"]);
    expect(mix.every((bar) => bar.sales == null && !bar.sealed)).toBe(true);
  });

  it("sums Shopify Total Sales per step and seals at 8 identified buyers", () => {
    const first = nBuyers({
      n: 8,
      prefix: "new-",
      day: "2026-09-08",
      amount: 100,
      lifetime: 1,
    });
    const second = nReturning({
      n: 8,
      prefix: "two-",
      periodDay: "2026-09-08",
      priorDay: "2026-03-01",
      amount: 200,
      lifetime: 2,
    });
    const third = nReturning({
      n: 8,
      prefix: "three-",
      periodDay: "2026-09-08",
      priorDay: "2026-03-01",
      amount: 300,
      lifetime: 3,
    });
    const later = nReturning({
      n: 8,
      prefix: "four-",
      periodDay: "2026-09-08",
      priorDay: "2026-03-01",
      amount: 400,
      lifetime: 5,
    });
    const guest = lifetimeRow("2026-09-08", 9999, "guest", null);
    const period = [...first, ...second.period, ...third.period, ...later.period, guest];
    const book = [...first, ...second.book, ...third.book, ...later.book, guest];
    const mix = Object.fromEntries(
      buildOrdersStepMix(period, book).map((bar) => [bar.id, bar]),
    );
    expect(mix.first).toMatchObject({ sales: 800, buyers: 8, sealed: true });
    expect(mix.second).toMatchObject({ sales: 1600, buyers: 8, sealed: true });
    expect(mix.third).toMatchObject({ sales: 2400, buyers: 8, sealed: true });
    expect(mix.fourthPlus).toMatchObject({ sales: 3200, buyers: 8, sealed: true });
    expect(ordersPaintStepSales(mix.first!, "USD")).toBe("$800");
    expect(mix.first!.sales).not.toBe(9999);
  });

  it("leaves a step — under 8 identified buyers, never a 7-buyer total", () => {
    const thin = nBuyers({
      n: 7,
      prefix: "thin-",
      day: "2026-09-08",
      amount: 500,
      lifetime: 1,
    });
    const mix = buildOrdersStepMix(thin, thin);
    expect(mix.find((bar) => bar.id === "first")).toMatchObject({
      buyers: 7,
      sales: null,
      sealed: false,
    });
    expect(ordersPaintStepSales(mix.find((bar) => bar.id === "first")!, "USD")).toBe(
      "—",
    );
  });

  it("never stuffs unknown lifetime into 1st — own bar or —", () => {
    const unknown = nBuyers({
      n: 8,
      prefix: "unsure-",
      day: "2026-09-08",
      amount: 70,
      lifetime: null,
    });
    const fresh = nBuyers({
      n: 8,
      prefix: "fresh-",
      day: "2026-09-08",
      amount: 40,
      lifetime: 1,
    });
    const mix = buildOrdersStepMix([...unknown, ...fresh], [...unknown, ...fresh]);
    const byId = Object.fromEntries(mix.map((bar) => [bar.id, bar]));
    expect(byId.first).toMatchObject({ sales: 320, buyers: 8, sealed: true });
    expect(byId.unknown).toMatchObject({ sales: 560, buyers: 8, sealed: true });
    expect(byId.first!.sales).not.toBe(880);
  });

  it("treats a lifetime above the stored book as 4th+, not a first order", () => {
    const rows = nBuyers({
      n: 8,
      prefix: "quiet-",
      day: "2026-09-08",
      amount: 80,
      lifetime: 6,
    });
    const mix = buildOrdersStepMix(rows, rows);
    const byId = Object.fromEntries(mix.map((bar) => [bar.id, bar]));
    expect(byId.first).toMatchObject({ sales: null, buyers: 0, sealed: false });
    expect(byId.fourthPlus).toMatchObject({ sales: 640, buyers: 8, sealed: true });
  });
});

describe("orders first-time vs returning ticket", () => {
  it("splits Shopify Total Sales per order — not one blended AOV", () => {
    const first = nBuyers({
      n: 8,
      prefix: "new-",
      day: "2026-09-08",
      amount: 100,
      lifetime: 1,
    });
    const returning = nReturning({
      n: 8,
      prefix: "back-",
      periodDay: "2026-09-08",
      priorDay: "2026-03-01",
      amount: 250,
      lifetime: 2,
    });
    const tickets = buildOrdersPeriodTickets(
      [...first, ...returning.period],
      [...first, ...returning.book],
    );
    expect(tickets.firstTimeTicket).toBe(100);
    expect(tickets.returningTicket).toBe(250);
    expect(ORDERS_TICKET_BASIS).toBe("Shopify Total Sales per order");
    expect(ORDERS_TICKET_BASIS).not.toMatch(/AOV/i);
  });

  it("keeps unknown lifetime and guests out of both tickets", () => {
    const first = nBuyers({
      n: 8,
      prefix: "new-",
      day: "2026-09-08",
      amount: 100,
      lifetime: 1,
    });
    const unknown = lifetimeRow("2026-09-08", 900, "unsure", null);
    const guest = lifetimeRow("2026-09-08", 800, "guest", 1);
    const tickets = buildOrdersPeriodTickets(
      [...first, unknown, guest],
      [...first, unknown, guest],
    );
    expect(tickets.firstTimeTicket).toBe(100);
    expect(tickets.returningTicket).toBeNull();
  });

  it("dashes a ticket under 8 identified buyers", () => {
    const first = nBuyers({
      n: 7,
      prefix: "new-",
      day: "2026-09-08",
      amount: 100,
      lifetime: 1,
    });
    expect(buildOrdersPeriodTickets(first, first).firstTimeTicket).toBeNull();
  });
});

describe("orders period concentration", () => {
  it("counts identified buyers who made 50% of period sales, and top-decile share", () => {
    const whale = nBuyers({
      n: 1,
      prefix: "whale-",
      day: "2026-09-08",
      amount: 1000,
      lifetime: 1,
    });
    const rest = nBuyers({
      n: 9,
      prefix: "rest-",
      day: "2026-09-08",
      amount: 100,
      lifetime: 1,
    });
    const guest = lifetimeRow("2026-09-08", 5000, "guest", 1);
    const conc = buildOrdersConcentration([...whale, ...rest, guest]);
    expect(conc.identifiedBuyers).toBe(10);
    expect(conc.buyersForHalf).toBe(1);
    expect(conc.topDecileShare).toBeCloseTo(1000 / 1900, 5);
  });

  it("dashes under 8 identified buyers — guests do not fill the floor", () => {
    const thin = nBuyers({
      n: 7,
      prefix: "thin-",
      day: "2026-09-08",
      amount: 100,
      lifetime: 1,
    });
    const guests = Array.from({ length: 20 }, (_, i) =>
      lifetimeRow("2026-09-08", 50, "guest", 1, {
        customerKey: i === 0 ? "guest" : "guest",
      }),
    );
    const conc = buildOrdersConcentration([...thin, ...guests]);
    expect(conc.identifiedBuyers).toBe(7);
    expect(conc.buyersForHalf).toBeNull();
    expect(conc.topDecileShare).toBeNull();
  });
});

describe("orders first-time vs already-bought timing", () => {
  it("stacks weekday shares after the same 5-day gate and leaves guests out of returning", () => {
    const first: OrderIntelRow[] = [];
    const returningBook: OrderIntelRow[] = [];
    for (let d = 1; d <= 5; d += 1) {
      const day = `2026-09-0${d}`;
      first.push(
        ...nBuyers({
          n: 2,
          prefix: `f${d}-`,
          day,
          amount: 100,
          lifetime: 1,
        }),
      );
      const back = nReturning({
        n: 2,
        prefix: `r${d}-`,
        periodDay: day,
        priorDay: "2026-03-01",
        amount: 50,
        lifetime: 2,
      });
      first.push(...back.period);
      returningBook.push(...back.book);
    }
    const guest = lifetimeRow("2026-09-01", 9000, "guest", 4);
    const period = [...first, guest];
    const book = [...first, ...returningBook, guest];
    const split = buildOrdersTimingSplit(period, book, { timeZone: "UTC" });
    expect(split.weekday.first).not.toBeNull();
    expect(split.weekday.returning).not.toBeNull();
    expect(split.weekday.returning!.some((share) => share > 0)).toBe(true);
    expect(split.weekday.first!.reduce((s, n) => s + n, 0)).toBeCloseTo(1, 5);
  });

  it("does not paint unknown lifetime as new, and withholds hour before the 20-order gate", () => {
    const days: OrderIntelRow[] = [];
    for (let d = 1; d <= 5; d += 1) {
      days.push(
        lifetimeRow(`2026-09-0${d}`, 40, `unsure-${d}`, null),
        lifetimeRow(`2026-09-0${d}`, 80, `fresh-${d}`, 1),
      );
    }
    const split = buildOrdersTimingSplit(days, days, { timeZone: "UTC" });
    expect(split.weekday.first).not.toBeNull();
    const firstShare = split.weekday.first!.reduce((s, n) => s + n, 0);
    expect(firstShare).toBeCloseTo(1, 5);
    expect(split.hourly.first).toBeNull();
    expect(HOUR_STATS_MIN_ORDERS).toBe(20);
  });

  it("withholds weekday split until five days have sales", () => {
    const rows = [
      ...nBuyers({ n: 4, prefix: "a-", day: "2026-09-01", amount: 50, lifetime: 1 }),
      ...nBuyers({ n: 4, prefix: "b-", day: "2026-09-02", amount: 50, lifetime: 1 }),
    ];
    const split = buildOrdersTimingSplit(rows, rows, { timeZone: "UTC" });
    expect(split.weekday.first).toBeNull();
    expect(split.weekday.returning).toBeNull();
  });
});

describe("orders same-month-last-year discount and placed-day kept share", () => {
  it("names last year’s discount dollars and depth, and keeps WELCOME10 as a name", () => {
    const current = nBuyers({
      n: 8,
      prefix: "now-",
      day: "2026-09-08",
      amount: 90,
      lifetime: 1,
      extra: { discountAmount: 10, discountCode: "WELCOME10", grossAmount: 100 },
    });
    const lastYear = nBuyers({
      n: 8,
      prefix: "ly-",
      day: "2025-09-08",
      amount: 96,
      lifetime: 1,
      extra: { discountAmount: 4, discountCode: "WELCOME10", grossAmount: 100 },
    });
    const yoy = buildOrdersYearDiscount(current, lastYear);
    expect(yoy.currentDollars).toBe(80);
    expect(yoy.lastYearDollars).toBe(32);
    expect(yoy.currentDepth).toBeCloseTo(80 / 800, 5);
    expect(yoy.lastYearDepth).toBeCloseTo(32 / 800, 5);
    expect(yoy.codes.map((line) => line.code)).toEqual(["WELCOME10"]);
    expect(yoy.codes[0]!.code).not.toMatch(/%/);
  });

  it("dashes last year when that month is missing, and never a partial 0%", () => {
    const current = nBuyers({
      n: 3,
      prefix: "now-",
      day: "2026-09-08",
      amount: 90,
      lifetime: 1,
      extra: { discountAmount: 10, grossAmount: 100 },
    });
    const yoy = buildOrdersYearDiscount(current, []);
    expect(yoy.lastYearDollars).toBeNull();
    expect(yoy.lastYearDepth).toBeNull();
    const missingGross = [
      lifetimeRow("2026-09-08", 90, "a", 1, { grossAmount: 100 }),
      lifetimeRow("2026-09-08", 80, "b", 1, { grossAmount: null }),
    ];
    expect(buildOrdersKeptShare(missingGross, []).current).toBeNull();
    expect(buildOrdersKeptShare(missingGross, []).lastYear).toBeNull();
  });

  it("keeps net vs gross this month vs last year when every row has gross", () => {
    const current = [
      lifetimeRow("2026-09-08", 90, "a", 1, { grossAmount: 100 }),
      lifetimeRow("2026-09-09", 80, "b", 1, { grossAmount: 100 }),
    ];
    const lastYear = [
      lifetimeRow("2025-09-08", 97, "c", 1, { grossAmount: 100 }),
    ];
    const kept = buildOrdersKeptShare(current, lastYear);
    expect(kept.current).toBeCloseTo(170 / 200, 5);
    expect(kept.lastYear).toBeCloseTo(97 / 100, 5);
  });
});

describe("orders first vs returning checkout discount, dollars per unit, $0 orders", () => {
  it("splits share of gross taken off and dashes a missing discount field", () => {
    const first = nBuyers({
      n: 8,
      prefix: "new-",
      day: "2026-09-08",
      amount: 80,
      lifetime: 1,
      extra: { discountAmount: 20, grossAmount: 100 },
    });
    const returning = nReturning({
      n: 8,
      prefix: "back-",
      periodDay: "2026-09-08",
      priorDay: "2026-03-01",
      amount: 95,
      lifetime: 2,
      extra: { discountAmount: 5, grossAmount: 100 },
    });
    const depth = buildOrdersCheckoutDiscount(
      [...first, ...returning.period],
      [...first, ...returning.book],
    );
    expect(depth.firstDepth).toBeCloseTo(160 / 800, 5);
    expect(depth.returningDepth).toBeCloseTo(40 / 800, 5);
    const missing = nBuyers({
      n: 8,
      prefix: "miss-",
      day: "2026-09-08",
      amount: 80,
      lifetime: 1,
      extra: { discountAmount: null },
    });
    expect(buildOrdersCheckoutDiscount(missing, missing).firstDepth).toBeNull();
  });

  it("divides Shopify Total Sales by crawled units, or Net when netSales is on the day", () => {
    const rows = nBuyers({
      n: 8,
      prefix: "u-",
      day: "2026-09-08",
      amount: 100,
      lifetime: 1,
      extra: { unitCount: 2 },
    });
    expect(buildOrdersDollarsPerUnit(rows, {}).dollarsPerUnit).toBe(50);
    expect(
      buildOrdersDollarsPerUnit(rows, { netSales: 640, netSalesKnown: true })
        .dollarsPerUnit,
    ).toBe(40);
    const uncrawled = nBuyers({
      n: 8,
      prefix: "x-",
      day: "2026-09-08",
      amount: 100,
      lifetime: 1,
    });
    expect(buildOrdersDollarsPerUnit(uncrawled, {}).dollarsPerUnit).toBeNull();
  });

  it("counts $0-amount orders and their units without calling them internal", () => {
    const zeros = [
      lifetimeRow("2026-09-08", 0, "z1", 2, { unitCount: 3 }),
      lifetimeRow("2026-09-08", 0, "z2", 4, { unitCount: 1 }),
      lifetimeRow("2026-09-08", 80, "paid", 1, { unitCount: 2 }),
    ];
    const zero = buildOrdersZeroAmountOrders(zeros);
    expect(zero.count).toBe(2);
    expect(zero.units).toBe(4);
    const missingUnits = [
      lifetimeRow("2026-09-08", 0, "z1", 2, { unitCount: 3 }),
      lifetimeRow("2026-09-08", 0, "z2", 4),
    ];
    expect(buildOrdersZeroAmountOrders(missingUnits).units).toBeNull();
  });
});

describe("orders step mix assemble + paint locks", () => {
  it("puts step mix, tickets, concentration, and last-year discount on the board payload", () => {
    const first = nBuyers({
      n: 8,
      prefix: "new-",
      day: "2026-09-08",
      amount: 90,
      lifetime: 1,
      extra: {
        discountAmount: 10,
        discountCode: "WELCOME10",
        grossAmount: 100,
        unitCount: 1,
      },
    });
    const lastYear = nBuyers({
      n: 8,
      prefix: "ly-",
      day: "2025-09-08",
      amount: 96,
      lifetime: 1,
      extra: { discountAmount: 4, discountCode: "WELCOME10", grossAmount: 100 },
    });
    const intel = assembleOrdersIntelligence({
      rows: first,
      priorRows: [],
      lastYearRows: lastYear,
      orderBook: first,
      periodLabel: "Month to date",
      badge: "MTD",
      netSales: 640,
      netSalesKnown: true,
      timeZone: "UTC",
    });
    expect(intel?.stepMix.find((bar) => bar.id === "first")?.sales).toBe(720);
    expect(intel?.tickets.firstTimeTicket).toBe(90);
    expect(intel?.tickets.basis).toBe(ORDERS_TICKET_BASIS);
    expect(intel?.concentration.buyersForHalf).toBe(4);
    expect(intel?.yearDiscount.lastYearDollars).toBe(32);
    expect(intel?.keptShare.current).toBeCloseTo(720 / 800, 5);
    expect(intel?.checkoutDiscount.firstDepth).toBeCloseTo(80 / 800, 5);
    expect(intel?.dollarsPerUnit.dollarsPerUnit).toBe(80);
    expect(intel?.zeroOrders.count).toBe(0);
    expect(intel?.current.returningSales).toBe(0);
  });

  it("does not recook third-order wait columns or paint VAT-out / Shopify AOV", () => {
    const lib = readFileSync(join(here, "orders-intelligence.ts"), "utf8");
    const board = readFileSync(join(here, "../components/OrdersIntelligence.tsx"), "utf8");
    const firstView = readFileSync(
      join(here, "../components/OrdersFirstViewport.tsx"),
      "utf8",
    );
    expect(lib).not.toContain("waitDays");
    expect(lib).not.toContain("VAT-out");
    expect(lib).not.toContain("VAT out");
    expect(board).not.toContain("waitDays");
    expect(board).not.toContain("Shopify Total Sales clock");
    expect(firstView).toContain("stepMix");
    expect(firstView).toContain("ORDERS_TICKET_BASIS");
    expect(firstView).toContain("Shipping + tax");
    expect(firstView).not.toContain("Shopify’s AOV");
    expect(firstView).not.toContain("Shopify's AOV");
  });
});

