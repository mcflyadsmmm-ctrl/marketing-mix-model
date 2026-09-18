/**
 * Deterministic SAMPLE till + matching spend.
 * Clearly labeled SAMPLE — never presented as live Shopify.
 *
 * Snowdevil (Shopify snowboard shop): Complete Snowboard AOV, winter peak,
 * Meta + Google Shopping, some email, a little other (affiliates/events).
 * Total ROAS near 3.5× (impressive, not 4.4× theater).
 * Window is a rolling ~13 months through **today UTC** so MTD is never stale.
 */

import type { SpendChannel } from "@prisma/client";

export interface SampleDayRow {
  day: Date;
  sales: number;
  orderCount: number;
  newCustomers: number;
  returningCustomers: number;
  /** Net sales attributed to first-time buyers that day (shop dollars). */
  newCustomerNetSales: number;
  /** Guest-checkout orders that day (no account) — subset of orderCount. */
  guestOrders: number;
  /** Net sales attributed to guest checkouts that day (shop dollars). */
  guestNetSales: number;
  spendByChannel: Record<SpendChannel, number>;
}

/**
 * Rolling book length — two full years so Overview YoY (MTD / QTD / YTD vs the
 * same days last year) always has a complete prior-year window to compare, even
 * at a quarter or year boundary. A 400-day book left QTD/YTD YoY with a partial
 * prior year (e.g. Jan–Jun last year missing), so enterprise operators judging
 * the desk saw a broken "same days last year". 730 days × ≤4 paid channels is
 * still a compact seed, never a 5-year 14-channel write.
 */
export const SAMPLE_BOOK_DAYS = 730;

/**
 * Share of daily orders that are guest checkouts (no account). Real DTC snow
 * shops run a meaningful guest tail, so the desk's "Guest Checkouts" tile shows
 * real dollars — never a dash — while identified new/returning stay the hero.
 */
export const SAMPLE_GUEST_SHARE = 0.12;

/** Paid mix a real shop actually runs — not every named channel every day. */
export const SAMPLE_ACTIVE_CHANNELS = [
  "meta",
  "google",
  "email",
  "other",
] as const satisfies readonly SpendChannel[];

/** Minimum new buyers per SAMPLE day — summer 2-order days stay honest. */
export const SAMPLE_MIN_NEW_CUSTOMERS = 1;

/**
 * Premium-SMB lift so SAMPLE YoY / MoM windows read up-and-to-the-right —
 * enough to want the $39 desk, not a cartoon 40% print. Formulas stay
 * honest; only the Snowdevil book is biased.
 */
export const SAMPLE_YOY_GROWTH = 0.14;

const ALL_CHANNELS: SpendChannel[] = [
  "meta",
  "google",
  "microsoft",
  "tiktok",
  "pinterest",
  "snapchat",
  "reddit",
  "x",
  "linkedin",
  "amazon",
  "apple_search",
  "affiliate",
  "email",
  "other",
];

/** Mix shares for active channels — Meta + Google Shopping heavy. */
const MIX: Record<(typeof SAMPLE_ACTIVE_CHANNELS)[number], number> = {
  meta: 0.48,
  google: 0.38,
  email: 0.06,
  other: 0.08,
};

/** Complete Snowboard territory — not Harbor $88 candles. */
const AOV_MIN = 520;
const AOV_SPAN = 180;

/** Mid-season weekday GMV before winter peak / off-season / weekend. */
const BASE_DAILY_SALES = 4100;

function snowdevilSeason(month: number): number {
  // Build into winter. Summer stays live (apparel / pre-order), not a crash,
  // so MoM on the listing half-year reads up. Nov/Dec still the peak.
  const byMonth = [
    1.3, // Jan
    1.26, // Feb
    1.12, // Mar — only real cooling shoulder
    1.08, // Apr
    1.1, // May — turns back up
    1.12, // Jun
    1.14, // Jul
    1.16, // Aug
    1.2, // Sep — listing window
    1.24, // Oct
    1.32, // Nov peak
    1.34, // Dec peak
  ];
  return byMonth[month] ?? 1;
}

/** Years back from the book end — 0 today, ~1 last year, ~2 at the start. */
function yearsBackFromEnd(day: Date, end: Date): number {
  return Math.max(0, (end.getTime() - day.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
}

/**
 * Compound SAMPLE lift vs the book end. Today is 1.00; one year back is
 * ~1/(1+SAMPLE_YOY_GROWTH). Period totals beat the same window last year
 * without flattening the winter peak.
 */
export function sampleYoyGrowthFactor(day: Date, end: Date): number {
  return Math.pow(1 + SAMPLE_YOY_GROWTH, -yearsBackFromEnd(day, end));
}

function mulberry32(seed: number) {
  return function rng() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function startOfUtcDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

export function addUtcDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setUTCDate(x.getUTCDate() + n);
  return startOfUtcDay(x);
}

function dayRng(day: Date): () => number {
  const key =
    day.getUTCFullYear() * 10000 +
    (day.getUTCMonth() + 1) * 100 +
    day.getUTCDate();
  return mulberry32(0x4d43464e ^ key);
}

function emptySpend(): Record<SpendChannel, number> {
  const spend = {} as Record<SpendChannel, number>;
  for (const channel of ALL_CHANNELS) spend[channel] = 0;
  return spend;
}

/**
 * Build daily sales + spend targeting ~cash MER near `targetMer`.
 * Default: last SAMPLE_BOOK_DAYS through today UTC (always includes today).
 * Pass `from` to append a tail without rewriting history.
 */
export function buildThreeYearSampleDesk(options?: {
  now?: Date;
  years?: number;
  from?: Date;
  targetMer?: number;
  seed?: number;
}): SampleDayRow[] {
  const now = options?.now ?? new Date();
  const targetMer = options?.targetMer ?? 3.5;
  const end = startOfUtcDay(now);
  const start = options?.from
    ? startOfUtcDay(options.from)
    : options?.years != null
      ? addUtcDays(end, -Math.round(365.25 * options.years) + 1)
      : addUtcDays(end, -SAMPLE_BOOK_DAYS + 1);
  const rows: SampleDayRow[] = [];

  for (let d = new Date(start); d <= end; d = addUtcDays(d, 1)) {
    const rng = dayRng(d);
    const dow = d.getUTCDay();
    const month = d.getUTCMonth();
    const weekend = dow === 0 || dow === 6;
    const season = snowdevilSeason(month);
    const dayFactor = weekend ? 0.88 : 1;
    // Tighter day noise so YoY windows stay green without cartoon days.
    const noise = 0.95 + rng() * 0.10;
    const growth = sampleYoyGrowthFactor(d, end);
    const sales =
      Math.round(BASE_DAILY_SALES * season * dayFactor * noise * growth * 100) /
      100;

    // Newer days: slightly tighter AOV so order density rises with the brand.
    const habit = 1 - Math.min(1, yearsBackFromEnd(d, end) / 2);
    const aov = (AOV_MIN + rng() * AOV_SPAN) * (1.04 - habit * 0.06);
    const orderCount = Math.max(
      SAMPLE_MIN_NEW_CUSTOMERS,
      Math.round(sales / aov),
    );
    // Guest checkouts are a subset of the day's orders; identified buyers are
    // what split into new vs returning. Tiny summer days can carry zero guests.
    const guestOrders = Math.max(
      0,
      Math.min(orderCount - SAMPLE_MIN_NEW_CUSTOMERS, Math.round(orderCount * SAMPLE_GUEST_SHARE)),
    );
    const identifiedOrders = Math.max(SAMPLE_MIN_NEW_CUSTOMERS, orderCount - guestOrders);
    const guestNetSales =
      Math.round(sales * (guestOrders / orderCount) * 100) / 100;
    const identifiedNetSales = Math.max(0, sales - guestNetSales);
    // Newer days lean more returning (habit compounding) — still a real
    // new-buyer slice, never a 90% returning cartoon.
    const newShare = Math.min(
      0.38,
      Math.max(0.22, 0.33 + rng() * 0.06 - habit * 0.07),
    );
    const newCustomers = Math.max(
      SAMPLE_MIN_NEW_CUSTOMERS,
      Math.round(identifiedOrders * newShare),
    );
    const returningCustomers = Math.max(0, identifiedOrders - newCustomers);
    // New-customer $ excludes guest $ (matches SalesResult.newCustomerNetSales).
    const newCustomerNetSales =
      Math.round(identifiedNetSales * (newCustomers / identifiedOrders) * 100) / 100;

    const totalSpend =
      Math.round((sales / targetMer) * (0.92 + rng() * 0.12) * 100) / 100;
    const spendByChannel = emptySpend();
    let allocated = 0;
    const live: SpendChannel[] = ["meta", "google"];
    if (!weekend && rng() > 0.15) live.push("email");
    if (rng() > 0.35) live.push("other");
    for (let i = 0; i < live.length; i++) {
      const ch = live[i]!;
      const share = (MIX as Partial<Record<SpendChannel, number>>)[ch] ?? 0.1;
      if (i === live.length - 1) {
        spendByChannel[ch] = Math.max(
          0,
          Math.round((totalSpend - allocated) * 100) / 100,
        );
      } else {
        const amt = Math.round(totalSpend * share * (0.9 + rng() * 0.2) * 100) / 100;
        spendByChannel[ch] = amt;
        allocated += amt;
      }
    }

    rows.push({
      day: new Date(d),
      sales,
      orderCount,
      newCustomers,
      returningCustomers,
      newCustomerNetSales,
      guestOrders,
      guestNetSales,
      spendByChannel,
    });
  }

  return rows;
}

/**
 * SAMPLE spend stamps UTC noon so they never collide with live CSV rows
 * (UTC midnight) on SpendEntry @@unique([shopId, channel, customKey, periodStart]).
 * Live and SAMPLE can coexist; loaders filter by source.
 */
export function sampleSpendBounds(day: Date): { start: Date; end: Date } {
  const y = day.getUTCFullYear();
  const m = day.getUTCMonth();
  const d = day.getUTCDate();
  const start = new Date(Date.UTC(y, m, d, 12, 0, 0, 0));
  const end = new Date(Date.UTC(y, m, d, 23, 59, 59, 999));
  return { start, end };
}

/** True when a SAMPLE spend row uses the post-fix UTC-noon stamp (not live CSV midnight). */
export function sampleSpendUsesNoonStamp(periodStart: Date): boolean {
  return periodStart.getUTCHours() === 12;
}

/** @deprecated alias — SAMPLE spend bounds are UTC noon, not host-local midnight. */
export function dayBoundsLocal(day: Date): { start: Date; end: Date } {
  return sampleSpendBounds(day);
}
