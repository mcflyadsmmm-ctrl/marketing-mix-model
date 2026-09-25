/**
 * Certified-day cash control — MER Dashboard window algebra, McFly nouns.
 *
 * Total ROAS = Σ sales ÷ Σ spend (never the mean of daily ratios).
 * Closed days only. Unpaired spend (spend with no sales) is excluded from
 * MER windows — never painted as 0.00×. Advisory surfaces do not import this.
 *
 * Client-safe: no Prisma, no Shopify.
 */

import { overviewWindowRange } from "./overview-yoy";
import {
  isUnpairedSpendDay,
  type ExplorerDailyRow,
} from "./spend-explorer";

export type CashWindow = "ytd" | "qtd" | "mtd";
export type CashChipId = "yesterday" | "l7" | "mtd" | "qtd" | "ytd";
export type LedgerGrain = "day" | "month" | "quarter" | "year";

export type CertifiedDay = {
  dateKey: string;
  year: number;
  monthIndex: number;
  day: number;
  quarter: number;
  sales: number;
  spend: number;
  mer: number | null;
  channels: Array<{ channel: string; amount: number }>;
  residualSpend: number;
  unpaired: boolean;
};

export type WindowTotals = {
  sales: number;
  spend: number;
  mer: number | null;
  channels: Array<{ channel: string; amount: number }>;
  days: number;
  fromKey: string | null;
  toKey: string | null;
};

export type CashChip = {
  id: CashChipId;
  label: string;
  sales: number;
  spend: number;
  mer: number | null;
  vsTarget: number | null;
  fromKey: string | null;
  toKey: string | null;
  yoySalesPct: number | null;
  /** Same window last year $ — null when that window has no certified days. */
  priorSales: number | null;
  /** Same window last year — for the “see last year” drill. */
  priorFromKey: string | null;
  priorToKey: string | null;
};

/** Zone on a certified chip vs the merchant target. Empty spend is never 0×. */
export type ChipZone = "ok" | "below" | "empty" | "unset";

export function chipZone(
  chip: Pick<CashChip, "mer" | "spend" | "vsTarget">,
): ChipZone {
  if (!(chip.spend > 0) || chip.mer == null) return "empty";
  if (chip.vsTarget == null) return "unset";
  if (chip.vsTarget >= -1e-6) return "ok";
  return "below";
}

export type DualClose = {
  daysElapsed: number;
  daysInMonth: number;
  remainingDays: number;
  mtd: WindowTotals;
  mtdFlat: { projSales: number; projSpend: number; projMer: number | null };
  l7: WindowTotals;
  l7Close: { projSales: number; projSpend: number; projMer: number | null };
  railOk: boolean;
};

/** Shop-owner month-close sentence — never MTD / L7 labels. */
export type DualCloseLineModel = {
  remainingDays: number;
  /** Closed days in the last-N pace window (may be under 7). */
  paceDays: number;
  monthRateSales: number;
  monthRateSpend: number;
  monthRateMer: number | null;
  last7RateSales: number;
  last7RateSpend: number;
  last7RateMer: number | null;
  monthRateHitsGoal: boolean;
  last7RateHitsGoal: boolean;
  targetMer: number;
};

export type CompareScoreId = "thisMonth" | "lastMonth" | "lastYear";

export type CompareScoreRow = {
  id: CompareScoreId;
  label: string;
  sales: number;
  spend: number;
  mer: number | null;
  days: number;
  /** This row’s sales vs this month. Null on the this-month row. */
  salesChangePct: number | null;
};

export type MonthClosePlan = {
  path: "l7" | "mtd";
  projSales: number;
  maxRem: number;
  freezeMer: number | null;
  cannotHit: boolean;
  emailRem: number;
  paidRem: number;
  paidDailyCap: number;
  scale: number;
  daily: Array<{
    channel: string;
    locked: boolean;
    l7Daily: number;
    planDaily: number;
  }>;
};

export type MixRow = {
  channel: string;
  spend: number;
  share: number;
  perDay: number;
  activeDays: number;
  dayShare: number;
  concentrationPts: number;
  locked: boolean;
  note: string;
};

export type LedgerRow = {
  key: string;
  label: string;
  sales: number;
  spend: number;
  mer: number | null;
  hit: boolean | null;
  channels: Array<{ channel: string; amount: number }>;
};

export type FeedBounds = {
  year: number;
  monthIndex: number;
  quarter: number;
  day: number;
  dateKey: string;
};

export type MonthNeed = {
  /** (last-7 projected spend × goal) − this month’s sales so far. */
  salesStillNeeded: number;
  /** Last-7 projected sales / goal − last-7 projected spend. Negative = over. */
  spendRoom: number;
  projSales: number;
  projSpend: number;
};

export type MixCompareRow = {
  channel: string;
  aSpend: number;
  bSpend: number;
  aShare: number;
  bShare: number;
  deltaPts: number;
};

export type CutClose = {
  windowMer: number | null;
  closeMer: number | null;
  projSales: number;
  projSpend: number;
  sales: number;
  spend: number;
};

export type RollingWindow = {
  sales: number;
  spend: number;
  mer: number | null;
  days: number;
  priorSales: number;
  priorSpend: number;
  priorMer: number | null;
  salesChangePct: number | null;
  spendChangePct: number | null;
  merChange: number | null;
};

export type SpendAlertCode =
  | "rolling_mer_below_target"
  | "seven_day_spend_jump"
  | "seven_day_sales_drop"
  | "three_day_target_miss"
  | "unmapped_spend"
  | "unpaired_spend";

export type SpendAlert = {
  severity: "high" | "medium";
  code: SpendAlertCode;
  message: string;
};

export type OperatingModeId =
  | "efficient_growth"
  | "productive_scaling"
  | "spend_led_growth"
  | "efficiency_risk"
  | "contraction"
  | "need_days";

export type OperatingIntelligence = {
  rolling7: RollingWindow;
  rolling28: RollingWindow;
  hitRate28: number | null;
  hitDays28: number;
  eligibleDays28: number;
  mappedCoverage28: number | null;
  residualSpend28: number;
  safeSpendMtd: number;
  headroomMtd: number;
  topChannel28: { name: string | null; spend: number; sharePct: number | null };
  mode: OperatingModeId;
  modeLabel: string;
  takeaway: string;
  alerts: SpendAlert[];
};

export type CashControlBoard = {
  asOfKey: string | null;
  targetMer: number;
  chips: CashChip[];
  dualClose: DualClose | null;
  plan: MonthClosePlan | null;
  need: MonthNeed | null;
  mix: MixRow[];
  residualDays: number;
  unpairedDays: string[];
  ledger: LedgerRow[];
  /** This-month days — default mix / scenario. */
  mtdDays: CertifiedDay[];
  /** Paired days in the loaded feed — client grain, mix window, channel drill. */
  drillDays: CertifiedDay[];
  /** Last 7 / 28 vs prior — Black Clover operating strip, McFly nouns. */
  intel: OperatingIntelligence | null;
  /** This month vs last month vs same days last year — Compare score, no extra tab. */
  compareScores: CompareScoreRow[];
};

const DATE_KEY_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const RESIDUAL_UNMAPPED = 0.5;
const CONC_HEAVY = 12;
const CONC_THIN = -12;

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function merOf(sales: number, spend: number): number | null {
  if (!(spend > 0) || !Number.isFinite(sales) || !Number.isFinite(spend)) {
    return null;
  }
  const mer = sales / spend;
  return Number.isFinite(mer) ? mer : null;
}

export function parseDateKey(
  dateKey: string,
): { year: number; monthIndex: number; day: number; quarter: number } | null {
  const m = DATE_KEY_RE.exec(dateKey);
  if (!m) return null;
  const year = Number(m[1]);
  const monthIndex = Number(m[2]) - 1;
  const day = Number(m[3]);
  if (
    !Number.isFinite(year) ||
    monthIndex < 0 ||
    monthIndex > 11 ||
    day < 1 ||
    day > 31
  ) {
    return null;
  }
  return { year, monthIndex, day, quarter: Math.floor(monthIndex / 3) + 1 };
}

export function isEmailLockedChannel(channel: string): boolean {
  const n = channel.toLowerCase();
  return (
    n === "email" ||
    n.startsWith("email:") ||
    n.includes("klaviyo") ||
    n.includes("sms")
  );
}

export function daysInCalendarMonth(year: number, monthIndex: number): number {
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
}

function sortByDateKey(rows: CertifiedDay[]): CertifiedDay[] {
  return [...rows].sort((a, b) => a.dateKey.localeCompare(b.dateKey));
}

function mergeChannelMap(
  into: Map<string, number>,
  channels: Array<{ channel: string; amount: number }>,
): void {
  for (const { channel, amount } of channels) {
    if (!channel || !(amount > 0)) continue;
    into.set(channel, (into.get(channel) ?? 0) + amount);
  }
}

function channelsFromMap(
  map: Map<string, number>,
): Array<{ channel: string; amount: number }> {
  return [...map.entries()]
    .map(([channel, amount]) => ({ channel, amount: round2(amount) }))
    .filter((c) => c.amount > 0)
    .sort((a, b) => b.amount - a.amount);
}

/**
 * Fail-closed certify: unpaired spend days never enter MER windows.
 * Residual > $0.50 becomes an Unmapped audit channel; denominator stays spend.
 */
export function certifyDailyRows(rows: ExplorerDailyRow[]): {
  days: CertifiedDay[];
  unpairedDays: string[];
  residualDays: number;
} {
  const unpairedDays: string[] = [];
  let residualDays = 0;
  const days: CertifiedDay[] = [];

  for (const row of rows) {
    const parsed = parseDateKey(row.dateKey);
    if (!parsed) continue;
    const sales = Number.isFinite(row.sales) ? row.sales : 0;
    const mapped = (row.channels ?? []).reduce(
      (sum, c) => sum + (c.amount > 0 ? c.amount : 0),
      0,
    );
    const spend = Number.isFinite(row.spend) ? row.spend : mapped;
    const residualSpend = round2(spend - mapped);
    const channels = [...(row.channels ?? [])].filter((c) => c.amount > 0);
    if (residualSpend > RESIDUAL_UNMAPPED) {
      channels.push({ channel: "Unmapped", amount: residualSpend });
      residualDays += 1;
    }
    const unpaired = isUnpairedSpendDay(sales, spend);
    if (unpaired) unpairedDays.push(row.dateKey);
    days.push({
      dateKey: row.dateKey,
      year: parsed.year,
      monthIndex: parsed.monthIndex,
      day: parsed.day,
      quarter: parsed.quarter,
      sales: round2(sales),
      spend: round2(spend),
      mer: unpaired ? null : merOf(sales, spend),
      channels,
      residualSpend,
      unpaired,
    });
  }

  return { days: sortByDateKey(days), unpairedDays, residualDays };
}

/** Paired closed days that may enter MER / chips. */
export function merDays(days: CertifiedDay[]): CertifiedDay[] {
  return days.filter((d) => !d.unpaired);
}

export function feedBounds(days: CertifiedDay[]): FeedBounds | null {
  const eligible = merDays(days);
  const last = eligible[eligible.length - 1];
  if (!last) return null;
  return {
    year: last.year,
    monthIndex: last.monthIndex,
    quarter: last.quarter,
    day: last.day,
    dateKey: last.dateKey,
  };
}

export function computeTotals(rows: CertifiedDay[]): WindowTotals {
  const sales = rows.reduce((s, r) => s + r.sales, 0);
  const spend = rows.reduce((s, r) => s + r.spend, 0);
  const map = new Map<string, number>();
  for (const row of rows) mergeChannelMap(map, row.channels);
  return {
    sales: round2(sales),
    spend: round2(spend),
    mer: merOf(sales, spend),
    channels: channelsFromMap(map),
    days: rows.length,
    fromKey: rows[0]?.dateKey ?? null,
    toKey: rows[rows.length - 1]?.dateKey ?? null,
  };
}

export function getPeriodRows(
  days: CertifiedDay[],
  bounds: FeedBounds,
  year: number,
  window: CashWindow,
): CertifiedDay[] {
  const eligible = merDays(days);
  return eligible.filter((row) => {
    if (row.year !== year) return false;
    if (row.monthIndex > bounds.monthIndex) return false;
    if (row.monthIndex === bounds.monthIndex && row.day > bounds.day) {
      return false;
    }
    if (window === "ytd") return true;
    if (window === "qtd") return row.quarter === bounds.quarter;
    return row.monthIndex === bounds.monthIndex;
  });
}

export function lastNCertifiedRows(
  days: CertifiedDay[],
  n: number,
): CertifiedDay[] {
  const eligible = merDays(days);
  if (n <= 0) return [];
  return eligible.slice(Math.max(0, eligible.length - n));
}

function yoySalesPct(current: number, prior: number): number | null {
  if (!(prior > 0)) return current === 0 ? 0 : null;
  return ((current - prior) / prior) * 100;
}

function chipFromTotals(
  id: CashChipId,
  label: string,
  totals: WindowTotals,
  targetMer: number,
  prior: WindowTotals | null,
): CashChip {
  return {
    id,
    label,
    sales: totals.sales,
    spend: totals.spend,
    mer: totals.mer,
    vsTarget:
      totals.mer != null && targetMer > 0 ? totals.mer - targetMer : null,
    fromKey: totals.fromKey,
    toKey: totals.toKey,
    yoySalesPct:
      prior == null ? null : yoySalesPct(totals.sales, prior.sales),
    priorSales: prior == null ? null : prior.sales,
    priorFromKey: prior?.fromKey ?? null,
    priorToKey: prior?.toKey ?? null,
  };
}

export function buildCashChips(
  days: CertifiedDay[],
  targetMer: number,
): CashChip[] {
  const bounds = feedBounds(days);
  if (!bounds) return [];
  const yesterdayRows = lastNCertifiedRows(days, 1);
  const l7Rows = lastNCertifiedRows(days, 7);
  const mtd = getPeriodRows(days, bounds, bounds.year, "mtd");
  const qtd = getPeriodRows(days, bounds, bounds.year, "qtd");
  const ytd = getPeriodRows(days, bounds, bounds.year, "ytd");
  const priorYear = bounds.year - 1;
  const priorMtd = getPeriodRows(days, bounds, priorYear, "mtd");
  const priorQtd = getPeriodRows(days, bounds, priorYear, "qtd");
  const priorYtd = getPeriodRows(days, bounds, priorYear, "ytd");

  const l7Label =
    l7Rows.length === 1
      ? "Last day"
      : `Last ${l7Rows.length} days`;

  return [
    chipFromTotals(
      "yesterday",
      "Yesterday",
      computeTotals(yesterdayRows),
      targetMer,
      null,
    ),
    chipFromTotals("l7", l7Label, computeTotals(l7Rows), targetMer, null),
    chipFromTotals(
      "mtd",
      "This month",
      computeTotals(mtd),
      targetMer,
      priorMtd.length ? computeTotals(priorMtd) : null,
    ),
    chipFromTotals(
      "qtd",
      "This quarter",
      computeTotals(qtd),
      targetMer,
      priorQtd.length ? computeTotals(priorQtd) : null,
    ),
    chipFromTotals(
      "ytd",
      "This year",
      computeTotals(ytd),
      targetMer,
      priorYtd.length ? computeTotals(priorYtd) : null,
    ),
  ].filter((chip) => chip.fromKey != null);
}

/**
 * MTD-flat close uses the same daily rates for sales and spend, so proj MER
 * equals current MTD MER. L7 close paces remaining days at L7 rates — that
 * is the informative second number.
 */
export function buildDualClose(
  days: CertifiedDay[],
  targetMer: number,
): DualClose | null {
  const bounds = feedBounds(days);
  if (!bounds) return null;
  const mtdRows = getPeriodRows(days, bounds, bounds.year, "mtd");
  if (!mtdRows.length) return null;
  const mtd = computeTotals(mtdRows);
  const daysInMonth = daysInCalendarMonth(bounds.year, bounds.monthIndex);
  const daysElapsed = Math.max(
    ...mtdRows.map((r) => r.day),
    0,
  );
  const remainingDays = Math.max(0, daysInMonth - daysElapsed);
  const l7Rows = lastNCertifiedRows(days, 7);
  const l7 = computeTotals(l7Rows);
  const l7n = Math.max(1, l7.days);
  const mtdDailySales = daysElapsed > 0 ? mtd.sales / daysElapsed : 0;
  const mtdDailySpend = daysElapsed > 0 ? mtd.spend / daysElapsed : 0;
  const l7DailySales = l7.sales / l7n;
  const l7DailySpend = l7.spend / l7n;
  const mtdFlatSales = mtd.sales + mtdDailySales * remainingDays;
  const mtdFlatSpend = mtd.spend + mtdDailySpend * remainingDays;
  const l7Sales = mtd.sales + l7DailySales * remainingDays;
  const l7Spend = mtd.spend + l7DailySpend * remainingDays;
  const mtdFlatMer = merOf(mtdFlatSales, mtdFlatSpend);
  const l7Mer = merOf(l7Sales, l7Spend);
  const railOk =
    targetMer > 0 &&
    mtdFlatMer != null &&
    l7Mer != null &&
    mtdFlatMer >= targetMer &&
    l7Mer >= targetMer;

  return {
    daysElapsed,
    daysInMonth,
    remainingDays,
    mtd,
    mtdFlat: {
      projSales: round2(mtdFlatSales),
      projSpend: round2(mtdFlatSpend),
      projMer: mtdFlatMer,
    },
    l7,
    l7Close: {
      projSales: round2(l7Sales),
      projSpend: round2(l7Spend),
      projMer: l7Mer,
    },
    railOk,
  };
}

export function dualCloseLineModel(
  close: DualClose | null,
  targetMer: number,
): DualCloseLineModel | null {
  if (!(targetMer > 0)) return null;
  if (!close || close.remainingDays <= 0) return null;
  if (!(close.mtd.spend > 0)) return null;
  const monthRateMer =
    close.mtdFlat.projSpend > 0 ? close.mtdFlat.projMer : null;
  const last7RateMer =
    close.l7Close.projSpend > 0 ? close.l7Close.projMer : null;
  return {
    remainingDays: close.remainingDays,
    paceDays: close.l7.days,
    monthRateSales: close.mtdFlat.projSales,
    monthRateSpend: close.mtdFlat.projSpend,
    monthRateMer,
    last7RateSales: close.l7Close.projSales,
    last7RateSpend: close.l7Close.projSpend,
    last7RateMer,
    monthRateHitsGoal:
      monthRateMer != null &&
      targetMer > 0 &&
      monthRateMer >= targetMer,
    last7RateHitsGoal:
      last7RateMer != null &&
      targetMer > 0 &&
      last7RateMer >= targetMer,
    targetMer,
  };
}

export function buildMonthClosePlan(
  days: CertifiedDay[],
  targetMer: number,
  path: "l7" | "mtd" = "l7",
): MonthClosePlan | null {
  const close = buildDualClose(days, targetMer);
  if (!close || !(targetMer > 0) || close.remainingDays <= 0) return null;
  const pace = path === "l7" ? close.l7 : close.mtd;
  const n = Math.max(1, pace.days);
  const remSales = close.remainingDays * (pace.sales / n);
  const projSales = close.mtd.sales + remSales;
  const maxRem = projSales / targetMer - close.mtd.spend;
  const freezeMer = merOf(projSales, close.mtd.spend);
  const cannotHit = maxRem < 0;

  const l7 = close.l7;
  const l7n = Math.max(1, l7.days);
  const channelDaily = new Map<string, number>();
  for (const ch of l7.channels) {
    channelDaily.set(ch.channel, ch.amount / l7n);
  }
  let emailDaily = 0;
  let paidDaily = 0;
  for (const [channel, daily] of channelDaily) {
    if (isEmailLockedChannel(channel)) emailDaily += daily;
    else paidDaily += daily;
  }
  const emailRem = emailDaily * close.remainingDays;
  const paidRem = cannotHit ? 0 : Math.max(0, maxRem - emailRem);
  const paidDailyCap =
    close.remainingDays > 0 ? paidRem / close.remainingDays : 0;
  const scale = paidDaily > 0 ? paidDailyCap / paidDaily : 0;

  const daily = [...channelDaily.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([channel, l7Daily]) => {
      const locked = isEmailLockedChannel(channel);
      const planDaily = cannotHit
        ? locked
          ? l7Daily
          : 0
        : locked
          ? l7Daily
          : l7Daily * scale;
      return {
        channel,
        locked,
        l7Daily: round2(l7Daily),
        planDaily: round2(planDaily),
      };
    });

  return {
    path,
    projSales: round2(projSales),
    maxRem: round2(maxRem),
    freezeMer,
    cannotHit,
    emailRem: round2(emailRem),
    paidRem: round2(paidRem),
    paidDailyCap: round2(paidDailyCap),
    scale: round2(scale),
    daily,
  };
}

/** Cut one channel, hold sales flat. MER = Σsales / Σspend′. */
export function cutChannelHoldSales(
  rows: CertifiedDay[],
  channel: string,
  cutPct: number,
): WindowTotals {
  const factor = Math.max(0, Math.min(1, 1 - cutPct));
  const adjusted: CertifiedDay[] = rows.map((row) => {
    const nextChannels = row.channels.map((c) =>
      c.channel === channel ? { ...c, amount: c.amount * factor } : c,
    );
    const cutAmount = row.channels
      .filter((c) => c.channel === channel)
      .reduce((s, c) => s + c.amount, 0) * cutPct;
    return {
      ...row,
      spend: Math.max(0, row.spend - cutAmount),
      channels: nextChannels,
    };
  });
  return computeTotals(adjusted);
}

/**
 * After a hold-sales cut on this month, remaining days follow last-7 *cut*
 * spend (sales stay on last-7). MTD-flat after a cut equals the cut MER —
 * last-7 remaining is the useful second number.
 */
export function projectCloseAfterCut(
  mtdDays: CertifiedDay[],
  l7Days: CertifiedDay[],
  remainingDays: number,
  channel: string,
  cutPct: number,
): CutClose | null {
  if (!mtdDays.length || remainingDays < 0) return null;
  const cutMtd = cutChannelHoldSales(mtdDays, channel, cutPct);
  const cutL7 = l7Days.length
    ? cutChannelHoldSales(l7Days, channel, cutPct)
    : cutMtd;
  const n = Math.max(1, cutL7.days);
  const projSales = cutMtd.sales + (cutL7.sales / n) * remainingDays;
  const projSpend = cutMtd.spend + (cutL7.spend / n) * remainingDays;
  return {
    windowMer: cutMtd.mer,
    closeMer: merOf(projSales, projSpend),
    projSales: round2(projSales),
    projSpend: round2(projSpend),
    sales: cutMtd.sales,
    spend: cutMtd.spend,
  };
}

/** Sales still needed / spend room if last-7 days continue. */
export function buildMonthNeed(
  close: DualClose,
  targetMer: number,
): MonthNeed | null {
  if (!(targetMer > 0) || close.remainingDays <= 0) return null;
  const projSpend = close.l7Close.projSpend;
  const projSales = close.l7Close.projSales;
  const salesStillNeeded = Math.max(0, projSpend * targetMer - close.mtd.sales);
  const spendRoom = projSales / targetMer - projSpend;
  return {
    salesStillNeeded: round2(salesStillNeeded),
    spendRoom: round2(spendRoom),
    projSales: round2(projSales),
    projSpend: round2(projSpend),
  };
}

export function siblingWindowDays(
  days: CertifiedDay[],
  kind: "lastMonth" | "sameMonthLastYear",
): CertifiedDay[] {
  const bounds = feedBounds(days);
  if (!bounds) return [];
  const eligible = merDays(days);
  if (kind === "sameMonthLastYear") {
    return eligible.filter(
      (d) => d.year === bounds.year - 1 && d.monthIndex === bounds.monthIndex,
    );
  }
  let year = bounds.year;
  let monthIndex = bounds.monthIndex - 1;
  if (monthIndex < 0) {
    monthIndex = 11;
    year -= 1;
  }
  return eligible.filter((d) => d.year === year && d.monthIndex === monthIndex);
}

/** Same calendar day cutoff as this month so far — not a full sibling month. */
export function alignedSiblingWindowDays(
  days: CertifiedDay[],
  kind: "lastMonth" | "sameMonthLastYear",
): CertifiedDay[] {
  const bounds = feedBounds(days);
  const raw = siblingWindowDays(days, kind);
  if (!bounds) return raw;
  return raw.filter((d) => d.day <= bounds.day);
}

function namedSpendWindow(base: string, slice: CertifiedDay[]): string {
  const ordered = [...slice].sort((a, b) => a.dateKey.localeCompare(b.dateKey));
  const range = overviewWindowRange(
    ordered[0]?.dateKey ?? null,
    ordered[ordered.length - 1]?.dateKey ?? null,
  );
  return range ? `${base} · ${range}` : base;
}

/**
 * One dollar figure per named window.
 * Last month is the full prior month — the same dollars as that month on the year board.
 * Last year stays the same dates as this month so far.
 * The only percent is this month versus that same window last year.
 */
export function buildCompareScores(days: CertifiedDay[]): CompareScoreRow[] {
  const thisMonth = mixWindowDays(days, "mtd");
  if (!thisMonth.length) return [];
  const thisTot = computeTotals(thisMonth);
  const lastYearSlice = alignedSiblingWindowDays(days, "sameMonthLastYear");
  const lastYearTotals = lastYearSlice.length
    ? computeTotals(lastYearSlice)
    : null;
  const rows: CompareScoreRow[] = [
    {
      id: "thisMonth",
      label: namedSpendWindow("This month", thisMonth),
      sales: thisTot.sales,
      spend: thisTot.spend,
      mer: thisTot.mer,
      days: thisTot.days,
      salesChangePct:
        lastYearTotals != null && lastYearTotals.sales > 0
          ? pctChange(thisTot.sales, lastYearTotals.sales)
          : null,
    },
  ];
  const push = (
    id: CompareScoreId,
    label: string,
    slice: CertifiedDay[],
  ): void => {
    if (!slice.length) return;
    const tot = computeTotals(slice);
    rows.push({
      id,
      label: namedSpendWindow(label, slice),
      sales: tot.sales,
      spend: tot.spend,
      mer: tot.mer,
      days: tot.days,
      salesChangePct: null,
    });
  };
  push("lastMonth", "Last month", siblingWindowDays(days, "lastMonth"));
  push("lastYear", "This month last year", lastYearSlice);
  return rows;
}

export function compareMix(
  a: CertifiedDay[],
  b: CertifiedDay[],
): MixCompareRow[] {
  const aMix = mixRowsFromDays(a);
  const bMix = mixRowsFromDays(b);
  const names = new Set([...aMix.map((r) => r.channel), ...bMix.map((r) => r.channel)]);
  const aBy = new Map(aMix.map((r) => [r.channel, r]));
  const bBy = new Map(bMix.map((r) => [r.channel, r]));
  return [...names]
    .map((channel) => {
      const ar = aBy.get(channel);
      const br = bBy.get(channel);
      const aSpend = ar?.spend ?? 0;
      const bSpend = br?.spend ?? 0;
      const aShare = ar?.share ?? 0;
      const bShare = br?.share ?? 0;
      return {
        channel,
        aSpend: round2(aSpend),
        bSpend: round2(bSpend),
        aShare,
        bShare,
        deltaPts: round2((aShare - bShare) * 100),
      };
    })
    .filter((row) => row.aSpend > 0 || row.bSpend > 0)
    .sort((x, y) => y.aSpend + y.bSpend - (x.aSpend + x.bSpend));
}

export function mixRowsFromDays(rows: CertifiedDay[]): MixRow[] {
  const eligible = merDays(rows);
  const totals = computeTotals(eligible);
  const portfolioDays = eligible.filter((r) => r.spend > 0).length;
  const denomDays = Math.max(1, portfolioDays);
  return totals.channels.map((ch) => {
    const activeDays = eligible.filter((r) =>
      r.channels.some((c) => c.channel === ch.channel && c.amount > 0),
    ).length;
    const share = totals.spend > 0 ? ch.amount / totals.spend : 0;
    const dayShare = activeDays / denomDays;
    const concentrationPts = (share - dayShare) * 100;
    let note = "";
    if (ch.channel === "Unmapped") {
      note = "Spend not in a channel";
    } else if (concentrationPts >= CONC_HEAVY) {
      note = "Most of the dollars, fewer days";
    } else if (concentrationPts <= CONC_THIN) {
      note = "On many days, smaller dollars";
    }
    return {
      channel: ch.channel,
      spend: ch.amount,
      share,
      perDay: eligible.length > 0 ? ch.amount / eligible.length : 0,
      activeDays,
      dayShare,
      concentrationPts: round2(concentrationPts),
      locked: isEmailLockedChannel(ch.channel),
      note,
    };
  });
}

function ledgerKey(row: CertifiedDay, grain: LedgerGrain): string {
  if (grain === "day") return row.dateKey;
  if (grain === "month") {
    return `${row.year}-${String(row.monthIndex + 1).padStart(2, "0")}`;
  }
  if (grain === "quarter") return `${row.year}-Q${row.quarter}`;
  return String(row.year);
}

const MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

function ledgerLabel(row: CertifiedDay, grain: LedgerGrain): string {
  if (grain === "day") return row.dateKey;
  if (grain === "month") {
    return `${MONTHS_SHORT[row.monthIndex] ?? row.monthIndex + 1} ${row.year}`;
  }
  if (grain === "quarter") return `Q${row.quarter} ${row.year}`;
  return String(row.year);
}

/** First/last paired day inside a ledger group — for the chart drill. */
export function ledgerExplorerWindow(
  days: CertifiedDay[],
  grain: LedgerGrain,
  key: string,
): { fromKey: string; toKey: string } | null {
  const group = merDays(days).filter((row) => ledgerKey(row, grain) === key);
  if (!group.length) {
    if (grain === "day" && DATE_KEY_RE.test(key)) {
      return { fromKey: key, toKey: key };
    }
    return null;
  }
  const sorted = sortByDateKey(group);
  return {
    fromKey: sorted[0].dateKey,
    toKey: sorted[sorted.length - 1].dateKey,
  };
}

/** Paired days where this channel spent. */
export function channelDayRows(
  days: CertifiedDay[],
  channel: string,
): CertifiedDay[] {
  return merDays(days).filter((row) =>
    row.channels.some((c) => c.channel === channel && c.amount > 0),
  );
}

export function aggregateLedger(
  days: CertifiedDay[],
  grain: LedgerGrain,
  targetMer: number,
): LedgerRow[] {
  const eligible = merDays(days);
  const groups = new Map<string, CertifiedDay[]>();
  for (const row of eligible) {
    const key = ledgerKey(row, grain);
    const list = groups.get(key) ?? [];
    list.push(row);
    groups.set(key, list);
  }
  return [...groups.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, group]) => {
      const totals = computeTotals(group);
      return {
        key,
        label: ledgerLabel(group[0], grain),
        sales: totals.sales,
        spend: totals.spend,
        mer: totals.mer,
        hit:
          totals.mer != null && targetMer > 0
            ? totals.mer >= targetMer
            : null,
        channels: totals.channels,
      };
    });
}

export type MixWindowId = "mtd" | "l7" | "qtd";

/** Mix / scenario days for This month, Last 7 days, or This quarter. */
export function mixWindowDays(
  days: CertifiedDay[],
  window: MixWindowId,
): CertifiedDay[] {
  const bounds = feedBounds(days);
  if (!bounds) return merDays(days);
  if (window === "l7") return lastNCertifiedRows(days, 7);
  return getPeriodRows(days, bounds, bounds.year, window);
}

/** Ledger rows a merchant can click — recent days, or last year of months. */
export function ledgerForGrain(
  days: CertifiedDay[],
  grain: LedgerGrain,
  targetMer: number,
): LedgerRow[] {
  const source =
    grain === "day" ? lastNCertifiedRows(days, 14) : merDays(days);
  const rows = aggregateLedger(source, grain, targetMer).reverse();
  if (grain === "month") return rows.slice(0, 12);
  if (grain === "quarter") return rows.slice(0, 8);
  if (grain === "year") return rows.slice(0, 5);
  return rows;
}

export function paidSpendExcludingEmail(totals: WindowTotals): number {
  const email = totals.channels
    .filter((c) => isEmailLockedChannel(c.channel))
    .reduce((s, c) => s + c.amount, 0);
  return round2(Math.max(0, totals.spend - email));
}

function pctChange(current: number, prior: number): number | null {
  if (!(prior > 0)) return current === 0 ? 0 : null;
  return ((current - prior) / prior) * 100;
}

/** Last N paired days and the N paired days before that. */
export function splitLastN(
  days: CertifiedDay[],
  n: number,
): { current: CertifiedDay[]; prior: CertifiedDay[] } {
  const eligible = merDays(days);
  if (n <= 0) return { current: [], prior: [] };
  const current = eligible.slice(Math.max(0, eligible.length - n));
  const before = eligible.slice(0, Math.max(0, eligible.length - n));
  const prior = before.slice(Math.max(0, before.length - n));
  return { current, prior };
}

function rollingFrom(
  current: CertifiedDay[],
  prior: CertifiedDay[],
): RollingWindow {
  const c = computeTotals(current);
  const p = computeTotals(prior);
  return {
    sales: c.sales,
    spend: c.spend,
    mer: c.mer,
    days: c.days,
    priorSales: p.sales,
    priorSpend: p.spend,
    priorMer: p.mer,
    salesChangePct: pctChange(c.sales, p.sales),
    spendChangePct: pctChange(c.spend, p.spend),
    merChange: c.mer != null && p.mer != null ? c.mer - p.mer : null,
  };
}

function operatingMode(r: RollingWindow): {
  id: OperatingModeId;
  label: string;
} {
  if (r.salesChangePct == null || r.spendChangePct == null) {
    return { id: "need_days", label: "Need more days" };
  }
  if (r.salesChangePct >= 0 && r.spendChangePct <= 0) {
    return { id: "efficient_growth", label: "Efficient growth" };
  }
  if (r.salesChangePct >= 0 && r.spendChangePct > 0 && (r.merChange ?? 0) >= 0) {
    return { id: "productive_scaling", label: "Productive scaling" };
  }
  if (r.salesChangePct < 0 && r.spendChangePct > 0) {
    return { id: "efficiency_risk", label: "Efficiency risk" };
  }
  if (r.salesChangePct < 0 && r.spendChangePct <= 0) {
    return { id: "contraction", label: "Contraction" };
  }
  return { id: "spend_led_growth", label: "Spend-led growth" };
}

function merLabel(mer: number | null): string {
  return mer == null ? "—" : `${mer.toFixed(2)}×`;
}

function buildSpendAlerts(input: {
  rolling7: RollingWindow;
  targetMer: number;
  last28: CertifiedDay[];
  coverage: number | null;
  unpairedDays: string[];
}): SpendAlert[] {
  const alerts: SpendAlert[] = [];
  const { rolling7, targetMer, last28, coverage, unpairedDays } = input;
  if (
    rolling7.spend > 0 &&
    rolling7.mer != null &&
    targetMer > 0 &&
    rolling7.mer < targetMer
  ) {
    alerts.push({
      severity: "high",
      code: "rolling_mer_below_target",
      message: `Last ${rolling7.days} days' sales ÷ spend is ${merLabel(rolling7.mer)} vs ${merLabel(targetMer)} goal.`,
    });
  }
  const last3 = merDays(last28).filter((r) => r.spend > 0).slice(-3);
  if (
    targetMer > 0 &&
    last3.length === 3 &&
    last3.every((r) => r.mer != null && r.mer < targetMer)
  ) {
    alerts.push({
      severity: "high",
      code: "three_day_target_miss",
      message: "Last 3 spend days were below goal.",
    });
  }
  if (rolling7.spendChangePct != null && rolling7.spendChangePct >= 25) {
    alerts.push({
      severity: "medium",
      code: "seven_day_spend_jump",
      message: `Last ${rolling7.days} days' spend is up ${Math.round(rolling7.spendChangePct)}% versus the ${rolling7.days} days before.`,
    });
  }
  if (rolling7.salesChangePct != null && rolling7.salesChangePct <= -20) {
    alerts.push({
      severity: "medium",
      code: "seven_day_sales_drop",
      message: `Last ${rolling7.days} days' sales are down ${Math.round(Math.abs(rolling7.salesChangePct))}% versus the ${rolling7.days} days before.`,
    });
  }
  if (coverage != null && coverage < 99.5) {
    alerts.push({
      severity: "medium",
      code: "unmapped_spend",
      message: `Last 28 days: ${(100 - coverage).toFixed(1)}% of spend has no channel (unmapped).`,
    });
  }
  if (unpairedDays.length > 0) {
    alerts.push({
      severity: "medium",
      code: "unpaired_spend",
      message: `${unpairedDays.length} day${unpairedDays.length === 1 ? "" : "s"} ${unpairedDays.length === 1 ? "has" : "have"} spend with no sales — left out of Total ROAS.`,
    });
  }
  return alerts;
}

/**
 * Black Clover operating strip: last 7 / 28 vs prior, goal hit rate, unmapped,
 * rule alerts. Same certified days as chips. Never attribution.
 */
export function buildOperatingIntelligence(
  days: CertifiedDay[],
  targetMer: number,
  unpairedDays: string[] = [],
): OperatingIntelligence | null {
  const eligible = merDays(days);
  if (!eligible.length) return null;

  const w7 = splitLastN(days, 7);
  const w28 = splitLastN(days, 28);
  const rolling7 = rollingFrom(w7.current, w7.prior);
  const rolling28 = rollingFrom(w28.current, w28.prior);
  const last28 = w28.current;

  const hitEligible = last28.filter((r) => r.spend > 0);
  const hitDays = hitEligible.filter(
    (r) => r.mer != null && r.mer >= targetMer,
  ).length;
  const hitRate28 = hitEligible.length
    ? (hitDays / hitEligible.length) * 100
    : null;

  let residual = 0;
  let mappedSpend = 0;
  for (const r of last28) {
    const spend = Math.max(0, r.spend);
    const positiveResidual = Math.max(0, r.residualSpend);
    residual += positiveResidual;
    mappedSpend += Math.max(0, spend - positiveResidual);
  }
  const mappedCoverage28 =
    rolling28.spend > 0 ? (mappedSpend / rolling28.spend) * 100 : null;

  const bounds = feedBounds(days);
  const mtd = bounds
    ? getPeriodRows(days, bounds, bounds.year, "mtd")
    : [];
  const mtdTotals = computeTotals(mtd);
  const safeSpendMtd = targetMer > 0 ? mtdTotals.sales / targetMer : 0;
  const headroomMtd = safeSpendMtd - mtdTotals.spend;

  const channelMap = new Map<string, number>();
  let channelTotal = 0;
  for (const r of last28) {
    for (const c of r.channels) {
      if (c.channel === "Unmapped" || !(c.amount > 0)) continue;
      channelMap.set(c.channel, (channelMap.get(c.channel) ?? 0) + c.amount);
      channelTotal += c.amount;
    }
  }
  let topName: string | null = null;
  let topSpend = 0;
  for (const [name, spend] of channelMap) {
    if (spend > topSpend) {
      topName = name;
      topSpend = spend;
    }
  }

  const mode = operatingMode(rolling7);
  const alerts = buildSpendAlerts({
    rolling7,
    targetMer,
    last28,
    coverage: mappedCoverage28,
    unpairedDays,
  });
  const takeaway =
    mode.id === "need_days"
      ? "Last 7 days vs the 7 days before needs more history."
      : `${mode.label} — last 7 days vs the 7 days before.`;

  return {
    rolling7,
    rolling28,
    hitRate28,
    hitDays28: hitDays,
    eligibleDays28: hitEligible.length,
    mappedCoverage28,
    residualSpend28: round2(residual),
    safeSpendMtd: round2(safeSpendMtd),
    headroomMtd: round2(headroomMtd),
    topChannel28: {
      name: topName,
      spend: round2(topSpend),
      sharePct: channelTotal > 0 ? (topSpend / channelTotal) * 100 : null,
    },
    mode: mode.id,
    modeLabel: mode.label,
    takeaway,
    alerts,
  };
}

export function buildCashControlBoard(
  source: ExplorerDailyRow[],
  targetMer: number,
): CashControlBoard {
  const { days, unpairedDays, residualDays } = certifyDailyRows(source);
  const bounds = feedBounds(days);
  const chips = buildCashChips(days, targetMer);
  const dualClose = buildDualClose(days, targetMer);
  const plan = buildMonthClosePlan(days, targetMer, "l7");
  const mtdRows = bounds
    ? getPeriodRows(days, bounds, bounds.year, "mtd")
    : [];
  const mixSource = mtdRows.length ? mtdRows : merDays(days);
  const mix = mixRowsFromDays(mixSource);
  const need =
    dualClose && targetMer > 0 ? buildMonthNeed(dualClose, targetMer) : null;
  const paired = merDays(days);
  const ledger = aggregateLedger(
    lastNCertifiedRows(days, 14),
    "day",
    targetMer,
  ).reverse();
  const intel = buildOperatingIntelligence(days, targetMer, unpairedDays);
  const compareScores = buildCompareScores(paired);

  return {
    asOfKey: bounds?.dateKey ?? null,
    targetMer,
    chips,
    dualClose,
    plan,
    need,
    mix,
    residualDays,
    unpairedDays,
    ledger,
    mtdDays: mixSource,
    drillDays: paired,
    intel,
    compareScores,
  };
}

/**
 * Grade chips and the day table only after a target is saved.
 * A missing target leaves vsTarget unset — never "at goal" against 3.50×.
 */
export function withSavedTarget(
  board: CashControlBoard,
  targetMer: number,
): CashControlBoard {
  const saved = targetMer > 0 ? targetMer : 0;
  const chips = board.chips.map((chip) => ({
    ...chip,
    vsTarget: saved > 0 && chip.mer != null ? chip.mer - saved : null,
  }));
  const ledger = board.ledger.map((row) => ({
    ...row,
    hit:
      saved > 0 && row.mer != null && row.spend > 0
        ? row.mer >= saved
        : null,
  }));
  const intel = buildOperatingIntelligence(
    board.drillDays,
    saved,
    board.unpairedDays,
  );
  return {
    ...board,
    targetMer: saved,
    chips,
    ledger,
    intel: intel ?? board.intel,
  };
}
