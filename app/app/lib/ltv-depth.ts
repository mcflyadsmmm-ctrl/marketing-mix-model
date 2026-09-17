/**
 * LTV depth engine — the order-history depth Shopify Analytics never puts on
 * one screen. Pure and Prisma-free so every number is unit-tested away from
 * the loader: how a customer's spend builds month by month, who is still
 * ordering, which first→second product journeys are worth the most, what a
 * first order size becomes, and who the best customers are (and when they last
 * ordered).
 *
 * Order history only — no spend, no ROAS, no email lists. Inputs are opaque
 * order rows ({@link DepthOrder}); the SAMPLE Snowdevil book carries product
 * names, live rows do not (product journeys quietly drop out when unknown).
 *
 * Merchant-chrome word bans (LIVING_BOARD): no "cohort", "ARPU", "till",
 * "p25–p75". Internally these are first-order-month groups and per-customer
 * averages; the UI says them in shop-owner English.
 */

/** One order in the depth window — opaque customer, optional product name. */
export interface DepthOrder {
  /** Opaque customer id. Guests (repeat-unknowable) must be filtered upstream. */
  customerKey: string;
  orderedAt: Date;
  /** Net shop dollars for the order. */
  amount: number;
  /** Items on the order (≥ 1). Falls back to 1 when unknown. */
  units: number;
  /** Product name on the first line — SAMPLE only; null when Shopify hid titles. */
  product: string | null;
  /**
   * Gross shop dollars before refunds, when known. SAMPLE can carry this so
   * refund honesty is a real haircut. Live OrderFacts store net only
   * (`currentTotalPriceSet`) — leave unset rather than invent a gross.
   */
  grossAmount?: number;
}

/** Whole-month follow-up windows shown across the retention grid and curves. */
export const DEPTH_MAX_OFFSET = 12;
/** Best-customer (whale) slice — the top spenders by lifetime dollars. */
export const WHALE_DECILE = 0.1;
/** Identified buyers before best-customer concentration is honest to show. */
export const WHALE_MIN_BUYERS = 20;
/** Buyers before a first→second product journey earns a row. */
export const PATH_MIN_BUYERS = 5;
/** Journeys kept in the table — the densest few, biggest first. */
export const PATH_MAX_ROWS = 12;
/** Buyers in a first-order size band before it earns a row. */
export const TIER_MIN_BUYERS = 8;
/** First-order-month groups drawn as spend-build curves (most recent). */
export const CURVE_MAX_SERIES = 8;
/** A curve needs at least this many month points to be a build, not a dot. */
export const CURVE_MIN_POINTS = 3;

/** Elapsed whole months from `first` to `other` (calendar, UTC). */
export function monthsSince(first: Date, other: Date): number {
  let months =
    (other.getUTCFullYear() - first.getUTCFullYear()) * 12 +
    (other.getUTCMonth() - first.getUTCMonth());
  if (other.getUTCDate() < first.getUTCDate()) months -= 1;
  return months;
}

function monthKey(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function monthStartUtc(monthKeyStr: string): Date {
  const [y, m] = monthKeyStr.split("-").map(Number);
  return new Date(Date.UTC(y!, (m ?? 1) - 1, 1));
}

/** "2025-08" → "Aug '25" for merchant chrome. */
export function monthLabel(monthKeyStr: string): string {
  const [y, m] = monthKeyStr.split("-").map(Number);
  if (!y || !m) return monthKeyStr;
  const name = new Date(Date.UTC(y, m - 1, 1)).toLocaleString("en-US", {
    month: "short",
    timeZone: "UTC",
  });
  return `${name} '${String(y).slice(2)}`;
}

function daysBetween(a: Date, b: Date): number {
  return Math.floor((b.getTime() - a.getTime()) / 86_400_000);
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1]! + sorted[mid]!) / 2
    : sorted[mid]!;
}

/** Per-customer roll-up from their ordered timeline (first order defines the group). */
export interface CustomerDepth {
  customerKey: string;
  cohortMonth: string;
  firstOrderedAt: Date;
  lastOrderedAt: Date;
  orderCount: number;
  firstAmount: number;
  firstUnits: number;
  firstProduct: string | null;
  secondProduct: string | null;
  lifetimeSpend: number;
  day30Spend: number;
  day90Spend: number;
  day365Spend: number;
  /** Orders whose day-delta from first falls in each window (first counts). */
  ordersD30: number;
  ordersD90: number;
  ordersD365: number;
  /** Days from first order to second, or null when they never came back. */
  reorderDays: number | null;
  /**
   * Σ max(0, gross − net) when an order carried a known gross. 0 when every
   * order omitted gross — do not read that as “$0 refunds.”
   */
  refundedSpend: number;
  /** Whole-month offset → dollars in that follow-up window. */
  spendByOffset: Map<number, number>;
  /** Whole-month offsets with at least one order (0 always present). */
  activeOffsets: Set<number>;
}

/**
 * Fold order rows into per-customer timelines. Orders are sorted so the first
 * order anchors the first-order month and the 30/90/365-day and month-offset
 * windows. A customer with no non-guest orders never appears.
 */
export function rollUpCustomers(orders: DepthOrder[]): CustomerDepth[] {
  const byCustomer = new Map<string, DepthOrder[]>();
  for (const o of orders) {
    if (!o.customerKey) continue;
    if (!Number.isFinite(o.amount)) continue;
    const list = byCustomer.get(o.customerKey) ?? [];
    list.push(o);
    byCustomer.set(o.customerKey, list);
  }

  const out: CustomerDepth[] = [];
  for (const list of byCustomer.values()) {
    list.sort((a, b) => a.orderedAt.getTime() - b.orderedAt.getTime());
    const first = list[0]!;
    const firstMs = first.orderedAt.getTime();
    const spendByOffset = new Map<number, number>();
    const activeOffsets = new Set<number>();
    let lifetimeSpend = 0;
    let day30 = 0;
    let day90 = 0;
    let day365 = 0;
    let ordersD30 = 0;
    let ordersD90 = 0;
    let ordersD365 = 0;
    let refundedSpend = 0;
    let last = first.orderedAt;
    let reorderDays: number | null = null;
    for (const o of list) {
      const amount = Number.isFinite(o.amount) ? Math.max(0, o.amount) : 0;
      const deltaDays = (o.orderedAt.getTime() - firstMs) / 86_400_000;
      if (deltaDays < 0) continue;
      lifetimeSpend += amount;
      if (deltaDays <= 30) {
        day30 += amount;
        ordersD30 += 1;
      }
      if (deltaDays <= 90) {
        day90 += amount;
        ordersD90 += 1;
      }
      if (deltaDays <= 365) {
        day365 += amount;
        ordersD365 += 1;
      }
      if (
        o.grossAmount != null &&
        Number.isFinite(o.grossAmount) &&
        o.grossAmount > amount
      ) {
        refundedSpend += o.grossAmount - amount;
      }
      const offset = monthsSince(first.orderedAt, o.orderedAt);
      spendByOffset.set(offset, (spendByOffset.get(offset) ?? 0) + amount);
      activeOffsets.add(offset);
      if (o.orderedAt > last) last = o.orderedAt;
    }
    const second = list[1] ?? null;
    if (second) {
      reorderDays = Math.max(
        0,
        Math.floor((second.orderedAt.getTime() - firstMs) / 86_400_000),
      );
    }
    out.push({
      customerKey: first.customerKey,
      cohortMonth: monthKey(first.orderedAt),
      firstOrderedAt: first.orderedAt,
      lastOrderedAt: last,
      orderCount: list.length,
      firstAmount: Math.max(0, first.amount),
      firstUnits: first.units > 0 ? Math.trunc(first.units) : 1,
      firstProduct: first.product,
      secondProduct: second?.product ?? null,
      lifetimeSpend,
      day30Spend: day30,
      day90Spend: day90,
      day365Spend: day365,
      ordersD30,
      ordersD90,
      ordersD365,
      reorderDays,
      refundedSpend,
      spendByOffset,
      activeOffsets,
    });
  }
  return out;
}

// —— Spend-build curves (cumulative $/customer by month offset) ——————————————

export interface CohortCurvePoint {
  offset: number;
  /** Cumulative average dollars per customer through this month offset. */
  cumPerCustomer: number;
}

export interface CohortCurveSeries {
  cohortMonth: string;
  label: string;
  customers: number;
  points: CohortCurvePoint[];
}

export interface CohortCurves {
  series: CohortCurveSeries[];
  maxOffset: number;
  maxValue: number;
}

/**
 * Cumulative dollars per customer at each fully-elapsed month offset, one line
 * per first-order month. A month offset is only plotted once it has fully
 * elapsed for that group as of `asOf` — younger months simply stop early
 * (honest short, never a sealed $0 tail). Returns null when no group has
 * enough elapsed months to be a build.
 */
export function cohortLtvCurves(
  customers: CustomerDepth[],
  asOf: Date,
  options?: { maxOffset?: number; maxSeries?: number },
): CohortCurves | null {
  const maxOffset = options?.maxOffset ?? DEPTH_MAX_OFFSET;
  const maxSeries = options?.maxSeries ?? CURVE_MAX_SERIES;
  const groups = groupByCohort(customers);
  const series: CohortCurveSeries[] = [];
  let maxValue = 0;

  for (const [cohortMonth, members] of groups) {
    if (members.length === 0) continue;
    const elapsed = monthsSince(monthStartUtc(cohortMonth), asOf);
    const lastFull = Math.min(maxOffset, elapsed - 1);
    if (lastFull < CURVE_MIN_POINTS - 1) continue;
    const points: CohortCurvePoint[] = [];
    let running = 0;
    for (let k = 0; k <= lastFull; k += 1) {
      let windowSum = 0;
      for (const c of members) windowSum += c.spendByOffset.get(k) ?? 0;
      running += windowSum;
      const cumPerCustomer = running / members.length;
      points.push({ offset: k, cumPerCustomer });
      if (cumPerCustomer > maxValue) maxValue = cumPerCustomer;
    }
    if (points.length < CURVE_MIN_POINTS) continue;
    series.push({
      cohortMonth,
      label: monthLabel(cohortMonth),
      customers: members.length,
      points,
    });
  }

  if (series.length === 0) return null;
  series.sort((a, b) => a.cohortMonth.localeCompare(b.cohortMonth));
  const kept = series.slice(-maxSeries);
  const maxOffsetShown = kept.reduce(
    (m, s) => Math.max(m, s.points[s.points.length - 1]?.offset ?? 0),
    0,
  );
  return { series: kept, maxOffset: maxOffsetShown, maxValue };
}

// —— Retention heat (% still ordering by month offset) ————————————————————————

export interface RetentionRow {
  cohortMonth: string;
  label: string;
  customers: number;
  /** Share (0–1) of the group's customers who ordered in each month offset. */
  cells: Array<number | null>;
}

export interface RetentionHeat {
  offsets: number[];
  rows: RetentionRow[];
}

/**
 * Share of each first-order month's customers who placed an order in each
 * month offset. M0 is 100% by definition (they placed the first order). A cell
 * is null (—) until that month has fully elapsed as of `asOf` — the young
 * bottom-right stays honestly blank instead of reading 0%.
 */
export function retentionHeat(
  customers: CustomerDepth[],
  asOf: Date,
  options?: { maxOffset?: number; maxRows?: number },
): RetentionHeat | null {
  const maxOffset = options?.maxOffset ?? DEPTH_MAX_OFFSET;
  const maxRows = options?.maxRows ?? 12;
  const groups = [...groupByCohort(customers)].sort((a, b) =>
    a[0].localeCompare(b[0]),
  );
  if (groups.length === 0) return null;
  const offsets = Array.from({ length: maxOffset + 1 }, (_, k) => k);
  const rows: RetentionRow[] = [];
  for (const [cohortMonth, members] of groups.slice(-maxRows)) {
    if (members.length === 0) continue;
    const elapsed = monthsSince(monthStartUtc(cohortMonth), asOf);
    const cells = offsets.map((k) => {
      if (k === 0) return 1;
      // Fully elapsed only when the whole window has passed.
      if (k > elapsed - 1) return null;
      let active = 0;
      for (const c of members) if (c.activeOffsets.has(k)) active += 1;
      return active / members.length;
    });
    rows.push({
      cohortMonth,
      label: monthLabel(cohortMonth),
      customers: members.length,
      cells,
    });
  }
  if (rows.length === 0) return null;
  return { offsets, rows };
}

// —— Path LTV (first → second product journeys) ——————————————————————————————

export interface PathLtvRow {
  first: string;
  second: string;
  samePath: boolean;
  buyers: number;
  lifetimeLtv: number;
  day90Ltv: number;
  day90N: number;
}

/**
 * First product → second product journeys with buyers, lifetime value, and
 * 90-day value. Only customers whose first two orders have known product names
 * count (SAMPLE Snowdevil); live rows with hidden titles produce nothing. Rows
 * below {@link PATH_MIN_BUYERS} are dropped so a journey is a pattern, not one
 * shopper. `day90N` counts buyers whose first order has had a full 90 days.
 */
export function pathLtv(
  customers: CustomerDepth[],
  asOf: Date,
  options?: { minBuyers?: number; maxRows?: number },
): PathLtvRow[] {
  const minBuyers = options?.minBuyers ?? PATH_MIN_BUYERS;
  const maxRows = options?.maxRows ?? PATH_MAX_ROWS;
  type Acc = {
    first: string;
    second: string;
    buyers: number;
    lifetimeSum: number;
    day90Sum: number;
    day90N: number;
  };
  const map = new Map<string, Acc>();
  for (const c of customers) {
    if (c.orderCount < 2) continue;
    if (!c.firstProduct || !c.secondProduct) continue;
    const key = `${c.firstProduct}\u0000${c.secondProduct}`;
    const acc = map.get(key) ?? {
      first: c.firstProduct,
      second: c.secondProduct,
      buyers: 0,
      lifetimeSum: 0,
      day90Sum: 0,
      day90N: 0,
    };
    acc.buyers += 1;
    acc.lifetimeSum += c.lifetimeSpend;
    if (daysBetween(c.firstOrderedAt, asOf) >= 90) {
      acc.day90Sum += c.day90Spend;
      acc.day90N += 1;
    }
    map.set(key, acc);
  }
  const rows: PathLtvRow[] = [];
  for (const acc of map.values()) {
    if (acc.buyers < minBuyers) continue;
    rows.push({
      first: acc.first,
      second: acc.second,
      samePath: acc.first === acc.second,
      buyers: acc.buyers,
      lifetimeLtv: acc.lifetimeSum / acc.buyers,
      day90Ltv: acc.day90N > 0 ? acc.day90Sum / acc.day90N : 0,
      day90N: acc.day90N,
    });
  }
  rows.sort((a, b) => b.buyers - a.buyers || b.lifetimeLtv - a.lifetimeLtv);
  return rows.slice(0, maxRows);
}

// —— First-order size → what they become (AOV & basket tiers) ————————————————

export interface TierRow {
  key: string;
  label: string;
  buyers: number;
  repeat: number;
  repeatPct: number;
  lifetimeNet: number;
  ltv: number;
  day90Ltv: number;
  day90N: number;
  order: number;
}

/** First-order dollar bands — matches the founder's AOV tier reference. */
export const AOV_TIERS: Array<{ label: string; min: number; max: number }> = [
  { label: "$0–25", min: 0, max: 25 },
  { label: "$25–50", min: 25, max: 50 },
  { label: "$50–75", min: 50, max: 75 },
  { label: "$75–100", min: 75, max: 100 },
  { label: "$100–150", min: 100, max: 150 },
  { label: "$150–250", min: 150, max: 250 },
  { label: "$250+", min: 250, max: Number.POSITIVE_INFINITY },
];

/** First-order basket sizes — one item vs a stocked-up first order. */
export const BASKET_TIERS: Array<{
  label: string;
  min: number;
  max: number;
}> = [
  { label: "1 item", min: 1, max: 1 },
  { label: "2 items", min: 2, max: 2 },
  { label: "3–4 items", min: 3, max: 4 },
  { label: "5+ items", min: 5, max: Number.POSITIVE_INFINITY },
];

function summarizeTier(
  key: string,
  label: string,
  order: number,
  members: CustomerDepth[],
  asOf: Date,
): TierRow | null {
  if (members.length === 0) return null;
  let repeat = 0;
  let lifetimeNet = 0;
  let day90Sum = 0;
  let day90N = 0;
  for (const c of members) {
    if (c.orderCount >= 2) repeat += 1;
    lifetimeNet += c.lifetimeSpend;
    if (daysBetween(c.firstOrderedAt, asOf) >= 90) {
      day90Sum += c.day90Spend;
      day90N += 1;
    }
  }
  return {
    key,
    label,
    order,
    buyers: members.length,
    repeat,
    repeatPct: repeat / members.length,
    lifetimeNet,
    ltv: lifetimeNet / members.length,
    day90Ltv: day90N > 0 ? day90Sum / day90N : 0,
    day90N,
  };
}

/**
 * First-order AOV band → repeat rate, lifetime value, and 90-day value. Sorted
 * by lifetime net so the band carrying the most dollars leads (the founder's
 * AOV & basket reference). Bands below {@link TIER_MIN_BUYERS} drop out.
 */
export function aovTiers(
  customers: CustomerDepth[],
  asOf: Date,
  options?: { minBuyers?: number },
): TierRow[] {
  const minBuyers = options?.minBuyers ?? TIER_MIN_BUYERS;
  const buckets = AOV_TIERS.map(() => [] as CustomerDepth[]);
  for (const c of customers) {
    const idx = AOV_TIERS.findIndex(
      (t) => c.firstAmount >= t.min && c.firstAmount < t.max,
    );
    if (idx >= 0) buckets[idx]!.push(c);
  }
  const rows: TierRow[] = [];
  AOV_TIERS.forEach((t, i) => {
    const row = summarizeTier(t.label, t.label, i, buckets[i]!, asOf);
    if (row && row.buyers >= minBuyers) rows.push(row);
  });
  rows.sort((a, b) => b.lifetimeNet - a.lifetimeNet);
  return rows;
}

/** First-order basket size → repeat rate, lifetime value, and 90-day value. */
export function basketTiers(
  customers: CustomerDepth[],
  asOf: Date,
  options?: { minBuyers?: number },
): TierRow[] {
  const minBuyers = options?.minBuyers ?? TIER_MIN_BUYERS;
  const buckets = BASKET_TIERS.map(() => [] as CustomerDepth[]);
  for (const c of customers) {
    const idx = BASKET_TIERS.findIndex(
      (t) => c.firstUnits >= t.min && c.firstUnits <= t.max,
    );
    if (idx >= 0) buckets[idx]!.push(c);
  }
  const rows: TierRow[] = [];
  BASKET_TIERS.forEach((t, i) => {
    const row = summarizeTier(t.label, t.label, i, buckets[i]!, asOf);
    if (row && row.buyers >= minBuyers) rows.push(row);
  });
  rows.sort((a, b) => b.lifetimeNet - a.lifetimeNet);
  return rows;
}

// —— Whale recency (best customers & when they last ordered) ——————————————————

export interface WhaleRecencyBucket {
  key: string;
  label: string;
  count: number;
}

export interface WhaleRecency {
  buyers: number;
  whaleCount: number;
  /** Lifetime-dollar threshold to be a best customer (top decile). */
  threshold: number;
  /** Best customers' share (0–1) of all identified lifetime dollars. */
  salesShare: number;
  avgLifetime: number;
  medianLifetime: number;
  /** Best customers who ordered within the last 90 days ÷ best customers. */
  activeShare: number;
  medianDaysSinceLast: number | null;
  buckets: WhaleRecencyBucket[];
  /** Most common product among best-customer orders (SAMPLE only). */
  topProduct: string | null;
  /** Average lifetime dollars across every identified buyer. */
  everyoneAvg: number;
  /** Best-customer average ÷ everyone average. */
  ltvMultiple: number;
  /** Best customers whose last order is over 180 days ago (0–1). */
  coldShare: number;
}

const RECENCY_BUCKETS: Array<{ key: string; label: string; maxDays: number }> = [
  { key: "d30", label: "Ordered ≤ 30 days", maxDays: 30 },
  { key: "d90", label: "31–90 days", maxDays: 90 },
  { key: "d180", label: "91–180 days", maxDays: 180 },
  { key: "d180plus", label: "Over 180 days", maxDays: Number.POSITIVE_INFINITY },
];

/**
 * Best customers (top spenders by lifetime dollars) and how recently they last
 * ordered — the "are my whales still here?" read Shopify Analytics does not
 * surface. Null until {@link WHALE_MIN_BUYERS} identified buyers, so the slice
 * is a pattern, not one big order.
 */
export function whaleRecency(
  customers: CustomerDepth[],
  asOf: Date,
  options?: { minBuyers?: number; decile?: number },
): WhaleRecency | null {
  const minBuyers = options?.minBuyers ?? WHALE_MIN_BUYERS;
  const decile = options?.decile ?? WHALE_DECILE;
  if (customers.length < minBuyers) return null;
  const sorted = [...customers].sort((a, b) => b.lifetimeSpend - a.lifetimeSpend);
  const whaleCount = Math.max(1, Math.round(sorted.length * decile));
  const whales = sorted.slice(0, whaleCount);
  const totalLifetime = sorted.reduce((s, c) => s + c.lifetimeSpend, 0);
  const whaleLifetime = whales.reduce((s, c) => s + c.lifetimeSpend, 0);
  const threshold = whales[whales.length - 1]?.lifetimeSpend ?? 0;
  const daysSince = whales.map((c) => Math.max(0, daysBetween(c.lastOrderedAt, asOf)));
  const bucketCounts = new Map<string, number>();
  let active90 = 0;
  for (const c of whales) {
    const d = Math.max(0, daysBetween(c.lastOrderedAt, asOf));
    if (d <= 90) active90 += 1;
    const bucket = RECENCY_BUCKETS.find((b) => d <= b.maxDays);
    if (bucket) bucketCounts.set(bucket.key, (bucketCounts.get(bucket.key) ?? 0) + 1);
  }
  const everyoneAvg = sorted.length > 0 ? totalLifetime / sorted.length : 0;
  const avgLifetime = whaleCount > 0 ? whaleLifetime / whaleCount : 0;
  const coldCount = bucketCounts.get("d180plus") ?? 0;
  const productCounts = new Map<string, number>();
  for (const c of whales) {
    if (c.firstProduct) {
      productCounts.set(c.firstProduct, (productCounts.get(c.firstProduct) ?? 0) + 1);
    }
  }
  let topProduct: string | null = null;
  let topProductCount = 0;
  for (const [product, count] of productCounts) {
    if (count > topProductCount) {
      topProduct = product;
      topProductCount = count;
    }
  }
  return {
    buyers: sorted.length,
    whaleCount,
    threshold,
    salesShare: totalLifetime > 0 ? whaleLifetime / totalLifetime : 0,
    avgLifetime,
    medianLifetime: median(whales.map((c) => c.lifetimeSpend)) ?? 0,
    activeShare: whaleCount > 0 ? active90 / whaleCount : 0,
    medianDaysSinceLast: median(daysSince),
    buckets: RECENCY_BUCKETS.map((b) => ({
      key: b.key,
      label: b.label,
      count: bucketCounts.get(b.key) ?? 0,
    })),
    topProduct,
    everyoneAvg,
    ltvMultiple: everyoneAvg > 0 ? avgLifetime / everyoneAvg : 0,
    coldShare: whaleCount > 0 ? coldCount / whaleCount : 0,
  };
}

function groupByCohort(customers: CustomerDepth[]): Map<string, CustomerDepth[]> {
  const groups = new Map<string, CustomerDepth[]>();
  for (const c of customers) {
    const list = groups.get(c.cohortMonth) ?? [];
    list.push(c);
    groups.set(c.cohortMonth, list);
  }
  return groups;
}

// —— Assembled view model (serializable for the loader) ——————————————————————

export interface LtvDepthView {
  /** SAMPLE Snowdevil order history vs live Shopify orders. */
  sample: boolean;
  /** Product names on file — false when Shopify hid titles (journeys drop out). */
  productsKnown: boolean;
  /** Identified buyers in the depth window. */
  buyers: number;
  /** Whole months of first-order history available (honesty for short windows). */
  historyMonths: number;
  curves: CohortCurves | null;
  retention: RetentionHeat | null;
  paths: PathLtvRow[];
  aov: TierRow[];
  basket: TierRow[];
  whales: WhaleRecency | null;
}

/**
 * One pass over the order rows into every depth view. `asOf` anchors maturity
 * (which month offsets have fully elapsed, which best customers are still
 * active). Product journeys are only computed when product names are on file.
 */
export function buildLtvDepth(
  orders: DepthOrder[],
  asOf: Date,
  options: { sample: boolean },
): LtvDepthView {
  const customers = rollUpCustomers(orders);
  const productsKnown = orders.some((o) => o.product != null && o.product !== "");
  const months = customers.map((c) => c.cohortMonth).sort();
  const historyMonths =
    months.length > 0
      ? monthsSince(monthStartUtc(months[0]!), asOf) + 1
      : 0;
  return {
    sample: options.sample,
    productsKnown,
    buyers: customers.length,
    historyMonths,
    curves: cohortLtvCurves(customers, asOf),
    retention: retentionHeat(customers, asOf),
    paths: productsKnown ? pathLtv(customers, asOf) : [],
    aov: aovTiers(customers, asOf),
    basket: basketTiers(customers, asOf),
    whales: whaleRecency(customers, asOf),
  };
}
