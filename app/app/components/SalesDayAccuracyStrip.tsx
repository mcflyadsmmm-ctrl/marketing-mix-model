import type { SalesDayAccuracySnapshot } from "../lib/sales-day-accuracy";

/**
 * Quiet day-accuracy honesty.
 * Missing / catching-up / partial history must be visible — never silent $0.
 * `when="problems"` hides the green complete state (Overview first paint).
 */
export function SalesDayAccuracyStrip({
  accuracy,
  when = "always",
}: {
  accuracy: SalesDayAccuracySnapshot;
  when?: "always" | "problems";
}) {
  if (accuracy.status === "no_closed_days") return null;
  const hasMismatch = accuracy.reconcileStatus === "mismatch";
  if (
    when === "problems" &&
    accuracy.status === "complete" &&
    !hasMismatch
  ) {
    return null;
  }

  const tone =
    hasMismatch || accuracy.status === "catching_up"
      ? "warning"
      : accuracy.status === "complete"
        ? "success"
        : "info";

  return (
    <div
      className={`mcfly-day-accuracy mcfly-day-accuracy--${accuracy.status}`}
      role="status"
      data-status={hasMismatch ? "mismatch" : accuracy.status}
    >
      <s-banner tone={tone} heading={accuracy.headline}>
        <s-paragraph>{accuracy.detail}</s-paragraph>
      </s-banner>
    </div>
  );
}
