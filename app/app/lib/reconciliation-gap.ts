/**
 * Last 7 days and this month: our net sales beside the Shopify sales-report
 * total. The two totals stay two totals. A missing figure stays null (em dash).
 * Loading and failed reads are never coerced to 0.
 */

import { shiftCivilDayKey } from "./shop-local-day";

export type ReadStatus = "checked" | "loading" | "failed";

export type GapLineId = "timing" | "tax" | "discounts" | "channels" | "b2b_or_draft";

export type BuyerKind = "new" | "returning" | "unknown";

export type VariantLine = {
  variantId: string;
  label: string;
  netAfterReturns: number | null;
  units: number | null;
  restock: number | null;
};

export type ReconciliationOrder = {
  id: string;
  name: string;
  createdDay: string;
  processedDay: string | null;
  netSales: number | null;
  grossSales: number | null;
  discount: number | null;
  refund: number | null;
  tax: number | null;
  restock: number | null;
  /** Null when Shopify did not name a channel. */
  channel: string | null;
  b2b: boolean;
  draft: boolean;
  buyer: BuyerKind;
  lines: VariantLine[];
};

export type ReconciliationWindowInput = {
  id: "l7" | "mtd";
  label: string;
  since: string;
  until: string;
  status: ReadStatus;
  checkedAt: string | null;
  orders: ReconciliationOrder[];
  ordersComplete: boolean;
  reportTotal: number | null;
};

export type GapOrderRef = {
  id: string;
  name: string;
  day: string;
  detail: string;
};

export type GapLineView = {
  id: GapLineId;
  label: string;
  amount: number | null;
  orders: GapOrderRef[];
};

export type MixShare = {
  label: "New" | "Returning" | "Unknown";
  share: number | null;
};

export type ReconciliationWindowView = {
  id: "l7" | "mtd";
  label: string;
  since: string;
  until: string;
  status: ReadStatus;
  checkedAt: string | null;
  ourNetSales: number | null;
  shopifyReportTotal: number | null;
  discounts: number | null;
  refunds: number | null;
  refundRate: number | null;
  mix: MixShare[];
  lines: GapLineView[];
  restock: number | null;
};

export type ReconciliationDeskData = {
  currency: string | null;
  windows: ReconciliationWindowView[];
  /** This month's variant lines. Null until that window is checked. */
  variantLines: VariantLine[] | null;
};

const GAP_LABEL: Record<GapLineId, string> = {
  timing: "Timing",
  tax: "Tax",
  discounts: "Discounts",
  channels: "Channels",
  b2b_or_draft: "B2B or draft",
};

const LINE_ORDER: GapLineId[] = [
  "timing",
  "tax",
  "discounts",
  "channels",
  "b2b_or_draft",
];

export function reconciliationDayWindows(today: string): {
  l7: { since: string; until: string };
  mtd: { since: string; until: string };
} {
  return {
    l7: { since: shiftCivilDayKey(today, -6), until: today },
    mtd: { since: `${today.slice(0, 7)}-01`, until: today },
  };
}

function inSpan(day: string, since: string, until: string): boolean {
  return day >= since && day <= until;
}

function sumKnown(values: Array<number | null>): number | null {
  let total = 0;
  for (const value of values) {
    if (value == null || !Number.isFinite(value)) return null;
    total += value;
  }
  return total;
}

function emptyMix(): MixShare[] {
  return [
    { label: "New", share: null },
    { label: "Returning", share: null },
    { label: "Unknown", share: null },
  ];
}

function ref(order: ReconciliationOrder, detail: string): GapOrderRef {
  return {
    id: order.id,
    name: order.name,
    day: order.createdDay,
    detail,
  };
}

export function buildReconciliationWindow(
  input: ReconciliationWindowInput,
): ReconciliationWindowView {
  const ready = input.status === "checked" && input.ordersComplete;
  const base: ReconciliationWindowView = {
    id: input.id,
    label: input.label,
    since: input.since,
    until: input.until,
    status: input.ordersComplete ? input.status : input.status === "failed" ? "failed" : "loading",
    checkedAt: ready ? input.checkedAt : input.status === "failed" ? input.checkedAt : null,
    ourNetSales: null,
    shopifyReportTotal: null,
    discounts: null,
    refunds: null,
    refundRate: null,
    mix: emptyMix(),
    lines: LINE_ORDER.map((id) => ({
      id,
      label: GAP_LABEL[id],
      amount: null,
      orders: [],
    })),
    restock: null,
  };
  if (!ready) return base;

  const ours = input.orders.filter((order) =>
    inSpan(order.createdDay, input.since, input.until),
  );
  const inReportNotOurs = input.orders.filter(
    (order) =>
      order.processedDay != null &&
      inSpan(order.processedDay, input.since, input.until) &&
      !inSpan(order.createdDay, input.since, input.until),
  );
  const processedMissing = ours.some((order) => order.processedDay == null);
  const inOursNotReport = processedMissing
    ? []
    : ours.filter(
        (order) =>
          order.processedDay != null &&
          !inSpan(order.processedDay, input.since, input.until),
      );

  const ourNetSales = sumKnown(ours.map((order) => order.netSales));
  const reportIn = sumKnown(inReportNotOurs.map((order) => order.netSales));
  const reportOut = sumKnown(inOursNotReport.map((order) => order.netSales));
  const timing =
    processedMissing || reportIn == null || reportOut == null
      ? null
      : reportIn - reportOut;

  const discounts = sumKnown(ours.map((order) => order.discount));
  const refunds = sumKnown(ours.map((order) => order.refund));
  const gross = sumKnown(ours.map((order) => order.grossSales));
  const tax = sumKnown(ours.map((order) => order.tax));
  const refundRate =
    refunds == null || gross == null || !(gross > 0) ? null : refunds / gross;

  const unknownOrders = ours.filter((order) => order.channel == null);
  const channels = sumKnown(unknownOrders.map((order) => order.netSales));
  const laneOrders = ours.filter((order) => order.b2b || order.draft);
  const b2bOrDraft = sumKnown(laneOrders.map((order) => order.netSales));

  const restockSent = ours
    .map((order) => order.restock)
    .filter((value): value is number => value != null && Number.isFinite(value));
  const restock =
    restockSent.length === 0
      ? null
      : restockSent.reduce((sum, value) => sum + value, 0);

  const mix = mixShares(ours, ourNetSales);

  const lines: GapLineView[] = [
    {
      id: "timing",
      label: GAP_LABEL.timing,
      amount: timing,
      orders: [
        ...inReportNotOurs.map((order) =>
          ref(order, "In the sales report, outside our order dates"),
        ),
        ...inOursNotReport.map((order) =>
          ref(order, "In our order dates, outside the sales report"),
        ),
      ],
    },
    {
      id: "tax",
      label: GAP_LABEL.tax,
      amount: tax,
      orders: ours
        .filter((order) => order.tax != null && order.tax !== 0)
        .map((order) => ref(order, "Tax")),
    },
    {
      id: "discounts",
      label: GAP_LABEL.discounts,
      amount: discounts,
      orders: ours
        .filter((order) => order.discount != null && order.discount !== 0)
        .map((order) => ref(order, "Discount")),
    },
    {
      id: "channels",
      label: GAP_LABEL.channels,
      amount: channels,
      orders: unknownOrders.map((order) => ref(order, "unknown")),
    },
    {
      id: "b2b_or_draft",
      label: GAP_LABEL.b2b_or_draft,
      amount: b2bOrDraft,
      orders: laneOrders.map((order) =>
        ref(
          order,
          order.b2b && order.draft
            ? "B2B · draft"
            : order.b2b
              ? "B2B"
              : "Draft",
        ),
      ),
    },
  ];

  return {
    ...base,
    status: "checked",
    ourNetSales,
    shopifyReportTotal:
      input.reportTotal == null || !Number.isFinite(input.reportTotal)
        ? null
        : input.reportTotal,
    discounts,
    refunds,
    refundRate,
    mix,
    lines,
    restock,
  };
}

function mixShares(
  orders: ReconciliationOrder[],
  ourNet: number | null,
): MixShare[] {
  if (ourNet == null || !(ourNet > 0)) return emptyMix();
  const totals: Record<BuyerKind, number | null> = {
    new: 0,
    returning: 0,
    unknown: 0,
  };
  for (const order of orders) {
    const bucket = totals[order.buyer];
    if (bucket == null || order.netSales == null) {
      totals[order.buyer] = null;
      continue;
    }
    totals[order.buyer] = bucket + order.netSales;
  }
  const share = (kind: BuyerKind): number | null => {
    const value = totals[kind];
    if (value == null) return null;
    return value / ourNet;
  };
  return [
    { label: "New", share: share("new") },
    { label: "Returning", share: share("returning") },
    { label: "Unknown", share: share("unknown") },
  ];
}

export function aggregateVariantLines(lines: VariantLine[]): VariantLine[] {
  const grouped = new Map<string, VariantLine>();
  for (const line of lines) {
    const key = line.variantId || "unknown";
    const prev = grouped.get(key);
    if (!prev) {
      grouped.set(key, {
        variantId: key,
        label: line.label || "unknown",
        netAfterReturns: line.netAfterReturns,
        units: line.units,
        restock: line.restock,
      });
      continue;
    }
    grouped.set(key, {
      variantId: key,
      label: prev.label,
      netAfterReturns: addNullable(prev.netAfterReturns, line.netAfterReturns),
      units: addNullable(prev.units, line.units),
      restock: addNullable(prev.restock, line.restock),
    });
  }
  return [...grouped.values()].sort((a, b) => a.label.localeCompare(b.label));
}

function addNullable(left: number | null, right: number | null): number | null {
  if (left == null || right == null) return null;
  if (!Number.isFinite(left) || !Number.isFinite(right)) return null;
  return left + right;
}

export function pastedSpendOverNewCustomers(
  spend: number | null,
  newCustomers: number | null,
): number | null {
  if (spend == null || !Number.isFinite(spend)) return null;
  if (newCustomers == null || !Number.isFinite(newCustomers) || newCustomers <= 0) {
    return null;
  }
  return spend / newCustomers;
}

export function emptyReconciliation(currency: string | null): ReconciliationDeskData {
  const blank = (id: "l7" | "mtd", label: string): ReconciliationWindowView =>
    buildReconciliationWindow({
      id,
      label,
      since: "",
      until: "",
      status: "failed",
      checkedAt: null,
      orders: [],
      ordersComplete: false,
      reportTotal: null,
    });
  return {
    currency,
    windows: [blank("l7", "Last 7 days"), blank("mtd", "This month")],
    variantLines: null,
  };
}
