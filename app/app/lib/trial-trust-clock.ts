/**
 * Trial clock vs trust clock — FRICTION F3 / LOVE L15 / NICHE P10.
 *
 * The App Store trial is calendar access. A trusted Total ROAS needs closed
 * days of entered spend. Merchants who treat “trial running” as “product
 * works” churn at day 7 or uninstall as “app empty.”
 *
 * Pure copy — no billing API, no subscription countdown, no projected ×.
 * Counts arrive from the selected period’s spend coverage; this module
 * never invents them or claims ad networks sync themselves.
 */

import { PRODUCT_NOUN } from "./product-labels";

/** App Store trial window — after this, stop saying “trial” forever. */
export const TRIAL_TRUST_CLOCK_MS = 7 * 24 * 60 * 60 * 1000;

export type TrialTrustClockInput = {
  useSampleDesk?: boolean;
  shotMode?: boolean;
  /** Selected period already passes `resolvePeriodTrust`. */
  periodTrusted: boolean;
  /** Closed days in the selected period that have entered spend. */
  closedDaysWithSpend: number;
  /** Closed days in the selected period (today excluded by coverage). */
  closedDaysInPeriod: number;
  /** Shop has any live (non-sample) spend row. */
  hasLiveSpend: boolean;
  /**
   * When the desk already shows the scoreboard, period trust + chips own the
   * coverage story — do not stack a second “trial” banner above the dial.
   */
  scoreboardReady?: boolean;
  /** Shop install time — past {@link TRIAL_TRUST_CLOCK_MS}, the banner stays off. */
  installedAt?: Date | string | number | null;
  now?: Date | string | number;
};

export type TrialTrustClockNotice = {
  show: boolean;
  tone: "info";
  heading: string;
  body: string;
};

/** Shared heading — trial calendar ≠ trust. */
export const TRIAL_TRUST_CLOCK_HEADING =
  "Trial days are not trusted Total ROAS";

/**
 * Standing rule said next to trial context. Religion: sales automatic,
 * spend entered; yesterday is the last day that can be final.
 */
export const TRIAL_TRUST_CLOCK_RULE =
  "Yesterday is the last day that can be final. Shopify sales load on their own; you enter ad spend.";

function dayWord(n: number): string {
  return n === 1 ? "day" : "days";
}

function clampNonNeg(n: number): number {
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.floor(n);
}

function toEpochMs(value: Date | string | number | null | undefined): number | null {
  if (value == null) return null;
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  const ms = value instanceof Date ? value.getTime() : new Date(value).getTime();
  return Number.isFinite(ms) ? ms : null;
}

/**
 * Info banner for Overview cold empty / trial-adjacent chrome.
 * Hidden on SAMPLE, listing capture, trusted periods, ready scoreboards
 * (period note owns coverage), and after the 7-day trial window.
 */
export function resolveTrialTrustClock(
  input: TrialTrustClockInput,
): TrialTrustClockNotice {
  const hidden = {
    show: false,
    tone: "info" as const,
    heading: TRIAL_TRUST_CLOCK_HEADING,
    body: "",
  };

  if (input.useSampleDesk || input.shotMode || input.periodTrusted) {
    return hidden;
  }
  if (input.scoreboardReady) {
    return hidden;
  }

  const installedMs = toEpochMs(input.installedAt);
  const nowMs = toEpochMs(input.now) ?? Date.now();
  if (installedMs != null && nowMs - installedMs >= TRIAL_TRUST_CLOCK_MS) {
    return hidden;
  }

  const withSpend = clampNonNeg(input.closedDaysWithSpend);
  const inPeriod = clampNonNeg(input.closedDaysInPeriod);
  const filled = Math.min(withSpend, inPeriod || withSpend);

  let body: string;

  if (!input.hasLiveSpend) {
    body = `The 7-day trial is calendar access to the desk — not a signal that ${PRODUCT_NOUN.totalRoas} is done. A trusted multiple needs closed days of entered spend (${PRODUCT_NOUN.definition}). ${TRIAL_TRUST_CLOCK_RULE}`;
  } else if (inPeriod === 0) {
    body = `The 7-day trial is calendar access — not a signal that ${PRODUCT_NOUN.totalRoas} is trusted. This period has no fully closed day yet. ${TRIAL_TRUST_CLOCK_RULE}`;
  } else if (filled === 0) {
    body = `The 7-day trial is calendar access — not a signal that ${PRODUCT_NOUN.totalRoas} is trusted. 0 of ${inPeriod} closed ${dayWord(inPeriod)} in this period have entered spend. ${TRIAL_TRUST_CLOCK_RULE}`;
  } else {
    const missing = Math.max(0, inPeriod - filled);
    body = `The 7-day trial is calendar access — not a signal that ${PRODUCT_NOUN.totalRoas} is trusted. ${filled} of ${inPeriod} closed ${dayWord(inPeriod)} in this period have entered spend${
      missing > 0
        ? ` (${missing} still missing)`
        : ""
    }. ${TRIAL_TRUST_CLOCK_RULE}`;
  }

  return {
    show: true,
    tone: "info",
    heading: TRIAL_TRUST_CLOCK_HEADING,
    body,
  };
}
