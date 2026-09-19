/**
 * Soft order-history Goals — LTV Target Line from the observed average +
 * a returning-$ target. Habit stickiness. Zero spend. No ads / upload.
 *
 *   LTV Target Line   = observed first-90 $ (then 30; never a fake year)
 *                     — the average, not a goal the merchant types
 *   Returning progress = year returning $ (guests out)
 *                     ÷ returning-$ target
 *                     — typed when the merchant set one;
 *                       SAMPLE Snowdevil stretch when unset (never “you typed”)
 *
 * Thin shops stay honest empties (syncing / thin / young / unset). Floor is
 * 8 paid orders. Never a blank board, never a fake $0, never a fake year.
 *
 * Pure + Prisma-free so it unit-tests away from the loader.
 */

import {
  pickShareableLtvPeek,
  shareableLtvWindowLabel,
  type ShareableLtvPeekDays,
} from "./shareable-insights";

export const HABIT_GOALS_MIN_ORDERS = 8;

/**
 * SAMPLE year returning-$ stretch. Snowdevil’s book is ~$4k/day; a mid-year
 * board should show real progress, not a met-on-day-one or a fake $0.
 * LTV has no SAMPLE stretch — Target Line is the observed average.
 */
export const SAMPLE_HABIT_RETURNING_TARGET = 800_000;

export const HABIT_LTV_FORMULA_EQ =
  "Target Line = observed first-window average";
export const HABIT_RETURNING_FORMULA_EQ =
  "Returning $ progress = year returning $ ÷ your target";
export const HABIT_RETURNING_SAMPLE_FORMULA_EQ =
  "Returning $ progress = year returning $ ÷ Snowdevil stretch";

export type HabitGoalKind = "ltv" | "returning";

export type HabitGoalEmptyKind = "syncing" | "thin" | "young" | "unset";

export type HabitGoalEmpty = {
  kind: HabitGoalEmptyKind;
  orders: number;
  need: number;
  copy: string;
  verb: string;
};

export type HabitGoalTargetSource = "average" | "typed" | "sample";

export type HabitReturningTargetSource = Exclude<
  HabitGoalTargetSource,
  "average"
>;

export type HabitGoalTrack = {
  kind: HabitGoalKind;
  label: string;
  actual: number;
  target: number;
  /**
   * Average Target Line (LTV), a number the merchant typed (returning $),
   * or SAMPLE Snowdevil stretch (never merchant-entered).
   */
  targetSource: HabitGoalTargetSource;
  remaining: number;
  /** 0–1+; may exceed 1 when they beat a typed target. Average line is 1. */
  pct: number;
  met: boolean;
  formulaEq: string;
  formulaPlug: string;
  windowLabel: string;
  historyLimited: boolean;
};

export type HabitGoalsView = {
  available: boolean;
  empty: HabitGoalEmpty | null;
  ltv: HabitGoalTrack | null;
  returning: HabitGoalTrack | null;
  historyLimited: boolean;
  orderCount: number;
  yearLabel: string;
  /** LTV Target Line — observed average, never a typed goal. */
  ltvTarget: number | null;
  /** Resolved returning-$ target (SAMPLE overlay when unset). */
  returningTarget: number | null;
};

export type HabitGoalsRead = {
  line: string;
  ltvPct: number | null;
  returningPct: number | null;
};

export type HabitGoalsInput = {
  salesPending: boolean;
  orderCount: number;
  ltv30: number | null;
  ltv90: number | null;
  ltv365: number | null;
  yearReturningSales: number | null;
  typedReturningTarget: number | null;
  historyLimited: boolean;
  sample: boolean;
  year: number;
};

function finitePositive(n: number | null | undefined): number | null {
  if (n == null || !Number.isFinite(n) || n <= 0) return null;
  return n;
}

function wholeMoney(n: number): string {
  return Math.round(n).toLocaleString("en-US");
}

function wholePct(share: number): number {
  return Math.round(share * 100);
}

/**
 * Typed target wins. SAMPLE paints a stretch when the merchant has not
 * typed one — so Snowdevil is never a blank / $0 board.
 */
export function resolveHabitTarget(
  typed: number | null | undefined,
  sampleFallback: number,
  sample: boolean,
): number | null {
  const n = finitePositive(typed);
  if (n != null) return n;
  return sample ? sampleFallback : null;
}

/** Typed wins. SAMPLE overlay is stretch — never “you typed.” */
export function resolveHabitReturningTargetSource(
  typed: number | null | undefined,
  sample: boolean,
): HabitReturningTargetSource | null {
  if (finitePositive(typed) != null) return "typed";
  if (sample) return "sample";
  return null;
}

export function habitGoalTargetSourceLabel(
  source: HabitGoalTargetSource,
): string {
  switch (source) {
    case "average":
      return "Average";
    case "typed":
      return "You typed";
    case "sample":
      return "Snowdevil stretch";
    default: {
      const _exhaustive: never = source;
      return _exhaustive;
    }
  }
}

export function habitReturningFormulaEq(
  source: HabitGoalTargetSource,
): string {
  switch (source) {
    case "sample":
      return HABIT_RETURNING_SAMPLE_FORMULA_EQ;
    case "typed":
    case "average":
      return HABIT_RETURNING_FORMULA_EQ;
    default: {
      const _exhaustive: never = source;
      return _exhaustive;
    }
  }
}

export function habitReturningDailyLine(track: HabitGoalTrack): string {
  const actual = wholeMoney(track.actual);
  const target = wholeMoney(track.target);
  const pct = wholePct(track.pct);
  switch (track.targetSource) {
    case "sample":
      return track.met
        ? `Returning buyers already carry ${actual} this year — at the Snowdevil stretch ${target} (SAMPLE example, not a target you typed).`
        : `Returning buyers carry ${actual} this year — ${pct}% of the Snowdevil stretch ${target} (SAMPLE example, not a target you typed).`;
    case "typed":
      return track.met
        ? `Returning buyers already carry ${actual} this year — at your ${target} target.`
        : `Returning buyers carry ${actual} this year — ${pct}% of your ${target} target.`;
    case "average":
      return `Returning buyers carry ${actual} this year.`;
    default: {
      const _exhaustive: never = track.targetSource;
      return _exhaustive;
    }
  }
}

/**
 * Empty / invalid → null (unset). Negative / NaN → NaN (reject).
 * Whole dollars; commas and $ stripped.
 */
export function parseHabitGoalInput(
  raw: FormDataEntryValue | null,
): number | null {
  const cleaned = String(raw ?? "")
    .replace(/[$,\s]/g, "")
    .trim();
  if (cleaned === "") return null;
  const n = Number.parseFloat(cleaned);
  if (!Number.isFinite(n) || n < 0) return Number.NaN;
  if (n === 0) return null;
  return n;
}

export function habitLtvWindowLabel(days: ShareableLtvPeekDays): string {
  return shareableLtvWindowLabel(days);
}

function ltvTrack(
  peek: { amount: number; days: ShareableLtvPeekDays },
  historyLimited: boolean,
): HabitGoalTrack {
  const window = habitLtvWindowLabel(peek.days);
  return {
    kind: "ltv",
    label: "New-buyer worth",
    actual: peek.amount,
    target: peek.amount,
    targetSource: "average",
    remaining: 0,
    pct: 1,
    met: true,
    formulaEq: HABIT_LTV_FORMULA_EQ,
    formulaPlug: `${wholeMoney(peek.amount)} in the ${window} — Target Line from average, not a goal you set.`,
    windowLabel: window,
    historyLimited: historyLimited && peek.days === 365,
  };
}

function returningTrack(
  actual: number,
  target: number,
  year: number,
  historyLimited: boolean,
  targetSource: HabitReturningTargetSource,
): HabitGoalTrack {
  const remaining = Math.max(0, target - actual);
  const pct = actual / target;
  return {
    kind: "returning",
    label: "Returning $",
    actual,
    target,
    targetSource,
    remaining,
    pct,
    met: actual >= target,
    formulaEq: habitReturningFormulaEq(targetSource),
    formulaPlug: `${wholeMoney(actual)} ÷ ${wholeMoney(target)} = ${wholePct(pct)}%.`,
    windowLabel: historyLimited
      ? `${year} returning $ on file — not a full year`
      : `${year} returning $`,
    historyLimited,
  };
}

/**
 * First-win empty when neither track can paint. Syncing / thin / young /
 * unset — not $0, not a blank board.
 */
export function habitGoalsEmptyState(
  orders: number,
  sealed: number,
  salesPending: boolean,
  hasAnyTarget: boolean,
): HabitGoalEmpty | null {
  const need = HABIT_GOALS_MIN_ORDERS;
  if (salesPending || orders <= 0) {
    return {
      kind: "syncing",
      orders: Math.max(0, orders),
      need,
      copy: "Orders still syncing — not $0. LTV Target Line and returning $ fill as paid orders land.",
      verb: "Refresh this page",
    };
  }
  if (orders < need) {
    return {
      kind: "thin",
      orders,
      need,
      copy: `${orders.toLocaleString()} ${orders === 1 ? "order" : "orders"} on file. Order-history tracks seal after ${need} paid orders — not $0.`,
      verb: "Watch the next orders",
    };
  }
  if (!hasAnyTarget) {
    return {
      kind: "unset",
      orders,
      need,
      copy: `${orders.toLocaleString()} orders on file. LTV Target Line is the observed average — no typing. Add a year returning-$ target to track that dollar. Not $0.`,
      verb: "Type a returning-$ target",
    };
  }
  if (sealed <= 0) {
    return {
      kind: "young",
      orders,
      need,
      copy: `${orders.toLocaleString()} orders on file. Observed first-window LTV or year returning $ still need identified buyers — guests stay out — not $0.`,
      verb: "Wait for identified buyers",
    };
  }
  return null;
}

/**
 * Soft LTV + returning-$ tracks over the stored order book.
 * `historyLimited` withholds a fake first-year LTV and a “full year”
 * returning-$ claim.
 */
export function buildHabitGoals(input: HabitGoalsInput): HabitGoalsView {
  const orderCount = Math.max(
    0,
    Math.trunc(Number.isFinite(input.orderCount) ? input.orderCount : 0),
  );
  const yearLabel = String(input.year);
  const returningTarget = resolveHabitTarget(
    input.typedReturningTarget,
    SAMPLE_HABIT_RETURNING_TARGET,
    input.sample,
  );
  const returningSource = resolveHabitReturningTargetSource(
    input.typedReturningTarget,
    input.sample,
  );
  const peek = pickShareableLtvPeek({
    revenue30: input.ltv30,
    revenue90: input.ltv90,
    revenue365: input.ltv365,
    historyLimited: input.historyLimited,
  });
  const ltvTarget = peek?.amount ?? null;
  const yearReturning = finitePositive(input.yearReturningSales);
  const ltv =
    peek != null ? ltvTrack(peek, input.historyLimited) : null;
  const returning =
    yearReturning != null && returningTarget != null && returningSource != null
      ? returningTrack(
          yearReturning,
          returningTarget,
          input.year,
          input.historyLimited,
          returningSource,
        )
      : null;
  const sealed = (ltv ? 1 : 0) + (returning ? 1 : 0);
  const empty = habitGoalsEmptyState(
    orderCount,
    sealed,
    input.salesPending,
    ltvTarget != null || returningTarget != null,
  );
  if (empty) {
    return {
      available: false,
      empty,
      ltv: null,
      returning: null,
      historyLimited: input.historyLimited,
      orderCount,
      yearLabel,
      ltvTarget,
      returningTarget,
    };
  }
  return {
    available: true,
    empty: null,
    ltv,
    returning,
    historyLimited: input.historyLimited,
    orderCount,
    yearLabel,
    ltvTarget,
    returningTarget,
  };
}

/**
 * One shop-owner sentence. Leads with LTV Target Line (the average), then
 * returning $. Never a promise. Order history only.
 */
export function habitGoalsDailyRead(view: HabitGoalsView): HabitGoalsRead | null {
  if (view.empty) return null;
  const ltvPct =
    view.ltv != null && Number.isFinite(view.ltv.pct) ? view.ltv.pct : null;
  const returningPct =
    view.returning != null && Number.isFinite(view.returning.pct)
      ? view.returning.pct
      : null;
  const parts: string[] = [];
  if (view.ltv && ltvPct != null) {
    parts.push(
      `A new buyer is worth ${wholeMoney(view.ltv.actual)} in the ${view.ltv.windowLabel} — Target Line is that average, not a goal you set.`,
    );
  }
  if (view.returning && returningPct != null) {
    parts.push(habitReturningDailyLine(view.returning));
  }
  if (parts.length === 0) return null;
  return {
    line: parts.join(" "),
    ltvPct,
    returningPct,
  };
}

export function habitGoalsHistoryLine(view: HabitGoalsView): string {
  if (view.historyLimited) {
    return "Observed from the stored book — not a full year, never a fake first-year.";
  }
  return `Observed from the stored ${view.yearLabel} book.`;
}

/** Honest zeros for pending / no-data — not a fake board. */
export function emptyHabitGoals(year = new Date().getFullYear()): HabitGoalsView {
  return buildHabitGoals({
    salesPending: true,
    orderCount: 0,
    ltv30: null,
    ltv90: null,
    ltv365: null,
    yearReturningSales: null,
    typedReturningTarget: null,
    historyLimited: false,
    sample: false,
    year,
  });
}
