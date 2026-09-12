import type { SalesMixModel } from "../lib/sales-mix";

function money(n: number): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function pct(share: number): string {
  return `${Math.round(share * 100)}%`;
}

/**
 * Black Clover pastel channel-bar language for Shopify buyer/calendar mix.
 */
export function SalesMixPanel({ model }: { model: SalesMixModel }) {
  return (
    <section className="mcfly-panel mcfly-sales-mix" aria-label={model.title}>
      <header className="mcfly-panel__head">
        <h2>{model.title}</h2>
        <p className="mcfly-panel__muted">{model.subtitle}</p>
      </header>
      <div className="mcfly-sales-mix__groups">
        {model.groups.map((group) => (
          <div key={group.id} className="mcfly-sales-mix__group">
            <p className="mcfly-sales-mix__group-title">{group.title}</p>
            <ul className="mcfly-sales-mix__bars">
              {group.bars.map((bar) => (
                <li key={bar.id} className="mcfly-sales-mix__row">
                  <div className="mcfly-sales-mix__meta">
                    <span className="mcfly-sales-mix__name">{bar.label}</span>
                    <span className="mcfly-sales-mix__amt">
                      {money(bar.amount)} · {pct(bar.share)}
                    </span>
                  </div>
                  <div
                    className="mcfly-sales-mix__track"
                    aria-hidden="true"
                  >
                    <span
                      className={`mcfly-sales-mix__fill mcfly-sales-mix__fill--${bar.tone}`}
                      style={{
                        width: `${Math.max(2, Math.round(bar.share * 100))}%`,
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
