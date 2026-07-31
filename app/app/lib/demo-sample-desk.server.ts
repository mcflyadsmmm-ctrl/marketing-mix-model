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

/** Minimum new buyers per SAMPLE day — never show 0s on the desk. */
export const SAMPLE_MIN_NEW_CUSTOMERS = 14;

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
 * Build ~3 years of daily sales + spend targeting ~cash MER near `targetMer`.
 * Default ~4.4× so SAMPLE desk looks strong vs break-even (impressive listing demo).
 */
export function buildThreeYearSampleDesk(options?: {
  now?: Date;
  years?: number;
  targetMer?: number;
  seed?: number;
}): SampleDayRow[] {
  const now = options?.now ?? new Date();
  const years = options?.years ?? 3;
  const targetMer = options?.targetMer ?? 4.4;
  // Bumped seed (…4e) so re-seed replaces the older weaker series.
  const rng = mulberry32(options?.seed ?? 0x4d43464e);

  const end = startOfUtcDay(now);
  const start = addUtcDays(end, -Math.round(365.25 * years) + 1);
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

export function dayBoundsLocal(day: Date): { start: Date; end: Date } {
  const y = day.getUTCFullYear();
  const m = day.getUTCMonth();
  const d = day.getUTCDate();
  const start = new Date(y, m, d);
  const end = new Date(y, m, d, 23, 59, 59, 999);
  return { start, end };
}
