import { useSearchParams } from "react-router";
import { PERIOD_PRESETS, type PeriodPreset } from "../lib/periods";

type PeriodControlProps = {
  preset: PeriodPreset;
  /** When true, period changes keep `shot=1` in the URL. */
  shotMode?: boolean;
  /** Override URL updates (defaults to setting `period` search param). */
  onChange?: (value: PeriodPreset) => void;
};

/**
 * Segmented reporting-period control shared by Cash MER + Allocation.
 * Habit affordance: a11y tabs, URL `period`, shot-mode param preservation.
 */
export function PeriodControl({
  preset,
  shotMode = false,
  onChange,
}: PeriodControlProps) {
  const [, setSearchParams] = useSearchParams();

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
    <div className="mcfly-period" role="tablist" aria-label="Reporting period">
      {PERIOD_PRESETS.map(({ value, label }) => (
        <button
          key={value}
          type="button"
          role="tab"
          aria-selected={preset === value}
          className={`mcfly-period__btn${preset === value ? " mcfly-period__btn--on" : ""}`}
          onClick={() => setPeriod(value)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
