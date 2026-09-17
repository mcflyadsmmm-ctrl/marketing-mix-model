/**
 * Promo / discount → LTV — which first-order promo starts higher-LTV buyers.
 *
 * Grouping is first-order only (order history). A named discount code / title
 * forms a promo row when it is actually on the order. When only discount $ is
 * on file (live OrderFacts), buyers split into Promo first vs Full price first
 * — we never invent a code from the dollar amount. SAMPLE Snowdevil stamps
 * first-order codes so the canvas can name WELCOME10 / POWDER15 / BUNDLE.
 *
 * Windows seal the same way as Product→LTV: enough buyers who started with
 * that promo must have lived 30 / 90 / 365 days. A dash is not $0. Lift is
 * vs full-price-first buyers, not vs the shop blend. Order history only —
 * no spend, no COGS, no pixels.
 *
 * Merchant chrome: promo first, full price first, came back, later order.
 * Never "cohort", "ARPU", "till", or "p25–p75".
 */

import {
  rollUpCustomers,
  type CustomerDepth,
  type DepthOrder,
} from "./ltv-depth";

/** Same 30 / 90 / 365 seals as Product→LTV — copied, not imported, to keep this chunk isolated. */
type PromoWindow = 30 | 90 | 365;

/** Buyers who started the same way before a row is honest. */
export const PROMO_MIN_BUYERS = 8;
/** Named promo cards kept on the board — densest few, not a code dump. */
export const PROMO_MAX_NAMED = 3;

/** First order had discount $ and no code on file. */
export const PROMO_UNNAMED = "Promo first";
/** First order had $0 discount on file. */
export const PROMO_FULL_PRICE = "Full price first";

const DAY_MS = 86_400_000;

export type PromoRowKind = "code" | "unnamed" | "full_price";

function daysBetween(a: Date, b: Date): number {
  return Math.floor((b.getTime() - a.getTime()) / DAY_MS);
}

function mean(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, n) => sum + n, 0) / values.length;
}

function matureForWindow(
  customers: CustomerDepth[],
  asOf: Date,
  days: PromoWindow,
): CustomerDepth[] {
  return customers.filter((c) => daysBetween(c.firstOrderedAt, asOf) >= days);
}

function windowSpend(customer: CustomerDepth, days: PromoWindow): number {
  switch (days) {
    case 30:
      return customer.day30Spend;
    case 90:
      return customer.day90Spend;
    case 365:
      return customer.day365Spend;
    default: {
      const _exhaustive: never = days;
      return _exhaustive;
    }
  }
}

function windowOrders(customer: CustomerDepth, days: PromoWindow): number {
  switch (days) {
    case 30:
      return customer.ordersD30;
    case 90:
      return customer.ordersD90;
    case 365:
      return customer.ordersD365;
    default: {
      const _exhaustive: never = days;
      return _exhaustive;
    }
  }
}

function laterOrderAverage(
  mature: CustomerDepth[],
  days: PromoWindow,
): number | null {
  const later: number[] = [];
  for (const c of mature) {
    const extra = Math.max(0, windowOrders(c, days) - 1);
    if (extra <= 0) continue;
    const extraDollars = Math.max(0, windowSpend(c, days) - c.firstAmount);
    later.push(extraDollars / extra);
  }
  return mean(later);
}

function extraOrderAverage(
  mature: CustomerDepth[],
  days: PromoWindow,
): number | null {
  if (mature.length === 0) return null;
  return mean(mature.map((c) => Math.max(0, windowOrders(c, days) - 1)));
}

function predictedFromParts(
  firstOrder: number | null,
  extraOrders: number | null,
  laterOrder: number | null,
): number | null {
  if (firstOrder == null) return null;
  return firstOrder + (extraOrders ?? 0) * (laterOrder ?? 0);
}

function formulaLine(
  label: string,
  firstOrder: number,
  extraOrders: number,
  laterOrder: number,
  predicted: number,
): string {
  const later = laterOrder > 0 ? laterOrder : 0;
  return (
    `${label} ≈ average first order + average extra orders × average later order` +
    ` → ${firstOrder.toFixed(2)} + ${extraOrders.toFixed(2)} × ${later.toFixed(2)}` +
    ` = ${predicted.toFixed(2)}`
  );
}

function windowLabel(days: PromoWindow): string {
  switch (days) {
    case 30:
      return "First 30 days";
    case 90:
      return "First 90 days";
    case 365:
      return "First year";
    default: {
      const _exhaustive: never = days;
      return _exhaustive;
    }
  }
}

function sealedWindow(
  members: CustomerDepth[],
  asOf: Date,
  days: PromoWindow,
  minMature: number,
): { value: number | null; n: number; comeBack: number | null } {
  const mature = matureForWindow(members, asOf, days);
  if (mature.length < minMature) {
    return { value: null, n: mature.length, comeBack: null };
  }
  let back = 0;
  for (const c of mature) {
    if (c.reorderDays != null && c.reorderDays <= days) back += 1;
  }
  return {
    value: mean(mature.map((c) => windowSpend(c, days))),
    n: mature.length,
    comeBack: back / mature.length,
  };
}

/**
 * First-order promo label. A real code wins. Discount $ without a code is
 * Promo first vs Full price first. Missing fields stay unknown — never a
 * guessed title.
 */
export function firstPromoLabel(customer: CustomerDepth): string | null {
  const code = customer.firstDiscountCode?.trim();
  if (code) return code;
  if (
    customer.firstDiscountAmount != null &&
    Number.isFinite(customer.firstDiscountAmount)
  ) {
    return customer.firstDiscountAmount > 0
      ? PROMO_UNNAMED
      : PROMO_FULL_PRICE;
  }
  return null;
}

export function promoRowKind(promo: string): PromoRowKind {
  if (promo === PROMO_FULL_PRICE) return "full_price";
  if (promo === PROMO_UNNAMED) return "unnamed";
  return "code";
}

function promoGroupKey(label: string): string {
  const kind = promoRowKind(label);
  if (kind === "code") return label.trim().toUpperCase();
  return label;
}

export interface PromoLtvRow {
  promo: string;
  kind: PromoRowKind;
  buyers: number;
  lifetimeLtv: number;
  day30Ltv: number | null;
  day90Ltv: number | null;
  day365Ltv: number | null;
  day30N: number;
  day90N: number;
  day365N: number;
  comeBack30: number | null;
  comeBack90: number | null;
  comeBack365: number | null;
  /** Promo 90-day value ÷ full-price-first 90-day value, when both sealed. */
  lift90: number | null;
  /** Promo year value ÷ full-price-first year value, when both sealed. */
  lift365: number | null;
  firstOrder90: number | null;
  extraOrders90: number | null;
  laterOrder90: number | null;
  predicted90: number | null;
  observed90: number | null;
  formula90: string | null;
}

export interface PromoLtvRead {
  promo: string;
  kind: PromoRowKind;
  worth: number;
  worthDays: PromoWindow;
  worthLabel: string;
  buyers: number;
  comeBack: number | null;
  lift: number | null;
  yearPending: boolean;
  estimate: number | null;
  observed: number | null;
}

export type PromoEmptyKind = "syncing" | "discounts" | "thin" | "young";

export interface PromoEmpty {
  kind: PromoEmptyKind;
  buyers: number;
  knownBuyers: number;
  promoBuyers: number;
  need: number;
  copy: string;
  verb: string;
}

export interface PromoLtvView {
  /** Discount $ was on at least one order (0 counts — the field is known). */
  discountsKnown: boolean;
  /** A real discount code / title was on at least one order. */
  codesKnown: boolean;
  buyers: number;
  knownBuyers: number;
  promoBuyers: number;
  fullPriceBuyers: number;
  fullPrice90: number | null;
  fullPrice365: number | null;
  rows: PromoLtvRow[];
  best: PromoLtvRow | null;
  read: PromoLtvRead | null;
  empty: PromoEmpty | null;
}

function sortPromoRows(rows: PromoLtvRow[]): PromoLtvRow[] {
  return [...rows].sort((a, b) => {
    if (a.kind === "full_price" && b.kind !== "full_price") return 1;
    if (b.kind === "full_price" && a.kind !== "full_price") return -1;
    if (a.day90Ltv != null && b.day90Ltv != null && a.day90Ltv !== b.day90Ltv) {
      return b.day90Ltv - a.day90Ltv;
    }
    if (a.day90Ltv != null && b.day90Ltv == null) return -1;
    if (a.day90Ltv == null && b.day90Ltv != null) return 1;
    if (a.day30Ltv != null && b.day30Ltv != null && a.day30Ltv !== b.day30Ltv) {
      return b.day30Ltv - a.day30Ltv;
    }
    if (a.day365Ltv != null && b.day365Ltv != null && a.day365Ltv !== b.day365Ltv) {
      return b.day365Ltv - a.day365Ltv;
    }
    if (a.lifetimeLtv !== b.lifetimeLtv) return b.lifetimeLtv - a.lifetimeLtv;
    return b.buyers - a.buyers;
  });
}

function promoDailyRead(best: PromoLtvRow | null): PromoLtvRead | null {
  if (!best) return null;
  const prefer: Array<{
    days: PromoWindow;
    value: number | null;
    comeBack: number | null;
    lift: number | null;
    n: number;
  }> = [
    {
      days: 90,
      value: best.day90Ltv,
      comeBack: best.comeBack90,
      lift: best.lift90,
      n: best.day90N,
    },
    {
      days: 30,
      value: best.day30Ltv,
      comeBack: best.comeBack30,
      lift: null,
      n: best.day30N,
    },
    {
      days: 365,
      value: best.day365Ltv,
      comeBack: best.comeBack365,
      lift: best.lift365,
      n: best.day365N,
    },
  ];
  const pick = prefer.find((p) => p.value != null);
  if (!pick || pick.value == null) return null;
  return {
    promo: best.promo,
    kind: best.kind,
    worth: pick.value,
    worthDays: pick.days,
    worthLabel: windowLabel(pick.days),
    buyers: pick.n,
    comeBack: pick.comeBack,
    lift: pick.lift,
    yearPending: best.day365Ltv == null,
    estimate: pick.days === 90 ? best.predicted90 : null,
    observed: pick.days === 90 ? best.observed90 : null,
  };
}

/**
 * First-win empty when no promo window has sealed. Never a blank chart.
 * Discounts / thin / young / syncing — not $0 LTV. Names what is needed
 * for titles / codes instead of inventing them.
 */
export function promoLtvEmptyState(input: {
  buyers: number;
  knownBuyers: number;
  promoBuyers: number;
  discountsKnown: boolean;
  sealed: boolean;
  need?: number;
}): PromoEmpty | null {
  const need = input.need ?? PROMO_MIN_BUYERS;
  if (input.sealed) return null;
  if (input.buyers <= 0) {
    return {
      kind: "syncing",
      buyers: 0,
      knownBuyers: 0,
      promoBuyers: 0,
      need,
      copy: "Orders still syncing — not $0. Promo value fills once first-order discount $ (and codes when they land) are on file and those buyers have lived 30 days.",
      verb: "Refresh this page",
    };
  }
  if (!input.discountsKnown || input.knownBuyers <= 0) {
    return {
      kind: "discounts",
      buyers: input.buyers,
      knownBuyers: 0,
      promoBuyers: 0,
      need,
      copy: `${input.buyers.toLocaleString()} identified ${input.buyers === 1 ? "buyer" : "buyers"} on file. Discount $ and codes are not on this shop’s stored orders — promo → LTV waits for first-order discount amounts, then titles/codes when Shopify sends them. Not $0.`,
      verb: "Wait for discount fields",
    };
  }
  if (input.promoBuyers < need) {
    return {
      kind: "thin",
      buyers: input.buyers,
      knownBuyers: input.knownBuyers,
      promoBuyers: input.promoBuyers,
      need,
      copy: `${input.promoBuyers.toLocaleString()} ${input.promoBuyers === 1 ? "buyer" : "buyers"} started with a promo. A promo row seals after ${need} have lived 30 days — not $0.`,
      verb: "Watch first 30 days",
    };
  }
  return {
    kind: "young",
    buyers: input.buyers,
    knownBuyers: input.knownBuyers,
    promoBuyers: input.promoBuyers,
    need,
    copy: `${input.promoBuyers.toLocaleString()} promo-first buyers on file. First 30 days seals once those buyers have lived 30 days — not $0.`,
    verb: "Wait for day 30",
  };
}

function summarizePromo(
  promo: string,
  members: CustomerDepth[],
  asOf: Date,
  fullPrice90: number | null,
  fullPrice365: number | null,
  minMature: number,
): PromoLtvRow | null {
  if (members.length < minMature) return null;
  const d30 = sealedWindow(members, asOf, 30, minMature);
  const d90 = sealedWindow(members, asOf, 90, minMature);
  const d365 = sealedWindow(members, asOf, 365, minMature);
  const lifetime = mean(members.map((c) => c.lifetimeSpend));
  if (lifetime == null) return null;

  const mature90 = matureForWindow(members, asOf, 90);
  const firstOrder90 =
    mature90.length >= minMature ? mean(mature90.map((c) => c.firstAmount)) : null;
  const extraOrders90 =
    mature90.length >= minMature ? extraOrderAverage(mature90, 90) : null;
  const laterOrder90 =
    mature90.length >= minMature ? laterOrderAverage(mature90, 90) : null;
  const predicted90 =
    mature90.length >= minMature
      ? predictedFromParts(firstOrder90, extraOrders90, laterOrder90)
      : null;
  const observed90 =
    mature90.length >= minMature
      ? mean(mature90.map((c) => c.day90Spend))
      : null;
  const kind = promoRowKind(promo);
  const vsFull90 = kind !== "full_price" ? fullPrice90 : null;
  const vsFull365 = kind !== "full_price" ? fullPrice365 : null;

  return {
    promo,
    kind,
    buyers: members.length,
    lifetimeLtv: lifetime,
    day30Ltv: d30.value,
    day90Ltv: d90.value,
    day365Ltv: d365.value,
    day30N: d30.n,
    day90N: d90.n,
    day365N: d365.n,
    comeBack30: d30.comeBack,
    comeBack90: d90.comeBack,
    comeBack365: d365.comeBack,
    lift90:
      d90.value != null && vsFull90 != null && vsFull90 > 0
        ? d90.value / vsFull90
        : null,
    lift365:
      d365.value != null && vsFull365 != null && vsFull365 > 0
        ? d365.value / vsFull365
        : null,
    firstOrder90,
    extraOrders90,
    laterOrder90,
    predicted90,
    observed90,
    formula90:
      predicted90 != null &&
      firstOrder90 != null &&
      extraOrders90 != null
        ? formulaLine(
            "First 90 days",
            firstOrder90,
            extraOrders90,
            laterOrder90 ?? 0,
            predicted90,
          )
        : null,
  };
}

function pickBoardRows(ranked: PromoLtvRow[]): PromoLtvRow[] {
  const named = ranked
    .filter((row) => row.kind !== "full_price")
    .slice(0, PROMO_MAX_NAMED);
  const full = ranked.find((row) => row.kind === "full_price") ?? null;
  return full ? [...named, full] : named;
}

/**
 * First-order promo → observed LTV / lift vs full-price first.
 * Rows below {@link PROMO_MIN_BUYERS} drop out. Windows stay null until
 * enough of those starters have lived the window — never a fake year.
 * Codes are never invented from discount $.
 */
export function buildPromoLtv(
  orders: DepthOrder[],
  asOf: Date,
  options?: { minBuyers?: number },
): PromoLtvView {
  const minBuyers = options?.minBuyers ?? PROMO_MIN_BUYERS;
  const customers = rollUpCustomers(orders);
  const discountsKnown = orders.some(
    (o) =>
      (o.discountAmount != null && Number.isFinite(o.discountAmount)) ||
      Boolean(o.discountCode?.trim()),
  );
  const codesKnown = orders.some((o) => Boolean(o.discountCode?.trim()));

  const groups = new Map<string, { label: string; members: CustomerDepth[] }>();
  let knownBuyers = 0;
  let promoBuyers = 0;
  let fullPriceBuyers = 0;
  for (const c of customers) {
    const label = firstPromoLabel(c);
    if (!label) continue;
    knownBuyers += 1;
    const kind = promoRowKind(label);
    if (kind === "full_price") fullPriceBuyers += 1;
    else promoBuyers += 1;
    const key = promoGroupKey(label);
    const hit = groups.get(key);
    if (hit) hit.members.push(c);
    else groups.set(key, { label, members: [c] });
  }

  const fullMembers =
    groups.get(promoGroupKey(PROMO_FULL_PRICE))?.members ?? [];
  const fullPrice90 = sealedWindow(fullMembers, asOf, 90, minBuyers).value;
  const fullPrice365 = sealedWindow(fullMembers, asOf, 365, minBuyers).value;

  const rows: PromoLtvRow[] = [];
  for (const { label, members } of groups.values()) {
    const row = summarizePromo(
      label,
      members,
      asOf,
      fullPrice90,
      fullPrice365,
      minBuyers,
    );
    if (row) rows.push(row);
  }
  const ranked = sortPromoRows(rows);
  const board = pickBoardRows(ranked);
  const best =
    board.find(
      (row) =>
        row.kind !== "full_price" &&
        (row.day90Ltv != null || row.day30Ltv != null || row.day365Ltv != null),
    ) ?? null;
  const read = promoDailyRead(best);
  const empty = promoLtvEmptyState({
    buyers: customers.length,
    knownBuyers,
    promoBuyers,
    discountsKnown,
    sealed: read != null,
    need: minBuyers,
  });

  return {
    discountsKnown,
    codesKnown,
    buyers: customers.length,
    knownBuyers,
    promoBuyers,
    fullPriceBuyers,
    fullPrice90,
    fullPrice365,
    rows: board,
    best,
    read,
    empty,
  };
}
