import { TotalRoasGauge } from "./TotalRoasGauge";
import { NumberHonestyPanel } from "./NumberHonestyPanel";
import { formatCurrency, formatMer } from "../lib/mer-format";
import { PRODUCT_NOUN } from "../lib/product-labels";
import { NUMBER_HONESTY } from "../lib/number-honesty";
import type { PeriodPreset } from "../lib/periods";

/** Whole percents in merchant chrome — 25%, never 25.0%. */
function pct(share: number): string {
  return `${Math.round(share * 100)}%`;
}

export function MarketingSnapSection({
  spendOnlyEmpty,
  spendHref,
  preset,
  totalSales,
  totalSpend,
  mer,
  targetMer,
  periodLabel,
  salesPending,
  merDeltaLine,
  spendDeltaLine,
  periodChannels,
}: {
  spendOnlyEmpty: boolean;
  spendHref: string;
  preset: PeriodPreset;
  totalSales: number;
  totalSpend: number;
  mer: number | null;
  targetMer: number;
  periodLabel: string;
  salesPending: boolean;
  merDeltaLine: string | null;
  spendDeltaLine: string | null;
  periodChannels: Array<{
    name: string;
    amount: number;
    share: number;
    fill: string;
  }>;
}) {
  return (
    <section
      className="mcfly-book"
      aria-label={PRODUCT_NOUN.marketingSection}
    >
      <p className="mcfly-book__lede">
        {PRODUCT_NOUN.marketingSection} — ad spend is optional.{" "}
        {PRODUCT_NOUN.totalRoas} = Shopify Total Sales ÷ spend you add.
      </p>
      {spendOnlyEmpty ? (
        <>
          <p className="mcfly-book__lede">
            {NUMBER_HONESTY.empty} {NUMBER_HONESTY.csvHint}{" "}
            {NUMBER_HONESTY.orderWindow}
          </p>
          <p className="mcfly-book__cta">
            <s-button
              href={spendHref}
              variant="secondary"
              aria-label={PRODUCT_NOUN.setupAddSpend}
            >
              {PRODUCT_NOUN.setupAddSpend}
            </s-button>
          </p>
        </>
      ) : (
        <>
          <div className="mcfly-hero-compact__status mcfly-hero-compact__status--gauge">
            <TotalRoasGauge
              mer={mer}
              targetMer={targetMer}
              deltaLine={merDeltaLine}
            />
          </div>
          <div className="mcfly-book__rows">
            <details className="mcfly-book__row">
              <summary className="mcfly-book__row-sum">
                <span className="mcfly-book__row-k">Total Spend</span>
                <span className="mcfly-book__row-v">
                  {formatCurrency(totalSpend)}
                </span>
              </summary>
              <p className="mcfly-book__row-d">
                Spend you entered for {periodLabel}
                {spendDeltaLine ? ` · ${spendDeltaLine}` : ""}.
              </p>
            </details>
            <details className="mcfly-book__row">
              <summary className="mcfly-book__row-sum">
                <span className="mcfly-book__row-k">
                  {PRODUCT_NOUN.totalRoas}
                </span>
                <span className="mcfly-book__row-v">
                  {mer != null ? `${formatMer(mer)}×` : "—"}
                </span>
              </summary>
              <p className="mcfly-book__row-d">{PRODUCT_NOUN.definition}.</p>
            </details>
            {periodChannels.map((entry) => (
              <details className="mcfly-book__row" key={entry.name}>
                <summary className="mcfly-book__row-sum">
                  <span className="mcfly-book__row-k">{entry.name}</span>
                  <span className="mcfly-book__row-v">
                    {formatCurrency(entry.amount)}
                  </span>
                </summary>
                <p className="mcfly-book__row-d">
                  {pct(entry.share)} of spend in {periodLabel}.
                </p>
              </details>
            ))}
          </div>
          {periodChannels.length === 0 ? (
            <p className="mcfly-book__lede">
              No channel spend in this period.
            </p>
          ) : null}
          <NumberHonestyPanel
            sales={totalSales}
            spend={totalSpend}
            mer={mer}
            periodLabel={periodLabel}
            salesPending={salesPending}
          />
          <p className="mcfly-book__cta">
            <s-link href={spendHref}>{PRODUCT_NOUN.uploadSpend}</s-link>
            {" · "}
            <s-link href={`/app/allocation?period=${preset}`}>
              {PRODUCT_NOUN.spendAllocation}
            </s-link>
          </p>
        </>
      )}
    </section>
  );
}
