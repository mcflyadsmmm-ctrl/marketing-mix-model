import { formatCurrency } from "../lib/mer-format";
import { useDeskCurrency } from "../lib/desk-currency";
import type {
  OrderHistoryForecastTarget,
  OrderHistoryForecastTone,
  OrderHistoryForecastView,
} from "../lib/order-history-forecast";

export type OrderHistoryForecastVariant = "overview" | "goals";

function moneyOrDash(amount: number | null, currency: string): string {
  if (amount == null || !Number.isFinite(amount) || amount <= 0) return "—";
  return formatCurrency(amount, currency);
}

/**
 * Progress toward a typed or SAMPLE target. Missing stays "—".
 * A real sliver under 1% stays "<1%" so the row never paints a fake 0%.
 */
function pctText(pct: number | null): string {
  if (pct == null || !Number.isFinite(pct)) return "—";
  const rounded = Math.round(pct * 100);
  if (rounded <= 0) return "<1%";
  return `${rounded}%`;
}

function toneClass(tone: OrderHistoryForecastTone): string {
  switch (tone) {
    case "up":
      return "mcfly-oh-forecast__delta--up";
    case "down":
      return "mcfly-oh-forecast__delta--down";
    case "flat":
      return "mcfly-oh-forecast__delta--flat";
    default: {
      const _exhaustive: never = tone;
      return _exhaustive;
    }
  }
}

function TargetRow({
  row,
  currency,
}: {
  row: OrderHistoryForecastTarget;
  currency: string;
}) {
  const pctMissing = row.pct == null;
  return (
    <li className="mcfly-oh-forecast__row">
      <span className="mcfly-oh-forecast__row-k">{row.label}</span>
      <span className="mcfly-oh-forecast__row-v">
        {moneyOrDash(row.actual, currency)}
      </span>
      <span className="mcfly-oh-forecast__row-sub">
        {row.note}
        {row.target != null
          ? ` Target ${formatCurrency(row.target, currency)}.`
          : ""}
      </span>
      <span
        className={`mcfly-oh-forecast__delta ${toneClass(row.tone)}`}
        data-pct={pctMissing ? "missing" : "set"}
      >
        {pctText(row.pct)}
      </span>
    </li>
  );
}

/**
 * Next-month sales from order history, with the formula on the page.
 * Goals also lists sales / returning-$ / new-buyer worth when those
 * targets are already on the book. Missing numbers are —. No spend.
 */
export function OrderHistoryForecast({
  view,
  variant,
  goalsHref = "/app/goals",
}: {
  view: OrderHistoryForecastView;
  variant: OrderHistoryForecastVariant;
  goalsHref?: string;
}) {
  const currency = useDeskCurrency();
  const estimateText =
    view.estimate == null ? "—" : formatCurrency(view.estimate, currency);
  const glance = glanceLine(variant, goalsHref);

  return (
    <section
      className="mcfly-panel mcfly-cust-card mcfly-cust-card--soft mcfly-oh-forecast"
      aria-label="Order-history forecast"
      data-p2a="order-history-forecast"
    >
      <div className="mcfly-panel__head">
        <h2>Order-history forecast</h2>
        <p className="mcfly-panel__muted">Next month · order history only</p>
      </div>
      <p className="mcfly-oh-forecast__period">{view.periodLabel}</p>
      <p
        className="mcfly-oh-forecast__value"
        data-estimate={view.estimate == null ? "missing" : "set"}
      >
        {estimateText}
      </p>
      {view.emptyCopy ? (
        <p className="mcfly-oh-forecast__empty">{view.emptyCopy}</p>
      ) : null}
      <p className="mcfly-oh-forecast__formula">{view.formula}</p>
      <p className="mcfly-oh-forecast__plug" data-plug={view.plug == null ? "missing" : "set"}>
        {view.plug ?? "—"}
      </p>
      <p className="mcfly-oh-forecast__method">{view.method}</p>
      <p className="mcfly-oh-forecast__days">{view.daysLine}</p>
      {variant === "goals" ? (
        <ul className="mcfly-oh-forecast__targets">
          {view.targets.map((row) => (
            <TargetRow key={row.kind} row={row} currency={currency} />
          ))}
        </ul>
      ) : null}
      {glance}
    </section>
  );
}

function glanceLine(
  variant: OrderHistoryForecastVariant,
  goalsHref: string,
) {
  switch (variant) {
    case "overview":
      return (
        <p className="mcfly-oh-forecast__glance">
          <a href={goalsHref}>Sales, returning $, and new-buyer worth</a>
          {" on Goals. Order history only. No spend required."}
        </p>
      );
    case "goals":
      return (
        <p className="mcfly-oh-forecast__glance">
          Order history only. No spend required.
        </p>
      );
    default: {
      const _exhaustive: never = variant;
      return _exhaustive;
    }
  }
}
