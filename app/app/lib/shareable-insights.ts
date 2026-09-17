/**
 * Habit-desk shareable insight cards — screenshot / copy-ready numbers
 * already on the desk. Returning $, typical order, days-to-second, LTV peek.
 * Order history only. No black box.
 *
 * Thin shops stay honest empties (syncing / thin / young). Floor is 8
 * paid orders. Never a blank card, never $0, never a fake year.
 *
 * Pure + Prisma-free so it unit-tests away from the loader.
 */

export const SHARE_MIN_ORDERS = 8;

export const SHAREABLE_INSIGHT_KINDS = [
  "returning",
  "typicalOrder",
  "daysToSecond",
  "ltvPeek",
] as const;

export type ShareableInsightKind = (typeof SHAREABLE_INSIGHT_KINDS)[number];

export type ShareableInsightEmptyKind = "syncing" | "thin" | "young";

export type ShareableLtvPeekDays = 30 | 90 | 365;

export type ShareableInsightEmpty = {
  kind: ShareableInsightEmptyKind;
  orders: number;
  need: number;
  copy: string;
  verb: string;
};

export type ShareableInsightCard = {
  kind: ShareableInsightKind;
  label: string;
  /** Painted hero — already formatted. */
  value: string;
  /** Copy-to-clipboard / screenshot line. */
  line: string;
  /** Written-out formula when a number shows. */
  formula: string;
  /** Trust line — observed vs estimate, guests out, not a guess. */
  trust: string;
  nextHref: "/app/customers" | "/app/orders" | "/app/growth" | "/app/ltv";
  nextLabel: string;
};

export type ShareableInsightView = {
  available: boolean;
  empty: ShareableInsightEmpty | null;
  cards: ShareableInsightCard[];
  shopBrand: string;
  sample: boolean;
  periodLabel: string;
  historyLimited: boolean;
};

export type ShareableInsightInput = {
  salesPending: boolean;
  orderCount: number;
  returningSales: number | null;
  returningShare: number | null;
  newSales: number | null;
  typicalOrder: number | null;
  daysToSecond: number | null;
  ltvPeek: number | null;
  ltvPeekDays: ShareableLtvPeekDays | null;
  historyLimited: boolean;
  shopLabel: string;
  sample: boolean;
  periodLabel: string;
};

function finitePositive(n: number | null | undefined): number | null {
  if (n == null || !Number.isFinite(n) || n <= 0) return null;
  return n;
}

function wholePercent(share: number): number {
  return Math.round(share * 100);
}

function daysLabel(days: number): string {
  const n = Math.round(days);
  return `${n} ${n === 1 ? "day" : "days"}`;
}

export function shareableShopBrand(shopLabel: string, sample: boolean): string {
  if (sample) return "Snowdevil";
  const raw = shopLabel.trim();
  if (!raw) return "This shop";
  return raw.replace(/\.myshopify\.com$/i, "");
}

export function shareableLtvWindowLabel(days: ShareableLtvPeekDays): string {
  switch (days) {
    case 30:
      return "first 30 days";
    case 90:
      return "first 90 days";
    case 365:
      return "first year";
    default: {
      const _exhaustive: never = days;
      return _exhaustive;
    }
  }
}

export function shareableInsightKicker(count: number): string {
  switch (count) {
    case 0:
      return "Order-history numbers, screenshot-ready.";
    case 1:
      return "One order-history number, screenshot-ready.";
    case 2:
      return "Two order-history numbers, screenshot-ready.";
    case 3:
      return "Three order-history numbers, screenshot-ready.";
    default:
      return "Four order-history numbers, screenshot-ready.";
  }
}

export function shareableInsightPngName(
  kind: ShareableInsightKind,
  shopBrand: string,
): string {
  const slug =
    shopBrand
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "shop";
  switch (kind) {
    case "returning":
    case "typicalOrder":
    case "daysToSecond":
    case "ltvPeek":
      return `mcfly-${kind}-${slug}.png`;
    default: {
      const _exhaustive: never = kind;
      return _exhaustive;
    }
  }
}

/**
 * Prefer first 90 days, then 30. Year only when history is not limited —
 * never a fake first-year on a short book.
 */
export function pickShareableLtvPeek(input: {
  revenue30: number | null | undefined;
  revenue90: number | null | undefined;
  revenue365: number | null | undefined;
  historyLimited: boolean;
}): { amount: number; days: ShareableLtvPeekDays } | null {
  const r90 = finitePositive(input.revenue90);
  if (r90) return { amount: r90, days: 90 };
  const r30 = finitePositive(input.revenue30);
  if (r30) return { amount: r30, days: 30 };
  if (input.historyLimited) return null;
  const r365 = finitePositive(input.revenue365);
  if (r365) return { amount: r365, days: 365 };
  return null;
}

/**
 * First-win empty when no shareable card has sealed. Syncing / thin / young
 * — not $0, not a blank poster.
 */
export function shareableInsightEmptyState(
  orders: number,
  sealed: number,
  salesPending: boolean,
): ShareableInsightEmpty | null {
  const need = SHARE_MIN_ORDERS;
  if (salesPending || orders <= 0) {
    return {
      kind: "syncing",
      orders: Math.max(0, orders),
      need,
      copy: "Orders still syncing — not $0. Shareable cards fill as paid orders land.",
      verb: "Refresh this page",
    };
  }
  if (orders < need) {
    return {
      kind: "thin",
      orders,
      need,
      copy: `${orders.toLocaleString()} ${orders === 1 ? "order" : "orders"} on file. Shareable cards seal after ${need} paid orders — not $0.`,
      verb: "Watch the next orders",
    };
  }
  if (sealed <= 0) {
    return {
      kind: "young",
      orders,
      need,
      copy: `${orders.toLocaleString()} orders on file. Returning $, typical order, days-to-second, or what a new buyer is worth still need identified buyers — not $0.`,
      verb: "Wait for identified buyers",
    };
  }
  return null;
}

function returningCard(
  input: ShareableInsightInput,
  money: (n: number) => string,
): ShareableInsightCard | null {
  const ret = finitePositive(input.returningSales);
  const share =
    input.returningShare != null &&
    Number.isFinite(input.returningShare) &&
    input.returningShare > 0
      ? input.returningShare
      : null;
  if (ret == null || share == null) return null;
  const pct = wholePercent(share);
  const newSales = finitePositive(input.newSales);
  const plug =
    newSales != null
      ? `${money(ret)} ÷ (${money(newSales)} + ${money(ret)})`
      : `${money(ret)} ÷ (new $ + returning $)`;
  return {
    kind: "returning",
    label: "Returning $",
    value: money(ret),
    line: `Returning buyers carry ${pct}% of sales (${money(ret)}) — dollars, not headcount.`,
    formula: `Returning $ ÷ (new $ + returning $) = ${pct}%. ${plug}.`,
    trust: "Dollars, not Shopify’s returning-customer rate. Guests stay out.",
    nextHref: "/app/customers",
    nextLabel: "Open Customers",
  };
}

function typicalOrderCard(
  input: ShareableInsightInput,
  money: (n: number) => string,
): ShareableInsightCard | null {
  const typical = finitePositive(input.typicalOrder);
  if (typical == null) return null;
  return {
    kind: "typicalOrder",
    label: "Typical order",
    value: money(typical),
    line: `Typical order is ${money(typical)} — the middle order, not Shopify’s average.`,
    formula: "Typical order = median of paid orders in this window.",
    trust: "The middle order — Shopify’s average gets pulled up by a few large ones.",
    nextHref: "/app/orders",
    nextLabel: "Open Orders",
  };
}

function daysToSecondCard(
  input: ShareableInsightInput,
): ShareableInsightCard | null {
  const days = finitePositive(input.daysToSecond);
  if (days == null) return null;
  const wait = daysLabel(days);
  return {
    kind: "daysToSecond",
    label: "Days to second",
    value: wait,
    line: `Typical wait to a second order is ${wait} — median first→second gap.`,
    formula: "Days to second = median first→second gap among buyers who came back.",
    trust: "Among buyers who came back. Guests stay out.",
    nextHref: "/app/growth",
    nextLabel: "Open Growth",
  };
}

function ltvPeekCard(
  input: ShareableInsightInput,
  money: (n: number) => string,
): ShareableInsightCard | null {
  const worth = finitePositive(input.ltvPeek);
  const days = input.ltvPeekDays;
  if (worth == null || days == null) return null;
  if (days === 365 && input.historyLimited) return null;
  const window = shareableLtvWindowLabel(days);
  return {
    kind: "ltvPeek",
    label: "New-buyer worth",
    value: money(worth),
    line: `A new buyer is worth ${money(worth)} in the ${window} — observed order history.`,
    formula: `Worth = average dollars per new buyer in the ${window}.`,
    trust: "Observed order history — not an estimate. Refunds never invented.",
    nextHref: "/app/ltv",
    nextLabel: "Open LTV",
  };
}

/**
 * Two-to-four soft cards from truths already on the desk. Missing truths
 * stay off the strip — never a fake $0 card.
 */
export function buildShareableInsights(
  input: ShareableInsightInput,
  money: (n: number) => string,
): ShareableInsightView {
  const orderCount = Math.max(0, Math.trunc(Number.isFinite(input.orderCount) ? input.orderCount : 0));
  const shopBrand = shareableShopBrand(input.shopLabel, input.sample);
  const periodLabel = input.periodLabel.trim() || "This window";
  const drafts = [
    returningCard(input, money),
    typicalOrderCard(input, money),
    daysToSecondCard(input),
    ltvPeekCard(input, money),
  ].filter((card): card is ShareableInsightCard => card != null);
  const empty = shareableInsightEmptyState(
    orderCount,
    drafts.length,
    input.salesPending,
  );
  if (empty) {
    return {
      available: false,
      empty,
      cards: [],
      shopBrand,
      sample: input.sample,
      periodLabel,
      historyLimited: input.historyLimited,
    };
  }
  return {
    available: true,
    empty: null,
    cards: drafts.slice(0, 4),
    shopBrand,
    sample: input.sample,
    periodLabel,
    historyLimited: input.historyLimited,
  };
}

/** Honest zeros for pending / no-data — not a fake poster. */
export function emptyShareableInsights(): ShareableInsightView {
  return buildShareableInsights(
    {
      salesPending: true,
      orderCount: 0,
      returningSales: null,
      returningShare: null,
      newSales: null,
      typicalOrder: null,
      daysToSecond: null,
      ltvPeek: null,
      ltvPeekDays: null,
      historyLimited: false,
      shopLabel: "",
      sample: false,
      periodLabel: "",
    },
    () => "—",
  );
}
