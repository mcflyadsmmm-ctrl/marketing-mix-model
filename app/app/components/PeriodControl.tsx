import { useSearchParams } from "react-router";
import type { PeriodPreset } from "../lib/periods";

type PeriodControlProps = {
  preset: PeriodPreset;
  /** When true, period changes keep `shot=1` in the URL. */
  shotMode?: boolean;
  /** Override URL updates (defaults to setting `period` search param). */
  onChange?: (value: PeriodPreset) => void;
};

type DeskPeriodPreset = "mtd" | "qtd" | "ytd" | "l12m" | "y3";

/** Desk UI: MTD / QTD / YTD / L12M; shot mode adds 3 yr for listing captures. */
const DESK_PERIOD_OPTIONS: { value: DeskPeriodPreset; label: string }[] = [
  { value: "mtd", label: "MTD" },
  { value: "qtd", label: "QTD" },
  { value: "ytd", label: "YTD" },
  { value: "l12m", label: "L12M" },
];

const SHOT_PERIOD_OPTIONS: { value: DeskPeriodPreset; label: string }[] = [
  ...DESK_PERIOD_OPTIONS,
  { value: "y3", label: "3 yr" },
];

/**
 * Segmented period control (Apps Script / demo dd-period craft).
 * URL `period` + shot-mode param preservation; role=group + aria-pressed.
 */
export function PeriodControl({
  preset,
  shotMode = false,
  onChange,
}: PeriodControlProps) {
  const [, setSearchParams] = useSearchParams();
  const periodOptions = shotMode ? SHOT_PERIOD_OPTIONS : DESK_PERIOD_OPTIONS;
  const activeValue = periodOptions.some((p) => p.value === preset)
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
      <div
        className="mcfly-period__group"
        role="group"
        aria-label="Reporting period"
      >
        {periodOptions.map(({ value, label }) => {
          const pressed = activeValue === value;
          return (
            <button
              key={value}
              type="button"
              className={`mcfly-period__btn${pressed ? " mcfly-period__btn--on" : ""}`}
              aria-pressed={pressed}
              onClick={() => setPeriod(value)}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
