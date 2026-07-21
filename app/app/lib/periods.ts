export type PeriodPreset = "mtd" | "qtd" | "ytd";

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
];
