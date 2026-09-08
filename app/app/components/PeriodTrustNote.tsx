import type { PeriodPreset } from "../lib/periods";
import type { PeriodTrust } from "../lib/period-trust";

export function PeriodTrustNote({
  trust,
  onSuggest,
}: {
  trust: PeriodTrust;
  onSuggest?: (preset: PeriodPreset) => void;
}) {
  if (trust.trusted || !trust.warning) return null;

  return (
    <s-banner tone="warning" heading="This period cannot be trusted yet">
      <s-paragraph>{trust.warning}</s-paragraph>
      {trust.suggestPreset && trust.suggestLabel ? (
        <div className="mcfly-decision__actions" style={{ marginTop: "0.65rem" }}>
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
          <s-button href="/app/spend" variant="secondary">
            Fill spend gaps
          </s-button>
        </div>
      ) : (
        <div className="mcfly-decision__actions" style={{ marginTop: "0.65rem" }}>
          <s-button href="/app/spend" variant="primary">
            Fill spend gaps
          </s-button>
        </div>
      )}
    </s-banner>
  );
}
