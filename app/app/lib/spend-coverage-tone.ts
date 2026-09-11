/**
 * Spend coverage tone — how honest incomplete coverage is *said*.
 *
 * FRICTION_AUTOPSY F2: a merchant who did exactly what the empty state asked
 * ("type one day — no file needed") landed on 1 filled / 27 missing and got a
 * `critical` red banner. Honest is not the same as hostile. `critical` is
 * reserved for acting on an incomplete number (verdict / export); a ledger
 * that is one day old gets a progress read that teaches the ritual.
 *
 * Pure — no I/O, no coverage math. Missing-day counts arrive already computed
 * by the route (`loadSpendDayCoverage` + `formatMissingDaysRoasImpact`) and are
 * never re-derived or softened here: the numbers stay exact, only tone and
 * copy change.
 */

import type { SpendCoverageImpact } from "./cash-desk-copy";
import { missingDaysCashSentence } from "./cash-desk-copy";
import { PRODUCT_NOUN } from "./product-labels";

/** One closed day in the coverage strip. Today is never in this list. */
export type SpendCoverageDay = {
  dateKey: string;
  filled: boolean;
};

export type SpendCoverageStage =
  /** Every closed day in the window has spend. */
  | "complete"
  /** Spend exists, but no *closed* day carries it yet (typed today only). */
  | "no_closed_day"
  /** Exactly one closed day — the moment worth celebrating. */
  | "first_day"
  /** The whole ledger is a few days old — holes are history, not neglect. */
  | "first_days"
  /** An established ledger with gaps. */
  | "steady";

/**
 * A ledger carrying this many filled closed days or fewer is brand new — the
 * merchant has typed a day or three, not neglected a month. Counting the rest
 * of the window as failures punishes a first save. Deliberately a count and
 * not a date span: a merchant whose only entry is backdated has just as new a
 * ledger as one who typed yesterday.
 */
export const SPEND_LEDGER_FIRST_DAYS_MAX = 3;

/**
 * At or below this many holes, typing them is fewer keystrokes than a
 * download → fill → import round trip, so the typed row stays the primary CTA
 * even on an established ledger (Track C: typed path primary, CSV second).
 */
export const SPEND_TYPED_CATCHUP_MAX = 3;

/**
 * Where the notice renders. Tone is not free: on Overview a Total ROAS figure
 * is on screen next to the banner, and `success` there would read as "that
 * multiple is trustworthy". The Spend desk shows no multiple, so a first day
 * can be greeted in green without blessing a number.
 */
export type SpendCoverageSurface = "spend_desk" | "overview";

export type SpendCoverageCtaTarget = "type_day" | "blanks" | "total_roas";

export type SpendCoverageCta = {
  label: string;
  target: SpendCoverageCtaTarget;
};

export type SpendCoverageNotice = {
  stage: SpendCoverageStage;
  /** Shopify banner tone. Never `critical` — see F2. */
  tone: "success" | "info" | "warning";
  /** False when the status line alone carries it (complete coverage). */
  showBanner: boolean;
  heading: string;
  body: string;
  /** Standing "keep days filled" expectation, said once. Null once covered. */
  note: string | null;
  /** Compact one-line form for the status row. */
  statusLine: string;
  primary: SpendCoverageCta;
  secondary: SpendCoverageCta | null;
  /**
   * Whether the empty dates belong on screen unasked. A young ledger keeps the
   * count in the status line and hides the date list behind `missingDatesLabel`
   * — the full-strip audit is one click away, not a 27-hole wall on arrival.
   */
  missingDatesDisclosure: "inline" | "on_request";
  /** Summary for the collapsed audit. Null when there is nothing to list. */
  missingDatesLabel: string | null;
  closedDays: number;
  filledDays: number;
  missingDays: number;
};

/**
 * Said once, plainly, on a young ledger — instead of implied every week by a
 * red banner. Religion: sales are automatic, spend is entered.
 */
export const SPEND_LEDGER_STANDING_ASK =
  "Shopify sales arrive on their own; ad spend is the part you enter. One day takes about ten seconds, or paste a week at once when you catch up.";

const UP_TO_DATE_STATUS =
  "✓ Up to date through yesterday — Total ROAS can use this spend";

function dayWord(n: number): string {
  return n === 1 ? "day" : "days";
}

function auditLabel(missing: number): string | null {
  if (missing <= 0) return null;
  return missing === 1 ? "See the empty day" : `See the ${missing} empty days`;
}

/** Each filled day pulls the multiple down toward the till — say that, not "fix". */
const PROGRESS_TAIL =
  "Nothing is broken — each day you add pulls the multiple toward cash.";

/**
 * Pick tone + copy for the Spend coverage surfaces.
 *
 * @param closedDays Coverage strip through yesterday, oldest → newest.
 * @param impact Honest steady-state copy from `formatMissingDaysRoasImpact` —
 *   authoritative for an established ledger, so the numbers in the harsh case
 *   keep exactly one source.
 * @param surface Which desk is rendering — gates `success` only.
 */
export function resolveSpendCoverageNotice(input: {
  closedDays: readonly SpendCoverageDay[];
  impact: SpendCoverageImpact;
  surface?: SpendCoverageSurface;
}): SpendCoverageNotice {
  const closedDays = input.closedDays;
  const surface = input.surface ?? "spend_desk";
  const total = closedDays.length;
  const filled = closedDays.filter((d) => d.filled).length;
  const missing = total - filled;
  const counts = { closedDays: total, filledDays: filled, missingDays: missing };

  if (total === 0 || missing === 0) {
    return {
      stage: "complete",
      tone: "success",
      showBanner: false,
      heading: input.impact.heading,
      body: input.impact.body,
      note: null,
      statusLine: UP_TO_DATE_STATUS,
      primary: { label: PRODUCT_NOUN.openTotalRoas, target: "total_roas" },
      secondary: null,
      missingDatesDisclosure: "inline",
      missingDatesLabel: null,
      ...counts,
    };
  }

  if (filled === 0) {
    return {
      stage: "no_closed_day",
      tone: "info",
      showBanner: true,
      heading: "No finished day has spend yet",
      body: `${PRODUCT_NOUN.totalRoas} divides Shopify sales by the spend you entered for the same day, and today can still move — so it never counts. Add yesterday and the multiple has something to divide.`,
      note: SPEND_LEDGER_STANDING_ASK,
      statusLine:
        "No finished day has spend yet — Total ROAS needs one closed day",
      primary: { label: "Type yesterday’s spend", target: "type_day" },
      secondary: { label: "Or download blanks for the empty days", target: "blanks" },
      missingDatesDisclosure: "on_request",
      missingDatesLabel: auditLabel(missing),
      ...counts,
    };
  }

  if (filled === 1) {
    return {
      stage: "first_day",
      // Green belongs to the moment the merchant did the ask — and only where
      // no multiple is on screen to be blessed by it.
      tone: surface === "spend_desk" ? "success" : "info",
      showBanner: true,
      heading: "First spend day is on the desk",
      body: `One closed day now carries spend, so ${PRODUCT_NOUN.totalRoas} has something to divide. ${missingDaysCashSentence(missing)} ${PROGRESS_TAIL}`,
      note: SPEND_LEDGER_STANDING_ASK,
      statusLine: `Ledger started — 1 of ${total} closed ${dayWord(total)} filled`,
      primary: { label: "Type the next day", target: "type_day" },
      secondary: { label: "Or download blanks for the empty days", target: "blanks" },
      missingDatesDisclosure: "on_request",
      missingDatesLabel: auditLabel(missing),
      ...counts,
    };
  }

  if (filled <= SPEND_LEDGER_FIRST_DAYS_MAX) {
    return {
      stage: "first_days",
      tone: "info",
      showBanner: true,
      heading: `Ledger growing — ${filled} of ${total} closed ${dayWord(total)} filled`,
      body: `${filled} ${dayWord(filled)} of spend are on the desk. ${missingDaysCashSentence(missing)} ${PROGRESS_TAIL}`,
      note: SPEND_LEDGER_STANDING_ASK,
      statusLine: `Ledger growing — ${filled} of ${total} closed ${dayWord(total)} filled`,
      primary: { label: "Type the next day", target: "type_day" },
      secondary: { label: "Or download blanks for the empty days", target: "blanks" },
      missingDatesDisclosure: "on_request",
      missingDatesLabel: auditLabel(missing),
      ...counts,
    };
  }

  const blanksCta: SpendCoverageCta = {
    label: input.impact.nextLabel,
    target: "blanks",
  };
  const typedCta: SpendCoverageCta = {
    label: `Type the missing ${dayWord(missing)}`,
    target: "type_day",
  };
  const typedIsCheaper = missing <= SPEND_TYPED_CATCHUP_MAX;

  return {
    stage: "steady",
    // Honest, not an alarm — `critical` belongs on the verdict and the export.
    tone: "warning",
    showBanner: true,
    heading: input.impact.heading,
    body: input.impact.body,
    note: null,
    statusLine: input.impact.heading,
    primary: typedIsCheaper ? typedCta : blanksCta,
    secondary: typedIsCheaper
      ? blanksCta
      : { label: "Or type one day now", target: "type_day" },
    missingDatesDisclosure: "inline",
    missingDatesLabel: auditLabel(missing),
    ...counts,
  };
}
