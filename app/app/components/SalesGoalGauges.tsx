import { formatCurrency, formatMer } from "../lib/mer-format";
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
  /**
   * `inline` — tiny bars under a hero, no chrome.
   * `book` — full bars inside the report book: one lede, no card, no second h2.
   * `panel` — legacy card.
   */
  variant?: "panel" | "inline" | "book";
  targetMer?: number | null;
  breakEvenMer?: number | null;
};

const DEFAULT_HEADING = "Goal progress";
const DEFAULT_MUTED = `Sales vs plan plus ${PRODUCT_NOUN.totalRoas} vs ${PRODUCT_NOUN.breakEvenShort} — Shopify sales goals do not overlay ad spend`;

function formatCashMerLine(
  period: SalesGoalPeriod,
  targetMer?: number | null,
  breakEvenMer?: number | null,
): { text: string; tone: GoalPaceTone } | null {
  if (!(period.spend > 0)) return null;
  const beBit =
    breakEvenMer != null && breakEvenMer > 0
      ? ` vs ${PRODUCT_NOUN.breakEvenShort} ${formatMer(breakEvenMer)}`
      : "";
  const targetBit =
    targetMer != null && targetMer > 0
      ? ` vs target ${formatMer(targetMer)}`
      : "";
  const slash = beBit && targetBit ? " /" : "";
  const railLabel =
    period.merRails.label !== "—" ? ` · ${period.merRails.label}` : "";
  return {
    text: `${formatMer(period.mer)}${beBit}${slash}${targetBit}${railLabel}`,
    tone: period.merRails.tone,
  };
}

/** Null when last year has no comparable sales — the desk omits the row. */
function formatYoyShort(
  period: SalesGoalPeriod,
): { text: string; tone: GoalPaceTone } | null {
  const { yoy } = period;
  if (yoy.pct == null) return null;
  const sign = yoy.pct > 0 ? "+" : "";
  return {
    text: `vs last year ${sign}${yoy.pct.toFixed(0)}%`,
    tone: yoy.tone,
  };
}

function GoalRow({
  period,
  compact,
  targetMer,
  breakEvenMer,
}: {
  period: SalesGoalPeriod;
  compact: boolean;
  targetMer?: number | null;
  breakEvenMer?: number | null;
}) {
  const hasGoal = period.goal > 0 && Number.isFinite(period.goal);
  const progressPct = hasGoal
    ? Math.min(100, Math.max(0, period.progressPct ?? 0))
    : 0;
  const tone: GoalPaceTone = hasGoal ? period.pace.tone : "flat";
  const yoy = formatYoyShort(period);
  const pctLabel = hasGoal
    ? `${Math.round(period.progressPct ?? 0)}%`
    : "no goal set";
  const calPct = Number.isFinite(period.calendarPct)
    ? Math.min(100, Math.max(0, period.calendarPct))
    : null;
  const paceBit =
    !compact &&
    hasGoal &&
    period.pace.kind !== "none"
      ? `${period.pace.label}${
          calPct != null ? ` · ${Math.round(calPct)}% calendar` : ""
        }`
      : null;
  const cashLine = formatCashMerLine(period, targetMer, breakEvenMer);

  return (
    <article
      className={[
        "mcfly-goal-row",
        `mcfly-goal-row--${tone}`,
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
        {hasGoal ? (
          <span className={`mcfly-goal-row__pct mcfly-goal-row__pct--${tone}`}>
            {pctLabel}
          </span>
        ) : null}
      </div>
      <div
        className="mcfly-goal-row__track"
        role="progressbar"
        aria-valuenow={hasGoal ? Math.round(progressPct) : undefined}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={
          hasGoal ? `${period.label} ${pctLabel} of goal` : `${period.label} — ${pctLabel}`
        }
      >
        <div
          className={`mcfly-goal-row__fill mcfly-goal-row__fill--${tone}`}
          style={{ width: `${progressPct}%` }}
        />
        {hasGoal && calPct != null ? (
          <span
            className="mcfly-goal-row__cal-tick"
            style={{ left: `${calPct}%` }}
            title={`${Math.round(calPct)}% of period elapsed`}
            aria-hidden="true"
          />
        ) : null}
      </div>
      {!compact ? (
        <div className="mcfly-goal-row__meta">
          <span className="mcfly-goal-row__meta-amt">
            {formatCurrency(period.actual)}
            {hasGoal ? ` / ${formatCurrency(period.goal)}` : ""}
            {period.periodHint ? ` · ${period.periodHint}` : ""}
          </span>
          {yoy ? (
            <span
              className={`mcfly-goal-row__yoy mcfly-goal-row__yoy--${yoy.tone}`}
            >
              {yoy.text}
            </span>
          ) : null}
          {paceBit ? (
            <span
              className={`mcfly-goal-row__pace mcfly-goals-pace mcfly-goals-pace--${period.pace.tone}`}
            >
              {paceBit}
            </span>
          ) : null}
          {cashLine ? (
            <span
              className={`mcfly-goals-pace mcfly-goals-pace--${cashLine.tone}`}
            >
              {cashLine.text}
            </span>
          ) : null}
        </div>
      ) : cashLine ? (
        <span
          className={`mcfly-goal-row__meta mcfly-goals-pace mcfly-goals-pace--${cashLine.tone}`}
        >
          {cashLine.text}
        </span>
      ) : null}
    </article>
  );
}

/**
 * MTD / QTD / YTD sales-vs-plan rows plus Total ROAS vs break-even when spend is on file.
 * `inline` = tuck under Total Sales KPI; `panel` = Goals / full section.
 */
export function SalesGoalGauges({
  periods,
  heading = DEFAULT_HEADING,
  muted = DEFAULT_MUTED,
  variant = "panel",
  targetMer,
  breakEvenMer,
}: Props) {
  const noGoalsSet =
    !(periods.mtd.goal > 0) &&
    !(periods.qtd.goal > 0) &&
    !(periods.ytd.goal > 0);
  const compact = variant === "inline";

  const rows = (
    <div className="mcfly-goal-rows">
      <GoalRow
        period={periods.mtd}
        compact={compact}
        targetMer={targetMer}
        breakEvenMer={breakEvenMer}
      />
      <GoalRow
        period={periods.qtd}
        compact={compact}
        targetMer={targetMer}
        breakEvenMer={breakEvenMer}
      />
      <GoalRow
        period={periods.ytd}
        compact={compact}
        targetMer={targetMer}
        breakEvenMer={breakEvenMer}
      />
    </div>
  );

  if (variant === "book") {
    return (
      <section className="mcfly-book" aria-label={heading}>
        <p className="mcfly-book__lede">
          {heading} — {muted}
        </p>
        {rows}
        {noGoalsSet ? (
          <p className="mcfly-book__cta">
            <s-link href="/app/goals">Grow 10% vs last year · set goals</s-link>
          </p>
        ) : null}
      </section>
    );
  }

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
          <s-link href="/app/goals">Grow 10% vs last year · set goals</s-link>
        </p>
      ) : null}
    </section>
  );
}
