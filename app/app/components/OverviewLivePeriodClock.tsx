import { formatCurrency } from "../lib/mer-format";
import { useDeskCurrency } from "../lib/desk-currency";
import { overviewChartDayLabel } from "../lib/overview-sales-chart";
import type { OverviewShopifyPeriodClock } from "../lib/overview-live-period-clock";

function paintAmount(
  amount: number | null,
  money: (value: number) => string,
): string {
  if (amount == null || !Number.isFinite(amount)) return "—";
  return money(amount);
}

/**
 * Live Overview clock that claims Shopify alignment.
 * Dollars come from SalesDayFact / ShopifyQL. Order peeks stay on the
 * From orders hero and are not rendered here.
 */
export function OverviewLivePeriodClock({
  clock,
  periodLabel,
}: {
  clock: OverviewShopifyPeriodClock;
  periodLabel: string;
}) {
  const currency = useDeskCurrency();
  const money = (value: number) => formatCurrency(value, currency);
  const periodValue = paintAmount(clock.periodSales, money);
  const priorValue = paintAmount(clock.priorDaySales, money);
  const priorWhen =
    clock.priorDayKey != null
      ? overviewChartDayLabel(clock.priorDayKey)
      : "prior day";

  return (
    <section
      className="mcfly-overview-clock"
      aria-label={clock.label}
      data-overview-clock="shopify-total-sales"
    >
      <p className="mcfly-overview-clock__k">{clock.label}</p>
      <p className="mcfly-overview-clock__v" data-overview-clock-period="true">
        {periodValue}
      </p>
      <p className="mcfly-overview-clock__meta">
        <span>{periodLabel}</span>
        {clock.periodNote ? (
          <span data-overview-clock-period-note="true">{clock.periodNote}</span>
        ) : null}
      </p>
      <p className="mcfly-overview-clock__prior" data-overview-clock-prior="true">
        <span>Closed {priorWhen}</span>
        <span>{priorValue}</span>
        {clock.priorDayNote ? (
          <span data-overview-clock-prior-note="true">{clock.priorDayNote}</span>
        ) : null}
      </p>
    </section>
  );
}
