import {
  type GoalsCashScoreboard,
  type GoalsCashScoreboardKind,
  type GoalsVsLine,
} from "../lib/goals-cash-scoreboard";
import { formatCurrency, formatMer } from "../lib/mer-format";
import { PRODUCT_NOUN } from "../lib/product-labels";

function assertNever(x: never): never {
  throw new Error(`unexpected Goals cash scoreboard kind: ${String(x)}`);
}

function vsClass(vs: GoalsVsLine): "up" | "down" | "flat" {
  switch (vs) {
    case "above":
      return "up";
    case "below":
      return "down";
    case "unknown":
      return "flat";
    default: {
      const _exhaustive: never = vs;
      throw new Error(`unexpected Goals vs line: ${String(_exhaustive)}`);
    }
  }
}

function EmptyBoard({ board }: { board: GoalsCashScoreboard }) {
  return (
    <section
      className="mcfly-goals-mer-card mcfly-goals-csb mcfly-goals-csb--empty"
      aria-label={`${PRODUCT_NOUN.totalRoas} vs goal`}
    >
      <p className="mcfly-goals-mer-card__kicker">
        {PRODUCT_NOUN.totalRoas} · YTD cash desk
      </p>
      <h2 className="mcfly-goals-mer-card__title">{board.heading}</h2>
      <p className="mcfly-goals-mer-card__explain">{board.body}</p>
      {board.nextAction ? (
        <div className="mcfly-goals-csb__action">
          <s-button href={board.nextAction.href} variant="primary">
            {board.nextAction.label}
          </s-button>
        </div>
      ) : null}
    </section>
  );
}

function TillBoard({ board }: { board: GoalsCashScoreboard }) {
  const sample = board.kind === "sample";
  return (
    <section
      className={[
        "mcfly-goals-hero",
        "mcfly-goals-csb",
        sample ? "mcfly-goals-csb--sample" : null,
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label={`${PRODUCT_NOUN.totalRoas} vs target and break-even`}
    >
      <p className="mcfly-goals-hero__kicker">
        {sample
          ? PRODUCT_NOUN.samplePreview
          : `${PRODUCT_NOUN.totalRoas} · YTD cash desk`}
      </p>
      <h2 className="mcfly-goals-csb__headline">{board.heading}</h2>
      <div className="mcfly-goals-hero__grid mcfly-goals-csb__grid">
        <div className="mcfly-goals-hero__kpi">
          <p className="mcfly-goals-hero__label">YTD {PRODUCT_NOUN.totalRoas}</p>
          <p className="mcfly-goals-hero__value">{board.merLabel}</p>
          <p className="mcfly-goals-hero__meta">
            {formatCurrency(board.sales)} ÷ {formatCurrency(board.spend)}
          </p>
        </div>
        <div className="mcfly-goals-hero__kpi">
          <p className="mcfly-goals-hero__label">{PRODUCT_NOUN.totalRoasGoal}</p>
          <p
            className={`mcfly-goals-hero__value mcfly-goals-csb__value--${vsClass(board.vsTarget)}`}
          >
            {board.targetMer != null ? `${formatMer(board.targetMer)}×` : "—"}
          </p>
          <p className="mcfly-goals-hero__meta">{board.vsTargetLine}</p>
        </div>
        <div className="mcfly-goals-hero__kpi">
          <p className="mcfly-goals-hero__label">{PRODUCT_NOUN.breakEvenShort}</p>
          <p
            className={`mcfly-goals-hero__value mcfly-goals-csb__value--${vsClass(board.vsBreakEven)}`}
          >
            {board.breakEvenMer != null
              ? `${formatMer(board.breakEvenMer)}×`
              : "—"}
          </p>
          <p className="mcfly-goals-hero__meta">{board.vsBreakEvenLine}</p>
        </div>
      </div>
      <p className="mcfly-goals-csb__body">{board.body}</p>
      {board.nextAction ? (
        <div className="mcfly-goals-csb__action">
          <s-button
            href={board.nextAction.href}
            variant={board.vsBreakEven === "below" ? "primary" : "secondary"}
          >
            {board.nextAction.label}
          </s-button>
          <s-link href="/app/settings">Edit target / margin</s-link>
        </div>
      ) : (
        <p className="mcfly-goals-csb__edit">
          <s-link href="/app/settings">Edit target / margin</s-link>
        </p>
      )}
    </section>
  );
}

export function GoalsCashScoreboardView({
  board,
}: {
  board: GoalsCashScoreboard;
}) {
  const kind: GoalsCashScoreboardKind = board.kind;
  switch (kind) {
    case "untrusted_sales":
    case "needs_spend":
      return <EmptyBoard board={board} />;
    case "sample":
    case "ready":
      return <TillBoard board={board} />;
    default:
      return assertNever(kind);
  }
}
