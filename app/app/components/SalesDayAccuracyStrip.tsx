import type { SalesDayAccuracySnapshot } from "../lib/sales-day-accuracy";

/**
 * Quiet day-accuracy honesty above Sales charts.
 * Missing / catching-up / partial history must be visible — never silent $0.
 */
export function SalesDayAccuracyStrip({
  accuracy,
}: {
  accuracy: SalesDayAccuracySnapshot;
}) {
  if (accuracy.status === "no_closed_days") return null;

  const tone =
    accuracy.status === "complete"
      ? "success"
      : accuracy.status === "catching_up"
        ? "warning"
        : "info";

  return (
    <div
      className={`mcfly-day-accuracy mcfly-day-accuracy--${accuracy.status}`}
      role="status"
      data-status={accuracy.status}
    >
      <s-banner tone={tone} heading={accuracy.headline}>
        <s-paragraph>{accuracy.detail}</s-paragraph>
      </s-banner>
    </div>
  );
}
