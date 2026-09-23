import { CopySpendPair } from "./MorningHabitStrip";
import { spendFirstFoldSalesHint } from "../lib/cash-trust-copy";
import { useDeskCurrency } from "../lib/desk-currency";
import { formatCurrency } from "../lib/mer-format";
import { formatSpendOnFile } from "../lib/spend-on-file";
import { PRODUCT_NOUN } from "../lib/product-labels";
import { HONEST_MER_LINE } from "../lib/spend-upload-findings";
import {
  SPEND_ANALYTICS_SR_LINE,
  SPEND_THIN_EMPTY_LINE,
} from "../lib/spend-first-viewport";

/**
 * Spend first fold — one Total ROAS hero, sales · spend meta, no essay ledes.
 */
export function SpendFirstViewport({
  roasValue,
  hasSpend,
  sales,
  totalSpend,
  salesPending,
  periodLabel,
  todaySalesTruncated,
  todaySalesUnavailable,
  pairEquation,
  pairCopyText,
  shotMode = false,
}: {
  roasValue: string;
  hasSpend: boolean;
  sales: number;
  totalSpend: number;
  salesPending: boolean;
  periodLabel: string;
  todaySalesTruncated: boolean;
  todaySalesUnavailable: boolean;
  pairEquation: string | null;
  pairCopyText: string | null;
  shotMode?: boolean;
}) {
  const currency = useDeskCurrency();
  const salesDisplay = salesPending ? "—" : formatCurrency(sales, currency);
  const spendDisplay = formatSpendOnFile(totalSpend, currency);
  const metaHint = spendFirstFoldSalesHint({
    salesPending,
    periodLabel,
    todaySalesTruncated,
    todaySalesUnavailable,
  });

  return (
    <section
      id="mcfly-roas"
      className="mcfly-overview-plane mcfly-spend-plane"
      aria-label="Total ROAS"
    >
      <div className="mcfly-overview-plane__hero mcfly-overview-plane__hero--even">
        <div className="mcfly-overview-plane__hero-top">
          <p className="mcfly-overview-plane__period">{periodLabel}</p>
          <p className="mcfly-overview-plane__delta mcfly-overview-plane__delta--empty">
            Sales {salesDisplay}
            <span aria-hidden="true"> · </span>
            Spend{" "}
            <span data-empty={spendDisplay === "—" ? "true" : undefined}>
              {spendDisplay}
            </span>
          </p>
        </div>
        <p
          className="mcfly-overview-plane__value"
          data-empty={roasValue === "—" ? "true" : undefined}
        >
          {roasValue}
        </p>
        <p className="mcfly-overview-plane__meta">
          <span className="mcfly-overview-plane__prior">{PRODUCT_NOUN.totalRoas}</span>
          <span aria-hidden="true"> · </span>
          <span className="mcfly-overview-plane__source">
            {hasSpend ? "Entered spend on file" : HONEST_MER_LINE}
          </span>
        </p>
        <span className="mcfly-overview-plane__sr">{SPEND_ANALYTICS_SR_LINE}</span>
      </div>

      {hasSpend && pairEquation && pairCopyText ? (
        <div className="mcfly-spend-pair-copy-row">
          <p className="mcfly-overview-plane__note">{pairEquation}</p>
          <CopySpendPair text={pairCopyText} />
        </div>
      ) : !hasSpend ? (
        <p className="mcfly-overview-plane__note">{SPEND_THIN_EMPTY_LINE}</p>
      ) : null}

      <p className="mcfly-overview-plane__note">{metaHint}</p>

      {!hasSpend && !shotMode ? (
        <p className="mcfly-spend-plane__cta">
          <s-link href="#mcfly-spend-add">{PRODUCT_NOUN.uploadSpend}</s-link>
        </p>
      ) : null}
    </section>
  );
}
