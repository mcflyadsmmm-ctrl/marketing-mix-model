import { formatCurrency } from "../lib/mer-format";
import { PRODUCT_NOUN } from "../lib/product-labels";
import type { CpaPaybackView, CpaWindowSnapshot } from "../lib/cpa-desk";
import { useDeskCurrency } from "../lib/desk-currency";
import { DeskIcon } from "./DeskIcon";

function moneyOrDash(value: number | null, currency: string): string {
  return value != null ? formatCurrency(value, currency) : "—";
}

export function CpaPaybackDesk({
  window: selected,
  payback,
  historyLimited,
}: {
  window: CpaWindowSnapshot;
  payback: CpaPaybackView;
  historyLimited: boolean;
}) {
  const currency = useDeskCurrency();
  const hasSpend = selected.spend > 0;
  const sharePct =
    payback.cacShareOfFirst90 != null
      ? Math.min(100, Math.round(payback.cacShareOfFirst90 * 100))
      : null;

  return (
    <section className="mcfly-cpa__payback" aria-label="Payback versus first 90 days">
      <div className="mcfly-chart__masthead">
        <h3 className="mcfly-chart__serif">
          <DeskIcon name="clock" /> Payback vs first 90
        </h3>
        <p className="mcfly-chart__muted">
          {selected.label}
          {selected.rangeLabel ? ` · ${selected.rangeLabel}` : ""} · Cash CAC next to
          first-90 LTV from order history
        </p>
      </div>

      <div className="mcfly-cpa__payback-pair">
        <article className="mcfly-cpa__payback-side">
          <p className="mcfly-cpa__payback-k">Cash CAC</p>
          <p className="mcfly-cpa__payback-v">
            {hasSpend ? moneyOrDash(payback.cashCac, currency) : "—"}
          </p>
          <p className="mcfly-cpa__payback-d">{PRODUCT_NOUN.cashCacDef}</p>
        </article>
        <article className="mcfly-cpa__payback-side">
          <p className="mcfly-cpa__payback-k">First 90 days</p>
          <p className="mcfly-cpa__payback-v">
            {moneyOrDash(payback.first90, currency)}
          </p>
          <p className="mcfly-cpa__payback-d">{PRODUCT_NOUN.ltv90Def}</p>
        </article>
      </div>

      <div className="mcfly-cpa__payback-track" aria-hidden="true">
        <div
          className={`mcfly-cpa__payback-fill${sharePct == null ? " mcfly-cpa__payback-fill--empty" : ""}`}
          style={{ width: `${sharePct ?? 0}%` }}
        />
      </div>
      <p className="mcfly-cpa__payback-note">
        {!hasSpend
          ? "Add spend to see Cash CAC next to first-90 value — never a fake $0."
          : payback.cashCac == null
            ? "Cash CAC needs identified new buyers in this window."
            : payback.first90 == null
              ? historyLimited
                ? "First-90 value is still filling from the Shopify order window — not $0 LTV."
                : "First-90 value is not on file yet — not $0 LTV."
              : payback.cacShareOfFirst90 != null && payback.cacShareOfFirst90 > 1
                ? `Cash CAC is above first-90 value (${sharePct}% of first 90). Average, not a promise.`
                : `Cash CAC is ${sharePct}% of first-90 value. Average, not a causal claim.`}
      </p>

      <ul className="mcfly-chart__stats mcfly-cpa__payback-stats">
        <li className="mcfly-chart__stat">
          <span className="mcfly-chart__stat-k">Value vs cost</span>
          <span className="mcfly-chart__stat-v">
            {payback.valueVsCost != null ? `${payback.valueVsCost.toFixed(2)}×` : "—"}
          </span>
          <span className="mcfly-chart__stat-sub">First 90 ÷ Cash CAC</span>
        </li>
        <li className="mcfly-chart__stat">
          <span className="mcfly-chart__stat-k">Customer payback</span>
          <span className="mcfly-chart__stat-v">
            {payback.paybackDays != null ? `${payback.paybackDays}d` : "—"}
          </span>
          <span className="mcfly-chart__stat-sub">
            interpolated vs first-90 average — not a recovery date
          </span>
        </li>
        <li className="mcfly-chart__stat">
          <span className="mcfly-chart__stat-k">First 30 days</span>
          <span className="mcfly-chart__stat-v">
            {moneyOrDash(payback.first30, currency)}
          </span>
          <span className="mcfly-chart__stat-sub">on file after first order</span>
        </li>
      </ul>
    </section>
  );
}
