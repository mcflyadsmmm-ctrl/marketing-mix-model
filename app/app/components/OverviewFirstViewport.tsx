import { formatCurrency } from "../lib/mer-format";
import { PRODUCT_NOUN } from "../lib/product-labels";
import {
  OVERVIEW_SPEND_EMPTY_LINE,
  overviewNoticeSentence,
} from "../lib/overview-first-viewport";

/** Whole percents in merchant chrome — 25%, never 25.0%. */
function pct(share: number): string {
  return `${Math.round(share * 100)}%`;
}

function GlanceStat({ title, value }: { title: string; value: string }) {
  return (
    <div className="mcfly-book__glance-item">
      <p className="mcfly-book__glance-k">{title}</p>
      <p className="mcfly-book__glance-v">{value}</p>
    </div>
  );
}

export function OverviewFirstViewport({
  orderCount,
  typicalOrder,
  meanAov,
  returningSalesShare,
  medianDaysToSecond,
  discountedOrderShare,
  salesPending,
  spendEmpty,
}: {
  orderCount: number;
  typicalOrder: number | null;
  meanAov: number | null;
  returningSalesShare: number | null;
  medianDaysToSecond: number | null;
  discountedOrderShare: number | null;
  salesPending: boolean;
  spendEmpty: boolean;
}) {
  const notice = overviewNoticeSentence({
    orderCount,
    returningSalesShare,
    discountedOrderShare,
    medianDaysToSecond,
    salesPending,
  });
  const typical =
    typicalOrder != null && Number.isFinite(typicalOrder)
      ? formatCurrency(typicalOrder)
      : meanAov != null && Number.isFinite(meanAov)
        ? formatCurrency(meanAov)
        : null;
  const returning =
    returningSalesShare != null && Number.isFinite(returningSalesShare)
      ? pct(returningSalesShare)
      : null;
  const second =
    medianDaysToSecond != null && Number.isFinite(medianDaysToSecond)
      ? `${Math.round(medianDaysToSecond)}d`
      : null;
  const glance = salesPending
    ? []
    : [
        { title: "Orders", value: orderCount.toLocaleString() },
        typical
          ? { title: PRODUCT_NOUN.bookTypicalOrder, value: typical }
          : null,
        returning
          ? { title: "Sales from returning customers", value: returning }
          : null,
        second ? { title: "Second order", value: second } : null,
      ].filter((item): item is { title: string; value: string } => item != null);

  return (
    <section className="mcfly-book" aria-label="This window at a glance">
      {glance.length > 0 ? (
        <div className="mcfly-book__glance">
          {glance.map((item) => (
            <GlanceStat key={item.title} title={item.title} value={item.value} />
          ))}
        </div>
      ) : null}
      <p className="mcfly-book__lede">
        {notice}
        {spendEmpty ? ` ${OVERVIEW_SPEND_EMPTY_LINE}` : ""}
      </p>
    </section>
  );
}
