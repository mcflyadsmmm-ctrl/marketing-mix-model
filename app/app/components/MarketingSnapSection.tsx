import { NumberHonestyPanel } from "./NumberHonestyPanel";
import { formatCurrency, formatMer } from "../lib/mer-format";
import { PRODUCT_NOUN } from "../lib/product-labels";
import { NUMBER_HONESTY } from "../lib/number-honesty";
import { formatSpendOnFile, spendOnFileHint } from "../lib/spend-on-file";
import type { PeriodPreset } from "../lib/periods";
import { useDeskCurrency } from "../lib/desk-currency";

/** Whole percents in merchant chrome — 25%, never 25.0%. */
function pct(share: number): string {
  return `${Math.round(share * 100)}%`;
}

/**
 * Spend Upload payoff after one typed day. Empty spend is an invitation,
 * never a painted empty ratio. Sales | Total ROAS sit as a pair; mix + coverage
 * chart live on this tab. NUMBER_HONESTY.csvHint and NUMBER_HONESTY.orderWindow
 * belong on the Spend helper, not stacked here. Overview empty:
 * NUMBER_HONESTY.empty only — this section does not mount on Overview.
 */
export function MarketingSnapSection({
  spendOnlyEmpty,
  spendHref,
  roasHref = "/app/roas",
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
  roasHref?: string;
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
  const hasSpend = Number.isFinite(totalSpend) && totalSpend > 0;
  const roasValue =
    hasSpend &&
    !salesPending &&
    mer != null &&
    Number.isFinite(mer)
      ? `${formatMer(mer)}×`
      : "—";
  const salesValue = salesPending
    ? "—"
    : formatCurrency(totalSales, currency);
  const targetLine =
    targetMer > 0 ? ` Target ${formatMer(targetMer)}×.` : "";

  return (
    <section
      className="mcfly-book mcfly-desk-anchor"
      id="mcfly-marketing"
      aria-label="Sales, spend, and Total ROAS"
    >
      {spendOnlyEmpty ? (
        <>
          <p className="mcfly-book__lede">{NUMBER_HONESTY.empty}</p>
          <div className="mcfly-book__glance mcfly-book__glance--kpis">
            <div className="mcfly-book__kpi">
              <p className="mcfly-book__kpi-k">Sales</p>
              <p className="mcfly-book__kpi-v">{salesValue}</p>
              <p className="mcfly-book__kpi-hint">
                {salesPending
                  ? "Still loading — not $0"
                  : `Shopify Total Sales · ${periodLabel}`}
              </p>
            </div>
            <div className="mcfly-book__kpi">
              <p className="mcfly-book__kpi-k">Spend</p>
              <p className="mcfly-book__kpi-v">
                {formatSpendOnFile(totalSpend, currency)}
              </p>
              <p className="mcfly-book__kpi-hint">
                {spendOnFileHint(totalSpend)}
              </p>
            </div>
            <div className="mcfly-book__kpi">
              <p className="mcfly-book__kpi-k">{PRODUCT_NOUN.totalRoas}</p>
              <p className="mcfly-book__kpi-v">{roasValue}</p>
              <p className="mcfly-book__kpi-hint">
                Empty spend is not {PRODUCT_NOUN.totalRoas}
              </p>
            </div>
          </div>
          <p className="mcfly-book__cta">
            <s-link href={spendHref}>{PRODUCT_NOUN.setupAddSpend}</s-link>
          </p>
        </>
      ) : (
        <>
          <p className="mcfly-book__lede">
            {PRODUCT_NOUN.totalRoas} = {PRODUCT_NOUN.definition} for{" "}
            {periodLabel}. Not platform ROAS.
            {targetLine}
            {merDeltaLine ? ` ${merDeltaLine}.` : ""}
          </p>
          {salesPending ? (
            <p className="mcfly-book__lede">{NUMBER_HONESTY.salesPending}</p>
          ) : null}
          <div className="mcfly-book__glance mcfly-book__glance--kpis">
            <div className="mcfly-book__kpi">
              <p className="mcfly-book__kpi-k">Sales</p>
              <p className="mcfly-book__kpi-v">{salesValue}</p>
              <p className="mcfly-book__kpi-hint">
                {salesPending
                  ? "Still loading — not $0"
                  : `Shopify Total Sales · ${periodLabel}`}
              </p>
            </div>
            <div className="mcfly-book__kpi">
              <p className="mcfly-book__kpi-k">Spend</p>
              <p className="mcfly-book__kpi-v">
                {formatSpendOnFile(totalSpend, currency)}
              </p>
              <p className="mcfly-book__kpi-hint">
                {spendDeltaLine
                  ? spendDeltaLine
                  : spendOnFileHint(totalSpend)}
              </p>
            </div>
            <div className="mcfly-book__kpi">
              <p className="mcfly-book__kpi-k">{PRODUCT_NOUN.totalRoas}</p>
              <p className="mcfly-book__kpi-v">{roasValue}</p>
              <p className="mcfly-book__kpi-hint">
                {hasSpend
                  ? PRODUCT_NOUN.definition
                  : NUMBER_HONESTY.empty}
              </p>
            </div>
          </div>
          {periodChannels.length > 0 ? (
            <>
              <div
                id="mcfly-spend-mix"
                className="mcfly-alloc-v2__q-bar"
                role="img"
                aria-label={`Channel mix · ${periodLabel}`}
              >
                {periodChannels.map((entry) => (
                  <span
                    key={entry.name}
                    className={`mcfly-alloc-v2__q-seg mcfly-channel__fill--${entry.fill}`}
                    style={{ flex: Math.max(0.02, entry.share) }}
                    title={`${entry.name} · ${pct(entry.share)}`}
                  />
                ))}
              </div>
              <div className="mcfly-book__rows mcfly-book__rows--kpis">
                {periodChannels.map((entry) => (
                  <div className="mcfly-book__row" key={entry.name}>
                    <p className="mcfly-book__row-sum">
                      <span className="mcfly-book__row-k">{entry.name}</span>
                      <span className="mcfly-book__row-v">
                        {formatCurrency(entry.amount, currency)}
                      </span>
                    </p>
                    <p className="mcfly-book__row-d">
                      {pct(entry.share)} of spend in {periodLabel}.
                    </p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="mcfly-book__lede">
              No channel mix in this period yet — coverage below shows which
              days have a row.
            </p>
          )}
          <NumberHonestyPanel
            sales={totalSales}
            spend={totalSpend}
            mer={mer}
            periodLabel={periodLabel}
            salesPending={salesPending}
          />
          <p className="mcfly-book__cta">
            <s-link href={roasHref}>{PRODUCT_NOUN.openTotalRoas}</s-link>
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
