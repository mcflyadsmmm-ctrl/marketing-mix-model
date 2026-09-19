import { Form } from "react-router";
import { formatCurrency } from "../lib/mer-format";
import { PRODUCT_NOUN } from "../lib/product-labels";
import { useDeskCurrency } from "../lib/desk-currency";
import {
  habitGoalTargetSourceLabel,
  habitGoalsDailyRead,
  habitGoalsHistoryLine,
  SAMPLE_HABIT_RETURNING_TARGET,
  type HabitGoalEmpty,
  type HabitGoalEmptyKind,
  type HabitGoalTargetSource,
  type HabitGoalTrack,
  type HabitGoalsView,
} from "../lib/goals-habit";
import { DeskIcon } from "./DeskIcon";
import { useDeskDrill } from "./DeskDrill";

type Tone = "good" | "warn" | "plain";

function ActionCard({
  label,
  value,
  sub,
  tone = "plain",
  verb,
  detail,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: Tone;
  verb: string;
  detail: string;
}) {
  const drill = useDeskDrill();
  const open = () =>
    drill?.openDrill({
      title: label,
      value,
      kicker: verb,
      blocks: [
        { k: "What this is", v: detail },
        sub ? { k: "Also", v: sub } : null,
      ].filter((b): b is { k: string; v: string } => b != null),
      next: "Order history only — no spend required.",
    });
  const body = (
    <>
      <p className="mcfly-cust-kpi__verb">{verb}</p>
      <p className="mcfly-cust-kpi__k">{label}</p>
      <p className="mcfly-cust-kpi__v">{value}</p>
      {sub ? <p className="mcfly-cust-kpi__sub">{sub}</p> : null}
    </>
  );
  return drill ? (
    <button
      type="button"
      className={`mcfly-cust-kpi mcfly-cust-kpi--${tone} mcfly-cust-kpi--soft mcfly-cust-kpi--action`}
      onClick={open}
    >
      {body}
    </button>
  ) : (
    <div
      className={`mcfly-cust-kpi mcfly-cust-kpi--${tone} mcfly-cust-kpi--soft mcfly-cust-kpi--action`}
    >
      {body}
    </div>
  );
}

function emptyValue(empty: HabitGoalEmpty): string {
  switch (empty.kind) {
    case "syncing":
      return "Waiting on orders";
    case "thin":
    case "young":
      return `${empty.orders.toLocaleString()} on file`;
    case "unset":
      return "Type a returning-$ target";
    default: {
      const _exhaustive: never = empty.kind;
      return _exhaustive;
    }
  }
}

function emptyFloor(kind: HabitGoalEmptyKind, need: number): string {
  switch (kind) {
    case "syncing":
    case "thin":
    case "young":
      return `Floor: ${need} paid orders with identified buyers. LTV Target Line is the observed average. A year returning-$ target is optional — not $0.`;
    case "unset":
      return `Floor: ${need} paid orders are already on file. LTV Target Line is the observed average — type a year returning-$ target if you want that track. Not $0.`;
    default: {
      const _exhaustive: never = kind;
      return _exhaustive;
    }
  }
}

function pctLabel(share: number): string {
  return `${Math.round(share * 100)}%`;
}

function barWidth(share: number): number {
  if (!Number.isFinite(share) || share <= 0) return 0;
  return Math.min(100, Math.round(share * 100));
}

function formatGoalInput(value: number | null): string {
  if (value == null || !Number.isFinite(value) || value <= 0) return "";
  return String(Math.round(value));
}

function trackTone(track: HabitGoalTrack | null): Tone {
  if (track == null) return "plain";
  if (track.met) return "good";
  if (track.pct >= 0.7) return "plain";
  return "warn";
}

function returningActionDetail(track: HabitGoalTrack | null): string {
  const guests =
    "Guests stay out. Shopify Analytics Overview is a returning-customer rate — headcount.";
  if (track == null) {
    return `Sales from returning buyers in this Goals year, over the returning-$ target. ${guests}`;
  }
  switch (track.targetSource) {
    case "sample":
      return `Sales from returning buyers in this Goals year, over the Snowdevil stretch (SAMPLE example — not a target you typed). ${guests}`;
    case "typed":
      return `Sales from returning buyers in this Goals year, over the returning-$ target you typed. ${guests}`;
    case "average":
      return `Sales from returning buyers in this Goals year, over the returning-$ target. ${guests}`;
    default: {
      const _exhaustive: never = track.targetSource;
      return _exhaustive;
    }
  }
}

function typedReturningFieldValue(
  target: number | null,
  source: HabitGoalTargetSource | null,
): string {
  return source === "typed" ? formatGoalInput(target) : "";
}

/**
 * Soft LTV + returning-$ Goals board. Habit stickiness, zero spend.
 * Today’s read, two ActionCards, formula chips. LTV Target Line is the
 * observed average — no typing. Returning-$ is the only typed field.
 * First-win empties are ActionCard-shaped. Sales-plan / spend gauges stay
 * below on /app/goals. Sales-five IA stays.
 */
export function OrderHistoryGoalsBoard({
  view,
  year,
  busy = false,
}: {
  view: HabitGoalsView;
  year: number;
  busy?: boolean;
}) {
  const currency = useDeskCurrency();
  const drill = useDeskDrill();
  const empty = view.empty;
  const read = habitGoalsDailyRead(view);
  const ltv = view.ltv;
  const returning = view.returning;

  if (empty) {
    return (
      <section
        className="mcfly-panel mcfly-cust-card mcfly-cust-card--soft mcfly-habit-goals"
        aria-label="Order-history targets"
      >
        <div className="mcfly-panel__head">
          <h2>Order-history targets</h2>
          <p className="mcfly-panel__muted">
            LTV + returning $ · no spend required
          </p>
        </div>
        <button
          type="button"
          className="mcfly-cust-rfm__empty"
          data-kind={empty.kind}
          onClick={() =>
            drill?.openDrill({
              title: "Order-history targets",
              value: emptyValue(empty),
              kicker: empty.verb,
              blocks: [
                { k: "What this is", v: empty.copy },
                {
                  k: "What fills next",
                  v: emptyFloor(empty.kind, empty.need),
                },
              ],
              next: "Order history only — no spend required.",
              nextHref: "/app/ltv",
              nextLabel: `Open ${PRODUCT_NOUN.ltvTitle}`,
            })
          }
        >
          <span className="mcfly-cust-rfm__empty-k">First win</span>
          <span className="mcfly-cust-rfm__empty-verb">{empty.verb}</span>
          <span className="mcfly-cust-rfm__empty-v">{emptyValue(empty)}</span>
          <span className="mcfly-cust-rfm__empty-line">{empty.copy}</span>
          <span className="mcfly-cust-rfm__empty-line">
            {emptyFloor(empty.kind, empty.need)}
          </span>
        </button>
        <div
          className="mcfly-cust-empty__ghost mcfly-cust-empty__ghost--bars"
          aria-hidden="true"
        >
          {[0.42, 0.68, 0.51, 0.8, 0.44].map((h, i) => (
            <span key={i} style={{ height: `${Math.round(h * 100)}%` }} />
          ))}
        </div>
        {empty.kind === "unset" ? (
          <HabitGoalFields
            year={year}
            returningTarget={view.returningTarget}
            targetSource={null}
            busy={busy}
          />
        ) : null}
        <p className="mcfly-habit-goals__meta">
          <DeskIcon name="sales" /> LTV Target Line is the observed average.
          Type a returning-$ target here or in Settings. Sales plan vs actual
          stays below.
        </p>
      </section>
    );
  }

  const ltvMoney = ltv ? formatCurrency(ltv.actual, currency) : "—";
  const returningMoney = returning
    ? formatCurrency(returning.actual, currency)
    : "—";
  const heroMoney = ltv
    ? formatCurrency(ltv.actual, currency)
    : returning
      ? formatCurrency(returning.actual, currency)
      : "—";

  return (
    <section
      className="mcfly-panel mcfly-cust-card mcfly-cust-card--soft mcfly-habit-goals"
      aria-label="Order-history targets"
    >
      <div className="mcfly-panel__head">
        <h2>Order-history targets</h2>
        <p className="mcfly-panel__muted">{habitGoalsHistoryLine(view)}</p>
      </div>

      {read ? (
        <button
          type="button"
          className="mcfly-habit-goals__read"
          onClick={() =>
            drill?.openDrill({
              title: "Order-history targets",
              value: heroMoney,
              kicker: "Today’s read",
              blocks: [
                { k: "What this is", v: read.line },
                ltv
                  ? {
                      k: "New-buyer worth",
                      v: `${ltvMoney} in the ${ltv.windowLabel}. Target Line is that average — not a goal you type. ${ltv.formulaPlug} Observed order history — not an estimate.`,
                    }
                  : null,
                returning
                  ? {
                      k: "Returning $",
                      v: `${returningMoney} this year vs ${formatCurrency(returning.target, currency)} ${habitGoalTargetSourceLabel(returning.targetSource).toLowerCase()}. ${returning.formulaPlug} Dollars, not Shopify’s returning-customer rate. Guests stay out.`,
                    }
                  : null,
              ].filter((b): b is { k: string; v: string } => b != null),
              next: "Order history only — no spend required.",
              nextHref: "/app/ltv",
              nextLabel: `Open ${PRODUCT_NOUN.ltvTitle}`,
            })
          }
        >
          <span className="mcfly-habit-goals__read-k">Today’s read</span>
          <span className="mcfly-habit-goals__read-v">{heroMoney}</span>
          <span className="mcfly-habit-goals__read-line">{read.line}</span>
        </button>
      ) : null}

      <div className="mcfly-cust-kpis mcfly-cust-kpis--actions">
        <ActionCard
          label="New-buyer worth"
          value={ltvMoney}
          sub={
            ltv
              ? `Target Line from average · ${ltv.windowLabel}`
              : "Observed first-window LTV still sealing"
          }
          tone="plain"
          verb="Target Line"
          detail="Average dollars per new buyer in the sealed first window (90, then 30; first year only when history is not limited). That average is the Target Line — not a goal you type. Observed order history — not an estimate. Refunds never invented."
        />
        <ActionCard
          label="Returning $"
          value={returningMoney}
          sub={
            returning
              ? `${pctLabel(returning.pct)} of ${formatCurrency(returning.target, currency)} · ${returning.windowLabel}`
              : "Year returning $ still sealing"
          }
          tone={trackTone(returning)}
          verb={returning?.met ? "Met" : "Toward"}
          detail={returningActionDetail(returning)}
        />
      </div>

      {ltv ? (
        <div
          className="mcfly-habit-goals__bar"
          aria-hidden="true"
          title={`Target Line from average · ${ltv.windowLabel}`}
        >
          <span className="mcfly-habit-goals__track mcfly-habit-goals__track--target">
            <span
              className="mcfly-habit-goals__bar-fill"
              style={{ width: "100%" }}
            />
            <span className="mcfly-habit-goals__target-line" />
          </span>
          <span className="mcfly-habit-goals__bar-legend">
            Target Line · from average · {ltv.windowLabel}
          </span>
        </div>
      ) : null}

      {returning ? (
        <div
          className="mcfly-habit-goals__bar"
          aria-hidden="true"
          title={`Returning $ ${pctLabel(returning.pct)} of target`}
        >
          <span className="mcfly-habit-goals__track">
            <span
              className="mcfly-habit-goals__bar-fill"
              style={{ width: `${barWidth(returning.pct)}%` }}
            />
          </span>
          <span className="mcfly-habit-goals__bar-legend">
            Returning {pctLabel(returning.pct)} · {returning.windowLabel}
          </span>
        </div>
      ) : null}

      {ltv ? (
        <button
          type="button"
          className="mcfly-depth-formula__card"
          onClick={() =>
            drill?.openDrill({
              title: "New-buyer worth",
              value: ltvMoney,
              kicker: "Written out",
              blocks: [
                { k: "Formula", v: ltv.formulaEq },
                { k: "Plugged in", v: ltv.formulaPlug },
                {
                  k: "Target Line",
                  v: `${formatCurrency(ltv.target, currency)} — from the observed average, not a goal you set.`,
                },
              ],
              next: "Observed order history — not an estimate.",
              nextHref: "/app/ltv",
              nextLabel: `Open ${PRODUCT_NOUN.ltvTitle}`,
            })
          }
        >
          <p className="mcfly-depth-formula__eq">{ltv.formulaEq}</p>
          <div className="mcfly-depth-formula__parts">
            <span className="mcfly-depth-formula__part">
              <span className="mcfly-depth-formula__part-k">Observed</span>
              <span className="mcfly-depth-formula__part-v">{ltvMoney}</span>
            </span>
            <span className="mcfly-depth-formula__part">
              <span className="mcfly-depth-formula__part-k">Target Line</span>
              <span className="mcfly-depth-formula__part-v">
                {formatCurrency(ltv.target, currency)}
              </span>
            </span>
            <span className="mcfly-depth-formula__part">
              <span className="mcfly-depth-formula__part-k">Source</span>
              <span className="mcfly-depth-formula__part-v">Average</span>
            </span>
          </div>
          <p className="mcfly-depth-formula__plug">{ltv.formulaPlug}</p>
          <p className="mcfly-depth-formula__obs">
            Observed {ltv.windowLabel} — not an estimate. Refunds never
            invented.
          </p>
        </button>
      ) : null}

      {returning ? (
        <button
          type="button"
          className="mcfly-depth-formula__card"
          onClick={() =>
            drill?.openDrill({
              title: "Returning $",
              value: returningMoney,
              kicker: "Written out",
              blocks: [
                { k: "Formula", v: returning.formulaEq },
                { k: "Plugged in", v: returning.formulaPlug },
                {
                  k: "Still to go",
                  v: returning.met
                    ? "At the target — dollars, not headcount."
                    : `${formatCurrency(returning.remaining, currency)} to the ${formatCurrency(returning.target, currency)} ${habitGoalTargetSourceLabel(returning.targetSource).toLowerCase()}.`,
                },
                {
                  k: "Source",
                  v:
                    returning.targetSource === "sample"
                      ? "Snowdevil stretch — SAMPLE example, not a target you typed."
                      : habitGoalTargetSourceLabel(returning.targetSource),
                },
              ],
              next: "Dollars, not Shopify’s returning-customer rate. Guests stay out.",
              nextHref: "/app/customers",
              nextLabel: `Open ${PRODUCT_NOUN.buyersTitle}`,
            })
          }
        >
          <p className="mcfly-depth-formula__eq">{returning.formulaEq}</p>
          <div className="mcfly-depth-formula__parts">
            <span className="mcfly-depth-formula__part">
              <span className="mcfly-depth-formula__part-k">Returning $</span>
              <span className="mcfly-depth-formula__part-v">
                {returningMoney}
              </span>
            </span>
            <span className="mcfly-depth-formula__part">
              <span className="mcfly-depth-formula__part-k">Target</span>
              <span className="mcfly-depth-formula__part-v">
                {formatCurrency(returning.target, currency)}
              </span>
            </span>
            <span className="mcfly-depth-formula__part">
              <span className="mcfly-depth-formula__part-k">Still to go</span>
              <span className="mcfly-depth-formula__part-v">
                {returning.met
                  ? "Met"
                  : formatCurrency(returning.remaining, currency)}
              </span>
            </span>
            <span className="mcfly-depth-formula__part">
              <span className="mcfly-depth-formula__part-k">Source</span>
              <span className="mcfly-depth-formula__part-v">
                {habitGoalTargetSourceLabel(returning.targetSource)}
              </span>
            </span>
          </div>
          <p className="mcfly-depth-formula__plug">{returning.formulaPlug}</p>
          <p className="mcfly-depth-formula__obs">
            {returning.windowLabel}. Guests stay out. Not a headcount rate.
          </p>
        </button>
      ) : null}

      <HabitGoalFields
        year={year}
        returningTarget={view.returningTarget}
        targetSource={returning?.targetSource ?? null}
        busy={busy}
      />

      <p className="mcfly-habit-goals__meta">
        <DeskIcon name="sales" /> Order history only. LTV Target Line is the
        observed average. Returning-$ target lives here and in Settings. Sales
        plan vs actual stays below.
      </p>
    </section>
  );
}

function HabitGoalFields({
  year,
  returningTarget,
  targetSource,
  busy,
}: {
  year: number;
  returningTarget: number | null;
  targetSource: HabitGoalTargetSource | null;
  busy: boolean;
}) {
  const sampleStretch = targetSource === "sample";
  return (
    <Form method="post" className="mcfly-habit-goals__form">
      <input type="hidden" name="intent" value="save_habit_goals" />
      <input type="hidden" name="year" value={year} />
      <label className="mcfly-habit-goals__field">
        <span className="mcfly-habit-goals__field-k">Year returning-$ target</span>
        <input
          className="mcfly-field mcfly-habit-goals__input"
          name="returningSalesTarget"
          type="text"
          inputMode="decimal"
          autoComplete="off"
          defaultValue={typedReturningFieldValue(returningTarget, targetSource)}
          placeholder="e.g. 800000"
          aria-label="Year returning-dollar target"
        />
        {sampleStretch ? (
          <span className="mcfly-habit-goals__field-k">
            Canvas uses Snowdevil stretch $
            {SAMPLE_HABIT_RETURNING_TARGET.toLocaleString("en-US")} — SAMPLE
            example, not a target you typed.
          </span>
        ) : null}
      </label>
      <button
        type="submit"
        className="mcfly-btn mcfly-btn--primary mcfly-habit-goals__save"
        disabled={busy || undefined}
      >
        Save returning-$ target
      </button>
    </Form>
  );
}
