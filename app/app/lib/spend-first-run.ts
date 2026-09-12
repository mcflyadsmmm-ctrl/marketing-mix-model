/**
 * First-run Spend — one primary composition: a bill spread onto its days.
 *
 * HOSTILE_SHIP_CRITIQUE blocker #1: the taught path was “type one day”, but a
 * Total ROAS a merchant will act on needs most closed days covered, and the
 * trial is 7 days. Typing 14 rows does not fit in that week; one invoice does.
 * So the bill → daily rows form owns the first viewport and the single primary
 * button, the typed day stays a quiet second path, and CSV stays for backfill.
 *
 * Pure — no I/O, no writes. The spread itself is `planLumpSpread`; coverage
 * counts arrive already computed by the route. Religion: Total ROAS =
 * Shopify Total Sales ÷ entered spend. Nothing here promises a multiple, and
 * nothing here asks for an ad-network login.
 */

import { PRODUCT_NOUN } from "./product-labels";
import { formatSpendDayAmount, formatSpendDayLabel } from "./spend-quick-day";
import type { LumpSpreadPlan } from "./spend-period-allocate";

/** Hash target for the bill panel — Overview deep-links straight to it. */
export const SPEND_BILL_ANCHOR = "mcfly-spend-bill";
/** Hash target for the typed one-day row. */
export const SPEND_DAY_ANCHOR = "mcfly-spend-day";

/**
 * Share of closed days that must carry spend before the multiple is worth a
 * budget call. Below it the desk keeps saying “untrusted”, which is exactly
 * why a 7-day trial cannot be spent hand-typing rows.
 */
export const SPEND_TRUSTED_COVERAGE_RATIO = 0.7;

export const SPEND_FIRST_RUN_COPY = {
  billHeading: "One bill → a month of days (no daily grind)",
  billHint:
    "Paste a period total for one channel — Mcfly writes one row per day. Prefer this over typing every morning.",
  billBody: `A monthly invoice covers a month of days in one save, so ${PRODUCT_NOUN.totalRoas} is ready sooner — without logging into Meta/Google here. ${PRODUCT_NOUN.definition}. Sheet/pipe tools stay optional for hands-off fills.`,
  amountLabel: "Bill amount",
  periodLabel: "Bill covers",
  anchorLabel: "Starting month",
  channelLabel: "Channel",
  customNameLabel: "Name this channel",
  customNamePlaceholder: "e.g. Agency, Retainer",
  previewTitle: "What this writes",
  fallbackPrimaryLabel: "Spread this bill into daily rows",
  blockedPrimaryLabel: "Spreading locked — turn Real store on",
  downloadLabel: "Download the daily rows as CSV",
  equalSplitNote:
    "Equal daily split. Typing a real number over any day replaces that row — spend never doubles.",
  /** Quiet second path under the bill card. */
  dayLede: "Prefer one day at a time?",
  /** Third path, collapsed — a file is never the first ask. */
  backfillLede: "Import a platform CSV instead?",
} as const;

export type BillSpreadCoverageDay = {
  dateKey: string;
  filled: boolean;
};

export type BillSpreadCoverage = {
  /** Closed days in the coverage window (today excluded). */
  windowDays: number;
  filledBefore: number;
  filledAfter: number;
  /** Closed window days this spread would newly cover. */
  addedDays: number;
  /** Closed window days that already carry spend and would be rewritten. */
  replacedDays: number;
  /** Days in the bill that have not closed yet — Total ROAS ignores them. */
  futureDays: number;
  ratioAfter: number;
  trustedAfter: boolean;
  headline: string;
  note: string;
};

function dayWord(n: number): string {
  return n === 1 ? "day" : "days";
}

/** Trusted-coverage bar for a window, e.g. 28 closed days → 20. */
export function trustedCoverageDays(windowDays: number): number {
  if (!Number.isFinite(windowDays) || windowDays <= 0) return 0;
  return Math.ceil(windowDays * SPEND_TRUSTED_COVERAGE_RATIO);
}

/**
 * What the spread does to closed-day coverage, before the merchant commits.
 *
 * This is the operator's question — “does this get me a number I can use?” —
 * answered in counts the desk can defend, not in a promised multiple.
 */
export function resolveBillSpreadCoverage(input: {
  /** Coverage strip through yesterday, oldest → newest. */
  closedDays: readonly BillSpreadCoverageDay[];
  planStartDateYmd: string;
  planEndDateYmd: string;
  /** Store-calendar today. Bill days at or after it are not closed. */
  todayKey: string;
}): BillSpreadCoverage {
  const windowDays = input.closedDays.length;
  const filledBefore = input.closedDays.filter((d) => d.filled).length;
  const covered = input.closedDays.filter(
    (d) =>
      !d.filled &&
      d.dateKey >= input.planStartDateYmd &&
      d.dateKey <= input.planEndDateYmd,
  );
  const addedDays = covered.length;
  const replacedDays = input.closedDays.filter(
    (d) =>
      d.filled &&
      d.dateKey >= input.planStartDateYmd &&
      d.dateKey <= input.planEndDateYmd,
  ).length;
  const filledAfter = Math.min(windowDays, filledBefore + addedDays);
  const ratioAfter = windowDays > 0 ? filledAfter / windowDays : 0;
  const trustedAfter =
    windowDays > 0 && filledAfter >= trustedCoverageDays(windowDays);
  const futureDays = countFutureBillDays(
    input.planStartDateYmd,
    input.planEndDateYmd,
    input.todayKey,
  );

  const headline =
    windowDays === 0
      ? "No closed day is in the coverage window yet"
      : `Coverage after saving: ${filledAfter} of ${windowDays} closed ${dayWord(windowDays)}`;

  const notes: string[] = [];
  if (replacedDays > 0) {
    notes.push(
      `${replacedDays} ${dayWord(replacedDays)} in this window already carry spend — saving replaces those rows on this channel.`,
    );
  }
  if (windowDays > 0) {
    notes.push(
      trustedAfter
        ? `That clears the bar for a ${PRODUCT_NOUN.totalRoas} you can act on.`
        : `A multiple worth acting on wants about ${trustedCoverageDays(windowDays)} of ${windowDays} — spread the month before this one too.`,
    );
  }
  if (futureDays > 0) {
    notes.push(
      `${futureDays} ${dayWord(futureDays)} in this bill have not happened yet; ${PRODUCT_NOUN.totalRoas} only divides closed days.`,
    );
  }

  return {
    windowDays,
    filledBefore,
    filledAfter,
    addedDays,
    replacedDays,
    futureDays,
    ratioAfter,
    trustedAfter,
    headline,
    note: notes.join(" "),
  };
}

/** Bill days on or after the store's today — written, but never trusted yet. */
function countFutureBillDays(
  startDateYmd: string,
  endDateYmd: string,
  todayKey: string,
): number {
  if (!startDateYmd || !endDateYmd || !todayKey) return 0;
  if (endDateYmd < todayKey) return 0;
  const from = startDateYmd > todayKey ? startDateYmd : todayKey;
  const a = Date.parse(`${from}T00:00:00Z`);
  const b = Date.parse(`${endDateYmd}T00:00:00Z`);
  if (!Number.isFinite(a) || !Number.isFinite(b) || b < a) return 0;
  return Math.round((b - a) / 86_400_000) + 1;
}

/**
 * The one primary button on a first-run Spend desk. Sentence case, and it
 * names the work it is about to do — never “Submit” or “Save”.
 */
export function billSpreadPrimaryLabel(
  plan: Pick<LumpSpreadPlan, "dayCount"> | null,
  opts?: { blocked?: boolean },
): string {
  if (opts?.blocked) return SPEND_FIRST_RUN_COPY.blockedPrimaryLabel;
  if (!plan || plan.dayCount < 1) {
    return SPEND_FIRST_RUN_COPY.fallbackPrimaryLabel;
  }
  return `Spread across ${plan.dayCount} ${dayWord(plan.dayCount)}`;
}

/** Live preview line — the daily rate and the window, in the merchant's money. */
export function billSpreadPreviewLine(
  plan: Pick<
    LumpSpreadPlan,
    "dailyAmount" | "dayCount" | "startDateYmd" | "endDateYmd"
  >,
  currency?: string,
): string {
  return `${formatSpendDayAmount(plan.dailyAmount, currency)} a day × ${plan.dayCount} ${dayWord(plan.dayCount)} · ${formatSpendDayLabel(plan.startDateYmd)} → ${formatSpendDayLabel(plan.endDateYmd)}`;
}

export type BillSpreadSavedCopy = {
  heading: string;
  body: string;
  note: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel: string;
  secondaryHref: string;
};

/**
 * Hand-off after the rows land. Says what was written and where the multiple
 * lives — never the multiple itself; the Spend desk shows no ROAS figure.
 */
export function billSpreadSavedCopy(input: {
  dayCount: number;
  dailyAmount: number;
  totalAmount: number;
  startDateYmd: string;
  endDateYmd: string;
  channelLabel: string;
  /** Closed days still at $0 after the spread, if the route knows. */
  missingDays?: number;
  salesWindowWarning?: string | null;
  currency?: string;
}): BillSpreadSavedCopy {
  const total = formatSpendDayAmount(input.totalAmount, input.currency);
  const daily = formatSpendDayAmount(input.dailyAmount, input.currency);
  const missing = Math.max(0, Math.floor(input.missingDays ?? 0));
  const warning = input.salesWindowWarning?.trim();

  const tail =
    missing > 0
      ? `${missing} closed ${dayWord(missing)} outside this bill still have no spend.`
      : "Every closed day in the last four weeks now carries spend.";

  return {
    heading: `${input.dayCount} ${dayWord(input.dayCount)} of spend saved`,
    body: `${input.channelLabel} · ${total} spread as ${daily} a day, ${formatSpendDayLabel(input.startDateYmd)} → ${formatSpendDayLabel(input.endDateYmd)}. ${PRODUCT_NOUN.definition} — every one of those days now has spend to divide.`,
    note: warning || `${tail} ${SPEND_FIRST_RUN_COPY.equalSplitNote}`,
    primaryLabel: PRODUCT_NOUN.openTotalRoas,
    primaryHref: "/app?stay=1",
    secondaryLabel: "Spread another bill",
    secondaryHref: `#${SPEND_BILL_ANCHOR}`,
  };
}
