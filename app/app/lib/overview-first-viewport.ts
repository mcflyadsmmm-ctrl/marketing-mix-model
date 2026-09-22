import { deskHistoryCaption } from "./desk-history";
import type { LiveIngestDepth } from "./live-ingest-depth";
import { WEEKDAY_SHORT } from "./shopify-depth-stats";
import { resolveSalesReadiness } from "./sales-pending";

/**
 * Overview first viewport — Shopify-order-data only.
 * The hero is this period’s Shopify Total Sales. Typical order, returning
 * dollars, weekend vs weekday, and typical day stay as smaller peeks.
 * Marketing tabs own entered cash later.
 */

export function overviewCoverageLine(depth: LiveIngestDepth): string {
  return deskHistoryCaption(new Date(), "sales", depth);
}

export const OVERVIEW_COVERAGE_LINE = overviewCoverageLine("paid_full");

export const OVERVIEW_PENDING_IN_TOTAL_SALES =
  "Pending, authorized, COD, and Klarna sit in this Shopify Total Sales.";

export const OVERVIEW_SHOP_NOT_COMPANY =
  "This is Shopify Total Sales for orders on this shop — not the company book.";

export const OVERVIEW_PENDING_LINE =
  "Waiting on reports scope / sales totals ingest — not $0.";

/** Card name for the selected period’s hero peek. */
export const OVERVIEW_PERIOD_TOTAL_LABEL = "Shopify Total Sales";

/** Sentence under the period hero when the total is on file. */
export const OVERVIEW_PERIOD_TOTAL_SENTENCE =
  "Shopify Total Sales for this period.";

/** Missing last-year dollars — never a fake $0. */
export const OVERVIEW_LAST_YEAR_NOT_ON_FILE = "not on file";

/** First-lane label — period total, then the smaller peeks. */
export const OVERVIEW_FIRST_LANE_LABEL =
  "Shopify Total Sales · Typical order, returning $, weekends, typical day";

/**
 * Uninstall-killer contrast. Shopify Analytics Overview is Total Sales +
 * a returning-customer *rate*. Mcfly is dollars, typical ticket, weekends.
 */
export const OVERVIEW_ANALYTICS_CONTRAST =
  "Shopify Analytics Overview is Total Sales and a returning-customer rate.";

export const OVERVIEW_THIN_EMPTY_LINE =
  "Typical order, returning $, and weekends fill after paid orders land — not $0.";

/**
 * Deterministic empty-state rhythm (steal map craft) — never an AI analyst.
 * Signal = what we see · Evidence = why the board is — · Next move = what fills.
 */
export type OverviewFinding = {
  signal: string;
  evidence: string;
  next: string;
};

/** Pending sales — scoreboard shells stay up; values stay — not $0. */
export function overviewPendingFinding(): OverviewFinding {
  return {
    signal: "Sales day totals still landing",
    evidence: OVERVIEW_PENDING_LINE,
    next: "Typical order, returning $, and weekend fill as closed days land — not $0.",
  };
}

/** Thin live window — no paid orders yet; never a sealed $0 year. */
export function overviewThinEmptyFinding(): OverviewFinding {
  return {
    signal: "No paid orders in this window yet",
    evidence: OVERVIEW_THIN_EMPTY_LINE,
    next: "After the first paid orders land, YoY and the sales board paint here — never a fake $0 year.",
  };
}

/** Same pad as Customers — peek only; full clock stays on Customers. */
export const OVERVIEW_WINBACK_PAD_DAYS = 15;

/** Overview section ids — daily scoreboard, then mix, then the year board. */
export const OVERVIEW_YOY_GLANCE_ID = "mcfly-yoy-glance";
export const OVERVIEW_MIX_CLOSE_ID = "mcfly-mix-close";
export const OVERVIEW_YOY_YEAR_ID = "mcfly-yoy-year";
export const OVERVIEW_YOY_YEAR_PANEL = "yoy-year";

/** `?panel=` on Overview → section id. Unknown panels stay at the top. */
export function overviewPanelElementId(
  panel: string | null | undefined,
): string | null {
  if (panel === OVERVIEW_YOY_YEAR_PANEL) return OVERVIEW_YOY_YEAR_ID;
  return null;
}

export const OVERVIEW_FIRST_FOLD_HEROES = [
  "typicalOrder",
  "returningDollars",
  "weekendWeekday",
  "yoySameDays",
  "newVsReturningMix",
  "daysToSecond",
  "orderLtvPeek",
  "monthClosePeek",
] as const;

export type OverviewFirstFoldHero = (typeof OVERVIEW_FIRST_FOLD_HEROES)[number];

/** Overview as-of chip — never “still loading sales days” next to a sealed $0. */
export const OVERVIEW_PENDING_ASOF = " · still loading — not $0";

/** Live switch landed on Overview — sales only. Spend honesty lives later. */
export const OVERVIEW_LIVE_HANDOFF_BODY =
  "Shopify sales are this shop’s. SAMPLE dollars did not transfer.";

export const OVERVIEW_SALES_ONLY_LINE =
  "Sales in this window come from your Shopify orders.";

export type OverviewNoticeInput = {
  orderCount: number;
  returningSalesShare: number | null;
  discountedOrderShare: number | null;
  medianDaysToSecond: number | null;
  salesPending: boolean;
};

export type OverviewTakeawayInput = {
  typicalOrderLabel: string | null;
  returningSalesShare: number | null;
  salesPending: boolean;
  orderCount: number;
};

export type OverviewOperatorGreetingInput = {
  salesPending: boolean;
  orderCount: number;
  typicalOrderLabel: string | null;
  returningSalesShare: number | null;
  weekendSalesShare?: number | null;
};

export type OverviewLtvPeekDays = 30 | 90 | 365;

export type OverviewHandoffPeek =
  | { kind: "daysToSecond"; days: number; winBack: number }
  | {
      kind: "ltvPeek";
      amount: number;
      windowDays: OverviewLtvPeekDays;
    }
  | {
      kind: "monthClose";
      projected: number;
      remainingDays: number;
      closed: boolean;
    };

export type OverviewGreetingInput = {
  salesPending: boolean;
  sales: number;
  coverageComplete?: boolean | null;
  periodExceedsFactWindow?: boolean;
  useSampleDesk?: boolean;
  /** Certified SalesDayFact rows in the selected window. */
  factDays?: number | null;
};

export type OverviewPeekThird =
  | { kind: "weekend"; share: number }
  | { kind: "daysToSecond"; days: number }
  | { kind: "empty" };

export type OverviewWeekendWeekday = {
  weekendPct: number;
  weekdayPct: number;
};

export type OverviewBusiestWeekday = {
  label: string;
  dollars: number | null;
  pct: number;
};

function wholePercent(share: number): number {
  return Math.round(share * 100);
}

/**
 * Overview greeting pending — same bar as `resolveSalesReadiness`.
 * A $0 month with certified fact days is an empty month, not loading.
 * SAMPLE is never pending.
 */
export function overviewGreetingPending(input: OverviewGreetingInput): boolean {
  if (input.useSampleDesk) return false;
  if (input.salesPending) return true;

  const sales = Number.isFinite(input.sales) ? input.sales : 0;
  const factDays =
    input.factDays != null && Number.isFinite(input.factDays)
      ? Math.max(0, input.factDays)
      : null;
  const coverageKnown =
    input.coverageComplete != null ||
    factDays != null ||
    Boolean(input.periodExceedsFactWindow);
  if (!coverageKnown) return false;

  return resolveSalesReadiness({
    coverage: {
      complete: input.coverageComplete === true,
      factDays: factDays ?? 0,
      periodExceedsFactWindow: Boolean(input.periodExceedsFactWindow),
    },
    sales,
    useSampleDesk: false,
  }).salesPending;
}

/**
 * One shop-owner sentence. Order facts only — not an AI analyst.
 * Prefer returning-sales share when we have it (the specified 5-second read).
 */
export function overviewNoticeSentence(input: OverviewNoticeInput): string {
  if (input.salesPending) {
    return OVERVIEW_PENDING_LINE;
  }
  if (!(input.orderCount > 0)) {
    return "No orders in this window yet.";
  }
  if (
    input.returningSalesShare != null &&
    Number.isFinite(input.returningSalesShare)
  ) {
    return `Returning customers generated ${wholePercent(input.returningSalesShare)}% of sales in this window.`;
  }
  if (
    input.medianDaysToSecond != null &&
    Number.isFinite(input.medianDaysToSecond)
  ) {
    return `Typical wait to a second order was ${Math.round(input.medianDaysToSecond)} days.`;
  }
  if (
    input.discountedOrderShare != null &&
    Number.isFinite(input.discountedOrderShare) &&
    input.discountedOrderShare >= 0.25
  ) {
    return `${wholePercent(input.discountedOrderShare)}% of orders used a discount.`;
  }
  return OVERVIEW_SALES_ONLY_LINE;
}

/**
 * Uninstall-killer greeting — typical order, returning $, weekends.
 * Never a Total Sales-only scoreboard Shopify already shows.
 */
export function overviewOperatorGreeting(
  input: OverviewOperatorGreetingInput,
): string {
  if (input.salesPending) {
    return OVERVIEW_PENDING_LINE;
  }
  if (!(input.orderCount > 0)) {
    return "No orders in this window yet.";
  }
  const typical = input.typicalOrderLabel
    ? `Typical order around ${input.typicalOrderLabel}.`
    : null;
  const returning =
    input.returningSalesShare != null &&
    Number.isFinite(input.returningSalesShare)
      ? `Returning buyers carry ${wholePercent(input.returningSalesShare)}% of sales.`
      : null;
  const weekend = overviewWeekendWeekday(input.weekendSalesShare);
  const weekendLine = weekend ? `Weekends are ${weekend.weekendPct}%.` : null;
  const parts = [typical, returning, weekendLine].filter(
    (part): part is string => part != null,
  );
  if (parts.length === 0) {
    return OVERVIEW_ANALYTICS_CONTRAST;
  }
  return `${parts.join(" ")} ${OVERVIEW_ANALYTICS_CONTRAST}`;
}

/**
 * PASS only when the first-fold hero is Mcfly-differentiated — not a free
 * Shopify Analytics Overview clone (Total Sales, sessions, returning rate).
 */
export function overviewHeroBeatsShopifyAnalytics(
  hero: OverviewFirstFoldHero,
): boolean {
  switch (hero) {
    case "typicalOrder":
    case "returningDollars":
    case "weekendWeekday":
    case "yoySameDays":
    case "newVsReturningMix":
    case "daysToSecond":
    case "orderLtvPeek":
    case "monthClosePeek":
      return true;
    default: {
      const _never: never = hero;
      return _never;
    }
  }
}

/** Win-back peek = typical wait + 15. Null until a real days-to-second exists. */
export function overviewWinBackDay(
  medianDaysToSecond?: number | null,
): number | null {
  if (
    medianDaysToSecond == null ||
    !Number.isFinite(medianDaysToSecond) ||
    medianDaysToSecond <= 0
  ) {
    return null;
  }
  return Math.round(medianDaysToSecond) + OVERVIEW_WINBACK_PAD_DAYS;
}

/**
 * Second-row peeks — days-to-second / win-back, order LTV, month close.
 * Missing truths stay off the row — never a fake $0 graveyard.
 */
export function overviewHandoffPeeks(input: {
  medianDaysToSecond?: number | null;
  ltvPeek?: number | null;
  ltvPeekDays?: OverviewLtvPeekDays | null;
  historyLimited?: boolean;
  monthClose?: number | null;
  monthCloseRemainingDays?: number | null;
  monthCloseClosed?: boolean;
}): OverviewHandoffPeek[] {
  const peeks: OverviewHandoffPeek[] = [];
  const days = input.medianDaysToSecond;
  const winBack = overviewWinBackDay(days);
  if (
    days != null &&
    Number.isFinite(days) &&
    days > 0 &&
    winBack != null
  ) {
    peeks.push({
      kind: "daysToSecond",
      days: Math.round(days),
      winBack,
    });
  }
  const worth = input.ltvPeek;
  const windowDays = input.ltvPeekDays;
  if (
    worth != null &&
    Number.isFinite(worth) &&
    worth > 0 &&
    (windowDays === 30 || windowDays === 90 || windowDays === 365)
  ) {
    if (!(windowDays === 365 && input.historyLimited)) {
      peeks.push({ kind: "ltvPeek", amount: worth, windowDays });
    }
  }
  const projected = input.monthClose;
  if (projected != null && Number.isFinite(projected) && projected > 0) {
    const remaining =
      input.monthCloseRemainingDays != null &&
      Number.isFinite(input.monthCloseRemainingDays)
        ? Math.max(0, Math.trunc(input.monthCloseRemainingDays))
        : 0;
    peeks.push({
      kind: "monthClose",
      projected,
      remainingDays: remaining,
      closed: input.monthCloseClosed === true || remaining <= 0,
    });
  }
  return peeks;
}

export function overviewLtvWindowLabel(days: OverviewLtvPeekDays): string {
  switch (days) {
    case 30:
      return "first 30 days";
    case 90:
      return "first 90 days";
    case 365:
      return "first year";
    default: {
      const _exhaustive: never = days;
      return _exhaustive;
    }
  }
}

/** Demo-desk takeaway — typical order + returning dollars, never an AI analyst. */
export function overviewDecisionTakeaway(input: OverviewTakeawayInput): string {
  if (input.salesPending) {
    return OVERVIEW_PENDING_LINE;
  }
  if (!(input.orderCount > 0)) {
    return "No orders in this window yet.";
  }
  const returning =
    input.returningSalesShare != null &&
    Number.isFinite(input.returningSalesShare)
      ? `Returning buyers carry ${wholePercent(input.returningSalesShare)}% of sales.`
      : null;
  if (input.typicalOrderLabel && returning) {
    return `Typical order around ${input.typicalOrderLabel}. ${returning}`;
  }
  if (input.typicalOrderLabel) {
    return `Typical order around ${input.typicalOrderLabel}.`;
  }
  if (returning) return returning;
  return OVERVIEW_SALES_ONLY_LINE;
}

/**
 * Overview compact Returning is dollars only.
 * Missing returning $ is an em dash — never headcount or a rate %.
 */
export function overviewReturningCompactDollars(
  returningSales: number | null | undefined,
): number | null {
  if (
    returningSales != null &&
    Number.isFinite(returningSales) &&
    returningSales > 0
  ) {
    return returningSales;
  }
  return null;
}

/** Weekend vs weekday percents. Null until a real weekend share exists. */
export function overviewWeekendWeekday(
  weekendSalesShare?: number | null,
): OverviewWeekendWeekday | null {
  if (
    weekendSalesShare == null ||
    !Number.isFinite(weekendSalesShare)
  ) {
    return null;
  }
  const weekendPct = Math.round(weekendSalesShare * 100);
  if (weekendPct <= 0) return null;
  return {
    weekendPct,
    weekdayPct: Math.max(0, 100 - weekendPct),
  };
}

/** Third peek: weekend share, else days-to-second. Never a fake 0%. */
export function overviewPeekThird(input: {
  weekendSalesShare?: number | null;
  medianDaysToSecond?: number | null;
}): OverviewPeekThird {
  const weekend = input.weekendSalesShare;
  if (
    weekend != null &&
    Number.isFinite(weekend) &&
    Math.round(weekend * 100) > 0
  ) {
    return { kind: "weekend", share: weekend };
  }
  const days = input.medianDaysToSecond;
  if (days != null && Number.isFinite(days)) {
    return { kind: "daysToSecond", days };
  }
  return { kind: "empty" };
}

export const OVERVIEW_PLAIN_WINDOW_IDS = ["yesterday", "week", "mtd"] as const;

export type OverviewPlainWindowId = (typeof OVERVIEW_PLAIN_WINDOW_IDS)[number];

export type OverviewStoredSalesDay = {
  dateKey: string;
  sales: number;
};

export type OverviewPlainWindow = {
  id: OverviewPlainWindowId;
  label: string;
  /** Null when that window has no stored sales day — never a fake $0. */
  sales: number | null;
};

const PLAIN_WINDOW_LABEL: Record<OverviewPlainWindowId, string> = {
  yesterday: "Yesterday",
  week: "This week",
  mtd: "This month to date",
};

const DATE_KEY = /^(\d{4})-(\d{2})-(\d{2})$/;

function utcDateKey(year: number, month: number, day: number): string {
  const date = new Date(Date.UTC(year, month - 1, day));
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseDateKey(
  dateKey: string,
): { year: number; month: number; day: number } | null {
  const match = DATE_KEY.exec(dateKey);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return { year, month, day };
}

/** Monday of the ISO week that owns `dateKey`. */
function isoWeekStartKey(dateKey: string): string | null {
  const parts = parseDateKey(dateKey);
  if (!parts) return null;
  const date = new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
  const isoDow = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() - (isoDow - 1));
  return utcDateKey(
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    date.getUTCDate(),
  );
}

function sumOnFile(
  byKey: Map<string, number>,
  predicate: (key: string) => boolean,
): number | null {
  let saw = false;
  let sum = 0;
  for (const [key, sales] of byKey) {
    if (!predicate(key)) continue;
    saw = true;
    sum += sales;
  }
  return saw ? sum : null;
}

/**
 * Yesterday, this week, and this month to date from stored sales-day totals.
 * Yesterday is the latest stored day (the same day the year board already
 * calls yesterday). This week is Monday through that day. This month uses
 * `monthSales` when the year-over-year card already has it, so the two
 * surfaces stay one number. A window with no stored day is null — not $0.
 */
export function overviewPlainSalesWindows(input: {
  days: readonly OverviewStoredSalesDay[];
  monthSales?: number | null;
  asOfKey?: string | null;
}): OverviewPlainWindow[] {
  const byKey = new Map<string, number>();
  for (const day of input.days) {
    if (!parseDateKey(day.dateKey) || !Number.isFinite(day.sales)) continue;
    byKey.set(day.dateKey, (byKey.get(day.dateKey) ?? 0) + day.sales);
  }

  let asOf: string | null = null;
  if (input.asOfKey && parseDateKey(input.asOfKey)) {
    asOf = input.asOfKey;
  } else {
    for (const key of byKey.keys()) {
      if (asOf == null || key > asOf) asOf = key;
    }
  }

  const yesterday =
    asOf != null && byKey.has(asOf) ? (byKey.get(asOf) ?? null) : null;
  const weekStart = asOf ? isoWeekStartKey(asOf) : null;
  let week: number | null = null;
  if (asOf && weekStart) {
    const endKey = asOf;
    const startKey = weekStart;
    week = sumOnFile(byKey, (key) => key >= startKey && key <= endKey);
  }

  const monthFromCard =
    input.monthSales != null && Number.isFinite(input.monthSales)
      ? input.monthSales
      : null;
  const monthPrefix = asOf ? asOf.slice(0, 7) : null;
  let monthFromDays: number | null = null;
  if (asOf && monthPrefix) {
    const endKey = asOf;
    const prefix = monthPrefix;
    monthFromDays = sumOnFile(
      byKey,
      (key) => key.startsWith(prefix) && key <= endKey,
    );
  }
  const month = monthFromCard != null ? monthFromCard : monthFromDays;

  return OVERVIEW_PLAIN_WINDOW_IDS.map((id) => ({
    id,
    label: PLAIN_WINDOW_LABEL[id],
    sales: plainWindowSales(id, yesterday, week, month),
  }));
}

function plainWindowSales(
  id: OverviewPlainWindowId,
  yesterday: number | null,
  week: number | null,
  month: number | null,
): number | null {
  switch (id) {
    case "yesterday":
      return yesterday;
    case "week":
      return week;
    case "mtd":
      return month;
    default: {
      const _never: never = id;
      return _never;
    }
  }
}

export function overviewPlainWindowFormula(id: OverviewPlainWindowId): string {
  switch (id) {
    case "yesterday":
      return "Shopify Total Sales on the latest stored sales day. Same stored days as the year cards. Not a new order crawl.";
    case "week":
      return "Shopify Total Sales this week, Monday through the latest stored day. Same stored days as the chart and the year cards.";
    case "mtd":
      return "Shopify Total Sales this month to date. The same month number as the year-over-year this month card. Last year stays on that card.";
    default: {
      const _never: never = id;
      return _never;
    }
  }
}

/** Peak weekday dollars for the Overview busiest peek. */
export function overviewBusiestWeekday(input: {
  peakWeekday?: number | null;
  weekdaySalesShare?: number[] | null;
  windowSales?: number | null;
}): OverviewBusiestWeekday | null {
  const peak = input.peakWeekday;
  if (peak == null || !Number.isInteger(peak) || peak < 0 || peak > 6) {
    return null;
  }
  const share = input.weekdaySalesShare?.[peak];
  if (share == null || !Number.isFinite(share) || share <= 0) {
    return null;
  }
  const windowSales = input.windowSales;
  const dollars =
    windowSales != null && Number.isFinite(windowSales) && windowSales > 0
      ? windowSales * share
      : null;
  return {
    label: WEEKDAY_SHORT[peak],
    dollars,
    pct: wholePercent(share),
  };
}
