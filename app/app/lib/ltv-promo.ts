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
 * Discount depth (Light / Typical / Deep) uses the first order only:
 * discount $ ÷ (pre-refund total + discount $). A code name is not a percent.
 * Buyers missing the pre-refund total stay on the promo row and out of a band.
 *
 * Merchant chrome: promo first, full price first, came back, later order.
 * Never "cohort", "ARPU", "till", or "p25–p75".
 */

import {
  rollUpCustomers,
  type CustomerDepth,
  type DepthOrder,
} from "./ltv-depth";
import { paintedYearDollars } from "./ltv-year-honesty";

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

/** First-order discount share cuts. Not terciles, and not the digits in a code. */
export const PROMO_DEPTH_LIGHT_MAX = 0.15;
export const PROMO_DEPTH_TYPICAL_MAX = 0.3;

export type PromoDepthBand = "light" | "typical" | "deep";

const DEPTH_BANDS: PromoDepthBand[] = ["light", "typical", "deep"];

/**
 * First-order discount share. Pre-refund total is `grossAmount` /
 * `totalPriceSet`. Null when either side is missing or the denominator is 0.
 */
export function firstOrderDiscountShare(
  discountAmount: number,
  preRefundTotal: number,
): number | null {
  if (!Number.isFinite(discountAmount) || !Number.isFinite(preRefundTotal)) {
    return null;
  }
  if (discountAmount < 0 || preRefundTotal < 0) return null;
  const denom = preRefundTotal + discountAmount;
  if (!(denom > 0)) return null;
  return discountAmount / denom;
}

/** Light under 15%, Typical 15% to under 30%, Deep 30% or more. Zero is not a band. */
export function promoDepthBand(share: number): PromoDepthBand | null {
  if (!Number.isFinite(share) || !(share > 0)) return null;
  if (share < PROMO_DEPTH_LIGHT_MAX) return "light";
  if (share < PROMO_DEPTH_TYPICAL_MAX) return "typical";
  return "deep";
}

export function promoDepthLabel(band: PromoDepthBand): string {
  switch (band) {
    case "light":
      return "Light";
    case "typical":
      return "Typical";
    case "deep":
      return "Deep";
    default: {
      const _exhaustive: never = band;
      return _exhaustive;
    }
  }
}

export function promoDepthCut(band: PromoDepthBand): string {
  switch (band) {
    case "light":
      return "Under 15% off the first order";
    case "typical":
      return "15% to under 30% off the first order";
    case "deep":
      return "30% or more off the first order";
    default: {
      const _exhaustive: never = band;
      return _exhaustive;
    }
  }
}

/** Named-code card line. Omitted by the caller when fewer than 8 shares are known. */
export function promoMedianOffCopy(share: number): string {
  return `about ${Math.round(share * 100)}% off the first order`;
}

const DAY_MS = 86_400_000;

export type PromoRowKind = "code" | "unnamed" | "full_price";

function daysBetween(a: Date, b: Date): number {
  return Math.floor((b.getTime() - a.getTime()) / DAY_MS);
}

function mean(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, n) => sum + n, 0) / values.length;
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1]! + sorted[mid]!) / 2
    : sorted[mid]!;
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

function windowGross(
  customer: CustomerDepth,
  days: PromoWindow,
): number | null {
  switch (days) {
    case 30:
      return customer.day30Gross;
    case 90:
      return customer.day90Gross;
    case 365:
      return customer.day365Gross;
    default: {
      const _exhaustive: never = days;
      return _exhaustive;
    }
  }
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
  const raw = mean(mature.map((c) => windowSpend(c, days)));
  return {
    value: days === 365 ? paintedYearDollars(raw) : raw,
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
  /**
   * Median first-order discount share for a named code, when at least
   * {@link PROMO_MIN_BUYERS} starters have a known share. Null otherwise.
   * Never read off the code name.
   */
  medianFirstShare: number | null;
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
  /** Shop history is capped — first year on this board stays a dash. */
  historyLimited: boolean;
  /** Light / Typical / Deep rows with at least the buyer floor. */
  depthBands: PromoDepthRow[];
  /** Which sealed depth is worth the most. 90 days, else 30. Never a second hero. */
  depthLine: PromoDepthLine | null;
  /** Depth cannot seal, or the pre-refund total is not on file. */
  depthEmpty: PromoDepthEmpty | null;
  /** First orders with discount $ above 0 and no pre-refund total. */
  depthAwaitingGross: number;
}

export interface PromoDepthRow {
  band: PromoDepthBand;
  label: string;
  cut: string;
  buyers: number;
  day30Ltv: number | null;
  day90Ltv: number | null;
  day365Ltv: number | null;
  day30N: number;
  day90N: number;
  day365N: number;
  comeBack30: number | null;
  comeBack90: number | null;
  comeBack365: number | null;
  lift30: number | null;
  lift90: number | null;
  lift365: number | null;
  afterRefunds30: boolean;
  afterRefunds90: boolean;
  afterRefunds365: boolean;
  /**
   * Share of orders after the first, inside 90 days, whose discount $ is 0.
   * Only later orders with a known discount field. Null until 90 days seals
   * or when none of those later orders have a discount field.
   */
  laterFullPrice90: number | null;
}

export interface PromoDepthLine {
  band: PromoDepthBand;
  label: string;
  worth: number;
  worthDays: 30 | 90;
  worthLabel: string;
  buyers: number;
  comeBack: number | null;
  lift: number | null;
  afterRefunds: boolean;
}

export type PromoDepthEmptyKind = "gross" | "thin" | "young";

export interface PromoDepthEmpty {
  kind: PromoDepthEmptyKind;
  buyers: number;
  need: number;
  copy: string;
  verb: string;
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

function medianFirstShare(
  members: CustomerDepth[],
  minKnown: number,
): number | null {
  const shares: number[] = [];
  for (const c of members) {
    if (c.firstDiscountAmount == null || c.firstGrossAmount == null) continue;
    const share = firstOrderDiscountShare(
      c.firstDiscountAmount,
      c.firstGrossAmount,
    );
    if (share == null) continue;
    shares.push(share);
  }
  if (shares.length < minKnown) return null;
  return median(shares);
}

function summarizePromo(
  promo: string,
  members: CustomerDepth[],
  asOf: Date,
  fullPrice90: number | null,
  fullPrice365: number | null,
  minMature: number,
  historyLimited: boolean,
): PromoLtvRow | null {
  if (members.length < minMature) return null;
  const d30 = sealedWindow(members, asOf, 30, minMature);
  const d90 = sealedWindow(members, asOf, 90, minMature);
  const d365 = historyLimited
    ? { value: null, n: 0, comeBack: null }
    : sealedWindow(members, asOf, 365, minMature);
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
  const medianShare =
    kind === "code" ? medianFirstShare(members, minMature) : null;

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
    medianFirstShare: medianShare,
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
  options?: { minBuyers?: number; historyLimited?: boolean },
): PromoLtvView {
  const minBuyers = options?.minBuyers ?? PROMO_MIN_BUYERS;
  const historyLimited = Boolean(options?.historyLimited);
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
  const fullPrice30 = sealedWindow(fullMembers, asOf, 30, minBuyers).value;
  const fullPrice90 = sealedWindow(fullMembers, asOf, 90, minBuyers).value;
  const fullPrice365 = historyLimited
    ? null
    : sealedWindow(fullMembers, asOf, 365, minBuyers).value;

  const rows: PromoLtvRow[] = [];
  for (const { label, members } of groups.values()) {
    const row = summarizePromo(
      label,
      members,
      asOf,
      fullPrice90,
      fullPrice365,
      minBuyers,
      historyLimited,
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
  const depth = buildPromoDepth({
    customers,
    orders,
    asOf,
    minBuyers,
    historyLimited,
    discountsKnown,
    fullPrice30,
    fullPrice90,
    fullPrice365,
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
    historyLimited,
    depthBands: depth.bands,
    depthLine: depth.line,
    depthEmpty: depth.empty,
    depthAwaitingGross: depth.awaitingGross,
  };
}

type DepthSlot = PromoDepthBand | "baseline" | "awaiting" | "unknown";

function depthSlot(customer: CustomerDepth): DepthSlot {
  const discount = customer.firstDiscountAmount;
  if (discount == null || !Number.isFinite(discount) || discount < 0) {
    return "unknown";
  }
  if (discount === 0) return "baseline";
  const gross = customer.firstGrossAmount;
  if (gross == null || !Number.isFinite(gross) || gross < 0) return "awaiting";
  const share = firstOrderDiscountShare(discount, gross);
  if (share == null) return "awaiting";
  const band = promoDepthBand(share);
  return band ?? "awaiting";
}

function ordersByCustomer(orders: DepthOrder[]): Map<string, DepthOrder[]> {
  const map = new Map<string, DepthOrder[]>();
  for (const order of orders) {
    if (!order.customerKey || !Number.isFinite(order.amount)) continue;
    const list = map.get(order.customerKey) ?? [];
    list.push(order);
    map.set(order.customerKey, list);
  }
  for (const list of map.values()) {
    list.sort((a, b) => a.orderedAt.getTime() - b.orderedAt.getTime());
  }
  return map;
}

function windowAfterRefunds(
  members: CustomerDepth[],
  asOf: Date,
  days: PromoWindow,
  minMature: number,
): boolean {
  const mature = matureForWindow(members, asOf, days);
  if (mature.length < minMature) return false;
  return mature.every((c) => windowGross(c, days) != null);
}

/**
 * Among sealed 90-day starters, orders after the first that fall inside 90
 * days and have a known discount field. Share whose discount $ is 0.
 */
function laterFullPriceShare(
  members: CustomerDepth[],
  byCustomer: Map<string, DepthOrder[]>,
  asOf: Date,
  minMature: number,
): number | null {
  const mature = matureForWindow(members, asOf, 90);
  if (mature.length < minMature) return null;
  let known = 0;
  let full = 0;
  for (const customer of mature) {
    const list = byCustomer.get(customer.customerKey);
    if (!list || list.length < 2) continue;
    const firstMs = customer.firstOrderedAt.getTime();
    let skippedFirst = false;
    for (const order of list) {
      const delta = order.orderedAt.getTime() - firstMs;
      if (delta < 0) continue;
      if (!skippedFirst) {
        skippedFirst = true;
        continue;
      }
      if (delta > 90 * DAY_MS) continue;
      if (order.discountAmount == null || !Number.isFinite(order.discountAmount)) {
        continue;
      }
      known += 1;
      if (order.discountAmount === 0) full += 1;
    }
  }
  if (known === 0) return null;
  return full / known;
}

function summarizeDepth(
  band: PromoDepthBand,
  members: CustomerDepth[],
  byCustomer: Map<string, DepthOrder[]>,
  asOf: Date,
  fullPrice30: number | null,
  fullPrice90: number | null,
  fullPrice365: number | null,
  minMature: number,
  historyLimited: boolean,
): PromoDepthRow {
  const d30 = sealedWindow(members, asOf, 30, minMature);
  const d90 = sealedWindow(members, asOf, 90, minMature);
  const d365 = historyLimited
    ? { value: null, n: 0, comeBack: null }
    : sealedWindow(members, asOf, 365, minMature);
  const lift = (value: number | null, baseline: number | null) =>
    value != null && baseline != null && baseline > 0 ? value / baseline : null;
  return {
    band,
    label: promoDepthLabel(band),
    cut: promoDepthCut(band),
    buyers: members.length,
    day30Ltv: d30.value,
    day90Ltv: d90.value,
    day365Ltv: d365.value,
    day30N: d30.n,
    day90N: d90.n,
    day365N: d365.n,
    comeBack30: d30.comeBack,
    comeBack90: d90.comeBack,
    comeBack365: d365.comeBack,
    lift30: lift(d30.value, fullPrice30),
    lift90: lift(d90.value, fullPrice90),
    lift365: lift(d365.value, fullPrice365),
    afterRefunds30: windowAfterRefunds(members, asOf, 30, minMature),
    afterRefunds90: windowAfterRefunds(members, asOf, 90, minMature),
    afterRefunds365: historyLimited
      ? false
      : windowAfterRefunds(members, asOf, 365, minMature),
    laterFullPrice90: laterFullPriceShare(members, byCustomer, asOf, minMature),
  };
}

function depthMorning(rows: PromoDepthRow[]): PromoDepthLine | null {
  const at90 = rows.filter((row) => row.day90Ltv != null);
  const use90 = at90.length > 0;
  const pool = use90 ? at90 : rows.filter((row) => row.day30Ltv != null);
  if (pool.length === 0) return null;
  const best = [...pool].sort((a, b) => {
    const av = (use90 ? a.day90Ltv : a.day30Ltv) ?? 0;
    const bv = (use90 ? b.day90Ltv : b.day30Ltv) ?? 0;
    if (av !== bv) return bv - av;
    return b.buyers - a.buyers;
  })[0];
  if (!best) return null;
  const days: 30 | 90 = use90 ? 90 : 30;
  const worth = days === 90 ? best.day90Ltv : best.day30Ltv;
  if (worth == null) return null;
  return {
    band: best.band,
    label: best.label,
    worth,
    worthDays: days,
    worthLabel: windowLabel(days),
    buyers: days === 90 ? best.day90N : best.day30N,
    comeBack: days === 90 ? best.comeBack90 : best.comeBack30,
    lift: days === 90 ? best.lift90 : best.lift30,
    afterRefunds: days === 90 ? best.afterRefunds90 : best.afterRefunds30,
  };
}

/**
 * Depth that cannot seal. Gross waits for the pre-refund total. Thin / young
 * use the same buyer floor as promo rows. A sealed line returns null.
 */
export function promoDepthEmptyState(input: {
  discountsKnown: boolean;
  sealed: boolean;
  classifiable: number;
  awaitingGross: number;
  bandReady: boolean;
  need?: number;
}): PromoDepthEmpty | null {
  const need = input.need ?? PROMO_MIN_BUYERS;
  if (!input.discountsKnown || input.sealed) return null;
  if (input.classifiable <= 0 && input.awaitingGross <= 0) return null;
  if (input.classifiable <= 0) {
    const n = input.awaitingGross;
    return {
      kind: "gross",
      buyers: n,
      need,
      copy: `${n.toLocaleString()} first ${n === 1 ? "order has" : "orders have"} a discount $, but the pre-refund total is not on file. Light (under 15%), Typical (15% to under 30%), and Deep (30% or more) wait for that total. The percent is not invented. Not $0.`,
      verb: "Wait for the pre-refund total",
    };
  }
  if (!input.bandReady) {
    const n = input.classifiable;
    return {
      kind: "thin",
      buyers: n,
      need,
      copy: `${n.toLocaleString()} first ${n === 1 ? "order has" : "orders have"} a known discount depth. A band seals after ${need} buyers in the same cut — under 15%, 15% to under 30%, or 30% or more — have lived 30 days. Not $0.`,
      verb: "Watch first 30 days",
    };
  }
  return {
    kind: "young",
    buyers: input.classifiable,
    need,
    copy: `${input.classifiable.toLocaleString()} buyers are in a first-order discount band. First 30 days seals once ${need} of them have lived 30 days. Not $0.`,
    verb: "Wait for day 30",
  };
}

function buildPromoDepth(input: {
  customers: CustomerDepth[];
  orders: DepthOrder[];
  asOf: Date;
  minBuyers: number;
  historyLimited: boolean;
  discountsKnown: boolean;
  fullPrice30: number | null;
  fullPrice90: number | null;
  fullPrice365: number | null;
}): {
  bands: PromoDepthRow[];
  line: PromoDepthLine | null;
  empty: PromoDepthEmpty | null;
  awaitingGross: number;
} {
  if (!input.discountsKnown) {
    return { bands: [], line: null, empty: null, awaitingGross: 0 };
  }
  const grouped = new Map<PromoDepthBand, CustomerDepth[]>();
  for (const band of DEPTH_BANDS) grouped.set(band, []);
  let classifiable = 0;
  let awaitingGross = 0;
  for (const customer of input.customers) {
    const slot = depthSlot(customer);
    if (slot === "awaiting") {
      awaitingGross += 1;
      continue;
    }
    if (slot === "baseline" || slot === "unknown") continue;
    classifiable += 1;
    const members = grouped.get(slot);
    if (members) members.push(customer);
  }
  const indexed = ordersByCustomer(input.orders);
  const bands: PromoDepthRow[] = [];
  let bandReady = false;
  for (const band of DEPTH_BANDS) {
    const members = grouped.get(band) ?? [];
    if (members.length < input.minBuyers) continue;
    bandReady = true;
    bands.push(
      summarizeDepth(
        band,
        members,
        indexed,
        input.asOf,
        input.fullPrice30,
        input.fullPrice90,
        input.fullPrice365,
        input.minBuyers,
        input.historyLimited,
      ),
    );
  }
  const line = depthMorning(bands);
  return {
    bands,
    line,
    empty: promoDepthEmptyState({
      discountsKnown: true,
      sealed: line != null,
      classifiable,
      awaitingGross,
      bandReady,
      need: input.minBuyers,
    }),
    awaitingGross,
  };
}
