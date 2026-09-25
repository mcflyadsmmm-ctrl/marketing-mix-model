import { useSearchParams } from "react-router";
import type { PeriodPreset } from "../lib/periods";
import type { LiveIngestDepth } from "../lib/live-ingest-depth";
import { deskHistoryCaption } from "../lib/desk-history";

type PeriodControlProps = {
  preset: PeriodPreset;
  /** When true, period changes keep `shot=1` in the URL. */
  shotMode?: boolean;
  /** Override URL updates (defaults to setting `period` search param). */
  onChange?: (value: PeriodPreset) => void;
  /** Spend uses plain calendar words so its entry, template, and chart agree. */
  language?: "desk" | "spend";
  /** Demo-desk chips: MTD / QTD / YTD / Last mo. No history caption. */
  compact?: boolean;
  /** Trial and paid both say up to 24 months. Required. */
  orderBookDepth: LiveIngestDepth;
};

type DeskPeriodPreset = "mtd" | "lm" | "qtd" | "ytd" | "l12m" | "y3";

/** Desk UI: This month / Last month / This quarter / This year / Last 12 months. */
const DESK_PERIOD_OPTIONS: { value: DeskPeriodPreset; label: string }[] = [
  { value: "mtd", label: "This month" },
  { value: "lm", label: "Last month" },
  { value: "qtd", label: "This quarter" },
  { value: "ytd", label: "This year" },
  { value: "l12m", label: "Last 12 months" },
];

const COMPACT_PERIOD_OPTIONS: { value: DeskPeriodPreset; label: string }[] = [
  { value: "mtd", label: "MTD" },
  { value: "qtd", label: "QTD" },
  { value: "ytd", label: "YTD" },
  { value: "lm", label: "Last mo" },
];

/**
 * Segmented period control (Apps Script / demo dd-period craft).
 * URL `period` + shot-mode param preservation; role=group + aria-pressed.
 */
export function PeriodControl({
  preset,
  shotMode = false,
  onChange,
  language = "desk",
  compact = false,
  orderBookDepth,
}: PeriodControlProps) {
  const [, setSearchParams] = useSearchParams();
  const periodOptions = compact
    ? COMPACT_PERIOD_OPTIONS
    : shotMode
      ? [...DESK_PERIOD_OPTIONS, { value: "y3" as const, label: "3 yr" }]
      : DESK_PERIOD_OPTIONS;
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
      {compact ? null : (
        <p className="mcfly-period__history">
          {deskHistoryCaption(
            new Date(),
            language === "spend" ? "spend" : "sales",
            orderBookDepth,
          )}
        </p>
      )}
    </div>
  );
}
