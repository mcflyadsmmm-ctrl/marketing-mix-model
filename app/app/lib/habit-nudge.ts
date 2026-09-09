/**
 * L10 — calm Monday habit after first trusted Total ROAS.
 * Religion-safe: sales ÷ entered spend; no suite / OAuth / pixel nag.
 * Love-V1: info chrome only — never a critical banner-budget candidate.
 */

import { PRODUCT_NOUN } from "./product-labels";

/** Permanent dismiss — never spam Overview forever without opt-out. */
export const HABIT_NUDGE_DISMISS_KEY = "mcfly-habit-nudge";

/** Soft once-per-tab-session — hide after first reveal until next session. */
export const HABIT_NUDGE_SESSION_KEY = "mcfly-habit-nudge-session";

export const HABIT_NUDGE_COPY = {
  heading: "Come back Monday",
  body: `Update spend, then check break-even. ${PRODUCT_NOUN.totalRoas} stays Shopify sales ÷ what you entered — the till habit, not a suite.`,
  dismissLabel: "Got it",
  updateSpendLabel: "Update spend",
  updateSpendHref: "/app/spend#mcfly-spend-uploads",
  allocationLabel: PRODUCT_NOUN.spendAllocation,
  goalsLabel: "Goals",
  goalsHref: "/app/goals",
} as const;

export type HabitNudgeEligibleReason =
  | "ok"
  | "shot"
  | "sample"
  | "empty"
  | "untrusted"
  | "not_ready";

export type HabitNudgeRevealReason =
  | "ok"
  | "off"
  | "dismissed"
  | "session_done"
  | "hydrating";

export type HabitNudgeEligible = {
  eligible: boolean;
  reason: HabitNudgeEligibleReason;
};

export type HabitNudgeReveal = {
  show: boolean;
  reason: HabitNudgeRevealReason;
};

/**
 * Server/parent gate — both cashActionReady and periodTrusted (first trusted seat).
 */
export function decideHabitNudgeEligible(input: {
  cashActionReady: boolean;
  periodTrusted: boolean;
  useSampleDesk: boolean;
  shotMode?: boolean;
  scoreboardReady: boolean;
}): HabitNudgeEligible {
  if (input.shotMode) return { eligible: false, reason: "shot" };
  if (input.useSampleDesk) return { eligible: false, reason: "sample" };
  if (!input.scoreboardReady) return { eligible: false, reason: "empty" };
  if (!input.periodTrusted) return { eligible: false, reason: "untrusted" };
  if (!input.cashActionReady) return { eligible: false, reason: "not_ready" };
  return { eligible: true, reason: "ok" };
}

/**
 * Client reveal — permanent dismiss or once-per-session soft hide.
 */
export function decideHabitNudgeReveal(input: {
  eligible: boolean;
  dismissed: boolean;
  sessionConsumed: boolean;
  hydrated?: boolean;
}): HabitNudgeReveal {
  if (!input.eligible) return { show: false, reason: "off" };
  if (input.hydrated === false) return { show: false, reason: "hydrating" };
  if (input.dismissed) return { show: false, reason: "dismissed" };
  if (input.sessionConsumed) return { show: false, reason: "session_done" };
  return { show: true, reason: "ok" };
}

export function habitAllocationHref(periodPreset: string): string {
  const preset = periodPreset.trim() || "mtd";
  return `/app/allocation?period=${encodeURIComponent(preset)}`;
}
