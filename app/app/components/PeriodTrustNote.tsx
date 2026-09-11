import type { PeriodPreset } from "../lib/periods";
import type { PeriodTrust } from "../lib/period-trust";
import { PRODUCT_NOUN } from "../lib/product-labels";
import { SPEND_BILL_ANCHOR } from "../lib/spend-first-run";

const BILL_HREF = `/app/spend#${SPEND_BILL_ANCHOR}`;

/**
 * Period honesty for CEOs — one warning, one primary action.
 * Spend holes → bill spread. Wide/unfilled window → shorter period.
 */
export function PeriodTrustNote({
  trust,
  onSuggest,
}: {
  trust: PeriodTrust;
  onSuggest?: (preset: PeriodPreset) => void;
}) {
  if (trust.trusted || !trust.warning) return null;

  const spendIsTheFix =
    trust.kind === "no_spend" || trust.kind === "spend_gaps";
  const hasSuggest = Boolean(trust.suggestPreset && trust.suggestLabel);

  return (
    <s-banner tone="warning" heading="This period cannot be trusted yet">
      <s-paragraph>{trust.warning}</s-paragraph>
      <div className="mcfly-decision__actions" style={{ marginTop: "0.65rem" }}>
        {spendIsTheFix ? (
          <>
            <s-button href={BILL_HREF} variant="primary">
              {PRODUCT_NOUN.setupSpreadBill}
            </s-button>
            {hasSuggest ? (
              onSuggest ? (
                <s-button
                  variant="secondary"
                  onClick={() => onSuggest(trust.suggestPreset!)}
                >
                  {trust.suggestLabel}
                </s-button>
              ) : (
                <s-button
                  href={`/app?period=${trust.suggestPreset}`}
                  variant="secondary"
                >
                  {trust.suggestLabel}
                </s-button>
              )
            ) : null}
          </>
        ) : hasSuggest ? (
          <>
            {onSuggest ? (
              <s-button
                variant="primary"
                onClick={() => onSuggest(trust.suggestPreset!)}
              >
                {trust.suggestLabel}
              </s-button>
            ) : (
              <s-button
                href={`/app?period=${trust.suggestPreset}`}
                variant="primary"
              >
                {trust.suggestLabel}
              </s-button>
            )}
            {trust.kind === "sales_incomplete" ? null : (
              <s-button href={BILL_HREF} variant="secondary">
                {PRODUCT_NOUN.setupSpreadBill}
              </s-button>
            )}
          </>
        ) : (
          <s-button href={BILL_HREF} variant="primary">
            {PRODUCT_NOUN.setupSpreadBill}
          </s-button>
        )}
      </div>
    </s-banner>
  );
}
