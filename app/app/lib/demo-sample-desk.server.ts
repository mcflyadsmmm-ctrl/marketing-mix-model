/**
 * Deterministic SAMPLE till + matching spend.
 * Clearly labeled SAMPLE — never presented as live Shopify.
 *
 * Impressive but realistic DTC: Meta + Google, some email, a little other.
 * ~$2.5–4k sales/day, Total ROAS near 3.5× (Harbor-like, not 4.4× theater).
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
  spendByChannel: Record<SpendChannel, number>;
}

/** Rolling book length — covers L12M without a 5-year 14-channel write. */
export const SAMPLE_BOOK_DAYS = 400;

/** Paid mix a real shop actually runs — not every named channel every day. */
export const SAMPLE_ACTIVE_CHANNELS = [
  "meta",
  "google",
  "email",
  "other",
] as const satisfies readonly SpendChannel[];

/** Minimum new buyers per SAMPLE day — never show 0s on the desk. */
export const SAMPLE_MIN_NEW_CUSTOMERS = 3;

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

/** Mix shares for active channels — sum = 1. */
const MIX: Record<(typeof SAMPLE_ACTIVE_CHANNELS)[number], number> = {
  meta: 0.5,
  google: 0.32,
  email: 0.08,
  other: 0.1,
};

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
    const season =
      month === 10 || month === 11
        ? 1.35
        : month === 0
          ? 0.86
          : month >= 5 && month <= 7
            ? 1.12
            : 1;
    const dayFactor = weekend ? 0.78 : 1;
    const noise = 0.93 + rng() * 0.14;
    const sales = Math.round(2750 * season * dayFactor * noise * 100) / 100;

    const aov = 88 + rng() * 28;
    const orderCount = Math.max(
      SAMPLE_MIN_NEW_CUSTOMERS + 6,
      Math.round(sales / aov),
    );
    const newShare = 0.28 + rng() * 0.1;
    const newCustomers = Math.max(
      SAMPLE_MIN_NEW_CUSTOMERS,
      Math.round(orderCount * newShare),
    );
    const returningCustomers = Math.max(0, orderCount - newCustomers);
    const newCustomerNetSales =
      Math.round(sales * (newCustomers / orderCount) * 100) / 100;

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
