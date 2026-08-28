/**
 * Spread a lump bill (email retainer, agency invoice, etc.) evenly across
 * calendar days in a period so Total ROAS isn’t a one-day spike.
 *
 * Pure math — no I/O. Mcfly pulls Shopify sales (PCD L1); merchants enter spend.
 */

export type PeriodWindowType =
  | "day"
  | "week"
  | "month"
  | "quarter"
  | "half_year"
  | "year";

export type AllocateDayRow = {
  date: string;
  channel: string;
  amount: number;
};

export type PeriodWindow = {
  startDateYmd: string;
  endDateYmd: string;
  /** Inclusive day count. */
  dayCount: number;
};

export type AllocateLumpInput = {
  totalAmount: number;
  startDateYmd: string;
  endDateYmd: string;
  channel: string;
};

const PERIOD_TYPES: readonly PeriodWindowType[] = [
  "day",
  "week",
  "month",
  "quarter",
  "half_year",
  "year",
];

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const YEAR_MONTH_RE = /^(\d{4})-(\d{2})$/;

export function isPeriodWindowType(value: string): value is PeriodWindowType {
  return (PERIOD_TYPES as readonly string[]).includes(value);
}

export function parseYmd(raw: string): { y: number; m: number; d: number } | null {
  const match = DATE_RE.exec(raw.trim());
  if (!match) return null;
  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = Number(match[3]);
  if (!Number.isInteger(y) || !Number.isInteger(m) || !Number.isInteger(d)) {
    return null;
  }
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;
  const probe = new Date(y, m - 1, d);
  if (
    probe.getFullYear() !== y ||
    probe.getMonth() !== m - 1 ||
    probe.getDate() !== d
  ) {
    return null;
  }
  return { y, m, d };
}

/** Accept YYYY-MM or YYYY-MM-DD; returns calendar year + month (1–12). */
export function parseYearMonth(
  raw: string,
): { y: number; m: number } | null {
  const trimmed = raw.trim();
  const ym = YEAR_MONTH_RE.exec(trimmed);
  if (ym) {
    const y = Number(ym[1]);
    const m = Number(ym[2]);
    if (!Number.isInteger(y) || !Number.isInteger(m) || m < 1 || m > 12) {
      return null;
    }
    return { y, m };
  }
  const ymd = parseYmd(trimmed);
  if (!ymd) return null;
  return { y: ymd.y, m: ymd.m };
}

function formatYmd(y: number, m: number, d: number): string {
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function lastDayOfMonth(y: number, m: number): number {
  return new Date(y, m, 0).getDate();
}

function addCalendarDays(
  y: number,
  m: number,
  d: number,
  days: number,
): { y: number; m: number; d: number } {
  const cursor = new Date(y, m - 1, d + days);
  return {
    y: cursor.getFullYear(),
    m: cursor.getMonth() + 1,
    d: cursor.getDate(),
  };
}

/** Inclusive day count between two YYYY-MM-DD dates. */
export function inclusiveDayCount(
  startDateYmd: string,
  endDateYmd: string,
): number | null {
  const start = parseYmd(startDateYmd);
  const end = parseYmd(endDateYmd);
  if (!start || !end) return null;
  const a = Date.UTC(start.y, start.m - 1, start.d);
  const b = Date.UTC(end.y, end.m - 1, end.d);
  if (b < a) return null;
  return Math.round((b - a) / 86_400_000) + 1;
}

/**
 * Calendar window for a period type containing the anchor.
 * Anchor: YYYY-MM (month picker) or YYYY-MM-DD.
 *
 * - day: that calendar day (YYYY-MM-DD)
 * - week: 7 days starting on the chosen date
 * - month: full calendar month
 * - quarter: calendar quarter (Q1 Jan–Mar … Q4 Oct–Dec)
 * - half_year: bi-annual H1 Jan–Jun / H2 Jul–Dec
 * - year: Jan 1 – Dec 31
 */
export function periodWindow(
  type: PeriodWindowType,
  anchor: string,
): PeriodWindow | null {
  if (!isPeriodWindowType(type)) return null;

  if (type === "day") {
    const ymd = parseYmd(anchor);
    if (!ymd) return null;
    const startDateYmd = formatYmd(ymd.y, ymd.m, ymd.d);
    return { startDateYmd, endDateYmd: startDateYmd, dayCount: 1 };
  }

  if (type === "week") {
    const ymd = parseYmd(anchor);
    if (!ymd) return null;
    const startDateYmd = formatYmd(ymd.y, ymd.m, ymd.d);
    const end = addCalendarDays(ymd.y, ymd.m, ymd.d, 6);
    const endDateYmd = formatYmd(end.y, end.m, end.d);
    return { startDateYmd, endDateYmd, dayCount: 7 };
  }

  const ym = parseYearMonth(anchor);
  if (!ym) return null;

  const { y, m } = ym;
  let startM: number;
  let endM: number;

  switch (type) {
    case "month":
      startM = m;
      endM = m;
      break;
    case "quarter": {
      const qStart = Math.floor((m - 1) / 3) * 3 + 1;
      startM = qStart;
      endM = qStart + 2;
      break;
    }
    case "half_year":
      if (m <= 6) {
        startM = 1;
        endM = 6;
      } else {
        startM = 7;
        endM = 12;
      }
      break;
    case "year":
      startM = 1;
      endM = 12;
      break;
    default: {
      const _exhaustive: never = type;
      return _exhaustive;
    }
  }

  const startDateYmd = formatYmd(y, startM, 1);
  const endDateYmd = formatYmd(y, endM, lastDayOfMonth(y, endM));
  const dayCount = inclusiveDayCount(startDateYmd, endDateYmd);
  if (dayCount == null || dayCount < 1) return null;

  return { startDateYmd, endDateYmd, dayCount };
}

/**
 * Equal daily split of `total` across `dayCount` days (cents).
 * Last day absorbs remainder so the sum equals the cent-rounded total.
 */
export function distributeEqualDailyAmounts(
  total: number,
  dayCount: number,
): number[] {
  if (!Number.isFinite(total) || dayCount < 1) return [];
  const totalCents = Math.round(total * 100);
  const base = Math.floor(totalCents / dayCount);
  const remainder = totalCents - base * dayCount;
  const amounts: number[] = [];
  for (let i = 0; i < dayCount; i++) {
    const cents = i === dayCount - 1 ? base + remainder : base;
    amounts.push(cents / 100);
  }
  return amounts;
}

function enumerateDates(startDateYmd: string, dayCount: number): string[] {
  const start = parseYmd(startDateYmd);
  if (!start || dayCount < 1) return [];
  const dates: string[] = [];
  for (let i = 0; i < dayCount; i++) {
    const day = addCalendarDays(start.y, start.m, start.d, i);
    dates.push(formatYmd(day.y, day.m, day.d));
  }
  return dates;
}

/**
 * Spread a lump invoice evenly across each inclusive day in [start, end].
 * Returns [] when inputs are invalid. Sum of amounts equals cent-rounded total.
 *
 * Use for email/agency/retainer monthly (or longer) bills so period totals
 * and Total ROAS stay honest — spread across closed days (CSV spine), not a
 * single-day lump on invoice date.
 */
export function allocateLumpToDays(input: AllocateLumpInput): AllocateDayRow[] {
  const { totalAmount, startDateYmd, endDateYmd, channel } = input;
  if (!Number.isFinite(totalAmount) || totalAmount <= 0) return [];
  if (!channel || !channel.trim()) return [];

  const dayCount = inclusiveDayCount(startDateYmd, endDateYmd);
  if (dayCount == null || dayCount < 1) return [];

  const amounts = distributeEqualDailyAmounts(totalAmount, dayCount);
  const dates = enumerateDates(startDateYmd, dayCount);
  if (amounts.length !== dates.length) return [];

  const ch = channel.trim();
  return dates.map((date, i) => ({
    date,
    channel: ch,
    amount: amounts[i],
  }));
}

export type LumpSpreadPlan = {
  periodType: PeriodWindowType | "custom";
  channel: string;
  startDateYmd: string;
  endDateYmd: string;
  dayCount: number;
  /** Display rate: total ÷ dayCount (rounded to cents). */
  dailyAmount: number;
  totalAmount: number;
  totalAllocated: number;
  days: AllocateDayRow[];
};

export type LumpSpreadResult =
  | { ok: true; plan: LumpSpreadPlan }
  | { ok: false; error: string };

/**
 * Resolve a period window from anchor + type, then allocate the bill.
 * Anchor: YYYY-MM or YYYY-MM-DD.
 */
export function planLumpSpread(input: {
  totalAmount: number;
  periodType: PeriodWindowType;
  anchor: string;
  channel: string;
}): LumpSpreadResult {
  const { totalAmount, periodType, anchor, channel } = input;

  if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
    return { ok: false, error: "Enter a positive bill amount." };
  }
  if (!isPeriodWindowType(periodType)) {
    return {
      ok: false,
      error: "Pick a period: day, week, month, quarter, bi-annual, or year.",
    };
  }
  if (!channel?.trim()) {
    return { ok: false, error: "Pick a spend channel." };
  }

  const window = periodWindow(periodType, anchor);
  if (!window) {
    return {
      ok: false,
      error:
        periodType === "day" || periodType === "week"
          ? "Pick a start date (YYYY-MM-DD)."
          : "Anchor must be a valid month (YYYY-MM) or date.",
    };
  }

  const days = allocateLumpToDays({
    totalAmount,
    startDateYmd: window.startDateYmd,
    endDateYmd: window.endDateYmd,
    channel: channel.trim(),
  });
  if (days.length === 0) {
    return { ok: false, error: "Could not allocate daily amounts." };
  }

  const totalAllocated =
    Math.round(days.reduce((sum, d) => sum + d.amount, 0) * 100) / 100;
  const dailyAmount =
    Math.round((totalAmount / window.dayCount) * 100) / 100;

  return {
    ok: true,
    plan: {
      periodType,
      channel: channel.trim(),
      startDateYmd: window.startDateYmd,
      endDateYmd: window.endDateYmd,
      dayCount: window.dayCount,
      dailyAmount,
      totalAmount,
      totalAllocated,
      days,
    },
  };
}

/** Allocate a merchant-selected inclusive custom range. */
export function planCustomLumpSpread(input: {
  totalAmount: number;
  startDateYmd: string;
  endDateYmd: string;
  channel: string;
}): LumpSpreadResult {
  const { totalAmount, startDateYmd, endDateYmd, channel } = input;
  if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
    return { ok: false, error: "Enter a positive bill amount." };
  }
  if (!channel.trim()) {
    return { ok: false, error: "Pick a spend channel." };
  }

  const dayCount = inclusiveDayCount(startDateYmd, endDateYmd);
  if (dayCount == null || dayCount < 1) {
    return {
      ok: false,
      error: "Pick a valid custom range. The end date must be on or after the start date.",
    };
  }

  const days = allocateLumpToDays({
    totalAmount,
    startDateYmd,
    endDateYmd,
    channel,
  });
  if (days.length === 0) {
    return { ok: false, error: "Could not allocate daily amounts." };
  }

  const totalAllocated =
    Math.round(days.reduce((sum, day) => sum + day.amount, 0) * 100) / 100;
  const dailyAmount = Math.round((totalAmount / dayCount) * 100) / 100;
  return {
    ok: true,
    plan: {
      periodType: "custom",
      channel: channel.trim(),
      startDateYmd,
      endDateYmd,
      dayCount,
      dailyAmount,
      totalAmount,
      totalAllocated,
      days,
    },
  };
}

/** Long CSV: date,channel,amount — importable via parseSpendCsv. */
export function buildLumpSpreadLongCsv(plan: LumpSpreadPlan): string {
  const rows = ["date,channel,amount"];
  for (const day of plan.days) {
    const amount = (Math.round(day.amount * 100) / 100).toFixed(2);
    rows.push(`${day.date},${day.channel},${amount}`);
  }
  return `${rows.join("\n")}\n`;
}

export function lumpSpreadFilename(plan: LumpSpreadPlan): string {
  const label = plan.channel.toLowerCase().replace(/\s+/g, "-");
  return `mcfly-bill-daily-${label}-${plan.startDateYmd}-${plan.endDateYmd}.csv`;
}

/** Current local year-month for month picker default (YYYY-MM). */
export function currentYearMonth(now = new Date()): string {
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  return `${y}-${String(m).padStart(2, "0")}`;
}
