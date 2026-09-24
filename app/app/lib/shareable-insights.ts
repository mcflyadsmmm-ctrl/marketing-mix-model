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
  nextHref: "/app/customers" | "/app/orders";
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
  todaySalesTruncated?: boolean;
};

function shareWindowName(periodLabel: string): string {
  const label = periodLabel.trim();
  if (label === "Month to date") return "This month";
  if (!label) return "This period";
  return label;
}

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
  if (sample) return "Sample shop";
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
  if (input.todaySalesTruncated) return null;
  const ret = finitePositive(input.returningSales);
  const share =
    input.returningShare != null &&
    Number.isFinite(input.returningShare) &&
    input.returningShare > 0
      ? input.returningShare
      : null;
  if (ret == null || share == null) return null;
  const pct = wholePercent(share);
  const window = shareWindowName(input.periodLabel);
  const newSales = finitePositive(input.newSales);
  const plug =
    newSales != null
      ? `${money(ret)} ÷ (${money(newSales)} + ${money(ret)})`
      : `${money(ret)} ÷ (new $ + returning $)`;
  return {
    kind: "returning",
    label: `Returning $ · ${window}`,
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
  const window = shareWindowName(input.periodLabel);
  return {
    kind: "typicalOrder",
    label: `Typical order · ${window}`,
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
    nextHref: "/app/customers",
    nextLabel: "Open Customers",
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
    nextHref: "/app/customers",
    nextLabel: "Open Customers",
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

export type SlackInsightId = ShareableInsightKind | "whale" | "firstTime";

/** One paste-ready insight. Missing numbers never become a card. */
export type SlackInsight = {
  id: SlackInsightId;
  label: string;
  line: string;
  formula: string;
  trust: string;
  /** Slack mrkdwn. Copy button writes this; the line stays selectable. */
  slack: string;
};

export function formatSlackInsightMessage(input: {
  label: string;
  line: string;
  formula: string;
  trust: string;
  shopBrand: string;
  sample: boolean;
  where: string;
}): string {
  const shop = input.shopBrand;
  const where = [shop, input.where.trim()].filter((part) => part.length > 0).join(" · ");
  return [
    `*${input.label}* · ${where}`,
    input.line.trim(),
    input.formula.trim(),
    `_${input.trust.trim()}_`,
  ].join("\n");
}

function sealSlackInsight(input: {
  id: SlackInsightId;
  label: string;
  line: string;
  formula: string;
  trust: string;
  shopLabel: string;
  sample: boolean;
  where: string;
}): SlackInsight {
  const shopBrand = shareableShopBrand(input.shopLabel, input.sample);
  return {
    id: input.id,
    label: input.label,
    line: input.line,
    formula: input.formula,
    trust: input.trust,
    slack: formatSlackInsightMessage({
      label: input.label,
      line: input.line,
      formula: input.formula,
      trust: input.trust,
      shopBrand,
      sample: input.sample,
      where: input.where,
    }),
  };
}

/** Same poster, as a Slack message. Does not invent a second number. */
export function slackInsightFromCard(
  card: ShareableInsightCard,
  meta: { shopBrand: string; sample: boolean; periodLabel: string },
): SlackInsight {
  return sealSlackInsight({
    id: card.kind,
    label: card.label,
    line: card.line,
    formula: card.formula,
    trust: card.trust,
    shopLabel: meta.shopBrand,
    sample: meta.sample,
    where: meta.periodLabel,
  });
}

/**
 * Growth chip. Only when a typical wait has sealed. The "still waiting"
 * sentence is an empty, not a share card.
 */
export function daysToSecondSlackInsight(input: {
  typicalDays: number | null;
  readLine: string | null;
  shopLabel: string;
  sample: boolean;
  where: string;
}): SlackInsight | null {
  if (finitePositive(input.typicalDays) == null) return null;
  const line = input.readLine?.trim() ?? "";
  if (!line || line.includes("$0")) return null;
  return sealSlackInsight({
    id: "daysToSecond",
    label: "Days to second",
    line,
    formula: "Days to second = median first→second gap among buyers who came back.",
    trust: "Among buyers who came back. Guests stay out.",
    shopLabel: input.shopLabel,
    sample: input.sample,
    where: input.where,
  });
}

/**
 * Growth stand-up. First-time Shopify Total Sales this period, plus 2nd vs
 * 3rd when both seal, plus reach-now. Never copy $0 or a pending window.
 */
export function firstTimeSlackInsight(input: {
  line: string | null;
  shopLabel: string;
  sample: boolean;
  where: string;
}): SlackInsight | null {
  const line = input.line?.trim() ?? "";
  if (!line) return null;
  if (/[$£€]\s*0(?:[.,]0+)?(?!\d)/.test(line)) return null;
  return sealSlackInsight({
    id: "firstTime",
    label: "First-time dollars",
    line,
    formula:
      "First-time Shopify Total Sales this period. 2nd vs 3rd when both shares seal. Reach-now from the win-back clock.",
    trust: "Identified first-time dollars. Guests stay out of returning. Order history only.",
    shopLabel: input.shopLabel,
    sample: input.sample,
    where: input.where,
  });
}

/**
 * LTV chip. Same 90-then-30 peek as the posters. Year stays off when
 * history is limited — never a fake first year.
 */
export function ltvPeekSlackInsight(input: {
  amount: number | null;
  days: ShareableLtvPeekDays | null;
  historyLimited: boolean;
  shopLabel: string;
  sample: boolean;
  where: string;
  money: (n: number) => string;
}): SlackInsight | null {
  const worth = finitePositive(input.amount);
  const days = input.days;
  if (worth == null || days == null) return null;
  if (days === 365 && input.historyLimited) return null;
  const window = shareableLtvWindowLabel(days);
  return sealSlackInsight({
    id: "ltvPeek",
    label: "New-buyer worth",
    line: `A new buyer is worth ${input.money(worth)} in the ${window} — observed order history.`,
    formula: `Worth = average dollars per new buyer in the ${window}.`,
    trust: "Observed order history — not an estimate. Refunds never invented.",
    shopLabel: input.shopLabel,
    sample: input.sample,
    where: input.where,
  });
}

/**
 * Best-customer mix already on whale recency. Zero share or a $0 typical
 * stays off the card.
 */
export function whaleSlackInsight(input: {
  whaleCount: number;
  salesShare: number | null;
  medianLifetime: number | null;
  coldShare: number | null;
  historyLimited: boolean;
  shopLabel: string;
  sample: boolean;
  where: string;
  money: (n: number) => string;
}): SlackInsight | null {
  const count = Math.trunc(Number.isFinite(input.whaleCount) ? input.whaleCount : 0);
  const share =
    input.salesShare != null &&
    Number.isFinite(input.salesShare) &&
    input.salesShare > 0
      ? input.salesShare
      : null;
  const typical = finitePositive(input.medianLifetime);
  if (count < 1 || share == null || typical == null) return null;
  const pct = wholePercent(share);
  const cold =
    !input.historyLimited &&
    input.coldShare != null &&
    Number.isFinite(input.coldShare) &&
    input.coldShare > 0
      ? wholePercent(input.coldShare)
      : 0;
  let line = `Best customers carry ${pct}% of identified sales. A typical best customer is ${input.money(typical)}.`;
  if (cold > 0) {
    line += ` ${cold}% have not ordered in over 180 days.`;
  }
  if (line.includes("$0")) return null;
  return sealSlackInsight({
    id: "whale",
    label: "Best customers",
    line,
    formula:
      "Share = best-customer lifetime $ ÷ identified lifetime $. Typical = median lifetime in the top tenth. Cold share = best customers whose last order is over 180 days ago.",
    trust: "Top tenth by lifetime dollars. Guests stay out. Order history only.",
    shopLabel: input.shopLabel,
    sample: input.sample,
    where: input.where,
  });
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
