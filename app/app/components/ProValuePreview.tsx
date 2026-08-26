import { formatCurrency, formatMer } from "../lib/mer-format";
import { impliedSpendCeiling } from "../lib/implied-spend-ceiling";
import { PRODUCT_NOUN } from "../lib/product-labels";

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
