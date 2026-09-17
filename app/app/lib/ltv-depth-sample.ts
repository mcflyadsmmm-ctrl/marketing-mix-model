/**
 * Deterministic Snowdevil SAMPLE order history for the LTV depth pack.
 *
 * The shipped sample OrderFacts only span ~90 days with recycled ids and no
 * product names — not enough to build spend-build curves, a retention grid,
 * first→second product journeys, or best-customer recency. This generator
 * produces a stable ~14-month Snowdevil order book (snow-sports shop: wax,
 * beanies, gloves, goggles, jackets, boards) so the SAMPLE desk can show the
 * full depth. A later pass stamps first-order promo codes (WELCOME10 /
 * POWDER15 / BUNDLE) without changing dollars. Clearly SAMPLE — never
 * presented as this shop's Shopify orders.
 *
 * Calibrated so the blended new customer spends ~$145 in the first 30 days,
 * ~$380 in 90 days, and ~$820 in the first year — the same neighborhood as the
 * page's existing SAMPLE hero, so the depth never contradicts the number above
 * it. See `ltv-depth-sample.test.ts` for the calibration lock.
 *
 * Order history only — no spend, no ROAS.
 */

import type { DepthOrder } from "./ltv-depth";

/** Rolling first-order months generated (older = fully matured curves/heat). */
export const SNOWDEVIL_DEPTH_MONTHS = 14;

/** Snowdevil catalog, cheapest first — product is chosen by order dollars. */
const SNOWDEVIL_CATALOG: Array<{ name: string; below: number }> = [
  { name: "Selling Plans Ski Wax", below: 32 },
  { name: "Trail Beanie", below: 55 },
  { name: "Insulated Gloves", below: 85 },
  { name: "Snow Goggles", below: 120 },
  { name: "Alpine Jacket", below: 205 },
  { name: "The Collection Snowboard: Hydrogen", below: 460 },
  { name: "The Complete Snowboard", below: Number.POSITIVE_INFINITY },
];

/** Map an order's dollars to the Snowdevil product a shopper at that price buys. */
export function snowdevilProductForAmount(amount: number): string {
  const hit = SNOWDEVIL_CATALOG.find((p) => amount < p.below);
  return (hit ?? SNOWDEVIL_CATALOG[SNOWDEVIL_CATALOG.length - 1]!).name;
}

interface Segment {
  key: string;
  share: number;
  firstMean: number;
  firstSpread: number;
  aovMean: number;
  aovSpread: number;
  minOrders: number;
  maxOrders: number;
}

/**
 * Buyer mix tuned to the $145 / $380 / $820 build. Most customers reorder a few
 * times a year at ~$140; a small whale slice buys boards and comes back often,
 * pulling the average up while the typical order stays modest.
 */
const SEGMENTS: Segment[] = [
  { key: "loyal", share: 0.3, firstMean: 175, firstSpread: 80, aovMean: 180, aovSpread: 78, minOrders: 7, maxOrders: 12 },
  { key: "steady", share: 0.34, firstMean: 150, firstSpread: 70, aovMean: 152, aovSpread: 62, minOrders: 4, maxOrders: 6 },
  { key: "occasional", share: 0.2, firstMean: 90, firstSpread: 55, aovMean: 112, aovSpread: 50, minOrders: 1, maxOrders: 3 },
  { key: "whale", share: 0.06, firstMean: 360, firstSpread: 170, aovMean: 325, aovSpread: 175, minOrders: 9, maxOrders: 15 },
  { key: "onetime", share: 0.1, firstMean: 42, firstSpread: 30, aovMean: 42, aovSpread: 30, minOrders: 1, maxOrders: 1 },
];

/** Deterministic PRNG (mulberry32) — same seed, same book, every load. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function rng() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function startOfUtcMonth(d: Date, monthsBack: number): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - monthsBack, 1));
}

function pickSegment(r: number): Segment {
  let acc = 0;
  for (const seg of SEGMENTS) {
    acc += seg.share;
    if (r <= acc) return seg;
  }
  return SEGMENTS[SEGMENTS.length - 1]!;
}

/** Draw a positive dollar amount around a mean, clamped to a sane floor. */
function drawAmount(rng: () => number, mean: number, spread: number): number {
  // Average two draws for a softer, less-uniform hump.
  const noise = (rng() + rng()) / 2 - 0.5;
  const value = mean + noise * 2 * spread;
  return Math.max(12, Math.round(value));
}

/** Units on an order — cheap gear stacks up, boards go home alone. */
function drawUnits(rng: () => number, amount: number): number {
  if (amount < 55) {
    const r = rng();
    if (r < 0.32) return 1;
    if (r < 0.62) return 2;
    if (r < 0.86) return 3;
    return 4 + Math.floor(rng() * 3);
  }
  if (amount < 205) {
    return rng() < 0.7 ? 1 : 2;
  }
  return 1;
}

/**
 * Build the Snowdevil SAMPLE order book. First orders spread across the last
 * {@link SNOWDEVIL_DEPTH_MONTHS} months (growing headcount toward recent), each
 * buyer's reorders front-loaded and never placed past `now` — so recent months
 * stay honestly thin and the depth engine's maturity gates dash them.
 */
export function generateSnowdevilDepthOrders(now: Date = new Date()): DepthOrder[] {
  const orders: DepthOrder[] = [];
  const rng = mulberry32(0x5_0a8_5eed);
  let customerSeq = 0;

  for (let m = SNOWDEVIL_DEPTH_MONTHS - 1; m >= 0; m -= 1) {
    const monthStart = startOfUtcMonth(now, m);
    const daysInMonth = new Date(
      Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth() + 1, 0),
    ).getUTCDate();
    // Growing shop — recent first-order months bring more new customers.
    const age = SNOWDEVIL_DEPTH_MONTHS - 1 - m;
    const newCustomers = 96 + age * 9;

    for (let i = 0; i < newCustomers; i += 1) {
      const seg = pickSegment(rng());
      const customerKey = `snowdevil:c${customerSeq}`;
      customerSeq += 1;

      const firstDay = 1 + Math.floor(rng() * daysInMonth);
      const firstAt = new Date(
        Date.UTC(
          monthStart.getUTCFullYear(),
          monthStart.getUTCMonth(),
          Math.min(firstDay, daysInMonth),
          10 + Math.floor(rng() * 9),
          Math.floor(rng() * 59),
        ),
      );
      if (firstAt > now) continue;

      const targetOrders =
        seg.minOrders +
        Math.round(rng() * (seg.maxOrders - seg.minOrders));

      let orderedAt = firstAt;
      for (let n = 0; n < targetOrders; n += 1) {
        if (orderedAt > now) break;
        const isFirst = n === 0;
        const amount = drawAmount(
          rng,
          isFirst ? seg.firstMean : seg.aovMean,
          isFirst ? seg.firstSpread : seg.aovSpread,
        );
        const units = drawUnits(rng, amount);
        orders.push({
          customerKey,
          orderedAt,
          amount,
          units,
          product: snowdevilProductForAmount(amount),
        });
        // Reorder cadence widens with each order — the first gap clears 30 days
        // for most buyers so the first-30-days number stays close to one order.
        const gapDays = Math.round((37 + n * 7) * (0.55 + rng() * 1.0));
        orderedAt = new Date(orderedAt.getTime() + gapDays * 86_400_000);
      }
    }
  }

  return applySamplePromos(applySampleRefundGross(orders));
}

/**
 * Second pass with its own seed — does not shift the book’s amounts, dates,
 * or products. SAMPLE only: a known gross so refund honesty can show a real
 * haircut. Net dollars (the LTV numerator) stay exactly as generated.
 */
function applySampleRefundGross(orders: DepthOrder[]): DepthOrder[] {
  const rng = mulberry32(0x7ef11d);
  return orders.map((order) => {
    if (rng() < 0.08 && order.amount >= 24) {
      const refund = Math.round(order.amount * (0.12 + rng() * 0.38));
      return { ...order, grossAmount: order.amount + refund };
    }
    return { ...order, grossAmount: order.amount };
  });
}

/**
 * Third pass with its own seed — does not shift the book’s amounts, dates,
 * products, or refund gross. SAMPLE only: first-order discount codes so
 * Promo→LTV can name WELCOME10 / POWDER15 / BUNDLE. Later orders stay
 * full-price. Live OrderFacts never get these stamps.
 */
function applySamplePromos(orders: DepthOrder[]): DepthOrder[] {
  const rng = mulberry32(0xd15c0de);
  const seen = new Set<string>();
  return orders.map((order) => {
    const isFirst = !seen.has(order.customerKey);
    if (isFirst) seen.add(order.customerKey);
    if (!isFirst) {
      return { ...order, discountAmount: 0, discountCode: null };
    }
    const r = rng();
    // Low first tickets lean WELCOME10 (lower later LTV). Mid tickets lean
    // POWDER15. Higher first tickets lean BUNDLE so the high-LTV promo still
    // has enough year-matured starters on the 14-month book — not a whale-only
    // sliver that can never seal the year.
    if (order.amount < 90 && r < 0.68) {
      return withSamplePromo(order, "WELCOME10", 0.1);
    }
    if (order.amount >= 160 && r < 0.58) {
      return withSamplePromo(order, "BUNDLE", 0.12);
    }
    if (order.amount >= 90 && r < 0.52) {
      return withSamplePromo(order, "POWDER15", 0.15);
    }
    return { ...order, discountAmount: 0, discountCode: null };
  });
}

function withSamplePromo(
  order: DepthOrder,
  code: string,
  rate: number,
): DepthOrder {
  return {
    ...order,
    discountCode: code,
    discountAmount: Math.max(1, Math.round(order.amount * rate)),
  };
}
