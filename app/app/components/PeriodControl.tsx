import { useSearchParams } from "react-router";
import type { PeriodPreset } from "../lib/periods";

type PeriodControlProps = {
  preset: PeriodPreset;
  /** When true, period changes keep `shot=1` in the URL. */
  shotMode?: boolean;
  /** Override URL updates (defaults to setting `period` search param). */
  onChange?: (value: PeriodPreset) => void;
};

type DeskPeriodPreset = "mtd" | "qtd" | "ytd" | "y3";

/** Desk UI: MTD / QTD / YTD; shot mode adds 3 yr for listing captures. */
const DESK_PERIOD_OPTIONS: { value: DeskPeriodPreset; label: string }[] = [
  { value: "mtd", label: "MTD" },
  { value: "qtd", label: "QTD" },
  { value: "ytd", label: "YTD" },
];

const SHOT_PERIOD_OPTIONS: { value: DeskPeriodPreset; label: string }[] = [
  ...DESK_PERIOD_OPTIONS,
  { value: "y3", label: "3 yr" },
];

const PERIOD_SELECT_LABELS: Record<DeskPeriodPreset, string> = {
  mtd: "Month to date",
  qtd: "Quarter to date",
  ytd: "Year to date",
  y3: "Last 3 years",
};

const LEGACY_PERIOD_LABELS: Partial<Record<PeriodPreset, string>> = {
  l12m: "Last 12 months",
};

/**
 * Native Polaris period filter (BFS sticky context). URL `period` + shot-mode.
 */
export function PeriodControl({
  preset,
  shotMode = false,
  onChange,
}: PeriodControlProps) {
  const [, setSearchParams] = useSearchParams();
  const periodOptions = shotMode ? SHOT_PERIOD_OPTIONS : DESK_PERIOD_OPTIONS;
  const legacyLabel = LEGACY_PERIOD_LABELS[preset];
  const selectValue = periodOptions.some((p) => p.value === preset)
    ? preset
    : "mtd";

  const setPeriod = (value: PeriodPreset) => {
    if (onChange) {
      onChange(value);
      return;
    }
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("period", value);
      if (shotMode) next.set("shot", "1");
      else next.delete("shot");
      return next;
    });
  };

  return (
    <div className="mcfly-period">
      {legacyLabel ? (
        <span className="mcfly-ctx-chip mcfly-ctx-chip--flat">{legacyLabel}</span>
      ) : null}
      <s-select
        label="Period"
        labelAccessibilityVisibility="exclusive"
        name="period"
        value={selectValue}
        onChange={(event: Event) => {
          const el = event.currentTarget as HTMLElement & { value?: string };
          const raw = el.value ?? "";
          if (periodOptions.some((p) => p.value === raw)) {
            setPeriod(raw as PeriodPreset);
          }
        }}
      >
        {periodOptions.map(({ value }) => (
          <s-option key={value} value={value}>
            {PERIOD_SELECT_LABELS[value]}
          </s-option>
        ))}
      </s-select>
    </div>
  );
}
