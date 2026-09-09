/**
 * Optional target Total ROAS — parser + actual-versus-target resolver.
 *
 * Target Total ROAS is the merchant's operating goal. It is NOT break-even:
 * break-even comes only from confirmed contribution margin. A target counts as
 * configured only when `Settings.targetMerConfirmedAt` is set, so the non-null
 * `Settings.targetMer` default can keep feeding allocation / pacing / Goals
 * without ever being presented as a merchant-confirmed goal.
 *
 * Pure module — no Prisma, no request, no React.
 */

import { formatMer } from "./mer-format";
import { PRODUCT_NOUN } from "./product-labels";

/** Only digits with at most one decimal point. Rejects text, signs, Infinity, NaN. */
const DECIMAL_INPUT = /^(?:\d+(?:\.\d*)?|\.\d+)$/;

export type TargetMerInput =
  | { ok: true; operation: "clear"; targetMer: null }
  | { ok: true; operation: "set"; targetMer: number }
  | { ok: false; error: string };

export const TARGET_MER_INVALID = `Target ${PRODUCT_NOUN.totalRoas} must be a number greater than 0 — or leave it blank to show actual only.`;

/**
 * Parse the optional target field.
 * Blank / whitespace means "clear the target", not "zero target".
 */
export function parseTargetMerInput(raw: unknown): TargetMerInput {
  const cleaned = String(raw ?? "")
    .replace(/[×x,$\s]/gi, "")
    .trim();
  if (cleaned === "") return { ok: true, operation: "clear", targetMer: null };
  if (!DECIMAL_INPUT.test(cleaned)) {
    return { ok: false, error: TARGET_MER_INVALID };
  }
  const value = Number.parseFloat(cleaned);
  if (!Number.isFinite(value) || value <= 0) {
    return { ok: false, error: TARGET_MER_INVALID };
  }
  return { ok: true, operation: "set", targetMer: value };
}

/** Value written back into the target input for a loaded Settings row. */
export function targetMerFieldValue(settings: {
  targetMer: number;
  targetMerConfirmedAt: Date | string | null;
}): string {
  return settings.targetMerConfirmedAt != null ? String(settings.targetMer) : "";
}

export const TARGET_MER_SAVED_PREFIX = `Target ${PRODUCT_NOUN.totalRoas} saved`;

export const TARGET_MER_CLEARED_COPY = `Target cleared. Overview will show actual ${PRODUCT_NOUN.totalRoas} without a goal rail.`;

/** Settings / Goals success line. Never merged with a break-even number. */
export function targetMerSavedCopy(targetMer: number): string {
  return `${TARGET_MER_SAVED_PREFIX} · ${formatMer(targetMer)}×.`;
}

/**
 * Closed-day honesty beside the rail. Exact copy — a merchant must never read an
 * open day as final, and an incomplete period must never read as a target verdict.
 */
export const CLOSED_DAY_NOTE = {
  trusted: "Closed-day sales and spend are complete. Today can still move.",
  paused: "Target call paused — closed-day sales or spend is incomplete.",
  noTarget: "Closed days are the trust check. Today can still move.",
} as const;

export const NO_TARGET_LINE = "No target set · add one in Settings.";

export type TargetComparisonState =
  | "above"
  | "below"
  | "neutral"
  | "unavailable";

export type TargetMerComparison = {
  state: TargetComparisonState;
  /** True only when the merchant confirmed a target (or SAMPLE). */
  targetConfigured: boolean;
  /** The target to draw, or null when there is nothing to draw. */
  target: number | null;
  /** True only when above/below wording and direction styling are allowed. */
  verdictAllowed: boolean;
  /** True when a configured target is held back by period trust. */
  paused: boolean;
  /** Plain-language line beside the dial. */
  line: string;
  /** Closed-day honesty line — exact state matrix copy. */
  closedDayNote: string;
  /** Screen-reader sentence for the gauge. */
  accessibleName: string;
};

/**
 * Resolve the actual-versus-target state for the selected period.
 *
 * `targetMer` is already gated: pass null when no live confirmation exists.
 * `periodTrusted` must come from `resolvePeriodTrust` — no looser coverage rule.
 */
export function resolveTargetMerComparison(input: {
  actualMer: number | null;
  targetMer: number | null;
  periodTrusted: boolean;
}): TargetMerComparison {
  const target =
    input.targetMer != null &&
    Number.isFinite(input.targetMer) &&
    input.targetMer > 0
      ? input.targetMer
      : null;
  const targetConfigured = target != null;
  const actual =
    input.actualMer != null && Number.isFinite(input.actualMer)
      ? input.actualMer
      : null;
  const paused = targetConfigured && !input.periodTrusted;
  const closedDayNote = targetConfigured
    ? input.periodTrusted
      ? CLOSED_DAY_NOTE.trusted
      : CLOSED_DAY_NOTE.paused
    : CLOSED_DAY_NOTE.noTarget;

  if (actual == null) {
    return {
      state: "unavailable",
      targetConfigured,
      target,
      verdictAllowed: false,
      paused,
      line:
        target != null
          ? `Target ${formatMer(target)}× · actual not available for this period.`
          : NO_TARGET_LINE,
      closedDayNote,
      accessibleName: accessibleName({
        actual: null,
        target,
        verdict: null,
        paused,
      }),
    };
  }

  if (target == null) {
    return {
      state: "neutral",
      targetConfigured: false,
      target: null,
      verdictAllowed: false,
      paused: false,
      line: NO_TARGET_LINE,
      closedDayNote,
      accessibleName: accessibleName({
        actual,
        target: null,
        verdict: null,
        paused: false,
      }),
    };
  }

  const line = `Actual ${formatMer(actual)}× vs target ${formatMer(target)}×`;
  if (paused) {
    return {
      state: "neutral",
      targetConfigured: true,
      target,
      verdictAllowed: false,
      paused: true,
      line,
      closedDayNote,
      accessibleName: accessibleName({
        actual,
        target,
        verdict: null,
        paused: true,
      }),
    };
  }

  const verdict = actual >= target ? "above" : "below";
  return {
    state: verdict,
    targetConfigured: true,
    target,
    verdictAllowed: true,
    paused: false,
    line,
    closedDayNote,
    accessibleName: accessibleName({ actual, target, verdict, paused: false }),
  };
}

function accessibleName(parts: {
  actual: number | null;
  target: number | null;
  verdict: "above" | "below" | null;
  paused: boolean;
}): string {
  const head =
    parts.actual == null
      ? `${PRODUCT_NOUN.totalRoas} unavailable for this period`
      : `${PRODUCT_NOUN.totalRoas} ${formatMer(parts.actual)}×`;
  if (parts.target == null) {
    return `${head}; no target set — add one in Settings.`;
  }
  const tail = parts.paused
    ? "target comparison paused — closed-day sales or spend is incomplete"
    : parts.verdict === "above"
      ? "above target"
      : parts.verdict === "below"
        ? "below target"
        : "no target comparison for this period";
  return `${head}; target ${formatMer(parts.target)}×; ${tail}.`;
}
