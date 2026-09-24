import { formatCurrency } from "../lib/mer-format";
import { useDeskCurrency } from "../lib/desk-currency";
import { buildOverviewMoneyFold } from "../lib/overview-money-fold";

/**
 * First thing on cold Overview: period Shopify Total Sales, then Total ROAS.
 * Sales render with or without spend. Empty spend is an em dash.
 * No ad-platform login or cost-of-goods step sits in front of the sales figure.
 */
export function OverviewMoneyFold({
  sales,
  salesPending,
  spend,
  useSampleDesk,
  periodLabel,
}: {
  sales: number | null;
  salesPending: boolean;
  spend: number | null;
  useSampleDesk: boolean;
  periodLabel: string;
}) {
  const currency = useDeskCurrency();
  const model = buildOverviewMoneyFold({
    sales,
    salesPending,
    spend,
    useSampleDesk,
  });
  const salesText =
    model.sales == null ? "—" : formatCurrency(model.sales, currency);

  return (
    <section
      className="mcfly-overview-money"
      aria-label="Shopify Total Sales"
      data-sample={model.sample ? "true" : undefined}
      data-desk-mode={model.sample ? "sample" : "live"}
      data-sales-ungated="true"
    >
      <div className="mcfly-overview-money__top">
        <p className="mcfly-overview-money__k">{model.label}</p>
        <span
          className={
            model.sample
              ? "mcfly-trust__chip mcfly-trust__chip--sample"
              : "mcfly-trust__chip"
          }
        >
          {model.modeLabel}
        </span>
      </div>
      <p className="mcfly-overview-money__period">{periodLabel}</p>
      <p className="mcfly-overview-money__v" data-overview-sales="true">
        {salesText}
      </p>
      <p
        className="mcfly-overview-money__roas"
        data-empty={model.roasText === "—" ? "true" : undefined}
      >
        Total ROAS {model.roasText}
      </p>
      <p className="mcfly-overview-money__sentence">{model.sentence}</p>
    </section>
  );
}
