import type { PeriodWindowType } from "./spend-period-allocate";

export type SpendWhenId =
  | "day"
  | "days7"
  | "month"
  | "quarter"
  | "half"
  | "year"
  | "custom";

export type SpendTemplateRangeId =
  | "30d"
  | "90d"
  | "ytd"
  | "12m"
  | "custom";

export const PRIMARY_SPEND_WHEN_OPTIONS: readonly {
  id: SpendWhenId;
  label: string;
}[] = [
  { id: "day", label: "One day" },
  { id: "days7", label: "7 days" },
  { id: "month", label: "Month" },
  { id: "custom", label: "Custom" },
];

export const MORE_SPEND_WHEN_OPTIONS: readonly {
  id: SpendWhenId;
  label: string;
}[] = [
  { id: "quarter", label: "Quarter" },
  { id: "half", label: "Half year" },
  { id: "year", label: "Year" },
];

export const SPEND_TEMPLATE_RANGE_OPTIONS: readonly {
  id: SpendTemplateRangeId;
  label: string;
}[] = [
  { id: "30d", label: "Last 30 days" },
  { id: "90d", label: "Last 90 days" },
  { id: "ytd", label: "Year to date" },
  { id: "12m", label: "Last 12 months" },
  { id: "custom", label: "Custom" },
];

export function isSpendWhenId(value: string): value is SpendWhenId {
  return (
    value === "day" ||
    value === "days7" ||
    value === "month" ||
    value === "quarter" ||
    value === "half" ||
    value === "year" ||
    value === "custom"
  );
}

export function spendWhenPeriodType(
  when: Exclude<SpendWhenId, "custom">,
): PeriodWindowType {
  switch (when) {
    case "day":
      return "day";
    case "days7":
      return "week";
    case "month":
      return "month";
    case "quarter":
      return "quarter";
    case "half":
      return "half_year";
    case "year":
      return "year";
    default: {
      const _exhaustive: never = when;
      return _exhaustive;
    }
  }
}

export function spendWhenUsesDate(when: SpendWhenId): boolean {
  return when === "day" || when === "days7";
}

export function spendWhenUsesMonth(when: SpendWhenId): boolean {
  return when === "month" || when === "quarter" || when === "half" || when === "year";
}

export function spendTemplateRangeQuery(input: {
  range: SpendTemplateRangeId;
  from: string;
  to: string;
}): string | null {
  if (input.range !== "custom") {
    return `span=${input.range}`;
  }
  if (!input.from || !input.to || input.to < input.from) return null;
  return `from=${encodeURIComponent(input.from)}&to=${encodeURIComponent(input.to)}`;
}
