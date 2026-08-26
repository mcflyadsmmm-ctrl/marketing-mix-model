/**
 * Deterministic 3-year sample till + matching multi-channel spend.
 * Clearly labeled SAMPLE — never presented as live Shopify.
 *
 * Invariants (listing / Demo must look impressive):
 * - Every day: newCustomers ≥ floor, never 0
 * - newCustomerNetSales > 0 whenever sales > 0 (AMER / LTV page not blank)
 * - Scale matches strong DTC desk (~$5–8k/day, Total ROAS ~4.4×)
 */

import type { SpendChannel } from "@prisma/client";
import { DESK_HISTORY_YEARS_BACK, deskHistoryFloorYear } from "./desk-history";

/** A merchant-named `other` row, e.g. the Billboard buy. */
export interface SampleNamedExtra {
  /** SpendEntry.customKey — becomes the `other:<slug>` mix series. */
  slug: string;
  /** SpendEntry.note — the name the merchant reads. */
  label: string;
  amount: number;
}

export interface SampleDayRow {
  day: Date;
  sales: number;
  orderCount: number;
  newCustomers: number;
  returningCustomers: number;
  /** Net sales attributed to first-time buyers that day (shop dollars). */
  newCustomerNetSales: number;
  spendByChannel: Record<SpendChannel, number>;
  /** Named `other` rows carved out of `spendByChannel.other`. */
  namedExtras: SampleNamedExtra[];
}

/** Minimum new buyers per SAMPLE day — never show 0s on the desk. */
export const SAMPLE_MIN_NEW_CUSTOMERS = 14;

export const SAMPLE_BILLBOARD_SLUG = "billboard";
export const SAMPLE_BILLBOARD_LABEL = "Billboard";
/** Share of the `other` bucket that runs as the billboard contract. */
const BILLBOARD_SHARE_OF_OTHER = 0.62;

/**
 * Total ad spend for a sample day. Named extras live outside
 * `spendByChannel`, so every caller must sum through here or it will
 * understate spend and overstate Total ROAS.
 */
export function sampleDayTotalSpend(row: SampleDayRow): number {
  let total = 0;
  for (const amount of Object.values(row.spendByChannel)) total += amount ?? 0;
  for (const extra of row.namedExtras) total += extra.amount;
  return total;
}

function mulberry32(seed: number) {
  return function rng() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function startOfUtcDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function addUtcDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setUTCDate(x.getUTCDate() + n);
  return startOfUtcDay(x);
}

const CHANNELS: SpendChannel[] = [
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

/** Mix shares — sum ≈ 1 (new named channels keep small %) */
const MIX: Record<SpendChannel, number> = {
  meta: 0.33,
  google: 0.24,
  microsoft: 0.04,
  tiktok: 0.07,
  pinterest: 0.035,
  snapchat: 0.025,
  reddit: 0.015,
  x: 0.02,
  linkedin: 0.015,
  amazon: 0.03,
  apple_search: 0.015,
  affiliate: 0.055,
  email: 0.06,
  other: 0.04,
};

/**
 * Build daily sales + spend targeting ~cash MER near `targetMer`.
 * Default window: January 1 of (UTC year − 5) through today.
 * Pass `years` for a rolling window (tests).
 */
export function buildThreeYearSampleDesk(options?: {
  now?: Date;
  years?: number;
  targetMer?: number;
  seed?: number;
}): SampleDayRow[] {
  const now = options?.now ?? new Date();
  const targetMer = options?.targetMer ?? 4.4;
  // Bumped seed (…4e) so re-seed replaces the older weaker series.
  const rng = mulberry32(options?.seed ?? 0x4d43464e);

  const end = startOfUtcDay(now);
  const start =
    options?.years != null
      ? addUtcDays(end, -Math.round(365.25 * options.years) + 1)
      : new Date(Date.UTC(deskHistoryFloorYear(now), 0, 1));
  const years = options?.years ?? DESK_HISTORY_YEARS_BACK;
  const rows: SampleDayRow[] = [];

  for (let d = new Date(start); d <= end; d = addUtcDays(d, 1)) {
    const dow = d.getUTCDay(); // 0 Sun
    const month = d.getUTCMonth();
    // Strong YoY growth so Goals / deltas read positive.
    const yearFactor =
      1 + (d.getUTCFullYear() - end.getUTCFullYear() + years) * 0.14;
    const season =
      month === 10 || month === 11
        ? 1.55 // Nov–Dec peak
        : month === 0
          ? 0.88 // soft Jan, not a ghost month
          : month >= 5 && month <= 7
            ? 1.18
            : 1;
    const weekend = dow === 0 || dow === 6 ? 0.9 : 1;
    const noise = 0.94 + rng() * 0.16;
    const baseSales = 5800 * yearFactor * season * weekend * noise;
    const sales = Math.round(baseSales * 100) / 100;

    const aov = 98 + rng() * 42; // ~$98–140
    const orderCount = Math.max(
      SAMPLE_MIN_NEW_CUSTOMERS + 8,
      Math.round(sales / aov),
    );
    // Healthy acquisition mix — floor so daily new never rounds to 0.
    const newShare = 0.34 + rng() * 0.12;
    const newCustomers = Math.max(
      SAMPLE_MIN_NEW_CUSTOMERS,
      Math.round(orderCount * newShare),
    );
    const returningCustomers = Math.max(0, orderCount - newCustomers);
    // New-buyer dollars ≈ share of till (AMER / LTV page never $0).
    const newCustomerNetSales =
      Math.round(sales * (newCustomers / orderCount) * 100) / 100;

    // Bias spend slightly under target → MER often lands ~4.2–4.7.
    const totalSpend =
      Math.round((sales / targetMer) * (0.88 + rng() * 0.14) * 100) / 100;
    const spendByChannel = {} as Record<SpendChannel, number>;
    let allocated = 0;
    for (let i = 0; i < CHANNELS.length; i++) {
      const ch = CHANNELS[i];
      if (i === CHANNELS.length - 1) {
        spendByChannel[ch] = Math.max(
          0,
          Math.round((totalSpend - allocated) * 100) / 100,
        );
      } else {
        const wobble = 0.8 + rng() * 0.4;
        const amt = Math.round(totalSpend * MIX[ch] * wobble * 100) / 100;
        spendByChannel[ch] = amt;
        allocated += amt;
      }
    }

    /*
     * Billboards are bought in flights, not every day. Carving the buy out of
     * `other` on alternating months keeps total spend identical while giving
     * the Sample desk a named extra that appears as its own Billboard band and
     * then goes quiet — the case a merchant with offline spend needs to see.
     */
    const otherAmount = spendByChannel.other ?? 0;
    const billboard =
      month % 2 === 0
        ? Math.round(otherAmount * BILLBOARD_SHARE_OF_OTHER * 100) / 100
        : 0;
    if (billboard > 0) {
      spendByChannel.other =
        Math.round((otherAmount - billboard) * 100) / 100;
    }

    rows.push({
      day: new Date(d),
      sales,
      orderCount,
      newCustomers,
      returningCustomers,
      newCustomerNetSales,
      spendByChannel,
      namedExtras:
        billboard > 0
          ? [
              {
                slug: SAMPLE_BILLBOARD_SLUG,
                label: SAMPLE_BILLBOARD_LABEL,
                amount: billboard,
              },
            ]
          : [],
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
