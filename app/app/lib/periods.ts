export type PeriodPreset = "mtd" | "qtd" | "ytd" | "l12m" | "y3";

export interface DateRange {
  start: Date;
  end: Date;
  label: string;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function endOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

export function resolvePeriod(preset: PeriodPreset, now = new Date()): DateRange {
  const end = endOfDay(now);

  switch (preset) {
    case "mtd": {
      const start = startOfDay(new Date(now.getFullYear(), now.getMonth(), 1));
      return { start, end, label: "Month to date" };
    }
    case "qtd": {
      const quarter = Math.floor(now.getMonth() / 3);
      const start = startOfDay(new Date(now.getFullYear(), quarter * 3, 1));
      return { start, end, label: "Quarter to date" };
    }
    case "ytd": {
      const start = startOfDay(new Date(now.getFullYear(), 0, 1));
      return { start, end, label: "Year to date" };
    }
    case "l12m": {
      const start = startOfDay(
        new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()),
      );
      return { start, end, label: "Last 12 months" };
    }
    case "y3": {
      const start = startOfDay(
        new Date(now.getFullYear() - 3, now.getMonth(), now.getDate()),
      );
      return { start, end, label: "Last 3 years" };
    }
    default: {
      const _exhaustive: never = preset;
      throw new Error(`Unknown period preset: ${_exhaustive}`);
    }
  }
}

/**
 * Calendar-aligned prior window for the same preset (MTD → prior MTD, etc.).
 * Used for Sales / Spend / MER deltas on the Cash MER desk.
 */
export function resolvePriorPeriod(
  preset: PeriodPreset,
  now = new Date(),
): DateRange {
  switch (preset) {
    case "mtd": {
      const lastDayPrior = new Date(now.getFullYear(), now.getMonth(), 0).getDate();
      const day = Math.min(now.getDate(), lastDayPrior);
      const start = startOfDay(new Date(now.getFullYear(), now.getMonth() - 1, 1));
      const end = endOfDay(new Date(now.getFullYear(), now.getMonth() - 1, day));
      return { start, end, label: "Prior MTD" };
    }
    case "qtd": {
      const quarter = Math.floor(now.getMonth() / 3);
      const qStart = startOfDay(new Date(now.getFullYear(), quarter * 3, 1));
      const dayOffset = Math.max(
        0,
        Math.round(
          (startOfDay(now).getTime() - qStart.getTime()) / 86_400_000,
        ),
      );
      const priorQStart = startOfDay(
        new Date(now.getFullYear(), (quarter - 1) * 3, 1),
      );
      const priorEnd = endOfDay(
        new Date(
          priorQStart.getFullYear(),
          priorQStart.getMonth(),
          priorQStart.getDate() + dayOffset,
        ),
      );
      return { start: priorQStart, end: priorEnd, label: "Prior QTD" };
    }
    case "ytd": {
      const start = startOfDay(new Date(now.getFullYear() - 1, 0, 1));
      const end = endOfDay(
        new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()),
      );
      return { start, end, label: "Prior YTD" };
    }
    case "l12m": {
      const end = endOfDay(
        new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()),
      );
      const start = startOfDay(
        new Date(now.getFullYear() - 2, now.getMonth(), now.getDate()),
      );
      return { start, end, label: "Prior 12 months" };
    }
    case "y3": {
      const end = endOfDay(
        new Date(now.getFullYear() - 3, now.getMonth(), now.getDate()),
      );
      const start = startOfDay(
        new Date(now.getFullYear() - 6, now.getMonth(), now.getDate()),
      );
      return { start, end, label: "Prior 3 years" };
    }
    default: {
      const _exhaustive: never = preset;
      throw new Error(`Unknown period preset: ${_exhaustive}`);
    }
  }
}

export function formatPeriodQuery(range: DateRange): string {
  const isoStart = range.start.toISOString();
  const isoEnd = range.end.toISOString();
  return `created_at:>=${isoStart} created_at:<=${isoEnd}`;
}

export const PERIOD_PRESETS: { value: PeriodPreset; label: string }[] = [
  { value: "mtd", label: "MTD" },
  { value: "qtd", label: "QTD" },
  { value: "ytd", label: "YTD" },
  { value: "l12m", label: "12 mo" },
  { value: "y3", label: "3 yr" },
];

/** Parse URL `period` query; unknown/missing → MTD. */
export function parsePeriodPreset(raw: string | null): PeriodPreset {
  if (raw && PERIOD_PRESETS.some((p) => p.value === raw)) {
    return raw as PeriodPreset;
  }
  return "mtd";
}
