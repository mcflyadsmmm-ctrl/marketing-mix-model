import type { ExpectedLtvEstimate } from "../lib/expected-ltv";

/**
 * Secondary line under the first-order triangle on the Customers LTV chip.
 * The triangle stays the realized hero. This card is the estimate, and the
 * formula is text — not a tooltip-only secret and not a black box.
 */
export function LtvExpectedEstimate({
  estimate,
  useSampleDesk = false,
}: {
  estimate: ExpectedLtvEstimate;
  useSampleDesk?: boolean;
}) {
  const showInputs = useSampleDesk || estimate.expected != null;
  return (
    <details
      className="mcfly-ltv-estimate"
      open={showInputs}
      data-p1d="predictive-ltv"
    >
      <summary className="mcfly-ltv-estimate__summary">
        <span className="mcfly-ltv-estimate__formula">{estimate.formula}</span>
        {estimate.expected == null ? (
          <span className="mcfly-ltv-estimate__value">
            {estimate.display} Not $0.
          </span>
        ) : null}
      </summary>
      <p className="mcfly-ltv-estimate__inputs">{estimate.inputs}</p>
    </details>
  );
}
