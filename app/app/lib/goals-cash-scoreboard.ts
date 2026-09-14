/**
 * Goals cash scoreboard — YTD Total ROAS vs target vs break-even.
 * Fail closed: incomplete sales facts or missing spend never paint
 * “below break-even” / 0.00× as a live verdict.
 */

import { SAMPLE_MONEY_MARK } from "./cash-desk-copy";
import { formatCurrency, formatMer } from "./mer-format";
import { PRODUCT_NOUN } from "./product-labels";
import { SPEND_BILL_ANCHOR } from "./spend-first-run";

export type GoalsCashScoreboardKind =
  | "sample"
  | "needs_spend"
  | "untrusted_sales"
  | "ready";

export type GoalsVsLine = "above" | "below" | "unknown";

export type GoalsCashScoreboardAction = {
  label: string;
  href: string;
};

export type GoalsCashScoreboard = {
  kind: GoalsCashScoreboardKind;
  heading: string;
  body: string;
  mer: number | null;
  merLabel: string;
  sales: number;
  spend: number;
  targetMer: number | null;
  breakEvenMer: number | null;
  vsBreakEven: GoalsVsLine;
  vsTarget: GoalsVsLine;
  vsBreakEvenLine: string;
  vsTargetLine: string;
  nextAction: GoalsCashScoreboardAction | null;
  useSampleDesk: boolean;
};

const BILL_HREF = `/app/spend#${SPEND_BILL_ANCHOR}`;

export const GOALS_BE_NEEDS_MARGIN =
  "Break-even needs a confirmed margin in Settings";
export const GOALS_NO_TARGET_LINE = `No ${PRODUCT_NOUN.totalRoasGoal} yet — set one in Settings`;

function vsLine(
  actual: number | null,
  rail: number | null,
  verdictAllowed: boolean,
): GoalsVsLine {
  if (
    !verdictAllowed ||
    actual == null ||
    !Number.isFinite(actual) ||
    rail == null ||
    !(rail > 0)
  ) {
    return "unknown";
  }
  return actual >= rail ? "above" : "below";
}

function finiteOrZero(n: number): number {
  return Number.isFinite(n) ? n : 0;
}

function positiveRail(n: number | null | undefined): number | null {
  return n != null && Number.isFinite(n) && n > 0 ? n : null;
}

function vsCopy(
  kind: "break-even" | "target",
  actual: number | null,
  rail: number | null,
  vs: GoalsVsLine,
): string {
  if (rail == null) {
    return kind === "break-even" ? GOALS_BE_NEEDS_MARGIN : GOALS_NO_TARGET_LINE;
  }
  const railLabel = `${formatMer(rail)}×`;
  if (actual == null || vs === "unknown") {
    return kind === "break-even"
      ? `Break-even ${railLabel}`
      : `Target ${railLabel}`;
  }
  if (kind === "break-even") {
    return vs === "below"
      ? `Below break-even ${railLabel}`
      : `Cleared break-even ${railLabel}`;
  }
  return vs === "below"
    ? `Below target ${railLabel}`
    : `At or above target ${railLabel}`;
}

/**
 * YTD cash MER desk for Goals. SAMPLE is labeled practice. Incomplete
 * sales facts withhold the multiple instead of heroing 0.00×.
 */
export function resolveGoalsCashScoreboard(input: {
  ytdSales: number;
  ytdSpend: number;
  ytdMer: number | null;
  targetMer: number | null;
  breakEvenMer: number | null;
  salesError: string | null;
  hasLiveSpend: boolean;
  useSampleDesk: boolean;
}): GoalsCashScoreboard {
  const sales = finiteOrZero(input.ytdSales);
  const spend = finiteOrZero(input.ytdSpend);
  const mer =
    input.ytdMer != null && Number.isFinite(input.ytdMer) ? input.ytdMer : null;
  const targetMer = positiveRail(input.targetMer);
  const breakEvenMer = positiveRail(input.breakEvenMer);
  const merLabel = mer != null ? `${formatMer(mer)}×` : "—";
  const useSampleDesk = Boolean(input.useSampleDesk);

  const withheld: Pick<
    GoalsCashScoreboard,
    | "mer"
    | "merLabel"
    | "vsBreakEven"
    | "vsTarget"
    | "vsBreakEvenLine"
    | "vsTargetLine"
  > = {
    mer: null,
    merLabel: "—",
    vsBreakEven: "unknown",
    vsTarget: "unknown",
    vsBreakEvenLine: GOALS_BE_NEEDS_MARGIN,
    vsTargetLine: GOALS_NO_TARGET_LINE,
  };

  if (input.salesError && !useSampleDesk) {
    return {
      kind: "untrusted_sales",
      heading: "Sales facts still loading — not a trusted multiple",
      body:
        spend > 0
          ? `YTD spend is ${formatCurrency(spend)}. Wait for Shopify sales to finish filling. A blank numerator is not a trusted multiple.`
          : "Year sales are not trusted yet. Goals still save; Total ROAS waits for the till.",
      sales,
      spend,
      targetMer,
      breakEvenMer,
      nextAction: { label: PRODUCT_NOUN.openTotalRoas, href: "/app" },
      useSampleDesk,
      ...withheld,
    };
  }

  if (!useSampleDesk && (!(spend > 0) || !input.hasLiveSpend)) {
    return {
      kind: "needs_spend",
      heading: `${PRODUCT_NOUN.totalRoas} needs spend next to this year’s sales`,
      body:
        sales > 0
          ? `YTD Shopify sales are ${formatCurrency(sales)}. Spread one ad invoice across its days so sales ÷ spend can run against your goal.`
          : `Set a ${PRODUCT_NOUN.totalRoasGoal} anytime. Add spend when you want YTD sales ÷ spend next to break-even.`,
      sales,
      spend,
      targetMer,
      breakEvenMer,
      nextAction: {
        label: PRODUCT_NOUN.setupSpreadBill,
        href: BILL_HREF,
      },
      useSampleDesk,
      ...withheld,
    };
  }

  const vsBreakEven = vsLine(mer, breakEvenMer, mer != null && spend > 0);
  const vsTarget = vsLine(mer, targetMer, mer != null && spend > 0);
  const vsBreakEvenLine = vsCopy(
    "break-even",
    mer,
    breakEvenMer,
    vsBreakEven,
  );
  const vsTargetLine = vsCopy("target", mer, targetMer, vsTarget);
  const pair = `Sales ${formatCurrency(sales)} ÷ spend ${formatCurrency(spend)}`;

  if (useSampleDesk) {
    return {
      kind: "sample",
      heading: `${SAMPLE_MONEY_MARK} · ${merLabel}`,
      body: `${pair}. ${PRODUCT_NOUN.totalRoas} here is practice. Tap Real store before you treat target or break-even as live cash.`,
      mer,
      merLabel,
      sales,
      spend,
      targetMer,
      breakEvenMer,
      vsBreakEven,
      vsTarget,
      vsBreakEvenLine,
      vsTargetLine,
      nextAction: { label: "Open Settings", href: "/app/settings" },
      useSampleDesk: true,
    };
  }

  let heading: string;
  if (mer == null) {
    heading = `${PRODUCT_NOUN.totalRoas} is not ready`;
  } else if (vsBreakEven === "below") {
    heading = `YTD ${merLabel} — below break-even`;
  } else if (vsBreakEven === "above") {
    heading = `YTD ${merLabel} — cleared break-even`;
  } else if (vsTarget === "below") {
    heading = `YTD ${merLabel} — below target`;
  } else if (vsTarget === "above") {
    heading = `YTD ${merLabel} — at or above target`;
  } else {
    heading = `YTD ${merLabel} this year`;
  }

  let nextAction: GoalsCashScoreboardAction | null = null;
  if (vsBreakEven === "below") {
    nextAction = {
      label: `Open ${PRODUCT_NOUN.spendAllocation}`,
      href: "/app/allocation",
    };
  } else if (targetMer == null) {
    nextAction = { label: "Set target", href: "/app/settings" };
  } else if (breakEvenMer == null) {
    nextAction = {
      label: PRODUCT_NOUN.setupAdjustMargin,
      href: "/app/settings",
    };
  }

  return {
    kind: "ready",
    heading,
    body: `${pair}. ${PRODUCT_NOUN.totalRoas} is Shopify sales ÷ logged spend — not platform ROAS.`,
    mer,
    merLabel,
    sales,
    spend,
    targetMer,
    breakEvenMer,
    vsBreakEven,
    vsTarget,
    vsBreakEvenLine,
    vsTargetLine,
    nextAction,
    useSampleDesk: false,
  };
}
