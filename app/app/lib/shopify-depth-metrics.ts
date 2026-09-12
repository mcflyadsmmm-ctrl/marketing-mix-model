/**
 * Build chart models for every spend-free catalog feature.
 * Pure — no I/O. Missing inputs → honest emptyReason.
 */

import {
  SHOPIFY_DEPTH_CATALOG,
  type DepthChartKind,
  type DepthFeature,
  type DepthTab,
} from "./shopify-depth-catalog";
import { dayOfWeekFromKey } from "./order-economics";
import {
  computeBuyerConcentration,
  type BuyerRevenueFactLike,
} from "./buyer-concentration";
import {
  summarizeBuyerRepeat,
  type BuyerOrderFactLike,
} from "./cohort-buyer-metrics";

export type DayFactInput = {
  dayKey: string;
  sales: number;
  orderCount: number;
  newCustomerSales?: number;
  returningCustomerSales?: number;
  netSales?: number | null;
  grossSales?: number | null;
};

export type OrderFactInput = {
  buyerKey: string;
  orderAt: Date;
  netSales: number;
  hasCustomer?: boolean;
  lifetimeOrderRank?: number;
  /** Order-level discount total when ingested. */
  discountTotal?: number | null;
  /** Order-level shipping total when ingested. */
  shippingTotal?: number | null;
  /** Order-level tax / duty total when ingested. */
  taxTotal?: number | null;
  /** Units on the order when ingested. */
  unitCount?: number | null;
};

export type DepthBar = {
  id: string;
  label: string;
  value: number;
  share: number;
  tone?: string;
};

export type DepthKpi = {
  label: string;
  value: string;
  hint?: string;
};

export type DepthChartModel = {
  id: string;
  title: string;
  blurb: string;
  chart: DepthChartKind;
  kpis?: DepthKpi[];
  bars?: DepthBar[];
  buckets?: DepthBar[];
  headers?: string[];
  rows?: { cells: string[] }[];
  callout?: string;
  emptyReason?: string;
};

/** Optional Goals-tab snapshot — keeps metrics pure (no Prisma). */
export type GoalsDepthSnapshot = {
  year: number;
  periods: Array<{
    key: string;
    label: string;
    actual: number;
    goal: number;
    progressPct: number | null;
    paceLabel?: string;
  }>;
  months: Array<{
    month: number;
    label: string;
    actual: number;
    goal: number;
    prior: number;
  }>;
  priorYearTotal: number;
  /** Example plan total if merchant applies +10% YoY. */
  yoyGrow10Total: number;
};

export type BuildDepthChartsInput = {
  tab: DepthTab;
  dayFacts: DayFactInput[];
  priorDayFacts?: DayFactInput[];
  baselineDayFacts?: DayFactInput[];
  orderFacts?: OrderFactInput[];
  /** Prior-window orders for concentration trend (Customers heavy). */
  priorOrderFacts?: OrderFactInput[];
  /** Closed day keys expected but missing from dayFacts — never paint as $0. */
  missingDayKeys?: string[];
  timeZone?: string | null;
  goals?: GoalsDepthSnapshot | null;
};

const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const DOW_ORDER = [1, 2, 3, 4, 5, 6, 0] as const;

function money(n: number): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: n >= 100 ? 0 : 2,
  }).format(n);
}

function pct(n: number): string {
  return `${Math.round(n * 1000) / 10}%`;
}

function sum(xs: number[]): number {
  return xs.reduce((a, b) => a + b, 0);
}

function avg(xs: number[]): number | null {
  return xs.length ? sum(xs) / xs.length : null;
}

function stdev(xs: number[]): number | null {
  if (xs.length < 2) return null;
  const m = avg(xs);
  if (m == null) return null;
  return Math.sqrt(sum(xs.map((x) => (x - m) ** 2)) / (xs.length - 1));
}

function shareOf(part: number, total: number): number {
  return total > 0 && part >= 0 ? part / total : 0;
}

function shell(feature: DepthFeature): DepthChartModel {
  return {
    id: feature.id,
    title: feature.title,
    blurb: feature.blurb,
    chart: feature.chart,
  };
}

function empty(feature: DepthFeature, reason: string): DepthChartModel {
  return { ...shell(feature), emptyReason: reason };
}

function hourInTz(d: Date, tz: string | null | undefined): number {
  try {
    const raw = new Intl.DateTimeFormat("en-US", {
      timeZone: tz || "UTC",
      hour: "numeric",
      hour12: false,
    }).format(d);
    const h = Number.parseInt(raw, 10);
    return Number.isFinite(h) ? h % 24 : d.getUTCHours();
  } catch {
    return d.getUTCHours();
  }
}

function dayKeyInTz(d: Date, tz: string | null | undefined): string {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: tz || "UTC",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(d);
  } catch {
    return d.toISOString().slice(0, 10);
  }
}

function weekdayBars(facts: DayFactInput[]): DepthBar[] {
  const sales = new Array(7).fill(0) as number[];
  for (const f of facts) {
    const dow = dayOfWeekFromKey(f.dayKey);
    if (dow < 0) continue;
    sales[dow]! += f.sales;
  }
  const total = sum(sales);
  return DOW_ORDER.map((dow) => ({
    id: `dow-${dow}`,
    label: DOW[dow],
    value: sales[dow]!,
    share: shareOf(sales[dow]!, total),
    tone: dow === 0 || dow === 6 ? "weekend" : "weekday",
  }));
}

function toBuyerOrders(orders: OrderFactInput[]): BuyerOrderFactLike[] {
  const byBuyer = new Map<string, OrderFactInput[]>();
  for (const o of orders) {
    if (!o.buyerKey || o.buyerKey === "guest") continue;
    const list = byBuyer.get(o.buyerKey) ?? [];
    list.push(o);
    byBuyer.set(o.buyerKey, list);
  }
  const out: BuyerOrderFactLike[] = [];
  for (const [buyerKey, list] of byBuyer) {
    list.sort((a, b) => a.orderAt.getTime() - b.orderAt.getTime());
    list.forEach((o, i) => {
      out.push({
        buyerKey,
        orderAt: o.orderAt,
        netSales: o.netSales,
        lifetimeOrderRank: o.lifetimeOrderRank ?? i + 1,
      });
    });
  }
  return out;
}

function needsLines(feature: DepthFeature): DepthChartModel {
  return empty(
    feature,
    "Needs richer order line ingest (discounts / shipping / tax / units). Chart shell is ready.",
  );
}

function aovBuckets(orders: OrderFactInput[]): DepthBar[] {
  const edges = [0, 25, 50, 75, 100, 150, 200, 300, 500, Infinity];
  const labels = [
    "<$25",
    "$25–50",
    "$50–75",
    "$75–100",
    "$100–150",
    "$150–200",
    "$200–300",
    "$300–500",
    "$500+",
  ];
  const counts = new Array(labels.length).fill(0) as number[];
  for (const o of orders) {
    let i = edges.findIndex(
      (e, idx) => idx < edges.length - 1 && o.netSales < edges[idx + 1]!,
    );
    if (i < 0) i = labels.length - 1;
    counts[i]! += 1;
  }
  const total = sum(counts);
  return labels.map((label, i) => ({
    id: `aov-${i}`,
    label,
    value: counts[i]!,
    share: shareOf(counts[i]!, total),
    tone: "new",
  }));
}

function buildOne(
  feature: DepthFeature,
  input: BuildDepthChartsInput,
): DepthChartModel {
  const dayFacts = input.dayFacts;
  const prior = input.priorDayFacts ?? [];
  const baseline = input.baselineDayFacts ?? [];
  const orders = input.orderFacts ?? [];
  const tz = input.timeZone;
  const salesTotal = sum(dayFacts.map((d) => d.sales));
  const orderTotal = sum(dayFacts.map((d) => d.orderCount));

  switch (feature.id) {
    case "weekday_rhythm": {
      if (!dayFacts.length) return empty(feature, "No sales days in this period yet.");
      return { ...shell(feature), bars: weekdayBars(dayFacts) };
    }
    case "weekend_vs_weekday": {
      if (!dayFacts.length) return empty(feature, "No sales days in this period yet.");
      let weekend = 0;
      let weekday = 0;
      for (const f of dayFacts) {
        const dow = dayOfWeekFromKey(f.dayKey);
        if (dow === 0 || dow === 6) weekend += f.sales;
        else weekday += f.sales;
      }
      const total = weekend + weekday;
      return {
        ...shell(feature),
        bars: [
          { id: "weekday", label: "Weekday", value: weekday, share: shareOf(weekday, total), tone: "weekday" },
          { id: "weekend", label: "Weekend", value: weekend, share: shareOf(weekend, total), tone: "weekend" },
        ],
      };
    }
    case "day_of_month": {
      if (!dayFacts.length) return empty(feature, "No sales days in this period yet.");
      const byDom = new Map<number, number>();
      for (const f of dayFacts) {
        const dom = Number(f.dayKey.slice(8, 10));
        if (!Number.isFinite(dom)) continue;
        byDom.set(dom, (byDom.get(dom) ?? 0) + f.sales);
      }
      const total = sum([...byDom.values()]);
      return {
        ...shell(feature),
        bars: [...byDom.entries()]
          .sort((a, b) => a[0] - b[0])
          .map(([dom, value]) => ({
            id: `dom-${dom}`,
            label: String(dom),
            value,
            share: shareOf(value, total),
            tone: "weekday",
          })),
      };
    }
    case "hour_of_day": {
      if (!orders.length) {
        return empty(feature, "Order history still filling — hour chart unlocks once OrderFact is backfilled.");
      }
      const hours = new Array(24).fill(0) as number[];
      for (const o of orders) hours[hourInTz(o.orderAt, tz)]! += 1;
      const total = sum(hours);
      return {
        ...shell(feature),
        bars: hours.map((value, h) => ({
          id: `h-${h}`,
          label: String(h),
          value,
          share: shareOf(value, total),
          tone: h >= 9 && h <= 17 ? "weekday" : "weekend",
        })),
      };
    }
    case "sales_volatility": {
      if (dayFacts.length < 3) return empty(feature, "Need at least 3 days to read volatility.");
      const vals = dayFacts.map((d) => d.sales);
      const m = avg(vals) ?? 0;
      const s = stdev(vals) ?? 0;
      const cv = m > 0 ? s / m : 0;
      return {
        ...shell(feature),
        kpis: [
          { label: "Daily average", value: money(m) },
          { label: "Std dev", value: money(s) },
          { label: "Volatility (CV)", value: pct(cv), hint: cv > 0.45 ? "Feast / famine" : "Fairly steady" },
        ],
      };
    }
    case "sales_streaks": {
      if (!dayFacts.length) return empty(feature, "No sales days in this period yet.");
      const vals = dayFacts.map((d) => d.sales);
      const m = avg(vals) ?? 0;
      let bestAbove = 0;
      let bestBelow = 0;
      let curAbove = 0;
      let curBelow = 0;
      for (const v of vals) {
        if (v >= m) {
          curAbove += 1;
          curBelow = 0;
          bestAbove = Math.max(bestAbove, curAbove);
        } else {
          curBelow += 1;
          curAbove = 0;
          bestBelow = Math.max(bestBelow, curBelow);
        }
      }
      return {
        ...shell(feature),
        callout: `Longest above-average run: ${bestAbove}d. Longest below-average run: ${bestBelow}d. Daily average ${money(m)}.`,
      };
    }
    case "pace_vs_prior": {
      if (!dayFacts.length) return empty(feature, "No sales days in this period yet.");
      const priorSales = sum(prior.map((d) => d.sales));
      const priorOrders = sum(prior.map((d) => d.orderCount));
      const aov = orderTotal > 0 ? salesTotal / orderTotal : null;
      const priorAov = priorOrders > 0 ? priorSales / priorOrders : null;
      const delta = (now: number, p: number) =>
        p > 0
          ? `${now >= p ? "+" : ""}${(((now - p) / p) * 100).toFixed(0)}% vs prior`
          : "No prior window";
      return {
        ...shell(feature),
        kpis: [
          {
            label: "Sales",
            value: money(salesTotal),
            hint: prior.length ? delta(salesTotal, priorSales) : "No prior window",
          },
          {
            label: "Orders",
            value: orderTotal.toLocaleString(),
            hint: prior.length ? delta(orderTotal, priorOrders) : undefined,
          },
          {
            label: "AOV",
            value: aov != null ? money(aov) : "—",
            hint: priorAov != null && aov != null ? delta(aov, priorAov) : undefined,
          },
        ],
      };
    }
    case "closed_day_honesty": {
      const missing = input.missingDayKeys ?? [];
      const todayKey = dayKeyInTz(new Date(), tz);
      const closedPresent = dayFacts.filter((d) => d.dayKey < todayKey).length;
      const open = dayFacts.filter((d) => d.dayKey >= todayKey).length;
      if (!dayFacts.length && !missing.length) {
        return empty(feature, "No sales days in this period yet.");
      }
      return {
        ...shell(feature),
        kpis: [
          { label: "Closed days filled", value: String(closedPresent) },
          {
            label: "Missing closed days",
            value: String(missing.length),
            hint: missing.length
              ? "Holes are not $0 — backfill still running"
              : "Every closed day has a fact",
          },
          {
            label: "Open / today",
            value: String(open),
            hint: "Today stays partial until midnight shop-local",
          },
        ],
        callout: missing.length
          ? `Missing ${missing.slice(0, 3).join(", ")}${missing.length > 3 ? ` (+${missing.length - 3} more)` : ""}. Charts skip holes instead of inventing $0.`
          : undefined,
      };
    }
    case "seasonality_dow": {
      if (!dayFacts.length) return empty(feature, "No sales days in this period yet.");
      if (baseline.length < 14) {
        return empty(feature, "Need ~8 weeks of history for a weekday baseline.");
      }
      const period = weekdayBars(dayFacts);
      const baseBars = weekdayBars(baseline);
      return {
        ...shell(feature),
        bars: period.map((b, i) => ({
          ...b,
          tone: b.share >= (baseBars[i]?.share ?? 0) ? "returning" : "new",
        })),
        callout: "Green tint = above baseline share · blue = below.",
      };
    }
    case "aov_mean": {
      if (!(orderTotal > 0)) return empty(feature, "No orders in this period yet.");
      return {
        ...shell(feature),
        kpis: [
          { label: "AOV", value: money(salesTotal / orderTotal) },
          { label: "Sales", value: money(salesTotal) },
          { label: "Orders", value: orderTotal.toLocaleString() },
        ],
      };
    }
    case "aov_distribution":
    case "order_size_histogram": {
      if (!orders.length) {
        return empty(
          feature,
          "Order history still filling — distribution unlocks with OrderFact.",
        );
      }
      return { ...shell(feature), buckets: aovBuckets(orders) };
    }
    case "sales_basis_compare": {
      const net = sum(dayFacts.map((d) => d.netSales ?? 0));
      const gross = sum(dayFacts.map((d) => d.grossSales ?? 0));
      if (net <= 0 && gross <= 0) {
        return empty(
          feature,
          "Net/gross columns not on these day facts yet — re-sync to unlock.",
        );
      }
      const total = Math.max(salesTotal, gross, net, 1);
      return {
        ...shell(feature),
        bars: [
          { id: "total", label: "Total sales", value: salesTotal, share: shareOf(salesTotal, total), tone: "weekday" },
          { id: "gross", label: "Gross", value: gross, share: shareOf(gross, total), tone: "new" },
          { id: "net", label: "Net", value: net, share: shareOf(net, total), tone: "returning" },
        ],
      };
    }
    case "refund_haircut": {
      const nets = dayFacts
        .map((d) => d.netSales)
        .filter((n): n is number => n != null && Number.isFinite(n));
      const grosses = dayFacts
        .map((d) => d.grossSales)
        .filter((n): n is number => n != null && Number.isFinite(n));
      const net = sum(nets);
      const gross = sum(grosses);
      if (!(gross > 0)) {
        return empty(feature, "Need gross vs net on day facts to read the return haircut.");
      }
      const haircut = Math.max(0, gross - net);
      return {
        ...shell(feature),
        kpis: [
          { label: "Gross", value: money(gross) },
          { label: "Net", value: money(net) },
          { label: "Haircut", value: money(haircut), hint: `${pct(haircut / gross)} of gross` },
        ],
      };
    }
    case "discount_dependency": {
      if (!orders.length) return empty(feature, "Order history still filling.");
      const withDisc = orders.filter(
        (o) => o.discountTotal != null && Number.isFinite(o.discountTotal),
      );
      if (!withDisc.length) return needsLines(feature);
      const sales = sum(withDisc.map((o) => o.netSales));
      const discounts = sum(withDisc.map((o) => o.discountTotal ?? 0));
      const base = sales + discounts;
      return {
        ...shell(feature),
        kpis: [
          { label: "Discounts", value: money(discounts) },
          { label: "Net sales", value: money(sales) },
          {
            label: "Discount rate",
            value: base > 0 ? pct(discounts / base) : "—",
            hint: `${withDisc.length.toLocaleString()} orders with discount fields`,
          },
        ],
      };
    }
    case "shipping_share": {
      if (!orders.length) return empty(feature, "Order history still filling.");
      const withShip = orders.filter(
        (o) => o.shippingTotal != null && Number.isFinite(o.shippingTotal),
      );
      if (!withShip.length) return needsLines(feature);
      const sales = sum(withShip.map((o) => o.netSales));
      const shipping = sum(withShip.map((o) => o.shippingTotal ?? 0));
      return {
        ...shell(feature),
        kpis: [
          { label: "Shipping", value: money(shipping) },
          { label: "Net sales", value: money(sales) },
          {
            label: "Shipping share",
            value: sales > 0 ? pct(shipping / sales) : "—",
          },
        ],
      };
    }
    case "tax_duty_share": {
      if (!orders.length) return empty(feature, "Order history still filling.");
      const withTax = orders.filter(
        (o) => o.taxTotal != null && Number.isFinite(o.taxTotal),
      );
      if (!withTax.length) return needsLines(feature);
      const sales = sum(withTax.map((o) => o.netSales));
      const tax = sum(withTax.map((o) => o.taxTotal ?? 0));
      return {
        ...shell(feature),
        kpis: [
          { label: "Tax / duty", value: money(tax) },
          { label: "Net sales", value: money(sales) },
          {
            label: "Tax share",
            value: sales > 0 ? pct(tax / sales) : "—",
          },
        ],
      };
    }
    case "units_per_order": {
      if (!orders.length) return empty(feature, "Order history still filling.");
      const withUnits = orders.filter(
        (o) => o.unitCount != null && Number.isFinite(o.unitCount) && (o.unitCount as number) > 0,
      );
      if (!withUnits.length) return needsLines(feature);
      const units = sum(withUnits.map((o) => o.unitCount ?? 0));
      const avgUnits = units / withUnits.length;
      return {
        ...shell(feature),
        kpis: [
          { label: "Units", value: units.toLocaleString() },
          { label: "Orders", value: withUnits.length.toLocaleString() },
          {
            label: "Units / order",
            value: (Math.round(avgUnits * 100) / 100).toLocaleString(),
          },
        ],
      };
    }
    case "guest_vs_logged_in": {
      if (!orders.length) return empty(feature, "Order history still filling.");
      let guest = 0;
      let known = 0;
      let guestSales = 0;
      let knownSales = 0;
      for (const o of orders) {
        const isGuest =
          !o.buyerKey || o.buyerKey === "guest" || o.hasCustomer === false;
        if (isGuest) {
          guest += 1;
          guestSales += o.netSales;
        } else {
          known += 1;
          knownSales += o.netSales;
        }
      }
      const total = guestSales + knownSales;
      return {
        ...shell(feature),
        bars: [
          { id: "known", label: "Logged-in", value: knownSales, share: shareOf(knownSales, total), tone: "returning" },
          { id: "guest", label: "Guest", value: guestSales, share: shareOf(guestSales, total), tone: "new" },
        ],
        kpis: [
          { label: "Logged-in orders", value: known.toLocaleString() },
          { label: "Guest orders", value: guest.toLocaleString() },
        ],
      };
    }
    case "same_day_multi": {
      if (!orders.length) return empty(feature, "Order history still filling.");
      const byBuyerDay = new Map<string, number>();
      for (const o of orders) {
        if (!o.buyerKey || o.buyerKey === "guest") continue;
        const key = `${o.buyerKey}:${dayKeyInTz(o.orderAt, tz)}`;
        byBuyerDay.set(key, (byBuyerDay.get(key) ?? 0) + 1);
      }
      const multi = [...byBuyerDay.values()].filter((n) => n >= 2).length;
      const buyers = new Set(
        orders.filter((o) => o.buyerKey && o.buyerKey !== "guest").map((o) => o.buyerKey),
      ).size;
      return {
        ...shell(feature),
        kpis: [
          { label: "Same-day multi buyers", value: multi.toLocaleString() },
          { label: "Buyers in period", value: buyers.toLocaleString() },
          { label: "Share", value: buyers > 0 ? pct(multi / buyers) : "—" },
        ],
      };
    }
    case "day_board": {
      const missing = input.missingDayKeys ?? [];
      if (!dayFacts.length && !missing.length) {
        return empty(feature, "No sales days in this period yet.");
      }
      const byKey = new Map(dayFacts.map((d) => [d.dayKey, d]));
      const keys = [...new Set([...byKey.keys(), ...missing])].sort((a, b) =>
        b.localeCompare(a),
      );
      return {
        ...shell(feature),
        headers: ["Day", "Sales", "Orders", "AOV", "New $", "Returning $"],
        rows: keys.map((key) => {
          const d = byKey.get(key);
          if (!d) {
            return {
              cells: [key, "—", "—", "—", "—", "Missing fact"],
            };
          }
          return {
            cells: [
              d.dayKey,
              money(d.sales),
              String(d.orderCount),
              d.orderCount > 0 ? money(d.sales / d.orderCount) : "—",
              money(d.newCustomerSales ?? 0),
              money(d.returningCustomerSales ?? 0),
            ],
          };
        }),
        callout: missing.length
          ? `${missing.length} closed day${missing.length === 1 ? "" : "s"} still filling — shown as Missing, not $0.`
          : undefined,
      };
    }
    case "strongest_softest_day": {
      if (!dayFacts.length) return empty(feature, "No sales days in this period yet.");
      const sorted = [...dayFacts].sort((a, b) => b.sales - a.sales);
      const best = sorted[0]!;
      const soft = sorted[sorted.length - 1]!;
      return {
        ...shell(feature),
        callout: `Strongest ${best.dayKey}: ${money(best.sales)} · ${best.orderCount} orders. Softest ${soft.dayKey}: ${money(soft.sales)} · ${soft.orderCount} orders.`,
        kpis: [
          { label: "Strongest", value: money(best.sales), hint: best.dayKey },
          { label: "Softest", value: money(soft.sales), hint: soft.dayKey },
        ],
      };
    }
    case "new_vs_returning_sales":
    case "returning_sales_share": {
      const neu = sum(dayFacts.map((d) => d.newCustomerSales ?? 0));
      const ret = sum(dayFacts.map((d) => d.returningCustomerSales ?? 0));
      if (neu + ret <= 0) {
        return empty(feature, "New/returning sales split not on these day facts yet.");
      }
      const total = neu + ret;
      return {
        ...shell(feature),
        bars: [
          { id: "returning", label: "Returning", value: ret, share: shareOf(ret, total), tone: "returning" },
          { id: "new", label: "New", value: neu, share: shareOf(neu, total), tone: "new" },
        ],
      };
    }
    case "wow_mom_yoy": {
      if (!prior.length) {
        return empty(feature, "No comparable prior window loaded for this period.");
      }
      const priorSales = sum(prior.map((d) => d.sales));
      const dlt = priorSales > 0 ? ((salesTotal - priorSales) / priorSales) * 100 : null;
      return {
        ...shell(feature),
        kpis: [
          { label: "This period", value: money(salesTotal) },
          { label: "Prior window", value: money(priorSales) },
          {
            label: "Delta",
            value: dlt == null ? "—" : `${dlt >= 0 ? "+" : ""}${dlt.toFixed(0)}%`,
          },
        ],
      };
    }
    case "what_changed": {
      if (!dayFacts.length) return empty(feature, "No sales days in this period yet.");
      const bits: string[] = [];
      const neu = sum(dayFacts.map((d) => d.newCustomerSales ?? 0));
      const ret = sum(dayFacts.map((d) => d.returningCustomerSales ?? 0));
      if (neu + ret > 0) {
        bits.push(`Returning buyers drove ${pct(ret / (neu + ret))} of attributed sales.`);
      }
      const rhythm = weekdayBars(dayFacts);
      const peak = [...rhythm].sort((a, b) => b.value - a.value)[0];
      if (peak && peak.value > 0) {
        bits.push(`${peak.label} is the strongest weekday (${money(peak.value)}).`);
      }
      const priorSales = sum(prior.map((d) => d.sales));
      if (priorSales > 0) {
        const dlt = ((salesTotal - priorSales) / priorSales) * 100;
        bits.push(
          `Sales are ${dlt >= 0 ? "up" : "down"} ${Math.abs(dlt).toFixed(0)}% vs the prior window.`,
        );
      }
      return {
        ...shell(feature),
        callout: bits.join(" ") || "Not enough mix signal for a read yet.",
      };
    }
    case "sales_export":
      return {
        ...shell(feature),
        callout: "Use the Day board above — copy the period ledger when you need Sheets.",
      };
    case "second_order_30_60_90": {
      if (!orders.length) return empty(feature, "Order history still filling.");
      const summary = summarizeBuyerRepeat(toBuyerOrders(orders));
      return {
        ...shell(feature),
        bars: [
          { id: "30", label: "Within 30d", value: (summary.secondWithin30 ?? 0) * 100, share: summary.secondWithin30 ?? 0, tone: "new" },
          { id: "60", label: "Within 60d", value: (summary.secondWithin60 ?? 0) * 100, share: summary.secondWithin60 ?? 0, tone: "weekday" },
          { id: "90", label: "Within 90d", value: (summary.secondWithin90 ?? 0) * 100, share: summary.secondWithin90 ?? 0, tone: "returning" },
        ],
        kpis: [{ label: "Buyers", value: summary.buyers.toLocaleString() }],
      };
    }
    case "median_days_to_second": {
      if (!orders.length) return empty(feature, "Order history still filling.");
      const summary = summarizeBuyerRepeat(toBuyerOrders(orders));
      return {
        ...shell(feature),
        kpis: [
          {
            label: "Median days to 2nd",
            value:
              summary.medianDaysToSecond != null
                ? `${Math.round(summary.medianDaysToSecond)}d`
                : "—",
          },
          { label: "Buyers", value: summary.buyers.toLocaleString() },
        ],
      };
    }
    case "third_plus_rate":
    case "one_and_done": {
      if (!orders.length) return empty(feature, "Order history still filling.");
      const byBuyer = new Map<string, { first: number; count: number }>();
      for (const o of orders) {
        if (!o.buyerKey || o.buyerKey === "guest") continue;
        const t = o.orderAt.getTime();
        const row = byBuyer.get(o.buyerKey) ?? { first: t, count: 0 };
        row.first = Math.min(row.first, t);
        row.count += 1;
        byBuyer.set(o.buyerKey, row);
      }
      const asOf = Date.now();
      const mature = [...byBuyer.values()].filter(
        (b) => (asOf - b.first) / 86400000 >= 90,
      );
      if (!mature.length) {
        return empty(feature, "Need buyers at least 90 days old to gate this rate.");
      }
      const third = mature.filter((b) => b.count >= 3).length;
      const one = mature.filter((b) => b.count === 1).length;
      if (feature.id === "third_plus_rate") {
        return {
          ...shell(feature),
          kpis: [
            { label: "3rd+ rate", value: pct(third / mature.length) },
            { label: "Mature buyers", value: mature.length.toLocaleString() },
          ],
        };
      }
      return {
        ...shell(feature),
        kpis: [
          { label: "One-and-done", value: pct(one / mature.length) },
          { label: "Mature buyers", value: mature.length.toLocaleString() },
        ],
      };
    }
    case "first_vs_subsequent": {
      if (!orders.length) return empty(feature, "Order history still filling.");
      const summary = summarizeBuyerRepeat(toBuyerOrders(orders));
      const first = summary.firstOrderRevenue;
      const later = summary.subsequentRevenue;
      const total = first + later;
      if (!(total > 0)) return empty(feature, "No attributed buyer sales yet.");
      return {
        ...shell(feature),
        bars: [
          { id: "first", label: "First order $", value: first, share: shareOf(first, total), tone: "new" },
          { id: "later", label: "Subsequent $", value: later, share: shareOf(later, total), tone: "returning" },
        ],
      };
    }
    case "time_between_orders": {
      if (!orders.length) return empty(feature, "Order history still filling.");
      const byBuyer = new Map<string, Date[]>();
      for (const o of orders) {
        if (!o.buyerKey || o.buyerKey === "guest") continue;
        const list = byBuyer.get(o.buyerKey) ?? [];
        list.push(o.orderAt);
        byBuyer.set(o.buyerKey, list);
      }
      const gaps: number[] = [];
      for (const list of byBuyer.values()) {
        list.sort((a, b) => a.getTime() - b.getTime());
        for (let i = 1; i < list.length; i++) {
          gaps.push((list[i]!.getTime() - list[i - 1]!.getTime()) / 86400000);
        }
      }
      if (!gaps.length) return empty(feature, "Need buyers with 2+ orders to chart gaps.");
      const bands = [
        { id: "0-7", label: "≤7d", max: 7 },
        { id: "8-30", label: "8–30d", max: 30 },
        { id: "31-60", label: "31–60d", max: 60 },
        { id: "61-90", label: "61–90d", max: 90 },
        { id: "90+", label: "90d+", max: Infinity },
      ];
      const counts = bands.map(() => 0);
      for (const g of gaps) {
        const i = bands.findIndex((b) => g <= b.max);
        counts[i < 0 ? bands.length - 1 : i]! += 1;
      }
      const total = sum(counts) || 1;
      return {
        ...shell(feature),
        buckets: bands.map((b, i) => ({
          id: b.id,
          label: b.label,
          value: counts[i]!,
          share: counts[i]! / total,
          tone: "returning",
        })),
      };
    }
    case "first_aov_vs_returning": {
      if (!orders.length) return empty(feature, "Order history still filling.");
      const byBuyer = new Map<string, OrderFactInput[]>();
      for (const o of orders) {
        if (!o.buyerKey || o.buyerKey === "guest") continue;
        const list = byBuyer.get(o.buyerKey) ?? [];
        list.push(o);
        byBuyer.set(o.buyerKey, list);
      }
      let firstN = 0;
      let firstS = 0;
      let laterN = 0;
      let laterS = 0;
      for (const list of byBuyer.values()) {
        list.sort((a, b) => a.orderAt.getTime() - b.orderAt.getTime());
        list.forEach((o, i) => {
          if (i === 0) {
            firstN += 1;
            firstS += o.netSales;
          } else {
            laterN += 1;
            laterS += o.netSales;
          }
        });
      }
      const firstAov = firstN > 0 ? firstS / firstN : 0;
      const laterAov = laterN > 0 ? laterS / laterN : 0;
      const max = Math.max(firstAov, laterAov, 1);
      return {
        ...shell(feature),
        bars: [
          { id: "first", label: "First AOV", value: firstAov, share: firstAov / max, tone: "new" },
          { id: "later", label: "Returning AOV", value: laterAov, share: laterAov / max, tone: "returning" },
        ],
      };
    }
    case "repeat_lag_curve": {
      if (!orders.length) return empty(feature, "Order history still filling.");
      const byBuyer = new Map<string, { first: number; orders: { t: number; amt: number }[] }>();
      for (const o of orders) {
        if (!o.buyerKey || o.buyerKey === "guest") continue;
        const t = o.orderAt.getTime();
        const row = byBuyer.get(o.buyerKey) ?? { first: t, orders: [] };
        row.first = Math.min(row.first, t);
        row.orders.push({ t, amt: o.netSales });
        byBuyer.set(o.buyerKey, row);
      }
      const horizons = [7, 14, 30, 60, 90, 180, 365];
      const totals = horizons.map(() => 0);
      let buyers = 0;
      for (const row of byBuyer.values()) {
        buyers += 1;
        for (const o of row.orders) {
          if (o.t === row.first) continue;
          const days = (o.t - row.first) / 86400000;
          horizons.forEach((h, i) => {
            if (days <= h) totals[i]! += o.amt;
          });
        }
      }
      if (!buyers) return empty(feature, "Need identified buyers to build the lag curve.");
      const peak = Math.max(...totals.map((t) => t / buyers), 1);
      return {
        ...shell(feature),
        bars: horizons.map((h, i) => ({
          id: `lag-${h}`,
          label: `${h}d`,
          value: totals[i]! / buyers,
          share: totals[i]! / buyers / peak,
          tone: "returning",
        })),
      };
    }
    case "cohort_ltv_30_90_365": {
      if (!orders.length) return empty(feature, "Order history still filling.");
      const byBuyer = new Map<string, { first: number; orders: { t: number; amt: number }[] }>();
      for (const o of orders) {
        if (!o.buyerKey || o.buyerKey === "guest") continue;
        const t = o.orderAt.getTime();
        const row = byBuyer.get(o.buyerKey) ?? { first: t, orders: [] };
        row.first = Math.min(row.first, t);
        row.orders.push({ t, amt: o.netSales });
        byBuyer.set(o.buyerKey, row);
      }
      const asOf = Date.now();
      const horizons = [30, 90, 365];
      const avgs = horizons.map((h) => {
        const mature = [...byBuyer.values()].filter(
          (b) => (asOf - b.first) / 86400000 >= h,
        );
        if (!mature.length) return null;
        const rev = mature.map((b) =>
          sum(
            b.orders
              .filter((o) => (o.t - b.first) / 86400000 <= h)
              .map((o) => o.amt),
          ),
        );
        return avg(rev);
      });
      if (avgs.every((x) => x == null)) {
        return empty(feature, "Cohorts not mature enough yet for 30/90/365 averages.");
      }
      const max = Math.max(...avgs.map((x) => x ?? 0), 1);
      return {
        ...shell(feature),
        bars: horizons.map((h, i) => ({
          id: `ltv-${h}`,
          label: `${h}d LTV`,
          value: avgs[i] ?? 0,
          share: (avgs[i] ?? 0) / max,
          tone: i === 0 ? "new" : i === 1 ? "weekday" : "returning",
        })),
      };
    }
    case "cohort_quality_rank": {
      if (!orders.length) return empty(feature, "Order history still filling.");
      const byBuyer = new Map<string, { first: Date; rev: number }>();
      for (const o of orders) {
        if (!o.buyerKey || o.buyerKey === "guest") continue;
        const row = byBuyer.get(o.buyerKey);
        if (!row) byBuyer.set(o.buyerKey, { first: o.orderAt, rev: o.netSales });
        else {
          if (o.orderAt < row.first) row.first = o.orderAt;
          row.rev += o.netSales;
        }
      }
      const byCohort = new Map<string, { buyers: number; rev: number }>();
      for (const row of byBuyer.values()) {
        const month = dayKeyInTz(row.first, tz).slice(0, 7);
        const c = byCohort.get(month) ?? { buyers: 0, rev: 0 };
        c.buyers += 1;
        c.rev += row.rev;
        byCohort.set(month, c);
      }
      const ranked = [...byCohort.entries()]
        .map(([month, c]) => ({
          month,
          arpu: c.buyers > 0 ? c.rev / c.buyers : 0,
          buyers: c.buyers,
        }))
        .sort((a, b) => b.arpu - a.arpu)
        .slice(0, 8);
      if (!ranked.length) return empty(feature, "No cohort months yet.");
      return {
        ...shell(feature),
        headers: ["Cohort", "Buyers", "Rev / buyer"],
        rows: ranked.map((r) => ({
          cells: [r.month, String(r.buyers), money(r.arpu)],
        })),
      };
    }
    case "buyer_concentration": {
      if (!orders.length) return empty(feature, "Order history still filling.");
      const facts: BuyerRevenueFactLike[] = orders
        .filter((o) => o.buyerKey && o.buyerKey !== "guest")
        .map((o) => ({ buyerKey: o.buyerKey, netSales: o.netSales }));
      const conc = computeBuyerConcentration(facts);
      if (!conc.buyers) return empty(feature, "Need identified buyers for concentration.");
      return {
        ...shell(feature),
        bars: [
          { id: "top10", label: "Top 10%", value: (conc.top10Share ?? 0) * 100, share: conc.top10Share ?? 0, tone: "weekend" },
          { id: "top20", label: "Top 20%", value: (conc.top20Share ?? 0) * 100, share: conc.top20Share ?? 0, tone: "returning" },
        ],
        kpis: [
          { label: "Buyers", value: conc.buyers.toLocaleString() },
          {
            label: "Top buyer",
            value: conc.topBuyerShare != null ? pct(conc.topBuyerShare) : "—",
          },
        ],
      };
    }
    case "concentration_trend": {
      if (!orders.length) {
        return empty(feature, "Order history still filling.");
      }
      const priorOrders = input.priorOrderFacts ?? [];
      if (!priorOrders.length) {
        return empty(
          feature,
          "Need the prior period’s orders to trend whale share.",
        );
      }
      const currentFacts: BuyerRevenueFactLike[] = orders
        .filter((o) => o.buyerKey && o.buyerKey !== "guest")
        .map((o) => ({ buyerKey: o.buyerKey, netSales: o.netSales }));
      const priorFacts: BuyerRevenueFactLike[] = priorOrders
        .filter((o) => o.buyerKey && o.buyerKey !== "guest")
        .map((o) => ({ buyerKey: o.buyerKey, netSales: o.netSales }));
      const current = computeBuyerConcentration(currentFacts);
      const prior = computeBuyerConcentration(priorFacts);
      if (current.top10Share == null || prior.top10Share == null) {
        return empty(
          feature,
          "Need enough identified buyers in both windows for a top-10% trend.",
        );
      }
      const delta = current.top10Share - prior.top10Share;
      const deltaLabel =
        delta === 0
          ? "Flat vs prior"
          : `${delta > 0 ? "+" : ""}${pct(delta)} vs prior`;
      return {
        ...shell(feature),
        kpis: [
          {
            label: "Top 10% now",
            value: pct(current.top10Share),
            hint: `${current.buyers.toLocaleString()} buyers this window`,
          },
          {
            label: "Top 10% prior",
            value: pct(prior.top10Share),
            hint: `${prior.buyers.toLocaleString()} buyers prior window`,
          },
          {
            label: "Change",
            value: deltaLabel,
            hint: delta > 0.02
              ? "Concentration rising — whales carry more"
              : delta < -0.02
                ? "Concentration easing — revenue spreading"
                : "Whale share roughly steady",
          },
        ],
      };
    }

    case "whale_board": {
      if (!orders.length) return empty(feature, "Order history still filling.");
      const byBuyer = new Map<string, { sales: number; count: number }>();
      for (const o of orders) {
        if (!o.buyerKey || o.buyerKey === "guest") continue;
        const row = byBuyer.get(o.buyerKey) ?? { sales: 0, count: 0 };
        row.sales += o.netSales;
        row.count += 1;
        byBuyer.set(o.buyerKey, row);
      }
      const rows = [...byBuyer.entries()]
        .sort((a, b) => b[1].sales - a[1].sales)
        .slice(0, 10)
        .map(([key, row], i) => ({
          cells: [`#${i + 1}`, `Buyer …${key.slice(-6)}`, money(row.sales), String(row.count)],
        }));
      if (!rows.length) return empty(feature, "No identified buyers yet.");
      return {
        ...shell(feature),
        headers: ["Rank", "Buyer", "Lifetime $", "Orders"],
        rows,
      };
    }
    case "rfm_lite": {
      if (!orders.length) return empty(feature, "Order history still filling.");
      const byBuyer = new Map<string, { last: number; count: number }>();
      let maxT = 0;
      for (const o of orders) {
        if (!o.buyerKey || o.buyerKey === "guest") continue;
        const t = o.orderAt.getTime();
        maxT = Math.max(maxT, t);
        const row = byBuyer.get(o.buyerKey) ?? { last: 0, count: 0 };
        row.last = Math.max(row.last, t);
        row.count += 1;
        byBuyer.set(o.buyerKey, row);
      }
      const bands = { champions: 0, loyal: 0, promising: 0, at_risk: 0, hibernating: 0 };
      for (const row of byBuyer.values()) {
        const recencyDays = (maxT - row.last) / 86400000;
        if (row.count >= 3 && recencyDays <= 60) bands.champions += 1;
        else if (row.count >= 2 && recencyDays <= 90) bands.loyal += 1;
        else if (row.count === 1 && recencyDays <= 45) bands.promising += 1;
        else if (row.count >= 2 && recencyDays > 90) bands.at_risk += 1;
        else bands.hibernating += 1;
      }
      const total = sum(Object.values(bands)) || 1;
      return {
        ...shell(feature),
        bars: [
          { id: "champions", label: "Champions", value: bands.champions, share: bands.champions / total, tone: "returning" },
          { id: "loyal", label: "Loyal", value: bands.loyal, share: bands.loyal / total, tone: "weekday" },
          { id: "promising", label: "Promising", value: bands.promising, share: bands.promising / total, tone: "new" },
          { id: "at_risk", label: "At risk", value: bands.at_risk, share: bands.at_risk / total, tone: "weekend" },
          { id: "hibernating", label: "Hibernating", value: bands.hibernating, share: bands.hibernating / total, tone: "weekday" },
        ],
      };
    }
    case "lapsing_risk":
    case "reactivation_share": {
      if (!orders.length) return empty(feature, "Order history still filling.");
      const byBuyer = new Map<string, number[]>();
      for (const o of orders) {
        if (!o.buyerKey || o.buyerKey === "guest") continue;
        const list = byBuyer.get(o.buyerKey) ?? [];
        list.push(o.orderAt.getTime());
        byBuyer.set(o.buyerKey, list);
      }
      const asOf = Date.now();
      let single = 0;
      let lapsed = 0;
      let reactivated = 0;
      const windowStart = asOf - 90 * 86400000;
      for (const times of byBuyer.values()) {
        times.sort((a, b) => a - b);
        if (times.length === 1) {
          single += 1;
          if (asOf - times[0]! > 60 * 86400000) lapsed += 1;
        } else {
          const last = times[times.length - 1]!;
          const prev = times[times.length - 2]!;
          if (last >= windowStart && prev < windowStart - 60 * 86400000) {
            reactivated += 1;
          }
        }
      }
      const buyers = byBuyer.size || 1;
      if (feature.id === "lapsing_risk") {
        return {
          ...shell(feature),
          kpis: [
            { label: "Quiet one-order buyers", value: lapsed.toLocaleString() },
            { label: "One-order buyers", value: single.toLocaleString() },
            { label: "Share of buyers", value: pct(lapsed / buyers) },
          ],
        };
      }
      return {
        ...shell(feature),
        kpis: [
          { label: "Reactivated (90d)", value: reactivated.toLocaleString() },
          { label: "Share of buyers", value: pct(reactivated / buyers) },
        ],
      };
    }
    case "new_buyer_quality": {
      if (!orders.length) return empty(feature, "Order history still filling.");
      const firstOrders = new Map<string, OrderFactInput>();
      for (const o of orders) {
        if (!o.buyerKey || o.buyerKey === "guest") continue;
        const prev = firstOrders.get(o.buyerKey);
        if (!prev || o.orderAt < prev.orderAt) firstOrders.set(o.buyerKey, o);
      }
      const sortedDays = [...dayFacts].sort((a, b) => a.dayKey.localeCompare(b.dayKey));
      const periodStart = sortedDays[0]?.dayKey;
      const periodEnd = sortedDays[sortedDays.length - 1]?.dayKey;
      let newBuyers = 0;
      let newSales = 0;
      for (const o of firstOrders.values()) {
        const key = dayKeyInTz(o.orderAt, tz);
        if (periodStart && periodEnd && key >= periodStart && key <= periodEnd) {
          newBuyers += 1;
          newSales += o.netSales;
        }
      }
      return {
        ...shell(feature),
        kpis: [
          { label: "New buyers", value: newBuyers.toLocaleString() },
          { label: "Their first-order $", value: money(newSales) },
          { label: "First AOV", value: newBuyers > 0 ? money(newSales / newBuyers) : "—" },
        ],
      };
    }
    case "sales_goal_mtd": {
      const goals = input.goals;
      if (!goals?.periods?.length) {
        return empty(
          feature,
          "Set monthly sales goals below — MTD / QTD / YTD pace unlocks once a plan exists.",
        );
      }
      return {
        ...shell(feature),
        kpis: goals.periods.map((p) => ({
          label: p.label,
          value:
            p.progressPct == null
              ? "—"
              : `${Math.round(p.progressPct)}% of goal`,
          hint: `${money(p.actual)} / ${money(p.goal)}${
            p.paceLabel ? ` · ${p.paceLabel}` : ""
          }`,
        })),
      };
    }
    case "sales_goal_board": {
      const goals = input.goals;
      if (!goals?.months?.length) {
        return empty(feature, "Monthly goal board fills once the year plan loads.");
      }
      return {
        ...shell(feature),
        headers: ["Month", "Actual", "Goal", "Prior year"],
        rows: goals.months.map((m) => ({
          cells: [
            m.label,
            money(m.actual),
            money(m.goal),
            money(m.prior),
          ],
        })),
      };
    }
    case "yoy_grow": {
      const goals = input.goals;
      if (!goals) {
        return {
          ...shell(feature),
          callout:
            "Use +5% / +10% / +15% / +20% YoY presets below to fill all 12 months from prior-year sales. Sales goals only — no margin or ROAS goal here.",
        };
      }
      if (!(goals.priorYearTotal > 0)) {
        return empty(
          feature,
          `Need ${goals.year - 1} sales on file before YoY grow can fill months.`,
        );
      }
      return {
        ...shell(feature),
        callout: `${goals.year - 1} actual ${money(goals.priorYearTotal)} → +10% plan ${money(goals.yoyGrow10Total)}. Presets +5% / +10% / +15% / +20% sit below — sales targets only.`,
      };
    }
    default:
      return empty(feature, "Chart not wired yet.");
  }
}

export type DepthChartPhase = "fast" | "slow" | "full";

/** Order-fact charts wait for the heavy pass; everything else can first-paint. */
export function depthFeatureIsFastPaint(needs: string): boolean {
  // Day facts (+ history baselines) paint first. Order + line-item charts wait.
  return needs === "day_facts" || needs === "history" || needs === "goals";
}

export function buildDepthChartsForTab(
  input: BuildDepthChartsInput,
  phase: DepthChartPhase = "full",
): DepthChartModel[] {
  return SHOPIFY_DEPTH_CATALOG.filter((f) => {
    if (f.tab !== input.tab) return false;
    if (phase === "full") return true;
    const fast = depthFeatureIsFastPaint(f.needs);
    return phase === "fast" ? fast : !fast;
  }).map((f) => buildOne(f, input));
}

/** Placeholder shells so the grid keeps catalog order while heavy charts load. */
export function buildDepthChartPlaceholdersForTab(
  tab: BuildDepthChartsInput["tab"],
): DepthChartModel[] {
  return SHOPIFY_DEPTH_CATALOG.filter(
    (f) => f.tab === tab && !depthFeatureIsFastPaint(f.needs),
  ).map((f) => ({
    id: f.id,
    title: f.title,
    blurb: f.blurb,
    chart: f.chart,
    emptyReason: "Loading order history…",
  }));
}

export function depthCatalogCount(): number {
  return SHOPIFY_DEPTH_CATALOG.length;
}

/** Map persisted SalesDayFact rows → depth day inputs. */
export function dayFactsFromSalesDayRows(
  rows: Map<
    string,
    {
      sales: number;
      orderCount: number;
      newCustomerNetSales?: number;
      returningCustomerNetSales?: number;
      netSales?: number | null;
      grossSales?: number | null;
    }
  >,
): DayFactInput[] {
  return [...rows.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([dayKey, row]) => ({
      dayKey,
      sales: row.sales,
      orderCount: row.orderCount,
      newCustomerSales: row.newCustomerNetSales,
      returningCustomerSales: row.returningCustomerNetSales,
      netSales: row.netSales ?? null,
      grossSales: row.grossSales ?? null,
    }));
}
