import type { OrderHistoryAccuracySnapshot } from "../lib/order-history-accuracy";

/**
 * Quiet order-history honesty for Customers depth.
 * `when="problems"` hides the green complete state (keeps first paint calm).
 */
export function OrderHistoryAccuracyStrip({
  accuracy,
  when = "always",
}: {
  accuracy: OrderHistoryAccuracySnapshot;
  when?: "always" | "problems";
}) {
  if (accuracy.status === "no_closed_days") return null;
  if (when === "problems" && accuracy.status === "complete") return null;

  const tone =
    accuracy.status === "complete"
      ? "success"
      : accuracy.status === "catching_up"
        ? "warning"
        : "info";

  return (
    <div
      className={`mcfly-day-accuracy mcfly-order-history-accuracy mcfly-day-accuracy--${accuracy.status}`}
      role="status"
      data-status={accuracy.status}
    >
      <s-banner tone={tone} heading={accuracy.headline}>
        <s-paragraph>{accuracy.detail}</s-paragraph>
      </s-banner>
    </div>
  );
}
