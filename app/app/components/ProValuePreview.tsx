import { formatCurrency, formatMer } from "../lib/mer-format";
import { impliedSpendCeiling } from "../lib/implied-spend-ceiling";
import { PRODUCT_NOUN } from "../lib/product-labels";

type ProPaybackPreviewProps = {
  spend: number;
  newCustomers: number;
  periodLabel: string;
};

/**
 * Free LTV / Overview: one sentence using *their* spend and new buyers,
 * then a locked 90-day payback card. Upgrade CTA stays with ProUpsellBlock.
 */
export function ProPaybackPreview({
  spend,
  newCustomers,
  periodLabel,
}: ProPaybackPreviewProps) {
  const hasInputs = spend > 0 && newCustomers > 0;
  const cashCac = hasInputs ? spend / newCustomers : null;

  return (
    <div className="mcfly-pro-preview">
      {hasInputs && cashCac != null ? (
        <p className="mcfly-pro-preview__sentence">
          You added {formatCurrency(spend)} spend in {periodLabel}. Shopify
          shows {newCustomers.toLocaleString()} first-time customers.{" "}
          <strong>
            Cash CAC = {formatCurrency(spend)} ÷ {newCustomers.toLocaleString()}{" "}
            = {formatCurrency(cashCac)}
          </strong>
          . That includes every channel you logged — on purpose, including
          billboards.
        </p>
      ) : (
        <p className="mcfly-pro-preview__sentence">
          Add spend and wait for Shopify new-customer counts. Pro then follows
          those people for 30 / 90 / 365 days and answers: did they pay that
          spend back?
        </p>
      )}
      <div className="mcfly-pro-preview__ghost">
        <p className="mcfly-pro-preview__ghost-k">On Pro, for those customers</p>
        <ul className="mcfly-pro-preview__ghost-tiles">
          <li>
            <span>LTV · 90d</span>
            <strong>
              Did they spend{" "}
              {cashCac != null ? formatCurrency(cashCac) : "Cash CAC"} back?
            </strong>
          </li>
          <li>
            <span>Payback</span>
            <strong>About how many days until spend is recovered</strong>
          </li>
          <li>
            <span>LTV : CAC</span>
            <strong>Average, not which ad caused the sale</strong>
          </li>
        </ul>
        <p className="mcfly-pro-preview__ghost-foot">
          {PRODUCT_NOUN.ltvNotInShopify}
        </p>
      </div>
    </div>
  );
}

type GoalsYearTeaserProps = {
  targetMer: number;
};

export function GoalsYearTeaser({ targetMer }: GoalsYearTeaserProps) {
  const exampleGoal = 80_000;
  const ceiling = impliedSpendCeiling(exampleGoal, targetMer);
  const merLabel = formatMer(targetMer);

  return (
    <div className="mcfly-pro-preview">
      <p className="mcfly-pro-preview__sentence">
        Type the sales you want this year. We’ll tell you the most you can spend
        each month and still hit your {merLabel}× {PRODUCT_NOUN.totalRoas}{" "}
        target.
      </p>
      {ceiling != null ? (
        <p className="mcfly-pro-preview__example">
          Example: October goal {formatCurrency(exampleGoal)} at {merLabel}× →
          spend at most <strong>{formatCurrency(ceiling)}</strong> that month.
        </p>
      ) : null}
    </div>
  );
}
