import {
  compareMix,
  computeTotals,
  lastNCertifiedRows,
  merDays,
  mixRowsFromDays,
  type CertifiedDay,
} from "./mer-control";

export type YoyCompareRow = {
  label: string;
  sales: number | null;
  priorSales: number | null;
  spend: number | null;
  priorSpend: number | null;
  mer: number | null;
  priorMer: number | null;
};

/** Shopify Analytics is this period only; this page is the year board. */
export const YOY_ANALYTICS_LEDE =
  "Shopify Analytics shows this period's sales. This page shows a 12-month board vs last year, channel spend vs last year when typed, plus this month vs last month vs last year plus last 7.";

export const YOY_CHANNEL_EMPTY =
  "Channel vs last year needs typed spend on file — not $0. Add spend on Spend Upload.";

export const YOY_CHANNEL_NO_LY =
  "Last year has no typed spend on file — not $0. This year mix still reads; vs last year stays —.";

export type OperatingMonthId = "thisMonth" | "lastMonth" | "lastYear";

export type OperatingMonthRow = {
  id: OperatingMonthId;
  label: string;
  sales: number | null;
  spend: number | null;
  mer: number | null;
};

export type YoyAsOf = {
  year: number;
  month: number;
  day: number;
};

export type YoyMonthRow = {
  month: number;
  key: string;
  label: string;
  actual: number | null;
  prior: number | null;
  yoyPct: number | null;
  spend: number | null;
  priorSpend: number | null;
  mer: number | null;
  priorMer: number | null;
  isCurrent: boolean;
  isFuture: boolean;
};

export type YoyChannelRow = {
  channel: string;
  spend: number | null;
  priorSpend: number | null;
  share: number | null;
  priorShare: number | null;
  vsPct: number | null;
  deltaPts: number | null;
};

export type YoyChartGrain = "month" | "quarter";

export type YoyChartBucket = {
  key: string;
  label: string;
  actual: number | null;
  prior: number | null;
  yoyPct: number | null;
  spend: number | null;
  priorSpend: number | null;
  mer: number | null;
  isFuture: boolean;
};

export type YoyBoardTotals = {
  actual: number | null;
  prior: number | null;
  yoyPct: number | null;
  spend: number | null;
  priorSpend: number | null;
  mer: number | null;
  monthsUp: number;
  monthsWithActual: number;
};

const OPERATING_MONTH_LABELS: Record<OperatingMonthId, string> = {
  thisMonth: "This month",
  lastMonth: "Last month",
  lastYear: "This month last year",
};

const OPERATING_MONTH_IDS: OperatingMonthId[] = [
  "thisMonth",
  "lastMonth",
  "lastYear",
];

const MONTH_SHORT = [
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

export function operatingMonthRows(
  scores: Array<{
    id: string;
    sales: number;
    spend: number;
    mer: number | null;
  }>,
): OperatingMonthRow[] {
  const byId = new Map(scores.map((row) => [row.id, row]));
  return OPERATING_MONTH_IDS.map((id) => {
    const row = byId.get(id);
    return {
      id,
      label: OPERATING_MONTH_LABELS[id],
      sales: row?.sales ?? null,
      spend: row ? row.spend : null,
      mer: row?.mer ?? null,
    };
  });
}

export function yoyDisplayValue(
  value: number | null | undefined,
  format: (n: number) => string,
): string {
  return value == null ? "—" : format(value);
}

export function yoyPct(
  actual: number | null,
  prior: number | null,
): number | null {
  if (
    actual == null ||
    prior == null ||
    !(prior > 0) ||
    !Number.isFinite(actual)
  ) {
    return null;
  }
  return ((actual - prior) / prior) * 100;
}

export function formatYoyPct(pct: number | null): string {
  if (pct == null) return "—";
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct.toFixed(0)}%`;
}

export function last7VsPrior7(days: CertifiedDay[]): YoyCompareRow {
  const eligible = merDays(days);
  const currentRows = lastNCertifiedRows(eligible, 7);
  const priorRows = lastNCertifiedRows(
    eligible.slice(0, Math.max(0, eligible.length - currentRows.length)),
    7,
  );
  const current = computeTotals(currentRows);
  const prior = priorRows.length > 0 ? computeTotals(priorRows) : null;

  const hasCurrent = currentRows.length > 0;

  return {
    label: "Last 7 vs prior 7",
    sales: hasCurrent ? current.sales : null,
    priorSales: prior?.sales ?? null,
    spend: hasCurrent ? current.spend : null,
    priorSpend: prior?.spend ?? null,
    mer: hasCurrent ? current.mer : null,
    priorMer: prior?.mer ?? null,
  };
}

function monthSlice(
  days: CertifiedDay[],
  year: number,
  monthIndex: number,
  dayCap?: number,
): CertifiedDay[] {
  return merDays(days).filter((day) => {
    if (day.year !== year || day.monthIndex !== monthIndex) return false;
    if (dayCap != null && day.day > dayCap) return false;
    return true;
  });
}

function sliceTotals(slice: CertifiedDay[]): {
  sales: number | null;
  spend: number | null;
  mer: number | null;
} {
  if (slice.length === 0) {
    return { sales: null, spend: null, mer: null };
  }
  const totals = computeTotals(slice);
  const hasSpend = slice.some((day) => day.spend > 0);
  return {
    sales: totals.sales,
    spend: hasSpend ? totals.spend : null,
    mer: hasSpend ? totals.mer : null,
  };
}

/** Calendar-year board: 12 months · actual · prior · YoY %. Missing last year is null, not $0. */
export function buildYoyYearBoard(
  days: CertifiedDay[],
  year: number,
  asOf: YoyAsOf,
): YoyMonthRow[] {
  return MONTH_SHORT.map((label, index) => {
    const month = index + 1;
    const isFuture =
      year > asOf.year || (year === asOf.year && month > asOf.month);
    const isCurrent = year === asOf.year && month === asOf.month;
    const dayCap = isCurrent ? asOf.day : undefined;
    const actualSlice = isFuture
      ? []
      : monthSlice(days, year, index, dayCap);
    const priorSlice = monthSlice(days, year - 1, index, dayCap);
    const actual = sliceTotals(actualSlice);
    const prior = sliceTotals(priorSlice);
    return {
      month,
      key: `${year}-${String(month).padStart(2, "0")}`,
      label,
      actual: actual.sales,
      prior: prior.sales,
      yoyPct: yoyPct(actual.sales, prior.sales),
      spend: actual.spend,
      priorSpend: prior.spend,
      mer: actual.mer,
      priorMer: prior.mer,
      isCurrent,
      isFuture,
    };
  });
}

export function yoyBoardHasSpend(rows: YoyMonthRow[]): boolean {
  return rows.some(
    (row) => (row.spend ?? 0) > 0 || (row.priorSpend ?? 0) > 0,
  );
}

export function yoyBoardPriorMissing(rows: YoyMonthRow[]): boolean {
  return (
    rows.some((row) => row.actual != null) &&
    rows.every((row) => row.prior == null)
  );
}

export function yoyBoardTotals(rows: YoyMonthRow[]): YoyBoardTotals {
  let actualSum = 0;
  let actualKnown = false;
  let priorSum = 0;
  let priorKnown = false;
  let overlapActual = 0;
  let overlapPrior = 0;
  let overlap = false;
  let spendSum = 0;
  let spendKnown = false;
  let priorSpendSum = 0;
  let priorSpendKnown = false;
  let monthsUp = 0;
  let monthsWithActual = 0;

  for (const row of rows) {
    if (row.actual != null) {
      actualSum += row.actual;
      actualKnown = true;
      monthsWithActual += 1;
    }
    if (row.prior != null) {
      priorSum += row.prior;
      priorKnown = true;
    }
    if (row.actual != null && row.prior != null) {
      overlapActual += row.actual;
      overlapPrior += row.prior;
      overlap = true;
      if (row.yoyPct != null && row.yoyPct > 0) monthsUp += 1;
    }
    if (row.spend != null) {
      spendSum += row.spend;
      spendKnown = true;
    }
    if (row.priorSpend != null) {
      priorSpendSum += row.priorSpend;
      priorSpendKnown = true;
    }
  }

  const actual = actualKnown ? actualSum : null;
  const prior = priorKnown ? priorSum : null;
  const spend = spendKnown ? spendSum : null;
  const priorSpend = priorSpendKnown ? priorSpendSum : null;
  return {
    actual,
    prior,
    yoyPct: overlap ? yoyPct(overlapActual, overlapPrior) : null,
    spend,
    priorSpend,
    mer:
      spend != null && spend > 0 && actual != null ? actual / spend : null,
    monthsUp,
    monthsWithActual,
  };
}

function rollupMonths(
  slice: YoyMonthRow[],
  key: string,
  label: string,
): YoyChartBucket {
  const totals = yoyBoardTotals(slice);
  return {
    key,
    label,
    actual: totals.actual,
    prior: totals.prior,
    yoyPct: totals.yoyPct,
    spend: totals.spend,
    priorSpend: totals.priorSpend,
    mer: totals.mer,
    isFuture: slice.length > 0 && slice.every((row) => row.isFuture),
  };
}

export function yoyChartBuckets(
  rows: YoyMonthRow[],
  grain: YoyChartGrain,
): YoyChartBucket[] {
  switch (grain) {
    case "month":
      return rows.map((row) => ({
        key: row.key,
        label: row.label,
        actual: row.actual,
        prior: row.prior,
        yoyPct: row.yoyPct,
        spend: row.spend,
        priorSpend: row.priorSpend,
        mer: row.mer,
        isFuture: row.isFuture,
      }));
    case "quarter":
      return [1, 2, 3, 4].map((quarter) => {
        const slice = rows.filter((row) => Math.ceil(row.month / 3) === quarter);
        return rollupMonths(slice, `Q${quarter}`, `Q${quarter}`);
      });
    default: {
      const _never: never = grain;
      throw new Error(`unexpected YoY grain: ${String(_never)}`);
    }
  }
}

/**
 * Days in `year` aligned to the selected board year.
 * Current year: both sides stop at as-of. Closed year: both sides are full.
 */
export function yoyYearWindowDays(
  days: CertifiedDay[],
  year: number,
  asOf: YoyAsOf,
  selectedYear = asOf.year,
): CertifiedDay[] {
  if (year > selectedYear) return [];
  const viewingClosed = selectedYear < asOf.year;
  const capMonth = viewingClosed ? 12 : asOf.month;
  const capDay = viewingClosed ? 31 : asOf.day;
  return merDays(days).filter((day) => {
    if (day.year !== year) return false;
    const month = day.monthIndex + 1;
    if (month < capMonth) return true;
    if (month > capMonth) return false;
    return day.day <= capDay;
  });
}

/**
 * Channel spend this year vs last year from typed mix only.
 * Missing last-year spend (whole book or one channel) is null — never a fake $0.
 */
export function yoyChannelVsLy(
  thisDays: CertifiedDay[],
  lastDays: CertifiedDay[],
): YoyChannelRow[] {
  const thisHasSpend = thisDays.some((day) => day.spend > 0);
  const lastHasSpend = lastDays.some((day) => day.spend > 0);
  if (!thisHasSpend && !lastHasSpend) return [];

  const thisMix = thisHasSpend ? mixRowsFromDays(thisDays) : [];
  const lastMix = lastHasSpend ? mixRowsFromDays(lastDays) : [];
  const thisBy = new Map(thisMix.map((row) => [row.channel, row]));
  const lastBy = new Map(lastMix.map((row) => [row.channel, row]));
  const names = new Set([
    ...thisMix.map((row) => row.channel),
    ...lastMix.map((row) => row.channel),
  ]);

  const compared =
    thisHasSpend && lastHasSpend ? compareMix(thisDays, lastDays) : [];
  const comparedBy = new Map(compared.map((row) => [row.channel, row]));

  return [...names]
    .map((channel) => {
      const current = thisBy.get(channel);
      const prior = lastBy.get(channel);
      const spend = current ? current.spend : null;
      const priorSpend = prior ? prior.spend : null;
      const share = current ? current.share : null;
      const priorShare = prior ? prior.share : null;
      const vs = comparedBy.get(channel);
      return {
        channel,
        spend,
        priorSpend,
        share,
        priorShare,
        vsPct: yoyPct(spend, priorSpend),
        deltaPts: vs && priorShare != null ? vs.deltaPts : null,
      };
    })
    .filter((row) => (row.spend ?? 0) > 0 || (row.priorSpend ?? 0) > 0)
    .sort(
      (a, b) =>
        (b.spend ?? 0) +
        (b.priorSpend ?? 0) -
        ((a.spend ?? 0) + (a.priorSpend ?? 0)),
    );
}

export function yoyYearOptions(
  asOfYear: number,
  earliestYear: number,
): number[] {
  const start = Math.max(2000, earliestYear);
  const end = Math.max(start, asOfYear);
  const years: number[] = [];
  for (let year = start; year <= end; year += 1) years.push(year);
  return years;
}

export function parseYoyYear(
  raw: string | null | undefined,
  asOfYear: number,
): number {
  const parsed = Number.parseInt(String(raw ?? ""), 10);
  if (!Number.isInteger(parsed) || parsed < 2000 || parsed > 2100) {
    return asOfYear;
  }
  return parsed;
}

export function yoyPctAxis(values: Array<number | null>): {
  min: number;
  max: number;
  ticks: number[];
} {
  const nums = values.filter(
    (value): value is number => value != null && Number.isFinite(value),
  );
  if (nums.length === 0) {
    return { min: -20, max: 20, ticks: [-20, 0, 20] };
  }
  const lo = Math.min(0, ...nums);
  const hi = Math.max(0, ...nums);
  const span = Math.max(10, Math.abs(lo), hi);
  const step = span <= 20 ? 10 : span <= 50 ? 25 : 50;
  const min = Math.floor(lo / step) * step;
  const max = Math.ceil(hi / step) * step;
  const ticks: number[] = [];
  for (let tick = min; tick <= max + step / 2; tick += step) {
    ticks.push(tick);
  }
  if (!ticks.includes(0)) ticks.push(0);
  ticks.sort((a, b) => a - b);
  return { min, max, ticks };
}
