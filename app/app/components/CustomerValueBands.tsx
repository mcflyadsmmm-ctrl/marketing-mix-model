import { DualBars, VerticalBars } from "./CustomerCharts";
import { useDeskCurrency } from "../lib/desk-currency";
import { parseShopCurrencyCode } from "../lib/spend-money";
import type { CustomerAnalytics } from "../lib/customers-analytics";

/** Compact money for a revenue axis — $8.0M, $52k — shop currency or a dash. */
function compactMoney(amount: number, currency: string): string {
  const code = parseShopCurrencyCode(currency);
  if (!code) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: code,
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(amount);
}

/**
 * "Value & frequency mix" — the whales-vs-minnows picture Shopify Analytics
 * doesn't draw: customers vs revenue by spend band (dual axis), and the
 * order-count long tail. Order history only, trailing window. No spend, no ROAS.
 */
export function CustomerValueBands({ analytics }: { analytics: CustomerAnalytics }) {
  const currency = useDeskCurrency();
  const a = analytics;

  if (!a.available) {
    const ghost = [0.42, 0.7, 0.55, 0.88, 0.36];
    return (
      <section
        className="mcfly-panel mcfly-cust-card mcfly-cust-empty"
        aria-label="Value and frequency mix"
      >
        <div className="mcfly-panel__head">
          <h2>Value &amp; frequency mix</h2>
          <p className="mcfly-panel__muted">
            Value bands · order-count distribution · order history
          </p>
        </div>
        <div className="mcfly-cust-empty__ghost mcfly-cust-empty__ghost--bars" aria-hidden="true">
          {ghost.map((h, i) => (
            <span key={i} className="mcfly-cust-empty__col">
              <span className="mcfly-cust-empty__col-a" style={{ height: `${h * 100}%` }} />
              <span
                className="mcfly-cust-empty__col-b"
                style={{ height: `${Math.max(18, (1 - h) * 70)}%` }}
              />
            </span>
          ))}
        </div>
        <p className="mcfly-cust-empty__copy">
          Needs identified buyers on file — not $0. Snowdevil SAMPLE fills this in.
        </p>
      </section>
    );
  }

  const bandItems = a.spendBands.map((b) => ({
    key: b.label,
    label: b.label,
    a: b.customers,
    b: b.revenue,
    detail: `Buyers who spent ${b.label.replace("$", "$")} across the trailing window, and the revenue they brought.`,
  }));

  const freqItems = a.orderFrequency.map((b) => ({
    key: b.label,
    label: b.label,
    value: b.customers,
    detail: "Identified buyers with this many orders in the trailing window.",
  }));

  return (
    <section className="mcfly-panel mcfly-cust-card mcfly-desk-anchor" aria-label="Value and frequency mix">
      <div className="mcfly-panel__head">
        <h2>Value &amp; frequency mix</h2>
        <p className="mcfly-panel__muted">
          Spend bands · order-count distribution · last ~{a.historyDays} days
        </p>
      </div>

      <DualBars
        title="Spend bands"
        subtitle="customers vs revenue"
        items={bandItems}
        aLabel="Customers"
        bLabel="Revenue"
        formatA={(n) => Math.round(n).toLocaleString()}
        formatB={(n) => compactMoney(n, currency)}
      />

      <VerticalBars
        title="Order frequency"
        subtitle="customers by order count"
        items={freqItems}
        ariaUnit=" buyers"
        emptyCopy="Needs identified buyers on file — not zero."
      />
    </section>
  );
}
