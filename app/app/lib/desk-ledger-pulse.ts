/**
 * Decision strip + KPI rail for Days / Orders / Buyers / Cohorts.
 * Pure — same OpsDeskIsland chrome Overview / Sales already use.
 */

import { formatShopMoney } from "./mer-format";
import type {
  OpsDeskAction,
  OpsDeskIslandModel,
  OpsDeskKpi,
  OpsDeskTone,
} from "./ops-desk-island";
import type {
  BuyerLedgerRowInput,
  CohortLedgerRowInput,
  DayLedgerRowInput,
  OrderLedgerRowInput,
} from "./desk-ledgers";
import { strongestSoftestDayKeys } from "./desk-ledgers";

function money(n: number, currency: string | null | undefined): string {
  return formatShopMoney(n, currency);
}

function pct(rate: number): string {
  return `${Math.round(rate * 1000) / 10}%`;
}

function toneFromReturning(share: number | null, orders: number): OpsDeskTone {
  if (share != null && share >= 0.42) return "strong";
  if (share != null && share <= 0.15 && orders >= 20) return "watch";
  return "steady";
}

function trimKpis(kpis: OpsDeskKpi[]): OpsDeskKpi[] {
  return kpis.slice(0, 4);
}

export function buildDayLedgerPulse(args: {
  periodLabel: string;
  periodPreset: string;
  rows: DayLedgerRowInput[];
  currencyCode: string | null | undefined;
}): OpsDeskIslandModel | null {
  const closed = args.rows.filter((r) => !r.missing && !r.open);
  const withOrders = closed.filter((r) => r.orderCount > 0);
  if (closed.length === 0 && withOrders.length === 0) return null;

  const sales = closed.reduce((s, r) => s + r.sales, 0);
  const orders = closed.reduce((s, r) => s + r.orderCount, 0);
  const newSales = closed.reduce((s, r) => s + r.newCustomerSales, 0);
  const returningSales = closed.reduce(
    (s, r) => s + r.returningCustomerSales,
    0,
  );
  const attributed = newSales + returningSales;
  const returningShare = attributed > 0 ? returningSales / attributed : null;
  const aov = orders > 0 ? sales / orders : null;
  const { strongest, softest } = strongestSoftestDayKeys(args.rows);
  const strongestRow = strongest
    ? args.rows.find((r) => r.dayKey === strongest)
    : null;
  const softestRow = softest
    ? args.rows.find((r) => r.dayKey === softest)
    : null;

  const takeaway =
    strongestRow && softestRow && strongest !== softest
      ? `Strongest ${strongest}: ${money(strongestRow.sales, args.currencyCode)} · Softest ${softest}: ${money(softestRow.sales, args.currencyCode)}.`
      : strongestRow
        ? `Strongest day ${strongest}: ${money(strongestRow.sales, args.currencyCode)} across ${orders.toLocaleString()} orders.`
        : `${orders.toLocaleString()} orders · ${money(sales, args.currencyCode)} on the closed-day board.`;

  const whyBits = [
    `${closed.length} closed day${closed.length === 1 ? "" : "s"}`,
    `${orders.toLocaleString()} orders`,
  ];
  if (returningShare != null) {
    whyBits.push(`${pct(returningShare)} returning $`);
  }

  const actions: OpsDeskAction[] = [
    {
      id: "sales",
      label: "Sales rhythm",
      href: `/app/sales?period=${encodeURIComponent(args.periodPreset)}`,
      primary: true,
    },
    {
      id: "orders",
      label: "Order ledger",
      href: `/app/orders?period=${encodeURIComponent(args.periodPreset)}`,
    },
    {
      id: "export",
      label: "Export CSV",
      href: `/app/period-ledger.csv?period=${encodeURIComponent(args.periodPreset)}`,
    },
  ];

  const kpis: OpsDeskKpi[] = [
    {
      id: "sales",
      label: "Sales",
      value: money(sales, args.currencyCode),
      hint: args.periodLabel,
      accent: true,
    },
    {
      id: "orders",
      label: "Orders",
      value: orders.toLocaleString(),
      hint:
        aov != null
          ? `AOV ${money(aov, args.currencyCode)}`
          : "Closed-day orders",
    },
  ];
  if (aov != null) {
    kpis.push({
      id: "aov",
      label: "AOV",
      value: money(aov, args.currencyCode),
      hint: `${closed.length} closed days`,
    });
  }
  if (returningShare != null) {
    kpis.push({
      id: "returning",
      label: "Returning $",
      value: pct(returningShare),
      hint: `${money(returningSales, args.currencyCode)} returning · ${money(newSales, args.currencyCode)} new`,
    });
  } else {
    kpis.push({
      id: "days",
      label: "Filled days",
      value: String(withOrders.length),
      hint: `${closed.length} closed · holes are not $0`,
    });
  }

  return {
    kicker: `Days · ${args.periodLabel}`,
    takeaway,
    why: whyBits.join(" · "),
    tone: toneFromReturning(returningShare, orders),
    actions,
    kpis: trimKpis(kpis),
  };
}

export function buildOrderLedgerPulse(args: {
  periodLabel: string;
  periodPreset: string;
  rows: OrderLedgerRowInput[];
  totalMatched: number;
  currencyCode: string | null | undefined;
}): OpsDeskIslandModel | null {
  const { rows } = args;
  if (rows.length === 0 && args.totalMatched === 0) return null;

  const sales = rows.reduce((s, r) => s + r.amount, 0);
  const discounts = rows.reduce((s, r) => s + (r.discountTotal ?? 0), 0);
  const shipping = rows.reduce((s, r) => s + (r.shippingTotal ?? 0), 0);
  const guests = rows.filter((r) => r.isGuest).length;
  const returning = rows.filter(
    (r) => !r.isGuest && (r.lifetimeOrderRank ?? 0) > 1,
  ).length;
  const discounted = rows.filter((r) => (r.discountTotal ?? 0) > 0).length;
  const aov = rows.length > 0 ? sales / rows.length : null;
  const discountShare = sales > 0 ? discounts / sales : null;
  const guestShare = rows.length > 0 ? guests / rows.length : null;

  const takeaway =
    discountShare != null && discountShare >= 0.12
      ? `Discounts ate ${pct(discountShare)} of shown order value — check dependency before you scale spend.`
      : guestShare != null && guestShare >= 0.35
        ? `${pct(guestShare)} of shown orders are guest checkouts — opaque keys only go so far.`
        : `${args.totalMatched.toLocaleString()} orders in period · showing ${rows.length.toLocaleString()} with full economics.`;

  const actions: OpsDeskAction[] = [
    {
      id: "days",
      label: "Day ledger",
      href: `/app/days?period=${encodeURIComponent(args.periodPreset)}`,
      primary: true,
    },
    {
      id: "customers",
      label: "Buyers",
      href: `/app/customers?period=${encodeURIComponent(args.periodPreset)}`,
    },
    {
      id: "export",
      label: "Export CSV",
      href: `/app/order-ledger.csv?period=${encodeURIComponent(args.periodPreset)}`,
    },
  ];

  const kpis: OpsDeskKpi[] = [
    {
      id: "orders",
      label: "Orders",
      value: args.totalMatched.toLocaleString(),
      hint: `Showing ${rows.length.toLocaleString()}`,
      accent: true,
    },
    {
      id: "sales",
      label: "Shown $",
      value: money(sales, args.currencyCode),
      hint: args.periodLabel,
    },
  ];
  if (aov != null) {
    kpis.push({
      id: "aov",
      label: "AOV",
      value: money(aov, args.currencyCode),
      hint: "On filtered rows",
    });
  }
  if (discountShare != null) {
    kpis.push({
      id: "discount",
      label: "Discount share",
      value: pct(discountShare),
      hint: `${discounted.toLocaleString()} discounted orders`,
    });
  } else if (guestShare != null) {
    kpis.push({
      id: "guest",
      label: "Guest share",
      value: pct(guestShare),
      hint: `${guests.toLocaleString()} guest checkouts`,
    });
  }

  return {
    kicker: `Orders · ${args.periodLabel}`,
    takeaway,
    why: [
      `${money(sales, args.currencyCode)} on screen`,
      shipping > 0 ? `${money(shipping, args.currencyCode)} shipping` : null,
      returning > 0 ? `${returning.toLocaleString()} returning` : null,
    ]
      .filter(Boolean)
      .join(" · "),
    tone:
      discountShare != null && discountShare >= 0.2
        ? "watch"
        : returning / Math.max(rows.length, 1) >= 0.35
          ? "strong"
          : "steady",
    actions,
    kpis: trimKpis(kpis),
  };
}

export function buildBuyerLedgerPulse(args: {
  periodLabel: string;
  periodPreset: string;
  rows: BuyerLedgerRowInput[];
  totalBuyers: number;
  currencyCode: string | null | undefined;
}): OpsDeskIslandModel | null {
  const { rows } = args;
  if (args.totalBuyers === 0) return null;

  const periodSales = rows.reduce((s, r) => s + r.periodSales, 0);
  const repeat = rows.filter((r) => r.orderCount > 1);
  const oneAndDone = rows.filter((r) => r.orderCount <= 1);
  const withSecond = rows.filter((r) => r.daysToSecond != null);
  const medianSecond =
    withSecond.length > 0
      ? [...withSecond]
          .map((r) => r.daysToSecond!)
          .sort((a, b) => a - b)[Math.floor(withSecond.length / 2)]!
      : null;
  const repeatRate = rows.length > 0 ? repeat.length / rows.length : null;
  const top = rows[0];

  const takeaway =
    repeatRate != null && repeatRate >= 0.35
      ? `${pct(repeatRate)} of shown buyers already repeat — concentration still matters.`
      : repeatRate != null && repeatRate <= 0.12 && rows.length >= 20
        ? `Only ${pct(repeatRate)} of shown buyers repeat — acquisition is carrying the till.`
        : top
          ? `Top buyer ${money(top.periodSales, args.currencyCode)} this period · ${args.totalBuyers.toLocaleString()} identified buyers.`
          : `${args.totalBuyers.toLocaleString()} identified buyers in ${args.periodLabel}.`;

  const actions: OpsDeskAction[] = [
    {
      id: "buyer-ledger",
      label: "Buyer ledger",
      href: "#desk-section-buyer-ledger",
      primary: true,
    },
    {
      id: "cohorts",
      label: "Cohorts",
      href: "/app/cohorts",
    },
    {
      id: "orders",
      label: "Orders",
      href: `/app/orders?period=${encodeURIComponent(args.periodPreset)}`,
    },
  ];

  const kpis: OpsDeskKpi[] = [
    {
      id: "buyers",
      label: "Buyers",
      value: args.totalBuyers.toLocaleString(),
      hint: `Top ${rows.length.toLocaleString()} shown`,
      accent: true,
    },
    {
      id: "period",
      label: "Period $",
      value: money(periodSales, args.currencyCode),
      hint: "On ledger rows",
    },
  ];
  if (repeatRate != null) {
    kpis.push({
      id: "repeat",
      label: "Repeat buyers",
      value: pct(repeatRate),
      hint: `${repeat.length.toLocaleString()} with 2+ lifetime orders`,
    });
  }
  if (medianSecond != null) {
    kpis.push({
      id: "second",
      label: "Days to 2nd",
      value: `${Math.round(medianSecond)}d`,
      hint: "Median among shown repeaters",
    });
  } else {
    kpis.push({
      id: "one",
      label: "One-and-done",
      value: oneAndDone.length.toLocaleString(),
      hint: "Shown buyers with a single order",
    });
  }

  return {
    kicker: `Customers · ${args.periodLabel}`,
    takeaway,
    why: [
      `${money(periodSales, args.currencyCode)} from top ${rows.length.toLocaleString()} on screen`,
      `${oneAndDone.length.toLocaleString()} one-and-done`,
      medianSecond != null
        ? `Median ${Math.round(medianSecond)}d to 2nd`
        : null,
    ]
      .filter(Boolean)
      .join(" · "),
    tone: toneFromReturning(repeatRate, rows.length),
    actions,
    kpis: trimKpis(kpis),
  };
}

export function buildCohortLedgerPulse(args: {
  rows: CohortLedgerRowInput[];
  currencyCode: string | null | undefined;
}): OpsDeskIslandModel | null {
  const { rows } = args;
  if (rows.length === 0) return null;

  const latest = rows[0]!;
  const prior = rows[1] ?? null;
  const ltv90 =
    latest.customers > 0 ? latest.revenueD90 / latest.customers : null;
  const priorLtv90 =
    prior && prior.customers > 0 ? prior.revenueD90 / prior.customers : null;
  const ltvDelta =
    ltv90 != null && priorLtv90 != null && priorLtv90 > 0
      ? ((ltv90 - priorLtv90) / priorLtv90) * 100
      : null;

  const takeaway =
    ltv90 != null
      ? `${latest.cohortMonth} cohort · LTV 90d ${money(ltv90, args.currencyCode)}${
          ltvDelta != null
            ? ` (${ltvDelta >= 0 ? "+" : ""}${ltvDelta.toFixed(0)}% vs prior month)`
            : ""
        }.`
      : `${rows.length} first-order months on the board.`;

  const actions: OpsDeskAction[] = [
    {
      id: "customers",
      label: "Buyer ledger",
      href: "/app/customers",
      primary: true,
    },
    {
      id: "export",
      label: "Export CSV",
      href: "/app/cohort-ledger.csv",
    },
  ];

  const kpis: OpsDeskKpi[] = [
    {
      id: "buyers",
      label: "Latest buyers",
      value: latest.customers.toLocaleString(),
      hint: latest.cohortMonth,
      accent: true,
    },
  ];
  if (ltv90 != null) {
    kpis.push({
      id: "ltv90",
      label: "LTV · 90d",
      value: money(ltv90, args.currencyCode),
      hint: prior ? `Prior ${prior.cohortMonth}` : "Revenue ÷ buyers at 90d",
      delta:
        ltvDelta != null
          ? `${ltvDelta >= 0 ? "+" : ""}${ltvDelta.toFixed(0)}% vs prior`
          : null,
    });
  }
  kpis.push({
    id: "ltv30",
    label: "LTV · 30d",
    value:
      latest.customers > 0
        ? money(latest.revenueD30 / latest.customers, args.currencyCode)
        : "—",
    hint: "Early read",
  });
  kpis.push({
    id: "months",
    label: "Cohorts",
    value: String(rows.length),
    hint: "First-order months on desk",
  });

  return {
    kicker: "Cohorts · first-order months",
    takeaway,
    why: `${latest.customers.toLocaleString()} buyers in ${latest.cohortMonth} · opaque keys only · no CRM seed`,
    tone:
      ltvDelta != null && ltvDelta <= -15
        ? "watch"
        : ltvDelta != null && ltvDelta >= 10
          ? "strong"
          : "steady",
    actions,
    kpis: trimKpis(kpis),
  };
}

/** Serialize ledger row objects to CSV text (header + values). */
export function serializeLedgerCsv(
  columns: { key: string; label: string }[],
  rows: Record<string, string>[],
): string {
  const esc = (v: string) => {
    if (/[",\n\r]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
    return v;
  };
  const header = columns.map((c) => esc(c.label)).join(",");
  const body = rows
    .map((row) => columns.map((c) => esc(String(row[c.key] ?? ""))).join(","))
    .join("\n");
  return `${header}\n${body}\n`;
}
