import { formatCurrency } from "../lib/mer-format";
import { PRODUCT_NOUN } from "../lib/product-labels";
import type {
  GoalPaceTone,
  SalesGoalPeriod,
  SalesGoalPeriods,
} from "../lib/sales-goals.server";

type Props = {
  periods: SalesGoalPeriods;
  heading?: string;
  muted?: string;
  /** Inline under Total Sales KPI — tiny bars, no panel chrome. */
  variant?: "panel" | "inline";
};

const TRUTH_GREEN = "#059669";
const MUTE_STROKE = "#94a3b8";

const DEFAULT_HEADING = "Goal progress";
const DEFAULT_MUTED = `Sales vs plan · not spend · not ${PRODUCT_NOUN.totalRoas}`;

function barColor(progressPct: number | null): string {
  if (progressPct == null || !Number.isFinite(progressPct)) return MUTE_STROKE;
  return TRUTH_GREEN;
}

function formatYoyShort(period: SalesGoalPeriod): {
  text: string;
  tone: GoalPaceTone;
} {
  const { yoy } = period;
  if (yoy.pct == null) {
    return { text: "YoY —", tone: "flat" };
  }
  const sign = yoy.pct > 0 ? "+" : "";
  return {
    text: `YoY ${sign}${yoy.pct.toFixed(0)}%`,
    tone: yoy.tone,
  };
}

function GoalRow({
  period,
  compact,
}: {
  period: SalesGoalPeriod;
  compact: boolean;
}) {
  const hasGoal = period.goal > 0 && Number.isFinite(period.goal);
  const progressPct = hasGoal
    ? Math.min(100, Math.max(0, period.progressPct ?? 0))
    : 0;
  const fill = barColor(hasGoal ? period.progressPct : null);
  const yoy = formatYoyShort(period);
  const pctLabel = hasGoal
    ? `${Math.round(period.progressPct ?? 0)}%`
    : "—";
  const paceBit =
    !compact &&
    hasGoal &&
    period.pace.kind !== "none"
      ? `${period.pace.label}${
          Number.isFinite(period.calendarPct)
            ? ` · ${Math.round(period.calendarPct)}% period`
            : ""
        }`
      : null;

  return (
    <article
      className={[
        "mcfly-goal-row",
        compact ? "mcfly-goal-row--compact" : null,
        !hasGoal ? "mcfly-goal-row--empty" : null,
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label={`${period.label} sales vs goal`}
      title={
        hasGoal
          ? `${formatCurrency(period.actual)} / ${formatCurrency(period.goal)}${
              paceBit ? ` · ${paceBit}` : ""
            }`
          : undefined
      }
    >
      <div className="mcfly-goal-row__head">
        <span className="mcfly-goal-row__label">{period.label}</span>
        <span className="mcfly-goal-row__pct" style={{ color: fill }}>
          {pctLabel}
        </span>
      </div>
      <div
        className="mcfly-goal-row__track"
        role="progressbar"
        aria-valuenow={hasGoal ? Math.round(progressPct) : undefined}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${period.label} ${pctLabel} of goal`}
      >
        <div
          className="mcfly-goal-row__fill"
          style={{ width: `${progressPct}%`, background: fill }}
        />
      </div>
      {!compact ? (
        <div className="mcfly-goal-row__meta">
          <span>
            {formatCurrency(period.actual)}
            {hasGoal ? ` / ${formatCurrency(period.goal)}` : " / —"}
            {period.periodHint ? ` · ${period.periodHint}` : ""}
          </span>
          <span
            className={`mcfly-goal-row__yoy mcfly-goal-row__yoy--${yoy.tone}`}
          >
            {yoy.text}
          </span>
          {paceBit ? (
            <span
              className={`mcfly-goal-row__pace mcfly-goals-pace mcfly-goals-pace--${period.pace.tone}`}
            >
              {paceBit}
            </span>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

/**
 * MTD / QTD / YTD sales-vs-plan rows.
 * `inline` = tuck under Total Sales KPI; `panel` = Goals / full section.
 */
export function SalesGoalGauges({
  periods,
  heading = DEFAULT_HEADING,
  muted = DEFAULT_MUTED,
  variant = "panel",
}: Props) {
  const noGoalsSet =
    !(periods.mtd.goal > 0) &&
    !(periods.qtd.goal > 0) &&
    !(periods.ytd.goal > 0);
  const compact = variant === "inline";

  const rows = (
    <div className="mcfly-goal-rows">
      <GoalRow period={periods.mtd} compact={compact} />
      <GoalRow period={periods.qtd} compact={compact} />
      <GoalRow period={periods.ytd} compact={compact} />
    </div>
  );

  if (variant === "inline") {
    return (
      <div className="mcfly-goal-inline" aria-label={heading}>
        {rows}
        {noGoalsSet ? (
          <p className="mcfly-goal-inline__foot">
            <s-link href="/app/goals">Set goals</s-link>
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <section
      className="mcfly-panel mcfly-sales-gauges mcfly-sales-gauges--rows"
      aria-label={heading}
    >
      <div className="mcfly-panel__head mcfly-panel__head--tight">
        <h2>{heading}</h2>
        <p className="mcfly-panel__muted">{muted}</p>
      </div>
      {rows}
      {noGoalsSet ? (
        <p className="mcfly-sales-gauges__foot">
          <s-link href="/app/goals">Grow 10% YoY · set goals</s-link>
        </p>
      ) : null}
    </section>
  );
}
