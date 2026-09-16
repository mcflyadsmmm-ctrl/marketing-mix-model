import { NumberHonestyPanel } from "./NumberHonestyPanel";
import { formatCurrency, formatMer } from "../lib/mer-format";
import { PRODUCT_NOUN } from "../lib/product-labels";
import { NUMBER_HONESTY } from "../lib/number-honesty";
import type { PeriodPreset } from "../lib/periods";
import { useDeskCurrency } from "../lib/desk-currency";

/** Whole percents in merchant chrome — 25%, never 25.0%. */
function pct(share: number): string {
  return `${Math.round(share * 100)}%`;
}

/**
 * The optional second chapter. Empty spend is an invitation, never 0×.
 * One Total ROAS hero, spend and channels as drill rows.
 * Overview empty: NUMBER_HONESTY.empty only. NUMBER_HONESTY.csvHint and
 * NUMBER_HONESTY.orderWindow belong on the Marketing tab helper, not stacked here.
 */
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
  const currency = useDeskCurrency();
  const merValue =
    mer != null && Number.isFinite(mer) ? `${formatMer(mer)}×` : null;
  const targetLine =
    targetMer > 0 ? ` Target ${formatMer(targetMer)}×.` : "";

  return (
    <section
      className="mcfly-book mcfly-desk-anchor"
      id="mcfly-marketing"
      aria-label={PRODUCT_NOUN.marketingSection}
    >
      {spendOnlyEmpty ? (
        <>
          <p className="mcfly-book__lede">{NUMBER_HONESTY.empty}</p>
          <p className="mcfly-book__cta">
            <s-link href={spendHref}>{PRODUCT_NOUN.setupAddSpend}</s-link>
          </p>
        </>
      ) : (
        <>
          <p className="mcfly-book__lede">
            {PRODUCT_NOUN.marketingSection} — ad spend is optional.{" "}
            {PRODUCT_NOUN.totalRoas} = Shopify Total Sales ÷ spend you add.
          </p>
          {merValue ? (
            <div className="mcfly-book__hero">
              <p className="mcfly-book__hero-k">{PRODUCT_NOUN.totalRoas}</p>
              <p className="mcfly-book__hero-v">{merValue}</p>
              <p className="mcfly-book__hero-def">
                {PRODUCT_NOUN.definition} for {periodLabel}.{targetLine}
                {merDeltaLine ? ` ${merDeltaLine}.` : ""}
              </p>
            </div>
          ) : null}
          <div className="mcfly-book__rows mcfly-book__rows--kpis">
            <details className="mcfly-book__row">
              <summary className="mcfly-book__row-sum">
                <span className="mcfly-book__row-k">Total Spend</span>
                <span className="mcfly-book__row-v">
                  {formatCurrency(totalSpend, currency)}
                </span>
              </summary>
              <p className="mcfly-book__row-d">
                Spend you entered for {periodLabel}
                {spendDeltaLine ? ` · ${spendDeltaLine}` : ""}.
              </p>
            </details>
            {periodChannels.map((entry) => (
              <details className="mcfly-book__row" key={entry.name}>
                <summary className="mcfly-book__row-sum">
                  <span className="mcfly-book__row-k">{entry.name}</span>
                  <span className="mcfly-book__row-v">
                    {formatCurrency(entry.amount, currency)}
                  </span>
                </summary>
                <p className="mcfly-book__row-d">
                  {pct(entry.share)} of spend in {periodLabel}.{" "}
                  <a href="#mcfly-chart">See on chart</a>
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
